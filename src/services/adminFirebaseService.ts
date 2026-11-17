import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  AdminCredentialsConfig,
  AdminPublicConfig,
  BlueTickRequest,
  Product,
  SellerIdProof,
  SellerProfile,
  UserRecord,
} from '../types';
import {
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_PHONE,
  DEFAULT_ADMIN_SECRET_PATH,
  LEGACY_DEFAULT_ADMIN_PINS,
  normalizePhoneDigits,
  sha256Hex,
} from '../utils/adminCrypto';
import { stripUndefined } from '../utils/imageCompress';

export const DEFAULT_PUBLIC_CONFIG: AdminPublicConfig = {
  secretPath: DEFAULT_ADMIN_SECRET_PATH,
  blueTickOfferStartIso: '2026-11-14T00:00:00.000Z',
  adminJazzCashNumber: '03181563300',
  adminJazzCashTitle: 'AMIR MAQSOOD',
};

export async function ensureAdminConfigBootstrapped(): Promise<AdminPublicConfig> {
  const publicRef = doc(db, 'admin_config', 'public');
  const credsRef = doc(db, 'admin_config', 'credentials');

  let publicData = DEFAULT_PUBLIC_CONFIG;

  try {
    const publicSnap = await getDoc(publicRef);
    if (publicSnap.exists()) {
      publicData = publicSnap.data() as AdminPublicConfig;
    } else {
      await setDoc(publicRef, {
        ...DEFAULT_PUBLIC_CONFIG,
        updatedAtIso: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'admin_config/public');
  }

  try {
    const credsSnap = await getDoc(credsRef);
    const defaultPasswordHash = await sha256Hex(DEFAULT_ADMIN_PASSWORD);
    if (!credsSnap.exists()) {
      const initialCreds: AdminCredentialsConfig = {
        adminPhone: DEFAULT_ADMIN_PHONE,
        pinHash: defaultPasswordHash,
        updatedAtIso: new Date().toISOString(),
      };
      await setDoc(credsRef, initialCreds);
    } else {
      const existingCreds = credsSnap.data() as AdminCredentialsConfig;
      const legacyHashes = await Promise.all(
        LEGACY_DEFAULT_ADMIN_PINS.map((pin) => sha256Hex(pin))
      );
      if (legacyHashes.includes(existingCreds.pinHash)) {
        await setDoc(credsRef, {
          adminPhone: existingCreds.adminPhone || DEFAULT_ADMIN_PHONE,
          pinHash: defaultPasswordHash,
          authProofHash: existingCreds.pinHash,
          updatedAtIso: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'admin_config/credentials');
  }

  return publicData;
}

export async function verifyAdminPassword(
  enteredPassword: string
): Promise<{ ok: boolean; error?: string; adminPhone?: string }> {
  const cleanPassword = enteredPassword.trim();
  if (!cleanPassword) {
    return {
      ok: false,
      error: 'Password darj karein.',
    };
  }

  try {
    await ensureAdminConfigBootstrapped();
  } catch {
    // Allow checking existing doc or fallback below if bootstrap write was blocked/offline
  }

  try {
    const credsRef = doc(db, 'admin_config', 'credentials');
    const credsSnap = await getDoc(credsRef);
    if (!credsSnap.exists()) {
      if (cleanPassword === DEFAULT_ADMIN_PASSWORD) {
        return { ok: true, adminPhone: DEFAULT_ADMIN_PHONE };
      }
      return { ok: false, error: 'Wrong Password' };
    }

    const creds = credsSnap.data() as AdminCredentialsConfig;
    const enteredHash = await sha256Hex(cleanPassword);

    if (enteredHash === creds.pinHash) {
      return { ok: true, adminPhone: creds.adminPhone || DEFAULT_ADMIN_PHONE };
    }

    // Migrate any still-remaining legacy default hash automatically if user enters the new default password
    if (cleanPassword === DEFAULT_ADMIN_PASSWORD) {
      const legacyHashes = await Promise.all(
        LEGACY_DEFAULT_ADMIN_PINS.map((pin) => sha256Hex(pin))
      );
      if (legacyHashes.includes(creds.pinHash)) {
        const defaultHash = await sha256Hex(DEFAULT_ADMIN_PASSWORD);
        await setDoc(credsRef, {
          adminPhone: creds.adminPhone || DEFAULT_ADMIN_PHONE,
          pinHash: defaultHash,
          authProofHash: creds.pinHash,
          updatedAtIso: new Date().toISOString(),
        }).catch(() => {});
        return { ok: true, adminPhone: creds.adminPhone || DEFAULT_ADMIN_PHONE };
      }
    }

    return {
      ok: false,
      error: 'Wrong Password',
    };
  } catch (error) {
    if (cleanPassword === DEFAULT_ADMIN_PASSWORD) {
      return { ok: true, adminPhone: DEFAULT_ADMIN_PHONE };
    }
    handleFirestoreError(error, OperationType.GET, 'admin_config/credentials');
  }
}

export async function updateAdminPassword(
  currentPassword: string,
  newPassword: string,
  newAdminPhone?: string
): Promise<{ ok: boolean; error?: string }> {
  const cleanCurrent = currentPassword.trim();
  const cleanNew = newPassword.trim();

  if (!cleanCurrent) {
    return { ok: false, error: 'Current password darj karein.' };
  }
  if (cleanNew.length < 4) {
    return { ok: false, error: 'Naya password kam az kam 4 characters ka hona chahiye.' };
  }

  try {
    const credsRef = doc(db, 'admin_config', 'credentials');
    const credsSnap = await getDoc(credsRef);
    if (!credsSnap.exists()) {
      return { ok: false, error: 'Admin credentials missing.' };
    }
    const creds = credsSnap.data() as AdminCredentialsConfig;
    const currentHash = await sha256Hex(cleanCurrent);
    if (currentHash !== creds.pinHash) {
      return { ok: false, error: 'Current password ghalat hai.' };
    }

    const nextHash = await sha256Hex(cleanNew);
    const nextPhone = newAdminPhone?.trim() || creds.adminPhone || DEFAULT_ADMIN_PHONE;

    await setDoc(credsRef, {
      adminPhone: nextPhone,
      pinHash: nextHash,
      authProofHash: currentHash,
      updatedAtIso: new Date().toISOString(),
    });

    return { ok: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'admin_config/credentials');
  }
}

export interface AdminSnapshotHandlers {
  onUsers: (users: UserRecord[]) => void;
  onSellers: (sellers: SellerProfile[]) => void;
  onProducts: (products: Product[]) => void;
  onBlueTickRequests: (reqs: BlueTickRequest[]) => void;
  onIdProofs: (proofs: Record<string, SellerIdProof>) => void;
  onPublicConfig: (cfg: AdminPublicConfig) => void;
}

export function subscribeAdminCollections(handlers: AdminSnapshotHandlers): () => void {
  const unsubs: (() => void)[] = [];

  unsubs.push(
    onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as UserRecord);
        list.sort((a, b) => (b.lastLoginAt || '').localeCompare(a.lastLoginAt || ''));
        handlers.onUsers(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, 'sellers'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as SellerProfile);
        list.sort((a, b) => (b.lastLoginAt || '').localeCompare(a.lastLoginAt || ''));
        handlers.onSellers(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'sellers')
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, 'products'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Product);
        list.sort((a, b) => (b.createdAtIso || '').localeCompare(a.createdAtIso || ''));
        handlers.onProducts(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'products')
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, 'blue_tick_requests'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as BlueTickRequest);
        list.sort((a, b) => (b.createdAtIso || '').localeCompare(a.createdAtIso || ''));
        handlers.onBlueTickRequests(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'blue_tick_requests')
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
        handlers.onIdProofs(map);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'id_proofs')
    )
  );

  unsubs.push(
    onSnapshot(
      doc(db, 'admin_config', 'public'),
      (snap) => {
        if (snap.exists()) {
          handlers.onPublicConfig(snap.data() as AdminPublicConfig);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'admin_config/public')
    )
  );

  return () => {
    unsubs.forEach((fn) => fn());
  };
}

export async function adminApproveBlueTick(req: BlueTickRequest): Promise<void> {
  try {
    const batch = writeBatch(db);
    const reqRef = doc(db, 'blue_tick_requests', req.id);
    batch.update(reqRef, {
      status: 'approved',
      approvedAt: new Date().toLocaleDateString('en-PK', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    });

    const cleanPhone = normalizePhoneDigits(req.phone);
    const sellersSnap = await getDocs(collection(db, 'sellers'));
    const matchedSellerIds = new Set<string>([req.sellerId]);

    sellersSnap.docs.forEach((d) => {
      const s = d.data() as SellerProfile;
      if (
        s.id === req.sellerId ||
        (cleanPhone && normalizePhoneDigits(s.phone) === cleanPhone) ||
        s.shopName === (req.shopName || req.sellerName)
      ) {
        matchedSellerIds.add(s.id);
        batch.update(d.ref, {
          hasBlueTick: true,
          blueTickStatus: 'verified',
          isVerified: true,
        });
      }
    });

    const prodsSnap = await getDocs(collection(db, 'products'));
    prodsSnap.docs.forEach((d) => {
      const p = d.data() as Product;
      if (
        matchedSellerIds.has(p.sellerId) ||
        (cleanPhone && normalizePhoneDigits(p.sellerPhone) === cleanPhone)
      ) {
        batch.update(d.ref, {
          sellerHasBlueTick: true,
          sellerVerified: true,
        });
      }
    });

    const proofRef = doc(db, 'id_proofs', req.sellerId);
    const proofSnap = await getDoc(proofRef);
    if (proofSnap.exists()) {
      batch.update(proofRef, {
        status: 'verified',
        reviewedAt: new Date().toLocaleDateString('en-PK', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      });
      matchedSellerIds.forEach((sId) => {
        const sDocRef = doc(db, 'sellers', sId);
        // If exists in sellersSnap, already handled above or update idVerificationStatus
        if (sellersSnap.docs.some((sd) => sd.id === sId)) {
          batch.update(sDocRef, { idVerificationStatus: 'verified' });
        }
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `blue_tick_requests/${req.id}`);
  }
}

export async function adminRejectBlueTick(req: BlueTickRequest): Promise<void> {
  try {
    await updateDoc(doc(db, 'blue_tick_requests', req.id), { status: 'rejected' });
    const sellerRef = doc(db, 'sellers', req.sellerId);
    const sellerSnap = await getDoc(sellerRef);
    if (sellerSnap.exists()) {
      await updateDoc(sellerRef, {
        hasBlueTick: false,
        blueTickStatus: 'none',
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `blue_tick_requests/${req.id}`);
  }
}

export async function adminApproveIdProof(sellerId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    const proofRef = doc(db, 'id_proofs', sellerId);
    const proofSnap = await getDoc(proofRef);
    if (proofSnap.exists()) {
      batch.update(proofRef, {
        status: 'verified',
        reviewedAt: new Date().toLocaleDateString('en-PK', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      });
    }

    const sellerRef = doc(db, 'sellers', sellerId);
    const sellerSnap = await getDoc(sellerRef);
    if (sellerSnap.exists()) {
      batch.update(sellerRef, {
        isVerified: true,
        idVerificationStatus: 'verified',
        cnicFrontUploaded: true,
        cnicBackUploaded: true,
      });
    }

    const prodsSnap = await getDocs(query(collection(db, 'products'), where('sellerId', '==', sellerId)));
    prodsSnap.docs.forEach((d) => {
      batch.update(d.ref, { sellerVerified: true });
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `id_proofs/${sellerId}`);
  }
}

export async function adminRejectIdProof(sellerId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'id_proofs', sellerId));
    const sellerRef = doc(db, 'sellers', sellerId);
    const sellerSnap = await getDoc(sellerRef);
    if (sellerSnap.exists()) {
      await updateDoc(sellerRef, {
        idVerificationStatus: 'none',
        cnicFrontUploaded: false,
        cnicBackUploaded: false,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `id_proofs/${sellerId}`);
  }
}

export async function adminSetUserBlocked(
  phone: string,
  block: boolean,
  targetId?: string
): Promise<void> {
  try {
    const cleanTargetPhone = normalizePhoneDigits(phone);
    const batch = writeBatch(db);

    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.docs.forEach((d) => {
      const u = d.data() as UserRecord;
      if (
        (targetId && u.id === targetId) ||
        (cleanTargetPhone && normalizePhoneDigits(u.phone) === cleanTargetPhone)
      ) {
        batch.update(d.ref, { isBlocked: block });
      }
    });

    const sellersSnap = await getDocs(collection(db, 'sellers'));
    sellersSnap.docs.forEach((d) => {
      const s = d.data() as SellerProfile;
      if (
        (targetId && s.id === targetId) ||
        (cleanTargetPhone && normalizePhoneDigits(s.phone) === cleanTargetPhone)
      ) {
        batch.update(d.ref, { isBlocked: block });
      }
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${targetId || phone}`);
  }
}

export async function adminDeleteListing(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
  }
}
