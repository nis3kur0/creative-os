export type ProjectArea = 'writing' | 'drawing' | 'programming' | 'other';
export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  area: ProjectArea;
  category?: string;
  status: ProjectStatus;
  color?: string;
  estimatedHours?: number;
  order?: number;
  created_at: string;
  updated_at: string;
}

export type EnergyId = 'E0' | 'E1' | 'E2' | 'E3';

export interface EnergyLevelConfig {
  id: EnergyId;
  name: string;
  description: string;
  levelNum: number;
  color: string;
  badgeClass: string;
}

export interface TaskSizeConfig {
  id: string;
  name: string;
  minMinutes: number;
  maxMinutes: number;
  label: string;
}

export interface TaskTypeConfig {
  id: string;
  name: string;
  iconName: string;
  color: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  type_id: string;
  size_id: string;
  energy_level: EnergyId;
  estimated_minutes: number;
  actual_minutes: number;
  priority: TaskPriority;
  next_step: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface InboxItem {
  id: string;
  user_id: string;
  content: string;
  category: string;
  project_id?: string | null;
  linkedProjectIds?: string[];
  created_at: string;
  status: 'unprocessed' | 'converted';
}

export interface Note {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  project_id: string | null;
  task_id: string | null;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
  energy_start: EnergyId;
  energy_end: EnergyId | null;
  notes: string;
}

export type InactivityTimeoutSetting = 'disabled' | '1m' | '5m' | '10m' | '15m' | '30m' | '1h';

export interface PasscodeSettings {
  passcodeHash: string | null;
  inactivityTimeout: InactivityTimeoutSetting;
  customTimeoutMinutes?: number;
  isLocked: boolean;
  lastActivity: number;
}

export interface AuthState {
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
  isDemo: boolean;
  supabaseUrl: string;
  supabaseKey: string;
}
