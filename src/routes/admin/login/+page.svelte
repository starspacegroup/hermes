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
</script>

<svelte:head>
  <title>Admin Login - Hermes</title>
  <meta name="description" content="Admin login for Hermes eCommerce Platform" />
</svelte:head>

<div class="login-container">
  <div class="login-card">
    <div class="login-header">
      <h1>Admin Login</h1>
      <p>Sign in to access the admin dashboard</p>
    </div>

    <form on:submit|preventDefault={handleLogin}>
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          on:keypress={handleKeyPress}
          placeholder="admin@hermes.local"
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
      <p>Email: admin@hermes.local</p>
      <p>Password: admin123</p>
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
    text-align: center;
  }

  .demo-credentials p {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    margin: 0.25rem 0;
    transition: color var(--transition-normal);
  }

  .demo-credentials strong {
    color: var(--color-text-primary);
    transition: color var(--transition-normal);
  }

  @media (max-width: 480px) {
    .login-card {
      padding: 2rem;
    }

    .login-header h1 {
      font-size: 1.5rem;
    }
  }
</style>
