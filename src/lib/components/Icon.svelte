<script lang="ts">
  import * as icons from 'lucide-svelte';

  export let name: string = 'Circle';
  export let size: number = 18;
  export let color: string = 'currentColor';
  export let className: string = '';

  $: IconComponent = (icons as any)[name] || (icons as any)[capitalize(name)] || icons.HelpCircle;

  function capitalize(str: string) {
    if (!str) return 'HelpCircle';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
</script>

<svelte:component this={IconComponent} size={size} color={color} class={className} />
