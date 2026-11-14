import { db } from "./firebase-config.js";
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(len = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join("");
}

export async function getTenant(tenantId) {
  const snap = await getDoc(doc(db, "tenants", tenantId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createTenant(uid, name) {
  const code = randomCode();
  await setDoc(doc(db, "tenants", code), {
    name,
    ownerUid: uid,
    tier: "free",
    createdAt: serverTimestamp()
  });
  await setDoc(doc(db, "tenants", code, "members", uid), {
    role: "owner",
    joinedAt: serverTimestamp()
  });
  await updateDoc(doc(db, "users", uid), { tenantId: code });
  return code;
}

export async function joinTenant(uid, rawCode) {
  const code = rawCode.trim().toUpperCase();
  const tenant = await getTenant(code);
  if (!tenant) throw new Error("Kode tenant tidak ditemukan.");

  await setDoc(doc(db, "tenants", code, "members", uid), {
    role: "member",
    joinedAt: serverTimestamp()
  });
  await updateDoc(doc(db, "users", uid), { tenantId: code });
  return code;
}