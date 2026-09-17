<script lang="ts">
  import { onMount } from 'svelte';
  import { projectsStore } from '../stores/projectsStore';
  import { inboxStore } from '../stores/inboxStore';
  import { authStore } from '../stores/authStore';
  import Icon from './Icon.svelte';

  const STORAGE_MAIN_MARKDOWN = 'creative_os_main_markdown';
  const STORAGE_MAIN_TITLE = 'creative_os_main_title';

  let title = localStorage.getItem(STORAGE_MAIN_TITLE) || 'Mi página principal';
  let markdown = localStorage.getItem(STORAGE_MAIN_MARKDOWN) || `# Mi día

## Hoy quiero avanzar en
- [ ] Proyecto principal
- [ ] Revisión de ideas del inbox
- [ ] Trabajo creativo de 25-40 minutos

> Haz foco en lo importante y guarda ideas antes de que se pierdan.`;

  let quickText = '';
  let quickCategory = 'Ideas';
  let customCategory = '';
  let projectSelection: string[] = [];

  $: availableProjects = $projectsStore.filter(p => p.status === 'active');

  function saveEditor() {
    localStorage.setItem(STORAGE_MAIN_TITLE, title);
    localStorage.setItem(STORAGE_MAIN_MARKDOWN, markdown);
  }

  async function sendIdeaToInbox() {
    if (!quickText.trim()) return;
    const category = (customCategory || quickCategory).trim() || 'Ideas';
    const userId = $authStore.user?.id || 'demo-user';
    await inboxStore.addInboxItem(quickText.trim(), userId, category, projectSelection);
    quickText = '';
    customCategory = '';
    projectSelection = [];
  }

  function toggleProject(id: string) {
    projectSelection = projectSelection.includes(id)
      ? projectSelection.filter(item => item !== id)
      : [...projectSelection, id];
  }

  onMount(() => {
    saveEditor();
  });
</script>

<div class="space-y-6">
  <div class="border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/20">
    <div class="flex flex-col gap-3 xl:flex-row xl:items-end">
      <div class="flex-1">
        <label class="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Título del espacio principal</label>
        <input bind:value={title} class="w-full border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none ring-0 transition focus:border-blue-500" placeholder="Título" />
      </div>

      <button on:click={saveEditor} class="bg-green-700 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-green-900/40 hover:bg-green-600">
        Guardar
      </button>
    </div>
  </div>

  <div class="border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/20">
    <div class="mb-3 flex items-center gap-2">
      <Icon name="Sparkles" size={16} className="text-amber-400" />
      <span class="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Idea rápida → Inbox</span>
    </div>

    <div class="grid gap-3 xl:grid-cols-[1.5fr_0.8fr_0.8fr_auto]">
      <input bind:value={quickText} class="border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500" placeholder="Escribe una idea rápida..." />

      <select bind:value={quickCategory} class="border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-blue-500">
        {#each ['Ideas', 'Escritura', 'Diseño', 'Investigación', 'Proyectos', 'Tareas', 'Marketing'] as category}
          <option value={category}>{category}</option>
        {/each}
      </select>

      <input bind:value={customCategory} class="border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500" placeholder="o crea categoría" />

      <button on:click={sendIdeaToInbox} disabled={!quickText.trim()} class="bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50">
        Enviar
      </button>
    </div>

    {#if availableProjects.length > 0}
      <div class="mt-3 flex flex-wrap gap-2">
        {#each availableProjects as project}
          <button
            type="button"
            on:click={() => toggleProject(project.id)}
            class={`border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${projectSelection.includes(project.id) ? 'border-blue-500 bg-blue-700/20 text-blue-100' : 'border-slate-700 bg-slate-800 text-slate-300'}`}
          >
            {project.name}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <div class="border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/20">
    <div class="mb-3 flex items-center gap-2">
      <Icon name="FileText" size={16} className="text-blue-400" />
      <span class="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Markdown</span>
    </div>
    <textarea bind:value={markdown} class="h-[520px] w-full resize-none border border-slate-700 bg-slate-950/80 p-4 text-sm leading-6 text-slate-100 outline-none focus:border-blue-500" />
  </div>
</div>
