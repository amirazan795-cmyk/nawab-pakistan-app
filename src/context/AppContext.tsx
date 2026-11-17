import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  AdminPublicConfig,
  AppRole,
  AuthUser,
  BlueTickRequest,
  BuyerRecord,
  CartItem,
  ChatMessage,
  ChatThread,
  HomeBooking,
  Order,
  OrderStatus,
  Product,
  ProductReport,
  ProductReview,
  SavedSellerProfile,
  SellerIdProof,
  SellerProfile,
  SellerType,
  UserRecord,
  VoiceCallSession,
} from '../types';
import {
  DEFAULT_PUBLIC_CONFIG,
  ensureAdminConfigBootstrapped,
} from '../services/adminFirebaseService';
import { isSecretAdminRoute, normalizePhoneDigits } from '../utils/adminCrypto';
import { fitImageUnderBytes, stripUndefined } from '../utils/imageCompress';
import { AD_EXPIRY_MS, getAdExpiryInfo } from '../utils/adExpiry';
import { isAllowedHomeServiceCategory } from '../data/categories';

const SAVED_SELLER_STORAGE_KEY = 'nawab_saved_seller_profile';

interface AppContextType {
  role: AppRole;
  setRole: (role: AppRole) => void;
  buyerTab: 'home' | 'categories' | 'orders' | 'profile';
  setBuyerTab: (tab: 'home' | 'categories' | 'orders' | 'profile') => void;
  selectedArea: string;
  setSelectedArea: (area: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  setCityAndArea: (city: string, area?: string) => void;
  userMohalla: string;
  setUserMohalla: (mohalla: string) => void;
  reports: ProductReport[];
  submitReport: (
    productId: string,
    productTitle: string,
    sellerId: string,
    sellerName: string,
    reason: string,
    details?: string
  ) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;

  // Data (real-time synced from Firebase Firestore)
  products: Product[]; // Active non-expired listings visible to buyers
  allProducts: Product[]; // Active + expired listings (used by Seller Dashboard for Renew Ad)
  sellers: SellerProfile[];
  buyers: BuyerRecord[];
  orders: Order[];
  cart: CartItem[];
  isPublicConfigLoaded: boolean;
  isAdminLoginOpen: boolean;
  setIsAdminLoginOpen: (open: boolean) => void;
  isAdminUnlocked: boolean;
  setIsAdminUnlocked: (unlocked: boolean) => void;

  // Current active selections
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;

  // Cart Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartCount: number;

  // Order actions (Cash on Delivery / Cash on Work only)
  placeOrder: (orderInfo: {
    buyerName: string;
    buyerPhone: string;
    deliveryAddress: string;
    deliveryArea: string;
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  // Seller tab & actions
  sellerTab: 'post' | 'products' | 'bluetick' | 'orders' | 'chats' | 'add' | 'sales' | 'profile';
  setSellerTab: (tab: 'post' | 'products' | 'bluetick' | 'orders' | 'chats' | 'add' | 'sales' | 'profile') => void;
  openPostProduct: () => void;
  currentSeller: SellerProfile;
  addProduct: (
    product: Omit<
      Product,
      'id' | 'sellerId' | 'sellerName' | 'sellerPhone' | 'sellerVerified'
    > & { sellerPhone?: string }
  ) => Promise<{ ok: boolean; error?: string; product?: Product }>;
  renewProduct: (productId: string) => Promise<{ ok: boolean; error?: string }>;
  deleteProduct: (productId: string) => void;
  updateProductPrice: (productId: string, newPrice: number) => void;
  isMyAd: (product?: Product | null) => boolean;

  // Auth User (BUY / SELL only, persistent across restarts)
  authUser: AuthUser | null;
  blockedNotice: string | null;
  clearBlockedNotice: () => void;
  checkPhoneBlocked: (phone: string) => Promise<boolean>;
  loginUser: (
    name: string,
    phone: string,
    role: 'buyer' | 'seller',
    city?: string,
    area?: string,
    gpsCoords?: { lat: number; lng: number },
    gpsDetectedText?: string
  ) => Promise<{ ok: boolean; blocked?: boolean }>;
  logoutUser: () => void;
  updateAuthUserProfile: (
    name: string,
    phone: string,
    address?: string,
    city?: string,
    area?: string
  ) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;

  // One-Time Seller Detail Persistence (Name, Phone, CNIC, City in browser localStorage)
  savedSellerProfile: SavedSellerProfile | null;
  hasCompletedSellerSetup: boolean;
  saveOneTimeSellerDetails: (params: {
    sellerType: SellerType;
    name: string;
    shopName?: string;
    phone: string;
    cnicNumber: string;
    city: string;
    area?: string;
    workOrShopPhoto?: string;
    idFrontPhoto?: string;
    idBackPhoto?: string;
  }) => Promise<void>;
  clearSavedSellerAndLogout: () => void;
  restoreSavedSellerSession: () => Promise<{ ok: boolean; blocked?: boolean }>;

  // Blue Tick Verification Requests (Rs 2000 for 6 months, then automatically Rs 5000)
  blueTickPrice: number;
  isBlueTickAfterSixMonths: boolean;
  adminJazzCashNumber: string;
  adminJazzCashTitle: string;
  blueTickRequests: BlueTickRequest[];
  isBlueTickPageOpen: boolean;
  setIsBlueTickPageOpen: (open: boolean) => void;
  submitBlueTickRequest: (tid: string, screenshot?: string, fee?: number) => void;
  isSellerVerified: (sellerId: string, sellerName?: string) => boolean;

  // Private ID Card & One-Time Seller Verification Trust Features
  isSellerDataLoaded: boolean;
  hasCompletedOneTimeVerification: boolean;
  completeOneTimeSellerVerification: (params: {
    sellerType: SellerType;
    displayName: string;
    workOrShopPhoto: string;
    location: string;
    idFrontPhoto: string;
    idBackPhoto: string;
  }) => Promise<void>;
  getProductSellerType: (product: Product) => SellerType;
  sellerIdProofs: Record<string, SellerIdProof>;
  getSellerIdProof: (
    sellerId?: string,
    sellerName?: string,
    sellerPhone?: string
  ) => SellerIdProof | null;
  hasSellerUploadedId: (sellerId?: string) => boolean;
  isSellerIdVerified: (sellerId: string, sellerName?: string) => boolean;
  submitSellerIdPhotos: (frontPhoto: string, backPhoto: string, sellerId?: string) => void;
  updateSellerPhone: (phone: string) => void;

  // Real Buyer Reviews System (Rating starts at 0, only increases with real buyer reviews)
  reviews: ProductReview[];
  addProductReview: (
    productId: string,
    rating: number,
    comment?: string,
    buyerName?: string
  ) => void;

  // Live Chat Inside App & Home Service Bookings (saved to Firebase Firestore)
  chatThreads: ChatThread[];
  homeBookings: HomeBooking[];
  activeChatThreadId: string | null;
  setActiveChatThreadId: (id: string | null) => void;
  isChatModalOpen: boolean;
  setIsChatModalOpen: (open: boolean) => void;
  openChatWithSeller: (params: {
    sellerId: string;
    sellerName: string;
    sellerPhone: string;
    productId?: string;
    productTitle?: string;
    category?: string;
  }) => ChatThread;
  orderViaChat: (params: {
    product: Product;
    quantity?: number;
    note?: string;
  }) => ChatThread;
  sendChatMessage: (
    threadId: string,
    text: string,
    senderRole: 'buyer' | 'seller',
    type?: ChatMessage['type'],
    extra?: {
      bookingInfo?: ChatMessage['bookingInfo'];
      imageUrl?: string;
      audioUrl?: string;
      audioDurationSec?: number;
      locationInfo?: ChatMessage['locationInfo'];
      orderInfo?: ChatMessage['orderInfo'];
    }
  ) => void;
  bookHomeService: (params: {
    product: Product;
    address: string;
    preferredTime: string;
    notes?: string;
    packageName?: string;
    priceOverride?: number;
  }) => { booking: HomeBooking; thread: ChatThread };
  updateBookingStatus: (bookingId: string, status: HomeBooking['status']) => void;
  markThreadRead: (threadId: string, readerRole: 'buyer' | 'seller') => void;

  // Real-time Online Presence & NAWAB In-App Voice Call
  isUserOnline: (idOrPhone?: string, fallbackName?: string) => boolean;
  activeVoiceCall: VoiceCallSession | null;
  startInAppCall: (params: {
    calleeId: string;
    calleeName: string;
    calleePhone: string;
    calleePhoto?: string;
    calleeRole: 'buyer' | 'seller';
    productTitle?: string;
  }) => VoiceCallSession;
  acceptInAppCall: () => void;
  rejectInAppCall: () => void;
  markInAppCallMissed: () => void;
  endInAppCall: () => void;
  dismissVoiceCall: () => void;

  // App refresh
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function toSafeId(raw: string): string {
  const cleaned = (raw || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  return cleaned.slice(0, 120) || `id_${Date.now()}`;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistent Login Session (Buyer or Seller only — never Admin)
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('dba_auth_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn && (parsed.role === 'buyer' || parsed.role === 'seller')) {
          return parsed;
        }
        // Clear stale non-buyer/seller sessions (e.g. old admin or rider sessions)
        localStorage.removeItem('dba_auth_user');
        localStorage.removeItem('dba_role');
      } catch {
        // ignore
      }
    }
    return null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null);
  const [nowTickMs, setNowTickMs] = useState<number>(() => Date.now());
  const [savedSellerProfile, setSavedSellerProfile] = useState<SavedSellerProfile | null>(() => {
    try {
      const raw = localStorage.getItem(SAVED_SELLER_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SavedSellerProfile;
      if (parsed && parsed.name && parsed.phone && parsed.cnicNumber && parsed.city) {
        return parsed;
      }
    } catch {
      // ignore invalid saved seller profile
    }
    return null;
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTickMs(Date.now());
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const [role, setRole] = useState<AppRole>(() => {
    const savedRole = localStorage.getItem('dba_role') as string | null;
    const savedAuth = localStorage.getItem('dba_auth_user');
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        if (parsed && parsed.isLoggedIn && (parsed.role === 'buyer' || parsed.role === 'seller')) {
          return parsed.role;
        }
      } catch {
        // ignore
      }
    }
    if (savedRole === 'buyer' || savedRole === 'seller' || savedRole === 'welcome') {
      return savedRole;
    }
    return 'welcome';
  });

  const [buyerTab, setBuyerTab] = useState<'home' | 'categories' | 'orders' | 'profile'>('home');
  const [sellerTab, setSellerTab] = useState<
    'post' | 'products' | 'bluetick' | 'orders' | 'chats' | 'add' | 'sales' | 'profile'
  >('products');

  const [selectedArea, setSelectedAreaState] = useState<string>(() => {
    const saved = localStorage.getItem('dba_selected_area');
    if (saved) return saved;
    try {
      const user = localStorage.getItem('dba_auth_user');
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed.mohalla) return parsed.mohalla;
      }
    } catch {
      // ignore
    }
    return 'All Rawalpindi';
  });

  const setSelectedArea = (area: string) => {
    setSelectedAreaState(area);
    localStorage.setItem('dba_selected_area', area);
  };

  const [selectedCity, setSelectedCityState] = useState<string>(() => {
    const saved = localStorage.getItem('dba_selected_city');
    if (saved) return saved;
    try {
      const user = localStorage.getItem('dba_auth_user');
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed.city) return parsed.city;
      }
    } catch {
      // ignore
    }
    return 'Rawalpindi';
  });

  const setSelectedCity = (city: string) => {
    setSelectedCityState(city);
    localStorage.setItem('dba_selected_city', city);
  };

  const [userMohalla, setUserMohallaState] = useState<string>(() => {
    const saved = localStorage.getItem('dba_user_mohalla');
    if (saved) return saved;
    try {
      const user = localStorage.getItem('dba_auth_user');
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed.mohalla || parsed.area) return parsed.mohalla || parsed.area;
      }
    } catch {
      // ignore
    }
    return 'Satellite Town';
  });

  const setUserMohalla = (mohalla: string) => {
    setUserMohallaState(mohalla);
    localStorage.setItem('dba_user_mohalla', mohalla);
  };

  const setCityAndArea = (city: string, area?: string) => {
    const nextCity = city || 'Rawalpindi';
    const nextArea = area || `All ${nextCity}`;
    setSelectedCityState(nextCity);
    setSelectedAreaState(nextArea);
    localStorage.setItem('dba_selected_city', nextCity);
    localStorage.setItem('dba_selected_area', nextArea);
    if (!nextArea.toLowerCase().startsWith('all ')) {
      setUserMohallaState(nextArea);
      localStorage.setItem('dba_user_mohalla', nextArea);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Firebase-synced application states (products also cached locally for instant offline-safe display)
  const [rawProducts, setRawProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('dba_products_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore invalid cache
    }
    return [];
  });
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reports, setReports] = useState<ProductReport[]>([]);
  const [blueTickRequests, setBlueTickRequests] = useState<BlueTickRequest[]>([]);
  const [sellerIdProofs, setSellerIdProofs] = useState<Record<string, SellerIdProof>>({});
  const [homeBookings, setHomeBookings] = useState<HomeBooking[]>([]);
  const [chatThreadHeaders, setChatThreadHeaders] = useState<Omit<ChatThread, 'messages'>[]>([]);
  const [messagesByThread, setMessagesByThread] = useState<Record<string, ChatMessage[]>>({});
  const [onlinePresence, setOnlinePresence] = useState<Record<string, number>>({});
  const [activeVoiceCall, setActiveVoiceCall] = useState<VoiceCallSession | null>(null);
  const [publicConfig, setPublicConfig] = useState<AdminPublicConfig>(DEFAULT_PUBLIC_CONFIG);
  const [isPublicConfigLoaded, setIsPublicConfigLoaded] = useState(false);
  const [sellersLoaded, setSellersLoaded] = useState(false);
  const [idProofsLoaded, setIdProofsLoaded] = useState(false);
  const isSellerDataLoaded = sellersLoaded && idProofsLoaded;

  // Local shopping cart per device
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('dba_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeChatThreadId, setActiveChatThreadId] = useState<string | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isBlueTickPageOpen, setIsBlueTickPageOpen] = useState(false);

  // Secret Admin Login / Panel State (Opened ONLY via /admin URL — never modifies URL)
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(() => isSecretAdminRoute());
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncAdminRoute = () => {
      if (isSecretAdminRoute()) {
        setIsAdminLoginOpen(true);
      } else {
        setIsAdminLoginOpen(false);
        setIsAdminUnlocked(false);
      }
    };
    syncAdminRoute();
    window.addEventListener('popstate', syncAdminRoute);
    window.addEventListener('hashchange', syncAdminRoute);
    return () => {
      window.removeEventListener('popstate', syncAdminRoute);
      window.removeEventListener('hashchange', syncAdminRoute);
    };
  }, []);

  // Clean up legacy local keys once on boot
  useEffect(() => {
    localStorage.removeItem('dba_token_balance');
    localStorage.removeItem('dba_riders');
    try {
      sessionStorage.removeItem('nawab_hidden_admin_session');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dba_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('dba_cart', JSON.stringify(cart));
  }, [cart]);

  // Bootstrap default admin_config docs in Firestore on initial run
  useEffect(() => {
    ensureAdminConfigBootstrapped()
      .then((cfg) => {
        setPublicConfig(cfg);
        setIsPublicConfigLoaded(true);
      })
      .catch(() => {
        setIsPublicConfigLoaded(true);
      });
  }, []);

  // =========================================================================
  // REAL-TIME FIREBASE FIRESTORE SUBSCRIPTIONS (ALL USERS SEE LIVE DATA)
  // =========================================================================
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'admin_config', 'public'),
        (snap) => {
          if (snap.exists()) {
            setPublicConfig(snap.data() as AdminPublicConfig);
          }
          setIsPublicConfigLoaded(true);
        },
        (error) => {
          setIsPublicConfigLoaded(true);
          handleFirestoreError(error, OperationType.GET, 'admin_config/public');
        }
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'products'),
        (snap) => {
          const list = snap.docs.map((d) => {
            const data = d.data() as Product;
            return {
              ...data,
              id: data.id || d.id,
              permanent: data.permanent ?? true,
            };
          });
          list.sort((a, b) =>
            (b.renewedAtIso || b.createdAtIso || '').localeCompare(a.renewedAtIso || a.createdAtIso || '')
          );
          setRawProducts(list);
          try {
            localStorage.setItem('dba_products_cache', JSON.stringify(list));
          } catch {
            // IndexedDB Firestore persistentLocalCache retains full dataset if localStorage quota fills
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'products')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'sellers'),
        (snap) => {
          const list = snap.docs.map((d) => d.data() as SellerProfile);
          list.sort((a, b) => (b.lastLoginAt || '').localeCompare(a.lastLoginAt || ''));
          setSellers(list);
          setSellersLoaded(true);
        },
        (error) => {
          setSellersLoaded(true);
          handleFirestoreError(error, OperationType.LIST, 'sellers');
        }
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'users'),
        (snap) => {
          const list = snap.docs.map((d) => d.data() as UserRecord);
          list.sort((a, b) => (b.lastLoginAt || '').localeCompare(a.lastLoginAt || ''));
          setUsers(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'users')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'blue_tick_requests'),
        (snap) => {
          const list = snap.docs.map((d) => d.data() as BlueTickRequest);
          list.sort((a, b) => (b.createdAtIso || '').localeCompare(a.createdAtIso || ''));
          setBlueTickRequests(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'blue_tick_requests')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'id_proofs'),
        (snap) => {
          const map: Record<string, SellerIdProof> = {};
          snap.docs.forEach((d) => {
            const item = d.data() as SellerIdProof;
            map[item.sellerId || d.id] = item;
          });
          setSellerIdProofs(map);
          setIdProofsLoaded(true);
        },
        (error) => {
          setIdProofsLoaded(true);
          handleFirestoreError(error, OperationType.LIST, 'id_proofs');
        }
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'home_bookings'),
        (snap) => {
          const list = snap.docs.map((d) => d.data() as HomeBooking);
          setHomeBookings(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'home_bookings')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'orders'),
        (snap) => {
          const list = snap.docs.map((d) => d.data() as Order);
          setOrders(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'orders')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'reviews'),
        (snap) => {
          const list = snap.docs.map((d) => d.data() as ProductReview);
          setReviews(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'reviews')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'reports'),
        (snap) => {
          const list = snap.docs.map((d) => d.data() as ProductReport);
          setReports(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'reports')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'chats'),
        (snap) => {
          const list = snap.docs.map((d) => d.data() as Omit<ChatThread, 'messages'>);
          list.sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));
          setChatThreadHeaders(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'chats')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'presence'),
        (snap) => {
          const nextMap: Record<string, number> = {};
          snap.docs.forEach((d) => {
            const item = d.data() as { key?: string; lastSeenMs?: number };
            if (item.key && typeof item.lastSeenMs === 'number') {
              nextMap[item.key] = item.lastSeenMs;
            }
          });
          setOnlinePresence(nextMap);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'presence')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'voice_calls'),
        (snap) => {
          const calls = snap.docs
            .map((d) => d.data() as VoiceCallSession)
            .sort((a, b) => (b.startedAtMs || 0) - (a.startedAtMs || 0));
          const latestActive = calls.find(
            (c) => c.status === 'ringing' || c.status === 'connected'
          );
          setActiveVoiceCall(latestActive || calls[0] || null);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'voice_calls')
      )
    );

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, []);

  // Subscribe to messages subcollection for each chat thread relevant to current user
  const msgUnsubsRef = useRef<Record<string, () => void>>({});

  useEffect(() => {
    const authPhoneClean = normalizePhoneDigits(authUser?.phone || '');
    const relevantIds = new Set(
      chatThreadHeaders
        .filter((t) => {
          if (!authUser?.isLoggedIn) return false;
          if (authPhoneClean) {
            return (
              normalizePhoneDigits(t.buyerPhone) === authPhoneClean ||
              normalizePhoneDigits(t.sellerPhone) === authPhoneClean
            );
          }
          return true;
        })
        .map((t) => t.id)
    );

    if (activeChatThreadId) {
      relevantIds.add(activeChatThreadId);
    }

    // Unsubscribe from threads no longer relevant
    Object.keys(msgUnsubsRef.current).forEach((tId) => {
      if (!relevantIds.has(tId)) {
        msgUnsubsRef.current[tId]();
        delete msgUnsubsRef.current[tId];
      }
    });

    // Subscribe to newly relevant threads
    relevantIds.forEach((tId) => {
      if (!msgUnsubsRef.current[tId]) {
        const msgQuery = query(
          collection(db, 'chats', tId, 'messages'),
          orderBy('createdAtMs', 'asc')
        );
        msgUnsubsRef.current[tId] = onSnapshot(
          msgQuery,
          (snap) => {
            const msgs = snap.docs.map((d) => d.data() as ChatMessage);
            setMessagesByThread((prev) => ({ ...prev, [tId]: msgs }));
          },
          (error) => handleFirestoreError(error, OperationType.LIST, `chats/${tId}/messages`)
        );
      }
    });
  }, [chatThreadHeaders, authUser?.isLoggedIn, authUser?.phone, activeChatThreadId]);

  useEffect(() => {
    return () => {
      Object.values(msgUnsubsRef.current).forEach((fn) => fn());
      msgUnsubsRef.current = {};
    };
  }, []);

  // Combine thread headers + Firestore messages into ChatThread[]
  const chatThreads: ChatThread[] = useMemo(() => {
    return chatThreadHeaders.map((h) => ({
      ...h,
      messages: messagesByThread[h.id] || [],
    }));
  }, [chatThreadHeaders, messagesByThread]);

  // Derived Buyers list from Firebase users collection
  const buyers: BuyerRecord[] = useMemo(() => {
    return users
      .filter((u) => u.role === 'buyer')
      .map((u) => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        city: u.city,
        area: u.area,
        isBlocked: u.isBlocked,
        createdAtIso: u.createdAtIso,
        lastLoginAt: u.lastLoginAt,
      }));
  }, [users]);

  // Filter out products posted by Admin-blocked sellers
  const blockedPhonesSet = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.isBlocked && u.phone) set.add(normalizePhoneDigits(u.phone));
    });
    sellers.forEach((s) => {
      if (s.isBlocked && s.phone) set.add(normalizePhoneDigits(s.phone));
    });
    return set;
  }, [users, sellers]);

  const blockedSellerIdsSet = useMemo(() => {
    const set = new Set<string>();
    sellers.forEach((s) => {
      if (s.isBlocked) set.add(s.id);
    });
    return set;
  }, [sellers]);

  const allProducts = useMemo(() => {
    return rawProducts
      .filter(
        (p) =>
          isAllowedHomeServiceCategory(p.category) &&
          !blockedSellerIdsSet.has(p.sellerId) &&
          !blockedPhonesSet.has(normalizePhoneDigits(p.sellerPhone))
      )
      .sort((a, b) =>
        (b.renewedAtIso || b.createdAtIso || '').localeCompare(
          a.renewedAtIso || a.createdAtIso || ''
        )
      );
  }, [rawProducts, blockedSellerIdsSet, blockedPhonesSet]);

  const products = useMemo(() => {
    return allProducts.filter((p) => !getAdExpiryInfo(p, nowTickMs).isExpired);
  }, [allProducts, nowTickMs]);

  // Enforce Real-Time Admin Block on currently logged-in user
  useEffect(() => {
    if (!authUser?.isLoggedIn) return;
    const myPhone = normalizePhoneDigits(authUser.phone);
    const matchedUser = users.find(
      (u) => (authUser.id && u.id === authUser.id) || (myPhone && normalizePhoneDigits(u.phone) === myPhone)
    );
    const matchedSeller = sellers.find(
      (s) => myPhone && normalizePhoneDigits(s.phone) === myPhone
    );

    if (matchedUser?.isBlocked || matchedSeller?.isBlocked) {
      localStorage.removeItem('dba_auth_user');
      localStorage.removeItem('dba_role');
      localStorage.removeItem('dba_cart');
      localStorage.removeItem(SAVED_SELLER_STORAGE_KEY);
      setSavedSellerProfile(null);
      setAuthUser(null);
      setRole('welcome');
      setCart([]);
      setBlockedNotice('Aapka account Admin ne block kar diya hai.');
    }
  }, [users, sellers, authUser?.isLoggedIn, authUser?.id, authUser?.phone]);

  // Resolve current logged-in Seller dynamically
  const normalizedAuthPhone = normalizePhoneDigits(authUser?.phone || savedSellerProfile?.phone || '');
  const emptyFallbackSeller: SellerProfile = {
    id: normalizedAuthPhone ? `seller-${normalizedAuthPhone}` : authUser?.id || 'seller-guest',
    name: savedSellerProfile?.name || authUser?.name || 'My Shop',
    shopName: savedSellerProfile?.shopName || savedSellerProfile?.name || authUser?.name || 'My Shop',
    phone: savedSellerProfile?.phone || authUser?.phone || '',
    photo: savedSellerProfile?.workOrShopPhoto,
    city: savedSellerProfile?.city || selectedCity || 'Rawalpindi',
    cnicNumber: savedSellerProfile?.cnicNumber,
    sellerType: savedSellerProfile?.sellerType,
    location:
      savedSellerProfile?.area && savedSellerProfile?.city
        ? `${savedSellerProfile.area}, ${savedSellerProfile.city}`
        : savedSellerProfile?.city || `${selectedArea || 'Satellite Town'}, ${selectedCity || 'Rawalpindi'}`,
    isVerified: false,
    hasBlueTick: false,
    blueTickStatus: 'none',
    rating: 0,
    reviewsCount: 0,
  };

  const matchedSeller =
    authUser?.role === 'seller' && normalizedAuthPhone
      ? sellers.find((s) => s.id === `seller-${normalizedAuthPhone}`) ||
        sellers.find((s) => normalizePhoneDigits(s.phone) === normalizedAuthPhone)
      : undefined;
  const currentSeller = matchedSeller || emptyFallbackSeller;

  // Strict User-ID-only ownership check (never matches by seller name)
  const isMyAd = (product?: Product | null): boolean => {
    if (!product || !product.sellerId) return false;
    const myIds = [currentSeller.id, authUser?.id].filter(
      (id): id is string => !!id && id !== 'seller-guest'
    );
    return myIds.includes(product.sellerId);
  };

  // Sync currently logged-in Seller/Buyer into Firebase if persistent session existed from before
  useEffect(() => {
    if (!authUser?.isLoggedIn) return;
    const digits = normalizePhoneDigits(authUser.phone);
    if (!digits) return;
    const userId = authUser.id || `user_${digits}`;
    const alreadyInUsers = users.some((u) => u.id === userId);
    if (!alreadyInUsers && users.length >= 0) {
      const nowIso = new Date().toISOString();
      const userDoc: UserRecord = {
        id: userId,
        name: authUser.name || 'NAWAB User',
        phone: authUser.phone,
        role: authUser.role,
        city: authUser.city || selectedCity || 'Rawalpindi',
        area: authUser.area || authUser.mohalla || selectedArea || 'Satellite Town',
        address: authUser.address || `${selectedArea || 'Satellite Town'}, ${selectedCity || 'Rawalpindi'}`,
        isBlocked: false,
        createdAtIso: authUser.loggedInAt || nowIso,
        lastLoginAt: nowIso,
      };
      setDoc(doc(db, 'users', userId), stripUndefined(userDoc), { merge: true }).catch(() => {
        // silent background sync
      });
    }
  }, [authUser?.isLoggedIn, authUser?.phone, users.length]);

  // Blue Tick 6-Month Automatic Pricing: Rs 2000 for 6 months, then Rs 5000 automatically
  const adminJazzCashNumber =
    publicConfig.adminJazzCashNumber || DEFAULT_PUBLIC_CONFIG.adminJazzCashNumber;
  const adminJazzCashTitle =
    publicConfig.adminJazzCashTitle || DEFAULT_PUBLIC_CONFIG.adminJazzCashTitle;

  const isBlueTickAfterSixMonths = useMemo(() => {
    const startDate = new Date(
      publicConfig.blueTickOfferStartIso || DEFAULT_PUBLIC_CONFIG.blueTickOfferStartIso
    );
    if (Number.isNaN(startDate.getTime())) return false;
    const switchDate = new Date(startDate);
    switchDate.setMonth(switchDate.getMonth() + 6);
    return Date.now() >= switchDate.getTime();
  }, [publicConfig.blueTickOfferStartIso]);

  const blueTickPrice = isBlueTickAfterSixMonths ? 5000 : 2000;

  // Check if a phone number is blocked in Firebase
  const checkPhoneBlocked = async (phone: string): Promise<boolean> => {
    const digits = normalizePhoneDigits(phone);
    if (!digits) return false;
    if (blockedPhonesSet.has(digits)) return true;

    try {
      const userSnap = await getDoc(doc(db, 'users', `user_${digits}`));
      if (userSnap.exists() && (userSnap.data() as UserRecord).isBlocked) {
        return true;
      }
      const sellerSnap = await getDoc(doc(db, 'sellers', `seller-${digits}`));
      if (sellerSnap.exists() && (sellerSnap.data() as SellerProfile).isBlocked) {
        return true;
      }
    } catch {
      // ignore if offline fallback checked above
    }
    return false;
  };

  const clearBlockedNotice = () => setBlockedNotice(null);

  // Auth User Functions (BUY and SELL ONLY — No Admin inside App)
  const loginUser = async (
    name: string,
    phone: string,
    userRole: 'buyer' | 'seller',
    city?: string,
    area?: string,
    gpsCoords?: { lat: number; lng: number },
    gpsDetectedText?: string
  ): Promise<{ ok: boolean; blocked?: boolean }> => {
    const cleanPhone = phone.trim();
    const digits = normalizePhoneDigits(cleanPhone);

    const isBlocked = await checkPhoneBlocked(cleanPhone);
    if (isBlocked) {
      setBlockedNotice('Aapka account Admin ne block kar diya hai.');
      return { ok: false, blocked: true };
    }

    const chosenCity = city?.trim() || selectedCity || 'Rawalpindi';
    const chosenArea = area?.trim() || selectedArea || 'Satellite Town';
    const nowIso = new Date().toISOString();
    const userId = `user_${digits || Date.now()}`;

    const user: AuthUser = {
      id: userId,
      name: name.trim() || 'NAWAB User',
      phone: cleanPhone,
      role: userRole,
      isLoggedIn: true,
      isBlocked: false,
      loggedInAt: nowIso,
      city: chosenCity,
      mohalla: chosenArea,
      area: chosenArea,
      address: `${chosenArea}, ${chosenCity}`,
      gpsCoords,
      gpsDetectedText,
    };

    const userDoc: UserRecord = {
      id: userId,
      name: user.name,
      phone: user.phone,
      role: userRole,
      city: chosenCity,
      area: chosenArea,
      address: user.address,
      isBlocked: false,
      createdAtIso: nowIso,
      lastLoginAt: nowIso,
    };

    try {
      const existingUserSnap = await getDoc(doc(db, 'users', userId));
      if (existingUserSnap.exists()) {
        const existingData = existingUserSnap.data() as UserRecord;
        if (existingData.isBlocked) {
          setBlockedNotice('Aapka account Admin ne block kar diya hai.');
          return { ok: false, blocked: true };
        }
        await setDoc(
          doc(db, 'users', userId),
          stripUndefined({
            ...existingData,
            name: user.name,
            phone: user.phone,
            role: userRole,
            city: chosenCity,
            area: chosenArea,
            address: user.address,
            lastLoginAt: nowIso,
          })
        );
      } else {
        await setDoc(doc(db, 'users', userId), stripUndefined(userDoc));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    }

    if (userRole === 'seller') {
      const sellerId = `seller-${digits || Date.now()}`;
      try {
        const existingSellerSnap = await getDoc(doc(db, 'sellers', sellerId));
        if (existingSellerSnap.exists()) {
          const existingSeller = existingSellerSnap.data() as SellerProfile;
          if (existingSeller.isBlocked) {
            setBlockedNotice('Aapka seller account Admin ne block kar diya hai.');
            return { ok: false, blocked: true };
          }
          await setDoc(
            doc(db, 'sellers', sellerId),
            stripUndefined({
              ...existingSeller,
              name: user.name,
              shopName: existingSeller.shopName || user.name,
              phone: user.phone,
              location: `${chosenArea}, ${chosenCity}`,
              lastLoginAt: nowIso,
            })
          );
        } else {
          const newSellerProfile: SellerProfile = {
            id: sellerId,
            name: user.name,
            shopName: user.name,
            phone: user.phone,
            location: `${chosenArea}, ${chosenCity}`,
            isVerified: false,
            hasBlueTick: false,
            blueTickStatus: 'none',
            rating: 0,
            reviewsCount: 0,
            isBlocked: false,
            createdAtIso: nowIso,
            lastLoginAt: nowIso,
          };
          await setDoc(doc(db, 'sellers', sellerId), stripUndefined(newSellerProfile));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `sellers/${sellerId}`);
      }
    }

    setBlockedNotice(null);
    setAuthUser(user);
    localStorage.setItem('dba_auth_user', JSON.stringify(user));
    setCityAndArea(chosenCity, chosenArea);
    localStorage.setItem('dba_role', userRole);
    setRole(userRole);
    return { ok: true };
  };

  const logoutUser = () => {
    try {
      localStorage.removeItem('dba_auth_user');
      localStorage.removeItem('dba_role');
      localStorage.removeItem('dba_cart');
    } catch (e) {
      console.error('Failed to clear session storage', e);
    }
    setAuthUser(null);
    setRole('welcome');
    setCart([]);
    setIsBlueTickPageOpen(false);
  };

  const clearSavedSellerAndLogout = () => {
    try {
      localStorage.removeItem(SAVED_SELLER_STORAGE_KEY);
    } catch {
      // ignore
    }
    setSavedSellerProfile(null);
    logoutUser();
  };

  const restoreSavedSellerSession = async (): Promise<{ ok: boolean; blocked?: boolean }> => {
    if (!savedSellerProfile) {
      return { ok: false };
    }
    return loginUser(
      savedSellerProfile.shopName || savedSellerProfile.name,
      savedSellerProfile.phone,
      'seller',
      savedSellerProfile.city,
      savedSellerProfile.area || 'Main Bazaar'
    );
  };

  const refreshData = () => {
    try {
      window.location.reload();
    } catch (e) {
      console.error('Failed to reload window', e);
    }
  };

  const openPostProduct = () => {
    setRole('seller');
    setSellerTab('post');
  };

  const updateAuthUserProfile = (
    name: string,
    phone: string,
    address?: string,
    city?: string,
    area?: string
  ) => {
    if (!authUser) return;
    const chosenCity = city?.trim() || authUser.city || selectedCity || 'Rawalpindi';
    const chosenArea = area?.trim() || authUser.area || selectedArea || 'Satellite Town';
    const updated: AuthUser = {
      ...authUser,
      name: name.trim() || authUser.name,
      phone: phone.trim() || authUser.phone,
      address: address?.trim() || `${chosenArea}, ${chosenCity}`,
      city: chosenCity,
      area: chosenArea,
      mohalla: chosenArea,
    };
    setAuthUser(updated);
    localStorage.setItem('dba_auth_user', JSON.stringify(updated));
    setCityAndArea(chosenCity, chosenArea);

    const digits = normalizePhoneDigits(updated.phone);
    const userId = authUser.id || `user_${digits}`;
    updateDoc(
      doc(db, 'users', userId),
      stripUndefined({
        name: updated.name,
        phone: updated.phone,
        city: chosenCity,
        area: chosenArea,
        address: updated.address,
        lastLoginAt: new Date().toISOString(),
      })
    ).catch((error) => handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`));

    if (authUser.role === 'seller') {
      const sellerId = currentSeller.id;
      updateDoc(
        doc(db, 'sellers', sellerId),
        stripUndefined({
          name: updated.name,
          phone: updated.phone,
          shopName: currentSeller.shopName || updated.name,
          location: updated.address || `${chosenArea}, ${chosenCity}`,
        })
      ).catch(() => {
        // ignore if seller doc doesn't exist yet
      });
    }
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setCart([]);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Orders (Cash on Delivery / Cash on Work ONLY — Direct Seller)
  const placeOrder = (orderInfo: {
    buyerName: string;
    buyerPhone: string;
    deliveryAddress: string;
    deliveryArea: string;
  }): Order => {
    const id = `NWB-${Math.floor(100000 + Math.random() * 900000)}`;
    const subtotal = cartSubtotal;

    const newOrder: Order = {
      id,
      createdAt: 'Just now',
      buyerName: orderInfo.buyerName || 'Valued Customer',
      buyerPhone: orderInfo.buyerPhone || '0300-1234567',
      deliveryAddress: orderInfo.deliveryAddress,
      deliveryArea: orderInfo.deliveryArea,
      items: [...cart],
      subtotal,
      totalAmount: subtotal,
      paymentMode: 'Cash on Delivery / Cash on Work',
      status: 'pending',
      estimatedDelivery: 'Direct Seller Delivery / Cash on Spot',
    };

    setDoc(doc(db, 'orders', id), stripUndefined(newOrder)).catch((error) =>
      handleFirestoreError(error, OperationType.CREATE, `orders/${id}`)
    );

    setActiveOrder(newOrder);
    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    updateDoc(doc(db, 'orders', orderId), { status }).catch((error) =>
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`)
    );
    setActiveOrder((prev) => (prev && prev.id === orderId ? { ...prev, status } : prev));
  };

  // Seller Product Operations (Instant publish — Saved permanently to Firebase until Seller/Admin deletes)
  const addProduct = async (
    productData: Omit<
      Product,
      'id' | 'sellerId' | 'sellerName' | 'sellerPhone' | 'sellerVerified'
    > & { sellerPhone?: string }
  ): Promise<{ ok: boolean; error?: string; product?: Product }> => {
    const isVerified =
      currentSeller.isVerified ||
      currentSeller.hasBlueTick ||
      currentSeller.blueTickStatus === 'verified';
    const hasBlueTick =
      currentSeller.hasBlueTick || currentSeller.blueTickStatus === 'verified';
    const resolvedSellerType: SellerType =
      currentSeller.sellerType || sellerIdProofs[currentSeller.id]?.sellerType || 'shop';
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const expiresAtMs = nowMs + AD_EXPIRY_MS;
    const randSuffix = Math.random().toString(36).slice(2, 6);
    const id = `prod-${nowMs}-${randSuffix}`;

    const safeSellerId = toSafeId(currentSeller.id || 'seller-guest');
    const safeSellerName = (
      savedSellerProfile?.shopName ||
      savedSellerProfile?.name ||
      currentSeller.shopName ||
      currentSeller.name ||
      'NAWAB Seller'
    )
      .trim()
      .slice(0, 120) || 'NAWAB Seller';
    const safeSellerPhone = (
      productData.sellerPhone?.trim() ||
      savedSellerProfile?.phone ||
      currentSeller.phone ||
      ''
    ).slice(0, 32);
    const safeTitle = (productData.title || '').trim().slice(0, 160);
    const safeCategory = (productData.category || '').trim().slice(0, 100);
    const safeLocation = (productData.location || savedSellerProfile?.city || 'Rawalpindi')
      .trim()
      .slice(0, 180);
    const safeDescription = (productData.description || '').trim().slice(0, 2000);
    const safeServiceTime = productData.serviceTime
      ? productData.serviceTime.trim().slice(0, 80)
      : undefined;
    const safePrice =
      Number.isFinite(productData.price) && productData.price >= 0
        ? Math.min(Math.round(productData.price), 100000000)
        : 0;
    const safeDistance =
      Number.isFinite(productData.distanceKm) && productData.distanceKm >= 0
        ? productData.distanceKm
        : 0.8;
    const safeStock =
      Number.isFinite(productData.stock) && productData.stock >= 0
        ? productData.stock
        : 25;

    try {
      // Fit photos safely within Firestore rules AND total 1 MiB document budget
      const rawImages = productData.images?.slice(0, 5);
      const imageCount = rawImages && rawImages.length > 0 ? rawImages.length : 1;
      const perPhotoLimit =
        imageCount >= 4 ? 125000 : imageCount >= 2 ? 200000 : 420000;

      let fittedImages: string[] | undefined;
      if (rawImages && rawImages.length > 0) {
        fittedImages = await Promise.all(
          rawImages.map((img) => fitImageUnderBytes(img, perPhotoLimit, 720, 0.62))
        );
      }

      let fittedMainImage =
        fittedImages && fittedImages.length > 0
          ? fittedImages[0]
          : await fitImageUnderBytes(productData.image || '', 420000, 820, 0.7);

      let fittedSellerPhoto =
        productData.sellerPhoto || currentSeller.photo || savedSellerProfile?.workOrShopPhoto
          ? await fitImageUnderBytes(
              (productData.sellerPhoto ||
                currentSeller.photo ||
                savedSellerProfile?.workOrShopPhoto) as string,
              180000,
              480,
              0.62
            )
          : undefined;

      const buildCandidate = (): Product => ({
        ...productData,
        id,
        title: safeTitle,
        price: safePrice,
        category: safeCategory,
        location: safeLocation,
        distanceKm: safeDistance,
        stock: safeStock,
        description: safeDescription,
        serviceTime: safeServiceTime,
        image: fittedMainImage,
        images: fittedImages,
        sellerId: safeSellerId,
        sellerName: safeSellerName,
        sellerPhone: safeSellerPhone,
        sellerPhoto: fittedSellerPhoto,
        sellerVerified: isVerified,
        sellerHasBlueTick: hasBlueTick,
        sellerType: resolvedSellerType,
        rating: 0,
        reviewsCount: 0,
        permanent: true,
        createdAtIso: nowIso,
        renewedAtIso: nowIso,
        expiresAtMs,
      });

      let newProd = buildCandidate();

      // Safety check: ensure total serialized payload stays well under Firestore's 1 MiB limit
      if (JSON.stringify(stripUndefined(newProd)).length > 820000) {
        if (fittedImages && fittedImages.length > 0) {
          fittedImages = await Promise.all(
            fittedImages.map((img) => fitImageUnderBytes(img, 95000, 480, 0.45))
          );
          fittedMainImage = fittedImages[0];
        } else if (fittedMainImage) {
          fittedMainImage = await fitImageUnderBytes(fittedMainImage, 320000, 640, 0.55);
        }
        if (fittedSellerPhoto) {
          fittedSellerPhoto = await fitImageUnderBytes(fittedSellerPhoto, 80000, 320, 0.5);
        }
        newProd = buildCandidate();
      }

      const cleanDoc = stripUndefined(newProd);

      // Optimistic local state + cache update
      setRawProducts((prev) => {
        if (prev.some((p) => p.id === id)) return prev;
        return [newProd, ...prev];
      });

      await setDoc(doc(db, 'products', id), cleanDoc);

      // Ensure seller profile doc exists & tracks primary category
      setDoc(
        doc(db, 'sellers', currentSeller.id),
        stripUndefined({
          ...currentSeller,
          primaryCategory: currentSeller.primaryCategory || safeCategory,
          lastLoginAt: nowIso,
        }),
        { merge: true }
      ).catch(() => {});

      return { ok: true, product: newProd };
    } catch (error) {
      // Roll back optimistic item if Firestore write rejected
      setRawProducts((prev) => prev.filter((p) => p.id !== id));
      console.error('Failed to permanently save product:', error);
      return {
        ok: false,
        error:
          'Ad Firebase me save nahi ho saka. Internet check karein ya chhoti photo ke sath dobara try karein.',
      };
    }
  };

  const renewProduct = async (
    productId: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const targetProduct = rawProducts.find((p) => p.id === productId);
    if (!isMyAd(targetProduct)) {
      return { ok: false, error: 'Aap sirf apna hi ad renew kar sakte hain.' };
    }

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const expiresAtMs = nowMs + AD_EXPIRY_MS;

    const prevSnapshot = rawProducts;
    setRawProducts((prev) => {
      const updated = prev.map((p) =>
        p.id === productId ? { ...p, renewedAtIso: nowIso, expiresAtMs } : p
      );
      updated.sort((a, b) =>
        (b.renewedAtIso || b.createdAtIso || '').localeCompare(
          a.renewedAtIso || a.createdAtIso || ''
        )
      );
      return updated;
    });

    try {
      await updateDoc(doc(db, 'products', productId), {
        renewedAtIso: nowIso,
        expiresAtMs,
      });
      return { ok: true };
    } catch (error) {
      setRawProducts(prevSnapshot);
      console.error('Failed to renew product:', error);
      return {
        ok: false,
        error: 'Ad renew nahi ho saka. Internet check karke dobara try karein.',
      };
    }
  };

  const deleteProduct = (productId: string) => {
    const targetProduct = rawProducts.find((p) => p.id === productId);
    if (!isMyAd(targetProduct)) {
      return;
    }
    setRawProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    deleteDoc(doc(db, 'products', productId)).catch((error) =>
      handleFirestoreError(error, OperationType.DELETE, `products/${productId}`)
    );
  };

  const updateProductPrice = (productId: string, newPrice: number) => {
    const targetProduct = rawProducts.find((p) => p.id === productId);
    if (!isMyAd(targetProduct)) {
      return;
    }
    if (!Number.isFinite(newPrice) || newPrice <= 0 || newPrice > 100000000) return;
    const rounded = Math.round(newPrice);
    setRawProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, price: rounded } : p))
    );
    updateDoc(doc(db, 'products', productId), { price: rounded }).catch((error) =>
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`)
    );
  };

  // Reviews
  const addProductReview = (
    productId: string,
    rating: number,
    comment?: string,
    buyerName?: string
  ) => {
    const cleanRating = Math.max(1, Math.min(5, Math.round(rating)));
    const targetProduct = rawProducts.find((p) => p.id === productId);
    const reviewer = buyerName || authUser?.name || 'Customer';
    const id = `rev-${Date.now()}`;

    const newRev: ProductReview = {
      id,
      productId,
      sellerId: targetProduct?.sellerId,
      buyerName: reviewer,
      rating: cleanRating,
      comment: comment?.trim(),
      createdAt: 'Just now',
    };

    setDoc(doc(db, 'reviews', id), stripUndefined(newRev)).catch((error) =>
      handleFirestoreError(error, OperationType.CREATE, `reviews/${id}`)
    );

    const nextReviews = [newRev, ...reviews];
    const productRevs = nextReviews.filter((r) => r.productId === productId);
    const avgProdRating =
      productRevs.reduce((acc, r) => acc + r.rating, 0) / productRevs.length;
    const updatedRating = Number(avgProdRating.toFixed(1));
    const updatedReviewsCount = productRevs.length;

    updateDoc(doc(db, 'products', productId), {
      rating: updatedRating,
      reviewsCount: updatedReviewsCount,
    }).catch(() => {});

    setSelectedProduct((prev) =>
      prev && prev.id === productId
        ? { ...prev, rating: updatedRating, reviewsCount: updatedReviewsCount }
        : prev
    );

    if (targetProduct?.sellerId) {
      const sellerRevs = nextReviews.filter((r) => r.sellerId === targetProduct.sellerId);
      const avgSellerRating =
        sellerRevs.reduce((acc, r) => acc + r.rating, 0) / sellerRevs.length;
      updateDoc(doc(db, 'sellers', targetProduct.sellerId), {
        rating: Number(avgSellerRating.toFixed(1)),
        reviewsCount: sellerRevs.length,
      }).catch(() => {});
    }
  };

  // Fraud / Dhoka Reports
  const submitReport = (
    productId: string,
    productTitle: string,
    sellerId: string,
    sellerName: string,
    reason: string,
    details?: string
  ) => {
    const id = `REP-${Date.now()}`;
    const newReport: ProductReport = {
      id,
      productId,
      productTitle,
      sellerId,
      sellerName,
      reporterName: authUser?.name || 'Customer',
      reporterPhone: authUser?.phone || '0300-0000000',
      reason,
      details,
      createdAt: 'Just now',
      status: 'pending',
    };
    setDoc(doc(db, 'reports', id), stripUndefined(newReport)).catch((error) =>
      handleFirestoreError(error, OperationType.CREATE, `reports/${id}`)
    );
  };

  // Blue Tick Submit (Saves screenshot + TID to Firebase for Hidden Admin review)
  const submitBlueTickRequest = (tid: string, screenshot?: string, fee?: number) => {
    const id = `BT-${Date.now()}`;
    const appliedFee = typeof fee === 'number' && fee > 0 ? fee : blueTickPrice;
    const newReq: BlueTickRequest = {
      id,
      sellerId: currentSeller.id,
      sellerName: currentSeller.name,
      shopName: currentSeller.shopName || currentSeller.name,
      phone: currentSeller.phone,
      tid: tid.trim(),
      screenshot,
      fee: appliedFee,
      createdAt: 'Just now',
      createdAtIso: new Date().toISOString(),
      status: 'pending',
    };

    setDoc(doc(db, 'blue_tick_requests', id), stripUndefined(newReq)).catch((error) =>
      handleFirestoreError(error, OperationType.CREATE, `blue_tick_requests/${id}`)
    );

    setDoc(
      doc(db, 'sellers', currentSeller.id),
      stripUndefined({
        ...currentSeller,
        blueTickStatus: 'pending',
        blueTickTid: tid.trim(),
      }),
      { merge: true }
    ).catch((error) =>
      handleFirestoreError(error, OperationType.UPDATE, `sellers/${currentSeller.id}`)
    );
  };

  const isSellerVerified = (sellerId: string, sellerName?: string): boolean => {
    const target = sellers.find(
      (s) =>
        s.id === sellerId ||
        (sellerName && (s.shopName === sellerName || s.name === sellerName))
    );
    if (target && (target.hasBlueTick || target.blueTickStatus === 'verified')) {
      return true;
    }
    if (
      currentSeller.id === sellerId ||
      (sellerName &&
        (currentSeller.shopName === sellerName || currentSeller.name === sellerName))
    ) {
      if (currentSeller.hasBlueTick || currentSeller.blueTickStatus === 'verified') {
        return true;
      }
    }
    const p = rawProducts.find(
      (prod) => prod.sellerId === sellerId || (sellerName && prod.sellerName === sellerName)
    );
    if (p?.sellerHasBlueTick) return true;
    return false;
  };

  // Private ID Card Verification helpers
  const getSellerIdProof = (
    sellerId?: string,
    sellerName?: string,
    sellerPhone?: string
  ): SellerIdProof | null => {
    const targetId = sellerId || currentSeller.id;
    if (targetId && sellerIdProofs[targetId]) {
      return sellerIdProofs[targetId];
    }
    const cleanPhone = normalizePhoneDigits(sellerPhone || '');
    const foundByMatch = Object.values(sellerIdProofs).find(
      (p) =>
        (sellerName && p.sellerName === sellerName) ||
        (cleanPhone && normalizePhoneDigits(p.sellerPhone) === cleanPhone)
    );
    return foundByMatch || null;
  };

  const hasSellerUploadedId = (sellerId?: string): boolean => {
    const targetId = sellerId || currentSeller.id;
    const proof = sellerIdProofs[targetId];
    if (proof && proof.frontPhoto && proof.backPhoto) return true;
    const targetSeller = sellers.find((s) => s.id === targetId);
    if (
      targetSeller?.idVerificationStatus === 'verified' ||
      targetSeller?.idVerificationStatus === 'pending'
    ) {
      return !!(targetSeller.cnicFrontUploaded && targetSeller.cnicBackUploaded);
    }
    return false;
  };

  const isSellerIdVerified = (sellerId: string, sellerName?: string): boolean => {
    const proof = getSellerIdProof(sellerId, sellerName);
    if (proof?.status === 'verified') return true;
    const target = sellers.find(
      (s) =>
        s.id === sellerId ||
        (sellerName && (s.shopName === sellerName || s.name === sellerName))
    );
    if (target?.idVerificationStatus === 'verified') return true;
    return false;
  };

  const currentProofRecord = sellerIdProofs[currentSeller.id];
  const hasCompletedOneTimeVerification = useMemo(() => {
    if (authUser?.role !== 'seller') return true;
    if (
      savedSellerProfile &&
      savedSellerProfile.name &&
      savedSellerProfile.phone &&
      savedSellerProfile.cnicNumber &&
      savedSellerProfile.city
    ) {
      return true;
    }
    const sellerTypeOk =
      currentSeller.sellerType === 'shop' ||
      currentSeller.sellerType === 'home' ||
      currentProofRecord?.sellerType === 'shop' ||
      currentProofRecord?.sellerType === 'home';
    const status = currentProofRecord?.status || currentSeller.idVerificationStatus || 'none';
    const idUploaded =
      !!(currentProofRecord?.frontPhoto && currentProofRecord?.backPhoto) ||
      !!(currentSeller.cnicFrontUploaded && currentSeller.cnicBackUploaded);
    if (currentSeller.oneTimeVerificationDone && sellerTypeOk && (status === 'pending' || status === 'verified' || !!currentSeller.cnicNumber)) {
      return true;
    }
    return sellerTypeOk && idUploaded && (status === 'pending' || status === 'verified');
  }, [
    authUser?.role,
    savedSellerProfile,
    currentSeller.sellerType,
    currentSeller.oneTimeVerificationDone,
    currentSeller.idVerificationStatus,
    currentSeller.cnicNumber,
    currentSeller.cnicFrontUploaded,
    currentSeller.cnicBackUploaded,
    currentProofRecord?.sellerType,
    currentProofRecord?.status,
    currentProofRecord?.frontPhoto,
    currentProofRecord?.backPhoto,
  ]);

  const hasCompletedSellerSetup = useMemo(() => {
    if (
      savedSellerProfile &&
      savedSellerProfile.name.trim() &&
      savedSellerProfile.phone.trim() &&
      savedSellerProfile.cnicNumber.trim() &&
      savedSellerProfile.city.trim()
    ) {
      return true;
    }
    return hasCompletedOneTimeVerification;
  }, [savedSellerProfile, hasCompletedOneTimeVerification]);

  // Backfill localStorage savedSellerProfile if an existing seller already verified in Firestore
  useEffect(() => {
    if (authUser?.role !== 'seller') return;
    if (savedSellerProfile) return;
    if (!isSellerDataLoaded) return;
    if (matchedSeller && matchedSeller.oneTimeVerificationDone) {
      const derivedCity =
        matchedSeller.city ||
        authUser.city ||
        selectedCity ||
        'Rawalpindi';
      const derivedProfile: SavedSellerProfile = {
        name: matchedSeller.name || authUser.name || 'Seller',
        phone: matchedSeller.phone || authUser.phone || '',
        cnicNumber: matchedSeller.cnicNumber || 'Saved',
        city: derivedCity,
        area: authUser.area || matchedSeller.location || derivedCity,
        sellerType: matchedSeller.sellerType || 'shop',
        shopName: matchedSeller.shopName || matchedSeller.name,
        workOrShopPhoto: matchedSeller.photo,
        savedAtIso: new Date().toISOString(),
      };
      setSavedSellerProfile(derivedProfile);
      try {
        localStorage.setItem(SAVED_SELLER_STORAGE_KEY, JSON.stringify(derivedProfile));
      } catch {
        // ignore storage quota errors
      }
    }
  }, [authUser?.role, authUser?.name, authUser?.phone, authUser?.city, authUser?.area, savedSellerProfile, isSellerDataLoaded, matchedSeller, selectedCity]);

  const getProductSellerType = (product: Product): SellerType => {
    if (product.sellerType === 'shop' || product.sellerType === 'home') {
      return product.sellerType;
    }
    const matched = sellers.find((s) => s.id === product.sellerId);
    if (matched?.sellerType === 'shop' || matched?.sellerType === 'home') {
      return matched.sellerType;
    }
    const proof = sellerIdProofs[product.sellerId];
    if (proof?.sellerType === 'shop' || proof?.sellerType === 'home') {
      return proof.sellerType;
    }
    return 'shop';
  };

  const saveOneTimeSellerDetails = async (params: {
    sellerType: SellerType;
    name: string;
    shopName?: string;
    phone: string;
    cnicNumber: string;
    city: string;
    area?: string;
    workOrShopPhoto?: string;
    idFrontPhoto?: string;
    idBackPhoto?: string;
  }): Promise<void> => {
    const cleanName = params.name.trim() || currentSeller.name || authUser?.name || 'Seller';
    const cleanShopName = (params.shopName || params.name).trim() || cleanName;
    const cleanPhone = params.phone.trim() || currentSeller.phone || authUser?.phone || '';
    const cleanCnic = params.cnicNumber.trim().slice(0, 32);
    const cleanCity = params.city.trim() || selectedCity || 'Rawalpindi';
    const cleanArea = params.area?.trim() || '';
    const cleanLocation = cleanArea && cleanArea.toLowerCase() !== cleanCity.toLowerCase()
      ? `${cleanArea}, ${cleanCity}`
      : cleanCity;
    const nowIso = new Date().toISOString();

    const phoneDigits = normalizePhoneDigits(cleanPhone);
    const sellerId = phoneDigits ? `seller-${phoneDigits}` : currentSeller.id;

    // 1. Persist immediately in browser localStorage
    const nextSaved: SavedSellerProfile = {
      name: cleanName,
      phone: cleanPhone,
      cnicNumber: cleanCnic,
      city: cleanCity,
      area: cleanArea || cleanCity,
      sellerType: params.sellerType,
      shopName: cleanShopName,
      workOrShopPhoto: params.workOrShopPhoto || currentSeller.photo,
      savedAtIso: nowIso,
    };

    setSavedSellerProfile(nextSaved);
    try {
      localStorage.setItem(SAVED_SELLER_STORAGE_KEY, JSON.stringify(nextSaved));
    } catch {
      // ignore if photo exceeds localStorage quota; store lightweight copy without photo
      try {
        localStorage.setItem(
          SAVED_SELLER_STORAGE_KEY,
          JSON.stringify({ ...nextSaved, workOrShopPhoto: undefined })
        );
      } catch {
        // ignore
      }
    }

    const hasIdPhotos = !!(params.idFrontPhoto && params.idBackPhoto);
    const existingStatus =
      currentProofRecord?.status === 'verified' || currentSeller.idVerificationStatus === 'verified'
        ? 'verified'
        : hasIdPhotos
        ? 'pending'
        : currentSeller.idVerificationStatus || 'pending';

    const updatedSeller: SellerProfile = {
      ...currentSeller,
      id: sellerId,
      name: cleanName,
      shopName: params.sellerType === 'shop' ? cleanShopName : cleanName,
      phone: cleanPhone,
      photo: params.workOrShopPhoto || currentSeller.photo,
      location: cleanLocation,
      city: cleanCity,
      cnicNumber: cleanCnic,
      sellerType: params.sellerType,
      oneTimeVerificationDone: true,
      cnicFrontUploaded: hasIdPhotos ? true : currentSeller.cnicFrontUploaded,
      cnicBackUploaded: hasIdPhotos ? true : currentSeller.cnicBackUploaded,
      idVerificationStatus: existingStatus,
      lastLoginAt: nowIso,
      createdAtIso: currentSeller.createdAtIso || nowIso,
    };

    try {
      await setDoc(doc(db, 'sellers', sellerId), stripUndefined(updatedSeller), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `sellers/${sellerId}`);
    }

    if (hasIdPhotos && params.idFrontPhoto && params.idBackPhoto) {
      const newProof: SellerIdProof = {
        sellerId,
        sellerName: cleanName,
        shopName: params.sellerType === 'shop' ? cleanShopName : cleanName,
        sellerPhone: cleanPhone,
        sellerPhoto: params.workOrShopPhoto || currentSeller.photo,
        sellerType: params.sellerType,
        location: cleanLocation,
        frontPhoto: params.idFrontPhoto,
        backPhoto: params.idBackPhoto,
        status: existingStatus === 'verified' ? 'verified' : 'pending',
        submittedAt: new Date().toLocaleDateString('en-PK', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        submittedAtIso: nowIso,
      };
      try {
        await setDoc(doc(db, 'id_proofs', sellerId), stripUndefined(newProof), { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `id_proofs/${sellerId}`);
      }
    }

    setCityAndArea(cleanCity, cleanArea || cleanCity);

    if (authUser) {
      const nextAuth: AuthUser = {
        ...authUser,
        name: cleanName,
        phone: cleanPhone,
        city: cleanCity,
        area: cleanArea || cleanCity,
        mohalla: cleanArea || cleanCity,
        address: cleanLocation,
      };
      setAuthUser(nextAuth);
      localStorage.setItem('dba_auth_user', JSON.stringify(nextAuth));
      if (authUser.id) {
        updateDoc(
          doc(db, 'users', authUser.id),
          stripUndefined({
            name: cleanName,
            phone: cleanPhone,
            city: cleanCity,
            area: cleanArea || cleanCity,
            address: cleanLocation,
            lastLoginAt: nowIso,
          })
        ).catch(() => {});
      }
    }

    const safeSellerPhoto = params.workOrShopPhoto
      ? await fitImageUnderBytes(params.workOrShopPhoto, 200000, 600, 0.62)
      : '';
    const clampedDisplayName = (params.sellerType === 'shop' ? cleanShopName : cleanName).slice(0, 120);
    const clampedLocation = cleanLocation.slice(0, 180);

    const sellerProducts = rawProducts.filter((p) => p.sellerId === sellerId);
    if (sellerProducts.length > 0) {
      const batch = writeBatch(db);
      sellerProducts.forEach((p) => {
        batch.update(
          doc(db, 'products', p.id),
          stripUndefined({
            sellerType: params.sellerType,
            sellerName: clampedDisplayName,
            sellerPhone: cleanPhone.slice(0, 32),
            sellerPhoto: safeSellerPhoto || p.sellerPhoto,
            location: p.location || clampedLocation,
            permanent: true,
          })
        );
      });
      batch.commit().catch(() => {});
    }
  };

  const completeOneTimeSellerVerification = async (params: {
    sellerType: SellerType;
    displayName: string;
    workOrShopPhoto: string;
    location: string;
    idFrontPhoto: string;
    idBackPhoto: string;
  }): Promise<void> => {
    const cleanDisplayName = params.displayName.trim() || currentSeller.name || 'My Shop';
    const cleanLocation =
      params.location.trim() ||
      currentSeller.location ||
      `${selectedArea || 'Satellite Town'}, ${selectedCity || 'Rawalpindi'}`;
    const cityGuess = cleanLocation.includes(',')
      ? cleanLocation.split(',').slice(-1)[0].trim()
      : selectedCity || 'Rawalpindi';

    await saveOneTimeSellerDetails({
      sellerType: params.sellerType,
      name: params.sellerType === 'home' ? cleanDisplayName : currentSeller.name || authUser?.name || cleanDisplayName,
      shopName: cleanDisplayName,
      phone: currentSeller.phone || authUser?.phone || '',
      cnicNumber: currentSeller.cnicNumber || 'Verified',
      city: cityGuess,
      area: cleanLocation,
      workOrShopPhoto: params.workOrShopPhoto,
      idFrontPhoto: params.idFrontPhoto,
      idBackPhoto: params.idBackPhoto,
    });
  };

  const submitSellerIdPhotos = (frontPhoto: string, backPhoto: string, sellerId?: string) => {
    const target = (sellerId ? sellers.find((s) => s.id === sellerId) : null) || currentSeller;
    if (!target || !frontPhoto || !backPhoto) return;

    const nowIso = new Date().toISOString();
    const newProof: SellerIdProof = {
      sellerId: target.id,
      sellerName: target.shopName || target.name,
      shopName: target.shopName || target.name,
      sellerPhone: target.phone,
      sellerType: target.sellerType,
      sellerPhoto: target.photo,
      location: target.location,
      frontPhoto,
      backPhoto,
      status: 'pending',
      submittedAt: new Date().toLocaleDateString('en-PK', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      submittedAtIso: nowIso,
    };

    setDoc(doc(db, 'id_proofs', target.id), stripUndefined(newProof)).catch((error) =>
      handleFirestoreError(error, OperationType.WRITE, `id_proofs/${target.id}`)
    );

    setDoc(
      doc(db, 'sellers', target.id),
      stripUndefined({
        ...target,
        cnicFrontUploaded: true,
        cnicBackUploaded: true,
        idVerificationStatus: 'pending',
        oneTimeVerificationDone: true,
      }),
      { merge: true }
    ).catch((error) =>
      handleFirestoreError(error, OperationType.UPDATE, `sellers/${target.id}`)
    );
  };

  const updateSellerPhone = (phone: string) => {
    const cleanPhone = phone.trim() || currentSeller.phone;

    setDoc(
      doc(db, 'sellers', currentSeller.id),
      stripUndefined({ ...currentSeller, phone: cleanPhone }),
      { merge: true }
    ).catch((error) =>
      handleFirestoreError(error, OperationType.UPDATE, `sellers/${currentSeller.id}`)
    );

    if (authUser) {
      const updatedUser: AuthUser = { ...authUser, phone: cleanPhone };
      setAuthUser(updatedUser);
      localStorage.setItem('dba_auth_user', JSON.stringify(updatedUser));
      if (authUser.id) {
        updateDoc(doc(db, 'users', authUser.id), { phone: cleanPhone }).catch(() => {});
      }
    }

    rawProducts
      .filter((p) => p.sellerId === currentSeller.id)
      .forEach((p) => {
        updateDoc(doc(db, 'products', p.id), { sellerPhone: cleanPhone }).catch(() => {});
      });
  };

  // Online Presence Heartbeat (saved in Firestore)
  useEffect(() => {
    if (!authUser?.isLoggedIn) return;

    const sendHeartbeat = () => {
      const now = Date.now();
      const digits = normalizePhoneDigits(authUser.phone || '');
      const keys: string[] = [];
      if (digits) keys.push(digits);
      if (authUser.role === 'seller' && currentSeller?.id) {
        keys.push(currentSeller.id);
      }
      if (authUser.name) {
        keys.push(`name:${authUser.name.trim().toLowerCase()}`);
      }

      keys.forEach((key) => {
        const docId = toSafeId(key);
        setDoc(doc(db, 'presence', docId), { key, lastSeenMs: now }).catch(() => {});
      });
    };

    sendHeartbeat();
    const timer = window.setInterval(sendHeartbeat, 10000);
    return () => window.clearInterval(timer);
  }, [authUser?.isLoggedIn, authUser?.phone, authUser?.role, authUser?.name, currentSeller?.id]);

  const isUserOnline = (idOrPhone?: string, fallbackName?: string): boolean => {
    const now = Date.now();
    const isFresh = (ts?: number) => typeof ts === 'number' && now - ts < 25000;
    if (idOrPhone) {
      if (isFresh(onlinePresence[idOrPhone])) return true;
      const digits = normalizePhoneDigits(idOrPhone);
      if (digits && isFresh(onlinePresence[digits])) return true;
    }
    if (fallbackName) {
      if (isFresh(onlinePresence[`name:${fallbackName.trim().toLowerCase()}`])) return true;
    }
    return false;
  };

  // =========================================================================
  // NAWAB SECURE CHAT & HOME BOOKINGS (100% SAVED IN FIREBASE FIRESTORE)
  // =========================================================================
  const openChatWithSeller = (params: {
    sellerId: string;
    sellerName: string;
    sellerPhone: string;
    productId?: string;
    productTitle?: string;
    category?: string;
  }): ChatThread => {
    const buyerName = authUser?.name || 'Customer';
    const buyerPhone = authUser?.phone || '0300-0000000';
    const buyerDigits = normalizePhoneDigits(buyerPhone);
    const sellerDigits = normalizePhoneDigits(params.sellerPhone);

    const existing = chatThreads.find(
      (t) =>
        (t.sellerId === params.sellerId ||
          (sellerDigits && normalizePhoneDigits(t.sellerPhone) === sellerDigits)) &&
        normalizePhoneDigits(t.buyerPhone) === buyerDigits
    );

    if (existing) {
      const updatedHeader = {
        id: existing.id,
        buyerName: existing.buyerName,
        buyerPhone: existing.buyerPhone,
        sellerId: existing.sellerId,
        sellerName: existing.sellerName,
        sellerPhone: existing.sellerPhone,
        productId: params.productId || existing.productId,
        productTitle: params.productTitle || existing.productTitle,
        category: params.category || existing.category,
        updatedAt: existing.updatedAt,
        updatedAtMs: Date.now(),
        unreadForBuyer: 0,
        unreadForSeller: existing.unreadForSeller || 0,
      };
      setDoc(doc(db, 'chats', existing.id), stripUndefined(updatedHeader), { merge: true }).catch(
        (error) => handleFirestoreError(error, OperationType.UPDATE, `chats/${existing.id}`)
      );
      setActiveChatThreadId(existing.id);
      setIsChatModalOpen(true);
      return { ...existing, ...updatedHeader };
    }

    const threadId = `chat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowTime = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
    const nowMs = Date.now();

    const newHeader: Omit<ChatThread, 'messages'> = {
      id: threadId,
      buyerName,
      buyerPhone,
      sellerId: params.sellerId,
      sellerName: params.sellerName,
      sellerPhone: params.sellerPhone,
      productId: params.productId,
      productTitle: params.productTitle,
      category: params.category,
      updatedAt: nowTime,
      updatedAtMs: nowMs,
      unreadForBuyer: 0,
      unreadForSeller: 0,
    };

    setDoc(doc(db, 'chats', threadId), stripUndefined(newHeader)).catch((error) =>
      handleFirestoreError(error, OperationType.CREATE, `chats/${threadId}`)
    );

    setActiveChatThreadId(threadId);
    setIsChatModalOpen(true);
    return { ...newHeader, messages: [] };
  };

  const orderViaChat = (params: {
    product: Product;
    quantity?: number;
    note?: string;
  }): ChatThread => {
    const { product, quantity = 1, note } = params;
    const buyerName = authUser?.name || 'Customer';
    const buyerPhone = authUser?.phone || '0300-0000000';
    const buyerDigits = normalizePhoneDigits(buyerPhone);
    const sellerDigits = normalizePhoneDigits(product.sellerPhone);
    const nowMs = Date.now();
    const nowTime = new Date().toLocaleTimeString('en-PK', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const totalRs = product.price * quantity;
    const orderText = `🛍️ Order via Chat: ${quantity}x ${product.title} — Rs ${totalRs.toLocaleString()} (Cash on Delivery · Payment Direct Seller ko Dein - Cash / JazzCash / Easypaisa)${
      note?.trim() ? ` | Note: ${note.trim()}` : ''
    }`;

    const msgId = `msg-${nowMs}-${Math.floor(Math.random() * 1000)}`;
    const orderMsg: ChatMessage = {
      id: msgId,
      senderRole: 'buyer',
      senderName: buyerName,
      text: orderText,
      time: nowTime,
      createdAtMs: nowMs,
      type: 'order',
      delivered: true,
      seen: false,
      orderInfo: {
        productId: product.id,
        productTitle: product.title,
        productImage: product.image,
        price: product.price,
        quantity,
        category: product.category,
      },
    };

    const existing = chatThreads.find(
      (t) =>
        (t.sellerId === product.sellerId ||
          (sellerDigits && normalizePhoneDigits(t.sellerPhone) === sellerDigits)) &&
        normalizePhoneDigits(t.buyerPhone) === buyerDigits
    );

    const threadId = existing?.id || `chat-${nowMs}-${Math.floor(Math.random() * 1000)}`;
    const headerDoc: Omit<ChatThread, 'messages'> = {
      id: threadId,
      buyerName: existing?.buyerName || buyerName,
      buyerPhone: existing?.buyerPhone || buyerPhone,
      sellerId: existing?.sellerId || product.sellerId,
      sellerName: existing?.sellerName || product.sellerName,
      sellerPhone: existing?.sellerPhone || product.sellerPhone,
      productId: product.id,
      productTitle: product.title,
      category: product.category,
      updatedAt: nowTime,
      updatedAtMs: nowMs,
      unreadForBuyer: 0,
      unreadForSeller: (existing?.unreadForSeller || 0) + 1,
    };

    setDoc(doc(db, 'chats', threadId), stripUndefined(headerDoc), { merge: true })
      .then(() => setDoc(doc(db, 'chats', threadId, 'messages', msgId), stripUndefined(orderMsg)))
      .catch((error) => handleFirestoreError(error, OperationType.WRITE, `chats/${threadId}`));

    setActiveChatThreadId(threadId);
    setIsChatModalOpen(true);
    return {
      ...headerDoc,
      messages: [...(existing?.messages || []), orderMsg],
    };
  };

  const sendChatMessage = (
    threadId: string,
    text: string,
    senderRole: 'buyer' | 'seller',
    type: ChatMessage['type'] = 'text',
    extra?: {
      bookingInfo?: ChatMessage['bookingInfo'];
      imageUrl?: string;
      audioUrl?: string;
      audioDurationSec?: number;
      locationInfo?: ChatMessage['locationInfo'];
      orderInfo?: ChatMessage['orderInfo'];
    }
  ) => {
    const hasMedia = !!(
      extra?.bookingInfo ||
      extra?.imageUrl ||
      extra?.audioUrl ||
      extra?.locationInfo ||
      extra?.orderInfo
    );
    if (!text.trim() && !hasMedia) return;

    const thread = chatThreads.find((t) => t.id === threadId);
    if (!thread) return;

    const nowMs = Date.now();
    const nowTime = new Date().toLocaleTimeString('en-PK', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const msgId = `msg-${nowMs}-${Math.floor(Math.random() * 1000)}`;
    const senderName = senderRole === 'buyer' ? thread.buyerName : thread.sellerName;
    const msg: ChatMessage = {
      id: msgId,
      senderRole,
      senderName,
      text: text.trim(),
      time: nowTime,
      createdAtMs: nowMs,
      type,
      delivered: true,
      seen: false,
      bookingInfo: extra?.bookingInfo,
      imageUrl: extra?.imageUrl,
      audioUrl: extra?.audioUrl,
      audioDurationSec: extra?.audioDurationSec,
      locationInfo: extra?.locationInfo,
      orderInfo: extra?.orderInfo,
    };

    setDoc(doc(db, 'chats', threadId, 'messages', msgId), stripUndefined(msg)).catch((error) =>
      handleFirestoreError(error, OperationType.CREATE, `chats/${threadId}/messages/${msgId}`)
    );

    updateDoc(doc(db, 'chats', threadId), {
      updatedAt: nowTime,
      updatedAtMs: nowMs,
      unreadForBuyer: senderRole === 'seller' ? (thread.unreadForBuyer || 0) + 1 : 0,
      unreadForSeller: senderRole === 'buyer' ? (thread.unreadForSeller || 0) + 1 : 0,
    }).catch((error) => handleFirestoreError(error, OperationType.UPDATE, `chats/${threadId}`));
  };

  const markThreadRead = (threadId: string, readerRole: 'buyer' | 'seller') => {
    const thread = chatThreads.find((t) => t.id === threadId);
    if (!thread) return;

    const unseenMsgs = thread.messages.filter(
      (m) => m.senderRole !== readerRole && !m.seen
    );
    const hasUnreadCount =
      readerRole === 'buyer'
        ? (thread.unreadForBuyer || 0) > 0
        : (thread.unreadForSeller || 0) > 0;

    if (unseenMsgs.length === 0 && !hasUnreadCount) return;

    const batch = writeBatch(db);
    unseenMsgs.forEach((m) => {
      batch.update(doc(db, 'chats', threadId, 'messages', m.id), {
        delivered: true,
        seen: true,
      });
    });

    batch.update(
      doc(db, 'chats', threadId),
      readerRole === 'buyer' ? { unreadForBuyer: 0 } : { unreadForSeller: 0 }
    );

    batch.commit().catch(() => {});
  };

  const bookHomeService = (params: {
    product: Product;
    address: string;
    preferredTime: string;
    notes?: string;
    packageName?: string;
    priceOverride?: number;
  }): { booking: HomeBooking; thread: ChatThread } => {
    const { product, address, preferredTime, notes, packageName, priceOverride } = params;
    const buyerName = authUser?.name || 'Customer';
    const buyerPhone = authUser?.phone || '0300-0000000';
    const buyerDigits = normalizePhoneDigits(buyerPhone);
    const sellerDigits = normalizePhoneDigits(product.sellerPhone);
    const finalPrice = priceOverride ?? product.price;
    const nowMs = Date.now();
    const nowTime = new Date().toLocaleTimeString('en-PK', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const bookingId = `BK-${Math.floor(10000 + Math.random() * 90000)}`;
    const newBooking: HomeBooking = {
      id: bookingId,
      productId: product.id,
      productTitle: product.title,
      category: product.category,
      price: finalPrice,
      packageName,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      sellerPhone: product.sellerPhone,
      buyerName,
      buyerPhone,
      buyerAddress: address.trim(),
      preferredTime: preferredTime.trim() || 'As soon as possible',
      notes: notes?.trim(),
      status: 'pending',
      createdAt: 'Just now',
    };

    setDoc(doc(db, 'home_bookings', bookingId), stripUndefined(newBooking)).catch((error) =>
      handleFirestoreError(error, OperationType.CREATE, `home_bookings/${bookingId}`)
    );

    const bookingMessageText = `🏠 Home Service Booked: ${product.title}${
      packageName ? ` (${packageName})` : ''
    } — Rs ${finalPrice} | Address: ${address.trim()} | Time: ${preferredTime.trim() || 'ASAP'}`;

    const msgId = `msg-${nowMs}-${Math.floor(Math.random() * 1000)}`;
    const bookingMsg: ChatMessage = {
      id: msgId,
      senderRole: 'buyer',
      senderName: buyerName,
      text: bookingMessageText,
      time: nowTime,
      createdAtMs: nowMs,
      type: 'booking',
      delivered: true,
      seen: false,
      bookingInfo: {
        bookingId: newBooking.id,
        productTitle: product.title,
        price: finalPrice,
        category: product.category,
        address: address.trim(),
        preferredTime: preferredTime.trim() || 'As soon as possible',
        notes: notes?.trim(),
        packageName,
      },
    };

    const existing = chatThreads.find(
      (t) =>
        (t.sellerId === product.sellerId ||
          (sellerDigits && normalizePhoneDigits(t.sellerPhone) === sellerDigits)) &&
        normalizePhoneDigits(t.buyerPhone) === buyerDigits
    );

    const threadId = existing?.id || `chat-${nowMs}-${Math.floor(Math.random() * 1000)}`;
    const headerDoc: Omit<ChatThread, 'messages'> = {
      id: threadId,
      buyerName: existing?.buyerName || buyerName,
      buyerPhone: existing?.buyerPhone || buyerPhone,
      sellerId: existing?.sellerId || product.sellerId,
      sellerName: existing?.sellerName || product.sellerName,
      sellerPhone: existing?.sellerPhone || product.sellerPhone,
      productId: product.id,
      productTitle: product.title,
      category: product.category,
      updatedAt: nowTime,
      updatedAtMs: nowMs,
      unreadForBuyer: 0,
      unreadForSeller: (existing?.unreadForSeller || 0) + 1,
    };

    setDoc(doc(db, 'chats', threadId), stripUndefined(headerDoc), { merge: true })
      .then(() => setDoc(doc(db, 'chats', threadId, 'messages', msgId), stripUndefined(bookingMsg)))
      .catch((error) => handleFirestoreError(error, OperationType.WRITE, `chats/${threadId}`));

    setActiveChatThreadId(threadId);
    return {
      booking: newBooking,
      thread: {
        ...headerDoc,
        messages: [...(existing?.messages || []), bookingMsg],
      },
    };
  };

  const updateBookingStatus = (bookingId: string, status: HomeBooking['status']) => {
    updateDoc(doc(db, 'home_bookings', bookingId), { status }).catch((error) =>
      handleFirestoreError(error, OperationType.UPDATE, `home_bookings/${bookingId}`)
    );
  };

  // NAWAB In-App Voice Call Controls (Synced via Firestore)
  const startInAppCall = (params: {
    calleeId: string;
    calleeName: string;
    calleePhone: string;
    calleePhoto?: string;
    calleeRole: 'buyer' | 'seller';
    productTitle?: string;
  }): VoiceCallSession => {
    const callerRole: 'buyer' | 'seller' = params.calleeRole === 'seller' ? 'buyer' : 'seller';
    const calleeOnline =
      isUserOnline(params.calleeId, params.calleeName) ||
      isUserOnline(params.calleePhone, params.calleeName);

    const id = `call-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const session: VoiceCallSession = {
      id,
      callerRole,
      callerName:
        callerRole === 'seller'
          ? currentSeller.shopName || currentSeller.name || authUser?.name || 'Seller'
          : authUser?.name || 'Customer',
      callerPhone:
        authUser?.phone || (callerRole === 'seller' ? currentSeller.phone : '0300-0000000'),
      calleeRole: params.calleeRole,
      calleeId: params.calleeId,
      calleeName: params.calleeName || 'Seller',
      calleePhone: params.calleePhone || '0300-0000000',
      calleePhoto: params.calleePhoto,
      productTitle: params.productTitle,
      status: 'ringing',
      isCalleeOffline: !calleeOnline,
      startedAtMs: Date.now(),
    };

    setActiveVoiceCall(session);
    setDoc(doc(db, 'voice_calls', id), stripUndefined(session)).catch(() => {});
    return session;
  };

  const acceptInAppCall = () => {
    if (!activeVoiceCall) return;
    const updated: VoiceCallSession = {
      ...activeVoiceCall,
      status: 'connected',
      isCalleeOffline: false,
      connectedAtMs: Date.now(),
    };
    setActiveVoiceCall(updated);
    setDoc(doc(db, 'voice_calls', updated.id), stripUndefined(updated)).catch(() => {});
  };

  const rejectInAppCall = () => {
    if (!activeVoiceCall) return;
    const updated: VoiceCallSession = { ...activeVoiceCall, status: 'rejected' };
    setActiveVoiceCall(updated);
    setDoc(doc(db, 'voice_calls', updated.id), stripUndefined(updated)).catch(() => {});
  };

  const markInAppCallMissed = () => {
    if (!activeVoiceCall || activeVoiceCall.status !== 'ringing') return;
    const updated: VoiceCallSession = { ...activeVoiceCall, status: 'missed' };
    setActiveVoiceCall(updated);
    setDoc(doc(db, 'voice_calls', updated.id), stripUndefined(updated)).catch(() => {});
  };

  const endInAppCall = () => {
    if (!activeVoiceCall) return;
    const updated: VoiceCallSession = { ...activeVoiceCall, status: 'ended' };
    setActiveVoiceCall(updated);
    setDoc(doc(db, 'voice_calls', updated.id), stripUndefined(updated)).catch(() => {});
  };

  const dismissVoiceCall = () => {
    if (activeVoiceCall) {
      deleteDoc(doc(db, 'voice_calls', activeVoiceCall.id)).catch(() => {});
    }
    setActiveVoiceCall(null);
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        buyerTab,
        setBuyerTab,
        selectedArea,
        setSelectedArea,
        selectedCity,
        setSelectedCity,
        setCityAndArea,
        userMohalla,
        setUserMohalla,
        reports,
        submitReport,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        products,
        allProducts,
        sellers,
        buyers,
        orders,
        cart,
        isPublicConfigLoaded,
        isAdminLoginOpen,
        setIsAdminLoginOpen,
        isAdminUnlocked,
        setIsAdminUnlocked,
        selectedProduct,
        setSelectedProduct,
        activeOrder,
        setActiveOrder,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartSubtotal,
        cartCount,
        placeOrder,
        updateOrderStatus,
        currentSeller,
        addProduct,
        renewProduct,
        deleteProduct,
        updateProductPrice,
        isMyAd,
        authUser,
        blockedNotice,
        clearBlockedNotice,
        checkPhoneBlocked,
        loginUser,
        logoutUser,
        updateAuthUserProfile,
        savedSellerProfile,
        hasCompletedSellerSetup,
        saveOneTimeSellerDetails,
        clearSavedSellerAndLogout,
        restoreSavedSellerSession,
        isLoginModalOpen,
        setIsLoginModalOpen,
        refreshData,
        sellerTab,
        setSellerTab,
        openPostProduct,
        blueTickPrice,
        isBlueTickAfterSixMonths,
        adminJazzCashNumber,
        adminJazzCashTitle,
        isBlueTickPageOpen,
        setIsBlueTickPageOpen,
        submitBlueTickRequest,
        blueTickRequests,
        isSellerVerified,
        isSellerDataLoaded,
        hasCompletedOneTimeVerification,
        completeOneTimeSellerVerification,
        getProductSellerType,
        sellerIdProofs,
        getSellerIdProof,
        hasSellerUploadedId,
        isSellerIdVerified,
        submitSellerIdPhotos,
        updateSellerPhone,
        reviews,
        addProductReview,
        chatThreads,
        homeBookings,
        activeChatThreadId,
        setActiveChatThreadId,
        isChatModalOpen,
        setIsChatModalOpen,
        openChatWithSeller,
        orderViaChat,
        sendChatMessage,
        bookHomeService,
        updateBookingStatus,
        markThreadRead,
        isUserOnline,
        activeVoiceCall,
        startInAppCall,
        acceptInAppCall,
        rejectInAppCall,
        markInAppCallMissed,
        endInAppCall,
        dismissVoiceCall,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
