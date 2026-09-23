import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, MapPin, Bot, AlertTriangle } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const tabs = [
    { name: 'Home', path: '/operator/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', path: '/operator/tasks', icon: CheckSquare },
    { name: 'Map HUD', path: '/operator/live', icon: MapPin },
    { name: 'Copilot', path: '/operator/copilot', icon: Bot },
    { name: 'Alerts', path: '/operator/alerts', icon: AlertTriangle },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-cat-black border-t border-cat-gray-700/60 z-40 flex items-center justify-around px-2">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-14 h-full text-[10px] font-bold transition-all ${
              isActive ? 'text-cat-yellow' : 'text-cat-gray-400 hover:text-white'
            }`
          }
        >
          <tab.icon className="w-5 h-5 mb-1" />
          <span>{tab.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};
