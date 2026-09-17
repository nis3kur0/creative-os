<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { tasksStore } from '../stores/tasksStore';
  import { projectsStore } from '../stores/projectsStore';
  import { taskTypesStore, energyLevelsStore } from '../stores/taskConfigStore';
  import { sessionsStore } from '../stores/sessionsStore';
  import { authStore } from '../stores/authStore';
  import type { Task, TaskStatus, TaskPriority, EnergyId } from '../types';
  import Icon from './Icon.svelte';

  const dispatch = createEventDispatcher();

  // Tasks display mode strictly defaults to 'kanban' as requested!
  let viewMode: 'kanban' | 'list' = 'kanban';
  let filterProject: string = 'all';

  let showModal = false;
  let editingTask: Task | null = null;

  // Form states
  let formTitle = '';
  let formDescription = '';
  let formProjectId: string = '';
  let formTypeId: string = 'programming';
  let formSizeId: string = 'medium';
  let formEnergyLevel: EnergyId = 'E2';
  let formEstimatedMinutes = 15;
  let formPriority: TaskPriority = 'medium';
  let formNextStep = '';

  $: filteredTasks = $tasksStore.filter(t => {
    if (filterProject !== 'all' && t.project_id !== filterProject) return false;
    return true;
  });

  $: pendingColumn = filteredTasks.filter(t => t.status === 'pending');
  $: inProgressColumn = filteredTasks.filter(t => t.status === 'in_progress');
  $: completedColumn = filteredTasks.filter(t => t.status === 'completed');

  function openCreateModal() {
    editingTask = null;
    formTitle = '';
    formDescription = '';
    formProjectId = $projectsStore.length > 0 ? $projectsStore[0].id : '';
    formTypeId = 'programming';
    formSizeId = 'medium';
    formEnergyLevel = 'E2';
    formEstimatedMinutes = 15;
    formPriority = 'medium';
    formNextStep = '';
    showModal = true;
  }

  function openEditModal(task: Task) {
    editingTask = task;
    formTitle = task.title;
    formDescription = task.description;
    formProjectId = task.project_id || '';
    formTypeId = task.type_id;
    formSizeId = task.size_id;
    formEnergyLevel = task.energy_level;
    formEstimatedMinutes = task.estimated_minutes;
    formPriority = task.priority;
    formNextStep = task.next_step;
    showModal = true;
  }

  async function handleSave() {
    if (!formTitle.trim()) return;
    const userId = $authStore.user?.id || 'demo-user';

    if (editingTask) {
      await tasksStore.updateTask(editingTask.id, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        project_id: formProjectId || null,
        type_id: formTypeId,
        size_id: formSizeId,
        energy_level: formEnergyLevel,
        estimated_minutes: Number(formEstimatedMinutes),
        priority: formPriority,
        next_step: formNextStep.trim()
      });
    } else {
      await tasksStore.addTask({
        user_id: userId,
        project_id: formProjectId || null,
        title: formTitle.trim(),
        description: formDescription.trim(),
        status: 'pending',
        type_id: formTypeId,
        size_id: formSizeId,
        energy_level: formEnergyLevel,
        estimated_minutes: Number(formEstimatedMinutes),
        actual_minutes: 0,
        priority: formPriority,
        next_step: formNextStep.trim()
      });
    }
    showModal = false;
  }

  async function handleDelete(id: string) {
    if (confirm('¿Eliminar esta tarea?')) {
      await tasksStore.deleteTask(id);
    }
  }

  function handleStatusChange(task: Task, newStatus: TaskStatus) {
    tasksStore.updateTask(task.id, { status: newStatus });
  }

  function startFocusSession(task: Task) {
    sessionsStore.startTimer(task.id, task.project_id, task.title, task.energy_level);
    dispatch('navigate', 'sessions');
  }

  function getTypeConfig(typeId: string) {
    return $taskTypesStore.find(t => t.id === typeId) || { name: typeId, iconName: 'CheckCircle', color: '#0e33f5' };
  }

  function getProjectName(projId: string | null) {
    if (!projId) return 'Sin proyecto';
    const p = $projectsStore.find(proj => proj.id === projId);
    return p ? p.name : 'Proyecto';
  }
</script>

