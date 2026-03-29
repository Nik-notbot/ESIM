<?php
header('Content-Type: application/json; charset=utf-8');

$FANITEL_API_KEY = 'd6230379e0d981548044254461b54be666d478709d9a0d36e14b6a5087fb503c';
$FANITEL_URL     = 'https://gw.globalstatic-node.com';
$FANITEL_PHONE   = '+1519629310';
$FANITEL_RID     = '89451';

$aesKey = hash_hkdf('sha256', $FANITEL_API_KEY, 32, 'aes-key', 'fanytel-api-v1');

$result = [
    'php_version'    => PHP_VERSION,
    'openssl'        => OPENSSL_VERSION_TEXT ?? 'unknown',
    'aes_key_hex'    => bin2hex($aesKey),
    'expected_key'   => '153944784eb88e38ff2ec2f7b7460dc04adc68f0abf2598d8da7c152ad2c865a',
    'keys_match'     => bin2hex($aesKey) === '153944784eb88e38ff2ec2f7b7460dc04adc68f0abf2598d8da7c152ad2c865a',
];

$payload = ['phone' => $FANITEL_PHONE, 'rid' => $FANITEL_RID];
$nonce = random_bytes(12);
$tag = '';
$json = json_encode($payload);
$ct = openssl_encrypt($json, 'aes-256-gcm', $aesKey, OPENSSL_RAW_DATA, $nonce, $tag, '', 16);
$result['encrypt_ok'] = ($ct !== false);

$body = rtrim(strtr(base64_encode($nonce . $ct . $tag), '+/', '-_'), '=');
$result['body_length'] = strlen($body);

$ch = curl_init($FANITEL_URL . '/account/balance');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $body,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_USERAGENT      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    CURLOPT_HTTPHEADER     => [
        'X-API-Key: ' . $FANITEL_API_KEY,
        'Content-Type: application/octet-stream',
    ],
]);
$resp = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

$result['api_http_code'] = $httpCode;
$result['api_curl_error'] = $curlErr ?: null;
$result['api_raw_response_len'] = $resp !== false ? strlen($resp) : 0;
$result['api_raw_response_preview'] = $resp !== false ? substr($resp, 0, 200) : null;

if ($httpCode === 200 && $resp) {
    $b64 = strtr($resp, '-_', '+/');
    $pad = strlen($b64) % 4;
    if ($pad) $b64 .= str_repeat('=', 4 - $pad);
    $raw = base64_decode($b64, true);
    if ($raw && strlen($raw) >= 28) {
        $n = substr($raw, 0, 12);
        $t = substr($raw, -16);
        $c = substr($raw, 12, -16);
        $plain = openssl_decrypt($c, 'aes-256-gcm', $aesKey, OPENSSL_RAW_DATA, $n, $t);
        $result['decrypt_ok'] = ($plain !== false);
        $result['api_decrypted'] = $plain !== false ? json_decode($plain, true) : null;
    } else {
        $result['decrypt_ok'] = false;
        $result['decode_error'] = 'base64 decode failed or too short';
    }
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
