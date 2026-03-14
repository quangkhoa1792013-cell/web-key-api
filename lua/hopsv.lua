--[[ 
    KHOADZ SYSTEM - VERSION 0.6 (PLATINUM EDITION - ULTIMATE TROLL)
    - LO NGAY CHO TAO
]]

repeat task.wait() until game:IsLoaded()

local StarterGui = game:GetService("StarterGui")
local UserInputService = game:GetService("UserInputService")
local TeleportService = game:GetService("TeleportService")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

-- CẤU HÌNH HỆ THỐNG
local version = "0.6"
local image_id = "rbxassetid://108021605525411"
local is_hack_running = false
local hack_link = "https://raw.githubusercontent.com/Dev-NightMystic/Night-Mystic-/refs/heads/main/3209277401661639.lua.txt"
local autoexec_link = "https://raw.githubusercontent.com/quangkhoa1792013-cell/script/refs/heads/main/hopsv.lua"

-- Biến bộ đếm và thời gian
local counts = {K = 0, L = 0, M = 0, U = 0}
local last_press = {K = 0, L = 0, M = 0, U = 0}
local RESET_TIME = 5 -- Reset sau 5 giây không nhấn

-- Hàm thông báo
local function Notify(title, text)
    pcall(function()
        StarterGui:SetCore("SendNotification", {
            Title = title, Text = text, Icon = image_id, Duration = 2
        })
    end)
end

-- HÀM KIỂM TRA RESET VÀ CẬP NHẬT BỘ ĐẾM
local function UpdateCount(key_name)
    local now = tick()
    if now - last_press[key_name] > RESET_TIME then
        counts[key_name] = 1
    else
        counts[key_name] = counts[key_name] + 1
    end
    last_press[key_name] = now
    return counts[key_name]
end

