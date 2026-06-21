import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  getDoc,
  getDocFromServer,
  serverTimestamp
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { PromptDraft } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyAO2iZB-WLyQDUPGm_eanBXCrncupD-GvQ",
  authDomain: "://firebaseapp.com",
  projectId: "shubhprompt-new",
  storageBucket: "shubhprompt-new.firebasestorage.app",
  messagingSenderId: "1098185002879",
  appId: "1:1098185002879:web:fbd7d5544aec9f60aa944a"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Strict ABAC / Zero-Trust Firestore Error Handlers
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error("Firestore Core Exception Triggered: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Warm up / Validate Connection
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test_connection", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.warn("Client offline mode detected. Standby configurations loaded.");
    }
  }
}

// Initialize connection test instantly
testConnection();

// --- FIRESTORE FUNCTIONS FOR PROMPT DRAFTS ---

const PATH = "prompt_drafts";

/**
 * Fetch all drafts from the Cloud Firestore database (Admin/Internal use)
 */
export async function fetchAllDrafts(): Promise<PromptDraft[]> {
  try {
    const q = query(collection(db, PATH), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const drafts: PromptDraft[] = [];
    querySnapshot.forEach((doc) => {
      drafts.push({
        id: doc.id,
        ...(doc.data() as Omit<PromptDraft, "id">)
      });
    });
    return drafts;
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, PATH);
  }
}

/**
 * Fetch only status="published" drafts for rendering on the public platform
 */
export async function fetchPublishedDrafts(): Promise<PromptDraft[]> {
  try {
    const q = query(
      collection(db, PATH), 
      where("is_published", "==", true),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const drafts: PromptDraft[] = [];
    querySnapshot.forEach((doc) => {
      drafts.push({
        id: doc.id,
        ...(doc.data() as Omit<PromptDraft, "id">)
      });
    });
    return drafts;
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, PATH);
  }
}

/**
 * Retrieve a single Draft doc by ID
 */
export async function fetchDraftById(draftId: string): Promise<PromptDraft | null> {
  try {
    const docRef = doc(db, PATH, draftId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return {
      id: snapshot.id,
      ...(snapshot.data() as Omit<PromptDraft, "id">)
    };
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, `${PATH}/${draftId}`);
  }
}

/**
 * Record a new AI Draft inside the Cloud Firestore collection
 */
export async function createDraft(draft: Omit<PromptDraft, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const nowISO = new Date().toISOString();
    const payload: Omit<PromptDraft, "id"> = {
      ...draft,
      createdAt: nowISO,
      updatedAt: nowISO
    };
    const docRef = await addDoc(collection(db, PATH), payload);
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, PATH);
  }
}

/**
 * Update an existing prompt draft's attributes or status (draft | published | rejected)
 */
export async function updateDraft(draftId: string, updates: Partial<Omit<PromptDraft, "id" | "createdAt">>): Promise<void> {
  try {
    const docRef = doc(db, PATH, draftId);
    const payload: Record<string, any> = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    if (updates.status === "published" && !updates.publishedAt) {
      payload.publishedAt = serverTimestamp();
    }
    await updateDoc(docRef, payload);
  } catch (error) {
    return handleFirestoreError(error, OperationType.UPDATE, `${PATH}/${draftId}`);
  }
}

/**
 * Delete a draft permanently
 */
export async function deleteDraft(draftId: string): Promise<void> {
  try {
    const docRef = doc(db, PATH, draftId);
    await deleteDoc(docRef);
  } catch (error) {
    return handleFirestoreError(error, OperationType.DELETE, `${PATH}/${draftId}`);
  }
}
