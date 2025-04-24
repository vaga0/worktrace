<?php
session_start();

require_once('src/user.php');

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $username = trim($_POST['username'] ?? '');
  $password = $_POST["password"] ?? "";
  $user = new User();

  $uData = $user->userLogin($username, $password);
  if (!empty($uData)) {
    $_SESSION["user"] = $username;
    if ($username == 'demouser') restoreData($uData);
    echo json_encode(["success" => true]);
  } else {
    echo json_encode(["success" => false]);
  }
}

// 將 demo 帳號資料還原
function restoreData($uData) {
  $user_id = $uData['id'];
  $year_now = date('Y');
  $pre_year_now = intval(date('Y')) - 1;
  $file_folder = 'json/';
  $file_match = '/^worklog-' . $user_id . '-.*\.jsonl$/';

  $file_from = $file_folder . 'worklog-' . $user_id . '-' . $year_now . '.jsonl.template';
  $file_to  = $file_folder . 'worklog-' . $user_id . '-' . $year_now . '.jsonl';

  $file_from_2 = $file_folder . 'worklog-' . $user_id . '-' . $pre_year_now . '.jsonl.template';
  $file_to_2  = $file_folder . 'worklog-' . $user_id . '-' . $pre_year_now . '.jsonl';

  // 刪除符合條件的 .jsonl 檔案
  foreach (glob($file_folder . 'worklog-' . $user_id . '-*.jsonl') as $file) {
    if (preg_match($file_match, basename($file))) {
      unlink($file);
    }
  }

  if (file_exists($file_from)) {
    copy($file_from, $file_to);
  }

  if (file_exists($file_from_2)) {
    copy($file_from_2, $file_to_2);
  }
}
?>
