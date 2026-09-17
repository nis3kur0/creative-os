<script lang="ts">
  import { notesStore } from '../stores/notesStore';
  import { projectsStore } from '../stores/projectsStore';
  import { authStore } from '../stores/authStore';
  import type { Note } from '../types';
  import Icon from './Icon.svelte';

  let selectedNote: Note | null = null;
  let searchQuery = '';
  let selectedTag = 'all';

  // Editor states
  let isEditing = false;
  let title = '';
  let content = '';
  let projectId: string = '';
  let tagInput = '';
  let tags: string[] = [];

  $: allTags = Array.from(new Set($notesStore.flatMap(n => n.tags || [])));

  $: filteredNotes = $notesStore.filter(n => {
    const matchesSearch = !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'all' || (n.tags && n.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  function selectNote(note: Note) {
    selectedNote = note;
    isEditing = false;
  }

  function startCreate() {
    selectedNote = null;
    isEditing = true;
    title = '';
    content = '';
    projectId = '';
    tagInput = '';
    tags = [];
  }

  function startEdit() {
    if (!selectedNote) return;
    isEditing = true;
    title = selectedNote.title;
    content = selectedNote.content;
    projectId = selectedNote.project_id || '';
    tags = [...(selectedNote.tags || [])];
    tagInput = '';
  }

  function addTag() {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      tags = [...tags, tagInput.trim()];
      tagInput = '';
    }
  }

  function removeTag(t: string) {
    tags = tags.filter(x => x !== t);
  }

  async function handleSave() {
    if (!title.trim()) return;
    const userId = $authStore.user?.id || 'demo-user';

    if (selectedNote) {
      await notesStore.updateNote(selectedNote.id, {
        title: title.trim(),
        content: content.trim(),
        project_id: projectId || null,
        tags
      });
      selectedNote = { ...selectedNote, title: title.trim(), content: content.trim(), project_id: projectId || null, tags };
    } else {
      const newN = await notesStore.addNote({
        user_id: userId,
        project_id: projectId || null,
        title: title.trim(),
        content: content.trim(),
        tags
      });
      selectedNote = newN;
    }
    isEditing = false;
  }

  async function handleDelete() {
    if (selectedNote && confirm('¿Eliminar esta nota?')) {
      await notesStore.deleteNote(selectedNote.id);
      selectedNote = null;
      isEditing = false;
    }
  }

  function getProjectName(id: string | null) {
    if (!id) return null;
    const p = $projectsStore.find(x => x.id === id);
    return p ? p.name : null;
  }
</script>

<div class="h-[calc(100vh-180px)] flex flex-col md:flex-row gap-6">
  <!-- Left List Sidebar -->
  <div class="w-full md:w-80 flex flex-col glass-panel p-4 rounded-2xl border border-slate-800">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-base font-bold text-white font-heading">Notas ({filteredNotes.length})</h2>
      <button
        on:click={startCreate}
        class="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition flex items-center gap-1 shadow-md shadow-indigo-600/30"
      >
        <Icon name="Plus" size={14} />
        <span>Nueva</span>
      </button>
    </div>

    <!-- Search & Filter -->
    <div class="space-y-2 mb-3">
      <div class="glass-card px-2.5 py-1.5 rounded-xl flex items-center gap-2">
        <Icon name="Search" size={14} className="text-slate-400" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Buscar notas..."
          class="w-full bg-transparent text-xs text-white focus:outline-none"
        />
      </div>

      {#if allTags.length > 0}
        <div class="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          <button
            on:click={() => selectedTag = 'all'}
            class="px-2 py-0.5 rounded text-[10px] whitespace-nowrap {selectedTag === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}"
          >
            Todas
          </button>
          {#each allTags as tag}
            <button
              on:click={() => selectedTag = tag}
              class="px-2 py-0.5 rounded text-[10px] whitespace-nowrap {selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}"
            >
              #{tag}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Note list items -->
    <div class="flex-1 overflow-y-auto space-y-2 pr-1">
      {#each filteredNotes as note}
        <div
          on:click={() => selectNote(note)}
          class="p-3 rounded-xl cursor-pointer transition border {selectedNote?.id === note.id ? 'bg-indigo-950/60 border-indigo-500/50 text-white shadow-sm' : 'glass-card text-slate-300 border-slate-800 hover:border-slate-700'}"
        >
          <h4 class="text-xs font-bold truncate mb-1">{note.title || 'Sin título'}</h4>
          <p class="text-[11px] text-slate-400 line-clamp-2 mb-2">{note.content}</p>

          <div class="flex items-center justify-between text-[10px] text-slate-500">
            <span>{new Date(note.updated_at).toLocaleDateString()}</span>
            {#if note.project_id}
              <span class="text-indigo-400 truncate max-w-[100px]">{getProjectName(note.project_id)}</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Right Note Content / Editor Area -->
  <div class="flex-1 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col">
    {#if isEditing}
      <!-- Editor View -->
      <div class="flex-1 flex flex-col space-y-4">
        <div class="flex items-center justify-between gap-4">
          <input
            type="text"
            bind:value={title}
            placeholder="Título de la nota..."
            class="text-lg font-bold text-white bg-transparent border-b border-slate-800 focus:border-indigo-500 focus:outline-none w-full py-1 font-heading"
          />

          <div class="flex items-center gap-2">
            <button
              on:click={() => isEditing = false}
              class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
            >
              Cancelar
            </button>
            <button
              on:click={handleSave}
              class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-md shadow-indigo-600/30"
            >
              Guardar Nota
            </button>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <label class="text-slate-400 mr-2">Proyecto:</label>
            <select bind:value={projectId} class="glass-input px-2 py-1 rounded-lg text-xs">
              <option value="">Sin proyecto</option>
              {#each $projectsStore as p}
                <option value={p.id}>{p.name}</option>
              {/each}
            </select>
          </div>

          <!-- Tags input -->
          <div class="flex items-center gap-2">
            <input
              type="text"
              bind:value={tagInput}
              on:keydown={e => e.key === 'Enter' && addTag()}
              placeholder="Añadir tag + Enter"
              class="glass-input px-2 py-1 rounded-lg text-xs"
            />
            <div class="flex items-center gap-1">
              {#each tags as t}
                <span class="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] flex items-center gap-1">
                  #{t}
                  <button on:click={() => removeTag(t)} class="hover:text-rose-400">×</button>
                </span>
              {/each}
            </div>
          </div>
        </div>

        <textarea
          bind:value={content}
          placeholder="Escribe tus pensamientos, especificaciones o ideas..."
          class="flex-1 w-full p-4 rounded-xl glass-input text-xs font-mono leading-relaxed resize-none focus:outline-none"
        ></textarea>
      </div>
    {:else if selectedNote}
      <!-- Read View -->
      <div class="flex-1 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 class="text-xl font-bold text-white font-heading">{selectedNote.title}</h2>
              <div class="flex items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
                <span>{new Date(selectedNote.updated_at).toLocaleString()}</span>
                {#if selectedNote.project_id}
                  <span>•</span>
                  <span class="text-indigo-400">{getProjectName(selectedNote.project_id)}</span>
                {/if}
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                on:click={startEdit}
                class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition flex items-center gap-1"
              >
                <Icon name="Edit3" size={14} />
                <span>Editar</span>
              </button>
              <button
                on:click={handleDelete}
                class="p-1.5 text-slate-400 hover:text-rose-400 transition"
              >
                <Icon name="Trash2" size={16} />
              </button>
            </div>
          </div>

          <!-- Tags -->
          {#if selectedNote.tags && selectedNote.tags.length > 0}
            <div class="flex items-center gap-1.5 mb-4">
              {#each selectedNote.tags as tag}
                <span class="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                  #{tag}
                </span>
              {/each}
            </div>
          {/if}

          <!-- Note text content -->
          <div class="prose prose-invert max-w-none text-xs leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">
            {selectedNote.content}
          </div>
        </div>
      </div>
    {:else}
      <!-- Empty State -->
      <div class="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
        <div class="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-400">
          <Icon name="FileText" size={24} />
        </div>
        <h3 class="text-sm font-bold text-slate-300 mb-1">Ninguna nota seleccionada</h3>
        <p class="text-xs text-slate-500 mb-4 max-w-xs">Selecciona una nota de la lista lateral o crea una nueva.</p>
        <button
          on:click={startCreate}
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-indigo-600/30"
        >
          Crear Nota
        </button>
      </div>
    {/if}
  </div>
</div>
