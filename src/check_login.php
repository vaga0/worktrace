<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");
if (isset($_SESSION["user"])) {
    require_once('user.php');
    $user = new User();
    $uData = $user->getUserByName($_SESSION["user"]);
    if (!empty($uData)) {
        echo json_encode(["logged_in" => true, "user" => $uData['name']]);
    } else {
        echo json_encode(["logged_in" => false]);
    }
} else {
    echo json_encode(["logged_in" => false]);
}
?>
