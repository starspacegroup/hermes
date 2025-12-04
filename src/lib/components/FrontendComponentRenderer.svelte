<script lang="ts">
  /**
   * FrontendComponentRenderer - Renders page/layout components on the public frontend
   *
   * This component handles:
   * 1. Rendering any component type based on its config
   * 2. Recursively rendering children for container-based components
   * 3. Template substitution using site context
   * 4. Visibility filtering based on user auth state and roles
   *
   * Unlike the admin ComponentRenderer, this is read-only and optimized for public display.
   */
  import type { WidgetConfig } from '$lib/types/pages';
  import type { SiteContext } from '$lib/utils/templateSubstitution';

  // User type for visibility checking
  interface UserInfo {
    id?: number | string;
    email?: string;
    name?: string;
    role?: string;
    roles?: string[]; // Allow multiple roles
  }

  // Define child component interface for nested widgets
  interface ChildWidget {
    id?: string;
    type: string;
    config?: WidgetConfig;
    position?: number;
  }

  // Component imports
  import TextComponent from '$lib/components/builtin/Text.svelte';
  import ImageComponent from '$lib/components/builtin/Image.svelte';
  import SingleProductComponent from '$lib/components/builtin/SingleProduct.svelte';
  import ProductListComponent from '$lib/components/builtin/ProductList.svelte';
  import HeroComponent from '$lib/components/builtin/Hero.svelte';
  import ButtonComponent from '$lib/components/builtin/Button.svelte';
  import SpacerComponent from '$lib/components/builtin/Spacer.svelte';
  import DividerComponent from '$lib/components/builtin/Divider.svelte';
  import ColumnsComponent from '$lib/components/builtin/Columns.svelte';
  import HeadingComponent from '$lib/components/builtin/Heading.svelte';
  import FeaturesComponent from '$lib/components/builtin/Features.svelte';
  import PricingComponent from '$lib/components/builtin/Pricing.svelte';
  import CTAComponent from '$lib/components/builtin/CTA.svelte';
  import NavBar from '$lib/components/builtin/NavBar.svelte';
  import Footer from '$lib/components/builtin/Footer.svelte';
  import DropdownComponent from '$lib/components/builtin/Dropdown.svelte';

  // Props
  export let type: string;
  export let config: WidgetConfig = {};
  export let colorTheme: string = 'vibrant';
  export let siteContext: SiteContext | undefined = undefined;
  export let onLogout: (() => void) | undefined = undefined;
  export let user: UserInfo | null | undefined = undefined; // Current user for visibility checks

  /**
   * Check if the component should be visible based on visibility rules
   * @returns true if component should be rendered, false to hide
   */
  function checkVisibility(): boolean {
    const visibilityRule = config.visibilityRule ?? 'always';
    const requiredRoles = config.requiredRoles ?? [];
    const hideFromRoles = config.hideFromRoles ?? [];

    const isAuthenticated = !!user;
    const userRoles = getUserRoles();

    // Check hideFromRoles first (takes priority)
    if (hideFromRoles.length > 0 && userRoles.some((r) => hideFromRoles.includes(r))) {
      return false; // Hide from this user
    }

    switch (visibilityRule) {
      case 'always':
        return true;
      case 'authenticated':
        return isAuthenticated;
      case 'unauthenticated':
        return !isAuthenticated;
      case 'role':
        // User must be authenticated AND have at least one of the required roles
        if (!isAuthenticated) return false;
        if (requiredRoles.length === 0) return true; // No specific roles required, just auth
        return userRoles.some((r) => requiredRoles.includes(r));
      default:
        return true;
    }
  }

  /**
   * Get all roles for the current user
   */
  function getUserRoles(): string[] {
    if (!user) return [];
    const roles: string[] = [];
    if (user.role) roles.push(user.role);
    if (user.roles) roles.push(...user.roles);
    return roles;
  }

  // Check visibility once
  $: isVisible = checkVisibility();

  // Extract children from config for container-based components
  $: children = (config.children as ChildWidget[] | undefined) || [];

  // Get responsive values for container styling
  function getResponsiveValue<T>(
    value: T | { mobile?: T; tablet?: T; desktop: T } | undefined,
    defaultValue: T
  ): T {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'object' && value !== null && 'desktop' in value) {
      return (value as { desktop: T }).desktop;
    }
    return value as T;
  }

  // Container styling
  $: containerPadding = config.containerPadding || {
    desktop: { top: 0, right: 0, bottom: 0, left: 0 }
  };
  $: containerMargin = config.containerMargin || {
    desktop: { top: 0, right: 0, bottom: 0, left: 0 }
  };
  $: containerBackground = config.containerBackground || 'transparent';
  $: containerBorderRadius = config.containerBorderRadius || 0;
  $: containerMaxWidth = config.containerMaxWidth || '100%';
  $: containerGap = getResponsiveValue(config.containerGap, 16);
  $: containerDisplay = getResponsiveValue(config.containerDisplay, 'flex');
  $: containerFlexDirection = getResponsiveValue(config.containerFlexDirection, 'row');
  $: containerJustifyContent = config.containerJustifyContent || 'flex-start';
  $: containerAlignItems = config.containerAlignItems || 'stretch';
  $: containerWrap = config.containerWrap || 'nowrap';

  $: paddingDesktop = containerPadding.desktop || { top: 0, right: 0, bottom: 0, left: 0 };
  $: marginDesktop = containerMargin.desktop || { top: 0, right: 0, bottom: 0, left: 0 };

  // Check if this is a container-type component
  $: isContainer = type === 'container' || type === 'row' || type === 'flex';

  // Check if this component type uses container-based rendering with children
  $: usesContainerChildren = (type === 'navbar' || type === 'footer') && children.length > 0;
