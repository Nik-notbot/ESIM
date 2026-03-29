<?php
header('Content-Type: application/json; charset=utf-8');

$BASEROW_TOKEN = 'GwcQy04FUx7ny7p4x4tcuJqnJZKN2iTq';
$BASEROW_API   = 'https://api.baserow.io';

$tables = [
    'registration' => 857563,
];

$country = isset($_GET['country']) ? $_GET['country'] : '';
$rowId   = isset($_GET['rowId'])   ? intval($_GET['rowId']) : 0;

if (!$country || !isset($tables[$country]) || $rowId < 1) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid parameters']);
    exit;
}

$tableId = $tables[$country];
$url = $BASEROW_API . '/api/database/rows/table/' . $tableId . '/' . $rowId . '/?user_field_names=true';

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_HTTPHEADER     => ['Authorization: Token ' . $BASEROW_TOKEN],
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode >= 400) {
    http_response_code(502);
    echo json_encode(['error' => 'Database unavailable']);
    exit;
}

$row = json_decode($response, true);
$link = isset($row['link']) ? trim($row['link']) : '';

echo json_encode(['link' => $link]);
