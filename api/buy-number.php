<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$BASEROW_TOKEN = 'GwcQy04FUx7ny7p4x4tcuJqnJZKN2iTq';
$BASEROW_API   = 'https://api.baserow.io';
$REG_TABLE_ID  = 857563;

$FANYTEL_API_KEY = 'd6230379e0d981548044254461b54be666d478709d9a0d36e14b6a5087fb503c';
$FANYTEL_URL     = 'https://gw.globalstatic-node.com';

function deriveKey(string $apiKey): string {
    $prk = hash_hmac('sha256', $apiKey, 'fanytel-api-v1', true);
    $t = '';
    $okm = '';
    for ($i = 1; strlen($okm) < 32; $i++) {
        $t = hash_hmac('sha256', $t . 'aes-key' . chr($i), $prk, true);
        $okm .= $t;
    }
    return substr($okm, 0, 32);
}

$AES_KEY = deriveKey($FANYTEL_API_KEY);

function encrypt(array $data): string {
    global $AES_KEY;
    $plaintext = json_encode($data, JSON_UNESCAPED_UNICODE);
    $nonce = random_bytes(12);
    $tag = '';
    $ct = openssl_encrypt($plaintext, 'aes-256-gcm', $AES_KEY, OPENSSL_RAW_DATA, $nonce, $tag, '', 16);
    $raw = $nonce . $ct . $tag;
    return strtr(base64_encode($raw), '+/', '-_');
}

function decrypt(string $b64): ?array {
    global $AES_KEY;
    if (!$b64 || !is_string($b64)) return null;
    $raw = base64_decode(strtr($b64, '-_', '+/'));
    if ($raw === false || strlen($raw) < 28) return null;
    $nonce = substr($raw, 0, 12);
    $tag = substr($raw, -16);
    $ct = substr($raw, 12, -16);
    $pt = openssl_decrypt($ct, 'aes-256-gcm', $AES_KEY, OPENSSL_RAW_DATA, $nonce, $tag);
    if ($pt === false) return null;
    return json_decode($pt, true);
}

function fanytelCall(string $endpoint, array $payload = []) {
    global $FANYTEL_URL, $FANYTEL_API_KEY;
    $body = encrypt($payload);

    $ch = curl_init($FANYTEL_URL . $endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => [
            'X-API-Key: ' . $FANYTEL_API_KEY,
            'Content-Type: application/octet-stream',
            'User-Agent: FanytelClient/1.0',
        ],
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        return ['_error' => true, '_code' => 0, '_detail' => 'cURL error: ' . $curlErr];
    }
    if ($httpCode === 444) {
        return ['_error' => true, '_code' => 444, '_detail' => 'API 444 — неверный ключ, шифрование или User-Agent'];
    }
    if ($httpCode === 503) {
        return ['_error' => true, '_code' => 503, '_detail' => 'Нет доступных номеров или аккаунтов'];
    }
    if ($httpCode !== 200) {
        return ['_error' => true, '_code' => $httpCode, '_detail' => 'HTTP ' . $httpCode . ', body: ' . substr($response ?: '', 0, 500)];
    }

    $decoded = decrypt($response);
    if ($decoded === null) {
        return ['_error' => true, '_code' => $httpCode, '_detail' => 'Decryption failed, raw len=' . strlen($response)];
    }
    return $decoded;
}

function baserowPatch($rowId, $fields) {
    global $BASEROW_TOKEN, $BASEROW_API, $REG_TABLE_ID;
    $url = $BASEROW_API . '/api/database/rows/table/' . $REG_TABLE_ID . '/' . $rowId . '/?user_field_names=true';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => 'PATCH',
        CURLOPT_POSTFIELDS     => json_encode($fields),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Token ' . $BASEROW_TOKEN,
            'Content-Type: application/json',
        ],
    ]);
    curl_exec($ch);
    curl_close($ch);
}

function fail($httpCode, $step, $detail, $extra = []) {
    http_response_code($httpCode);
    echo json_encode(array_merge([
        'error'  => "Ошибка на шаге: $step",
        'step'   => $step,
        'detail' => $detail,
    ], $extra));
    exit;
}

$input     = json_decode(file_get_contents('php://input'), true);
$fanytelId = isset($input['fanitelId']) ? trim($input['fanitelId']) : '';
$tariff    = isset($input['tariff'])    ? intval($input['tariff'])  : 0;
$rowId     = isset($input['rowId'])     ? intval($input['rowId'])   : 0;

if (!$fanytelId || !$tariff || !$rowId) {
    http_response_code(400);
    echo json_encode(['error' => 'Не указаны обязательные параметры', 'got' => $input]);
    exit;
}

// 1. Save Fanytel ID to Baserow
baserowPatch($rowId, ['Fanytel ID' => $fanytelId]);

// 2. Verify recipient exists
$exists = fanytelCall('/account/id-exists', ['target' => $fanytelId]);
if (isset($exists['_error'])) {
    fail(400, 'id-exists', $exists['_detail'] ?? 'unknown');
}
if (!isset($exists['exists']) || !$exists['exists']) {
    fail(400, 'id-exists', 'Fanytel ID не найден. Убедитесь, что вы правильно ввели ID из приложения.', ['api_response' => $exists]);
}

// 3. Get fresh GB number
$fresh = fanytelCall('/numbers/fresh', ['countries' => ['GB'], 'limit' => 1]);
if (isset($fresh['_error'])) {
    fail(503, 'numbers/fresh', $fresh['_detail'] ?? 'unknown');
}
if (!isset($fresh['numbers']) || empty($fresh['numbers'])) {
    fail(503, 'numbers/fresh', 'Нет доступных номеров.', ['api_response' => $fresh]);
}
$requestedNumber = $fresh['numbers'][0]['number'];

// 4. Buy number (tariff 1 = monthly, tariff 2 = yearly)
$yearly = ($tariff === 2);
$buy = fanytelCall('/numbers/buy', ['number' => $requestedNumber, 'country' => 'GB', 'yearly' => $yearly]);
if (isset($buy['_error'])) {
    fail(502, 'numbers/buy', $buy['_detail'] ?? 'unknown', ['number' => $requestedNumber, 'yearly' => $yearly]);
}
$boughtNumber = isset($buy['number']) ? $buy['number'] : $requestedNumber;

// 5. Transfer to client
$transfer = fanytelCall('/numbers/transfer', ['number' => $boughtNumber, 'to_user' => $fanytelId]);
if (isset($transfer['_error'])) {
    baserowPatch($rowId, ['number' => $boughtNumber, 'Ссылка' => 'TRANSFER_FAILED']);
    fail(502, 'numbers/transfer', $transfer['_detail'] ?? 'unknown', ['number' => $boughtNumber]);
}

// 6. Save purchased number to Baserow
baserowPatch($rowId, ['number' => $boughtNumber]);

echo json_encode(['ok' => true, 'number' => $boughtNumber, 'yearly' => $yearly]);
