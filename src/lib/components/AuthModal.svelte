<script lang="ts">
  import { authStore } from '../stores/authStore';
  import { getSupabase } from '../services/supabaseClient';
  import Icon from './Icon.svelte';

  export let isOpen = false;

  let mode: 'login' | 'signup' = 'login';
  let email = '';
  let password = '';
  let name = '';
  let errorMsg = '';
  let infoMsg = '';
  let loading = false;

  async function handleSubmit() {
    errorMsg = '';
    infoMsg = '';
    if (!email || !password) {
      errorMsg = 'Por favor completa correo y contraseña.';
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      errorMsg = 'Supabase no está configurado. Conéctalo desde Configuración o usa el Modo Demo.';
      return;
    }

    loading = true;
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        isOpen = false;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } }
        });
        if (error) throw error;
        infoMsg = '¡Cuenta creada! Revisa tu correo electrónico para confirmar el registro.';
      }
    } catch (e: any) {
      errorMsg = e.message || 'Error al autenticar.';
    } finally {
      loading = false;
    }
  }

  function handleDemo() {
    authStore.enableDemoMode();
    isOpen = false;
  }

  async function handleSignOut() {
    await authStore.signOut();
    isOpen = false;
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4" on:click={() => isOpen = false}>
    <div class="glass-panel w-full max-w-md p-6 rounded-2xl border border-indigo-500/30 shadow-2xl" on:click|stopPropagation>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-white font-heading flex items-center gap-2">
          <Icon name="User" size={20} className="text-indigo-400" />
          <span>Cuenta & Autenticación</span>
        </h3>
        <button on:click={() => isOpen = false} class="text-slate-400 hover:text-white">
          <Icon name="X" size={18} />
        </button>
      </div>

      {#if $authStore.user && !$authStore.isDemo}
        <!-- Logged in view -->
        <div class="space-y-4 py-2">
          <div class="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
            <p class="text-xs text-emerald-300 font-mono">Sesión iniciada como:</p>
            <p class="text-sm font-bold text-white mt-1">{$authStore.user.email}</p>
          </div>

          <button
            on:click={handleSignOut}
            class="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-xl shadow-md transition"
          >
            Cerrar Sesión
          </button>
        </div>
      {:else}
        <!-- Login / Register form -->
        <div class="space-y-4">
          <div class="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              on:click={() => mode = 'login'}
              class="flex-1 py-1.5 rounded-lg text-xs font-medium transition {mode === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-400'}"
            >
              Iniciar Sesión
            </button>
            <button
              on:click={() => mode = 'signup'}
              class="flex-1 py-1.5 rounded-lg text-xs font-medium transition {mode === 'signup' ? 'bg-indigo-600 text-white' : 'text-slate-400'}"
            >
              Registrarse
            </button>
          </div>

          {#if errorMsg}
            <div class="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs rounded-xl">
              {errorMsg}
            </div>
          {/if}

          {#if infoMsg}
            <div class="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl">
              {infoMsg}
            </div>
          {/if}

          {#if mode === 'signup'}
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Nombre</label>
              <input type="text" bind:value={name} placeholder="Tu nombre" class="w-full px-3 py-2 rounded-xl glass-input text-xs" />
            </div>
          {/if}

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Correo electrónico</label>
            <input type="email" bind:value={email} placeholder="correo@ejemplo.com" class="w-full px-3 py-2 rounded-xl glass-input text-xs" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
            <input type="password" bind:value={password} placeholder="••••••••" class="w-full px-3 py-2 rounded-xl glass-input text-xs" />
          </div>

          <button
            on:click={handleSubmit}
            disabled={loading}
            class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition"
          >
            {loading ? 'Procesando...' : (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>

          <div class="pt-3 border-t border-slate-800 text-center">
            <button on:click={handleDemo} class="text-xs text-amber-400 hover:text-amber-300 underline font-medium">
              Continuar en Modo Demo local (sin servidor)
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
