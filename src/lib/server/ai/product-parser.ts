/**
 * Parse AI responses to extract product creation/update commands
 */

export interface ProductCreationData {
  action: 'create_product';
  product: {
    name: string;
    description: string;
    price: number;
    category: string;
    type: 'physical' | 'service' | 'digital';
    stock: number;
    tags: string[];
    image?: string;
    fulfillmentOptions?: Array<{
      providerId: string;
      providerName?: string;
      cost: number;
      stockQuantity: number;
      enabled: boolean;
      createProvider?: boolean;
      description?: string;
    }>;
    variants?: Array<{
      name: string;
      options: string[];
    }>;
    seo?: {
      title: string;
      description: string;
      keywords: string[];
    };
  };
}

export interface ProductUpdateData {
  action: 'update_product';
  productId: string;
  updates: {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    type?: 'physical' | 'service' | 'digital';
    stock?: number;
    tags?: string[];
    image?: string;
  };
}

export type ProductCommand = ProductCreationData | ProductUpdateData;

/**
 * Extract JSON from AI response that may contain conversational text
 * Looks for JSON blocks in code fences or standalone JSON objects
 */
export function extractJSON(text: string): string | null {
  // Try to find JSON in code fences first
  const codeFenceMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (codeFenceMatch) {
    return codeFenceMatch[1].trim();
  }

  // Try to find JSON object without code fences
  const jsonMatch = text.match(/\{[\s\S]*"action":\s*"(?:create_product|update_product)"[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0].trim();
  }

  return null;
}

/**
 * Parse AI response to detect product creation/update commands
 */
export function parseProductCommand(aiResponse: string): ProductCommand | null {
  const jsonText = extractJSON(aiResponse);
  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonText);

    // Validate the structure
    if (!parsed.action || typeof parsed.action !== 'string') {
      return null;
    }

    if (parsed.action === 'create_product') {
      return validateProductCreation(parsed);
    } else if (parsed.action === 'update_product') {
      return validateProductUpdate(parsed);
    }

    return null;
  } catch (_error) {
    // Invalid JSON
    return null;
  }
}

/**
 * Validate product creation command
 */
function validateProductCreation(data: unknown): ProductCreationData | null {
  const cmd = data as Partial<ProductCreationData>;

  if (!cmd.product) {
    return null;
  }

  const product = cmd.product;

  // Required fields
  if (
    !product.name ||
    !product.description ||
    typeof product.price !== 'number' ||
    !product.category ||
    !product.type ||
    typeof product.stock !== 'number' ||
    !Array.isArray(product.tags)
  ) {
    return null;
  }

  // Validate type
  if (!['physical', 'service', 'digital'].includes(product.type)) {
    return null;
  }

  return {
    action: 'create_product',
    product: {
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      type: product.type,
      stock: product.stock,
      tags: product.tags,
      image: product.image || '',
      fulfillmentOptions: product.fulfillmentOptions,
      variants: product.variants,
      seo: product.seo
    }
  };
}

/**
 * Validate product update command
 */
function validateProductUpdate(data: unknown): ProductUpdateData | null {
  const cmd = data as Partial<ProductUpdateData>;

  if (!cmd.productId || !cmd.updates) {
    return null;
  }

  return {
    action: 'update_product',
    productId: cmd.productId,
    updates: cmd.updates
  };
}

/**
 * Check if AI response contains a product command
 */
export function hasProductCommand(aiResponse: string): boolean {
  return parseProductCommand(aiResponse) !== null;
}
