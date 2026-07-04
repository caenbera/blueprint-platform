import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

/**
 * Verifica si el usuario es Super Admin de plataforma (platformAdmins/{uid},
 * ver firestore.rules y scripts/grant-super-admin.cjs). Si el usuario NO es
 * Super Admin, la lectura es denegada por las Security Rules - eso tambien
 * significa "no es Super Admin", no es un error real.
 */
export async function checkIsSuperAdmin(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, "platformAdmins", uid));
    return snap.exists();
  } catch {
    return false;
  }
}
