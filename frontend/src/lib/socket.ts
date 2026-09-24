import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Use same host or port 8000
const SOCKET_URL = window.location.origin;

let locationSocket: Socket | null = null;
let telemetrySocket: Socket | null = null;
let alertsSocket: Socket | null = null;
let tasksSocket: Socket | null = null;

export function getTasksSocket(): Socket {
  if (!tasksSocket) {
    tasksSocket = io(`${SOCKET_URL}/tasks`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return tasksSocket;
}

export function getLocationSocket(): Socket {
  if (!locationSocket) {
    locationSocket = io(`${SOCKET_URL}/location`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return locationSocket;
}

export function getTelemetrySocket(): Socket {
  if (!telemetrySocket) {
    telemetrySocket = io(`${SOCKET_URL}/telemetry`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return telemetrySocket;
}

export function getAlertsSocket(): Socket {
  if (!alertsSocket) {
    alertsSocket = io(`${SOCKET_URL}/alerts`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return alertsSocket;
}

export interface MachinePositionUpdate {
  machine_id: number;
  task_id?: number | null;
  zone_id?: number | null;
  lat: number;
  lng: number;
  heading: number;
  speed_kmh: number;
  inside_geofence: boolean;
  timestamp: string;
}

export interface TelemetryUpdate {
  machine_id: number;
  fuel_level: number;
  hydraulic_temp: number;
  engine_hours: number;
  idle_seconds: number;
  seatbelt_status: boolean;
  speed_kmh: number;
  timestamp: string;
}

export interface AlertUpdate {
  id: number;
  alert_type: string;
  priority_rank: number;
  machine_id?: number | null;
  operator_id?: number | null;
  message: string;
  severity: string;
  status?: string;
  created_at: string;
}

// Hook for synchronized live locations
export function useLiveLocation(scope: { mode: 'admin' | 'operator'; operatorId?: number }) {
  const [positions, setPositions] = useState<Record<number, MachinePositionUpdate>>({});
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    const socket = getLocationSocket();

    const joinRoom = () => {
      if (scope.mode === 'admin') {
        socket.emit('join_admin_fleet');
      } else if (scope.mode === 'operator' && scope.operatorId) {
        socket.emit('join_operator_room', { operator_id: scope.operatorId });
      }
    };

    socket.on('connect', joinRoom);
    if (socket.connected) {
      joinRoom();
    }

    const handlePositionUpdate = (data: MachinePositionUpdate) => {
      setPositions((prev) => ({
        ...prev,
        [data.machine_id]: data,
      }));
      setLastUpdate(data.timestamp);
    };

    socket.on('position_update', handlePositionUpdate);

    return () => {
      socket.off('position_update', handlePositionUpdate);
      socket.off('connect', joinRoom);
    };
  }, [scope.mode, scope.operatorId]);

  return { positions, lastUpdate };
}

// Hook for live machine telemetry
export function useTelemetry(machineId?: number) {
  const [telemetry, setTelemetry] = useState<Record<number, TelemetryUpdate>>({});

  useEffect(() => {
    const socket = getTelemetrySocket();

    const handleUpdate = (data: TelemetryUpdate) => {
      if (!machineId || data.machine_id === machineId) {
        setTelemetry((prev) => ({
          ...prev,
          [data.machine_id]: data,
        }));
      }
    };

    socket.on('telemetry_update', handleUpdate);

    return () => {
      socket.off('telemetry_update', handleUpdate);
    };
  }, [machineId]);

  return { telemetry, currentTelemetry: machineId ? telemetry[machineId] : null };
}

// Hook for live alerts
export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertUpdate[]>([]);

  useEffect(() => {
    const socket = getAlertsSocket();

    const handleNewAlert = (data: AlertUpdate) => {
      setAlerts((prev) => [data, ...prev.filter((a) => a.id !== data.id)]);
    };

    const handleResolved = (data: { id: number }) => {
      setAlerts((prev) => prev.filter((a) => a.id !== data.id));
    };

    socket.on('new_alert', handleNewAlert);
    socket.on('alert_resolved', handleResolved);

    return () => {
      socket.off('new_alert', handleNewAlert);
      socket.off('alert_resolved', handleResolved);
    };
  }, []);

  return { alerts, setAlerts };
}
