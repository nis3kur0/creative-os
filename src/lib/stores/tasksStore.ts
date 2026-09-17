import { writable } from 'svelte/store';
import type { Task, EnergyId, TaskPriority } from '../types';
import { INITIAL_DEMO_TASKS } from '../constants/defaults';
import { getSupabase } from '../services/supabaseClient';

const STORAGE_TASKS_KEY = 'creative_os_tasks';

function getStoredTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_TASKS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored tasks:', e);
  }
  return INITIAL_DEMO_TASKS;
}

const energyOrder: Record<EnergyId, number> = {
  E0: 0,
  E1: 1,
  E2: 2,
  E3: 3
};

const priorityOrder: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1
};

function createTasksStore() {
  const { subscribe, set, update } = writable<Task[]>(getStoredTasks());

  function persist(tasks: Task[]) {
    localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(tasks));
  }

  async function syncFromSupabase() {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        set(data as Task[]);
        persist(data as Task[]);
      }
    } catch (e) {
      console.warn('Supabase fetch tasks error:', e);
    }
  }

  return {
    subscribe,
    syncFromSupabase,
    addTask: async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'completed_at'>) => {
      const newTask: Task = {
        ...taskData,
        id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null
      };

      const supabase = getSupabase();
      if (supabase && taskData.user_id !== 'demo-user') {
        try {
          await supabase.from('tasks').insert(newTask);
        } catch (e) {
          console.warn('Supabase insert task error:', e);
        }
      }

      update(list => {
        const next = [newTask, ...list];
        persist(next);
        return next;
      });
      return newTask;
    },
    updateTask: async (id: string, patch: Partial<Task>) => {
      const isCompleting = patch.status === 'completed';
      const updateObj = {
        ...patch,
        updated_at: new Date().toISOString(),
        ...(isCompleting ? { completed_at: new Date().toISOString() } : {})
      };

      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('tasks').update(updateObj).eq('id', id);
        } catch (e) {
          console.warn('Supabase update task error:', e);
        }
      }

      update(list => {
        const next = list.map(t => t.id === id ? { ...t, ...updateObj } : t);
        persist(next);
        return next;
      });
    },
    deleteTask: async (id: string) => {
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('tasks').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase delete task error:', e);
        }
      }

      update(list => {
        const next = list.filter(t => t.id !== id);
        persist(next);
        return next;
      });
    },
    resetToDemo: () => {
      set(INITIAL_DEMO_TASKS);
      persist(INITIAL_DEMO_TASKS);
    }
  };
}

export const tasksStore = createTasksStore();

// Helper filter function
export function getCompatibleTasks(tasks: Task[], availableMinutes: number, userEnergy: EnergyId): Task[] {
  const userEnergyLevel = energyOrder[userEnergy] ?? 2;

  return tasks
    .filter(task => {
      if (task.status === 'completed') return false;
      const taskMinutes = task.estimated_minutes || 15;
      const taskEnergy = energyOrder[task.energy_level] ?? 2;

      return taskMinutes <= availableMinutes && taskEnergy <= userEnergyLevel;
    })
    .sort((a, b) => {
      const pDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}
