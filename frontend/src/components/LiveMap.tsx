import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useLiveLocation, MachinePositionUpdate } from '../lib/socket';
import { api } from '../lib/api';
import { Radio, Navigation, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface LiveMapProps {
  mode: 'admin' | 'operator';
  operatorId?: number;
  machineIds?: number[];
  showZones?: boolean;
  showRoute?: boolean;
  activeTaskId?: number;
  height?: string;
  onSelectMachine?: (machine: any) => void;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  mode,
  operatorId,
  machineIds,
  showZones = true,
  showRoute = true,
  activeTaskId,
  height = '500px',
  onSelectMachine,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups for dynamic markers and geometry
  const machinesLayerRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const trailsLayerRef = useRef<L.LayerGroup | null>(null);

  // Cache marker instances by machine_id for smooth position updates without re-render
  const markerInstancesRef = useRef<Record<number, L.Marker>>({});
  const machineTrailsRef = useRef<Record<number, [number, number][]>>({});

  // State
  const [machinesData, setMachinesData] = useState<any[]>([]);
  const [zonesData, setZonesData] = useState<any[]>([]);
  const [activeRoute, setActiveRoute] = useState<any>(null);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);

  // Hook: Real-time Live Position Socket stream
  const { positions, lastUpdate } = useLiveLocation({
    mode,
    operatorId,
  });

  // 1. Initial Load of Static/Reference Site Data
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [machines, zones] = await Promise.all([
          api.getMachines(),
          api.getZones(),
        ]);
        if (isMounted) {
          setMachinesData(machines);
          setZonesData(zones);
        }

        // If specific task given or operator mode, fetch route
        if (activeTaskId) {
          const route = await api.getTaskRoute(activeTaskId);
          if (isMounted) setActiveRoute(route);
        } else if (mode === 'operator' && operatorId) {
          // Find operator's task route (default to T-003 for operator 3, or T-001 for operator 1)
          const tasks = await api.getTasks(operatorId);
          if (tasks.length > 0) {
            const route = await api.getTaskRoute(tasks[0].id);
            if (isMounted) setActiveRoute(route);
          }
        } else {
          // Admin view: default display route for flagship demo task T-003 (Quarry -> Zone B)
          try {
            const route = await api.getTaskRoute(3);
            if (isMounted) setActiveRoute(route);
          } catch (e) {
            // Task 3 route fallback
          }
        }
      } catch (err) {
        console.error('Failed to load map static data:', err);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeTaskId, mode, operatorId]);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Anchor center at construction site
    const map = L.map(mapContainerRef.current, {
      center: [28.6145, 77.2095],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Initialize Layer Groups
    zonesLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);
    trailsLayerRef.current = L.layerGroup().addTo(map);
    machinesLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 3. Render Zone Polygons
  useEffect(() => {
    if (!mapInstanceRef.current || !zonesLayerRef.current || !showZones) return;
    zonesLayerRef.current.clearLayers();

    zonesData.forEach((zone) => {
      if (zone.polygon_geojson && zone.polygon_geojson.length >= 3) {
        const polygon = L.polygon(zone.polygon_geojson, {
          color: zone.color_hex || '#FFCD11',
          fillColor: zone.color_hex || '#FFCD11',
          fillOpacity: 0.18,
          weight: 2,
          dashArray: '4, 4',
        });

        polygon.bindTooltip(
          `<div class="font-bold text-xs">${zone.zone_code}: ${zone.name}</div>`,
          { permanent: true, direction: 'center', className: 'cat-zone-label' }
        );

        zonesLayerRef.current?.addLayer(polygon);
      }
    });
  }, [zonesData, showZones]);

  // 4. Render Route Polyline & Origin/Destination Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !routesLayerRef.current || !showRoute || !activeRoute) return;
    routesLayerRef.current.clearLayers();

    if (activeRoute.route_geojson && activeRoute.route_geojson.length > 1) {
      // Haul road line
      const polyline = L.polyline(activeRoute.route_geojson, {
        color: '#2E6FDB', // CAT Blue
        weight: 4,
        opacity: 0.85,
        dashArray: '6, 6',
      });
      routesLayerRef.current.addLayer(polyline);

      // Origin Pin (Quarry)
      const startPoint = activeRoute.route_geojson[0];
      const startMarker = L.circleMarker(startPoint, {
        radius: 7,
        color: '#1A1A1A',
        fillColor: '#FFCD11',
        fillOpacity: 1,
        weight: 3,
      }).bindTooltip(`<b>Pickup:</b> ${activeRoute.from_location || 'Quarry'}`, { direction: 'top' });
      routesLayerRef.current.addLayer(startMarker);

      // Destination Pin (Zone B)
      const endPoint = activeRoute.route_geojson[activeRoute.route_geojson.length - 1];
      const endMarker = L.circleMarker(endPoint, {
        radius: 7,
        color: '#1A1A1A',
        fillColor: '#2FA84F',
        fillOpacity: 1,
        weight: 3,
      }).bindTooltip(`<b>Drop:</b> ${activeRoute.to_location || 'Zone B'}`, { direction: 'top' });
      routesLayerRef.current.addLayer(endMarker);
    }
  }, [activeRoute, showRoute]);

  // 5. SYNCHRONIZED LIVE MACHINE MOVEMENT (Single Source of Truth)
  useEffect(() => {
    if (!mapInstanceRef.current || !machinesLayerRef.current) return;

    // Filter relevant machines based on mode / machineIds
    const targetMachines = machinesData.filter((m) => {
      if (machineIds && machineIds.length > 0) return machineIds.includes(m.id);
      return true;
    });

    targetMachines.forEach((machine) => {
      // Position is resolved from real-time live socket update if present, else database seed
      const livePos: MachinePositionUpdate | undefined = positions[machine.id];
      const lat = livePos ? livePos.lat : machine.current_lat;
      const lng = livePos ? livePos.lng : machine.current_lng;
      const speed = livePos ? livePos.speed_kmh : 0.0;
      const insideGeofence = livePos ? livePos.inside_geofence : true;
      const status = !insideGeofence ? 'breakdown' : (speed > 0 ? 'running' : machine.status);

      if (!lat || !lng) return;

      // Update trail history
      const trail = machineTrailsRef.current[machine.id] || [];
      trail.push([lat, lng]);
      if (trail.length > 25) trail.shift();
      machineTrailsRef.current[machine.id] = trail;

      // Draw breadcrumb trail line
      if (trailsLayerRef.current && trail.length > 1) {
        trailsLayerRef.current.clearLayers();
        const trailLine = L.polyline(trail, {
          color: '#FFCD11',
          weight: 2,
          opacity: 0.6,
        });
        trailsLayerRef.current.addLayer(trailLine);
      }

      // Pin Color Token
      let pinColor = '#2FA84F'; // green
      let pulseAnim = '';
      if (!insideGeofence) {
        pinColor = '#E23D3D'; // red
        pulseAnim = 'animate-ping';
      } else if (status === 'idle') {
        pinColor = '#FFCD11'; // yellow
      }

      // Check if marker already exists in cache
      let marker = markerInstancesRef.current[machine.id];

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <span class="absolute w-7 h-7 rounded-full bg-cat-black opacity-30"></span>
          <span class="absolute w-5 h-5 rounded-full ${pulseAnim}" style="background-color: ${pinColor}; opacity: 0.6;"></span>
          <div class="relative w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-black" style="background-color: ${pinColor}; color: ${status === 'idle' ? '#1A1A1A' : '#FFFFFF'};">
            ${machine.type === 'Dump Truck' ? '🚛' : machine.type === 'Excavator' ? '🏗️' : '🚜'}
          </div>
          <div class="absolute -bottom-5 whitespace-nowrap bg-cat-black/90 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow border border-cat-yellow/30 pointer-events-none">
            ${machine.machine_code}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-cat-machine-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      if (!marker) {
        marker = L.marker([lat, lng], { icon: customIcon }).addTo(machinesLayerRef.current);
        marker.on('click', () => {
          setSelectedMachine(machine);
          if (onSelectMachine) onSelectMachine(machine);
        });
        markerInstancesRef.current[machine.id] = marker;
      } else {
        // SMOOTH POSITION UPDATE
        marker.setLatLng([lat, lng]);
        marker.setIcon(customIcon);
      }

      // In operator mode, auto-follow current machine smoothly
      if (mode === 'operator' && operatorId) {
        const isAssigned = (operatorId === 3 && machine.machine_code.includes('Tipper')) ||
                           (operatorId === 1 && machine.machine_code.includes('320')) ||
                           (operatorId === 2 && machine.machine_code.includes('950'));
        if (isAssigned && mapInstanceRef.current) {
          // Soft pan
          mapInstanceRef.current.panTo([lat, lng], { animate: true, duration: 1.0 });
        }
      }
    });
  }, [positions, machinesData, machineIds, mode, operatorId, onSelectMachine]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-cat-gray-200 shadow-sm bg-white" style={{ height }}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Header: Live Sync Indicator & ETA Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="bg-cat-black/85 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl border border-cat-gray-700 flex items-center gap-2 shadow-lg pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-cat-green animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-cat-yellow flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" />
            {mode === 'admin' ? 'Fleet Command Map' : 'In-Cabin Synced HUD'}
          </span>
          <span className="text-[10px] text-cat-gray-500 font-semibold border-l border-cat-gray-700 pl-2">
            Tick: 2.0s
          </span>
        </div>

        {/* ETA Overlay for active route (Task T-003 or operator task) */}
        {activeRoute && (
          <div className="bg-white/95 backdrop-blur-sm text-cat-black px-3 py-1.5 rounded-xl border border-cat-gray-200 shadow-lg flex items-center gap-2 pointer-events-auto">
            <Navigation className="w-3.5 h-3.5 text-cat-blue" />
            <div className="text-xs font-black">
              ETA: <span className="text-cat-blue">{activeRoute.duration_min} min</span>
            </div>
            <span className="text-cat-gray-200">•</span>
            <div className="text-xs font-semibold text-cat-gray-700">
              {activeRoute.distance_km} km ({activeRoute.from_location || 'Quarry'} ➔ {activeRoute.to_location || 'Zone B'})
            </div>
          </div>
        )}
      </div>

      {/* Selected Machine Telemetry Snippet Flyout */}
      {selectedMachine && (
        <div className="absolute bottom-4 right-4 z-20 w-80 bg-white/95 backdrop-blur-md border border-cat-gray-200 rounded-2xl shadow-xl p-4">
          <div className="flex items-center justify-between pb-2 border-b border-cat-gray-100">
            <div>
              <h4 className="font-black text-sm text-cat-black">{selectedMachine.machine_code}</h4>
              <p className="text-[10px] font-bold text-cat-gray-500 uppercase">{selectedMachine.model} • {selectedMachine.type}</p>
            </div>
            <button
              onClick={() => setSelectedMachine(null)}
              className="text-xs font-bold text-cat-gray-500 hover:text-cat-black"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <div className="p-2 bg-cat-gray-50 rounded-xl">
              <span className="text-[10px] font-bold text-cat-gray-500 uppercase">Hydraulic Temp</span>
              <p className="font-extrabold text-cat-black">{selectedMachine.hydraulic_temp}°C</p>
            </div>
            <div className="p-2 bg-cat-gray-50 rounded-xl">
              <span className="text-[10px] font-bold text-cat-gray-500 uppercase">Fuel Level</span>
              <p className="font-extrabold text-cat-black">{selectedMachine.fuel_level}%</p>
            </div>
            <div className="p-2 bg-cat-gray-50 rounded-xl">
              <span className="text-[10px] font-bold text-cat-gray-500 uppercase">Engine Hours</span>
              <p className="font-extrabold text-cat-black">{selectedMachine.engine_hours} hrs</p>
            </div>
            <div className="p-2 bg-cat-gray-50 rounded-xl">
              <span className="text-[10px] font-bold text-cat-gray-500 uppercase">Status</span>
              <p className="font-extrabold text-cat-green uppercase text-[11px]">{selectedMachine.status}</p>
            </div>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-cat-black/85 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-[10px] font-bold border border-cat-gray-700 shadow flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cat-green" /> Running
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cat-yellow" /> Idle
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cat-red" /> Breach / Alarm
        </div>
        <div className="flex items-center gap-1.5 border-l border-cat-gray-700 pl-2">
          <span className="w-3 h-1 bg-cat-blue rounded" /> Haul Corridor
        </div>
      </div>
    </div>
  );
};
