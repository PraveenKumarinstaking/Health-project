
export interface Reminder {
  id: string;
  time: string; // HH:mm format
  enabled: boolean;
  days?: number[]; // 0-6 for Sunday-Saturday
  message?: string; // Custom alarm message
}

export interface Medication {
  id: string;
  profileId: string; // Scoped to a specific family member
  name: string;
  dosage: string;
  frequency: string;
  timeOfDay: string[];
  remaining: number;
  total: number;
  instructions?: string;
  reminders: Reminder[];
}

export interface AdherenceRecord {
  date: string;
  profileId: string; // Scoped to a specific family member
  medicationId: string;
  taken: boolean;
  timeTaken?: string;
}

export interface HealthLog {
  id: string;
  profileId: string;
  date: string;
  type: 'blood_pressure' | 'glucose' | 'weight' | 'mood';
  value: string;
  unit: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: string;
  weight: string;
  bloodType: string;
  isDependent?: boolean;
  parentId?: string; // For family tree linking
  notifications: {
    enabled: boolean;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export enum NavigationTab {
  DASHBOARD = 'dashboard',
  MEDICATIONS = 'medications',
  HEALTH_SCANNER = 'health_scanner',
  AI_CONSULT = 'ai_consult',
  INSIGHTS = 'insights',
  PROFILE = 'profile',
  HELP_CENTER = 'help_center'
}
