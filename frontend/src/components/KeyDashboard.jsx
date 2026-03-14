import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Clock, Key, Plus, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { keyService } from '../api/keyService';

function KeyDashboard() {
  const navigate = useNavigate();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const data = await keyService.getAllKeys();
      // Backend returns { success: true, data: [...] }
      const keysData = data.data || [];
      setKeys(keysData);
      updateStats(keysData);
    } catch (error) {
      console.error('Error loading keys:', error);
      // Demo data if API fails
      const demoKeys = [
        {
          id: '1',
          key: 'KHOA-24H-ABC123XYZ',
          status: 'ACTIVE',
          timeLeft: 72000,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          key: 'KHOA-48H-DEF456UVW',
          status: 'ACTIVE',
          timeLeft: 150000,
          createdAt: new Date().toISOString(),
        },
      ];
      setKeys(demoKeys);
      updateStats(demoKeys);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (keyList) => {
    setStats({
      total: keyList.length,
      active: keyList.filter(k => k.status === 'ACTIVE').length,
      expired: keyList.filter(k => k.status === 'EXPIRED').length,
    });
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    showNotification('Đã copy key!', 'success');
  };

  const showNotification = (message, type = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const createNewKey = () => {
    navigate('/skip');
  };

  const renewKey = async (keyId) => {
    try {
      await keyService.updateKey(keyId, { duration: 86400 }); // +24 hours
      showNotification('Gia hạn thành công!', 'success');
      loadKeys();
    } catch (error) {
      showNotification('Gia hạn thất bại', 'error');
    }
  };

  const deleteKey = async (keyId) => {
    if (!confirm('Bạn có chắc muốn xóa key này?')) return;
    
    try {
      await keyService.deleteKey(keyId);
      showNotification('Đã xóa key!', 'success');
      loadKeys();
    } catch (error) {
      showNotification('Xóa thất bại', 'error');
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return 'Hết hạn';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white text-xl animate-pulse">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-xl z-50 animate-fade-in ${
          showToast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {showToast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">KhoaDz Script Key</h1>
              <p className="text-slate-400">Quản lý key hệ thống</p>
            </div>
            <button
              onClick={createNewKey}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              <Plus className="w-5 h-5" />
              Tạo Key Mới
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Key className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Tổng Key</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Đang hoạt động</p>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Hết hạn</p>
                <p className="text-2xl font-bold text-white">{stats.expired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Keys Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Danh sách Key</h2>
          </div>

          {keys.length === 0 ? (
            <div className="p-12 text-center">
              <Key className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">Chưa có key nào</p>
              <button
                onClick={createNewKey}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Tạo Key Đầu Tiên
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/50">
                    <th className="text-left py-4 px-6 text-slate-400 text-sm font-semibold uppercase tracking-wider">
                      Key
                    </th>
                    <th className="text-center py-4 px-6 text-slate-400 text-sm font-semibold uppercase tracking-wider">
                      Thời gian còn lại
                    </th>
                    <th className="text-center py-4 px-6 text-slate-400 text-sm font-semibold uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="text-center py-4 px-6 text-slate-400 text-sm font-semibold uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {keys.map((keyData) => (
                    <tr key={keyData.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-lg">
                            <Key className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-mono text-white text-sm">{keyData.key}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="w-4 h-4 text-green-400" />
                          <span className="font-mono text-green-400">{formatTime(keyData.timeLeft)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          keyData.status === 'ACTIVE'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {keyData.status === 'ACTIVE' ? 'Hoạt động' : 'Hết hạn'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => copyKey(keyData.key)}
                            className="p-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-colors"
                            title="Copy key"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => renewKey(keyData.id)}
                            className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                            title="Gia hạn +24H"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteKey(keyData.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                            title="Xóa key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/')} 
            className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            ← Quay lại trang chính
          </button>
        </div>
      </div>
    </div>
  );
}

export default KeyDashboard;
