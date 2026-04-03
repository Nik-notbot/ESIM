<?php
header('Content-Type: application/json; charset=utf-8');

const API_URL = 'https://gw.globalstatic-node.com';
const API_KEY = 'd6230379e0d981548044254461b54be666d478709d9a0d36e14b6a5087fb503c';

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

$AES_KEY = deriveKey(API_KEY);

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

function apiCall(string $endpoint, array $payload = []): array {
    $body = encrypt($payload);

    $ch = curl_init(API_URL . $endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => [
            'X-API-Key: ' . API_KEY,
            'Content-Type: application/octet-stream',
            'User-Agent: Mozilla/5.0',
        ],
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    return [
        'http_code' => $httpCode,
        'curl_error' => $curlErr ?: null,
        'decrypted' => ($httpCode === 200 && $response) ? decrypt($response) : null,
        'raw_preview' => $response !== false ? substr($response, 0, 200) : '',
    ];
}

echo json_encode([
    'php_version' => PHP_VERSION,
    'aes_key_hex' => bin2hex($AES_KEY),
    'health'      => apiCall('/account/health'),
    'balance'     => apiCall('/account/balance'),
    'fresh_gb'    => apiCall('/numbers/fresh', ['countries' => ['GB'], 'limit' => 2]),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
