<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$BASEROW_TOKEN = 'GwcQy04FUx7ny7p4x4tcuJqnJZKN2iTq';
$BASEROW_API   = 'https://api.baserow.io';

$tables = [
    'finland'      => 832721,
    'uk'           => 857560,
    'registration' => 857563,
];

$input   = json_decode(file_get_contents('php://input'), true);
$country = isset($input['country']) ? $input['country'] : '';
$tariff  = isset($input['tariff'])  ? intval($input['tariff']) : 0;
$email   = isset($input['email'])   ? $input['email'] : '';
$orderId = isset($input['orderId']) ? $input['orderId'] : '';

if (!$country || !isset($tables[$country]) || $tariff < 1) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid parameters']);
    exit;
}

$tableId = $tables[$country];
$url = $BASEROW_API . '/api/database/rows/table/' . $tableId . '/?user_field_names=true';

$body = [
    'Тариф'      => strval($tariff),
    'Оплата'     => true,
    'Date'       => gmdate('Y-m-d\TH:i:s\Z'),
];
if ($email)   $body['Email'] = $email;
if ($orderId) $body['ID клиента'] = intval($orderId);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($body),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Token ' . $BASEROW_TOKEN,
        'Content-Type: application/json',
    ],
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode >= 400) {
    http_response_code(502);
    echo json_encode(['error' => 'Database unavailable']);
    exit;
}

$result = json_decode($response, true);
$rowId = isset($result['id']) ? $result['id'] : null;

echo json_encode(['ok' => true, 'rowId' => $rowId]);
