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
    $tag = '';
    $ct = openssl_encrypt(json_encode($data), 'aes-256-gcm', $aesKey, OPENSSL_RAW_DATA, $nonce, $tag, '', 16);
    return rtrim(strtr(base64_encode($nonce . $ct . $tag), '+/', '-_'), '=');
}

function fanitelDecrypt($b64) {
    global $aesKey;
    $b64 = strtr($b64, '-_', '+/');
    $pad = strlen($b64) % 4;
    if ($pad) $b64 .= str_repeat('=', 4 - $pad);
    $raw = base64_decode($b64);
    $nonce = substr($raw, 0, 12);
    $tag   = substr($raw, -16);
    $ct    = substr($raw, 12, -16);
    return json_decode(openssl_decrypt($ct, 'aes-256-gcm', $aesKey, OPENSSL_RAW_DATA, $nonce, $tag), true);
}

function fanitelCall($endpoint, $extra = []) {
    global $FANITEL_URL, $FANITEL_API_KEY, $FANITEL_PHONE, $FANITEL_RID;
    $payload = array_merge(['phone' => $FANITEL_PHONE, 'rid' => $FANITEL_RID], $extra);
    $ch = curl_init($FANITEL_URL . $endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => fanitelEncrypt($payload),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_HTTPHEADER     => [
            'X-API-Key: ' . $FANITEL_API_KEY,
            'Content-Type: application/octet-stream',
        ],
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code !== 200) return ['_error' => true, '_code' => $code];
    return fanitelDecrypt($resp);
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

$input     = json_decode(file_get_contents('php://input'), true);
$fanitelId = isset($input['fanitelId']) ? trim($input['fanitelId']) : '';
$tariff    = isset($input['tariff'])    ? intval($input['tariff'])  : 0;
$rowId     = isset($input['rowId'])     ? intval($input['rowId'])   : 0;

if (!$fanitelId || !$tariff || !$rowId) {
    http_response_code(400);
    echo json_encode(['error' => 'Не указаны обязательные параметры']);
    exit;
}

// 1. Save Fanitel ID to Baserow
baserowPatch($rowId, ['Fanitel ID' => $fanitelId]);

// 2. Verify recipient exists
$exists = fanitelCall('/account/id-exists', ['target' => $fanitelId]);
if (isset($exists['_error']) || !isset($exists['exists']) || !$exists['exists']) {
    http_response_code(400);
    echo json_encode(['error' => 'Fanitel ID не найден. Убедитесь, что вы правильно ввели ID из приложения.']);
    exit;
}

// 3. Get fresh GB number
$fresh = fanitelCall('/numbers/fresh', ['countries' => ['GB'], 'limit' => 1]);
if (isset($fresh['_error']) || !isset($fresh['numbers']) || empty($fresh['numbers'])) {
    http_response_code(503);
    echo json_encode(['error' => 'Нет доступных номеров. Попробуйте через несколько минут.']);
    exit;
}
$number = $fresh['numbers'][0]['number'];

// 4. Buy number (tariff 1 = monthly, tariff 2 = yearly)
$yearly = ($tariff === 2);
$buy = fanitelCall('/numbers/buy', ['number' => $number, 'country' => 'GB', 'yearly' => $yearly]);
if (isset($buy['_error'])) {
    http_response_code(502);
    echo json_encode(['error' => 'Ошибка при покупке номера. Попробуйте позже.']);
    exit;
}

// 5. Transfer to client
$transfer = fanitelCall('/numbers/transfer', ['number' => $number, 'to_user' => $fanitelId]);
if (isset($transfer['_error'])) {
    baserowPatch($rowId, ['number' => $number, 'Ссылка' => 'TRANSFER_FAILED']);
    http_response_code(502);
    echo json_encode(['error' => 'Номер куплен, но не удалось передать. Обратитесь в поддержку @hey_store_bot', 'number' => $number]);
    exit;
}

// 6. Save purchased number to Baserow
baserowPatch($rowId, ['number' => $number]);

echo json_encode(['ok' => true, 'number' => $number, 'yearly' => $yearly]);
