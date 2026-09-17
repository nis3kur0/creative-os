import { writable } from 'svelte/store';
import type { Note } from '../types';
import { INITIAL_DEMO_NOTES } from '../constants/defaults';
import { getSupabase } from '../services/supabaseClient';

const STORAGE_NOTES_KEY = 'creative_os_notes';

function getStoredNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_NOTES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored notes:', e);
  }
  return INITIAL_DEMO_NOTES;
}

function createNotesStore() {
  const { subscribe, set, update } = writable<Note[]>(getStoredNotes());

  function persist(notes: Note[]) {
    localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(notes));
  }

  async function syncFromSupabase() {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
      if (!error && data) {
        set(data as Note[]);
        persist(data as Note[]);
      }
    } catch (e) {
      console.warn('Supabase fetch notes error:', e);
    }
  }

  return {
    subscribe,
    syncFromSupabase,
    addNote: async (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => {
      const newNote: Note = {
        ...noteData,
        id: 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const supabase = getSupabase();
      if (supabase && noteData.user_id !== 'demo-user') {
        try {
          await supabase.from('notes').insert(newNote);
        } catch (e) {
          console.warn('Supabase insert note error:', e);
        }
      }

      update(list => {
        const next = [newNote, ...list];
        persist(next);
        return next;
      });
      return newNote;
    },
    updateNote: async (id: string, patch: Partial<Note>) => {
      const updated_at = new Date().toISOString();
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('notes').update({ ...patch, updated_at }).eq('id', id);
        } catch (e) {
          console.warn('Supabase update note error:', e);
        }
      }

      update(list => {
        const next = list.map(n => n.id === id ? { ...n, ...patch, updated_at } : n);
        persist(next);
        return next;
      });
    },
    deleteNote: async (id: string) => {
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('notes').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase delete note error:', e);
        }
      }

      update(list => {
        const next = list.filter(n => n.id !== id);
        persist(next);
        return next;
      });
    },
    resetToDemo: () => {
      set(INITIAL_DEMO_NOTES);
      persist(INITIAL_DEMO_NOTES);
    }
  };
}

export const notesStore = createNotesStore();