-- HÀM HIỆU ỨNG LOADING CHỌC TỨC (VERSION 50S + ANIMATION)
local function StartLoading()
    local player = Players.LocalPlayer
    local pGui = player:WaitForChild("PlayerGui")
    
    local sg = Instance.new("ScreenGui", pGui)
    sg.Name = "KhoaDZLoading"
    sg.DisplayOrder = 9999999
    sg.IgnoreGuiInset = true

    local overlay = Instance.new("Frame", sg)
    overlay.Size = UDim2.new(1, 0, 1, 0)
    overlay.BackgroundColor3 = Color3.fromRGB(5, 5, 5)
    overlay.BackgroundTransparency = 1 -- Bắt đầu từ trong suốt để lướt vào
    overlay.ZIndex = 1

    local main = Instance.new("Frame", sg)
    main.Size = UDim2.new(0, 0, 0, 0) -- Bắt đầu từ kích thước 0
    main.Position = UDim2.new(0.5, 0, 0.5, 0)
    main.AnchorPoint = Vector2.new(0.5, 0.5)
    main.BackgroundColor3 = Color3.fromRGB(20, 20, 25)
    main.ZIndex = 2
    main.ClipsDescendants = true
    Instance.new("UICorner", main)
    Instance.new("UIStroke", main).Color = Color3.fromRGB(0, 255, 255)

    -- Animation xuất hiện
    TweenService:Create(overlay, TweenInfo.new(0.5), {BackgroundTransparency = 0.5}):Play()
    main:TweenSize(UDim2.new(0, 380, 0, 180), "Out", "Back", 0.5, true)

    local title = Instance.new("TextLabel", main)
    title.Size = UDim2.new(1, 0, 0, 45); title.Text = "KHOADZ SYSTEM - SECURITY ANALYSIS"
    title.TextColor3 = Color3.new(1, 1, 1); title.BackgroundTransparency = 1
    title.TextSize = 15; title.Font = Enum.Font.SourceSansBold; title.ZIndex = 3; title.TextTransparency = 1
    TweenService:Create(title, TweenInfo.new(0.8), {TextTransparency = 0}):Play()

    local barBg = Instance.new("Frame", main)
    barBg.Size = UDim2.new(0.85, 0, 0, 15); barBg.Position = UDim2.new(0.075, 0, 0.45, 0)
    barBg.BackgroundColor3 = Color3.fromRGB(40, 40, 45); barBg.ZIndex = 3; Instance.new("UICorner", barBg)

    local bar = Instance.new("Frame", barBg)
    bar.Size = UDim2.new(0, 0, 1, 0); bar.BackgroundColor3 = Color3.fromRGB(0, 255, 255)
    bar.ZIndex = 4; Instance.new("UICorner", bar)

    local percentTxt = Instance.new("TextLabel", main)
    percentTxt.Size = UDim2.new(1, 0, 0, 30); percentTxt.Position = UDim2.new(0, 0, 0.6, 0)
    percentTxt.Text = "Checking components..."; percentTxt.TextColor3 = Color3.fromRGB(0, 255, 255)
    percentTxt.BackgroundTransparency = 1; percentTxt.TextSize = 14; percentTxt.ZIndex = 3

    local skipReal = Instance.new("TextButton", main)
    skipReal.Size = UDim2.new(0, 50, 0, 20); skipReal.Position = UDim2.new(1, -55, 1, -25)
    skipReal.BackgroundTransparency = 1; skipReal.Text = "skip"; skipReal.TextColor3 = Color3.fromRGB(55, 55, 60) 
    skipReal.TextSize = 12; skipReal.ZIndex = 10

    local skipFake = Instance.new("TextButton", sg)
    skipFake.Size = UDim2.new(0, 90, 0, 35); skipFake.Position = UDim2.new(0.5, 50, 0.5, 50)
    skipFake.BackgroundColor3 = Color3.fromRGB(0, 150, 255); skipFake.Text = "SKIP (0.1s)"
    skipFake.TextColor3 = Color3.new(1, 1, 1); skipFake.Font = Enum.Font.SourceSansBold; skipFake.ZIndex = 999
    skipFake.BackgroundTransparency = 1
    Instance.new("UICorner", skipFake)
    TweenService:Create(skipFake, TweenInfo.new(0.5), {BackgroundTransparency = 0}):Play()

    skipFake.MouseEnter:Connect(function()
        local randomX = math.random(5, 95) / 100
        local randomY = math.random(5, 95) / 100
        TweenService:Create(skipFake, TweenInfo.new(0.12, Enum.EasingStyle.Exponential), {Position = UDim2.new(randomX, 0, randomY, 0)}):Play()
    end)

    local is_skipped = false
    local function FinishLoading()
        if is_skipped then return end
        is_skipped = true
        -- Animation biến mất
        TweenService:Create(overlay, TweenInfo.new(0.3), {BackgroundTransparency = 1}):Play()
        TweenService:Create(skipFake, TweenInfo.new(0.3), {BackgroundTransparency = 1, TextTransparency = 1}):Play()
        main:TweenSize(UDim2.new(0, 0, 0, 0), "In", "Back", 0.3, true, function()
            sg:Destroy()
            Notify("KHOADZ SUCCESS", "Nạp hệ thống thành công!")
        end)
    end

    skipReal.MouseButton1Click:Connect(FinishLoading)

    task.spawn(function()
        -- Giai đoạn loading
        for i = 0, 50 do if is_skipped then return end bar:TweenSize(UDim2.new(i/100,0,1,0), "Out", "Linear", 0.1, true); percentTxt.Text = i.."%"; task.wait(0.2) end
        for i = 51, 99 do if is_skipped then return end bar:TweenSize(UDim2.new(i/100,0,1,0), "Out", "Linear", 0.1, true); percentTxt.Text = i.."%"; task.wait(0.2) end
        local st = tick()
        while tick() - st < 25 do
            if is_skipped then return end
            local dec = "" for i=1,10 do dec = dec..math.random(0,9) end
            percentTxt.Text = "99."..dec.."%"; bar.Size = UDim2.new(0.993,0,1,0); task.wait(0.05)
        end
        percentTxt.Text = "99.9999999999%"; task.wait(5)
        bar.Size = UDim2.new(1.4,0,1,0); bar.BackgroundColor3 = Color3.fromRGB(255,0,0)
        percentTxt.Text = "100% - SUCCESSFUL ERROR?"; task.wait(2)
        FinishLoading()
    end)
end

-- 1. KHOADZ HOP SV
local function ServerHop()
    Notify("KHOADZ PROGRESS", "Đang tìm server trống...")
    local PlaceID = game.PlaceId
    local actualGoodServer = nil
    pcall(function()
        local Site = HttpService:JSONDecode(game:HttpGet('https://games.roblox.com/v1/games/' .. PlaceID .. '/servers/Public?sortOrder=Asc&limit=100'))
        for i,v in pairs(Site.data) do
            if v.playing < v.maxPlayers and v.id ~= game.JobId then
                actualGoodServer = v.id
                break
            end
        end
    end)
    if actualGoodServer then
        Notify("KHOADZ SUCCESS", "Đã tìm thấy! Đang dịch chuyển...")
        TeleportService:TeleportToPlaceInstance(PlaceID, actualGoodServer, Players.LocalPlayer)
    else
        Notify("KHOADZ ERROR", "Không tìm thấy server. Vui lòng thử lại.")
    end
end

