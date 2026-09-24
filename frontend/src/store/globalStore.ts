import { create } from 'zustand';
import { api } from '../lib/api';
import { getAlertsSocket, getLocationSocket, getTelemetrySocket, getTasksSocket, AlertUpdate, MachinePositionUpdate, TelemetryUpdate } from '../lib/socket';

interface GlobalState {
  machines: any[];
  operators: any[];
  tasks: any[];
  zones: any[];
  alerts: AlertUpdate[];
  livePositions: Record<number, MachinePositionUpdate>;
  liveTelemetry: Record<number, TelemetryUpdate>;
  initialized: boolean;
  
  // Actions
  fetchInitialData: () => Promise<void>;
  updateMachine: (machineId: number, data: any) => void;
  updateOperator: (operatorId: number, data: any) => void;
  upsertTask: (task: any) => void;
  addAlert: (alert: AlertUpdate) => void;
  resolveAlert: (alertId: number) => void;
  updatePosition: (pos: MachinePositionUpdate) => void;
  updateTelemetry: (tel: TelemetryUpdate) => void;
  
  // Derived state getters
  getActiveMachinesCount: () => number;
  getActiveOperatorsCount: () => number;
  getTasksToday: () => any[];
}

export const useGlobalStore = create<GlobalState>((set, get) => ({
  machines: [],
  operators: [],
  tasks: [],
  zones: [],
  alerts: [],
  livePositions: {},
  liveTelemetry: {},
  initialized: false,

  fetchInitialData: async () => {
    try {
      const [machines, operators, tasks, zones] = await Promise.all([
        api.getMachines(),
        api.getOperators(),
        api.getTasks(),
        api.getZones(),
      ]);
      set({ machines, operators, tasks, zones, initialized: true });
    } catch (e) {
      console.error('Failed to fetch initial state', e);
    }
  },

  updateMachine: (machineId, data) => set((state) => ({
    machines: state.machines.map(m => m.id === machineId ? { ...m, ...data } : m)
  })),

  updateOperator: (operatorId, data) => set((state) => {
    // If it's a soft delete and status is inactive, we might filter it out or keep it depending on views.
    return {
      operators: state.operators.map(o => o.id === operatorId ? { ...o, ...data } : o)
    };
  }),

  upsertTask: (task) => set((state) => {
    const exists = state.tasks.find(t => t.id === task.id);
    if (exists) {
      return { tasks: state.tasks.map(t => t.id === task.id ? { ...t, ...task } : t) };
    }
    return { tasks: [task, ...state.tasks] };
  }),

  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts.filter(a => a.id !== alert.id)]
  })),

  resolveAlert: (alertId) => set((state) => ({
    alerts: state.alerts.filter(a => a.id !== alertId)
  })),

  updatePosition: (pos) => set((state) => ({
    livePositions: { ...state.livePositions, [pos.machine_id]: pos }
  })),

  updateTelemetry: (tel) => set((state) => ({
    liveTelemetry: { ...state.liveTelemetry, [tel.machine_id]: tel }
  })),

  getActiveMachinesCount: () => get().machines.filter(m => m.status === 'assigned' || m.status === 'Running').length,
  getActiveOperatorsCount: () => get().operators.filter(o => o.status === 'assigned' || o.status === 'active').length, // depends on exact status codes
  getTasksToday: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().tasks.filter(t => t.start_time?.startsWith(today));
  }
}));

// Initialize socket listeners to bind directly to Zustand
export function bindSocketsToStore() {
  const alertsSocket = getAlertsSocket();
  const locationSocket = getLocationSocket();
  const telemetrySocket = getTelemetrySocket();
  const tasksSocket = getTasksSocket();

  // Tasks
  tasksSocket.on('new_task', (task) => {
    useGlobalStore.getState().upsertTask(task);
  });

  alertsSocket.on('new_alert', (data: AlertUpdate) => {
    useGlobalStore.getState().addAlert(data);
  });

  alertsSocket.on('alert_resolved', (data: { id: number }) => {
    useGlobalStore.getState().resolveAlert(data.id);
  });

  locationSocket.on('position_update', (data: MachinePositionUpdate) => {
    useGlobalStore.getState().updatePosition(data);
  });

  telemetrySocket.on('telemetry_update', (data: TelemetryUpdate) => {
    useGlobalStore.getState().updateTelemetry(data);
  });

  // Future domain events:
  // socket.on('task_updated', (task) => useGlobalStore.getState().upsertTask(task));
  // socket.on('machine_status_changed', (machine) => useGlobalStore.getState().updateMachine(machine.id, machine));
}
