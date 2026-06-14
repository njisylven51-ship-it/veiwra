/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateStream from './pages/CreateStream';
import StreamRoom from './pages/StreamRoom';

// Custom lightweight clientJWT decoder
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);

    // Verify token expiration
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return null; // Token expired
    }
    return decoded;
  } catch (e) {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Authenticate user on mount if existing token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = parseJwt(token);
      if (decoded && decoded.userId) {
        setUser({ id: decoded.userId, username: decoded.username });
        console.log('Session restored successfully for user:', decoded.username);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setAuthChecked(true);
  }, []);

  const handleLoginSuccess = (loggedInUser: { id: string; username: string }, token: string) => {
    localStorage.setItem('token', token);
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">Bootstrapping Viewra...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans antialiased text-slate-100">
        
        {/* Navigation bar Header */}
        <Navbar user={user} onLogout={handleLogout} />

        {/* Content routing stage */}
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/" replace /> : <Register onLoginSuccess={handleLoginSuccess} />}
          />
          <Route path="/create" element={<CreateStream user={user} />} />
          <Route path="/streams/:id" element={<StreamRoom user={user} />} />
          
          {/* Fallback catcher */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      </div>
    </BrowserRouter>
  );
}
