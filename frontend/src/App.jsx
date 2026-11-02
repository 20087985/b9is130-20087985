import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Home from './components/Home';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };


  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

 
  return <Home onLogout={handleLogout} />;
}