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
  import type { WidgetConfig, PositionConfig, ResponsiveValue } from '$lib/types/pages';
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
  export let position: ResponsiveValue<PositionConfig> | undefined = undefined; // Optional position override from layout

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

  // Position styling - get values from position prop (override) or config.position (responsive)
  // Handle legacy format where position might be a string instead of an object
  $: effectivePosition = position || (typeof config.position === 'string' ? null : config.position);
  $: legacyPositionType = typeof config.position === 'string' ? config.position : null;
  $: positionDesktop = effectivePosition?.desktop || {};
  $: positionType = positionDesktop.type || legacyPositionType || 'static';
  $: positionTop = positionDesktop.top;
  $: positionRight = positionDesktop.right;
  $: positionBottom = positionDesktop.bottom;
  $: positionLeft = positionDesktop.left;
  $: positionZIndex = positionDesktop.zIndex;

  // Build position style string
  $: positionStyle = (() => {
    const styles: string[] = [];
    if (positionType && positionType !== 'static') {
      styles.push(`position: ${positionType}`);
      if (positionTop) styles.push(`top: ${positionTop}`);
      if (positionRight) styles.push(`right: ${positionRight}`);
      if (positionBottom) styles.push(`bottom: ${positionBottom}`);
      if (positionLeft) styles.push(`left: ${positionLeft}`);
      if (positionZIndex !== undefined) styles.push(`z-index: ${positionZIndex}`);
    }
    return styles.length > 0 ? styles.join('; ') + ';' : '';
  })();

  // Check if we need a position wrapper
  $: needsPositionWrapper = positionType && positionType !== 'static';

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
        {positionStyle}
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
        {positionStyle}
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
    {#if needsPositionWrapper}
      <div class="position-wrapper" style={positionStyle}>
        <NavBar {config} {onLogout} {siteContext} user={user ?? undefined} />
      </div>
    {:else}
      <NavBar {config} {onLogout} {siteContext} user={user ?? undefined} />
    {/if}
  {:else if type === 'footer' && !usesContainerChildren}
    <!-- Built-in footer (no custom children) -->
    {#if needsPositionWrapper}
      <div class="position-wrapper" style={positionStyle}>
        <Footer {config} {siteContext} user={user ?? undefined} />
      </div>
    {:else}
      <Footer {config} {siteContext} user={user ?? undefined} />
    {/if}
  {:else if type === 'text'}
    {#if needsPositionWrapper}
      <div class="position-wrapper" style={positionStyle}>
        <TextComponent {config} {siteContext} {user} />
      </div>
    {:else}
      <TextComponent {config} {siteContext} {user} />
    {/if}
  {:else if type === 'image'}
    {#if needsPositionWrapper}
      <div class="position-wrapper" style={positionStyle}>
        <ImageComponent {config} />
      </div>
    {:else}
      <ImageComponent {config} />
    {/if}
  {:else if type === 'single_product'}
    {#if needsPositionWrapper}
      <div class="position-wrapper" style={positionStyle}>
        <SingleProductComponent {config} />
      </div>
    {:else}
      <SingleProductComponent {config} />
    {/if}
  {:else if type === 'product_list'}
    {#if needsPositionWrapper}
      <div class="position-wrapper" style={positionStyle}>
        <ProductListComponent {config} />
      </div>
    {:else}
      <ProductListComponent {config} />
    {/if}
  {:else if type === 'hero'}
    {#if needsPositionWrapper}
      <div class="position-wrapper" style={positionStyle}>
        <HeroComponent {config} {colorTheme} {siteContext} {user} />
      </div>
    {:else}
      <HeroComponent {config} {colorTheme} {siteContext} {user} />
    {/if}
  {:else if type === 'button'}
    {#if needsPositionWrapper}
      <div class="position-wrapper" style={positionStyle}>
        <ButtonComponent {config} {siteContext} {user} />
      </div>
    {:else}
      <ButtonComponent {config} {siteContext} {user} />
    {/if}
  {:else if type === 'spacer'}
    {#if needsPositionWrapper}
      <div class="position-wrapper" style={positionStyle}>
        <SpacerComponent {config} />
      </div>
    {:else}
      <SpacerComponent {config} />
    {/if}
  {:else if type === 'divider'}
    {#if needsPositionWrapper}
      <div class="position-wrapper" style={positionStyle}>
        <DividerComponent {config} {colorTheme} />
      </div>
    {:else}
      <DividerComponent {config} {colorTheme} />
    {/if}
  {:else if type === 'columns'}
    {#if needsPositionWrapper}
      <div class="position-wrapper" style={positionStyle}>
        <ColumnsComponent {config} />
      </div>
    {:else}
      <ColumnsComponent {config} />
    {/if}
  {:else if type === 'heading'}
    {#if needsPositionWrapper}
      <div class="position-wrapper" style={positionStyle}>
        <HeadingComponent {config} {colorTheme} {siteContext} {user} />
      </div>
    {:else}
      <HeadingComponent {config} {colorTheme} {siteContext} {user} />
    {/if}
  {:else if type === 'features'}
    {#if needsPositionWrapper}
      <div class="position-wrapper" style={positionStyle}>
        <FeaturesComponent {config} {colorTheme} {siteContext} {user} />
      </div>
    {:else}
      <FeaturesComponent {config} {colorTheme} {siteContext} {user} />
    {/if}
  {:else if type === 'pricing'}
    {#if needsPositionWrapper}
      <div class="position-wrapper" style={positionStyle}>
        <PricingComponent {config} />
      </div>
    {:else}
      <PricingComponent {config} />
    {/if}
  {:else if type === 'cta'}
    {#if needsPositionWrapper}
      <div class="position-wrapper" style={positionStyle}>
        <CTAComponent {config} {colorTheme} {siteContext} {user} />
      </div>
    {:else}
      <CTAComponent {config} {colorTheme} {siteContext} {user} />
    {/if}
  {:else if type === 'dropdown'}
    {#if needsPositionWrapper}
      <div class="position-wrapper" style={positionStyle}>
        <DropdownComponent {config} {siteContext} {user} />
      </div>
    {:else}
      <DropdownComponent {config} {siteContext} {user} />
    {/if}
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

  .position-wrapper {
    width: 100%;
    box-sizing: border-box;
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
