import { firebaseConfig, firebaseConfigured } from "./config";
import { OWNER, OWNER_EMAIL } from "../store";
import type { AppData, Member } from "../types";

const FIREBASE_CDN_VERSION = "12.9.0";
const FIREBASE_CDN = `https://www.gstatic.com/firebasejs/${FIREBASE_CDN_VERSION}`;

export interface FirebaseUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export interface FirebaseRegistrationProfile {
  fullName: string;
  avatarUrl: string;
  cityId: string;
  state: string;
}

type FirebaseRuntime = {
  auth: unknown;
  db: unknown;
  authSdk: Record<string, (...args: unknown[]) => unknown>;
  firestoreSdk: Record<string, (...args: unknown[]) => unknown>;
};

type CollectionKey = keyof AppData;

const COLLECTIONS: { key: CollectionKey; path: string; id: "id" | "uid" }[] = [
  { key: "members", path: "members", id: "uid" },
  { key: "events", path: "events", id: "id" },
  { key: "attendances", path: "attendances", id: "id" },
  { key: "feedPosts", path: "feedPosts", id: "id" },
  { key: "predictions", path: "predictions", id: "id" },
  { key: "guestBook", path: "guestBook", id: "id" },
  { key: "raffles", path: "raffles", id: "id" },
  { key: "auditLogs", path: "auditLogs", id: "id" },
  { key: "travels", path: "travels", id: "id" },
];

let runtimePromise: Promise<FirebaseRuntime> | null = null;

async function importFirebaseModule(moduleName: string) {
  const moduleUrl = `${FIREBASE_CDN}/firebase-${moduleName}.js`;
  return import(/* @vite-ignore */ moduleUrl) as Promise<Record<string, (...args: unknown[]) => unknown>>;
}

async function runtime(): Promise<FirebaseRuntime> {
  if (!firebaseConfigured) throw new Error("Faltan variables públicas de Firebase.");
  if (runtimePromise) return runtimePromise;

  runtimePromise = Promise.all([
    importFirebaseModule("app"),
    importFirebaseModule("auth"),
    importFirebaseModule("firestore"),
  ]).then(([appSdk, authSdk, firestoreSdk]) => {
    const apps = appSdk.getApps() as unknown[];
    const app = apps.length ? appSdk.getApp() : appSdk.initializeApp(firebaseConfig);
    return {
      auth: authSdk.getAuth(app),
      db: firestoreSdk.getFirestore(app),
      authSdk,
      firestoreSdk,
    };
  });

  return runtimePromise;
}

function normalizeUser(user: Record<string, unknown>): FirebaseUserProfile {
  return {
    uid: String(user.uid ?? ""),
    email: String(user.email ?? "").toLowerCase(),
    displayName: String(user.displayName ?? "Miembro Colts Fans México"),
    photoURL: String(user.photoURL ?? ""),
  };
}

export async function signInWithGoogle() {
  const { auth, authSdk } = await runtime();
  const provider = new (authSdk.GoogleAuthProvider as unknown as new () => unknown)();
  const credential = (await authSdk.signInWithPopup(auth, provider)) as { user: Record<string, unknown> };
  return normalizeUser(credential.user);
}

export async function signInWithEmail(email: string, password: string) {
  const { auth, authSdk } = await runtime();
  const credential = (await authSdk.signInWithEmailAndPassword(auth, email, password)) as {
    user: Record<string, unknown>;
  };
  return normalizeUser(credential.user);
}

export async function registerWithEmail(
  email: string,
  password: string,
  profile: FirebaseRegistrationProfile,
) {
  const { auth, authSdk } = await runtime();
  const credential = (await authSdk.createUserWithEmailAndPassword(auth, email, password)) as {
    user: Record<string, unknown>;
  };
  await authSdk.updateProfile(credential.user, {
    displayName: profile.fullName,
    photoURL: profile.avatarUrl || null,
  });
  const user = {
    ...normalizeUser(credential.user),
    displayName: profile.fullName,
    photoURL: profile.avatarUrl,
  };
  await ensureFirebaseMember(user, profile);
  return user;
}

