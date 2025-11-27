import { writable } from 'svelte/store';
import type { PageWidget } from '$lib/types/pages';

/**
 * Builder Context Store
 * Tracks the current state of the advanced builder for AI awareness
 */

export type BuilderMode = 'page' | 'layout' | 'component';

export interface BuilderContextState {
  mode: BuilderMode | null;
  entityId: string | null;
  entityName: string;
  slug: string;
  widgets: PageWidget[];
  isActive: boolean;
  layoutId: number | null;
}

const initialState: BuilderContextState = {
  mode: null,
  entityId: null,
  entityName: '',
  slug: '',
  widgets: [],
  isActive: false,
  layoutId: null
};

function createBuilderContextStore() {
  const { subscribe, set, update } = writable<BuilderContextState>(initialState);

  return {
    subscribe,

    /**
     * Activate the builder with current context
     */
    activate: (
      mode: BuilderMode,
      entityId: string | null,
      entityName: string,
      slug: string,
      widgets: PageWidget[],
      layoutId: number | null = null
    ) => {
      set({
        mode,
        entityId,
        entityName,
        slug,
        widgets: JSON.parse(JSON.stringify(widgets)), // Deep clone
        isActive: true,
        layoutId
      });
    },

    /**
     * Update the current builder state
     */
    updateState: (updates: Partial<Omit<BuilderContextState, 'mode' | 'isActive'>>) => {
      update((state) => ({
        ...state,
        ...updates,
        // Deep clone widgets if provided
        widgets: updates.widgets ? JSON.parse(JSON.stringify(updates.widgets)) : state.widgets
      }));
    },

    /**
     * Update widgets only
     */
    updateWidgets: (widgets: PageWidget[]) => {
      update((state) => ({
        ...state,
        widgets: JSON.parse(JSON.stringify(widgets))
      }));
    },

    /**
     * Update entity name (title)
     */
    updateEntityName: (entityName: string) => {
      update((state) => ({
        ...state,
        entityName
      }));
    },

    /**
     * Update slug
     */
    updateSlug: (slug: string) => {
      update((state) => ({
        ...state,
        slug
      }));
    },

    /**
     * Deactivate the builder
     */
    deactivate: () => {
      set(initialState);
    },

    /**
     * Reset to initial state
     */
    reset: () => {
      set(initialState);
    }
  };
}

export const builderContextStore = createBuilderContextStore();