<div class="space-y-6">
  <!-- Header Bar -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 panel-sharp p-5">
    <div>
      <h2 class="text-xl font-bold uppercase tracking-wide font-heading">Tablero Kanban de Tareas ({filteredTasks.length})</h2>
      <p class="text-xs opacity-75">Organización visual en columnas con 4 colores y botones con profundidad 3D sin bordes redondeados.</p>
    </div>

    <div class="flex items-center gap-3">
      <select
        bind:value={filterProject}
        class="input-sharp px-3 py-2 text-xs font-semibold"
      >
        <option value="all">Todos los proyectos</option>
        {#each $projectsStore as p}
          <option value={p.id}>{p.name}</option>
        {/each}
      </select>

      <button
        on:click={openCreateModal}
        class="btn-depth btn-primary px-4 py-2 text-xs font-bold flex items-center gap-2"
      >
        <Icon name="Plus" size={16} />
        <span>NUEVA TAREA</span>
      </button>
    </div>
  </div>

  <!-- Kanban Columns -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- PENDIENTES -->
    <div class="panel-sharp p-4 border-t-4 border-t-[#fa8385]">
      <div class="flex items-center justify-between mb-4 pb-2 border-b-2 border-[#010516] dark:border-slate-700">
        <h3 class="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
          <span class="w-3 h-3 bg-[#fa8385] border border-[#010516]"></span>
          <span>Pendientes ({pendingColumn.length})</span>
        </h3>
      </div>

      <div class="space-y-3">
        {#if pendingColumn.length === 0}
          <div class="p-6 text-center text-xs opacity-50 italic">Sin tareas pendientes</div>
        {/if}

        {#each pendingColumn as task}
          {@const typeConfig = getTypeConfig(task.type_id)}
          <div class="card-sharp p-4 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] font-bold px-2 py-0.5 border border-[#010516] bg-[#0e33f5] text-white uppercase font-mono">
                {typeConfig.name}
              </span>
              <span class="badge-{task.energy_level.toLowerCase()} px-2 py-0.5 text-[10px] font-mono">
                {task.energy_level} • {task.estimated_minutes}m
              </span>
            </div>

            <h4 class="text-xs font-bold leading-snug">{task.title}</h4>

            {#if task.next_step}
              <p class="text-[11px] font-medium opacity-80 border-l-2 border-[#0e33f5] pl-2 py-0.5">
                <span class="font-bold">Acción:</span> {task.next_step}
              </p>
            {/if}

            <div class="flex items-center justify-between text-[10px] pt-2 border-t border-slate-200 dark:border-slate-800">
              <span class="font-mono font-bold text-[#0e33f5] dark:text-[#fa8385]">
                {getProjectName(task.project_id)}
              </span>

              <div class="flex items-center gap-1">
                <button
                  on:click={() => handleStatusChange(task, 'in_progress')}
                  class="btn-depth btn-accent px-2 py-1 text-[10px]"
                  title="Mover a En Progreso"
                >
                  ▶ INICIAR
                </button>
                <button
                  on:click={() => openEditModal(task)}
                  class="p-1 text-slate-500 hover:text-[#0e33f5]"
                  title="Editar"
                >
                  <Icon name="Edit3" size={14} />
                </button>
                <button
                  on:click={() => handleDelete(task.id)}
                  class="p-1 text-slate-500 hover:text-rose-500"
                  title="Eliminar"
                >
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- EN PROGRESO -->
    <div class="panel-sharp p-4 border-t-4 border-t-[#0e33f5]">
      <div class="flex items-center justify-between mb-4 pb-2 border-b-2 border-[#010516] dark:border-slate-700">
        <h3 class="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
          <span class="w-3 h-3 bg-[#0e33f5] border border-[#010516]"></span>
          <span>En Progreso ({inProgressColumn.length})</span>
        </h3>
      </div>

      <div class="space-y-3">
        {#if inProgressColumn.length === 0}
          <div class="p-6 text-center text-xs opacity-50 italic">Ninguna tarea en progreso activo</div>
        {/if}

        {#each inProgressColumn as task}
          {@const typeConfig = getTypeConfig(task.type_id)}
          <div class="card-sharp p-4 space-y-3 border-l-4 border-l-[#0e33f5]">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] font-bold px-2 py-0.5 border border-[#010516] bg-[#f8d14f] text-[#010516] uppercase font-mono">
                {typeConfig.name}
              </span>
              <span class="badge-{task.energy_level.toLowerCase()} px-2 py-0.5 text-[10px] font-mono">
                {task.energy_level} • {task.estimated_minutes}m
              </span>
            </div>

            <h4 class="text-xs font-bold leading-snug">{task.title}</h4>

            {#if task.next_step}
              <p class="text-[11px] font-medium opacity-80 border-l-2 border-[#f8d14f] pl-2 py-0.5">
                <span class="font-bold">Acción:</span> {task.next_step}
              </p>
            {/if}

            <div class="flex items-center justify-between text-[10px] pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                on:click={() => startFocusSession(task)}
                class="btn-depth btn-primary px-2.5 py-1 text-[10px]"
              >
                ⏱ TEMPORIZADOR
              </button>

              <button
                on:click={() => handleStatusChange(task, 'completed')}
                class="btn-depth btn-secondary px-2 py-1 text-[10px]"
              >
                ✓ LISTO
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- COMPLETADAS -->
    <div class="panel-sharp p-4 border-t-4 border-t-[#f8d14f]">
      <div class="flex items-center justify-between mb-4 pb-2 border-b-2 border-[#010516] dark:border-slate-700">
        <h3 class="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
          <span class="w-3 h-3 bg-[#f8d14f] border border-[#010516]"></span>
          <span>Completadas ({completedColumn.length})</span>
        </h3>
      </div>

      <div class="space-y-3">
        {#if completedColumn.length === 0}
          <div class="p-6 text-center text-xs opacity-50 italic">Sin tareas completadas aún</div>
        {/if}

        {#each completedColumn as task}
          <div class="card-sharp p-3 opacity-75 space-y-2">
            <h4 class="text-xs font-bold line-through">{task.title}</h4>
            <div class="flex items-center justify-between text-[10px]">
              <span class="font-mono opacity-60">Completada</span>
              <button
                on:click={() => handleStatusChange(task, 'pending')}
                class="btn-depth btn-dark px-2 py-0.5 text-[9px]"
              >
                REABRIR
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<!-- Task Create/Edit Modal -->
{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
    <div class="panel-sharp w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b-2 border-[#010516]">
        <h3 class="text-base font-extrabold uppercase font-heading">{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
        <button on:click={() => showModal = false} class="btn-depth btn-secondary px-2 py-1 text-xs font-bold">X</button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold uppercase mb-1">Título de la Tarea</label>
          <input
            type="text"
            bind:value={formTitle}
            placeholder="Título claro..."
            class="w-full px-3 py-2 input-sharp text-xs"
          />
        </div>

        <div>
          <label class="block text-xs font-bold uppercase mb-1">Siguiente Acción Concreta (next_step)</label>
          <input
            type="text"
            bind:value={formNextStep}
            placeholder="Acción concreta..."
            class="w-full px-3 py-2 input-sharp text-xs"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase mb-1">Proyecto</label>
            <select bind:value={formProjectId} class="w-full px-3 py-2 input-sharp text-xs font-semibold">
              <option value="">Sin proyecto</option>
              {#each $projectsStore as p}
                <option value={p.id}>{p.name}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase mb-1">Tipo de Tarea</label>
            <select bind:value={formTypeId} class="w-full px-3 py-2 input-sharp text-xs font-semibold">
              {#each $taskTypesStore as t}
                <option value={t.id}>{t.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase mb-1">Energía</label>
            <select bind:value={formEnergyLevel} class="w-full px-3 py-2 input-sharp text-xs font-semibold">
              {#each $energyLevelsStore as e}
                <option value={e.id}>{e.name}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase mb-1">Tiempo (min)</label>
            <input
              type="number"
              bind:value={formEstimatedMinutes}
              min="1"
              max="300"
              class="w-full px-3 py-2 input-sharp text-xs font-semibold"
            />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase mb-1">Prioridad</label>
            <select bind:value={formPriority} class="w-full px-3 py-2 input-sharp text-xs font-semibold">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>

        <div class="pt-4 flex items-center justify-end gap-3 border-t-2 border-[#010516]">
          <button
            on:click={() => showModal = false}
            class="btn-depth btn-dark px-4 py-2 text-xs"
          >
            CANCELAR
          </button>
          <button
            on:click={handleSave}
            class="btn-depth btn-primary px-5 py-2 text-xs"
          >
            GUARDAR TAREA
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
