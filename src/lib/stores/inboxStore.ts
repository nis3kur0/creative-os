import { writable } from 'svelte/store';
import type { InboxItem } from '../types';
import { INITIAL_DEMO_INBOX } from '../constants/defaults';
import { getSupabase } from '../services/supabaseClient';

const STORAGE_INBOX_KEY = 'creative_os_inbox';

function getStoredInbox(): InboxItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_INBOX_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored inbox:', e);
  }
  return INITIAL_DEMO_INBOX;
}

function createInboxStore() {
  const { subscribe, set, update } = writable<InboxItem[]>(getStoredInbox());

  function persist(items: InboxItem[]) {
    localStorage.setItem(STORAGE_INBOX_KEY, JSON.stringify(items));
  }

  async function syncFromSupabase() {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('inbox').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        set(data as InboxItem[]);
        persist(data as InboxItem[]);
      }
    } catch (e) {
      console.warn('Supabase fetch inbox error:', e);
    }
  }

  return {
    subscribe,
    syncFromSupabase,
    addInboxItem: async (content: string, user_id: string = 'demo-user', category: string = 'Ideas', linkedProjectIds: string[] = []) => {
      if (!content.trim()) return;

      const newItem: InboxItem = {
        id: 'inbox-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        user_id,
        content: content.trim(),
        category: category.trim() || 'Ideas',
        linkedProjectIds: linkedProjectIds || [],
        created_at: new Date().toISOString(),
        status: 'unprocessed'
      };

      const supabase = getSupabase();
      if (supabase && user_id !== 'demo-user') {
        try {
          await supabase.from('inbox').insert(newItem);
        } catch (e) {
          console.warn('Supabase insert inbox error:', e);
        }
      }

      update(list => {
        const next = [newItem, ...list];
        persist(next);
        return next;
      });
      return newItem;
    },
    linkProjects: async (id: string, linkedProjectIds: string[]) => {
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('inbox').update({ linkedProjectIds }).eq('id', id);
        } catch (e) {
          console.warn('Supabase link project error:', e);
        }
      }

      update(list => {
        const next = list.map(item => item.id === id ? { ...item, linkedProjectIds } : item);
        persist(next);
        return next;
      });
    },
    markConverted: async (id: string) => {
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('inbox').update({ status: 'converted' }).eq('id', id);
        } catch (e) {
          console.warn('Supabase update inbox status error:', e);
        }
      }

      update(list => {
        const next = list.map(i => i.id === id ? { ...i, status: 'converted' as const } : i);
        persist(next);
        return next;
      });
    },
    deleteInboxItem: async (id: string) => {
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('inbox').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase delete inbox error:', e);
        }
      }

      update(list => {
        const next = list.filter(i => i.id !== id);
        persist(next);
        return next;
      });
    },
    resetToDemo: () => {
      set(INITIAL_DEMO_INBOX);
      persist(INITIAL_DEMO_INBOX);
    }
  };
}

export const inboxStore = createInboxStore();
