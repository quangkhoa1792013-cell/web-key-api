--[[
 * @file: roblox_script.lua
 * @path: roblox/roblox_script.lua
 * @purpose: Script chính cho Roblox với hệ thống heartbeat và validation
 * @functionality: Validate keys mỗi 60 giây, tự hủy khi hết hạn, quản lý retry logic
 * @connections: Kết nối đến API endpoint tại khoablabla.pythonanywhere.com/api
--]]
-- Roblox Script with Heartbeat System
-- This script validates keys every 60 seconds and self-destructs when expired

local KhoaDzScript = {}
KhoaDzScript.__index = KhoaDzScript

-- Configuration
local Config = {
    API_URL = "https://khoablabla.pythonanywhere.com/api",
    HEARTBEAT_INTERVAL = 60, -- seconds
    MAX_RETRIES = 3,
    RETRY_DELAY = 5 -- seconds
}

-- Services
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local LogService = game:GetService("LogService")

-- Generate HWID
local function generateHWID()
    local hwid = ""
    local components = {
        game.PlaceId,
        game.JobId,
        #Players:GetPlayers(),
        workspace.Name,
        lighting.Name,
        HttpService:GetHttpAsync("https://httpbin.org/ip"):match('"origin": "([^"]+)"') or "unknown"
    }
    
    for i, component in pairs(components) do
        hwid = hwid .. tostring(component)
    end
    
    -- Simple hash
    local hash = 0
    for i = 1, #hwid do
        hash = (hash * 31 + string.byte(hwid, i)) % 2147483647
    end
    
    return "RBX_" .. tostring(hash)
end

-- Constructor
function KhoaDzScript:new(key)
    local self = setmetatable({}, KhoaDzScript)
    self.key = key
    self.hwid = generateHWID()
    self.isValid = false
    self.expire_ts = nil
    self.heartbeatConnection = nil
    self.retryCount = 0
    
    print("[KhoaDz] Script initialized with HWID:", self.hwid)
    return self
end

-- Validate key on server
function KhoaDzScript:validateKey()
    local success, response = pcall(function()
        local url = self.API_URL .. "/validate-key"
        local data = HttpService:JSONEncode({
            key = self.key,
            hwid = self.hwid
        })
        
        local response = HttpService:PostAsync(url, data, Enum.HttpContentType.ApplicationJson)
        return HttpService:JSONDecode(response)
    end)
    
    if success and response then
        if response.success then
            self.isValid = true
            self.expire_ts = response.expire_ts
            self.retryCount = 0
            print("[KhoaDz] Key validated successfully")
            return true
        else
            self.isValid = false
            print("[KhoaDz] Key validation failed:", response.message)
            if response.message == "KEY_EXPIRED" or response.message == "KEY_NOT_FOUND" then
                self:destroy("Key expired or invalid")
            end
            return false
        end
    else
        print("[KhoaDz] Network error during validation:", response)
        return false
    end
end

-- Send heartbeat to server
function KhoaDzScript:heartbeat()
    if not self.isValid then
        return false
    end
    
    local success, response = pcall(function()
        local url = self.API_URL .. "/heartbeat"
        local data = HttpService:JSONEncode({
            key = self.key,
            hwid = self.hwid
        })
        
        local response = HttpService:PostAsync(url, data, Enum.HttpContentType.ApplicationJson)
        return HttpService:JSONDecode(response)
    end)
    
    if success and response then
        if response.success then
            self.expire_ts = response.expire_ts
            self.retryCount = 0
            print("[KhoaDz] Heartbeat successful")
            return true
        else
            self.isValid = false
            print("[KhoaDz] Heartbeat failed:", response.message)
            if response.message == "KEY_EXPIRED" or response.message == "KEY_NOT_FOUND" or response.message == "HWID_MISMATCH" then
                self:destroy("Key expired or invalid")
            end
            return false
        end
    else
        self.retryCount = self.retryCount + 1
        print("[KhoaDz] Heartbeat network error, retry:", self.retryCount)
        
        if self.retryCount >= self.MAX_RETRIES then
            self:destroy("Too many failed heartbeats")
        end
        return false
    end
end

-- Start heartbeat loop
function KhoaDzScript:startHeartbeat()
    if self.heartbeatConnection then
        self.heartbeatConnection:Disconnect()
    end
    
    print("[KhoaDz] Starting heartbeat loop...")
    
    self.heartbeatConnection = RunService.Heartbeat:Connect(function()
        -- This runs every frame, we'll check time
        if tick() % self.HEARTBEAT_INTERVAL < 0.1 then
            self:heartbeat()
        end
    end)
    
    -- Alternative: use Spawn with delay
    spawn(function()
        while self.isValid do
            wait(self.HEARTBEAT_INTERVAL)
            self:heartbeat()
        end
    end)
end

-- Destroy script and all functionality
function KhoaDzScript:destroy(reason)
    print("[KhoaDz] Destroying script:", reason)
    
    -- Stop heartbeat
    if self.heartbeatConnection then
        self.heartbeatConnection:Disconnect()
        self.heartbeatConnection = nil
    end
    
    self.isValid = false
    
    -- Clear all script functionality
    -- This is where you would disable all script features
    warn("[KhoaDz] SCRIPT DISABLED: " .. reason)
    
    -- Optional: Kick player or show UI
    if Players.LocalPlayer then
        local player = Players.LocalPlayer
        if player:FindFirstChild("PlayerGui") then
            local screenGui = Instance.new("ScreenGui")
            screenGui.Name = "KhoaDzExpired"
            screenGui.Parent = player.PlayerGui
            
            local frame = Instance.new("Frame")
            frame.Size = UDim2.new(0.5, 0, 0.3, 0)
            frame.Position = UDim2.new(0.25, 0, 0.35, 0)
            frame.BackgroundColor3 = Color3.new(0.1, 0.1, 0.1)
            frame.BorderSizePixel = 2
            frame.BorderColor3 = Color3.new(1, 0, 0)
            frame.Parent = screenGui
            
            local label = Instance.new("TextLabel")
            label.Size = UDim2.new(1, -20, 1, -20)
            label.Position = UDim2.new(0, 10, 0, 10)
            label.BackgroundTransparency = 1
            label.Text = "KhoaDz Script Expired\\n" .. reason .. "\\n\\nPlease get a new key to continue."
            label.TextColor3 = Color3.new(1, 1, 1)
            label.TextScaled = true
            label.Font = Enum.Font.SourceSansBold
            label.Parent = frame
        end
    end
    
    -- Force script to stop
    script:Destroy()
end

-- Initialize and start
local function initializeScript()
    -- Get key from user input (you would implement your key input system)
    local userInput = game:GetService("UserInputService")
    local key = nil
    
    -- Example: ask for key via TextBox UI
    -- You should implement your own key input system
    
    if not key or key == "" then
        warn("[KhoaDz] No key provided. Script cannot start.")
        return
    end
    
    -- Create script instance
    local scriptInstance = KhoaDzScript:new(key)
    
    -- Validate key first
    if scriptInstance:validateKey() then
        -- Start heartbeat loop
        scriptInstance:startHeartbeat()
        
        -- Your main script logic goes here
        print("[KhoaDz] Script started successfully!")
        
        -- Example: your script functionality
        -- while scriptInstance.isValid do
        --     -- Your code here
        --     wait(1)
        -- end
    else
        scriptInstance:destroy("Initial key validation failed")
    end
end

-- Start the script
initializeScript()

-- Export for external use
return KhoaDzScript
