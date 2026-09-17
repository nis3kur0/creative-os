import { writable } from 'svelte/store';
import type { PasscodeSettings, InactivityTimeoutSetting } from '../types';

const STORAGE_PASSCODE_SETTINGS = 'creative_os_passcode_settings';

async function hashPasscode(passcode: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`creative_os_salt_${passcode}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getStoredSettings(): PasscodeSettings {
  try {
    const json = localStorage.getItem(STORAGE_PASSCODE_SETTINGS);
    if (json) {
      const parsed = JSON.parse(json);
      return {
        passcodeHash: parsed.passcodeHash || null,
        inactivityTimeout: parsed.inactivityTimeout || 'disabled',
        customTimeoutMinutes: parsed.customTimeoutMinutes || 5,
        isLocked: parsed.passcodeHash ? parsed.isLocked ?? false : false,
        lastActivity: Date.now()
      };
    }
  } catch (e) {
    console.warn('Error reading passcode settings:', e);
  }
  return {
    passcodeHash: null,
    inactivityTimeout: 'disabled',
    customTimeoutMinutes: 5,
    isLocked: false,
    lastActivity: Date.now()
  };
}

function parseTimeoutToMinutes(setting: InactivityTimeoutSetting, custom?: number): number {
  switch (setting) {
    case '1m': return 1;
    case '5m': return 5;
    case '10m': return 10;
    case '15m': return 15;
    case '30m': return 30;
    case '1h': return 60;
    default: return custom || 5;
  }
}

function createPasscodeStore() {
  const initial = getStoredSettings();
  const { subscribe, update } = writable<PasscodeSettings>(initial);

  let checkInterval: any = null;

  function save(state: PasscodeSettings) {
    localStorage.setItem(STORAGE_PASSCODE_SETTINGS, JSON.stringify({
      passcodeHash: state.passcodeHash,
      inactivityTimeout: state.inactivityTimeout,
      customTimeoutMinutes: state.customTimeoutMinutes,
      isLocked: state.isLocked
    }));
  }

  function registerActivity() {
    update(s => {
      if (s.isLocked) return s;
      return { ...s, lastActivity: Date.now() };
    });
  }

  function startInactivityCheck() {
    if (typeof window === 'undefined') return;

    // Event listeners for activity
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, registerActivity, { passive: true });
    });

    if (checkInterval) clearInterval(checkInterval);
    checkInterval = setInterval(() => {
      update(s => {
        if (!s.passcodeHash || s.inactivityTimeout === 'disabled' || s.isLocked) return s;

        const timeoutMs = parseTimeoutToMinutes(s.inactivityTimeout, s.customTimeoutMinutes) * 60 * 1000;
        const now = Date.now();
        if (now - s.lastActivity >= timeoutMs) {
          const next = { ...s, isLocked: true };
          save(next);
          return next;
        }
        return s;
      });
    }, 5000);
  }

  return {
    subscribe,
    startInactivityCheck,
    setPasscode: async (plainPasscode: string) => {
      const hash = await hashPasscode(plainPasscode);
      update(s => {
        const next = { ...s, passcodeHash: hash, isLocked: false };
        save(next);
        return next;
      });
    },
    removePasscode: () => {
      update(s => {
        const next = { ...s, passcodeHash: null, isLocked: false };
        save(next);
        return next;
      });
    },
    setTimeoutSetting: (timeout: InactivityTimeoutSetting, customMinutes?: number) => {
      update(s => {
        const next = { ...s, inactivityTimeout: timeout, customTimeoutMinutes: customMinutes || s.customTimeoutMinutes };
        save(next);
        return next;
      });
    },
    lockNow: () => {
      update(s => {
        if (!s.passcodeHash) return s;
        const next = { ...s, isLocked: true };
        save(next);
        return next;
      });
    },
    unlock: async (plainPasscode: string): Promise<boolean> => {
      const hash = await hashPasscode(plainPasscode);
      let success = false;
      update(s => {
        if (s.passcodeHash === hash) {
          success = true;
          const next = { ...s, isLocked: false, lastActivity: Date.now() };
          save(next);
          return next;
        }
        return s;
      });
      return success;
    }
  };
}

export const passcodeStore = createPasscodeStore();
