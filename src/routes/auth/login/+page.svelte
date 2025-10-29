<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { toastStore } from '$lib/stores/toast';
  import Button from '$lib/components/Button.svelte';

  let email = '';
  let password = '';
  let isLoading = false;
  let error = '';

  async function handleLogin() {
    error = '';

    // Basic validation
    if (!email || !password) {
      error = 'Please enter both email and password';
      return;
    }

    isLoading = true;

    try {
      const success = await authStore.login(email, password);

      if (success) {
        toastStore.success('Login successful!');
        goto('/admin/dashboard');
      } else {
        error = 'Invalid email or password';
        toastStore.error('Login failed. Please check your credentials.');
      }
    } catch {
      error = 'An error occurred during login';
      toastStore.error('An error occurred. Please try again.');
    } finally {
      isLoading = false;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleLogin();
    }
  }

  function fillCredentials(userEmail: string, userPassword: string) {
    email = userEmail;
    password = userPassword;
  }
</script>

<svelte:head>
  <title>Login - Hermes</title>
  <meta name="description" content="Login to Hermes eCommerce Platform" />
</svelte:head>

<div class="login-container">
  <div class="login-card">
    <div class="login-header">
      <h1>Login</h1>
      <p>Sign in to access your account</p>
    </div>

    <form on:submit|preventDefault={handleLogin}>
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          on:keypress={handleKeyPress}
          placeholder="Enter your email"
          disabled={isLoading}
          required
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          on:keypress={handleKeyPress}
          placeholder="Enter your password"
          disabled={isLoading}
          required
        />
      </div>

      {#if error}
        <div class="error-message">
          {error}
        </div>
      {/if}

      <div class="form-actions">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>
    </form>

    <div class="demo-credentials">
      <p><strong>Demo Credentials:</strong></p>
      <div class="credential-item">
        <p class="credential-title">Regular User:</p>
        <button
          type="button"
          class="credential-group clickable"
          on:click={() => fillCredentials('user@hermes.local', 'TfppPEsXnfZluUi52ne538O')}
          disabled={isLoading}
        >
          <p>Email: user@hermes.local</p>
          <p>Password: TfppPEsXnfZluUi52ne538O</p>
        </button>
      </div>
      <div class="credential-item">
        <p class="credential-title">Site Owner (Admin):</p>
        <button
          type="button"
          class="credential-group clickable"
          on:click={() => fillCredentials('owner@hermes.local', '4a6lJebYdNkr2zjq5j59rTt')}
          disabled={isLoading}
        >
          <p>Email: owner@hermes.local</p>
          <p>Password: 4a6lJebYdNkr2zjq5j59rTt</p>
        </button>
      </div>
      <div class="credential-item">
        <p class="credential-title">Platform Engineer:</p>
        <button
          type="button"
          class="credential-group clickable"
          on:click={() => fillCredentials('engineer@hermes.local', '')}
          disabled={isLoading}
          title="Password must be set via PLATFORM_ENGINEER_PASSWORD environment variable"
        >
          <p>Email: engineer@hermes.local</p>
          <p>Password: (Set via env var)</p>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .login-container {
    min-height: calc(100vh - 200px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .login-card {
    width: 100%;
    max-width: 420px;
    background: var(--color-bg-primary);
    border-radius: 12px;
    box-shadow: 0 4px 20px var(--color-shadow-medium);
    padding: 2.5rem;
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .login-header h1 {
    color: var(--color-primary);
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    transition: color var(--transition-normal);
  }

  .login-header p {
    color: var(--color-text-secondary);
    margin: 0;
    transition: color var(--transition-normal);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    color: var(--color-text-primary);
    font-weight: 600;
    font-size: 0.9rem;
    transition: color var(--transition-normal);
  }

  input {
    padding: 0.75rem;
    border: 2px solid var(--color-border-secondary);
    border-radius: 6px;
    font-size: 1rem;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    transition:
      border-color var(--transition-normal),
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  input:focus {
    outline: none;
    border-color: var(--color-border-focus);
  }

  input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error-message {
    padding: 0.75rem;
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid var(--color-danger);
    border-radius: 6px;
    color: var(--color-danger);
    font-size: 0.9rem;
  }

  .form-actions {
    margin-top: 0.5rem;
  }

  .demo-credentials {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-border-secondary);
    text-align: left;
  }

  .demo-credentials > p:first-child {
    text-align: center;
    margin-bottom: 1rem;
  }

  .credential-item {
    margin-bottom: 1.25rem;
  }

  .credential-title {
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 0.5rem 0 !important;
    font-size: 0.95rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .credential-group {
    padding: 0.75rem;
    background: var(--color-bg-secondary);
    border-radius: 6px;
    border: 1px solid var(--color-border-secondary);
    width: 100%;
    text-align: left;
    font: inherit;
    transition:
      background-color var(--transition-normal),
      border-color var(--transition-normal),
      transform var(--transition-fast);
  }

  .credential-group.clickable {
    cursor: pointer;
  }

  .credential-group.clickable:hover:not(:disabled) {
    background: var(--color-bg-accent);
    border-color: var(--color-primary);
    transform: translateY(-2px);
  }

  .credential-group.clickable:active:not(:disabled) {
    transform: translateY(0);
  }

  .credential-group:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .demo-credentials p {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    margin: 0.25rem 0;
    transition: color var(--transition-normal);
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .demo-credentials strong {
    color: var(--color-text-primary);
    transition: color var(--transition-normal);
  }

  @media (max-width: 768px) {
    .login-container {
      padding: 1rem;
      min-height: calc(100vh - 150px);
    }

    .login-card {
      padding: 1.5rem;
      max-width: 100%;
    }

    .login-header h1 {
      font-size: 1.5rem;
    }

    .demo-credentials p {
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .credential-title {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    .login-card {
      padding: 1.25rem;
    }

    .login-header {
      margin-bottom: 1.5rem;
    }

    .login-header h1 {
      font-size: 1.4rem;
    }

    .login-header p {
      font-size: 0.9rem;
    }

    .demo-credentials p {
      font-size: 0.8rem;
    }

    .credential-title {
      font-size: 0.85rem;
    }

    input {
      padding: 0.65rem;
      font-size: 0.95rem;
    }

    label {
      font-size: 0.85rem;
    }
  }
</style>
