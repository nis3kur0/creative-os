import { writable } from 'svelte/store';
import type { Project } from '../types';
import { INITIAL_DEMO_PROJECTS } from '../constants/defaults';
import { getSupabase } from '../services/supabaseClient';

const STORAGE_PROJECTS_KEY = 'creative_os_projects';

function getStoredProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored projects:', e);
  }
  return INITIAL_DEMO_PROJECTS;
}

function createProjectsStore() {
  const { subscribe, set, update } = writable<Project[]>(getStoredProjects());

  function persist(projects: Project[]) {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
  }

  async function syncFromSupabase() {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        set(data as Project[]);
        persist(data as Project[]);
      }
    } catch (e) {
      console.warn('Supabase fetch projects error:', e);
    }
  }

  return {
    subscribe,
    syncFromSupabase,
    addProject: async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
      const newProj: Project = {
        ...projectData,
        id: 'proj-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        order: projectData.order ?? Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const supabase = getSupabase();
      if (supabase && projectData.user_id !== 'demo-user') {
        try {
          await supabase.from('projects').insert(newProj);
        } catch (e) {
          console.warn('Supabase insert project error:', e);
        }
      }

      update(list => {
        const next = [newProj, ...list];
        persist(next);
        return next;
      });
      return newProj;
    },
    reorderProjects: (orderedIds: string[]) => {
      update(list => {
        const map = new Map(list.map((project, index) => [project.id, { project, index }]));
        const reordered = orderedIds
          .map(id => map.get(id)?.project)
          .filter(Boolean) as Project[];
        const remaining = list.filter(project => !orderedIds.includes(project.id));
        const next = [...reordered, ...remaining].map((project, index) => ({ ...project, order: index }));
        persist(next);
        return next;
      });
    },
    updateProject: async (id: string, patch: Partial<Project>) => {
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('projects').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
        } catch (e) {
          console.warn('Supabase update project error:', e);
        }
      }

      update(list => {
        const next = list.map(p => p.id === id ? { ...p, ...patch, updated_at: new Date().toISOString() } : p);
        persist(next);
        return next;
      });
    },
    deleteProject: async (id: string) => {
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('projects').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase delete project error:', e);
        }
      }

      update(list => {
        const next = list.filter(p => p.id !== id);
        persist(next);
        return next;
      });
    },
    resetToDemo: () => {
      set(INITIAL_DEMO_PROJECTS);
      persist(INITIAL_DEMO_PROJECTS);
    }
  };
}

export const projectsStore = createProjectsStore();
