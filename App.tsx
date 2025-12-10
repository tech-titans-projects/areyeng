
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import TrackingPage from './components/TrackingPage';
import SchedulePage from './components/SchedulePage';
import ReviewsPage from './components/ReviewsPage';
import AdminPage from './components/AdminPage';
import NotificationsPage from './components/NotificationsPage';
import ProfilePage from './components/ProfilePage';
import ChatWidget from './components/ChatWidget';
import { User } from './types';
import { dbService } from './services/dbService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const sessionUser = localStorage.getItem('areyeng_session');
    if (sessionUser) {
      setUser(JSON.parse(sessionUser));
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    setUser(user);
    localStorage.setItem('areyeng_session', JSON.stringify(user));
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('areyeng_session', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('areyeng_session');
  };

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-teal-600">Loading Areyeng System...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <RegisterPage onLogin={handleLogin} /> : <Navigate to="/" />} />
        
        <Route path="/" element={user ? <Layout user={user} onLogout={handleLogout}><TrackingPage user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/schedule" element={user ? <Layout user={user} onLogout={handleLogout}><SchedulePage user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/reviews" element={user ? <Layout user={user} onLogout={handleLogout}><ReviewsPage user={user} /></Layout> : <Navigate to="/login" />} />
        <Route path="/notifications" element={user ? <Layout user={user} onLogout={handleLogout}><NotificationsPage user={user} onUpdate={handleUpdateUser} /></Layout> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Layout user={user} onLogout={handleLogout}><ProfilePage user={user} onUpdate={handleUpdateUser} onLogout={handleLogout} /></Layout> : <Navigate to="/login" />} />
        <Route path="/admin" element={user ? <Layout user={user} onLogout={handleLogout}><AdminPage /></Layout> : <Navigate to="/login" />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {user && <ChatWidget />}
    </Router>
  );
};

export default App;
