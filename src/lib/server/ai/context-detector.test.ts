import { describe, it, expect } from 'vitest';
import {
  detectContextFromUrl,
  extractEntityIdFromUrl,
  analyzeConversation,
  detectAIContext
} from '$lib/server/ai/context-detector';

describe('context-detector', () => {
  describe('detectContextFromUrl', () => {
    it('detects product creation context', () => {
      const result = detectContextFromUrl('/admin/products/new');
      expect(result).toBe('product_creation');
    });

    it('detects product editing context', () => {
      const result = detectContextFromUrl('/admin/products/123/edit');
      expect(result).toBe('product_editing');
    });

    it('detects page building context', () => {
      const result = detectContextFromUrl('/admin/pages/new');
      expect(result).toBe('page_building');
    });

    it('detects page editing context', () => {
      const result = detectContextFromUrl('/admin/pages/456/edit');
      expect(result).toBe('page_editing');
    });

    it('detects dashboard context', () => {
      expect(detectContextFromUrl('/admin/dashboard')).toBe('dashboard_insights');
      expect(detectContextFromUrl('/admin')).toBe('dashboard_insights');
    });

    it('detects AI chat standalone as product creation', () => {
      const result = detectContextFromUrl('/admin/ai-chat');
      expect(result).toBe('product_creation');
    });

    it('defaults to general help for unknown paths', () => {
      const result = detectContextFromUrl('/admin/unknown');
      expect(result).toBe('general_help');
    });
  });

  describe('extractEntityIdFromUrl', () => {
    it('extracts product ID from edit URL', () => {
      const result = extractEntityIdFromUrl('/admin/products/123/edit');
      expect(result).toBe('123');
    });

    it('extracts page ID from edit URL', () => {
      const result = extractEntityIdFromUrl('/admin/pages/abc-def/edit');
      expect(result).toBe('abc-def');
    });

    it('returns undefined for URLs without entity ID', () => {
      expect(extractEntityIdFromUrl('/admin/products/new')).toBeUndefined();
      expect(extractEntityIdFromUrl('/admin/dashboard')).toBeUndefined();
    });
  });

  describe('analyzeConversation', () => {
    it('switches to product creation when product keywords detected', () => {
      const messages = [
        { role: 'user' as const, content: 'I want to add a new product' },
        { role: 'assistant' as const, content: 'Great! What are you selling?' }
      ];

      const result = analyzeConversation(messages, 'general_help');
      expect(result).toBe('product_creation');
    });

    it('switches to page building when page keywords detected', () => {
      const messages = [
        { role: 'user' as const, content: 'Help me create a new page with widgets' },
        { role: 'assistant' as const, content: 'I can help with that!' }
      ];

      const result = analyzeConversation(messages, 'general_help');
      expect(result).toBe('page_building');
    });

    it('keeps current context if no clear intent', () => {
      const messages = [{ role: 'user' as const, content: 'Hello' }];

      const result = analyzeConversation(messages, 'product_editing');
      expect(result).toBe('product_editing');
    });

    it('returns current context for empty conversation', () => {
      const result = analyzeConversation([], 'dashboard_insights');
      expect(result).toBe('dashboard_insights');
    });
  });

  describe('detectAIContext', () => {
    it('provides complete context detection result', () => {
      const result = detectAIContext('/admin/products/new');

      expect(result.context.type).toBe('product_creation');
      expect(result.systemPrompt).toContain('Hermes AI');
      expect(result.capabilities).toBeInstanceOf(Array);
      expect(result.capabilities.length).toBeGreaterThan(0);
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('includes entity ID when present', () => {
      const result = detectAIContext('/admin/products/123/edit');

      expect(result.context.entityId).toBe('123');
      expect(result.context.type).toBe('product_editing');
    });

    it('refines context based on conversation', () => {
      const messages = [
        { role: 'user' as const, content: 'I need help building a page' },
        { role: 'assistant' as const, content: 'I can help with that!' }
      ];

      const result = detectAIContext('/admin/ai-chat', undefined, messages);

      expect(result.context.type).toBe('page_building');
    });

    it('includes entity data in context', () => {
      const entityData = {
        product: {
          id: '123',
          name: 'Test Product',
          description: 'Test product description',
          price: 29.99,
          category: 'Test Category',
          type: 'physical',
          stock: 10,
          tags: ['test']
        }
      };

      const result = detectAIContext('/admin/products/123/edit', entityData);

      expect(result.context.entityData).toEqual(entityData);
    });
  });
});
