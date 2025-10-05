import { getProductById } from '../../../lib/data/products.ts';
import { error } from '@sveltejs/kit';

export const load = ({ params }) => {
  const product = getProductById(params.id);

  if (!product) {
    throw error(404, 'Product not found');
  }

  return {
    product
  };
};
