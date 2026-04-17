<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$rawBody = file_get_contents('php://input');

$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0755, true);
}
$logEntry = date('Y-m-d H:i:s') . ' | IP: ' . ($_SERVER['REMOTE_ADDR'] ?? '-') . "\n"
    . 'Headers: ' . json_encode(getallheaders(), JSON_UNESCAPED_UNICODE) . "\n"
    . 'Body: ' . $rawBody . "\n"
    . str_repeat('-', 80) . "\n";
@file_put_contents($logDir . '/payment-callback.log', $logEntry, FILE_APPEND | LOCK_EX);

$data = json_decode($rawBody, true);
if (!$data) {
    parse_str($rawBody, $data);
}

if (empty($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Empty request body']);
    exit;
}

$orderId = $data['orderId'] ?? $data['OrderId'] ?? $data['order_id'] ?? $data['InvId'] ?? null;
$status  = $data['status']  ?? $data['Status']  ?? $data['state']  ?? null;
$amount  = $data['amount']  ?? $data['Amount']  ?? $data['OutSum'] ?? null;

$isSuccess = false;
if ($status !== null) {
    $normalized = strtolower(trim($status));
    $isSuccess = in_array($normalized, ['success', 'succeeded', 'confirmed', 'paid', 'completed', 'approved'], true);
}

@file_put_contents(
    $logDir . '/payment-callback.log',
    "  -> Parsed: orderId=$orderId, status=$status, amount=$amount, isSuccess=" . ($isSuccess ? 'YES' : 'NO') . "\n\n",
    FILE_APPEND | LOCK_EX
);

echo json_encode(['ok' => true]);
