<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$WATA_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJQdWJsaWNJZCI6IjNhMWJmOTYxLThjYmMtYmIwZC1iMmRjLTNmMTQ1YjVmYjdlOCIsIlRva2VuVmVyc2lvbiI6IjEiLCJleHAiOjE4MDMzODU4MDAsImlzcyI6Imh0dHBzOi8vYXBpLndhdGEucHJvIiwiYXVkIjoiaHR0cHM6Ly9hcGkud2F0YS5wcm8vYXBpL2gyaCJ9.roYwJNl6WZeVKUWjxePfpHGpC1oSAkjH6z1pN4weKsM';
$WATA_API = 'https://api.wata.pro/api/h2h/links';

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['amount'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$payload = json_encode([
    'amount'             => (float) $input['amount'],
    'currency'           => $input['currency'] ?? 'RUB',
    'orderId'            => $input['orderId'] ?? null,
    'description'        => $input['description'] ?? null,
    'successRedirectUrl' => $input['successRedirectUrl'] ?? null,
    'failRedirectUrl'    => $input['failRedirectUrl'] ?? null,
]);

$ch = curl_init($WATA_API);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $WATA_TOKEN,
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error    = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(502);
    echo json_encode(['error' => 'Payment service unavailable']);
    exit;
}

$data = json_decode($response, true);

if ($httpCode >= 400 || empty($data['url'])) {
    http_response_code($httpCode ?: 500);
    echo $response;
    exit;
}

echo json_encode(['url' => $data['url'], 'id' => $data['id'] ?? null]);
