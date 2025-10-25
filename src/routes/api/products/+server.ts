import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, getAllProducts, createProduct, updateProduct, deleteProduct } from '$lib/server/db';

// GET all products
export const GET: RequestHandler = async ({ platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(503, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    const dbProducts = await getAllProducts(db, siteId);

    const products = dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.image,
      category: p.category,
      stock: p.stock,
      type: p.type,
      tags: JSON.parse(p.tags || '[]')
    }));

    return json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    throw error(500, 'Failed to fetch products');
  }
};

// POST create new product
export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(503, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    const data = (await request.json()) as {
      name: string;
      description: string;
      price: number;
      image: string;
      category: string;
      stock: number;
      type: 'physical' | 'service' | 'digital';
      tags?: string[];
    };

    const productData = {
      name: data.name,
      description: data.description,
      price: Number(data.price),
      image: data.image,
      category: data.category,
      stock: Number(data.stock),
      type: data.type,
      tags: data.tags || []
    };

    const dbProduct = await createProduct(db, siteId, productData);

    const product = {
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description,
      price: dbProduct.price,
      image: dbProduct.image,
      category: dbProduct.category,
      stock: dbProduct.stock,
      type: dbProduct.type,
      tags: JSON.parse(dbProduct.tags || '[]')
    };

    return json(product, { status: 201 });
  } catch (err) {
    console.error('Error creating product:', err);
    throw error(500, 'Failed to create product');
  }
};

// PUT update product
export const PUT: RequestHandler = async ({ request, platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(503, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    const data = (await request.json()) as {
      id: string;
      name?: string;
      description?: string;
      price?: number;
      image?: string;
      category?: string;
      stock?: number;
      type?: 'physical' | 'service' | 'digital';
      tags?: string[];
    };

    const updateData: {
      name?: string;
      description?: string;
      price?: number;
      image?: string;
      category?: string;
      stock?: number;
      type?: 'physical' | 'service' | 'digital';
      tags?: string[];
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = Number(data.price);
    if (data.image !== undefined) updateData.image = data.image;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.stock !== undefined) updateData.stock = Number(data.stock);
    if (data.type !== undefined) updateData.type = data.type;
    if (data.tags !== undefined) updateData.tags = data.tags;

    const dbProduct = await updateProduct(db, siteId, data.id, updateData);

    if (!dbProduct) {
      throw error(404, 'Product not found');
    }

    const product = {
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description,
      price: dbProduct.price,
      image: dbProduct.image,
      category: dbProduct.category,
      stock: dbProduct.stock,
      type: dbProduct.type,
      tags: JSON.parse(dbProduct.tags || '[]')
    };

    return json(product);
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error updating product:', err);
    throw error(500, 'Failed to update product');
  }
};

// DELETE product
export const DELETE: RequestHandler = async ({ request, platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(503, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    const data = (await request.json()) as { id: string };

    const deleted = await deleteProduct(db, siteId, data.id);

    if (!deleted) {
      throw error(404, 'Product not found');
    }

    return json({ success: true });
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error deleting product:', err);
    throw error(500, 'Failed to delete product');
  }
};
