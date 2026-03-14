local HttpService = game:GetService("HttpService")
local TweenService = game:GetService("TweenService")
local HWID = game:GetService("RbxAnalyticsService"):GetClientId()
local API_URL = "http://127.0.0.1:5000" -- Thay IP nếu cần

-- GIAO DIỆN
local ScreenGui = Instance.new("ScreenGui", game:GetService("CoreGui"))
local Main = Instance.new("Frame", ScreenGui)
Main.Size, Main.Position = UDim2.new(0, 280, 0, 150), UDim2.new(0.5, -140, 0.5, -75)
Main.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
Instance.new("UICorner", Main)

local Input = Instance.new("TextBox", Main)
Input.PlaceholderText = "Nhập Key..."
Input.Size, Input.Position = UDim2.new(0.9, 0, 0, 35), UDim2.new(0.05, 0, 0.3, 0)
Input.BackgroundColor3, Input.TextColor3 = Color3.fromRGB(45, 45, 45), Color3.new(1, 1, 1)
Instance.new("UICorner", Input)

local Status = Instance.new("TextLabel", Main)
Status.Text, Status.Position = "Chờ nhập key", UDim2.new(0, 0, 0.55, 0)
Status.Size, Status.BackgroundTransparency = UDim2.new(1, 0, 0, 20), 1
Status.TextColor3 = Color3.new(0.7, 0.7, 0.7)

local VerifyBtn = Instance.new("TextButton", Main)
VerifyBtn.Text, VerifyBtn.Size, VerifyBtn.Position = "XÁC NHẬN", UDim2.new(0.9, 0, 0, 35), UDim2.new(0.05, 0, 0.75, 0)
VerifyBtn.BackgroundColor3, VerifyBtn.TextColor3 = Color3.fromRGB(0, 120, 200), Color3.new(1, 1, 1)
Instance.new("UICorner", VerifyBtn)

-- XỬ LÝ XÁC THỰC
VerifyBtn.MouseButton1Click:Connect(function()
    local key = Input.Text
    if key == "" then return end
    
    Status.Text = "Đang kiểm tra..."
    
    -- Gửi trực tiếp key và hwid (Ko hash cho nhẹ)
    local url = API_URL .. "/verify?key=" .. key .. "&hwid=" .. HWID
    
    local success, res = pcall(function() return game:HttpGet(url) end)
    
    if success then
        if string.find(res, "SUCCESS") then
            local sec = string.split(res, "|")[2]
            
            -- Hiệu ứng tắt GUI
            Main:Destroy()
            
            -- Thông báo góc màn hình
            game:GetService("StarterGui"):SetCore("SendNotification", {
                Title = "KHOADZ SYSTEM",
                Text = "✅ Thành công! Còn lại: " .. sec .. "s",
                Duration = 5
            })
            
            -- SCRIPT CHÍNH CỦA BẠN DÁN Ở ĐÂY
            print("Script started!")
        else
            Status.Text = "❌ " .. tostring(res)
            Status.TextColor3 = Color3.new(1, 0, 0)
        end
    else
        Status.Text = "⚠️ Lỗi kết nối Server"
    end
end)