export async function signOutFirebase() {
  const { auth, authSdk } = await runtime();
  await authSdk.signOut(auth);
}

export async function watchFirebaseAuth(
  onChange: (user: FirebaseUserProfile | null) => void,
  onError: (error: Error) => void,
) {
  const { auth, authSdk } = await runtime();
  return authSdk.onAuthStateChanged(
    auth,
    (user: unknown) => onChange(user ? normalizeUser(user as Record<string, unknown>) : null),
    (error: unknown) => onError(error instanceof Error ? error : new Error("Error de autenticación.")),
  ) as () => void;
}

export async function ensureFirebaseMember(
  user: FirebaseUserProfile,
  profile?: FirebaseRegistrationProfile,
): Promise<Member> {
  const { db, firestoreSdk } = await runtime();
  const memberRef = firestoreSdk.doc(db, "members", user.uid);
  const snapshot = (await firestoreSdk.getDoc(memberRef)) as {
    exists: () => boolean;
    data: () => Member;
  };
  if (snapshot.exists()) return snapshot.data();

  const allMembers = (await firestoreSdk.getDocs(firestoreSdk.collection(db, "members"))) as { size: number };
  const isOwner = user.email === OWNER_EMAIL;
  const member: Member = isOwner
    ? { ...OWNER, uid: user.uid, avatarUrl: user.photoURL || OWNER.avatarUrl }
    : {
        uid: user.uid,
        email: user.email,
        fullName: profile?.fullName || user.displayName,
        avatarUrl: profile?.avatarUrl || user.photoURL,
        memberNumber: 1001 + allMembers.size,
        favoritePlayer: "Por elegir",
        cityId: profile?.cityId || "cdmx",
        state: profile?.state || "México",
        fanSinceYear: new Date().getFullYear(),
        status: "active",
        role: "member",
        createdAt: new Date().toISOString(),
        seasonsCount: 1,
        attendancesCount: 0,
        horseshoes: 0,
        achievements: ["Primer paso en la familia"],
        firstRememberedGame: "Por compartir",
      };

  await firestoreSdk.setDoc(memberRef, member);
  return member;
}

export async function subscribeToFirebaseData(
  onData: (data: AppData) => void,
  onError: (error: Error) => void,
) {
  const { db, firestoreSdk } = await runtime();
  const values = {} as AppData;
  const initialized = new Set<CollectionKey>();

  const publish = () => {
    if (initialized.size === COLLECTIONS.length) onData({ ...values });
  };

  const unsubscribers = COLLECTIONS.map(({ key, path }) =>
    firestoreSdk.onSnapshot(
      firestoreSdk.collection(db, path),
      (snapshot: unknown) => {
        const docs = (snapshot as { docs: { data: () => unknown }[] }).docs.map((item) => item.data());
        (values as unknown as Record<string, unknown[]>)[key] = docs;
        initialized.add(key);
        publish();
      },
      (error: unknown) => onError(error instanceof Error ? error : new Error("Error de sincronización.")),
    ) as () => void,
  );

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

export async function persistFirebaseDiff(previous: AppData, next: AppData) {
  const { db, firestoreSdk } = await runtime();
  const operations: Promise<unknown>[] = [];

  for (const { key, path, id } of COLLECTIONS) {
    const before = new Map(
      (previous[key] as unknown as Record<string, unknown>[]).map((item) => [String(item[id]), item]),
    );
    const after = new Map(
      (next[key] as unknown as Record<string, unknown>[]).map((item) => [String(item[id]), item]),
    );

    for (const [documentId, value] of after) {
      if (JSON.stringify(before.get(documentId)) !== JSON.stringify(value)) {
        operations.push(
          firestoreSdk.setDoc(firestoreSdk.doc(db, path, documentId), value) as Promise<unknown>,
        );
      }
    }
    for (const documentId of before.keys()) {
      if (!after.has(documentId)) {
        operations.push(
          firestoreSdk.deleteDoc(firestoreSdk.doc(db, path, documentId)) as Promise<unknown>,
        );
      }
    }
  }

  await Promise.all(operations);
}
