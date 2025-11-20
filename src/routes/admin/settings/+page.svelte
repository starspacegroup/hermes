<script lang="ts">
  import { enhance } from '$app/forms';
  import { toastStore } from '$lib/stores/toast';
  import ToggleSwitch from '$lib/components/ToggleSwitch.svelte';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  // Reactive statements to handle form responses
  $: if (form?.success) {
    toastStore.success(form.message || 'Settings saved successfully!');
  }
  $: if (form?.error) {
    toastStore.error(form.error);
  }

  // Initialize form data from server
  $: generalSettings = data.settings.general;
  $: addressSettings = data.settings.address;
  $: taxSettings = data.settings.tax;
  $: paymentSettings = data.settings.payment;
  $: emailSettings = data.settings.email;
  $: apiSettings = data.settings.api;

  let activeTab = 'general';
  let isSubmitting = false;
</script>

<svelte:head>
  <title>Settings - Hermes Admin</title>
</svelte:head>

<div class="settings-page">
  <div class="page-header">
    <h1>Site Settings</h1>
    <p>Manage your site configuration</p>
  </div>

  <!-- Tab Navigation -->
  <div class="tabs">
    <button
      class="tab"
      class:active={activeTab === 'general'}
      on:click={() => (activeTab = 'general')}
    >
      General
    </button>
    <button
      class="tab"
      class:active={activeTab === 'address'}
      on:click={() => (activeTab = 'address')}
    >
      Address & Location
    </button>
    <button class="tab" class:active={activeTab === 'tax'} on:click={() => (activeTab = 'tax')}>
      Tax Settings
    </button>
    <button
      class="tab"
      class:active={activeTab === 'payment'}
      on:click={() => (activeTab = 'payment')}
    >
      Payment
    </button>
    <button
      class="tab"
      class:active={activeTab === 'shipping'}
      on:click={() => (activeTab = 'shipping')}
    >
      Shipping
    </button>
    <button class="tab" class:active={activeTab === 'email'} on:click={() => (activeTab = 'email')}>
      Email
    </button>
    <button class="tab" class:active={activeTab === 'api'} on:click={() => (activeTab = 'api')}>
      API & Webhooks
    </button>
  </div>

  <div class="settings-grid">
    <!-- General Settings -->
    {#if activeTab === 'general'}
      <div class="settings-card">
        <h2>General Settings</h2>
        <form
          method="POST"
          action="?/updateGeneral"
          use:enhance={() => {
            isSubmitting = true;
            return async ({ update }) => {
              await update();
              isSubmitting = false;
            };
          }}
        >
          <div class="form-group">
            <label for="storeName">Store Name</label>
            <input
              id="storeName"
              name="storeName"
              type="text"
              value={generalSettings.storeName}
              required
            />
          </div>

          <div class="form-group">
            <label for="tagline">Tagline</label>
            <input id="tagline" name="tagline" type="text" value={generalSettings.tagline} />
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={generalSettings.description}
            ></textarea>
          </div>

          <div class="form-group">
            <label for="storeEmail">Store Email</label>
            <input
              id="storeEmail"
              name="storeEmail"
              type="email"
              value={generalSettings.storeEmail}
              required
            />
          </div>

          <div class="form-group">
            <label for="supportEmail">Support Email</label>
            <input
              id="supportEmail"
              name="supportEmail"
              type="email"
              value={generalSettings.supportEmail}
            />
          </div>

          <div class="form-group">
            <label for="contactPhone">Contact Phone</label>
            <input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              value={generalSettings.contactPhone}
            />
          </div>

          <div class="form-group">
            <label for="currency">Currency</label>
            <select id="currency" name="currency" value={generalSettings.currency}>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </select>
          </div>

          <div class="form-group">
            <label for="timezone">Timezone</label>
            <select id="timezone" name="timezone" value={generalSettings.timezone}>
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (US)</option>
              <option value="America/Chicago">Central Time (US)</option>
              <option value="America/Denver">Mountain Time (US)</option>
              <option value="America/Los_Angeles">Pacific Time (US)</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Australia/Sydney">Sydney</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="weightUnit">Weight Unit</label>
              <select id="weightUnit" name="weightUnit" value={generalSettings.weightUnit}>
                <option value="lb">Pounds (lb)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="oz">Ounces (oz)</option>
                <option value="g">Grams (g)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="dimensionUnit">Dimension Unit</label>
              <select id="dimensionUnit" name="dimensionUnit" value={generalSettings.dimensionUnit}>
                <option value="in">Inches (in)</option>
                <option value="cm">Centimeters (cm)</option>
                <option value="ft">Feet (ft)</option>
                <option value="m">Meters (m)</option>
              </select>
            </div>
          </div>

          <button type="submit" class="save-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    {/if}

    <!-- Address Settings -->
    {#if activeTab === 'address'}
      <div class="settings-card">
        <h2>Address & Location</h2>
        <form
          method="POST"
          action="?/updateAddress"
          use:enhance={() => {
            isSubmitting = true;
            return async ({ update }) => {
              await update();
              isSubmitting = false;
            };
          }}
        >
          <div class="form-group">
            <label for="street">Street Address</label>
            <input id="street" name="street" type="text" value={addressSettings.street} />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="city">City</label>
              <input id="city" name="city" type="text" value={addressSettings.city} />
            </div>

            <div class="form-group">
              <label for="state">State/Province</label>
              <input id="state" name="state" type="text" value={addressSettings.state} />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="postcode">Postal Code</label>
              <input id="postcode" name="postcode" type="text" value={addressSettings.postcode} />
            </div>

            <div class="form-group">
              <label for="country">Country</label>
              <select id="country" name="country" value={addressSettings.country}>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="JP">Japan</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <ToggleSwitch
              name="geolocationEnabled"
              checked={addressSettings.geolocationEnabled}
              label="Enable Geolocation"
              description="Allow customers to use their location for shipping estimates"
            />
          </div>

          <button type="submit" class="save-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    {/if}

    <!-- Tax Settings -->
    {#if activeTab === 'tax'}
      <div class="settings-card">
        <h2>Tax Settings</h2>
        <form
          method="POST"
          action="?/updateTax"
          use:enhance={() => {
            isSubmitting = true;
            return async ({ update }) => {
              await update();
              isSubmitting = false;
            };
          }}
        >
          <div class="form-group">
            <ToggleSwitch
              name="calculationsEnabled"
              checked={taxSettings.calculationsEnabled}
              label="Enable Tax Calculations"
              description="Automatically calculate taxes at checkout"
            />
          </div>

          <div class="form-group">
            <ToggleSwitch
              name="pricesIncludeTax"
              checked={taxSettings.pricesIncludeTax}
              label="Prices Include Tax"
              description="Product prices already include tax"
            />
          </div>

          <div class="form-group">
            <ToggleSwitch
              name="displayPricesWithTax"
              checked={taxSettings.displayPricesWithTax}
              label="Display Prices With Tax"
              description="Show tax-inclusive prices to customers"
            />
          </div>

          <div class="form-group">
            <label for="defaultRate">Default Tax Rate (%)</label>
            <input
              id="defaultRate"
              name="defaultRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={taxSettings.defaultRate}
            />
            <p class="help-text">Applied when specific tax rates aren't configured</p>
          </div>

          <button type="submit" class="save-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    {/if}

    <!-- Payment Settings -->
    {#if activeTab === 'payment'}
      <div class="settings-card">
        <h2>Payment Gateway Settings</h2>
        <form
          method="POST"
          action="?/updatePayment"
          use:enhance={() => {
            isSubmitting = true;
            return async ({ update }) => {
              await update();
              isSubmitting = false;
            };
          }}
        >
          <div class="form-section">
            <h3>Stripe</h3>

            <div class="form-group">
              <ToggleSwitch
                name="stripeEnabled"
                checked={paymentSettings.stripeEnabled}
                label="Enable Stripe"
              />
            </div>

            <div class="form-group">
              <label for="stripeMode">Mode</label>
              <select id="stripeMode" name="stripeMode" value={paymentSettings.stripeMode}>
                <option value="test">Test (Sandbox)</option>
                <option value="live">Live (Production)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="stripePublicKey">Publishable Key</label>
              <input
                id="stripePublicKey"
                name="stripePublicKey"
                type="text"
                value={paymentSettings.stripePublicKey}
                placeholder="pk_test_..."
              />
            </div>

            <div class="form-group">
              <label for="stripeSecretKey">Secret Key</label>
              <input
                id="stripeSecretKey"
                name="stripeSecretKey"
                type="password"
                value={paymentSettings.stripeSecretKey}
                placeholder="sk_test_..."
                autocomplete="off"
              />
              <p class="help-text">⚠️ Keys are stored securely but handle with care</p>
            </div>
          </div>

          <div class="form-section">
            <h3>PayPal</h3>

            <div class="form-group">
              <ToggleSwitch
                name="paypalEnabled"
                checked={paymentSettings.paypalEnabled}
                label="Enable PayPal"
              />
            </div>

            <div class="form-group">
              <label for="paypalMode">Mode</label>
              <select id="paypalMode" name="paypalMode" value={paymentSettings.paypalMode}>
                <option value="sandbox">Sandbox</option>
                <option value="live">Live</option>
              </select>
            </div>

            <div class="form-group">
              <label for="paypalClientId">Client ID</label>
              <input
                id="paypalClientId"
                name="paypalClientId"
                type="text"
                value={paymentSettings.paypalClientId}
              />
            </div>

            <div class="form-group">
              <label for="paypalClientSecret">Client Secret</label>
              <input
                id="paypalClientSecret"
                name="paypalClientSecret"
                type="password"
                value={paymentSettings.paypalClientSecret}
                autocomplete="off"
              />
            </div>
          </div>

          <div class="form-group">
            <ToggleSwitch
              name="testModeEnabled"
              checked={paymentSettings.testModeEnabled}
              label="Enable Test Mode for All Payments"
              description="No real transactions will be processed"
            />
          </div>

          <button type="submit" class="save-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    {/if}

    <!-- Shipping Settings -->
    {#if activeTab === 'shipping'}
      <div class="settings-card">
        <h2>Shipping Methods</h2>
        <p class="info-message">
          Configure shipping options in the
          <a href="/admin/settings/shipping">Shipping Options</a> page.
        </p>
        <div class="quick-nav">
          <a href="/admin/settings/shipping" class="nav-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
            Manage Shipping Options
          </a>
        </div>
      </div>
    {/if}

    <!-- API Settings -->
    {#if activeTab === 'api'}
      <div class="settings-card">
        <h2>API & Webhook Settings</h2>
        <form
          method="POST"
          action="?/updateApi"
          use:enhance={() => {
            isSubmitting = true;
            return async ({ update }) => {
              await update();
              isSubmitting = false;
            };
          }}
        >
          <div class="form-group">
            <ToggleSwitch
              name="restEnabled"
              checked={apiSettings.restEnabled}
              label="Enable REST API"
              description="Allow external applications to access your store data"
            />
          </div>

          <div class="form-section">
            <h3>Webhooks</h3>

            <div class="form-group">
              <label for="webhookOrderCreated">Order Created Webhook URL</label>
              <input
                id="webhookOrderCreated"
                name="webhookOrderCreated"
                type="url"
                value={apiSettings.webhookOrderCreated}
                placeholder="https://example.com/webhook/order-created"
              />
            </div>

            <div class="form-group">
              <label for="webhookOrderUpdated">Order Updated Webhook URL</label>
              <input
                id="webhookOrderUpdated"
                name="webhookOrderUpdated"
                type="url"
                value={apiSettings.webhookOrderUpdated}
                placeholder="https://example.com/webhook/order-updated"
              />
            </div>

            <div class="form-group">
              <label for="webhookProductUpdated">Product Updated Webhook URL</label>
              <input
                id="webhookProductUpdated"
                name="webhookProductUpdated"
                type="url"
                value={apiSettings.webhookProductUpdated}
                placeholder="https://example.com/webhook/product-updated"
              />
            </div>
          </div>

          <div class="form-section">
            <h3>Rate Limiting</h3>

            <div class="form-row">
              <div class="form-group">
                <label for="rateLimit">Request Limit</label>
                <input
                  id="rateLimit"
                  name="rateLimit"
                  type="number"
                  min="1"
                  max="10000"
                  value={apiSettings.rateLimit}
                />
                <p class="help-text">Max requests per window</p>
              </div>

              <div class="form-group">
                <label for="rateLimitWindow">Window (seconds)</label>
                <input
                  id="rateLimitWindow"
                  name="rateLimitWindow"
                  type="number"
                  min="1"
                  max="3600"
                  value={apiSettings.rateLimitWindow}
                />
                <p class="help-text">Time window for rate limit</p>
              </div>
            </div>
          </div>

          <button type="submit" class="save-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    {/if}

    <!-- Email Settings -->
    {#if activeTab === 'email'}
      <div class="settings-card">
        <h2>Email Settings</h2>
        <form
          method="POST"
          action="?/updateEmail"
          use:enhance={() => {
            isSubmitting = true;
            return async ({ update }) => {
              await update();
              isSubmitting = false;
            };
          }}
        >
          <div class="form-group">
            <label for="provider">Email Provider</label>
            <select id="provider" name="provider" value={emailSettings.provider}>
              <option value="sendmail">Sendmail</option>
              <option value="smtp">SMTP</option>
            </select>
          </div>

          {#if emailSettings.provider === 'smtp'}
            <div class="form-group">
              <label for="smtpHost">SMTP Host</label>
              <input id="smtpHost" name="smtpHost" type="text" value={emailSettings.smtpHost} />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="smtpPort">SMTP Port</label>
                <input id="smtpPort" name="smtpPort" type="number" value={emailSettings.smtpPort} />
              </div>

              <div class="form-group">
                <ToggleSwitch
                  name="smtpSecure"
                  checked={emailSettings.smtpSecure}
                  label="Use SSL/TLS"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="smtpUsername">SMTP Username</label>
              <input
                id="smtpUsername"
                name="smtpUsername"
                type="text"
                value={emailSettings.smtpUsername}
              />
            </div>

            <div class="form-group">
              <label for="smtpPassword">SMTP Password</label>
              <input
                id="smtpPassword"
                name="smtpPassword"
                type="password"
                value={emailSettings.smtpPassword}
                autocomplete="off"
              />
            </div>
          {/if}

          <div class="form-group">
            <label for="fromName">From Name</label>
            <input id="fromName" name="fromName" type="text" value={emailSettings.fromName} />
          </div>

          <div class="form-group">
            <label for="fromAddress">From Email Address</label>
            <input
              id="fromAddress"
              name="fromAddress"
              type="email"
              value={emailSettings.fromAddress}
            />
          </div>

          <div class="form-section">
            <h3>Email Notifications</h3>

            <div class="form-group">
              <ToggleSwitch
                name="newOrderEnabled"
                checked={emailSettings.newOrderEnabled}
                label="New Order Notifications"
              />
            </div>

            <div class="form-group">
              <ToggleSwitch
                name="orderStatusEnabled"
                checked={emailSettings.orderStatusEnabled}
                label="Order Status Change Notifications"
              />
            </div>

            <div class="form-group">
              <ToggleSwitch
                name="customerWelcomeEnabled"
                checked={emailSettings.customerWelcomeEnabled}
                label="Customer Welcome Emails"
              />
            </div>
          </div>

          <button type="submit" class="save-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    {/if}
  </div>
</div>

<style>
  .settings-page {
    max-width: 1400px;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  h1 {
    color: var(--color-text-primary);
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    transition: color var(--transition-normal);
  }

  .page-header p {
    color: var(--color-text-secondary);
    margin: 0;
    transition: color var(--transition-normal);
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    border-bottom: 2px solid var(--color-border-secondary);
    overflow-x: auto;
  }

  .tab {
    padding: 0.875rem 1.5rem;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    color: var(--color-text-secondary);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-normal);
    white-space: nowrap;
    margin-bottom: -2px;
  }

  .tab:hover {
    color: var(--color-text-primary);
    background: var(--color-bg-secondary);
  }

  .tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
  }

  .settings-card {
    background: var(--color-bg-primary);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px var(--color-shadow-light);
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  h2 {
    color: var(--color-text-primary);
    font-size: 1.25rem;
    margin: 0 0 1.5rem 0;
    transition: color var(--transition-normal);
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    color: var(--color-text-primary);
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    transition: color var(--transition-normal);
  }

  input[type='text'],
  input[type='email'],
  input[type='tel'],
  input[type='number'],
  input[type='password'],
  textarea,
  select {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--color-border-secondary);
    border-radius: 6px;
    font-size: 1rem;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-family: inherit;
    transition:
      border-color var(--transition-normal),
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }

  input:focus,
  textarea:focus,
  select:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-border-secondary);
  }

  .form-section h3 {
    color: var(--color-text-primary);
    font-size: 1.1rem;
    margin: 0 0 1rem 0;
  }

  .help-text {
    font-size: 0.875rem;
    color: var(--color-text-tertiary);
    margin: 0.25rem 0 0 0;
  }

  .save-btn {
    width: 100%;
    padding: 0.875rem;
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 1rem;
    cursor: pointer;
    transition:
      background-color var(--transition-normal),
      transform var(--transition-normal);
  }

  .save-btn:hover:not(:disabled) {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
  }

  .save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .info-message {
    padding: 1rem;
    background: var(--color-bg-tertiary);
    border-radius: 8px;
    color: var(--color-text-secondary);
    margin-bottom: 1rem;
    transition:
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  .info-message a {
    color: var(--color-primary);
    text-decoration: underline;
    transition: color var(--transition-normal);
  }

  .quick-nav {
    display: flex;
    gap: 1rem;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    transition:
      background-color var(--transition-normal),
      transform var(--transition-normal);
  }

  .nav-btn:hover {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 1.5rem;
    }

    .settings-grid {
      grid-template-columns: 1fr;
    }

    .tabs {
      overflow-x: auto;
    }
  }
</style>
