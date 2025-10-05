<script lang="ts">
  import '../app.css';
</script>

<main>
  <header>
    <h1>Hermes eCommerce</h1>
  </header>
  
  <slot />
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background-color: #f5f5f5;
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  header {
    text-align: center;
    margin-bottom: 2rem;
  }

  h1 {
    color: #333;
    font-size: 2.5rem;
    margin: 0;
  }
</style>