import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Settings as SettingsIcon, Save, CheckCircle2, ShieldAlert } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [thresholds, setThresholds] = useState({
    proximity_radius_m: 8.0,
    max_hydraulic_temp_c: 85.0,
    min_fuel_level_pct: 15.0,
    max_idle_minutes: 20.0,
    weather_sensitivity: 'Moderate'
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getThresholds().then((res) => {
      if (res) {
        setThresholds({
          proximity_radius_m: res.proximity_radius_m || 8.0,
          max_hydraulic_temp_c: res.max_hydraulic_temp_c || 85.0,
          min_fuel_level_pct: res.min_fuel_level_pct || 15.0,
          max_idle_minutes: res.max_idle_minutes || 20.0,
          weather_sensitivity: res.weather_sensitivity || 'Moderate'
        });
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateThresholds(thresholds);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cat-black text-cat-yellow">
            Safety Governance
          </span>
          <h1 className="text-xl font-black text-cat-black mt-1">Deterministic Rules & Threshold Config</h1>
          <p className="text-xs text-cat-gray-500 font-semibold mt-0.5">
            Hardware Sensor Triggers, Geofence Tolerances & Pre-Start Interlock Gating
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm space-y-5">
        {saved && (
          <div className="p-3 bg-cat-green/15 border border-cat-green/30 text-cat-green rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Safety thresholds successfully synchronized to live simulator!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="font-bold text-cat-gray-700 block mb-1">
              Cat Detect Proximity Radius (Meters)
            </label>
            <input
              type="number"
              step="0.5"
              value={thresholds.proximity_radius_m}
              onChange={(e) => setThresholds({ ...thresholds, proximity_radius_m: Number(e.target.value) })}
              className="w-full bg-cat-gray-50 border border-cat-gray-200 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-cat-yellow"
            />
            <span className="text-[10px] text-cat-gray-500 mt-1 block">Default: 8.0m around active swing radius</span>
          </div>

          <div>
            <label className="font-bold text-cat-gray-700 block mb-1">
              Hydraulic Overheat Alarm Threshold (°C)
            </label>
            <input
              type="number"
              value={thresholds.max_hydraulic_temp_c}
              onChange={(e) => setThresholds({ ...thresholds, max_hydraulic_temp_c: Number(e.target.value) })}
              className="w-full bg-cat-gray-50 border border-cat-gray-200 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-cat-yellow"
            />
            <span className="text-[10px] text-cat-gray-500 mt-1 block">Level 2 Warning trigger (Default: 85°C)</span>
          </div>

          <div>
            <label className="font-bold text-cat-gray-700 block mb-1">
              Pre-Start Minimum Fuel Level (%)
            </label>
            <input
              type="number"
              value={thresholds.min_fuel_level_pct}
              onChange={(e) => setThresholds({ ...thresholds, min_fuel_level_pct: Number(e.target.value) })}
              className="w-full bg-cat-gray-50 border border-cat-gray-200 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-cat-yellow"
            />
            <span className="text-[10px] text-cat-gray-500 mt-1 block">Blocks shift start if fuel is below this level</span>
          </div>

          <div>
            <label className="font-bold text-cat-gray-700 block mb-1">
              Excessive Idle Flag Threshold (Minutes)
            </label>
            <input
              type="number"
              value={thresholds.max_idle_minutes}
              onChange={(e) => setThresholds({ ...thresholds, max_idle_minutes: Number(e.target.value) })}
              className="w-full bg-cat-gray-50 border border-cat-gray-200 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-cat-yellow"
            />
            <span className="text-[10px] text-cat-gray-500 mt-1 block">Triggers Priority 5 Idle Warning</span>
          </div>

          <div className="md:col-span-2">
            <label className="font-bold text-cat-gray-700 block mb-1">
              Weather Risk Haul Advisory Sensitivity
            </label>
            <select
              value={thresholds.weather_sensitivity}
              onChange={(e) => setThresholds({ ...thresholds, weather_sensitivity: e.target.value })}
              className="w-full bg-cat-gray-50 border border-cat-gray-200 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:border-cat-yellow"
            >
              <option>Conservative (Alerts on &gt;40% rain probability)</option>
              <option>Moderate (Alerts on &gt;60% rain probability)</option>
              <option>Aggressive (Alerts only on severe storm warning)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-cat-gray-100 flex justify-end">
          <button
            type="submit"
            className="bg-cat-yellow hover:bg-yellow-400 text-cat-black font-black text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save & Update Safety Engine
          </button>
        </div>
      </form>
    </div>
  );
};
