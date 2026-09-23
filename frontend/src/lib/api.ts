const API_BASE = '/api';

export async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const response = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
  }
  return response.json();
}

export const api = {
  // Auth
  login: (pin: string, operator_code?: string, role?: string) =>
    fetchJson<{ token: string; role: string; user_id: number; operator_code?: string; name: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ pin, operator_code, role }) }
    ),

  // Operators
  getOperators: () => fetchJson<any[]>('/operators'),
  getOperator: (id: number) => fetchJson<any>(`/operators/${id}`),
  getOperatorPerformance: (id: number) => fetchJson<any>(`/operators/${id}/performance`),
  createOperator: (data: any) => {
    const token = localStorage.getItem('token');
    return fetchJson<any>('/admin/operators', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  },

  // Machines
  getMachines: () => fetchJson<any[]>('/machines'),
  getMachine: (id: number) => fetchJson<any>(`/machines/${id}`),
  getMachineTelemetry: (id: number, limit = 40) => fetchJson<any[]>(`/machines/${id}/telemetry?limit=${limit}`),
  getMachinePosition: (id: number) => fetchJson<any>(`/machines/${id}/position`),

  // Zones
  getZones: () => fetchJson<any[]>('/zones'),

  // Shifts
  getShifts: () => fetchJson<any[]>('/shifts'),
  getShiftAssignments: () => fetchJson<any[]>('/shifts/assignments'),

  // Tasks
  getTasks: (operatorId?: number, status?: string) => {
    let url = '/tasks';
    const params = new URLSearchParams();
    if (operatorId) params.append('operator_id', operatorId.toString());
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;
    return fetchJson<any[]>(url);
  },
  getTask: (id: number) => fetchJson<any>(`/tasks/${id}`),
  getTaskRoute: (id: number) => fetchJson<any>(`/tasks/${id}/route`),
  createTask: (data: any) => fetchJson<any>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTaskStatus: (id: number, status: string, completed_quantity?: number) =>
    fetchJson<any>(`/tasks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, completed_quantity })
    }),

  // Weather
  checkWeather: (siteId = 'Site A') => fetchJson<any>(`/weather/check?site_id=${encodeURIComponent(siteId)}`),

  // Alerts
  getAlerts: (status?: string, machineId?: number) => {
    let url = '/alerts';
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (machineId) params.append('machine_id', machineId.toString());
    if (params.toString()) url += `?${params.toString()}`;
    return fetchJson<any[]>(url);
  },
  acknowledgeAlert: (id: number) => fetchJson<any>(`/alerts/${id}/acknowledge`, { method: 'PATCH' }),
  resolveAlert: (id: number) => fetchJson<any>(`/alerts/${id}/resolve`, { method: 'PATCH' }),

  // Incidents
  getIncidents: () => fetchJson<any[]>('/incidents'),
  getIncidentReplay: (id: number) => fetchJson<any>(`/incidents/${id}/replay`),

  // Copilot RAG
  askCopilot: (query_text: string, machine_id?: number, operator_id?: number) =>
    fetchJson<any>('/copilot/ask', {
      method: 'POST',
      body: JSON.stringify({ query_text, machine_id, operator_id })
    }),

  // ETA Prediction
  predictEta: (task_id: number) =>
    fetchJson<any>('/eta/predict', { method: 'POST', body: JSON.stringify({ task_id }) }),

  // Training
  getTrainingModules: () => fetchJson<any[]>('/training/modules'),
  getTrainingRecommendations: (operator_id: number) =>
    fetchJson<any[]>(`/training/recommendations/${operator_id}`),
  submitQuiz: (assignment_id: number, answers: number[]) =>
    fetchJson<any>('/training/quiz-submit', {
      method: 'POST',
      body: JSON.stringify({ assignment_id, answers })
    }),

  // Performance / Shift Summary
  getShiftSummary: (operator_id: number, task_id: number) =>
    fetchJson<any>(`/performance/shift-summary/${operator_id}/${task_id}`),

  // Safety Thresholds
  getThresholds: () => fetchJson<any>('/admin/thresholds'),
  updateThresholds: (data: any) =>
    fetchJson<any>('/admin/thresholds', { method: 'PUT', body: JSON.stringify(data) })
};
