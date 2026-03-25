import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ChevronRight, Shield, Zap, Copy, CheckCircle } from 'lucide-react';

const services = [
  { id: 'lootlab', name: 'Lootlab', icon: '🎮', color: 'from-purple-500 to-pink-500' },
  { id: 'worklink', name: 'Worklink', icon: '💼', color: 'from-blue-500 to-cyan-500' },
  { id: 'linkvertise', name: 'Linkvertise', icon: '🔗', color: 'from-green-500 to-emerald-500' },
  { id: 'pandas', name: 'Pandas', icon: '🐼', color: 'from-orange-500 to-red-500' },
];

function ServiceSelectionPage() {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSelect = async (serviceId) => {
    setSelectedService(serviceId);
    
    try {
      // Call backend to generate link
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://khoablabla-backend.hf.space';
      const response = await fetch(`${apiBaseUrl}/api/generate-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Backend returns: { success: true, randomId: "abc123", serviceId: "lootlab" }
        const fullUrl = `${window.location.origin}/${result.serviceId}/${result.randomId}`;
        setGeneratedLink(fullUrl);
        
        // Save to localStorage
        localStorage.setItem('selectedService', result.serviceId);
        localStorage.setItem('randomId', result.randomId);
        localStorage.setItem('generatedLink', fullUrl);
      }
    } catch (error) {
      // Fallback - generate random locally
      const randomId = Math.random().toString(36).substring(2, 10).toLowerCase();
      const fullUrl = `${window.location.origin}/${serviceId}/${randomId}`;
      setGeneratedLink(fullUrl);
      
      localStorage.setItem('selectedService', serviceId);
      localStorage.setItem('randomId', randomId);
      localStorage.setItem('generatedLink', fullUrl);
    }
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetAll = () => {
    setSelectedService(null);
    setGeneratedLink('');
    setCopied(false);
    localStorage.removeItem('selectedService');
    localStorage.removeItem('randomId');
    localStorage.removeItem('generatedLink');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Globe className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">KhoaDz Script Key</h1>
          </div>
          <p className="text-slate-400 text-lg">Chọn dịch vụ để tạo link</p>
        </div>

        {/* Service Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => handleSelect(service.id)}
              disabled={generatedLink !== ''}
              className={`p-8 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] ${
                selectedService === service.id
                  ? 'border-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-600/10 shadow-lg shadow-blue-500/20'
                  : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600/50'
              } ${generatedLink ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${service.color} flex items-center justify-center text-3xl shadow-lg`}>
                  {service.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                  <p className="text-slate-400 text-sm">Tạo link cho dịch vụ {service.name}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-400" />
              </div>
            </button>
          ))}
        </div>

        {/* Generated Link Display */}
        {generatedLink && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-green-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Link đã tạo!</h3>
                  <p className="text-slate-400 text-sm">Sao chép và sử dụng link này</p>
                </div>
              </div>
              
              <button
                onClick={resetAll}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
              >
                Tạo mới
              </button>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <code className="text-blue-400 font-mono text-sm break-all flex-1">{generatedLink}</code>
                <button
                  onClick={copyLink}
                  className="ml-4 p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <a 
                href={generatedLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Zap className="w-5 h-5" />
                Mở link
              </a>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-white font-semibold mb-4">Hướng dẫn</h3>
          <ol className="space-y-2 text-slate-400 text-sm list-decimal list-inside">
            <li>Chọn dịch vụ bạn muốn tạo link</li>
            <li>Sao chép link đã tạo</li>
            <li>Mở link và hoàn thành các bước</li>
            <li>Nhận key và sử dụng ngay!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default ServiceSelectionPage;
