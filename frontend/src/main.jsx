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
import ProcessingLog from "./components/accountant/ProcessingLog";
import App from "./pages/App";
import Home from "./pages/Home";
import UserDashboard from "./pages/UserDashboard";
import FinancialManagement from "./pages/FinancialManagement";
import { authAPI } from "./services/api";
import "../index.css";

function Main() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Global Processing Log state
  const [globalLogs, setGlobalLogs] = useState([]);
  const [showGlobalLog, setShowGlobalLog] = useState(false);
  const [minimizeGlobalLog, setMinimizeGlobalLog] = useState(false);

  // Set dark mode on component mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        console.log('Checking auth with token:', token ? 'exists' : 'none');

        if (token) {
          // Verify token with backend using authAPI
          const userData = await authAPI.getCurrentUser();
          console.log('User data from API:', userData);

          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
            console.log('User authenticated successfully');
          } else {
            console.log('No user data, removing token');
            localStorage.removeItem('access_token');
          }
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        localStorage.removeItem('access_token');
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      console.log('Attempting login for:', credentials.email);
      const data = await authAPI.login(credentials.email, credentials.password);
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
      return { success: false, error: error.message || "Login failed" };
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
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = "/";
  };

  // Global Log functions
  const addGlobalLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setGlobalLogs((prev) => [...prev, { message, type, timestamp }]);

    // Show the log window if it's not already visible
    if (!showGlobalLog) {
      setShowGlobalLog(true);
    }
  };

  const clearGlobalLogs = () => {
    setGlobalLogs([]);
  };

  const closeGlobalLog = () => {
    setShowGlobalLog(false);
    clearGlobalLogs();
  };

  const toggleMinimizeGlobalLog = () => {
    setMinimizeGlobalLog((prev) => !prev);
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
          element={isAuthenticated ? <Navigate to="/app" /> : <Home login={login} register={register} addGlobalLog={addGlobalLog} />}
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
                addGlobalLog={addGlobalLog}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard addGlobalLog={addGlobalLog} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/financial-management"
          element={
            <ProtectedRoute>
              <FinancialManagement addGlobalLog={addGlobalLog} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer_Component/>
      {/* Global Processing Log */}
      <ProcessingLog
        logs={globalLogs}
        visible={showGlobalLog}
        onClose={closeGlobalLog}
        onMinimize={toggleMinimizeGlobalLog}
        minimized={minimizeGlobalLog}
      />
    </Router>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
