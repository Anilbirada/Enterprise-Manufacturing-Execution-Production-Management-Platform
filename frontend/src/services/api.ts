const API_BASE = '/api';

export interface OfflineAction {
  id: string;
  url: string;
  method: string;
  body: any;
  timestamp: number;
}

class ApiService {
  private token: string | null = null;
  private plantId: string | null = null;
  private offlineQueueKey = 'rsr_mes_offline_queue';

  constructor() {
    this.token = localStorage.getItem('rsr_auth_token');
    this.plantId = localStorage.getItem('rsr_active_plant_id');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('rsr_auth_token', token);
    else localStorage.removeItem('rsr_auth_token');
  }

  public setPlantId(plantId: string | null) {
    this.plantId = plantId;
    if (plantId) localStorage.setItem('rsr_active_plant_id', plantId);
    else localStorage.removeItem('rsr_active_plant_id');
  }

  public getPlantId() {
    return this.plantId;
  }

  public async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.plantId) {
      headers['x-plant-id'] = this.plantId;
    }

    const config: RequestInit = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);

      // Handle CSV or Excel blob downloads
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/csv') || contentType.includes('spreadsheetml') || contentType.includes('octet-stream')) {
        const blob = await response.blob();
        return blob as unknown as T;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err: any) {
      // If network is offline and it's an operator booking action, queue it in offline queue
      if (!navigator.onLine && (options.method === 'POST' || options.method === 'PUT')) {
        this.enqueueOfflineAction({
          id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          url: endpoint,
          method: options.method,
          body: options.body ? JSON.parse(options.body as string) : undefined,
          timestamp: Date.now()
        });
        throw new Error('Device is currently offline. Action has been saved to the shop-floor offline queue and will sync automatically when connection resumes.');
      }
      throw err;
    }
  }

  public async get<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T = any>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  public async put<T = any>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  public async delete<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Offline queue operations
  public getOfflineQueue(): OfflineAction[] {
    try {
      const stored = localStorage.getItem(this.offlineQueueKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public enqueueOfflineAction(action: OfflineAction) {
    const queue = this.getOfflineQueue();
    queue.push(action);
    localStorage.setItem(this.offlineQueueKey, JSON.stringify(queue));
  }

  public async syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;
    const remaining: OfflineAction[] = [];

    for (const action of queue) {
      try {
        await this.request(action.url, {
          method: action.method,
          body: JSON.stringify(action.body)
        });
        synced++;
      } catch (err) {
        console.error('[Offline Sync Error]', err);
        failed++;
        remaining.push(action);
      }
    }

    localStorage.setItem(this.offlineQueueKey, JSON.stringify(remaining));
    return { synced, failed };
  }
}

export const api = new ApiService();
export default api;
