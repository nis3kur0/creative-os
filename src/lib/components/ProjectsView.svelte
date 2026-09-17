<script lang="ts">
  import { projectsStore } from '../stores/projectsStore';
  import { inboxStore } from '../stores/inboxStore';
  import { authStore } from '../stores/authStore';
  import type { Project, ProjectArea } from '../types';
  import Icon from './Icon.svelte';

  let selectedCategory = 'Todos';
  let selectedProjectId: string | null = null;
  let showModal = false;
  let editingProject: Project | null = null;
  let quickMessage = '';

  let formName = '';
  let formDescription = '';
  let formCategory = 'Proyectos';
  let formArea: ProjectArea = 'writing';
  let formColor = '#2b579a';
  let formHours = 8;

  const timeLegend = [
    { label: 'Micro', value: '1-5 min' },
    { label: 'Corto', value: '5-15 min' },
    { label: 'Medio', value: '15-30 min' },
    { label: 'Largo', value: '30-60 min' },
    { label: 'Profundo', value: '60+ min' }
  ];

  $: categories = ['Todos', ...new Set($projectsStore.map(project => project.category || 'General'))];
  $: filteredProjects = selectedCategory === 'Todos'
    ? [...$projectsStore].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [...$projectsStore].filter(project => (project.category || 'General') === selectedCategory).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  $: selectedProject = filteredProjects.find(project => project.id === selectedProjectId) || filteredProjects[0] || null;

  $: projectMessages = selectedProject
    ? $inboxStore.filter(item => item.project_id === selectedProject.id || item.linkedProjectIds?.includes(selectedProject.id))
    : [];

  function openCreateModal() {
    editingProject = null;
    formName = '';
    formDescription = '';
    formCategory = selectedCategory === 'Todos' ? 'Proyectos' : selectedCategory;
    formArea = 'writing';
    formColor = '#2b579a';
    formHours = 8;
    showModal = true;
  }

  function openEditModal(project: Project) {
    editingProject = project;
    formName = project.name;
    formDescription = project.description;
    formCategory = project.category || 'General';
    formArea = project.area;
    formColor = project.color || '#2b579a';
    formHours = project.estimatedHours || 8;
    showModal = true;
  }

  async function handleSave() {
    if (!formName.trim()) return;
    const userId = $authStore.user?.id || 'demo-user';

    if (editingProject) {
      await projectsStore.updateProject(editingProject.id, {
        name: formName.trim(),
        description: formDescription.trim(),
        area: formArea,
        category: formCategory,
        color: formColor,
        estimatedHours: formHours
      });
    } else {
      await projectsStore.addProject({
        user_id: userId,
        name: formName.trim(),
        description: formDescription.trim(),
        area: formArea,
        category: formCategory,
        status: 'active',
        color: formColor,
        estimatedHours: formHours
      });
    }
    showModal = false;
  }

  async function handleDelete(id: string) {
    if (confirm('¿Eliminar proyecto?')) {
      await projectsStore.deleteProject(id);
    }
  }

  async function addMessageToProject() {
    if (!quickMessage.trim() || !selectedProject) return;
    const userId = $authStore.user?.id || 'demo-user';
    await inboxStore.addInboxItem(quickMessage.trim(), userId, selectedProject.category || 'General', [selectedProject.id]);
    quickMessage = '';
  }

  function dragStart(projectId: string) {
    const dragEvent = new DataTransfer();
    dragEvent.setData('text/plain', projectId);
    return dragEvent;
  }

  function onDrop(projectId: string, event: DragEvent) {
    event.preventDefault();
    const sourceId = event.dataTransfer?.getData('text/plain');
    if (!sourceId || sourceId === projectId) return;
    const ids = [...$projectsStore].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(project => project.id);
    const fromIndex = ids.indexOf(sourceId);
    const toIndex = ids.indexOf(projectId);
    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, sourceId);
    projectsStore.reorderProjects(ids);
  }
</script>

