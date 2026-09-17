<script lang="ts">
  import { inboxStore } from '../stores/inboxStore';
  import { authStore } from '../stores/authStore';
  import { projectsStore } from '../stores/projectsStore';
  import Icon from './Icon.svelte';

  let text = '';
  let category = 'Ideas';
  let customCategory = '';
  let selectedProjectIds: string[] = [];
  let isSaved = false;

  $: projectList = $projectsStore.filter(project => project.status === 'active');

  async function handleAdd() {
    if (!text.trim()) return;
    const resolvedCategory = (customCategory || category).trim() || 'Ideas';
    const userId = $authStore.user?.id || 'demo-user';
    await inboxStore.addInboxItem(text.trim(), userId, resolvedCategory, selectedProjectIds);
    text = '';
    selectedProjectIds = [];
    customCategory = '';
    isSaved = true;
    setTimeout(() => (isSaved = false), 1800);
  }

  function toggleProject(projectId: string) {
    selectedProjectIds = selectedProjectIds.includes(projectId)
      ? selectedProjectIds.filter(id => id !== projectId)
      : [...selectedProjectIds, projectId];
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleAdd();
  }
</script>

<div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-lg shadow-slate-950/20">
  <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
    <div class="flex-1">
      <input
        type="text"
        bind:value={text}
        on:keydown={handleKeydown}
        placeholder="Idea rápida..."
        class="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500"
      />
    </div>

    <select bind:value={category} class="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
      {#each ['Ideas', 'Escritura', 'Diseño', 'Investigación', 'Proyectos', 'Tareas', 'Marketing'] as option}
        <option value={option}>{option}</option>
      {/each}
    </select>

    <input bind:value={customCategory} class="w-40 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500" placeholder="Categoría nueva" />

    <button on:click={handleAdd} disabled={!text.trim()} class="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
      {#if isSaved}
        <span>Guardado</span>
      {:else}
        <span>Enviar</span>
      {/if}
    </button>
  </div>

  {#if projectList.length > 0}
    <div class="mt-3 flex flex-wrap gap-2">
      {#each projectList as project}
        <button
          type="button"
          on:click={() => toggleProject(project.id)}
          class={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${selectedProjectIds.includes(project.id) ? 'border-indigo-500 bg-indigo-600/20 text-indigo-200' : 'border-slate-700 bg-slate-800 text-slate-300'}`}
        >
          {project.name}
        </button>
      {/each}
    </div>
  {/if}
</div>
