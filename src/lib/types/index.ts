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
  fulfillmentOptions?: Array<{
    providerId: string;
    providerName: string;
    cost: number;
    stockQuantity: number;
    sortOrder: number;
  }>;
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

// Re-export role and permission types
export type {
  Permission,
  Role,
  RolePermission,
  RoleWithPermissions,
  CreateRoleData,
  UpdateRoleData,
  PermissionCategory
} from './roles';

// Re-export activity log types
export type {
  ActivityLog,
  ActivityLogMetadata,
  CreateActivityLogData,
  ActivityLogFilter,
  EntityType
} from './activity-logs';

// Re-export notification types
export type {
  Notification,
  NotificationMetadata,
  CreateNotificationData,
  NotificationType
} from './notifications';

// Re-export fulfillment types
export type {
  FulfillmentProvider,
  DBFulfillmentProvider,
  CreateFulfillmentProviderData,
  UpdateFulfillmentProviderData,
  ProductFulfillmentOption,
  DBProductFulfillmentOption,
  CreateProductFulfillmentOptionData
} from './fulfillment';
