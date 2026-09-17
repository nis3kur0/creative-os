<script lang="ts">
  import { passcodeStore } from '../stores/passcodeStore';
  import { taskTypesStore, taskSizesStore, energyLevelsStore } from '../stores/taskConfigStore';
  import { getStoredSupabaseCredentials, saveSupabaseCredentials, resetSupabaseInstance } from '../services/supabaseClient';
  import { authStore } from '../stores/authStore';
  import type { InactivityTimeoutSetting, TaskTypeConfig, TaskSizeConfig } from '../types';
  import Icon from './Icon.svelte';

  // Security / Passcode State
  let newPasscode = '';
  let confirmPasscode = '';
  let passcodeMsg = '';
  let selectedTimeout: InactivityTimeoutSetting = $passcodeStore.inactivityTimeout;

  // Supabase State
  let { url: initialUrl, key: initialKey } = getStoredSupabaseCredentials();
  let supabaseUrl = initialUrl;
  let supabaseKey = initialKey;
  let supabaseMsg = '';

  async function handleSavePasscode() {
    passcodeMsg = '';
    if (!newPasscode) {
      passcodeMsg = 'Por favor introduce un passcode.';
      return;
    }
    if (newPasscode !== confirmPasscode) {
      passcodeMsg = 'Los passcodes no coinciden.';
      return;
    }
    await passcodeStore.setPasscode(newPasscode);
    newPasscode = '';
    confirmPasscode = '';
    passcodeMsg = '✓ Passcode guardado y encriptado localmente.';
  }

  function handleRemovePasscode() {
    if (confirm('¿Eliminar el passcode local de seguridad?')) {
      passcodeStore.removePasscode();
      passcodeMsg = 'Passcode eliminado.';
    }
  }

  function handleTimeoutChange() {
    passcodeStore.setTimeoutSetting(selectedTimeout);
  }

  function handleSaveSupabase() {
    saveSupabaseCredentials(supabaseUrl.trim(), supabaseKey.trim());
    resetSupabaseInstance();
    supabaseMsg = '✓ Credenciales de Supabase guardadas. Recargando conexión...';
    setTimeout(() => {
      authStore.init();
      supabaseMsg = '✓ Conexión con Supabase actualizada.';
    }, 1000);
  }

  function exportBackup() {
    const data = {
      projects: localStorage.getItem('creative_os_projects'),
      tasks: localStorage.getItem('creative_os_tasks'),
      notes: localStorage.getItem('creative_os_notes'),
      inbox: localStorage.getItem('creative_os_inbox'),
      sessions: localStorage.getItem('creative_os_sessions'),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creative-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  function importBackup(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.projects) localStorage.setItem('creative_os_projects', json.projects);
        if (json.tasks) localStorage.setItem('creative_os_tasks', json.tasks);
        if (json.notes) localStorage.setItem('creative_os_notes', json.notes);
        if (json.inbox) localStorage.setItem('creative_os_inbox', json.inbox);
        if (json.sessions) localStorage.setItem('creative_os_sessions', json.sessions);
        alert('¡Copia de seguridad restaurada con éxito! La página se recargará.');
        window.location.reload();
      } catch (err) {
        alert('Archivo de copia de seguridad no válido.');
      }
    };
    reader.readAsText(file);
  }
</script>

