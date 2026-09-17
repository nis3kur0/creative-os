<script lang="ts">
  import { inboxStore } from '../stores/inboxStore';
  import { projectsStore } from '../stores/projectsStore';
  import { tasksStore } from '../stores/tasksStore';
  import { authStore } from '../stores/authStore';
  import type { InboxItem } from '../types';
  import Icon from './Icon.svelte';

  let selectedCategory = 'Ideas';
  let selectedMessageId: string | null = null;

  $: categories = [...new Set($inboxStore.map(item => item.category || 'Ideas'))];
  $: messages = $inboxStore
    .filter(item => item.status === 'unprocessed' && (item.category || 'Ideas') === selectedCategory)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  $: selectedMessage = $inboxStore.find(item => item.id === selectedMessageId) || messages[0] || null;

  function selectCategory(category: string) {
    selectedCategory = category;
    selectedMessageId = $inboxStore.find(item => item.category === category && item.status === 'unprocessed')?.id || null;
  }

  async function linkMessageToProject(projectId: string) {
    if (!selectedMessage) return;
    const nextProjects = selectedMessage.linkedProjectIds?.includes(projectId)
      ? (selectedMessage.linkedProjectIds || []).filter(id => id !== projectId)
      : [...(selectedMessage.linkedProjectIds || []), projectId];

    await inboxStore.linkProjects(selectedMessage.id, nextProjects);
  }

  async function convertToTask(item: InboxItem) {
    const userId = $authStore.user?.id || 'demo-user';
    await tasksStore.addTask({
      user_id: userId,
      project_id: item.linkedProjectIds?.[0] || null,
      title: item.content,
      description: `Creado desde Inbox - ${item.category}`,
      status: 'pending',
      type_id: 'cognitive',
      size_id: 'medium',
      energy_level: 'E2',
      estimated_minutes: 15,
      actual_minutes: 0,
      priority: 'medium',
      next_step: item.content
    });
    await inboxStore.markConverted(item.id);
  }

  async function handleDelete(id: string) {
    await inboxStore.deleteInboxItem(id);
  }
</script>

<div class="h-[calc(100vh-140px)] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-lg shadow-slate-950/20">
  <div class="grid h-full grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)]">
    <aside class="border-b border-slate-800 bg-slate-950/70 xl:border-b-0 xl:border-r">
      <div class="border-b border-slate-800 p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-black text-white">Inbox</h2>
          <span class="rounded-full bg-indigo-600/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200">
            {$inboxStore.filter(item => item.status === 'unprocessed').length}
          </span>
        </div>
      </div>

      <div class="space-y-1 p-3">
        {#each categories as category}
          {@const count = $inboxStore.filter(item => item.status === 'unprocessed' && (item.category || 'Ideas') === category).length}
          <button
            on:click={() => selectCategory(category)}
            class={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${selectedCategory === category ? 'border-indigo-500 bg-indigo-600/15 text-white' : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:text-white'}`}
          >
            <span class="text-sm font-semibold">{category}</span>
            <span class="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">{count}</span>
          </button>
        {/each}
      </div>
    </aside>

    <section class="flex h-full flex-col bg-slate-900/40">
      <header class="flex items-center justify-between border-b border-slate-800 p-4">
        <div>
          <h3 class="text-base font-black text-white">{selectedCategory}</h3>
          <p class="text-[11px] text-slate-400">Conversación por categoría</p>
        </div>
        <div class="flex items-center gap-2 text-slate-400">
          <Icon name="Phone" size={15} />
          <Icon name="Video" size={15} />
        </div>
      </header>

      <div class="flex-1 space-y-3 overflow-y-auto p-4">
        {#if messages.length === 0}
          <div class="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-700 text-center text-sm text-slate-400">
            No hay mensajes en esta categoría.
          </div>
        {:else}
          {#each messages as message}
            <div class={`rounded-2xl border p-3 ${selectedMessage?.id === message.id ? 'border-indigo-500 bg-indigo-600/10' : 'border-slate-800 bg-slate-950/60'}`}>
              <div class="mb-2 flex items-center justify-between gap-2">
                <button on:click={() => (selectedMessageId = message.id)} class="text-sm font-bold text-white">{message.content}</button>
                <span class="text-[10px] text-slate-400">{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {#if (message.linkedProjectIds || []).length > 0}
                <div class="mb-2 flex flex-wrap gap-2">
                  {#each message.linkedProjectIds || [] as projectId}
                    {@const project = $projectsStore.find(item => item.id === projectId)}
                    {#if project}
                      <span class="rounded-full border border-indigo-500/40 bg-indigo-600/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200">{project.name}</span>
                    {/if}
                  {/each}
                </div>
              {/if}

              {#if selectedMessage?.id === message.id}
                <div class="mt-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <div class="mb-2 flex items-center justify-between">
                    <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Enlazar proyectos</span>
                    <button on:click={() => convertToTask(message)} class="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">Convertir a tarea</button>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    {#each $projectsStore as project}
                      <button
                        on:click={() => linkMessageToProject(project.id)}
                        class={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${message.linkedProjectIds?.includes(project.id) ? 'border-indigo-500 bg-indigo-600/20 text-indigo-200' : 'border-slate-700 bg-slate-800 text-slate-300'}`}
                      >
                        {project.name}
                      </button>
                    {/each}
                  </div>

                  <button on:click={() => handleDelete(message.id)} class="mt-3 rounded-lg border border-rose-700/50 bg-rose-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-200">Eliminar</button>
                </div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    </section>
  </div>
</div>
