export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

// Re-export checkout types
export type {
  ShippingAddress,
  BillingAddress,
  PaymentMethod,
  OrderItem,
  Order,
  CheckoutFormData,
  CheckoutValidationErrors
} from './checkout';
