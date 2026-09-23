import React, { useState } from 'react';
import { LiveMap } from '../../components/LiveMap';
import { Truck, Layers, Radio, ShieldAlert } from 'lucide-react';
import { useAlerts } from '../../lib/socket';

export const FleetCommandCenter: React.FC = () => {
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const { alerts } = useAlerts();

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl border border-cat-gray-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cat-black rounded-xl text-cat-yellow font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-cat-black">Fleet Command Center</h1>
            <p className="text-xs text-cat-gray-500 font-semibold">Real-time GPS Tracking, Work Zones & Haul Corridors</p>
          </div>
        </div>

        {/* Machine Type Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-cat-gray-50 border border-cat-gray-200 rounded-xl text-xs font-bold">
          {['all', 'Excavator', 'Wheel Loader', 'Dump Truck', 'Compactor'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                filterType === type
                  ? 'bg-cat-yellow text-cat-black shadow-sm font-black'
                  : 'text-cat-gray-700 hover:text-cat-black'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Full-Height Live Map */}
      <div className="relative">
        <LiveMap
          mode="admin"
          height="650px"
          onSelectMachine={(m) => setSelectedMachine(m)}
        />
      </div>
    </div>
  );
};
