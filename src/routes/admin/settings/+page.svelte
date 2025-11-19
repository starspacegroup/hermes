<script lang="ts">
  import { enhance } from '$app/forms';
  import { toastStore } from '$lib/stores/toast';
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
  $: emailSettings = data.settings.email;

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
    <button class="tab" class:active={activeTab === 'general'} on:click={() => (activeTab = 'general')}>
      General
    </button>
    <button class="tab" class:active={activeTab === 'address'} on:click={() => (activeTab = 'address')}>
      Address & Location
    </button>
    <button class="tab" class:active={activeTab === 'tax'} on:click={() => (activeTab = 'tax')}>
      Tax Settings
    </button>
    <button class="tab" class:active={activeTab === 'email'} on:click={() => (activeTab = 'email')}>
      Email Settings
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
              <select
                id="dimensionUnit"
                name="dimensionUnit"
                value={generalSettings.dimensionUnit}
              >
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
            <label>
              <input
                type="checkbox"
                name="geolocationEnabled"
                value="true"
                checked={addressSettings.geolocationEnabled}
              />
              <span>Enable Geolocation</span>
            </label>
            <p class="help-text">Allow customers to use their location for shipping estimates</p>
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
            <label>
              <input
                type="checkbox"
                name="calculationsEnabled"
                value="true"
                checked={taxSettings.calculationsEnabled}
              />
              <span>Enable Tax Calculations</span>
            </label>
            <p class="help-text">Automatically calculate taxes at checkout</p>
          </div>

          <div class="form-group">
            <label>
              <input
                type="checkbox"
                name="pricesIncludeTax"
                value="true"
                checked={taxSettings.pricesIncludeTax}
              />
              <span>Prices Include Tax</span>
            </label>
            <p class="help-text">Product prices already include tax</p>
          </div>

          <div class="form-group">
            <label>
              <input
                type="checkbox"
                name="displayPricesWithTax"
                value="true"
                checked={taxSettings.displayPricesWithTax}
              />
              <span>Display Prices With Tax</span>
            </label>
            <p class="help-text">Show tax-inclusive prices to customers</p>
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
                <input
                  id="smtpPort"
                  name="smtpPort"
                  type="number"
                  value={emailSettings.smtpPort}
                />
              </div>

              <div class="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="smtpSecure"
                    value="true"
                    checked={emailSettings.smtpSecure}
                  />
                  <span>Use SSL/TLS</span>
                </label>
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
              <label>
                <input
                  type="checkbox"
                  name="newOrderEnabled"
                  value="true"
                  checked={emailSettings.newOrderEnabled}
                />
                <span>New Order Notifications</span>
              </label>
            </div>

            <div class="form-group">
              <label>
                <input
                  type="checkbox"
                  name="orderStatusEnabled"
                  value="true"
                  checked={emailSettings.orderStatusEnabled}
                />
                <span>Order Status Change Notifications</span>
              </label>
            </div>

            <div class="form-group">
              <label>
                <input
                  type="checkbox"
                  name="customerWelcomeEnabled"
                  value="true"
                  checked={emailSettings.customerWelcomeEnabled}
                />
                <span>Customer Welcome Emails</span>
              </label>
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

  input[type='checkbox'] {
    width: auto;
    margin-right: 0.5rem;
  }

  label:has(input[type='checkbox']) {
    display: flex;
    align-items: center;
    font-weight: 500;
    cursor: pointer;
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

  @media (max-width: 768px) {
    h1 {
      font-size: 1.5rem;
    }

    .settings-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