<div class="h-[calc(100vh-140px)] overflow-hidden border border-slate-800 bg-slate-900/70 shadow-lg shadow-slate-950/20">
  <div class="grid h-full grid-cols-1 xl:grid-cols-[240px_320px_minmax(0,1fr)]">
    <aside class="border-b border-slate-800 bg-slate-950/70 xl:border-b-0 xl:border-r">
      <div class="flex items-center justify-between border-b border-slate-800 p-4">
        <h2 class="text-lg font-black text-white">Categorías</h2>
        <button on:click={openCreateModal} class="border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-200 hover:border-blue-500 hover:text-white">
          + Nuevo
        </button>
      </div>

      <div class="space-y-2 p-3">
        {#each categories as category}
          <button
            on:click={() => {
              selectedCategory = category;
              selectedProjectId = filteredProjects[0]?.id ?? null;
            }}
            class={`flex w-full items-center justify-between border px-3 py-2 text-left text-sm font-semibold ${selectedCategory === category ? 'border-blue-500 bg-blue-700/15 text-white' : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:text-white'}`}
          >
            <span>{category}</span>
            <span class="border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-300">
              {$projectsStore.filter(project => (project.category || 'General') === category).length}
            </span>
          </button>
        {/each}
      </div>
    </aside>

    <aside class="border-b border-slate-800 bg-slate-900/50 xl:border-b-0 xl:border-r">
      <div class="flex items-center justify-between border-b border-slate-800 p-4">
        <h3 class="text-base font-black text-white">Proyectos</h3>
        <div class="group relative">
          <button class="border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-200 hover:border-blue-500 hover:text-white" aria-label="Leyenda de tiempos">⏱</button>
          <div class="pointer-events-none absolute right-0 top-full z-20 mt-2 hidden w-52 border border-slate-700 bg-slate-950 p-2 text-[10px] text-slate-200 shadow-lg group-hover:block">
            {#each timeLegend as item}
              <div class="flex items-center justify-between border-b border-slate-800 py-1 last:border-b-0">
                <span class="font-bold uppercase tracking-[0.2em]">{item.label}</span>
                <span>{item.value}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <div class="space-y-3 overflow-y-auto p-3">
        {#if filteredProjects.length === 0}
          <div class="border border-dashed border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-400">No hay proyectos en esta categoría.</div>
        {:else}
          {#each filteredProjects as project}
            <button
              on:click={() => (selectedProjectId = project.id)}
              on:dragstart={(event) => {
                event.dataTransfer?.setData('text/plain', project.id);
              }}
              on:dragover|preventDefault
              on:drop={(event) => onDrop(project.id, event)}
              class={`w-full border p-3 text-left transition ${selectedProject?.id === project.id ? 'border-blue-500 bg-blue-700/10' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'}`}
            >
              <div class="mb-2 flex items-center justify-between gap-2">
                <span class="inline-block h-2.5 w-2.5" style={`background: ${project.color || '#2b579a'}`}></span>
                <span class="text-[10px] uppercase tracking-[0.2em] text-slate-400">{project.area}</span>
              </div>
              <h4 class="text-sm font-black text-white">{project.name}</h4>
              <p class="mt-1 text-[11px] text-slate-400">{project.description || 'Sin descripción.'}</p>
              <div class="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>{project.estimatedHours || 8}h</span>
                <span>{project.category || 'General'}</span>
              </div>
            </button>
          {/each}
        {/if}
      </div>
    </aside>

    <main class="flex h-full flex-col bg-slate-900/40">
      {#if selectedProject}
        <header class="flex items-center justify-between border-b border-slate-800 p-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="inline-block h-3 w-3" style={`background: ${selectedProject.color || '#2b579a'}`}></span>
              <h3 class="text-lg font-black text-white">{selectedProject.name}</h3>
            </div>
            <p class="text-[11px] text-slate-400">{selectedProject.category || 'General'} · {selectedProject.estimatedHours || 8}h estimado</p>
          </div>
          <div class="flex items-center gap-2">
            <button on:click={() => openEditModal(selectedProject)} class="border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-200 hover:border-blue-500 hover:text-white">Editar</button>
            <button on:click={() => handleDelete(selectedProject.id)} class="border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-200 hover:border-rose-500 hover:text-rose-400">Borrar</button>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto space-y-3 p-4">
          {#if projectMessages.length === 0}
            <div class="border border-dashed border-slate-700 bg-slate-950/40 p-6 text-center text-sm text-slate-400">No hay mensajes enlazados a este proyecto.</div>
          {:else}
            {#each projectMessages as message}
              <div class={`max-w-[80%] border p-3 ${message.user_id === 'demo-user' ? 'ml-auto border-blue-500 bg-blue-700/10' : 'border-slate-700 bg-slate-950/60'}`}>
                <p class="text-sm text-slate-100">{message.content}</p>
                <div class="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  <span>{message.category}</span>
                  <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            {/each}
          {/if}
        </div>

        <div class="border-t border-slate-800 p-4">
          <div class="flex gap-2">
            <input bind:value={quickMessage} class="flex-1 border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500" placeholder="Escribe una idea para este proyecto..." />
            <button on:click={addMessageToProject} class="bg-blue-700 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-blue-600">Enviar</button>
          </div>
        </div>
      {:else}
        <div class="flex h-full items-center justify-center text-slate-400">Selecciona un proyecto.</div>
      {/if}
    </main>
  </div>
</div>

{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
    <div class="w-full max-w-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/50">
      <div class="mb-5 flex items-center justify-between">
        <h3 class="text-lg font-black text-white">{editingProject ? 'Editar proyecto' : 'Nuevo proyecto'}</h3>
        <button on:click={() => (showModal = false)} class="border border-slate-700 p-2 text-slate-300 hover:border-slate-500">
          <Icon name="X" size={14} />
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Nombre</label>
          <input bind:value={formName} class="w-full border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
        </div>

        <div>
          <label class="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Descripción</label>
          <textarea bind:value={formDescription} rows="3" class="w-full border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"></textarea>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Categoría</label>
            <input bind:value={formCategory} class="w-full border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
          </div>

          <div>
            <label class="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Área</label>
            <select bind:value={formArea} class="w-full border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-blue-500">
              <option value="writing">Escritura</option>
              <option value="drawing">Dibujo</option>
              <option value="programming">Programación</option>
              <option value="other">Otro</option>
            </select>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Tiempo estimado (horas)</label>
          <input type="number" min="1" max="200" bind:value={formHours} class="w-full border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button on:click={() => (showModal = false)} class="border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300">Cancelar</button>
          <button on:click={handleSave} class="bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-600">Guardar</button>
        </div>
      </div>
    </div>
  </div>
{/if}
