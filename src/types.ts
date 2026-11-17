export type AppRole = 'welcome' | 'buyer' | 'seller';

export type RawalpindiArea = string;

export interface ServicePackage {
  name: string;
  price: number;
  time: string; // e.g. "30 mins", "45 mins", "1 Hour"
}

export type SellerType = 'shop' | 'home';

export interface Product {
  id: string;
  title: string;
  price: number; // in PKR (Rs)
  category: string;
  location: string;
  distanceKm: number;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerPhoto?: string;
  sellerVerified: boolean;
  sellerHasBlueTick?: boolean;
  sellerType?: SellerType;
  image: string;
  images?: string[]; // Up to 5 photos (used in Shadi Car Decor gallery slider)
  condition: 'Brand New' | 'Like New' | 'Gently Used';
  description: string;
  stock: number;
  featured?: boolean;
  rating?: number; // 0 by default for new products
  reviewsCount?: number; // 0 by default
  permanent?: boolean; // Kept in database even after expiry so Seller can renew or Admin can delete
  renewedAtIso?: string;
  expiresAtMs?: number;
  isHomeService?: boolean;
  serviceTime?: string; // e.g. "30-45 mins"
  packages?: ServicePackage[]; // Used for Car Wash packages & multi-tier home services
  createdAtIso?: string;
}

export interface SavedSellerProfile {
  name: string;
  phone: string;
  cnicNumber: string;
  city: string;
  area?: string;
  sellerType: SellerType;
  shopName?: string;
  workOrShopPhoto?: string;
  idFrontPhoto?: string;
  idBackPhoto?: string;
  savedAtIso: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'out_for_delivery'
  | 'delivered';

export interface Order {
  id: string; // e.g. NWB-738492
  createdAt: string;
  buyerName: string;
  buyerPhone: string;
  deliveryAddress: string;
  deliveryArea: string;
  items: CartItem[];
  subtotal: number;
  totalAmount: number;
  paymentMode: 'Cash on Delivery / Cash on Work';
  status: OrderStatus;
  estimatedDelivery: string;
}

export interface SellerProfile {
  id: string;
  name: string;
  shopName: string;
  phone: string;
  photo?: string;
  location: string;
  city?: string;
  isVerified: boolean;
  hasBlueTick?: boolean;
  blueTickStatus?: 'none' | 'pending' | 'verified';
  blueTickTid?: string;
  cnicNumber?: string;
  cnicFrontUploaded?: boolean;
  cnicBackUploaded?: boolean;
  idVerificationStatus?: 'none' | 'pending' | 'verified';
  faceVerified?: boolean;
  rating?: number; // 0 by default for new sellers
  reviewsCount?: number; // 0 by default
  createdAtIso?: string;
  lastLoginAt?: string;
  primaryCategory?: string;
  isBlocked?: boolean;
  sellerType?: SellerType;
  oneTimeVerificationDone?: boolean;
}

export interface UserRecord {
  id: string;
  name: string;
  phone: string;
  role: 'buyer' | 'seller';
  city?: string;
  area?: string;
  address?: string;
  isBlocked: boolean;
  createdAtIso: string;
  lastLoginAt: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  sellerId?: string;
  buyerName: string;
  rating: number; // 1 to 5 stars
  comment?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderRole: 'buyer' | 'seller';
  senderName: string;
  text: string;
  time: string;
  createdAtMs?: number;
  type?: 'text' | 'address' | 'booking' | 'photo' | 'location' | 'voice' | 'order';
  imageUrl?: string;
  audioUrl?: string;
  audioDurationSec?: number;
  delivered?: boolean;
  seen?: boolean;
  locationInfo?: {
    address: string;
    lat?: number;
    lng?: number;
    mapUrl?: string;
  };
  orderInfo?: {
    productId: string;
    productTitle: string;
    productImage?: string;
    price: number;
    quantity: number;
    category: string;
  };
  bookingInfo?: {
    bookingId?: string;
    productTitle: string;
    price: number;
    category: string;
    address: string;
    preferredTime: string;
    notes?: string;
    packageName?: string;
  };
}

export interface VoiceCallSession {
  id: string;
  callerRole: 'buyer' | 'seller';
  callerName: string;
  callerPhone: string;
  calleeRole: 'buyer' | 'seller';
  calleeId: string;
  calleeName: string;
  calleePhone: string;
  calleePhoto?: string;
  productTitle?: string;
  status: 'ringing' | 'connected' | 'ended' | 'missed' | 'rejected';
  isCalleeOffline?: boolean;
  startedAtMs: number;
  connectedAtMs?: number;
}

export interface ChatThread {
  id: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  productId?: string;
  productTitle?: string;
  category?: string;
  messages: ChatMessage[];
  updatedAt: string;
  updatedAtMs?: number;
  unreadForBuyer?: number;
  unreadForSeller?: number;
}

export interface HomeBooking {
  id: string;
  productId: string;
  productTitle: string;
  category: string;
  price: number;
  packageName?: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  preferredTime: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'on_the_way' | 'completed';
  createdAt: string;
}

export interface AuthUser {
  id?: string;
  name: string;
  phone: string;
  role: 'buyer' | 'seller';
  isLoggedIn: boolean;
  isBlocked?: boolean;
  loggedInAt?: string;
  address?: string;
  city?: string;
  mohalla?: string;
  area?: string;
  gpsCoords?: { lat: number; lng: number };
  gpsDetectedText?: string;
}

export interface ProductReport {
  id: string;
  productId: string;
  productTitle: string;
  sellerId: string;
  sellerName: string;
  reporterName: string;
  reporterPhone: string;
  reason: string;
  details?: string;
  createdAt: string;
  status: 'pending' | 'resolved';
}

export interface BlueTickRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  shopName: string;
  phone: string;
  tid: string;
  screenshot?: string;
  fee: number; // 2000 Rs (auto 5000 Rs after 6 months)
  createdAt: string;
  createdAtIso?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
}

export interface SellerIdProof {
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  frontPhoto?: string;
  backPhoto?: string;
  sellerType?: SellerType;
  shopName?: string;
  sellerPhoto?: string;
  location?: string;
  status: 'none' | 'pending' | 'verified';
  submittedAt?: string;
  submittedAtIso?: string;
  reviewedAt?: string;
}

export interface BuyerRecord {
  id: string;
  name: string;
  phone: string;
  city?: string;
  area?: string;
  isBlocked?: boolean;
  createdAtIso: string;
  lastLoginAt: string;
}

export interface AdminPublicConfig {
  secretPath: string;
  blueTickOfferStartIso: string;
  adminJazzCashNumber: string;
  adminJazzCashTitle: string;
  updatedAtIso?: string;
}

export interface AdminCredentialsConfig {
  adminPhone: string;
  pinHash: string;
  authProofHash?: string;
  updatedAtIso: string;
}
