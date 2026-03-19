<?php
// api.php - Lưu trên domain của bạn
$db_file = "database.json";
$admin_token = "MAT_KHAU_ADMIN_CUA_BAN";

// Khởi tạo database nếu chưa có
if (!file_exists($db_file)) {
    file_put_contents($db_file, json_encode([]));
}

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents($db_file), true);

// 1. ADMIN TẠO KEY (Dành cho Python CLI)
if ($action == "create") {
    if (($_GET['token'] ?? '') !== $admin_token) die("UNAUTHORIZED");
    
    $hours = (int)($_GET['hours'] ?? 4);
    $new_key = "KHOA-" . strtoupper(bin2hex(random_bytes(4)));
    $expire = time() + ($hours * 3600);
    
    $data[$new_key] = [
        "hwid" => "",
        "expire" => $expire,
        "duration" => $hours . "h"
    ];
    
    file_put_contents($db_file, json_encode($data));
    echo $new_key;
}

// 2. CHECK KEY (Dành cho LUA Roblox)
if ($action == "verify") {
    $key = $_GET['key'] ?? '';
    $hwid = $_GET['hwid'] ?? '';
    
    if (!isset($data[$key])) die("INVALID");
    if (time() > $data[$key]['expire']) die("EXPIRED");
    
    if ($data[$key]['hwid'] == "") {
        $data[$key]['hwid'] = $hwid;
        file_put_contents($db_file, json_encode($data));
        die("SUCCESS");
    }
    
    echo ($data[$key]['hwid'] == $hwid) ? "SUCCESS" : "WRONG_HWID";
}
?>