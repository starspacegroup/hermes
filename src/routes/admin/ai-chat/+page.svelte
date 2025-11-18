<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { PageData } from './$types';
  import type { AIChatMessage } from '$lib/types/ai-chat';

  export let data: PageData;

  let messages: AIChatMessage[] = [];
  let inputText = '';
  let isStreaming = false;
  let sessionId: string | null = null;
  let messagesContainer: HTMLDivElement;
  let fileInput: HTMLInputElement;
  let selectedFiles: File[] = [];

  // Auto-scroll to bottom when new messages arrive
  $: if (messages.length > 0) {
    tick().then(() => {
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    });
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      selectedFiles = [...selectedFiles, ...Array.from(target.files)];
      target.value = '';
    }
  }

  function removeFile(index: number) {
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
  }

  function handlePaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          selectedFiles = [...selectedFiles, file];
        }
      }
    }
  }

  async function sendMessage() {
    if ((!inputText.trim() && selectedFiles.length === 0) || isStreaming) return;

    const messageText = inputText.trim();
    inputText = '';

    // Convert files to base64 for attachments
    const attachments: AIChatMessage['attachments'] = [];
    for (const file of selectedFiles) {
      const base64 = await fileToBase64(file);
      attachments.push({
        id: crypto.randomUUID(),
        type: file.type.startsWith('video/') ? 'video' : 'image',
        url: base64,
        filename: file.name,
        mimeType: file.type,
        size: file.size
      });
    }

    // Add user message to UI
    const userMessage: AIChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
      attachments
    };
    messages = [...messages, userMessage];
    selectedFiles = [];

    // Stream AI response
    isStreaming = true;
    const assistantMessage: AIChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };
    messages = [...messages, assistantMessage];

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          message: messageText,
          attachments
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                assistantMessage.content = `Error: ${data.error}`;
                messages = [...messages];
                break;
              }

              if (data.sessionId) {
                sessionId = data.sessionId;
              }

              if (!data.done) {
                assistantMessage.content += data.content;
                messages = [...messages];
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      assistantMessage.content = 'Sorry, something went wrong. Please try again.';
      messages = [...messages];
    } finally {
      isStreaming = false;
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  onMount(() => {
    // Focus input on mount
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.focus();
    }
  });
</script>

<svelte:head>
  <title>AI Chat - Hermes Admin</title>
</svelte:head>

