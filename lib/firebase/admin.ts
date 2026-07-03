import "server-only";
import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

/**
 * SDK Admin de Firebase — solo debe importarse desde código de servidor
 * (API routes / Server Actions / Cloud Functions). Nunca desde un
 * componente cliente: usa las credenciales de servicio, con acceso total
 * saltándose Security Rules (Prompt 11: "la IA nunca accede directamente
 * a tablas, siempre vía servicios del backend").
 */
function getFirebaseAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const firebaseAdminApp = getFirebaseAdminApp();
export const adminAuth = getAuth(firebaseAdminApp);
export const adminDb = getFirestore(firebaseAdminApp);
export const adminStorage = getStorage(firebaseAdminApp);
