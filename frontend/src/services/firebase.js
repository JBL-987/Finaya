import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Remove measurementId as it's optional and only needed for Analytics
// measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,

// Validate Firebase configuration before initialization
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('Firebase configuration is missing required fields:', firebaseConfig);
  throw new Error('Firebase configuration is incomplete. Please check your environment variables.');
}

// Initialize Firebase
let app;
let auth;
let googleProvider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  
  // Configure Google provider
  googleProvider.setCustomParameters({
    prompt: 'select_account'  // Always show account selection
  });
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
  console.log('Firebase config used:', firebaseConfig);
  throw error;
}

// Firebase Auth Functions
export const firebaseAuth = {
  // Sign in with email and password
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      return { user: userCredential.user, idToken };
    } catch (error) {
      console.error('Firebase sign in error:', error);
      throw error;
    }
  },

  // Sign up with email and password
  signUp: async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      return { user: userCredential.user, idToken };
    } catch (error) {
      console.error('Firebase sign up error:', error);
      throw error;
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      // Try popup first
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      return { user: result.user, idToken };
    } catch (error) {
      console.error('Google sign in error:', error);
      
      // If popup fails due to CORS, blocking, or extension conflict (Keplr)
      if (error.code === 'auth/popup-blocked' || 
          error.code === 'auth/popup-closed-by-user' ||
          error.code === 'auth/cancelled-popup-request' ||
          error.message?.includes('postMessage') ||
          error.message?.includes('Extension')) {
            
        console.log('Popup failed (likely extension conflict), switching to redirect method...');
        await signInWithRedirect(auth, googleProvider);
        // Return non-resolving promise as page will redirect
        return new Promise(() => {});
      }
      
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Firebase sign out error:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // Get ID token
  getIdToken: async () => {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  },

  // Auth state observer
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  }
};

export { auth };
export default app;
