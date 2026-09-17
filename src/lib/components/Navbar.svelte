<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { passcodeStore } from '../stores/passcodeStore';
  import { authStore } from '../stores/authStore';
  import { themeStore } from '../stores/themeStore';
  import Icon from './Icon.svelte';

  export let activeTab: string = 'dashboard';
  export let collapsed = false;

  const dispatch = createEventDispatcher();

  const navItems = [
    { id: 'dashboard', label: 'Principal', icon: 'LayoutDashboard' },
    { id: 'projects', label: 'Proyectos', icon: 'FolderKanban' },
    { id: 'inbox', label: 'Inbox', icon: 'Inbox' },
    { id: 'settings', label: 'Configuración', icon: 'Settings' }
  ];

  function handleSelect(id: string) {
    activeTab = id;
    dispatch('navigate', id);
  }
</script>

<div class="flex h-full flex-col gap-4 p-3 sm:p-4 lg:p-5">
  <div class="flex items-center justify-between gap-3 border border-slate-800 bg-slate-900/70 p-3 shadow-lg shadow-slate-950/30">
    <div class={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-3'}`}>
      <button
        type="button"
        on:click={() => (collapsed = !collapsed)}
        class="flex h-10 w-10 items-center justify-center border border-slate-700 bg-slate-800 text-slate-100 transition hover:border-blue-500 hover:text-white"
        aria-label="Contraer menú"
      >
        <Icon name={collapsed ? 'PanelRight' : 'PanelLeft'} size={16} />
      </button>

      {#if !collapsed}
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center bg-blue-700 text-lg font-bold text-white">⚡</div>
          <div>
            <h1 class="text-sm font-black uppercase tracking-[0.2em] text-white">Creative OS</h1>
            <p class="text-[10px] text-slate-400">Centro de trabajo</p>
          </div>
        </div>
      {/if}
    </div>

    {#if !collapsed}
      <div class="flex items-center gap-2">
        <button
          on:click={() => themeStore.toggle()}
          class="border border-slate-700 bg-slate-800 p-2 text-slate-200 transition hover:border-blue-500 hover:text-white"
          title={$themeStore ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          <Icon name={$themeStore ? 'Sun' : 'Moon'} size={15} />
        </button>

        <button
          on:click={() => dispatch('openSearch')}
          class="border border-slate-700 bg-slate-800 p-2 text-slate-200 transition hover:border-blue-500 hover:text-white"
          title="Buscar"
        >
          <Icon name="Search" size={15} />
        </button>

        {#if $passcodeStore.passcodeHash}
          <button
            on:click={() => passcodeStore.lockNow()}
            class="border border-slate-700 bg-slate-800 p-2 text-slate-200 transition hover:border-amber-500 hover:text-amber-300"
            title="Bloquear"
          >
            <Icon name="Lock" size={15} />
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <nav class={`grid gap-2 ${collapsed ? 'grid-cols-1' : 'grid-cols-2 lg:flex lg:flex-col lg:gap-3'}`}>
    {#each navItems as item}
      <button
        on:click={() => handleSelect(item.id)}
        class={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'} border px-3 py-3 text-left text-xs font-bold uppercase tracking-wide transition ${activeTab === item.id ? 'border-blue-500 bg-blue-700/15 text-white' : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white'}`}
        title={collapsed ? item.label : undefined}
      >
        <Icon name={item.icon} size={16} />
        {#if !collapsed}
          <span>{item.label}</span>
        {/if}
      </button>
    {/each}
  </nav>

  {#if !collapsed}
    <button
      on:click={() => dispatch('openAuthModal')}
      class="mt-auto flex items-center justify-between border border-slate-800 bg-slate-900/70 px-3 py-3 text-left text-xs text-slate-200 hover:border-blue-500"
    >
      <div class="flex items-center gap-2">
        <span class={`h-2.5 w-2.5 ${$authStore.isDemo ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
        <span class="font-semibold">{$authStore.isDemo ? 'Modo demo' : ($authStore.user?.name || 'Usuario')}</span>
      </div>
      <Icon name="ChevronRight" size={14} />
    </button>
  {/if}
</div>
