<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { projectsStore } from '../stores/projectsStore';
  import { tasksStore } from '../stores/tasksStore';
  import { notesStore } from '../stores/notesStore';
  import { inboxStore } from '../stores/inboxStore';
  import Icon from './Icon.svelte';

  export let isOpen = false;

  const dispatch = createEventDispatcher();
  let query = '';

  $: queryClean = query.trim().toLowerCase();

  $: matchingProjects = queryClean ? $projectsStore.filter(p => p.name.toLowerCase().includes(queryClean) || p.description.toLowerCase().includes(queryClean)) : [];
  $: matchingTasks = queryClean ? $tasksStore.filter(t => t.title.toLowerCase().includes(queryClean) || t.description.toLowerCase().includes(queryClean) || (t.next_step && t.next_step.toLowerCase().includes(queryClean))) : [];
  $: matchingNotes = queryClean ? $notesStore.filter(n => n.title.toLowerCase().includes(queryClean) || n.content.toLowerCase().includes(queryClean)) : [];
  $: matchingInbox = queryClean ? $inboxStore.filter(i => i.content.toLowerCase().includes(queryClean)) : [];

  $: totalResults = matchingProjects.length + matchingTasks.length + matchingNotes.length + matchingInbox.length;

  function handleSelect(type: string, id: string) {
    isOpen = false;
    query = '';
    dispatch('navigate', type);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') isOpen = false;
  }
</script>

<svelte:window on:keydown={e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    isOpen = !isOpen;
  }
}} />

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-950/80 backdrop-blur-md p-4" on:click={() => isOpen = false}>
    <div
      class="glass-panel w-full max-w-xl p-4 rounded-2xl border border-indigo-500/30 shadow-2xl space-y-4"
      on:click|stopPropagation
    >
      <div class="flex items-center gap-3 px-3 py-2 rounded-xl glass-input">
        <Icon name="Search" size={18} className="text-indigo-400" />
        <input
          type="text"
          bind:value={query}
          placeholder="Buscar proyectos, tareas, notas o capturas..."
          class="w-full bg-transparent text-sm text-white focus:outline-none"
          autofocus
        />
        {#if query}
          <button on:click={() => query = ''} class="text-slate-400 hover:text-white">
            <Icon name="X" size={16} />
          </button>
        {/if}
      </div>

      {#if queryClean}
        <div class="max-h-96 overflow-y-auto space-y-4 pr-1">
          {#if totalResults === 0}
            <p class="text-xs text-slate-400 text-center py-6">No se encontraron coincidencias para "{query}".</p>
          {:else}
            <!-- Projects -->
            {#if matchingProjects.length > 0}
              <div>
                <h4 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Proyectos</h4>
                <div class="space-y-1">
                  {#each matchingProjects as p}
                    <div
                      on:click={() => handleSelect('projects', p.id)}
                      class="p-2.5 rounded-lg glass-card hover:border-indigo-500/40 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <span class="font-bold text-white">{p.name}</span>
                        <span class="text-[10px] text-slate-400 block truncate">{p.description}</span>
                      </div>
                      <Icon name="ChevronRight" size={14} className="text-slate-500" />
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Tasks -->
            {#if matchingTasks.length > 0}
              <div>
                <h4 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tareas</h4>
                <div class="space-y-1">
                  {#each matchingTasks as t}
                    <div
                      on:click={() => handleSelect('tasks', t.id)}
                      class="p-2.5 rounded-lg glass-card hover:border-indigo-500/40 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <span class="font-bold text-white">{t.title}</span>
                        {#if t.next_step}
                          <span class="text-[10px] text-slate-400 block truncate">→ {t.next_step}</span>
                        {/if}
                      </div>
                      <span class="px-1.5 py-0.5 rounded text-[9px] uppercase font-mono badge-{t.energy_level.toLowerCase()}">{t.energy_level}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Notes -->
            {#if matchingNotes.length > 0}
              <div>
                <h4 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Notas</h4>
                <div class="space-y-1">
                  {#each matchingNotes as n}
                    <div
                      on:click={() => handleSelect('notes', n.id)}
                      class="p-2.5 rounded-lg glass-card hover:border-indigo-500/40 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <span class="font-bold text-white">{n.title}</span>
                        <span class="text-[10px] text-slate-400 block truncate">{n.content}</span>
                      </div>
                      <Icon name="FileText" size={14} className="text-slate-500" />
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Inbox -->
            {#if matchingInbox.length > 0}
              <div>
                <h4 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Inbox</h4>
                <div class="space-y-1">
                  {#each matchingInbox as i}
                    <div
                      on:click={() => handleSelect('inbox', i.id)}
                      class="p-2.5 rounded-lg glass-card hover:border-indigo-500/40 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span class="text-white">{i.content}</span>
                      <Icon name="Inbox" size={14} className="text-slate-500" />
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          {/if}
        </div>
      {:else}
        <p class="text-xs text-slate-400 text-center py-6">Escribe para buscar instantáneamente en todas las secciones.</p>
      {/if}
    </div>
  </div>
{/if}
