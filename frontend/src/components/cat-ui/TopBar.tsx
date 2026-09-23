import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, MapPin, Calendar, Radio, ShieldAlert, ChevronDown } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';
import { useAlerts } from '../../lib/socket';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSessionStore();
  const { alerts } = useAlerts();
  const [selectedSite, setSelectedSite] = useState('Site A - Main Project');
  const [showAlertDropdown, setShowAlertDropdown] = useState(false);

  const isAdmin = user?.role === 'admin';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const activeAlerts = alerts.filter(a => a.severity === 'Critical' || a.priority_rank <= 2);

  // Operator portal has its own header — don't render TopBar at all for operator
  if (user?.role === 'operator') return null;

  const handleAlertClick = (alertId: number) => {
    setShowAlertDropdown(false);
    navigate('/admin/incidents');
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Left: Site selector + Date */}
      <div className="flex items-center gap-3">
        {/* Site dropdown */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer hover:border-gray-300 transition-all">
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="bg-transparent border-none text-xs focus:outline-none cursor-pointer"
          >
            <option>Site A - Main Project</option>
            <option>Site B - East Quarry</option>
            <option>Site C - Northern Block</option>
          </select>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700">
          <Calendar className="w-3.5 h-3.5 text-gray-500" />
          <span>{dateStr}</span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search operator, machine, location..."
            className="w-full bg-gray-50 border border-gray-200 text-xs rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-[#FFCD11] transition-all text-gray-800 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Right: Alert bell + CAT branding */}
      <div className="flex items-center gap-3">
        {/* Live Sync Indicator (small) */}
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
          Live
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlertDropdown(!showAlertDropdown)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 relative transition-all"
          >
            <Bell className="w-4 h-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {/* Quick Alert Flyout */}
          {showAlertDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-500" /> Safety Alerts
                </span>
                <span className="text-[10px] text-gray-400 font-bold">{alerts.length} total</span>
              </div>
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {alerts.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No active alerts</p>
                )}
                {alerts.slice(0, 5).map((a) => (
                  <div 
                    key={a.id} 
                    onClick={() => handleAlertClick(a.id)}
                    className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs cursor-pointer hover:border-gray-300 hover:bg-gray-100 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        a.severity === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {a.alert_type} (P{a.priority_rank})
                      </span>
                    </div>
                    <p className="text-gray-700 font-medium leading-tight">{a.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1C1C1C] text-[#FFCD11] font-extrabold flex items-center justify-center text-xs">
            {user?.name ? user.name[0] : 'A'}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-bold text-gray-800 leading-tight">{user?.name || 'Admin'}</p>
          </div>
        </div>

        {/* CAT branding badge */}
        <div className="hidden lg:flex items-center gap-1.5 border-l border-gray-200 pl-3">
          <svg viewBox="0 0 100 85" className="w-7 h-6">
            <polygon points="50,0 100,85 0,85" fill="#FFCD11" />
            <polygon points="50,22 83,78 17,78" fill="white" />
            <text x="50" y="66" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" fontSize="24" textAnchor="middle" fill="#1C1C1C">CAT</text>
          </svg>
          <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider leading-tight">
            Built For<br />A Better Tomorrow
          </div>
        </div>
      </div>
    </header>
  );
};
