export type ProductType = 'physical' | 'service' | 'digital';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  type: ProductType;
  tags: string[];
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

// Re-export page types
export type {
  PageStatus,
  WidgetType,
  Page,
  PageWidget,
  WidgetConfig,
  PageWithWidgets,
  PageFormData,
  WidgetFormData
} from './pages';

// Re-export media types
export type { MediaType, ProductMedia, MediaLibraryItem, MediaUploadResult } from './media';
