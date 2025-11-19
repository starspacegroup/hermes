import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db/connection';
import { getAISettings } from '$lib/server/db/ai-settings';
import { getAISession, createAISession, addMessageToSession } from '$lib/server/db/ai-sessions';
import { createAIProvider } from '$lib/server/ai/providers';
import { PRODUCT_CREATION_SYSTEM_PROMPT } from '$lib/server/ai/prompts';
import { parseProductCommand } from '$lib/server/ai/product-parser';
import type { AIChatMessage } from '$lib/types/ai-chat';

/**
 * POST /api/ai-chat
 * Send a message to the AI assistant and get a streaming response
 */
export const POST: RequestHandler = async ({ request, platform, locals }) => {
  // Check authentication
  if (!locals.currentUser) {
    throw error(401, 'Unauthorized');
  }

  // Only admins can use AI chat
  if (locals.currentUser.role !== 'admin' && locals.currentUser.role !== 'platform_engineer') {
    throw error(403, 'Access denied. Admin role required.');
  }

  const db = getDB(platform);
  const siteId = locals.siteId;
  const userId = locals.currentUser.id;
  const encryptionKey = platform?.env?.ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw error(500, 'Encryption key not configured');
  }

  try {
    const body = await request.json();
    const { sessionId, message, attachments } = body as {
      sessionId?: string;
      message: string;
      attachments?: Array<{
        id: string;
        type: 'image' | 'video';
        url: string;
        filename: string;
        mimeType: string;
        size: number;
      }>;
    };

    // Validate message
    if (!message || message.trim() === '') {
      throw error(400, 'Message is required');
    }

    // Get or create session
    let session;
    if (sessionId) {
      session = await getAISession(db, siteId, sessionId);
      if (!session) {
        throw error(404, 'Session not found');
      }
      // Verify session belongs to user
      if (session.user_id !== userId) {
        throw error(403, 'Access denied to this session');
      }
    } else {
      session = await createAISession(db, siteId, userId, 'New Product Chat');
    }

    // Add user message to session
    const userMessage: AIChatMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now(),
      attachments: attachments || []
    };

    await addMessageToSession(db, siteId, session.id, userMessage);

    // Get AI settings
    const settings = await getAISettings(db, siteId, encryptionKey);
    const preferredModel = settings.preferred_model || 'gpt-4o';
    const temperature = settings.temperature ?? 0.7;
    const maxTokens = settings.max_tokens ?? 4096;

    // Determine provider from model
    let providerName: 'openai' | 'anthropic' | 'grok';
    if (preferredModel.startsWith('gpt-')) {
      providerName = 'openai';
    } else if (preferredModel.startsWith('claude-')) {
      providerName = 'anthropic';
    } else if (preferredModel.startsWith('grok-')) {
      providerName = 'grok';
    } else {
      throw error(500, 'Unknown model type');
    }

    // Get API key for provider
    const apiKeyField = `${providerName}_api_key` as keyof typeof settings;
    const apiKey = settings[apiKeyField];
    if (!apiKey) {
      throw error(400, `${providerName} API key not configured. Please add it in settings.`);
    }

    // Create provider instance
    const provider = createAIProvider(providerName, apiKey as string);

    // Get all messages for context
    const allMessages = [...session.messages, userMessage];

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let accumulatedResponse = '';

        try {
          // Stream the AI response
          for await (const chunk of provider.streamCompletion({
            messages: allMessages,
            model: preferredModel,
            temperature,
            maxTokens,
            systemPrompt: PRODUCT_CREATION_SYSTEM_PROMPT
          })) {
            if (chunk.done) {
              // Save assistant message to session
              const assistantMessage: AIChatMessage = {
                role: 'assistant',
                content: accumulatedResponse,
                timestamp: Date.now()
              };
              await addMessageToSession(db, siteId, session.id, assistantMessage);

              // Check if response contains a product command
              const productCommand = parseProductCommand(accumulatedResponse);

              // Send final chunk with session ID and product command if present
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    content: '',
                    done: true,
                    sessionId: session.id,
                    productCommand: productCommand || undefined
                  })}\n\n`
                )
              );
            } else {
              const content = chunk.content || '';
              accumulatedResponse += content;
              // Send chunk to client
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content, done: false })}\n\n`)
              );
            }
          }

          controller.close();
        } catch (err) {
          console.error('AI streaming error:', err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'Failed to generate response', done: true })}\n\n`
            )
          );
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    });
  } catch (err) {
    console.error('AI chat error:', err);
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to process AI chat request');
  }
};

/**
 * GET /api/ai-chat
 * Get session information
 */
export const GET: RequestHandler = async ({ url, platform, locals }) => {
  // Check authentication
  if (!locals.currentUser) {
    throw error(401, 'Unauthorized');
  }

  if (locals.currentUser.role !== 'admin' && locals.currentUser.role !== 'platform_engineer') {
    throw error(403, 'Access denied. Admin role required.');
  }

  const db = getDB(platform);
  const siteId = locals.siteId;
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    throw error(400, 'Session ID required');
  }

  try {
    const session = await getAISession(db, siteId, sessionId);
    if (!session) {
      throw error(404, 'Session not found');
    }

    // Verify session belongs to user
    if (session.user_id !== locals.currentUser.id) {
      throw error(403, 'Access denied to this session');
    }

    return json(session);
  } catch (err) {
    console.error('Get session error:', err);
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to get session');
  }
};
