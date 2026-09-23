import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { LiveMap } from '../../components/LiveMap';
import { ArrowLeft, Play, Pause, RotateCcw, AlertTriangle, Clock, Gauge, Flame } from 'lucide-react';
import { StatusChip } from '../../components/cat-ui/StatusChip';

export const IncidentReplay: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();

  const [replayData, setReplayData] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReplay() {
      try {
        const id = Number(incidentId) || 1;
        const res = await api.getIncidentReplay(id);
        setReplayData(res);
        if (res.positions_window && res.positions_window.length > 0) {
          setCurrentIndex(res.positions_window.length - 1);
        }
      } catch (err) {
        console.error('Failed to load incident replay:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReplay();
  }, [incidentId]);

  // Playback timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && replayData?.positions_window?.length) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= replayData.positions_window.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 800);
    }
    return () => clearInterval(timer);
  }, [isPlaying, replayData]);

  if (loading || !replayData) {
    return <div className="p-8 text-center text-xs font-bold text-cat-gray-500">Loading Incident Flight Recorder...</div>;
  }

  const { incident, positions_window, telemetry_window } = replayData;
  const currentPos = positions_window[currentIndex] || {};
  const currentTel = telemetry_window[currentIndex] || {};

  return (
    <div className="space-y-4">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/incidents')}
          className="flex items-center gap-1.5 text-xs font-bold text-cat-gray-700 hover:text-cat-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Incident Center
        </button>
        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-cat-red text-white">
          Forensic Incident Investigation
        </span>
      </div>

      {/* Incident Detail Card */}
      <div className="bg-white rounded-2xl border border-cat-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cat-red/15 text-cat-red rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-cat-black">{incident.incident_type}</h2>
              <p className="text-xs text-cat-gray-500">{incident.description}</p>
            </div>
          </div>
          <StatusChip status={incident.status} />
        </div>
      </div>

      {/* Replay Controls & Flight Window Slider */}
      <div className="bg-white rounded-2xl border border-cat-gray-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2.5 bg-cat-yellow hover:bg-yellow-400 text-cat-black rounded-xl font-bold transition-all cursor-pointer shadow-sm"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { setIsPlaying(false); setCurrentIndex(0); }}
            className="p-2.5 bg-cat-gray-100 hover:bg-cat-gray-200 text-cat-black rounded-xl transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="text-xs font-bold text-cat-gray-700 ml-2">
            Replay Step: <span className="font-black text-cat-black">{currentIndex + 1} / {positions_window.length}</span>
            <span className="text-cat-gray-400 ml-2">({currentPos.time || '00:00:00'})</span>
          </div>
        </div>

        {/* Timeline Slider */}
        <input
          type="range"
          min="0"
          max={positions_window.length - 1}
          value={currentIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentIndex(Number(e.target.value));
          }}
          className="w-full md:w-96 accent-cat-yellow cursor-pointer"
        />

        {/* Live Gauges At Replay Tick */}
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-cat-gray-700">
            <Gauge className="w-4 h-4 text-cat-yellow" />
            <span>{currentPos.speed_kmh || 0} km/h</span>
          </div>
          <div className="flex items-center gap-1.5 text-cat-gray-700">
            <Flame className="w-4 h-4 text-cat-orange" />
            <span>{currentTel.hydraulic_temp || 68.0}°C</span>
          </div>
        </div>
      </div>

      {/* Map View */}
      <LiveMap
        mode="admin"
        height="500px"
      />
    </div>
  );
};
