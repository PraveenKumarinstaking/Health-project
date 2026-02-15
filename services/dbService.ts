
import { Medication, AdherenceRecord, HealthLog, UserProfile } from '../types';

const API_BASE = 'http://localhost:8000/api';

/**
 * Service to handle data persistence with the FastAPI backend database.
 * Includes a robust local fallback to prevent "Failed to fetch" errors if the server is offline.
 */
export const dbService = {
  activeEmail: localStorage.getItem('health_ai_active_email') || '',

  setActiveUser(email: string) {
    this.activeEmail = email;
    localStorage.setItem('health_ai_active_email', email);
  },

  clearActiveUser() {
    this.activeEmail = '';
    localStorage.removeItem('health_ai_active_email');
  },

  async isServerOnline(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1200); // Quick check
      const endpoint = '/api/medications'; // Basic endpoint
      const response = await fetch(`${API_BASE}${endpoint}`, { 
        signal: controller.signal,
        method: 'HEAD'
      });
      clearTimeout(id);
      return response.ok || response.status === 401; // 401 means server is there but needs auth
    } catch {
      return false;
    }
  },

  async request(endpoint: string, options?: RequestInit) {
    if (!this.activeEmail && !['/login', '/register'].includes(endpoint)) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Shorter timeout for better UX
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers as any,
    };

    if (this.activeEmail) {
      headers['X-User-Email'] = this.activeEmail;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server Error: ${response.status}`);
      }
      return await response.json();
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError' || e instanceof TypeError || e.message === "Failed to fetch") {
        throw new Error("SERVER_OFFLINE");
      }
      throw e;
    }
  },

  // --- Auth Methods with Emulation Fallback ---
  
  async signUp(name: string, email: string, password: string) {
    const targetEmail = email.toLowerCase();
    try {
      const result = await this.request('/register', {
        method: 'POST',
        body: JSON.stringify({ name, email: targetEmail, password }),
      });
      this.setActiveUser(targetEmail);
      return result;
    } catch (e: any) {
      console.warn("Server registration failed or offline, storing user in local vault.");
      const users = this.getLocal('emulated_users', {}, true);
      
      if (e.message && e.message.includes("exists")) throw e;

      users[targetEmail] = { name, password, email: targetEmail, id: `local-${Date.now()}` };
      this.setLocal('emulated_users', users, true);
      this.setActiveUser(targetEmail);
      return { status: "success", user: { name, email: targetEmail }, isLocal: true };
    }
  },

  async signIn(email: string, password: string) {
    const DEMO_EMAIL = "admin@example.com";
    const DEMO_PASS = "password123";
    const targetEmail = email.toLowerCase();

    // 1. Guaranteed Demo Account (Bypasses network)
    if (targetEmail === DEMO_EMAIL && password === DEMO_PASS) {
      this.setActiveUser(DEMO_EMAIL);
      return { status: "success", user: { name: "Demo User", email: DEMO_EMAIL }, isLocal: true };
    }

    try {
      // 2. Try Backend
      const result = await this.request('/login', {
        method: 'POST',
        body: JSON.stringify({ email: targetEmail, password }),
      });
      this.setActiveUser(targetEmail);
      return result;
    } catch (e: any) {
      // 3. Robust Local Fallback
      const users = this.getLocal('emulated_users', {}, true);
      const user = users[targetEmail];
      
      if (user) {
        if (user.password === password) {
          this.setActiveUser(targetEmail);
          return { status: "success", user: { name: user.name, email: user.email }, isLocal: true };
        } else {
          throw new Error("INVALID_PASSWORD");
        }
      }

      // Re-throw meaningful errors
      if (e.message === "SERVER_OFFLINE") throw new Error("SERVER_OFFLINE");
      if (e.message.includes('401') || e.message.includes('credentials')) throw new Error("INVALID_PASSWORD");
      
      throw new Error("ACCOUNT_NOT_FOUND");
    }
  },

  // --- Data Methods ---

  async getMedications(): Promise<Medication[]> {
    if (!this.activeEmail) return [];
    try {
      const data = await this.request('/medications');
      this.setLocal('medications', data);
      return data;
    } catch (e) {
      return this.getLocal('medications', []);
    }
  },

  async saveMedications(meds: Medication[]): Promise<void> {
    if (!this.activeEmail) return;
    this.setLocal('medications', meds);
    try {
      await this.request('/medications', {
        method: 'POST',
        body: JSON.stringify(meds),
      });
    } catch (e) {
      console.warn("Medications cached locally (Offline).");
    }
  },

  async deleteMedication(id: string): Promise<void> {
    if (!this.activeEmail) return;
    const meds = this.getLocal('medications', []);
    const updated = meds.filter((m: any) => m.id !== id);
    await this.saveMedications(updated);
  },

  async getAdherence(): Promise<AdherenceRecord[]> {
    if (!this.activeEmail) return [];
    try {
      const data = await this.request('/adherence');
      this.setLocal('adherence', data);
      return data;
    } catch (e) {
      return this.getLocal('adherence', []);
    }
  },

  async saveAdherence(records: AdherenceRecord[]): Promise<void> {
    if (!this.activeEmail) return;
    this.setLocal('adherence', records);
    try {
      await this.request('/adherence', {
        method: 'POST',
        body: JSON.stringify(records),
      });
    } catch (e) {
      console.warn("Adherence cached locally.");
    }
  },

  async getLogs(): Promise<HealthLog[]> {
    if (!this.activeEmail) return [];
    try {
      const data = await this.request('/logs');
      this.setLocal('health_logs', data);
      return data;
    } catch (e) {
      return this.getLocal('health_logs', []);
    }
  },

  async saveLogs(logs: HealthLog[]): Promise<void> {
    if (!this.activeEmail) return;
    this.setLocal('health_logs', logs);
    try {
      await this.request('/logs', {
        method: 'POST',
        body: JSON.stringify(logs),
      });
    } catch (e) {
      console.warn("Logs cached locally.");
    }
  },

  async getUserProfile(): Promise<UserProfile | null> {
    if (!this.activeEmail) return null;
    try {
      const data = await this.request('/profile');
      if (data) {
        this.setLocal('user_profile', data);
        return data;
      }
      return this.getLocal('user_profile', null);
    } catch (e) {
      return this.getLocal('user_profile', null);
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (!this.activeEmail) return;
    this.setLocal('user_profile', profile);
    try {
      await this.request('/profile', {
        method: 'POST',
        body: JSON.stringify(profile),
      });
    } catch (e) {
      console.warn("Profile stored locally.");
    }
  },

  // --- LocalStorage Utilities ---

  getLocal(key: string, defaultValue: any, isGlobal: boolean = false) {
    const prefix = (!isGlobal && this.activeEmail) ? `_${this.activeEmail}` : '';
    const stored = localStorage.getItem(`health_ai_cache${prefix}_${key}`);
    return (stored && stored !== 'undefined') ? JSON.parse(stored) : defaultValue;
  },

  setLocal(key: string, value: any, isGlobal: boolean = false) {
    const prefix = (!isGlobal && this.activeEmail) ? `_${this.activeEmail}` : '';
    localStorage.setItem(`health_ai_cache${prefix}_${key}`, JSON.stringify(value));
  },

  resetAll() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('health_ai')) {
        localStorage.removeItem(key);
      }
    });
    this.activeEmail = '';
    localStorage.removeItem('health_ai_active_email');
  }
};
