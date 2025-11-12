import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST, PUT, DELETE } from './+server';

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('Providers API Endpoints', () => {
  let mockDB: any;
  let mockPlatform: any;
  let mockLocals: any;
  let mockRequest: any;

  beforeEach(() => {
    mockDB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({
            results: [
              {
                id: 'provider-1',
                site_id: 'default-site',
                name: 'Provider 1',
                description: 'Test provider',
                is_default: 0,
                is_active: 1,
                created_at: Date.now(),
                updated_at: Date.now()
              }
            ]
          }),
          first: vi.fn().mockResolvedValue({
            id: 'provider-1',
            site_id: 'default-site',
            name: 'Provider 1',
            description: 'Test provider',
            is_default: 0,
            is_active: 1,
            created_at: Date.now(),
            updated_at: Date.now()
          }),
          run: vi.fn().mockResolvedValue({ meta: { changes: 1 } })
        })
      })
    };

    mockPlatform = {
      env: {
        DB: mockDB
      }
    };

    mockLocals = {
      siteId: 'default-site'
    };

    mockRequest = {
      json: vi.fn()
    };
  });

  describe('GET', () => {
    it('fetches all providers for a site', async () => {
      const event = {
        platform: mockPlatform,
        locals: mockLocals
      } as any;

      const response = await GET(event);
      const data = (await response.json()) as any[];

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].id).toBe('provider-1');
      expect(data[0].isActive).toBe(true);
    });

    it('throws error when database is not available', async () => {
      const event = {
        platform: { env: {} },
        locals: mockLocals
      } as any;

      await expect(GET(event)).rejects.toThrow();
    });
  });

  describe('POST', () => {
    it('creates a new provider', async () => {
      mockRequest.json.mockResolvedValue({
        name: 'New Provider',
        description: 'Test description',
        isActive: true
      });

      const event = {
        request: mockRequest,
        platform: mockPlatform,
        locals: mockLocals
      } as any;

      const response = await POST(event);
      const data = (await response.json()) as any;

      expect(response.status).toBe(201);
      expect(data.name).toBe('Provider 1');
    });

    it('validates required name field', async () => {
      mockRequest.json.mockResolvedValue({
        name: '',
        description: 'Test'
      });

      const event = {
        request: mockRequest,
        platform: mockPlatform,
        locals: mockLocals
      } as any;

      await expect(POST(event)).rejects.toThrow();
    });

    it('throws error when database is not available', async () => {
      mockRequest.json.mockResolvedValue({
        name: 'Provider'
      });

      const event = {
        request: mockRequest,
        platform: { env: {} },
        locals: mockLocals
      } as any;

      await expect(POST(event)).rejects.toThrow();
    });
  });

  describe('PUT', () => {
    it('updates an existing provider', async () => {
      mockRequest.json.mockResolvedValue({
        id: 'provider-1',
        name: 'Updated Provider',
        isActive: false
      });

      const event = {
        request: mockRequest,
        platform: mockPlatform,
        locals: mockLocals
      } as any;

      const response = await PUT(event);
      const data = (await response.json()) as any;

      expect(response.status).toBe(200);
      expect(data.id).toBe('provider-1');
    });

    it('validates provider ID is provided', async () => {
      mockRequest.json.mockResolvedValue({
        name: 'Updated Provider'
      });

      const event = {
        request: mockRequest,
        platform: mockPlatform,
        locals: mockLocals
      } as any;

      await expect(PUT(event)).rejects.toThrow();
    });

    it('validates name is not empty', async () => {
      mockRequest.json.mockResolvedValue({
        id: 'provider-1',
        name: ''
      });

      const event = {
        request: mockRequest,
        platform: mockPlatform,
        locals: mockLocals
      } as any;

      await expect(PUT(event)).rejects.toThrow();
    });
  });

  describe('DELETE', () => {
    it('deletes a provider', async () => {
      mockRequest.json.mockResolvedValue({
        id: 'provider-1'
      });

      const event = {
        request: mockRequest,
        platform: mockPlatform,
        locals: mockLocals
      } as any;

      const response = await DELETE(event);
      const data = (await response.json()) as any;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('validates provider ID is provided', async () => {
      mockRequest.json.mockResolvedValue({});

      const event = {
        request: mockRequest,
        platform: mockPlatform,
        locals: mockLocals
      } as any;

      await expect(DELETE(event)).rejects.toThrow();
    });

    it('returns 404 when provider not found', async () => {
      mockDB
        .prepare()
        .bind()
        .run.mockResolvedValue({ meta: { changes: 0 } });

      mockRequest.json.mockResolvedValue({
        id: 'nonexistent'
      });

      const event = {
        request: mockRequest,
        platform: mockPlatform,
        locals: mockLocals
      } as any;

      await expect(DELETE(event)).rejects.toThrow();
    });
  });
});
