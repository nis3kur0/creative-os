<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from './lib/stores/authStore';
  import { passcodeStore } from './lib/stores/passcodeStore';
  import { projectsStore } from './lib/stores/projectsStore';
  import { tasksStore } from './lib/stores/tasksStore';
  import { notesStore } from './lib/stores/notesStore';
  import { inboxStore } from './lib/stores/inboxStore';

  import Navbar from './lib/components/Navbar.svelte';
  import DashboardView from './lib/components/DashboardView.svelte';
  import ProjectsView from './lib/components/ProjectsView.svelte';
  import InboxView from './lib/components/InboxView.svelte';
  import SettingsView from './lib/components/SettingsView.svelte';

  import LockScreenModal from './lib/components/LockScreenModal.svelte';
  import GlobalSearchModal from './lib/components/GlobalSearchModal.svelte';
  import AuthModal from './lib/components/AuthModal.svelte';

  let activeTab = 'dashboard';
  let isSearchOpen = false;
  let isAuthOpen = false;
  let sidebarCollapsed = false;

  onMount(() => {
    authStore.init();
    passcodeStore.startInactivityCheck();

    projectsStore.syncFromSupabase();
    tasksStore.syncFromSupabase();
    notesStore.syncFromSupabase();
    inboxStore.syncFromSupabase();
  });

  function handleNavigate(e: CustomEvent<string>) {
    activeTab = e.detail;
  }
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
  <div class="flex min-h-screen flex-col lg:flex-row">
    <aside class={`w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl transition-all duration-200 lg:border-b-0 lg:border-r ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}>
      <Navbar
        bind:activeTab
        bind:collapsed={sidebarCollapsed}
        on:navigate={handleNavigate}
        on:openSearch={() => isSearchOpen = true}
        on:openAuthModal={() => isAuthOpen = true}
      />
    </aside>

    <main class="flex-1 p-4 sm:p-6 lg:p-8">
      {#if activeTab === 'dashboard'}
        <DashboardView on:navigate={handleNavigate} />
      {:else if activeTab === 'projects'}
        <ProjectsView />
      {:else if activeTab === 'inbox'}
        <InboxView />
      {:else if activeTab === 'settings'}
        <SettingsView />
      {/if}
    </main>
  </div>

  <LockScreenModal />
  <GlobalSearchModal bind:isOpen={isSearchOpen} on:navigate={handleNavigate} />
  <AuthModal bind:isOpen={isAuthOpen} />
</div>
