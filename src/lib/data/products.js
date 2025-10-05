export const products = [
  {
    id: '1',
    name: 'Wireless Headphones',
    description: 'Premium quality wireless headphones with noise cancellation',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    category: 'Electronics',
    stock: 50
  },
  {
    id: '2',
    name: 'Smart Watch',
    description: 'Advanced fitness tracking and smart notifications',
    price: 299.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    category: 'Electronics',
    stock: 30
  },
  {
    id: '3',
    name: 'Coffee Mug',
    description: 'Ceramic coffee mug with beautiful design',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop',
    category: 'Home & Kitchen',
    stock: 100
  },
  {
    id: '4',
    name: 'Laptop Backpack',
    description: 'Durable laptop backpack with multiple compartments',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    category: 'Accessories',
    stock: 25
  },
  {
    id: '5',
    name: 'Desk Lamp',
    description: 'Modern LED desk lamp with adjustable brightness',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    category: 'Home & Kitchen',
    stock: 40
  },
  {
    id: '6',
    name: 'Running Shoes',
    description: 'Comfortable running shoes with excellent support',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    category: 'Sports',
    stock: 60
  }
];

export function getProductById(id) {
  return products.find((product) => product.id === id);
}

export function getProductsByCategory(category) {
  return products.filter((product) => product.category === category);
}

export function getCategories() {
  return [...new Set(products.map((product) => product.category))];
}
