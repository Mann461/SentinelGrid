import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : 'https://sentinelgrid-gibj.onrender.com');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Request Interceptor to attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sentinel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const authAPI = {
  login: async (username, password, department) => {
    const res = await api.post('/auth/login', { username, password, department });
    if (res.data.access_token) {
      localStorage.setItem('sentinel_token', res.data.access_token);
      localStorage.setItem('sentinel_user', JSON.stringify(res.data));
    }
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('sentinel_token');
    localStorage.removeItem('sentinel_user');
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('sentinel_user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export const cameraAPI = {
  getCameras: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.department_id) params.append('department_id', filters.department_id);
    if (filters.region) params.append('region', filters.region);
    if (filters.status) params.append('status', filters.status);
    if (filters.is_legacy !== undefined && filters.is_legacy !== null) params.append('is_legacy', filters.is_legacy);
    if (filters.is_tagged_live_test) params.append('is_tagged_live_test', true);
    if (filters.cross_department) params.append('cross_department', true);

    const res = await api.get(`/cameras?${params.toString()}`);
    return res.data;
  },
  onboardSingle: async (cameraData) => {
    const res = await api.post('/cameras', cameraData);
    return res.data;
  },
  onboardBulk: async (camerasList) => {
    const res = await api.post('/cameras/bulk-upload', { cameras: camerasList });
    return res.data;
  },
  getUncoveredZones: async (radiusKm = 5.0, minDensity = 3) => {
    const res = await api.get(`/cameras/uncovered-zones?radius_km=${radiusKm}&min_density=${minDensity}`);
    return res.data;
  },
  getCameraAuditLog: async (id) => {
    const res = await api.get(`/cameras/${id}/audit-log`);
    return res.data;
  }
};

export const watchlistAPI = {
  getEntries: async (category = null) => {
    const url = category ? `/watchlist?category=${category}` : '/watchlist';
    const res = await api.get(url);
    return res.data;
  },
  createEntry: async (entryData) => {
    const res = await api.post('/watchlist', entryData);
    return res.data;
  }
};

export const eventsAPI = {
  simulateDetection: async (detectionData) => {
    const res = await api.post('/simulate/detection', detectionData);
    return res.data;
  },
  trackVehicle: async (plateNumber) => {
    const res = await api.get(`/vehicle-track/${encodeURIComponent(plateNumber)}`);
    return res.data;
  },
  predictVehicleRoute: async (plateNumber) => {
    const res = await api.get(`/vehicle-track/${encodeURIComponent(plateNumber)}/predict`);
    return res.data;
  },
  getDispatchOrder: async (plateNumber) => {
    const res = await api.get(`/vehicle-track/${encodeURIComponent(plateNumber)}/dispatch-order`);
    return res.data;
  },
  searchEvents: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.query) params.append('query', filters.query);
    if (filters.event_type) params.append('event_type', filters.event_type);
    if (filters.camera_id) params.append('camera_id', filters.camera_id);

    const res = await api.get(`/events/search?${params.toString()}`);
    return res.data;
  }
};

export const alertsAPI = {
  getAlerts: async (statusFilter = null) => {
    const url = statusFilter ? `/alerts?status=${statusFilter}` : '/alerts';
    const res = await api.get(url);
    return res.data;
  },
  updateStatus: async (id, status, officerId = null) => {
    const res = await api.patch(`/alerts/${id}/status`, { status, assigned_officer_id: officerId });
    return res.data;
  }
};

export const systemAPI = {
  getDRStatus: async () => {
    const res = await api.get('/system/dr-status');
    return res.data;
  },
  toggleDRMode: async () => {
    const res = await api.post('/system/dr-toggle');
    return res.data;
  },
  getAdapters: async () => {
    const res = await api.get('/system/adapters');
    return res.data;
  },
  getAuditLogs: async (action = null) => {
    const url = action ? `/system/audit-logs?action=${action}` : '/system/audit-logs';
    const res = await api.get(url);
    return res.data;
  },
  trainAIModel: async (datasetType = "indian_anpr_realworld", epochs = 10, batchSize = 32) => {
    const res = await api.post(`/system/train-model?dataset_type=${encodeURIComponent(datasetType)}&epochs=${epochs}&batch_size=${batchSize}`);
    return res.data;
  },
  harvestOSM: async () => {
    const res = await api.post('/system/harvest-osm-data');
    return res.data;
  },
  getAIMetrics: async () => {
    const res = await api.get('/system/ai-model-metrics');
    return res.data;
  },
  processLiveFrame: async (cameraName = "Webcam Control Node", plateText = "GJ-01-AB-1234") => {
    const res = await api.post(`/system/process-live-frame?camera_name=${encodeURIComponent(cameraName)}&detected_identifier=${encodeURIComponent(plateText)}`);
    return res.data;
  },
  compareFaceEmbeddings: async (probeId = "FACE-2026-SUSPECT-001", galleryId = "WL-PERSON-001") => {
    const res = await api.post(`/system/face-compare?probe_id=${encodeURIComponent(probeId)}&gallery_id=${encodeURIComponent(galleryId)}`);
    return res.data;
  }
};

export const sentinelGridAPI = {
  getCameras: async () => {
    const res = await api.get('/sentinel-grid/cameras');
    return res.data;
  },
  getChecklist: async () => {
    const res = await api.get('/sentinel-grid/checklist');
    return res.data;
  },
  configureCredentials: async (email, password) => {
    const res = await api.post('/sentinel-grid/configure-credentials', { email, password });
    return res.data;
  },
  syncCatalog: async () => {
    const res = await api.post('/sentinel-grid/sync-catalog');
    return res.data;
  },
  getSnapshotUrl: (camId, preferHls = false) => {
    return `${API_BASE}/sentinel-grid/stream/${camId}/snapshot?prefer_hls=${preferHls}&t=${Date.now()}`;
  }
};

export function connectWebSocket(onMessageCallback) {
  let wsUrl = import.meta.env.VITE_WS_BASE;
  if (!wsUrl) {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const wsProto = isHttps ? 'wss://' : 'ws://';
    if (API_BASE.startsWith('http')) {
      const host = API_BASE.replace(/^https?:\/\//, '');
      wsUrl = `${wsProto}${host}/ws/alerts`;
    } else {
      wsUrl = `${wsProto}${window.location.host}/ws/alerts`;
    }
  }
  let ws = new WebSocket(wsUrl);


  ws.onopen = () => {
    console.log('Connected to SentinelGrid Alert WebSocket');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessageCallback(data);
    } catch (e) {
      console.error('Failed to parse WS alert data', e);
    }
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed. Reconnecting in 3s...');
    setTimeout(() => connectWebSocket(onMessageCallback), 3000);
  };

  return ws;
}

export default api;