</script>

{#if isVisible}
  {#if usesContainerChildren}
    <!-- Container-based navbar/footer with custom children -->
    <div
      class="frontend-container {type}-container"
      style="
        display: {containerDisplay};
        flex-direction: {containerFlexDirection};
        justify-content: {containerJustifyContent};
        align-items: {containerAlignItems};
        flex-wrap: {containerWrap};
        gap: {containerGap}px;
        max-width: {containerMaxWidth};
        background: {containerBackground};
        border-radius: {containerBorderRadius}px;
        padding: {paddingDesktop.top}px {paddingDesktop.right}px {paddingDesktop.bottom}px {paddingDesktop.left}px;
        margin: {marginDesktop.top}px auto {marginDesktop.bottom}px;
        width: 100%;
        box-sizing: border-box;
      "
    >
      {#each children as child, i (child.id || i)}
        <svelte:self
          type={child.type}
          config={child.config || child}
          {colorTheme}
          {siteContext}
          {user}
        />
      {/each}
    </div>
  {:else if isContainer}
    <!-- Generic container with children -->
    <div
      class="frontend-container"
      style="
        display: {containerDisplay};
        flex-direction: {containerFlexDirection};
        justify-content: {containerJustifyContent};
        align-items: {containerAlignItems};
        flex-wrap: {containerWrap};
        gap: {containerGap}px;
        max-width: {containerMaxWidth};
        background: {containerBackground};
        border-radius: {containerBorderRadius}px;
        padding: {paddingDesktop.top}px {paddingDesktop.right}px {paddingDesktop.bottom}px {paddingDesktop.left}px;
        margin: {marginDesktop.top}px auto {marginDesktop.bottom}px;
        width: 100%;
        box-sizing: border-box;
      "
    >
      {#if children.length > 0}
        {#each children as child, i (child.id || i)}
          <svelte:self
            type={child.type}
            config={child.config || child}
            {colorTheme}
            {siteContext}
            {user}
          />
        {/each}
      {/if}
    </div>
  {:else if type === 'navbar' && !usesContainerChildren}
    <!-- Built-in navbar (no custom children) -->
    <NavBar {config} {onLogout} {siteContext} user={user ?? undefined} />
  {:else if type === 'footer' && !usesContainerChildren}
    <!-- Built-in footer (no custom children) -->
    <Footer {config} {siteContext} user={user ?? undefined} />
  {:else if type === 'text'}
    <TextComponent {config} {siteContext} {user} />
  {:else if type === 'image'}
    <ImageComponent {config} />
  {:else if type === 'single_product'}
    <SingleProductComponent {config} />
  {:else if type === 'product_list'}
    <ProductListComponent {config} />
  {:else if type === 'hero'}
    <HeroComponent {config} {colorTheme} {siteContext} {user} />
  {:else if type === 'button'}
    <ButtonComponent {config} {siteContext} {user} />
  {:else if type === 'spacer'}
    <SpacerComponent {config} />
  {:else if type === 'divider'}
    <DividerComponent {config} {colorTheme} />
  {:else if type === 'columns'}
    <ColumnsComponent {config} />
  {:else if type === 'heading'}
    <HeadingComponent {config} {colorTheme} {siteContext} {user} />
  {:else if type === 'features'}
    <FeaturesComponent {config} {colorTheme} {siteContext} {user} />
  {:else if type === 'pricing'}
    <PricingComponent {config} />
  {:else if type === 'cta'}
    <CTAComponent {config} {colorTheme} {siteContext} {user} />
  {:else if type === 'dropdown'}
    <DropdownComponent {config} {siteContext} {user} />
  {:else}
    <!-- Unknown component type - render as placeholder -->
    <div class="unknown-component">
      Unknown component type: {type}
    </div>
  {/if}
{/if}

<style>
  .frontend-container {
    width: 100%;
    box-sizing: border-box;
  }

  .navbar-container {
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .unknown-component {
    padding: 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 4px;
    color: #b91c1c;
    text-align: center;
  }
</style>
