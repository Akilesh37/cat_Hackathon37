import React from 'react';
import { Download, FileText, ShieldAlert, Award, Truck } from 'lucide-react';

export const AdminReports: React.FC = () => {
  const downloadReport = (type: string) => {
    window.open(`/api/reports/export?report_type=${type}&file_format=csv`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cat-black text-cat-yellow">
            Compliance & Audits
          </span>
          <h1 className="text-xl font-black text-cat-black mt-1">Audit Reports & Export Center</h1>
          <p className="text-xs text-cat-gray-500 font-semibold mt-0.5">
            OSHA Safety Event Logs, Equipment Utilization & Operator Performance Transcripts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cat-red/10 text-cat-red flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-cat-black">Safety Incidents Log</h3>
            <p className="text-xs text-cat-gray-500 mt-1">
              Complete chronological audit of proximity alerts, geofence breaches, and speed infractions.
            </p>
          </div>
          <button
            onClick={() => downloadReport('incidents')}
            className="mt-6 w-full bg-cat-yellow hover:bg-yellow-400 text-cat-black font-black text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download Incidents CSV
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cat-blue/10 text-cat-blue flex items-center justify-center mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-cat-black">Operator Performance Audit</h3>
            <p className="text-xs text-cat-gray-500 mt-1">
              100-point shift scores, seatbelt compliance ratios, and itemized deduction notes.
            </p>
          </div>
          <button
            onClick={() => downloadReport('performance')}
            className="mt-6 w-full bg-cat-yellow hover:bg-yellow-400 text-cat-black font-black text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download Performance CSV
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cat-green/10 text-cat-green flex items-center justify-center mb-4">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-cat-black">Fleet Utilization & Telemetry</h3>
            <p className="text-xs text-cat-gray-500 mt-1">
              High-frequency engine hours, fuel consumption drift, and GPS coordinate telemetry snapshots.
            </p>
          </div>
          <button
            onClick={() => downloadReport('fleet_telemetry')}
            className="mt-6 w-full bg-cat-yellow hover:bg-yellow-400 text-cat-black font-black text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download Fleet CSV
          </button>
        </div>
      </div>
    </div>
  );
};
