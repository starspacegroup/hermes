<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  // Get metrics from server (real data from database)
  const metrics = data.metrics;

  const recentOrders = [
    { id: 'ORD-001', customer: 'John Doe', amount: 299.99, status: 'completed' },
    { id: 'ORD-002', customer: 'Jane Smith', amount: 199.99, status: 'processing' },
    { id: 'ORD-003', customer: 'Bob Johnson', amount: 89.99, status: 'pending' }
  ];

  const siteStatus = {
    server: 'operational',
    database: 'operational',
    payment: 'operational'
  };

  function getStatusColor(status: string): string {
    switch (status) {
      case 'operational':
      case 'completed':
        return 'var(--color-success)';
      case 'processing':
        return 'var(--color-warning)';
      case 'pending':
        return 'var(--color-secondary)';
      default:
        return 'var(--color-danger)';
    }
  }
</script>

<svelte:head>
  <title>Dashboard - Hermes Admin</title>
</svelte:head>

<div class="dashboard">
  <div class="dashboard-header">
    <h1>Dashboard</h1>
    <p>Welcome to your admin dashboard</p>
  </div>

  <!-- Metrics Grid -->
  <div class="metrics-grid">
    <a href="/admin/products" class="metric-card metric-card-link">
      <div class="metric-icon" style="background: rgba(239, 68, 68, 0.1);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)">
          <path
            d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
            stroke-width="2"
          ></path>
        </svg>
      </div>
      <div class="metric-content">
        <div class="metric-value">{metrics.totalProducts}</div>
        <div class="metric-label">Total Products</div>
      </div>
    </a>

    <div class="metric-card">
      <div class="metric-icon" style="background: rgba(22, 163, 74, 0.1);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)">
          <path
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            stroke-width="2"
          ></path>
        </svg>
      </div>
      <div class="metric-content">
        <div class="metric-value">{metrics.totalOrders}</div>
        <div class="metric-label">Total Orders</div>
      </div>
    </div>

    <div class="metric-card">
      <div class="metric-icon" style="background: rgba(245, 158, 11, 0.1);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)">
          <path
            d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
            stroke-width="2"
            stroke-linecap="round"
          ></path>
        </svg>
      </div>
      <div class="metric-content">
        <div class="metric-value">${metrics.revenue.toLocaleString()}</div>
        <div class="metric-label">Total Revenue</div>
      </div>
    </div>

    <div class="metric-card">
      <div class="metric-icon" style="background: rgba(139, 92, 246, 0.1);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)">
          <path
            d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            stroke-width="2"
            stroke-linecap="round"
          ></path>
        </svg>
      </div>
      <div class="metric-content">
        <div class="metric-value">{metrics.activeUsers}</div>
        <div class="metric-label">Active Users</div>
      </div>
    </div>
  </div>

  <!-- Recent Orders & Site Status -->
  <div class="dashboard-grid">
    <!-- Recent Orders -->
    <div class="dashboard-card">
      <h2>Recent Orders</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {#each recentOrders as order}
              <tr>
                <td class="order-id">{order.id}</td>
                <td>{order.customer}</td>
                <td class="amount">${order.amount}</td>
                <td>
                  <span class="status-badge" style="color: {getStatusColor(order.status)}">
                    {order.status}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Site Status -->
    <div class="dashboard-card">
      <h2>Site Status</h2>
      <div class="status-list">
        <div class="status-item">
          <div class="status-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" stroke-width="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2" stroke-width="2"></rect>
              <path d="M6 6h.01M6 18h.01" stroke-width="2" stroke-linecap="round"></path>
            </svg>
            <span>Server Status</span>
          </div>
          <div class="status-indicator" style="background: {getStatusColor(siteStatus.server)}">
            {siteStatus.server}
          </div>
        </div>

        <div class="status-item">
          <div class="status-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M20 14.66V20a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h5.34M18 2h4v4M14 10l7.5-7.5"
                stroke-width="2"
                stroke-linecap="round"
              ></path>
            </svg>
            <span>Database Status</span>
          </div>
          <div class="status-indicator" style="background: {getStatusColor(siteStatus.database)}">
            {siteStatus.database}
          </div>
        </div>

        <div class="status-item">
          <div class="status-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke-width="2"></rect>
              <path d="M1 10h22" stroke-width="2"></path>
            </svg>
            <span>Payment Gateway</span>
          </div>
          <div class="status-indicator" style="background: {getStatusColor(siteStatus.payment)}">
            {siteStatus.payment}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="dashboard-card">
    <h2>Quick Actions</h2>
    <div class="quick-actions">
      <a href="/admin/products" class="action-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round"></path>
        </svg>
        Add Product
      </a>
      <a href="/admin/content" class="action-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
            stroke-width="2"
            stroke-linecap="round"
          ></path>
        </svg>
        Create Page
      </a>
      <a href="/admin/settings" class="action-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="3" stroke-width="2"></circle>
          <path d="M12 1v6m0 6v6" stroke-width="2" stroke-linecap="round"></path>
        </svg>
        Site Settings
      </a>
    </div>
  </div>
</div>

<style>
  .dashboard {
    max-width: 1400px;
  }

  .dashboard-header {
    margin-bottom: 2rem;
  }

  .dashboard-header h1 {
    color: var(--color-text-primary);
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    transition: color var(--transition-normal);
  }

  .dashboard-header p {
    color: var(--color-text-secondary);
    margin: 0;
    transition: color var(--transition-normal);
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .metric-card {
    background: var(--color-bg-primary);
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 2px 8px var(--color-shadow-light);
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal),
      transform var(--transition-normal);
  }

  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--color-shadow-medium);
  }

  .metric-card-link {
    text-decoration: none;
    cursor: pointer;
  }

  .metric-card-link:hover {
    background: var(--color-bg-secondary);
  }

  .metric-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .metric-content {
    flex: 1;
  }

  .metric-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-text-primary);
    transition: color var(--transition-normal);
  }

  .metric-label {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin-top: 0.25rem;
    transition: color var(--transition-normal);
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .dashboard-card {
    background: var(--color-bg-primary);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px var(--color-shadow-light);
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  .dashboard-card h2 {
    color: var(--color-text-primary);
    font-size: 1.25rem;
    margin: 0 0 1.5rem 0;
    transition: color var(--transition-normal);
  }

  .table-container {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead {
    border-bottom: 2px solid var(--color-border-secondary);
    transition: border-color var(--transition-normal);
  }

  th {
    text-align: left;
    padding: 0.75rem 0.5rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    transition: color var(--transition-normal);
  }

  td {
    padding: 0.875rem 0.5rem;
    color: var(--color-text-primary);
    border-bottom: 1px solid var(--color-border-secondary);
    transition:
      color var(--transition-normal),
      border-color var(--transition-normal);
  }

  .order-id {
    font-weight: 600;
    color: var(--color-primary);
    transition: color var(--transition-normal);
  }

  .amount {
    font-weight: 600;
  }

  .status-badge {
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .status-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--color-bg-tertiary);
    border-radius: 8px;
    transition: background-color var(--transition-normal);
  }

  .status-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--color-text-primary);
    transition: color var(--transition-normal);
  }

  .status-info span {
    font-weight: 500;
  }

  .status-indicator {
    padding: 0.375rem 0.875rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
    text-transform: capitalize;
  }

  .quick-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .action-btn {
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

  .action-btn:hover {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    .dashboard-header h1 {
      font-size: 1.5rem;
    }

    .metrics-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-grid {
      grid-template-columns: 1fr;
    }

    .quick-actions {
      flex-direction: column;
    }

    .action-btn {
      width: 100%;
      justify-content: center;
    }
  }
</style>
