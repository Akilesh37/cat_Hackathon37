import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface SafetyChecklistProps {
  onChecklistComplete: (passed: boolean) => void;
  machineCode?: string;
}

export const SafetyChecklist: React.FC<SafetyChecklistProps> = ({
  onChecklistComplete,
  machineCode = 'CAT 320'
}) => {
  const [checks, setChecks] = useState({
    seatbelt_functioning: true,
    walkaround_inspection_passed: true,
    backup_alarm_functional: true,
    mirrors_and_cameras_clean: true,
    hydraulic_leaks_absent: true,
    fire_extinguisher_charged: true
  });

  const [submitted, setSubmitted] = useState(false);

  const toggleCheck = (key: keyof typeof checks) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allPassed = Object.values(checks).every(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    onChecklistComplete(allPassed);
  };

  return (
    <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-cat-gray-200 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cat-black rounded-xl text-cat-yellow">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-cat-black">Pre-Start Inspection Protocol</h3>
            <p className="text-xs text-cat-gray-500 font-semibold">{machineCode} • Mandatory Safety Gating</p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-cat-black text-cat-yellow font-extrabold text-[10px] rounded-lg">
          OSHA & CAT COMPLIANCE
        </span>
      </div>

      <p className="text-xs text-cat-gray-700 mb-4">
        Federal and Caterpillar operating regulations require verified pre-shift physical checks before hydraulic interlock release.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {[
          { key: 'seatbelt_functioning', label: 'Seatbelt Mechanism & Retractor Latch Functional', desc: 'Webbing free of tears, buckle latches securely with positive click.' },
          { key: 'walkaround_inspection_passed', label: 'Visual 360° Walkaround Completed', desc: 'No unauthorized ground personnel in radius; track tension & teeth checked.' },
          { key: 'backup_alarm_functional', label: 'Backup Audible Alarm & Horn Verified', desc: 'Audible test confirmed clear sound upon reverse throttle actuation.' },
          { key: 'mirrors_and_cameras_clean', label: 'Cat Detect Radar & Blind-Spot Cameras Clean', desc: 'Lenses and rear-view mirrors cleaned of mud and obstruction.' },
          { key: 'hydraulic_leaks_absent', label: 'Hydraulic Cylinder Rods & Lines Clean', desc: 'No pooling oil, weeping fittings, or damaged braided hoses.' },
          { key: 'fire_extinguisher_charged', label: 'In-Cab Fire Extinguisher Gauge in Green', desc: 'Safety pin intact and inspected within validity date.' }
        ].map((item) => {
          const isChecked = checks[item.key as keyof typeof checks];
          return (
            <div
              key={item.key}
              onClick={() => toggleCheck(item.key as keyof typeof checks)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                isChecked
                  ? 'bg-cat-green/5 border-cat-green/30'
                  : 'bg-cat-red/5 border-cat-red/30'
              }`}
            >
              <div className="pr-4">
                <span className="text-xs font-bold text-cat-black block">{item.label}</span>
                <span className="text-[11px] text-cat-gray-500">{item.desc}</span>
              </div>
              <div className="shrink-0">
                {isChecked ? (
                  <CheckCircle2 className="w-5 h-5 text-cat-green" />
                ) : (
                  <XCircle className="w-5 h-5 text-cat-red" />
                )}
              </div>
            </div>
          );
        })}

        {submitted && !allPassed && (
          <div className="p-3 bg-cat-red/10 border border-cat-red/30 rounded-xl text-xs font-bold text-cat-red flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Ignition Interlock Blocked: All inspection items must pass before shift start.</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full mt-4 bg-cat-yellow hover:bg-yellow-400 text-cat-black font-black text-xs py-3.5 rounded-xl transition-all shadow-sm uppercase tracking-wider"
        >
          Verify Safety Checklist & Unlock Ignition
        </button>
      </form>
    </div>
  );
};
