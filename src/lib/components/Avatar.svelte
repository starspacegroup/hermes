<script lang="ts">
  /**
   * Reusable avatar component that displays user initials
   * Used consistently across the site for user representation
   */
  export let name: string | undefined = undefined;
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let variant: 'primary' | 'secondary' = 'primary';

  $: initial = name?.charAt(0)?.toUpperCase() || 'U';

  $: sizeClass = {
    small: 'avatar-small',
    medium: 'avatar-medium',
    large: 'avatar-large'
  }[size];

  $: variantClass = {
    primary: 'avatar-primary',
    secondary: 'avatar-secondary'
  }[variant];
</script>

<div
  class="avatar {sizeClass} {variantClass}"
  aria-label={name ? `${name}'s avatar` : 'User avatar'}
>
  {initial}
</div>

<style>
  .avatar {
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    flex-shrink: 0;
  }

  /* Size variants */
  .avatar-small {
    width: 32px;
    height: 32px;
    font-size: 0.875rem;
  }

  .avatar-medium {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .avatar-large {
    width: 40px;
    height: 40px;
    font-size: 1.125rem;
  }

  /* Color variants */
  .avatar-primary {
    background: var(--color-primary);
    color: var(--color-text-inverse);
  }

  .avatar-secondary {
    background: var(--color-text-secondary);
    color: white;
  }
</style>
