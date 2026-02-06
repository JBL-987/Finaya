import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Navbar_Component from "./components/Navbar";
import Footer_Component from "./components/Footer";
import App from "./pages/App";
import Home from "./pages/Home";
import { authAPI } from "./services/api";
import { firebaseAuth } from "./services/firebase";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import Dashboard from "./pages/Dashboard";
import "../index.css";

function Main() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Set dark mode on component mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Listen to Firebase Auth state changes (Primary auth source)
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      console.log('Firebase auth state changed:', firebaseUser?.email);
      
      if (firebaseUser) {
        // User is signed in with Firebase
        try {
          // Get fresh ID token
          const idToken = await firebaseUser.getIdToken();
          
          // Store in localStorage for backup (though interceptor will use fresh token)
          localStorage.setItem('access_token', idToken);
          
          // Fetch user data from backend
          const userData = await authAPI.getCurrentUser();
          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
            console.log('User authenticated via Firebase:', userData.email);
          }
        } catch (error) {
          console.error('Error syncing Firebase user with backend:', error);
          // If backend sync fails, still mark as authenticated if Firebase user exists
          setIsAuthenticated(true);
          setUser({
            email: firebaseUser.email,
            full_name: firebaseUser.displayName || firebaseUser.email.split('@')[0]
          });
        }
      } else {
        // User is signed out from Firebase
        console.log('User signed out from Firebase');
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('access_token');
      }
      
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials) => {
    try {
      console.log('Attempting login for:', credentials.email);
      
      let data;
      if (credentials.firebaseToken) {
        console.log('Using Firebase token for backend auth');
        data = await authAPI.firebaseLogin(credentials.email, credentials.firebaseToken);
      } else {
        data = await authAPI.login(credentials.email, credentials.password);
      }
      
      console.log('Login successful, token received');
      
      setIsAuthenticated(true);

      // Get user data
      const userData = await authAPI.getCurrentUser();
      console.log('User data after login:', userData);
      
      if (userData) {
        setUser(userData);
      }

      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: error.response?.data?.detail || error.message || "Login failed" };
    }
  };

  const register = async (userData) => {
    try {
      await authAPI.register(userData.email, userData.password, userData.fullName);
      return { success: true };
    } catch (error) {
      console.error("Registration failed:", error);
      return { success: false, error: error.message || "Registration failed" };
    }
  };

  const logout = async () => {
    await authAPI.logout();
    await firebaseAuth.signOut(); // Sign out from Firebase
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = "/";
  };

  const ProtectedRoute = ({ children }) => {
    if (isInitializing) {
      return (
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      );
    }

    if (!isAuthenticated) {
      return <Navigate to="/" replace />;
    }

    return children;
  };

  return (
    <Router>
      <Navbar_Component
        isAuthenticated={isAuthenticated}
        logout={logout}
        user={user}
      />
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/app" /> : <Home login={login} register={register} />
          }
        />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <App
                isAuthenticated={isAuthenticated}
                login={login}
                logout={logout}
                user={user}
              />
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer_Component/>
    </Router>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CurrencyProvider>
      <Main />
    </CurrencyProvider>
  </React.StrictMode>
);
