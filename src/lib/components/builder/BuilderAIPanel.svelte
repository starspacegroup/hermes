<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X, Send, Sparkles } from 'lucide-svelte';
  import type { PageWidget } from '$lib/types/pages';

  export let widgets: PageWidget[];
  export let title: string;
  export let slug: string;

  const dispatch = createEventDispatcher();

  let message = '';
  let messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    suggestedChanges?: any;
  }> = [];
  let isLoading = false;

  async function sendMessage() {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    message = '';
    messages = [...messages, { role: 'user', content: userMessage }];
    isLoading = true;

    try {
      const response = await fetch('/api/ai-chat/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: {
            title,
            slug,
            widgets,
            widgetCount: widgets.length
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = (await response.json()) as {
        response: string;
        suggestedChanges?: any;
      };
      messages = [...messages, { role: 'assistant', content: data.response }];

      // If AI suggests changes, show apply button
      if (data.suggestedChanges) {
        // Store suggested changes for apply button
        messages[messages.length - 1].suggestedChanges = data.suggestedChanges;
      }
    } catch (error) {
      console.error('AI error:', error);
      messages = [
        ...messages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }
      ];
    } finally {
      isLoading = false;
    }
  }

  function applyChanges(changes: any) {
    dispatch('applyChanges', changes);
  }
</script>

<aside class="builder-ai-panel">
  <div class="panel-header">
    <div class="header-title">
      <Sparkles size={18} />
      <h3>AI Assistant</h3>
    </div>
    <button class="btn-close" on:click={() => dispatch('close')} aria-label="Close AI panel">
      <X size={18} />
    </button>
  </div>

  <div class="messages-container">
    {#if messages.length === 0}
      <div class="welcome-message">
        <Sparkles size={48} />
        <h4>AI Builder Assistant</h4>
        <p>
          Ask me to help you build your page! I can:
          <br />• Add or modify components
          <br />• Suggest layouts
          <br />• Generate content
          <br />• Optimize for mobile
        </p>
      </div>
    {:else}
      {#each messages as msg}
        <div class="message {msg.role}">
          <div class="message-content">{msg.content}</div>
          {#if msg.suggestedChanges}
            <button class="btn-apply" on:click={() => applyChanges(msg.suggestedChanges)}>
              Apply Changes
            </button>
          {/if}
        </div>
      {/each}
    {/if}

    {#if isLoading}
      <div class="message assistant loading">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    {/if}
  </div>

  <div class="input-container">
    <input
      type="text"
      bind:value={message}
      on:keydown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      }}
      placeholder="Ask AI to help build your page..."
      disabled={isLoading}
      class="message-input"
    />
    <button class="btn-send" on:click={sendMessage} disabled={isLoading || !message.trim()}>
      <Send size={18} />
    </button>
  </div>
</aside>

<style>
  .builder-ai-panel {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 400px;
    background: var(--color-bg-primary);
    border-left: 1px solid var(--color-border-secondary);
    display: flex;
    flex-direction: column;
    z-index: 20;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border-secondary);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .header-title h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .btn-close {
    padding: 0.25rem;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .btn-close:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .welcome-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
    color: var(--color-text-secondary);
  }

  .welcome-message h4 {
    margin: 1rem 0 0.5rem 0;
    color: var(--color-text-primary);
  }

  .welcome-message p {
    margin: 0;
    line-height: 1.6;
  }

  .message {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    max-width: 85%;
  }

  .message.user {
    align-self: flex-end;
    background: var(--color-primary);
    color: white;
    margin-left: auto;
  }

  .message.assistant {
    align-self: flex-start;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-secondary);
  }

  .message-content {
    font-size: 0.875rem;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  .btn-apply {
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-success);
    border: none;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .btn-apply:hover {
    opacity: 0.9;
  }

  .typing-indicator {
    display: flex;
    gap: 0.25rem;
  }

  .typing-indicator span {
    width: 8px;
    height: 8px;
    background: var(--color-text-secondary);
    border-radius: 50%;
    animation: typing 1.4s infinite;
  }

  .typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes typing {
    0%,
    60%,
    100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-10px);
    }
  }

  .input-container {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid var(--color-border-secondary);
    background: var(--color-bg-primary);
  }

  .message-input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 8px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: 0.875rem;
  }

  .message-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .btn-send {
    padding: 0.75rem;
    background: var(--color-primary);
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .btn-send:hover:not(:disabled) {
    opacity: 0.9;
  }

  .btn-send:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .builder-ai-panel {
      width: 100%;
    }
  }
</style>
