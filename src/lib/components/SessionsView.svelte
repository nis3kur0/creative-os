<script lang="ts">
  import { sessionsStore } from '../stores/sessionsStore';
  import { tasksStore } from '../stores/tasksStore';
  import { projectsStore } from '../stores/projectsStore';
  import { authStore } from '../stores/authStore';
  import type { EnergyId } from '../types';
  import Icon from './Icon.svelte';

  const activeTimer = sessionsStore.activeTimer;

  let showStopModal = false;
  let energyEnd: EnergyId = 'E2';
  let sessionNotes = '';

  function formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  }

  function handleStartFreeSession() {
    sessionsStore.startTimer(null, null, 'Sesión Libre de Foco', 'E2');
  }

  function handleOpenStopModal() {
    energyEnd = $activeTimer.energyStart;
    sessionNotes = $activeTimer.taskTitle ? `Foco en: ${$activeTimer.taskTitle}` : 'Sesión de trabajo libre';
    showStopModal = true;
  }

  async function handleConfirmStop() {
    const userId = $authStore.user?.id || 'demo-user';
    await sessionsStore.stopAndSaveTimer(energyEnd, sessionNotes, userId);
    showStopModal = false;
  }

  function handleDiscard() {
    if (confirm('¿Descartar temporizador activo sin guardar?')) {
      sessionsStore.discardTimer();
    }
  }

  function getProjectName(id: string | null) {
    if (!id) return null;
    const p = $projectsStore.find(x => x.id === id);
    return p ? p.name : null;
  }
</script>

<div class="space-y-6">
  <!-- Top Timer Card -->
  <div class="glass-panel p-6 rounded-2xl border border-indigo-500/30 relative overflow-hidden shadow-2xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-white font-heading flex items-center gap-2">
          <Icon name="Clock" size={20} className="text-emerald-400" />
          <span>Temporizador de Foco</span>
        </h2>
        <p class="text-xs text-slate-400">Registra el tiempo de trabajo continuo y la evolución de tu nivel de energía.</p>
      </div>

      {#if !$activeTimer.isRunning}
        <button
          on:click={handleStartFreeSession}
          class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 self-start sm:self-auto"
        >
          <Icon name="Play" size={16} />
          <span>Iniciar Sesión Libre</span>
        </button>
      {/if}
    </div>

    <!-- Active Timer Display -->
    {#if $activeTimer.isRunning}
      <div class="mt-6 p-6 bg-slate-900/80 rounded-2xl border border-indigo-500/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span class="text-xs text-indigo-400 font-mono uppercase tracking-wider block mb-1">En curso</span>
          <h3 class="text-lg font-bold text-white font-heading">{$activeTimer.taskTitle || 'Sesión de Foco Libre'}</h3>
          <p class="text-xs text-slate-400 font-mono mt-1">
            Energía inicial: <span class="px-1.5 py-0.5 rounded text-[10px] uppercase badge-{$activeTimer.energyStart.toLowerCase()}">{$activeTimer.energyStart}</span>
          </p>
        </div>

        <div class="flex items-center gap-4">
          <div class="text-3xl md:text-4xl font-bold font-mono text-emerald-400 tracking-wider">
            {formatDuration($activeTimer.elapsedSeconds)}
          </div>

          <div class="flex items-center gap-2">
            <button
              on:click={handleOpenStopModal}
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition shadow-md shadow-indigo-600/30"
            >
              Finalizar y Guardar
            </button>
            <button
              on:click={handleDiscard}
              class="p-2 text-slate-400 hover:text-rose-400 transition"
              title="Descartar"
            >
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Session Log History -->
  <div class="glass-panel p-5 rounded-2xl border border-slate-800">
    <h3 class="text-sm font-bold text-white mb-4 font-heading">Historial de Sesiones ({$sessionsStore.length})</h3>

    {#if $sessionsStore.length === 0}
      <div class="p-8 text-center text-xs text-slate-500">
        No hay sesiones de trabajo guardadas aún.
      </div>
    {:else}
      <div class="space-y-3">
        {#each $sessionsStore as session}
          <div class="glass-card p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-bold text-white">{session.notes}</span>
                {#if session.project_id}
                  <span class="text-[10px] text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded">
                    {getProjectName(session.project_id)}
                  </span>
                {/if}
              </div>

              <div class="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>{new Date(session.start_time).toLocaleString()}</span>
                <span>•</span>
                <span>Energía: <span class="uppercase font-bold text-slate-200">{session.energy_start}</span> → <span class="uppercase font-bold text-slate-200">{session.energy_end || session.energy_start}</span></span>
              </div>
            </div>

            <div class="flex items-center gap-3 self-end sm:self-center">
              <span class="text-sm font-mono font-bold text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                {formatDuration(session.duration_seconds)}
              </span>
              <button
                on:click={() => sessionsStore.deleteSession(session.id)}
                class="p-1.5 text-slate-400 hover:text-rose-400 transition"
                title="Eliminar registro"
              >
                <Icon name="Trash2" size={14} />
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Stop Session Modal -->
{#if showStopModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
    <div class="glass-panel w-full max-w-md p-6 rounded-2xl border border-indigo-500/30 shadow-2xl">
      <h3 class="text-lg font-bold text-white font-heading mb-4">Finalizar Sesión de Foco</h3>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Duración total</label>
          <div class="text-xl font-mono font-bold text-emerald-400">
            {formatDuration($activeTimer.elapsedSeconds)}
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">¿Cómo terminó tu energía?</label>
          <select bind:value={energyEnd} class="w-full px-3 py-2 rounded-xl glass-input text-xs">
            <option value="E0">E0: Agotado</option>
            <option value="E1">E1: Bajo</option>
            <option value="E2">E2: Funcional</option>
            <option value="E3">E3: Alto / Claridad</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Notas de la sesión</label>
          <textarea
            bind:value={sessionNotes}
            rows="3"
            placeholder="Resumen del progreso o notas..."
            class="w-full px-3 py-2 rounded-xl glass-input text-xs"
          ></textarea>
        </div>

        <div class="pt-4 flex items-center justify-end gap-2">
          <button
            on:click={() => showStopModal = false}
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            on:click={handleConfirmStop}
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition shadow-lg shadow-indigo-600/30"
          >
            Guardar Registro
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