-- 2. GUI STATUS (FULL ANIMATION)
local function ToggleStatus()
    local pGui = Players.LocalPlayer:WaitForChild("PlayerGui")
    local old = pGui:FindFirstChild("KhoaDZStatus")
    if old then 
        local m = old:FindFirstChild("Main")
        if m then 
            m:TweenSize(UDim2.new(0,0,0,0), "In", "Back", 0.3, true, function() old:Destroy() end) 
        else 
            old:Destroy() 
        end
        return 
    end
    
    local sg = Instance.new("ScreenGui", pGui); sg.Name = "KhoaDZStatus"; sg.DisplayOrder = 9999998
    local f = Instance.new("Frame", sg); f.Name = "Main"
    f.Size = UDim2.new(0, 0, 0, 0); f.Position = UDim2.new(0.5, 0, 0.5, 0); f.AnchorPoint = Vector2.new(0.5, 0.5)
    f.BackgroundColor3 = Color3.fromRGB(15, 15, 20); f.ClipsDescendants = true; Instance.new("UICorner", f)
    Instance.new("UIStroke", f).Color = Color3.fromRGB(0, 255, 255)

    local sf = Instance.new("ScrollingFrame", f)
    sf.Size = UDim2.new(1, -30, 1, -40); sf.Position = UDim2.new(0, 15, 0, 20); sf.BackgroundTransparency = 1; sf.Visible = false
    sf.ScrollBarThickness = 2

    local txt = Instance.new("TextLabel", sf)
    txt.Size = UDim2.new(1, 0, 1, 0); txt.BackgroundTransparency = 1; txt.TextColor3 = Color3.new(0.9,0.9,0.9); txt.TextWrapped = true; txt.RichText = true; txt.TextXAlignment = 0; txt.TextYAlignment = 0
    txt.Text = string.format([[
<font color="#00FFFF" size="18"><b>[ KHOADZ SYSTEM PLATINUM ]</b></font>
--------------------------------------------
• Phím <b>P</b>: Mở/Đóng Menu.
• Phím <b>K</b>: Hop SV (Nhấn 3 lần).
• Phím <b>L</b>: Load Script (Nhấn 2 lần).
• Phím <b>M</b>: Auto-Exec (Nhấn 2 lần).
• Phím <b>U</b>: Rejoin (Nhấn 2 lần).
--------------------------------------------
Reset bộ đếm sau 5 giây nếu không nhấn tiếp.
]])
    f:TweenSize(UDim2.new(0, 400, 0, 300), "Out", "Back", 0.4, true, function() sf.Visible = true end)
end

-- 3. XỬ LÝ PHÍM TẮT
UserInputService.InputBegan:Connect(function(input, proc)
    if proc then return end
    local key = input.KeyCode

    if key == Enum.KeyCode.P then ToggleStatus() end

    if key == Enum.KeyCode.K then
        local c = UpdateCount("K")
        if c >= 3 then counts.K = 0; ServerHop() else Notify("KHOADZ PROGRESS", "Nhấn K ["..c.."/3] - Reset sau 5s") end
    end

    if key == Enum.KeyCode.M then
        local c = UpdateCount("M")
        if c >= 2 then
            counts.M = 0
            pcall(function()
                if isfile("autohop.lua") then
                    delfile("autohop.lua")
                    Notify("KHOADZ SUCCESS", "Đã gỡ bỏ Auto-Exec.")
                else
                    writefile("autohop.lua", 'loadstring(game:HttpGet("'..autoexec_link..'"))()')
                    Notify("KHOADZ SUCCESS", "Đã kích hoạt Auto-Exec!")
                end
            end)
        else Notify("KHOADZ PROGRESS", "Nhấn M ["..c.."/2] để xác nhận.") end
    end

    if key == Enum.KeyCode.L then
        local c = UpdateCount("L")
        if c >= 2 then
            counts.L = 0; is_hack_running = true
            Notify("KHOADZ PROGRESS", "Đang khởi động script...")
            loadstring(game:HttpGet(hack_link))()
            Notify("KHOADZ SUCCESS", "Script đã được nạp!")
        else Notify("KHOADZ PROGRESS", "Nhấn L ["..c.."/2] để nạp Script.") end
    end

    if key == Enum.KeyCode.U then
        local c = UpdateCount("U")
        if c >= 2 then
            counts.U = 0
            Notify("KHOADZ SUCCESS", "Đang Rejoin server...")
            TeleportService:TeleportToPlaceInstance(game.PlaceId, game.JobId, Players.LocalPlayer)
        else Notify("KHOADZ PROGRESS", "Nhấn U ["..c.."/2] để Rejoin.") end
    end
end)

StartLoading()
