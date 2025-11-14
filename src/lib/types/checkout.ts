export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface BillingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentMethod {
  type: 'credit-card' | 'debit-card' | 'paypal';
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckoutFormData {
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  paymentMethod: PaymentMethod;
  sameAsShipping: boolean;
  selectedShippingOptionId: string | null; // Deprecated - kept for backward compatibility
  selectedShippingOptions: Record<string, string>; // Map of groupId -> selectedShippingOptionId
}

export interface CheckoutValidationErrors {
  shippingAddress?: Partial<Record<keyof ShippingAddress, string>>;
  billingAddress?: Partial<Record<keyof BillingAddress, string>>;
  paymentMethod?: Partial<Record<keyof PaymentMethod, string>>;
  shippingOption?: string;
  shippingOptions?: Record<string, string>; // Map of groupId -> error message
  general?: string;
}
