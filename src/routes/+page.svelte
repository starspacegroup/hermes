<script lang="ts">
  // This will be expanded with product data in future steps
  const message = 'Welcome to Hermes - Your eCommerce Platform';
</script>

<svelte:head>
  <title>Hermes - Home</title>
  <meta name="description" content="Hermes eCommerce Platform" />
</svelte:head>

<section class="hero">
  <h2>{message}</h2>
  <p>Building the future of online commerce.</p>
</section>

<style>
  .hero {
    text-align: center;
    padding: 3rem 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  h2 {
    color: #2563eb;
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  p {
    color: #666;
    font-size: 1.1rem;
  }
</style>