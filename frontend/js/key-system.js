/**
 * @file: key-system.js
 * @path: roblox/frontend/js/key-system.js
 * @purpose: Legacy JavaScript class cho key system (đã thay thế bởi React version)
 * @functionality: API connection, configuration management, link completion tracking
 * @connections: Kết nối đến backend API tại 127.0.0.1:5000, legacy file
 */
// Frontend JavaScript - Kết nối với Backend API

class KeySystem {
    constructor() {
        this.apiUrl = 'http://127.0.0.1:5000';
        this.selectedTime = null;
        this.requiredLinks = null;
        this.completedLinks = 0;
        this.keyGenerated = false;
    }

    // Lấy cấu hình từ backend
    async getConfig() {
        try {
            const response = await fetch(`${this.apiUrl}/config`);
            return await response.json();
        } catch (error) {
            console.error('Lỗi kết nối:', error);
            return null;
        }
    }

    // Tạo key mới
    async createKey() {
        try {
            const response = await fetch(`${this.apiUrl}/create-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    duration: this.selectedTime * 3600 // Convert hours to seconds
                })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Lỗi tạo key:', error);
            return { success: false, error: 'Lỗi kết nối server' };
        }
    }

    // Vượt link
    async completeLink() {
        // Giả lập vượt link - thực tế sẽ gọi API quảng cáo
        return new Promise((resolve) => {
            setTimeout(() => {
                this.completedLinks++;
                resolve(true);
            }, 2000); // Giả lập 2s để vượt link
        });
    }

    // Copy key to clipboard
    copyKey(key) {
        navigator.clipboard.writeText(key).then(() => {
            this.showNotification('✅ Đã copy key!', 'success');
        }).catch(() => {
            this.showNotification('❌ Lỗi copy key', 'error');
        });
    }

    // Hiển thị thông báo
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 
            ${type === 'success' ? 'bg-green-500' : 
              type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Format thời gian
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// Global instance
const keySystem = new KeySystem();
