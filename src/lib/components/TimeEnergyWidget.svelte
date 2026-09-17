<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { tasksStore, getCompatibleTasks } from '../stores/tasksStore';
  import { taskTypesStore } from '../stores/taskConfigStore';
  import { projectsStore } from '../stores/projectsStore';
  import { sessionsStore } from '../stores/sessionsStore';
  import type { EnergyId, Task } from '../types';
  import Icon from './Icon.svelte';

  const dispatch = createEventDispatcher();

  let selectedTime = 15;
  let selectedEnergy: EnergyId = 'E1';

  const timeOptions = [
    { value: 5, label: '5m' },
    { value: 10, label: '10m' },
    { value: 15, label: '15m' },
    { value: 20, label: '20m' },
    { value: 30, label: '30m' },
    { value: 45, label: '45m' },
    { value: 60, label: '60m+' }
  ];

  const energyOptions: { id: EnergyId; label: string; desc: string; badge: string }[] = [
    { id: 'E0', label: 'E0 Agotado', desc: 'Mecánico / Auto', badge: 'badge-e0' },
    { id: 'E1', label: 'E1 Bajo', desc: 'Lectura / Captura', badge: 'badge-e1' },
    { id: 'E2', label: 'E2 Funcional', desc: 'Trabajo normal', badge: 'badge-e2' },
    { id: 'E3', label: 'E3 Claridad', desc: 'Máximo foco', badge: 'badge-e3' }
  ];

  $: compatibleTasks = getCompatibleTasks($tasksStore, selectedTime, selectedEnergy);

  function getProjectName(projectId: string | null): string {
    if (!projectId) return 'Sin proyecto';
    const proj = $projectsStore.find(p => p.id === projectId);
    return proj ? proj.name : 'Proyecto';
  }

  function getTypeConfig(typeId: string) {
    return $taskTypesStore.find(t => t.id === typeId) || { name: typeId, iconName: 'CheckCircle', color: '#6366F1' };
  }

  function startFocusSession(task: Task) {
    sessionsStore.startTimer(task.id, task.project_id, task.title, selectedEnergy);
    dispatch('navigate', 'sessions');
  }

  function handleCompleteTask(task: Task) {
    tasksStore.updateTask(task.id, { status: 'completed' });
  }
</script>

<div class="glass-panel p-6 rounded-2xl border border-indigo-500/20 relative overflow-hidden shadow-2xl">
  <!-- Accent Glow -->
  <div class="absolute -top-16 -right-16 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

  <div class="flex items-center justify-between gap-4 mb-6">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
        <Icon name="Zap" size={20} />
      </div>
      <div>
        <h2 class="text-lg font-bold text-white tracking-tight font-heading">Filtro Adaptativo de Foco</h2>
        <p class="text-xs text-slate-400">¿Qué puedes hacer ahora mismo según tu disponibilidad y estado?</p>
      </div>
    </div>
  </div>

  <!-- Selectors Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <!-- Time Selector -->
    <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
      <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Icon name="Clock" size={14} className="text-indigo-400" />
        <span>1. ¿Cuánto tiempo tienes?</span>
      </label>
      <div class="flex flex-wrap gap-2">
        {#each timeOptions as t}
          <button
            on:click={() => selectedTime = t.value}
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 {selectedTime === t.value ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105' : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'}"
          >
            {t.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Energy Selector -->
    <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
      <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Icon name="Flame" size={14} className="text-amber-400" />
        <span>2. ¿Cómo está tu energía?</span>
      </label>
      <div class="grid grid-cols-2 gap-2">
        {#each energyOptions as e}
          <button
            on:click={() => selectedEnergy = e.id}
            class="p-2 rounded-lg text-left transition-all duration-200 border {selectedEnergy === e.id ? 'border-amber-500/50 bg-amber-500/10 text-white shadow-sm' : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-800'}"
          >
            <div class="flex items-center justify-between mb-0.5">
              <span class="text-xs font-bold">{e.label}</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase {e.badge}">{e.id}</span>
            </div>
            <p class="text-[10px] text-slate-400 truncate">{e.desc}</p>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Results Section -->
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <Icon name="CheckCircle" size={14} className="text-emerald-400" />
        <span>Tareas recomendadas ({compatibleTasks.length})</span>
      </h3>
      <span class="text-[11px] text-slate-400 font-mono">Ordenadas por prioridad</span>
    </div>

    {#if compatibleTasks.length === 0}
      <div class="p-6 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
        <p class="text-sm text-slate-400 mb-1">No hay tareas pendientes que requieran ≤ {selectedTime}m y energía ≤ {selectedEnergy}.</p>
        <p class="text-xs text-slate-400">Intenta aumentar el tiempo disponible o crear una nueva tarea rápida.</p>
      </div>
    {:else}
      <div class="space-y-2.5">
        {#each compatibleTasks.slice(0, 4) as task}
          {@const typeConfig = getTypeConfig(task.type_id)}
          <div class="glass-card p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-2 mb-1.5">
                <span class="px-2 py-0.5 text-[10px] rounded font-medium flex items-center gap-1" style="background-color: {typeConfig.color}20; color: {typeConfig.color}">
                  <Icon name={typeConfig.iconName} size={12} />
                  <span>{typeConfig.name}</span>
                </span>
                <span class="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {task.estimated_minutes} min
                </span>
                <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded badge-{task.energy_level.toLowerCase()}">
                  {task.energy_level}
                </span>
                <span class="text-[10px] text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                  {getProjectName(task.project_id)}
                </span>
              </div>

              <h4 class="text-sm font-semibold text-white">{task.title}</h4>
              {#if task.next_step}
                <p class="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <span class="text-indigo-400 font-bold">→</span> {task.next_step}
                </p>
              {/if}
            </div>

            <div class="flex items-center gap-2 self-end sm:self-center">
              <button
                on:click={() => handleCompleteTask(task)}
                title="Marcar como completada"
                class="p-2 rounded-lg bg-slate-800 hover:bg-emerald-950 hover:text-emerald-400 text-slate-400 transition"
              >
                <Icon name="Check" size={16} />
              </button>
              <button
                on:click={() => startFocusSession(task)}
                class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <Icon name="Play" size={14} />
                <span>Iniciar Foco</span>
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
