import { get } from 'svelte/store';
import { productsList } from '../../../lib/stores/products.ts';
import { error } from '@sveltejs/kit';

export const load = ({ params }) => {
  const products = get(productsList);
  const product = products.find((p) => p.id === params.id);

  if (!product) {
    throw error(404, 'Product not found');
  }

  return {
    product
  };
};
