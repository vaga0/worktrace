<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");

session_destroy(); // 清除所有 session
echo json_encode(["success" => true]);
?>