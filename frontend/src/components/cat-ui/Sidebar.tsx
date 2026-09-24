import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Truck,
  Users,
  CheckSquare,
  AlertTriangle,
  Wrench,
  GraduationCap,
  FileText,
  Settings,
  LogOut,
  Bot,
  Activity,
  ShieldCheck,
  ClipboardList,
  Fuel,
} from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';

export const Sidebar: React.FC = () => {
  const { user, logout } = useSessionStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  const adminNav = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Operators', path: '/admin/operators', icon: Users },
    { name: 'Machines', path: '/admin/fleet', icon: Truck },
    { name: 'Task Assignment', path: '/admin/tasks/assign', icon: CheckSquare },
    { name: 'Monitoring', path: '/admin/monitoring', icon: ClipboardList },
    { name: 'Incidents', path: '/admin/incidents', icon: AlertTriangle },
    { name: 'Maintenance', path: '/admin/maintenance', icon: Wrench },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const operatorNav = [
    { name: 'Home', path: '/operator/dashboard', icon: LayoutDashboard },
    { name: 'My Tasks', path: '/operator/tasks', icon: CheckSquare },
    { name: 'Map', path: '/operator/live', icon: MapPin },
    { name: 'Machine Status', path: '/operator/health', icon: Truck },
    { name: 'Safety Check', path: '/operator/safety-check', icon: ShieldCheck },
    { name: 'Messages', path: '/operator/alerts', icon: Bot },
    { name: 'Training', path: '/operator/training', icon: GraduationCap },
  ];

  const navItems = isAdmin ? adminNav : operatorNav;

  return (
    <aside className="w-60 bg-[#1C1C1C] text-white flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-5 border-b border-gray-700/50 gap-3">
        {/* CAT Triangle Logo */}
        <svg viewBox="0 0 100 85" className="w-9 h-8 shrink-0">
          <polygon points="50,0 100,85 0,85" fill="#FFCD11" />
          <polygon points="50,22 83,78 17,78" fill="#1C1C1C" />
          <text x="50" y="66" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" fontSize="24" textAnchor="middle" fill="#FFFFFF">CAT</text>
        </svg>
        <div>
          <div className="font-extrabold text-sm tracking-wide text-white leading-tight">
            {isAdmin ? 'Operations' : 'Operator Portal'}
          </div>
          <div className="text-[10px] text-[#FFCD11] font-medium uppercase tracking-wider">
            {isAdmin ? 'Management' : 'Work Smarter. Build Better.'}
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item, idx) => {
          // De-duplicate paths for display (only link to first occurrence)
          const dupeIdx = navItems.findIndex(n => n.path === item.path);
          return (
            <NavLink
              key={`${item.path}-${idx}`}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#FFCD11] text-[#1C1C1C] font-bold'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-gray-700/50">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-[#FFCD11] text-[#1C1C1C] font-extrabold flex items-center justify-center text-xs shrink-0">
            {user?.name ? user.name[0] : isAdmin ? 'A' : 'O'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.name || (isAdmin ? 'Admin' : 'Operator')}</p>
            <p className="text-[10px] text-gray-400 truncate">{isAdmin ? 'Site Manager' : user?.operatorCode}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        {isAdmin && (
          <div className="text-[10px] text-gray-500 text-center mt-1">← Log out</div>
        )}
      </div>
    </aside>
  );
};
