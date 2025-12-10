
import React, { ReactNode, useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Bus, Calendar, LogOut, MessageSquare, Map as MapIcon, ShieldCheck, Bell, User as UserIcon, Home } from 'lucide-react';
import { User, UserRole, Notification } from '../types';
import { dbService } from '../services/dbService';

interface LayoutProps {
  children: ReactNode;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkNotifications = async () => {
      if (user) {
        const notifications = await dbService.getNotifications();
        const readIds = user.readNotificationIds || [];
        const count = notifications.filter(n => !readIds.includes(n.id)).length;
        setUnreadCount(count);
      }
    };
    checkNotifications();
    // Poll for new notifications every minute
    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const isActive = (path: string) => location.pathname === path ? "bg-teal-700 text-white" : "text-teal-100 hover:bg-teal-800";
  const isMobileActive = (path: string) => location.pathname === path ? "text-teal-600" : "text-slate-400";

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 bg-teal-900 text-white flex-col shadow-xl">
        <div className="p-6 border-b border-teal-800">
          <div className="flex items-center gap-2">
            <Bus className="h-8 w-8 text-teal-400" />
            <h1 className="text-xl font-bold tracking-tight">Areyeng<span className="text-teal-400">Tracker</span></h1>
          </div>
          {user && (
             <p className="mt-2 text-xs text-teal-300">Welcome, {user.username}</p>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/')}`}>
            <MapIcon size={20} />
            <span className="font-medium">Live Tracking</span>
          </Link>
          <Link to="/schedule" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/schedule')}`}>
            <Calendar size={20} />
            <span className="font-medium">Bus Schedule</span>
          </Link>
          <Link to="/reviews" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/reviews')}`}>
            <MessageSquare size={20} />
            <span className="font-medium">Community Reviews</span>
          </Link>
          {user?.role === UserRole.ADMIN && (
            <Link to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin')}`}>
              <ShieldCheck size={20} />
              <span className="font-medium">Admin Dashboard</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-teal-800">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-300 hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col mb-16 md:mb-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center z-20">
             <div className="flex items-center gap-2 md:hidden">
                <Bus className="h-6 w-6 text-teal-600" />
                <span className="font-bold text-teal-900">Areyeng Tracker</span>
             </div>
             
             <div className="flex items-center justify-end w-full gap-3">
                <button 
                  onClick={() => navigate('/notifications')}
                  className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                  title="Notifications"
                >
                  <Bell size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors border border-slate-200"
                  title="My Profile"
                >
                   <UserIcon size={24} />
                </button>
             </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 z-50 flex justify-around items-center p-3 pb-safe">
        <Link to="/" className={`flex flex-col items-center gap-1 ${isMobileActive('/')}`}>
            <Home size={24} />
            <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link to="/schedule" className={`flex flex-col items-center gap-1 ${isMobileActive('/schedule')}`}>
            <Calendar size={24} />
            <span className="text-[10px] font-medium">Schedule</span>
        </Link>
        <Link to="/reviews" className={`flex flex-col items-center gap-1 ${isMobileActive('/reviews')}`}>
            <MessageSquare size={24} />
            <span className="text-[10px] font-medium">Reviews</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center gap-1 ${isMobileActive('/profile')}`}>
            <UserIcon size={24} />
            <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>
    </div>
  );
};

export default Layout;
