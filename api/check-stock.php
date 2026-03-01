<?php
header('Content-Type: application/json; charset=utf-8');

$BASEROW_TOKEN = 'GwcQy04FUx7ny7p4x4tcuJqnJZKN2iTq';
$BASEROW_API   = 'https://api.baserow.io';

$tables = [
    'finland'      => 832721,
    'uk'           => 857560,
    'registration' => 857563,
];

$country = isset($_GET['country']) ? $_GET['country'] : '';

if (!$country || !isset($tables[$country])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid country']);
    exit;
}

$tableId = $tables[$country];
$url = $BASEROW_API . '/api/database/rows/table/' . $tableId . '/?user_field_names=true&size=200';

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Token ' . $BASEROW_TOKEN,
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error    = curl_error($ch);
curl_close($ch);

if ($error || $httpCode >= 400) {
    http_response_code(502);
    echo json_encode(['error' => 'Database unavailable']);
    exit;
}

$data = json_decode($response, true);
$rows = isset($data['results']) ? $data['results'] : (is_array($data) ? $data : []);

$stock = [];
foreach ($rows as $row) {
    $tariff = isset($row['Тариф']) ? intval($row['Тариф']) : 0;
    $paid   = !empty($row['Оплата']);
    if ($tariff >= 1 && !$paid) {
        $stock[$tariff] = isset($stock[$tariff]) ? $stock[$tariff] + 1 : 1;
    }
}

echo json_encode(['stock' => $stock]);
