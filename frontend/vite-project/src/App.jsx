import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Chat from './components/Chat';
import Login from './components/Login';
import Signup from './components/Signup';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      fetch('http://142.93.195.191:3000/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setIsAuthenticated(true);
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <main>
                <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
                  <Chat onLogout={handleLogout} user={user} />
                </div>
              </main>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin"
          element={
            isAuthenticated ? (
              user?.role === 'admin' ? (
                <main>
                  <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50">
                    <AdminDashboard />
                  </div>
                </main>
              ) : (
                // If logged in but not admin, go home
                <Navigate to="/" replace={true} />
              )
            ) : (
              // If not logged in, go to login
              <Navigate to="/login" replace={true} />
            )
          }
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <Login onLoginSuccess={(user) => { setUser(user); setIsAuthenticated(true); }} onLoginFailure={() => { setUser(null); setIsAuthenticated(false); }} />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/" /> : <Signup setIsAuthenticated={setIsAuthenticated} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
