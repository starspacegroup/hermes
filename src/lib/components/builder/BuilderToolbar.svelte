<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    Save,
    Upload,
    X,
    Undo2,
    Redo2,
    Smartphone,
    Tablet,
    Monitor,
    Eye,
    Edit3,
    Sparkles
  } from 'lucide-svelte';

  export let title: string;
  export let slug: string;
  export let currentBreakpoint: 'mobile' | 'tablet' | 'desktop';
  export let viewMode: 'edit' | 'preview';
  export let hasUnsavedChanges: boolean;
  export let isSaving: boolean;
  export let lastSavedAt: Date | null;
  export let canUndo: boolean;
  export let canRedo: boolean;

  const dispatch = createEventDispatcher();

  function formatLastSaved() {
    if (!lastSavedAt) return '';
    const now = new Date();
    const diff = now.getTime() - lastSavedAt.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    return lastSavedAt.toLocaleTimeString();
  }
</script>

<div class="builder-toolbar">
  <div class="toolbar-left">
    <button class="btn-icon" on:click={() => dispatch('exit')} aria-label="Exit builder">
      <X size={20} />
    </button>
    <div class="page-info">
      <input
        type="text"
        class="title-input"
        value={title}
        on:input={(e) => dispatch('updateTitle', e.currentTarget.value)}
        placeholder="Page title"
      />
      <input
        type="text"
        class="slug-input"
        value={slug}
        on:input={(e) => dispatch('updateSlug', e.currentTarget.value)}
        placeholder="/page-url"
      />
    </div>
  </div>

  <div class="toolbar-center">
    <div class="breakpoint-switcher">
      <button
        class="btn-breakpoint"
        class:active={currentBreakpoint === 'mobile'}
        on:click={() => dispatch('changeBreakpoint', 'mobile')}
        aria-label="Mobile view"
      >
        <Smartphone size={18} />
      </button>
      <button
        class="btn-breakpoint"
        class:active={currentBreakpoint === 'tablet'}
        on:click={() => dispatch('changeBreakpoint', 'tablet')}
        aria-label="Tablet view"
      >
        <Tablet size={18} />
      </button>
      <button
        class="btn-breakpoint"
        class:active={currentBreakpoint === 'desktop'}
        on:click={() => dispatch('changeBreakpoint', 'desktop')}
        aria-label="Desktop view"
      >
        <Monitor size={18} />
      </button>
    </div>

    <div class="view-mode-switcher">
      <button
        class="btn-mode"
        class:active={viewMode === 'edit'}
        on:click={() => dispatch('changeViewMode', 'edit')}
        aria-label="Edit mode"
      >
        <Edit3 size={18} />
        <span>Edit</span>
      </button>
      <button
        class="btn-mode"
        class:active={viewMode === 'preview'}
        on:click={() => dispatch('changeViewMode', 'preview')}
        aria-label="Preview mode"
      >
        <Eye size={18} />
        <span>Preview</span>
      </button>
    </div>
  </div>

  <div class="toolbar-right">
    <button
      class="btn-icon"
      disabled={!canUndo}
      on:click={() => dispatch('undo')}
      aria-label="Undo"
    >
      <Undo2 size={18} />
    </button>
    <button
      class="btn-icon"
      disabled={!canRedo}
      on:click={() => dispatch('redo')}
      aria-label="Redo"
    >
      <Redo2 size={18} />
    </button>

    <button class="btn-ai" on:click={() => dispatch('toggleAI')} aria-label="AI Assistant">
      <Sparkles size={18} />
      <span>AI</span>
    </button>

    <div class="save-status">
      {#if isSaving}
        <span class="saving">Saving...</span>
      {:else if hasUnsavedChanges}
        <span class="unsaved">Unsaved changes</span>
      {:else if lastSavedAt}
        <span class="saved">Saved {formatLastSaved()}</span>
      {/if}
    </div>

    <button class="btn-primary" on:click={() => dispatch('save')} disabled={isSaving}>
      <Save size={18} />
      <span>Save</span>
    </button>
    <button class="btn-publish" on:click={() => dispatch('publish')} disabled={isSaving}>
      <Upload size={18} />
      <span>Publish</span>
    </button>
  </div>
</div>

<style>
  .builder-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    padding: 0 1rem;
    background: var(--color-bg-primary);
    border-bottom: 1px solid var(--color-border-secondary);
    gap: 1rem;
    flex-shrink: 0;
  }

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .toolbar-center {
    flex: 1;
    justify-content: center;
  }

  .page-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .title-input,
  .slug-input {
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 4px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .title-input {
    font-weight: 600;
  }

  .slug-input {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }

  .title-input:focus,
  .slug-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .breakpoint-switcher,
  .view-mode-switcher {
    display: flex;
    gap: 0.25rem;
    background: var(--color-bg-secondary);
    border-radius: 6px;
    padding: 0.25rem;
  }

  .btn-icon,
  .btn-breakpoint,
  .btn-mode {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background: none;
    border: none;
    border-radius: 4px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-breakpoint,
  .btn-mode {
    gap: 0.5rem;
  }

  .btn-icon:hover:not(:disabled),
  .btn-breakpoint:hover,
  .btn-mode:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .btn-icon:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-breakpoint.active,
  .btn-mode.active {
    background: var(--color-primary);
    color: white;
  }

  .btn-ai {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .btn-ai:hover {
    opacity: 0.9;
  }

  .btn-primary,
  .btn-publish {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
  }

  .btn-publish {
    background: var(--color-success);
    color: white;
  }

  .btn-primary:hover,
  .btn-publish:hover {
    opacity: 0.9;
  }

  .btn-primary:disabled,
  .btn-publish:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .save-status {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
    border-radius: 4px;
  }

  .saving {
    color: var(--color-warning);
  }

  .unsaved {
    color: var(--color-danger);
  }

  .saved {
    color: var(--color-success);
  }

  @media (max-width: 1024px) {
    .toolbar-center {
      display: none;
    }

    .page-info {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .builder-toolbar {
      padding: 0.5rem;
      gap: 0.5rem;
    }

    .toolbar-right {
      gap: 0.5rem;
    }

    .btn-primary span,
    .btn-publish span,
    .btn-ai span {
      display: none;
    }

    .save-status {
      display: none;
    }
  }
</style>
