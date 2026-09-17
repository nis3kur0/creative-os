import { writable, get } from 'svelte/store';
import type { Session, EnergyId } from '../types';
import { getSupabase } from '../services/supabaseClient';

const STORAGE_SESSIONS_KEY = 'creative_os_sessions';

function getStoredSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_SESSIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored sessions:', e);
  }
  return [];
}

export interface ActiveTimer {
  isRunning: boolean;
  taskId: string | null;
  projectId: string | null;
  taskTitle: string | null;
  startTime: number | null;
  elapsedSeconds: number;
  energyStart: EnergyId;
}

function createSessionsStore() {
  const { subscribe, update } = writable<Session[]>(getStoredSessions());

  const activeTimerStore = writable<ActiveTimer>({
    isRunning: false,
    taskId: null,
    projectId: null,
    taskTitle: null,
    startTime: null,
    elapsedSeconds: 0,
    energyStart: 'E2'
  });

  let timerInterval: any = null;

  function persist(sessions: Session[]) {
    localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
  }

  return {
    subscribe,
    activeTimer: activeTimerStore,
    startTimer: (taskId: string | null, projectId: string | null, title: string | null, energyStart: EnergyId = 'E2') => {
      activeTimerStore.set({
        isRunning: true,
        taskId,
        projectId,
        taskTitle: title,
        startTime: Date.now(),
        elapsedSeconds: 0,
        energyStart
      });

      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        activeTimerStore.update(t => t.isRunning ? { ...t, elapsedSeconds: t.elapsedSeconds + 1 } : t);
      }, 1000);
    },
    stopAndSaveTimer: async (energyEnd: EnergyId, notes: string = '', user_id: string = 'demo-user') => {
      const active = get(activeTimerStore);

      if (timerInterval) clearInterval(timerInterval);
      
      if (!active || !active.startTime || active.elapsedSeconds < 2) {
        activeTimerStore.set({
          isRunning: false,
          taskId: null,
          projectId: null,
          taskTitle: null,
          startTime: null,
          elapsedSeconds: 0,
          energyStart: 'E2'
        });
        return null;
      }

      const newSession: Session = {
        id: 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        user_id,
        project_id: active.projectId,
        task_id: active.taskId,
        start_time: new Date(active.startTime).toISOString(),
        end_time: new Date().toISOString(),
        duration_seconds: active.elapsedSeconds,
        energy_start: active.energyStart,
        energy_end: energyEnd,
        notes: notes || (active.taskTitle ? `Sesión de foco: ${active.taskTitle}` : 'Sesión de trabajo libre')
      };

      const supabase = getSupabase();
      if (supabase && user_id !== 'demo-user') {
        try {
          await supabase.from('sessions').insert(newSession);
        } catch (e) {
          console.warn('Supabase insert session error:', e);
        }
      }

      update(list => {
        const next = [newSession, ...list];
        persist(next);
        return next;
      });

      activeTimerStore.set({
        isRunning: false,
        taskId: null,
        projectId: null,
        taskTitle: null,
        startTime: null,
        elapsedSeconds: 0,
        energyStart: 'E2'
      });

      return newSession;
    },
    discardTimer: () => {
      if (timerInterval) clearInterval(timerInterval);
      activeTimerStore.set({
        isRunning: false,
        taskId: null,
        projectId: null,
        taskTitle: null,
        startTime: null,
        elapsedSeconds: 0,
        energyStart: 'E2'
      });
    },
    deleteSession: async (id: string) => {
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('sessions').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase delete session error:', e);
        }
      }

      update(list => {
        const next = list.filter(s => s.id !== id);
        persist(next);
        return next;
      });
    }
  };
}

export const sessionsStore = createSessionsStore();
