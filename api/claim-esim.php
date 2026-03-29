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

$url = $BASEROW_API . '/api/database/rows/table/' . $tableId . '/?user_field_names=true&size=200';
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
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

$data = json_decode($response, true);
$rows = isset($data['results']) ? $data['results'] : (is_array($data) ? $data : []);

$foundRow = null;
foreach ($rows as $row) {
    $rowTariff = isset($row['Тариф']) ? intval($row['Тариф']) : 0;
    $paid      = !empty($row['Оплата']);
    if ($rowTariff === $tariff && !$paid) {
        $foundRow = $row;
        break;
    }
}

if (!$foundRow) {
    http_response_code(404);
    echo json_encode(['error' => 'No available eSIM for this tariff']);
    exit;
}

$rowId = $foundRow['id'];
$qr    = isset($foundRow['Ссылка']) ? $foundRow['Ссылка'] : '';

$patchUrl  = $BASEROW_API . '/api/database/rows/table/' . $tableId . '/' . $rowId . '/?user_field_names=true';
$patchBody = ['Оплата' => true, 'Date' => gmdate('Y-m-d\TH:i:s\Z')];
if ($email)   $patchBody['Email'] = $email;
if ($orderId) $patchBody['ID клиента'] = intval($orderId);

$ch = curl_init($patchUrl);
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST  => 'PATCH',
    CURLOPT_POSTFIELDS     => json_encode($patchBody),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Token ' . $BASEROW_TOKEN,
        'Content-Type: application/json',
    ],
]);
curl_exec($ch);
curl_close($ch);

$pin = isset($foundRow['PIN']) ? $foundRow['PIN'] : '';
$puk = isset($foundRow['PUK']) ? $foundRow['PUK'] : '';
$number = isset($foundRow['number']) ? $foundRow['number'] : '';
$countryCode = isset($foundRow['country_code']) ? $foundRow['country_code'] : '';

echo json_encode(['qr' => $qr, 'rowId' => $rowId, 'pin' => $pin, 'puk' => $puk, 'number' => $number, 'country_code' => $countryCode]);
