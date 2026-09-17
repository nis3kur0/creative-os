<script lang="ts">
  import { passcodeStore } from '../stores/passcodeStore';
  import { authStore } from '../stores/authStore';
  import Icon from './Icon.svelte';

  let inputPasscode = '';
  let errorMsg = '';
  let showRecovery = false;

  async function handleUnlock() {
    errorMsg = '';
    if (!inputPasscode) return;
    const success = await passcodeStore.unlock(inputPasscode);
    if (!success) {
      errorMsg = 'Passcode incorrecto. Intenta de nuevo.';
      inputPasscode = '';
    } else {
      inputPasscode = '';
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleUnlock();
  }

  function handleResetViaAuth() {
    if (confirm('¿Deseas restablecer el passcode local? Se desbloqueará la pantalla y podrás configurar una nueva clave.')) {
      passcodeStore.removePasscode();
      showRecovery = false;
    }
  }
</script>

{#if $passcodeStore.isLocked}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl transition-all duration-300">
    <div class="glass-panel w-full max-w-md p-8 rounded-2xl shadow-2xl border border-indigo-500/30 text-center relative overflow-hidden">
      <!-- Glow effect -->
      <div class="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>

      <div class="relative z-10 flex flex-col items-center">
        <div class="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mb-4 text-indigo-400 shadow-lg shadow-indigo-500/10">
          <Icon name="Lock" size={32} />
        </div>

        <h2 class="text-2xl font-bold text-white tracking-tight mb-1">Creative OS Bloqueado</h2>
        <p class="text-xs text-slate-400 mb-6">Bloqueo de inactividad local activo. Introduce tu passcode para continuar.</p>

        {#if errorMsg}
          <div class="w-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-lg mb-4 flex items-center justify-center gap-2">
            <Icon name="AlertCircle" size={14} />
            <span>{errorMsg}</span>
          </div>
        {/if}

        <div class="w-full mb-6">
          <input
            type="password"
            bind:value={inputPasscode}
            on:keydown={handleKeydown}
            placeholder="Introduce passcode local"
            class="w-full px-4 py-3 rounded-xl glass-input text-center text-lg tracking-widest font-mono focus:ring-2 focus:ring-indigo-500"
            autofocus
          />
        </div>

        <button
          on:click={handleUnlock}
          class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
        >
          <Icon name="Unlock" size={18} />
          <span>Desbloquear</span>
        </button>

        <div class="mt-6 pt-4 border-t border-slate-800 w-full">
          <button
            on:click={() => showRecovery = !showRecovery}
            class="text-xs text-slate-400 hover:text-indigo-400 transition"
          >
            ¿Olvidaste tu passcode local?
          </button>

          {#if showRecovery}
            <div class="mt-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-left">
              <p class="text-xs text-slate-300 mb-2">Puedes desbloquear la aplicación restableciendo el passcode mediante la sesión activa ({$authStore.user?.email || 'Modo Demo'}).</p>
              <button
                on:click={handleResetViaAuth}
                class="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition"
              >
                Restablecer passcode local
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
