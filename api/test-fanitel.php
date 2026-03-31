<?php
header('Content-Type: application/json; charset=utf-8');

$API_KEY = 'd6230379e0d981548044254461b54be666d478709d9a0d36e14b6a5087fb503c';
$API_URL = 'https://gw.globalstatic-node.com';
$PHONE   = '+1519629310';
$RID     = '89451';

function deriveKey($apiKey) {
    $prk = hash_hmac('sha256', $apiKey, 'fanytel-api-v1', true);
    $t = '';
    $okm = '';
    for ($i = 1; strlen($okm) < 32; $i++) {
        $t = hash_hmac('sha256', $t . 'aes-key' . chr($i), $prk, true);
        $okm .= $t;
    }
    return substr($okm, 0, 32);
}

$AES_KEY = deriveKey($API_KEY);

$result = [
    'php_version'  => PHP_VERSION,
    'openssl'      => OPENSSL_VERSION_TEXT ?? 'unknown',
    'aes_key_hex'  => bin2hex($AES_KEY),
    'expected_key' => '153944784eb88e38ff2ec2f7b7460dc04adc68f0abf2598d8da7c152ad2c865a',
    'keys_match'   => bin2hex($AES_KEY) === '153944784eb88e38ff2ec2f7b7460dc04adc68f0abf2598d8da7c152ad2c865a',
];

$payload = ['phone' => $PHONE, 'rid' => $RID];
$json = json_encode($payload, JSON_UNESCAPED_UNICODE);
$nonce = random_bytes(12);
$tag = '';
$ct = openssl_encrypt($json, 'aes-256-gcm', $AES_KEY, OPENSSL_RAW_DATA, $nonce, $tag, '', 16);
$result['encrypt_ok'] = ($ct !== false);

$body = rtrim(strtr(base64_encode($nonce . $ct . $tag), '+/', '-_'), '=');

$ch = curl_init($API_URL . '/account/balance');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $body,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_HTTPHEADER     => [
        'X-API-Key: ' . $API_KEY,
        'Content-Type: application/octet-stream',
        'User-Agent: FanytelClient/1.0',
    ],
]);
$resp = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

$result['api_http_code'] = $httpCode;
$result['api_curl_error'] = $curlErr ?: null;

if ($httpCode === 200 && $resp) {
    $raw = base64_decode(strtr($resp, '-_', '+/'));
    if ($raw && strlen($raw) >= 28) {
        $n = substr($raw, 0, 12);
        $t = substr($raw, -16);
        $c = substr($raw, 12, -16);
        $plain = openssl_decrypt($c, 'aes-256-gcm', $AES_KEY, OPENSSL_RAW_DATA, $n, $t);
        $result['decrypt_ok'] = ($plain !== false);
        $result['api_response'] = $plain !== false ? json_decode($plain, true) : null;
    }
} else {
    $result['api_raw'] = substr($resp ?: '', 0, 200);
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
