<?php
header("Content-Type: application/json; charset=UTF-8");
session_start(); // 開啟 Session

$user_id = '_';
$user_name = '';

// 檢查使用者是否已登入
if (!isset($_SESSION['user'])) {
  echo json_encode(['error' => '未登入，請重新登入。']);
  exit(); // 停止執行
} else {
  require_once('src/user.php');
  $user = new User();
  $uData = $user->getUserByName($_SESSION['user']);
  $user_id = $uData['id'];
  $user_name = $_SESSION['user'];
}

$input = file_get_contents("php://input");
$receivedData = json_decode($input, true);

// 確保資料完整
if (!$receivedData || !isset($receivedData["year"], $receivedData["week"])) {
  echo json_encode(["status" => "error", "message" => "缺少必要參數"]);
  exit;
}

// ** 定義合法的 Key **
$validKeys = ["user_id", "year", "week", "date_range", "task_summary", "total_hours", "tasks", "notes"];
$validTasksKeys = ["completed", "in_progress", "blocked", "planned"];

$logData = [
  "user_id" => $user_name,
  "year" => intval($receivedData["year"]),
  "week" => $receivedData["week"],
  "date_range" => $receivedData["date_range"] ?? "",
  "task_summary" => $receivedData["task_summary"] ?? "",
  "total_hours" => isset($receivedData["total_hours"]) ? intval($receivedData["total_hours"]) : 0,
  "tasks" => [
    "completed" => is_array($receivedData["tasks"]["completed"] ?? null) ? $receivedData["tasks"]["completed"] : [],
    "in_progress" => is_array($receivedData["tasks"]["in_progress"] ?? null) ? $receivedData["tasks"]["in_progress"] : [],
    "blocked" => is_array($receivedData["tasks"]["blocked"] ?? null) ? $receivedData["tasks"]["blocked"] : [],
    "planned" => is_array($receivedData["tasks"]["planned"] ?? null) ? $receivedData["tasks"]["planned"] : []
  ],
  "notes" => $receivedData["notes"] ?? ""
];

$year = $logData["year"];
$week = $logData["week"];
$filename = "json/worklog-{$user_id}-{$year}.jsonl"; // 依照年份存不同檔案

$existingLogs = [];
if (file_exists($filename)) {
  $fileContents = file($filename, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
  foreach ($fileContents as $line) {
    $entry = json_decode($line, true);
    if ($entry) {
      $existingLogs[] = $entry;
    }
  }
}

// 檢查是否已存在相同的 year & week
$found = false;
foreach ($existingLogs as &$entry) {
  if ($entry["year"] == $year && $entry["week"] == $week) {
    $entry = $logData; // 直接覆蓋舊的資料
    $found = true;
    break;
  }
}

// 若不存在則新增
if (!$found) {
  $existingLogs[] = $logData;
}
usort($existingLogs, function ($a, $b) {
  return intval(substr($a["week"], 1)) - intval(substr($b["week"], 1));
});

// 重新寫入 JSONL 檔案
$fileHandle = fopen($filename, "w");
if ($fileHandle) {
  foreach ($existingLogs as $logEntry) {
    fwrite($fileHandle, json_encode($logEntry, JSON_UNESCAPED_UNICODE) . "\n");
  }
  fclose($fileHandle);
  echo json_encode(["status" => "success", "message" => $found ? "日誌已更新" : "日誌已新增"]);
} else {
  echo json_encode(["status" => "error", "message" => "無法寫入檔案"]);
}
?>
