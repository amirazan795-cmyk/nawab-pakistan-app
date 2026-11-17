import React, { useEffect, useRef, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { RoleSwitcherBar } from './components/RoleSwitcherBar';
import { WelcomePage } from './components/WelcomePage';
import { BuyerHome } from './components/BuyerHome';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CheckoutPage } from './components/CheckoutPage';
import { OrderConfirmation } from './components/OrderConfirmation';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { SellerDashboard } from './components/SellerDashboard';
import { HiddenAdminPortal } from './components/HiddenAdminPortal';
import { isSecretAdminRoute } from './utils/adminCrypto';
import {
  OrdersListModal,
  ProfileModal,
  NotificationsModal,
} from './components/BuyerModals';
import { LoginScreen } from './components/LoginScreen';
import { LiveChatModal } from './components/LiveChatModal';
import { VoiceCallModal } from './components/VoiceCallModal';
import { BlueTickPage } from './components/BlueTickPage';
import { WarningPoliciesPage } from './components/WarningPoliciesPage';

const MainAppContent: React.FC = () => {
  const {
    activeOrder,
    setActiveOrder,
    authUser,
    isChatModalOpen,
    setIsChatModalOpen,
    isAdminLoginOpen,
    setIsAdminLoginOpen,
    isAdminUnlocked,
    setIsAdminUnlocked,
    isBlueTickPageOpen,
    setIsBlueTickPageOpen,
  } = useApp();

  // First-page navigation before login: Welcome (2 buttons: BUY, SELL) -> Login
  const [entryView, setEntryView] = useState<'welcome' | 'login'>('welcome');
  const [loginTargetRole, setLoginTargetRole] = useState<'buyer' | 'seller'>('buyer');
  const wasLoggedInRef = useRef<boolean>(!!(authUser && authUser.isLoggedIn));
  const lastLoginRoleRef = useRef<'buyer' | 'seller'>(
    authUser?.role === 'seller' ? 'seller' : 'buyer'
  );

  useEffect(() => {
    const isNowLoggedIn = !!(authUser && authUser.isLoggedIn);
    if (isNowLoggedIn) {
      if (authUser.role === 'seller' || authUser.role === 'buyer') {
        lastLoginRoleRef.current = authUser.role;
      }
      wasLoggedInRef.current = true;
    } else if (wasLoggedInRef.current && !isNowLoggedIn) {
      // User explicitly clicked Logout or was blocked -> show Login screen
      wasLoggedInRef.current = false;
      setLoginTargetRole(lastLoginRoleRef.current);
      setEntryView('login');
    }
  }, [authUser]);

  // Buyer navigation states
  const [buyerStep, setBuyerStep] = useState<'home' | 'checkout' | 'confirmed' | 'policies'>('home');
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    setIsAdminLoginOpen(isSecretAdminRoute());
  };

  const isOnAdminUrl = isSecretAdminRoute();

  // When /admin is in the URL, NEVER render Home Page or Seller Profile and NEVER strip /admin from the URL.
  if (isAdminUnlocked && (isOnAdminUrl || isAdminLoginOpen)) {
    return (
      <HiddenAdminPortal
        isUnlocked={true}
        onUnlocked={() => {
          setIsAdminUnlocked(true);
          setIsAdminLoginOpen(true);
        }}
        onClose={handleLockAdmin}
      />
    );
  }

  if (isOnAdminUrl || isAdminLoginOpen) {
    return (
      <HiddenAdminPortal
        isUnlocked={false}
        onUnlocked={() => {
          setIsAdminUnlocked(true);
          setIsAdminLoginOpen(true);
        }}
        onClose={handleLockAdmin}
      />
    );
  }

  // Normal App: BUY and SELL only. If not logged in, start on WelcomePage -> LoginScreen.
  if (!authUser || !authUser.isLoggedIn) {
    if (entryView === 'login') {
      return (
        <LoginScreen
          initialRole={loginTargetRole}
          onBack={() => setEntryView('welcome')}
          onSuccess={() => setEntryView('welcome')}
        />
      );
    }

    return (
      <WelcomePage
        onSelectRole={(selected) => {
          setLoginTargetRole(selected);
          setEntryView('login');
        }}
      />
    );
  }

  const activePerspective: 'buyer' | 'seller' =
    authUser.role === 'seller' ? 'seller' : 'buyer';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      {/* Top Universal Bar (BUY / SELL only, no Admin controls anywhere) */}
      <RoleSwitcherBar />

      {/* Screen Views depending on user role (BUY or SELL) or Seller Blue Tick page */}
      <div className="flex-1 w-full">
        {isBlueTickPageOpen && activePerspective === 'seller' ? (
          <div className="pb-16">
            <BlueTickPage onBack={() => setIsBlueTickPageOpen(false)} />
          </div>
        ) : activePerspective === 'seller' ? (
          <SellerDashboard />
        ) : (
          <>
            {buyerStep === 'checkout' && (
              <CheckoutPage
                onBack={() => setBuyerStep('home')}
                onOrderSuccess={() => setBuyerStep('confirmed')}
              />
            )}

            {buyerStep === 'confirmed' && (
              <OrderConfirmation
                order={activeOrder}
                onContinueShopping={() => setBuyerStep('home')}
                onTrackOrder={() => setShowTrackingModal(true)}
              />
            )}

            {buyerStep === 'policies' && (
              <WarningPoliciesPage onBack={() => setBuyerStep('home')} />
            )}

            {buyerStep === 'home' && (
              <BuyerHome
                onOpenOrders={() => setShowOrdersModal(true)}
                onOpenProfile={() => setShowProfileModal(true)}
                onOpenMessages={() => setIsChatModalOpen(true)}
                onOpenNotifications={() => setShowNotificationsModal(true)}
                onOpenPolicies={() => setBuyerStep('policies')}
              />
            )}
          </>
        )}
      </div>

      {/* Modals & Overlays */}
      <ProductDetailModal />

      {showTrackingModal && activeOrder && (
        <OrderTrackingModal
          order={activeOrder}
          onClose={() => setShowTrackingModal(false)}
        />
      )}

      <OrdersListModal
        isOpen={showOrdersModal}
        onClose={() => setShowOrdersModal(false)}
        onSelectOrder={(ord) => {
          setActiveOrder(ord);
          setShowTrackingModal(true);
        }}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onOpenOrders={() => setShowOrdersModal(true)}
      />

      <LiveChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        perspective={activePerspective}
      />

      <VoiceCallModal />

      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
