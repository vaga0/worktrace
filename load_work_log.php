<?php
header("Content-Type: application/json; charset=UTF-8");
session_start(); // 開啟 Session

// 檢查使用者是否已登入
if (!isset($_SESSION['user'])) {
    echo json_encode(['error' => '未登入，請重新登入。']);
    exit(); // 停止執行
} else {
    require_once('src/user.php');
    $user = new User();
    $uData = $user->getUserByName($_SESSION['user']);
    $user_id = $uData['id'];

    $year = isset($_POST['year']) ? $_POST['year'] : null;
    $week = isset($_POST['week']) ? $_POST['week'] : null;

    if ($year && $week) {
        $logs = loadWorkLogs($year, $user_id, $week);
        echo json_encode($logs);
    } else {
        echo json_encode(['error' => '缺少年份或週數']);
    }
}

function getIsoWeeksInYear($year) {
    $date = new DateTime;
    $date->setISODate($year, 53);
    return ($date->format("W") === "53" ? 53 : 52);
}

// 讀取工作日誌資料
function loadWorkLogs($year, $user_id, $week) {
    $logs = [];
    $current_log = null;
    $previous_log = null;
    $year = intval($year);
    $previous_year = $year;

    // 當 week 是 1 時，上一週應該是前一年的最後一週
    if (intval($week) == 1) {
        $previous_year = $year - 1;
        $previous_week = getIsoWeeksInYear($previous_year);
        
        // 載入前一年的工作日誌
        $previous_log_file = "json/worklog-{$user_id}-{$previous_year}.jsonl"; 
        if (file_exists($previous_log_file)) {
            $file = fopen($previous_log_file, 'r');
            while (($line = fgets($file)) !== false) {
                $log = json_decode(trim($line), true);
                if ($log['week'] == "W{$previous_week}") {
                    $previous_log = $log;
                }
            }
            fclose($file);
        }
    } else {
        // 其他週數，前一週是當年 week-1
        $previous_week = str_pad((intval($week) - 1), 2, '0', STR_PAD_LEFT);
    }

    // 讀取當年工作日誌檔案
    $file_path = "json/worklog-{$user_id}-{$year}.jsonl"; // 根據年份載入對應的工作日誌檔案

    if (file_exists($file_path)) {
        // 讀取當前週與前一週的工作日誌
        $file = fopen($file_path, 'r');
        while (($line = fgets($file)) !== false) {
            $log = json_decode(trim($line), true);

            // 當前週工作日誌
            if ($log['week'] == "W{$week}") {
                $current_log = $log;
            }

            if ($previous_year === $year) {
                // 前一週工作日誌
                if ($log['week'] == "W{$previous_week}") {
                    $previous_log = $log;
                }
            }
        }
        fclose($file);
    }

    return [
        'current' => $current_log,
        'previous' => $previous_log
    ];
}
