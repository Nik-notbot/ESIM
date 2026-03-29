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

$FANITEL_API_KEY = 'd6230379e0d981548044254461b54be666d478709d9a0d36e14b6a5087fb503c';
$FANITEL_URL     = 'https://gw.globalstatic-node.com';
$FANITEL_PHONE   = '+1519629310';
$FANITEL_RID     = '89451';

$aesKey = hash_hkdf('sha256', $FANITEL_API_KEY, 32, 'aes-key', 'fanytel-api-v1');

function fanitelEncrypt($data) {
    global $aesKey;
    $nonce = random_bytes(12);
    $json  = json_encode($data);
    $tag   = '';
    $ct    = openssl_encrypt($json, 'aes-256-gcm', $aesKey, OPENSSL_RAW_DATA, $nonce, $tag, '', 16);
    if ($ct === false) return null;
    return rtrim(strtr(base64_encode($nonce . $ct . $tag), '+/', '-_'), '=');
}

function fanitelDecrypt($b64) {
    global $aesKey;
    if (!$b64 || !is_string($b64)) return null;
    $b64 = strtr($b64, '-_', '+/');
    $pad = strlen($b64) % 4;
    if ($pad) $b64 .= str_repeat('=', 4 - $pad);
    $raw = base64_decode($b64, true);
    if ($raw === false || strlen($raw) < 28) return null;
    $nonce = substr($raw, 0, 12);
    $tag   = substr($raw, -16);
    $ct    = substr($raw, 12, -16);
    $plain = openssl_decrypt($ct, 'aes-256-gcm', $aesKey, OPENSSL_RAW_DATA, $nonce, $tag);
    if ($plain === false) return null;
    return json_decode($plain, true);
}

function fanitelCall($endpoint, $extra = []) {
    global $FANITEL_URL, $FANITEL_API_KEY, $FANITEL_PHONE, $FANITEL_RID;
    $payload = array_merge(['phone' => $FANITEL_PHONE, 'rid' => $FANITEL_RID], $extra);
    $body = fanitelEncrypt($payload);
    if ($body === null) {
        return ['_error' => true, '_code' => 0, '_detail' => 'Encryption failed'];
    }

    $ch = curl_init($FANITEL_URL . $endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_USERAGENT      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        CURLOPT_HTTPHEADER     => [
            'X-API-Key: ' . $FANITEL_API_KEY,
            'Content-Type: application/octet-stream',
        ],
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($resp === false) {
        return ['_error' => true, '_code' => 0, '_detail' => 'cURL error: ' . $curlErr];
    }
    if ($code !== 200) {
        return ['_error' => true, '_code' => $code, '_detail' => 'HTTP ' . $code . ', body: ' . substr($resp, 0, 500)];
    }

    $decoded = fanitelDecrypt($resp);
    if ($decoded === null) {
        return ['_error' => true, '_code' => $code, '_detail' => 'Decryption failed, raw len=' . strlen($resp)];
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
$fanitelId = isset($input['fanitelId']) ? trim($input['fanitelId']) : '';
$tariff    = isset($input['tariff'])    ? intval($input['tariff'])  : 0;
$rowId     = isset($input['rowId'])     ? intval($input['rowId'])   : 0;

if (!$fanitelId || !$tariff || !$rowId) {
    http_response_code(400);
    echo json_encode(['error' => 'Не указаны обязательные параметры', 'got' => $input]);
    exit;
}

// 1. Save Fanitel ID to Baserow
baserowPatch($rowId, ['Fanitel ID' => $fanitelId]);

// 2. Verify recipient exists
$exists = fanitelCall('/account/id-exists', ['target' => $fanitelId]);
if (isset($exists['_error'])) {
    fail(400, 'id-exists', $exists['_detail'] ?? 'unknown');
}
if (!isset($exists['exists']) || !$exists['exists']) {
    fail(400, 'id-exists', 'Fanitel ID не найден. Убедитесь, что вы правильно ввели ID из приложения.', ['api_response' => $exists]);
}

// 3. Get fresh GB number
$fresh = fanitelCall('/numbers/fresh', ['countries' => ['GB'], 'limit' => 1]);
if (isset($fresh['_error'])) {
    fail(503, 'numbers/fresh', $fresh['_detail'] ?? 'unknown');
}
if (!isset($fresh['numbers']) || empty($fresh['numbers'])) {
    fail(503, 'numbers/fresh', 'Нет доступных номеров.', ['api_response' => $fresh]);
}
$number = $fresh['numbers'][0]['number'];

// 4. Buy number (tariff 1 = monthly, tariff 2 = yearly)
$yearly = ($tariff === 2);
$buy = fanitelCall('/numbers/buy', ['number' => $number, 'country' => 'GB', 'yearly' => $yearly]);
if (isset($buy['_error'])) {
    fail(502, 'numbers/buy', $buy['_detail'] ?? 'unknown', ['number' => $number, 'yearly' => $yearly]);
}

// 5. Transfer to client
$transfer = fanitelCall('/numbers/transfer', ['number' => $number, 'to_user' => $fanitelId]);
if (isset($transfer['_error'])) {
    baserowPatch($rowId, ['number' => $number, 'Ссылка' => 'TRANSFER_FAILED']);
    fail(502, 'numbers/transfer', $transfer['_detail'] ?? 'unknown', ['number' => $number]);
}

// 6. Save purchased number to Baserow
baserowPatch($rowId, ['number' => $number]);

echo json_encode(['ok' => true, 'number' => $number, 'yearly' => $yearly]);