<div class="chat-container">
  {#if !data.hasApiKeys}
    <div class="no-keys-banner">
      <div class="banner-content">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></path>
        </svg>
        <h2>AI Chat Not Configured</h2>
        <p>To use the AI chat assistant, you need to configure at least one AI provider API key.</p>
        <a href="/admin/settings/ai" class="btn btn-primary"> Configure AI Settings </a>
      </div>
    </div>
  {:else}
    <!-- Chat Header -->
    <header class="chat-header">
      <div class="header-content">
        <div class="header-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
        </div>
        <div class="header-text">
          <h1>Hermes AI</h1>
          <p>Product Creation Assistant</p>
        </div>
      </div>
    </header>

    <!-- Messages Area -->
    <div class="messages-container" bind:this={messagesContainer}>
      {#if messages.length === 0}
        <div class="welcome-screen">
          <div class="welcome-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
          </div>
          <h2>Welcome to Hermes AI</h2>
          <p>I'm here to help you create amazing product listings effortlessly.</p>
          <div class="suggestions">
            <button
              class="suggestion-chip"
              on:click={() => {
                inputText = 'I want to add a new product';
                sendMessage();
              }}
            >
              Add a new product
            </button>
            <button
              class="suggestion-chip"
              on:click={() => {
                inputText = 'Help me create a product listing';
                sendMessage();
              }}
            >
              Get help with product listing
            </button>
          </div>
        </div>
      {/if}

      {#each messages as message, i (i)}
        <div class="message {message.role}">
          <div class="message-avatar">
            {#if message.role === 'user'}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
                <circle
                  cx="12"
                  cy="7"
                  r="4"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></circle>
              </svg>
            {:else}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
              </svg>
            {/if}
          </div>
          <div class="message-content">
            {#if message.attachments && message.attachments.length > 0}
              <div class="attachments-grid">
                {#each message.attachments as attachment}
                  {#if attachment.type === 'image'}
                    <img src={attachment.url} alt={attachment.filename} class="attachment-image" />
                  {/if}
                {/each}
              </div>
            {/if}
            {#if message.content}
              <div class="message-text">{message.content}</div>
            {/if}
          </div>
        </div>
      {/each}

      {#if isStreaming}
        <div class="streaming-indicator">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      {/if}
    </div>

    <!-- Input Area -->
    <div class="input-container">
      {#if selectedFiles.length > 0}
        <div class="selected-files">
          {#each selectedFiles as file, i}
            <div class="file-chip">
              {#if file.type.startsWith('image/')}
                <img src={URL.createObjectURL(file)} alt={file.name} class="file-preview" />
              {:else}
                <div class="file-icon">📄</div>
              {/if}
              <span class="file-name">{file.name}</span>
              <button
                type="button"
                class="remove-file"
                on:click={() => removeFile(i)}
                aria-label="Remove file"
              >
                ✕
              </button>
            </div>
          {/each}
        </div>
      {/if}

      <div class="input-bar">
        <input
          type="file"
          bind:this={fileInput}
          on:change={handleFileSelect}
          accept="image/*,video/*"
          multiple
          style="display: none;"
        />

        <button
          type="button"
          class="attach-btn"
          on:click={() => fileInput.click()}
          disabled={isStreaming}
          aria-label="Attach files"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
        </button>

        <textarea
          bind:value={inputText}
          on:keydown={handleKeyDown}
          on:paste={handlePaste}
          placeholder="Describe your product or ask for help..."
          rows="1"
          disabled={isStreaming}
        ></textarea>

        <button
          type="button"
          class="send-btn"
          on:click={sendMessage}
          disabled={(!inputText.trim() && selectedFiles.length === 0) || isStreaming}
          aria-label="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh; /* Dynamic viewport height for mobile */
    background: var(--color-bg-primary);
    overflow: hidden;
    position: relative;
  }

  /* No Keys Banner */
  .no-keys-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
  }

  .banner-content {
    text-align: center;
    max-width: 500px;
  }

  .banner-content svg {
    color: var(--color-primary);
    margin-bottom: 1.5rem;
  }

  .banner-content h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 1rem 0;
  }

  .banner-content p {
    color: var(--color-text-secondary);
    margin: 0 0 2rem 0;
  }

  /* Chat Header */
  .chat-header {
    flex-shrink: 0;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border-secondary);
    background: var(--color-bg-primary);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--color-primary);
    color: white;
  }

  .header-text h1 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  .header-text p {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin: 0;
  }

  /* Messages Container */
  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  /* Welcome Screen */
  .welcome-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    padding: 2rem;
  }

  .welcome-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    color: var(--color-primary);
    margin-bottom: 1.5rem;
  }

  .welcome-screen h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 0.5rem 0;
  }

  .welcome-screen p {
    color: var(--color-text-secondary);
    margin: 0 0 2rem 0;
    max-width: 400px;
  }

  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
  }

  .suggestion-chip {
    padding: 0.75rem 1.25rem;
    border-radius: 24px;
    border: 1px solid var(--color-border-secondary);
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all var(--transition-normal);
  }

  .suggestion-chip:hover {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 10%, var(--color-bg-secondary));
  }

  /* Messages */
  .message {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    animation: fadeIn 0.3s ease-in;
  }

  .message.assistant {
    flex-direction: row;
  }

  .message.user {
    flex-direction: row-reverse;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message-avatar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
  }

  .message.assistant .message-avatar {
    background: var(--color-primary);
    color: white;
  }

  .message.user .message-avatar {
    background: var(--color-text-secondary);
    color: white;
  }

  .message-content {
    flex: 1;
    max-width: calc(100% - 50px);
  }

  .message-text {
    padding: 0.875rem 1.125rem;
    border-radius: 12px;
    word-wrap: break-word;
    white-space: pre-wrap;
  }

  .message.assistant .message-text {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border-bottom-left-radius: 4px;
  }

  .message.user .message-text {
    background: var(--color-primary);
    color: white;
    border-bottom-right-radius: 4px;
  }

  /* Attachments */
  .attachments-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .attachment-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 8px;
  }

  /* Streaming Indicator */
  .streaming-indicator {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
  }

  .streaming-indicator .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-text-tertiary);
    animation: pulse 1.4s infinite;
  }

  .streaming-indicator .dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .streaming-indicator .dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes pulse {
    0%,
    80%,
    100% {
      opacity: 0.3;
    }
    40% {
      opacity: 1;
    }
  }

  /* Input Area */
  .input-container {
    flex-shrink: 0;
    border-top: 1px solid var(--color-border-secondary);
    background: var(--color-bg-primary);
    padding: 1rem;
    padding-bottom: env(safe-area-inset-bottom, 1rem);
  }

  .selected-files {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .file-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 8px;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-secondary);
  }

  .file-preview {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 4px;
  }

  .file-icon {
    font-size: 1.5rem;
  }

  .file-name {
    font-size: 0.875rem;
    color: var(--color-text-primary);
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .remove-file {
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    color: var(--color-text-secondary);
    font-size: 1.125rem;
  }

  .remove-file:hover {
    color: var(--color-danger);
  }

  .input-bar {
    display: flex;
    gap: 0.75rem;
    align-items: flex-end;
    padding: 0.75rem;
    border-radius: 12px;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-secondary);
  }

  .input-bar:focus-within {
    border-color: var(--color-primary);
  }

  .attach-btn,
  .send-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-normal);
  }

  .attach-btn:hover:not(:disabled),
  .send-btn:hover:not(:disabled) {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .send-btn:not(:disabled) {
    background: var(--color-primary);
    color: white;
  }

  .send-btn:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  .attach-btn:disabled,
  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  textarea {
    flex: 1;
    resize: none;
    border: none;
    background: transparent;
    color: var(--color-text-primary);
    font-size: 1rem;
    font-family: inherit;
    line-height: 1.5;
    outline: none;
    max-height: 150px;
    overflow-y: auto;
  }

  textarea::placeholder {
    color: var(--color-text-tertiary);
  }

  textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-normal);
    border: none;
    font-size: 1rem;
    text-decoration: none;
    display: inline-block;
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
  }

  .btn-primary:hover {
    background: var(--color-primary-hover);
  }

  /* Mobile Optimizations */
  @media (max-width: 768px) {
    .chat-header {
      padding: 0.75rem;
    }

    .messages-container {
      padding: 0.75rem;
    }

    .input-container {
      padding: 0.75rem;
      padding-bottom: calc(env(safe-area-inset-bottom, 0rem) + 0.75rem);
    }

    .attachments-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
