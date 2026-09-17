import { writable } from 'svelte/store';
import { getSupabase } from '../services/supabaseClient';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: UserProfile | null;
  isDemo: boolean;
  loading: boolean;
}

const STORAGE_DEMO_KEY = 'creative_os_is_demo';

function createAuthStore() {
  const storedDemo = localStorage.getItem(STORAGE_DEMO_KEY) !== 'false'; // default to demo mode if not explicit
  
  const { subscribe, set, update } = writable<AuthState>({
    user: storedDemo ? { id: 'demo-user', email: 'creador@creative-os.local', name: 'Creador' } : null,
    isDemo: storedDemo,
    loading: true
  });

  async function init() {
    const supabase = getSupabase();
    if (!supabase) {
      update(s => ({ ...s, loading: false }));
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0]
          },
          isDemo: false,
          loading: false
        });
        localStorage.setItem(STORAGE_DEMO_KEY, 'false');
      } else {
        update(s => ({ ...s, loading: false }));
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          set({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0]
            },
            isDemo: false,
            loading: false
          });
          localStorage.setItem(STORAGE_DEMO_KEY, 'false');
        } else {
          // If logged out from Supabase, switch to demo mode if desired
          update(s => ({ ...s, user: s.isDemo ? s.user : null, loading: false }));
        }
      });
    } catch (e) {
      console.warn('Supabase Auth init error:', e);
      update(s => ({ ...s, loading: false }));
    }
  }

  return {
    subscribe,
    init,
    enableDemoMode: () => {
      localStorage.setItem(STORAGE_DEMO_KEY, 'true');
      set({
        user: { id: 'demo-user', email: 'creador@creative-os.local', name: 'Creador' },
        isDemo: true,
        loading: false
      });
    },
    signOut: async () => {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.auth.signOut();
      }
      localStorage.setItem(STORAGE_DEMO_KEY, 'true');
      set({
        user: { id: 'demo-user', email: 'creador@creative-os.local', name: 'Creador' },
        isDemo: true,
        loading: false
      });
    }
  };
}

export const authStore = createAuthStore();