<div class="space-y-6 max-w-4xl mx-auto">
  <!-- Header -->
  <div class="glass-panel p-5 rounded-2xl border border-slate-800">
    <h2 class="text-xl font-bold text-white font-heading">Configuración del Sistema</h2>
    <p class="text-xs text-slate-400">Personaliza la seguridad local, los tipos de tarea, conexión a backend y datos.</p>
  </div>

  <!-- Section 1: Security & Local Passcode (Fase 3) -->
  <div class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
        <Icon name="Lock" size={18} />
      </div>
      <div>
        <h3 class="text-base font-bold text-white font-heading">Seguridad & Passcode Local (Fase 3)</h3>
        <p class="text-xs text-slate-400">Bloqueo local por inactividad. El hash se calcula con SHA-256 y nunca sale de tu navegador.</p>
      </div>
    </div>

    {#if passcodeMsg}
      <div class="p-3 bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs rounded-xl font-mono">
        {passcodeMsg}
      </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
      <!-- Timeout Selector -->
      <div class="space-y-2">
        <label class="block text-xs font-semibold text-slate-300">Tiempo de inactividad para bloqueo</label>
        <select
          bind:value={selectedTimeout}
          on:change={handleTimeoutChange}
          class="w-full px-3 py-2 rounded-xl glass-input text-xs"
        >
          <option value="disabled">Desactivado (sin bloqueo automático)</option>
          <option value="1m">1 Minuto</option>
          <option value="5m">5 Minutos</option>
          <option value="10m">10 Minutos</option>
          <option value="15m">15 Minutos</option>
          <option value="30m">30 Minutos</option>
          <option value="1h">1 Hora</option>
        </select>
        <p class="text-[11px] text-slate-500">Detecta movimiento de mouse, teclado o toque. No cierra sesión de Supabase.</p>
      </div>

      <!-- Set / Change Passcode -->
      <div class="space-y-3">
        <label class="block text-xs font-semibold text-slate-300">
          {$passcodeStore.passcodeHash ? 'Cambiar Passcode Local' : 'Establecer Passcode Local'}
        </label>
        <div class="grid grid-cols-2 gap-2">
          <input
            type="password"
            bind:value={newPasscode}
            placeholder="Nuevo PIN/Passcode"
            class="px-3 py-2 rounded-xl glass-input text-xs"
          />
          <input
            type="password"
            bind:value={confirmPasscode}
            placeholder="Confirmar Passcode"
            class="px-3 py-2 rounded-xl glass-input text-xs"
          />
        </div>
        <div class="flex items-center gap-2">
          <button
            on:click={handleSavePasscode}
            class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl shadow-md shadow-indigo-600/30"
          >
            Guardar Passcode
          </button>
          {#if $passcodeStore.passcodeHash}
            <button
              on:click={handleRemovePasscode}
              class="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-medium rounded-xl"
            >
              Quitar Passcode
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Section 2: Backend Supabase Connection -->
  <div class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
        <Icon name="Database" size={18} />
      </div>
      <div>
        <h3 class="text-base font-bold text-white font-heading">Conexión Backend (Supabase)</h3>
        <p class="text-xs text-slate-400">Si deseas sincronizar entre dispositivos, conecta tu propia instancia de Supabase.</p>
      </div>
    </div>

    {#if supabaseMsg}
      <div class="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs rounded-xl font-mono">
        {supabaseMsg}
      </div>
    {/if}

    <div class="space-y-3">
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Supabase Project URL</label>
        <input
          type="text"
          bind:value={supabaseUrl}
          placeholder="https://xyz.supabase.co"
          class="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
        />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Supabase Anon Key</label>
        <input
          type="password"
          bind:value={supabaseKey}
          placeholder="eyJhbGciOi..."
          class="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
        />
      </div>

      <button
        on:click={handleSaveSupabase}
        class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl shadow-md shadow-emerald-600/30"
      >
        Guardar Credenciales Supabase
      </button>
    </div>
  </div>

  <!-- Section 3: Data Backup & Export -->
  <div class="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
        <Icon name="Download" size={18} />
      </div>
      <div>
        <h3 class="text-base font-bold text-white font-heading">Copia de Seguridad & Exportación</h3>
        <p class="text-xs text-slate-400">Exporta todos tus datos a un archivo JSON o restaura una copia de seguridad previa.</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <button
        on:click={exportBackup}
        class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl flex items-center gap-2 shadow-md shadow-purple-600/30"
      >
        <Icon name="Download" size={14} />
        <span>Exportar JSON</span>
      </button>

      <label class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl cursor-pointer flex items-center gap-2">
        <Icon name="Upload" size={14} />
        <span>Importar JSON</span>
        <input type="file" accept=".json" on:change={importBackup} class="hidden" />
      </label>
    </div>
  </div>
</div>
