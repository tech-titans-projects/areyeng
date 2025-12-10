
import React, { useEffect, useState } from 'react';
import { Bell, AlertTriangle, Calendar, Info, Send, Loader2, CheckCheck, X } from 'lucide-react';
import { dbService } from '../services/dbService';
import { Notification, NotificationType, User, UserRole } from '../types';

interface NotificationsPageProps {
  user?: User;
  onUpdate?: (user: User) => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ user, onUpdate }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Admin Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const data = await dbService.getNotifications();
    setNotifications(data);
    setLoading(false);
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !user) return;

    setIsSubmitting(true);
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      title,
      message,
      type,
      author: user.username,
      createdAt: new Date().toISOString()
    };

    try {
      await dbService.addNotification(newNotification);
      setNotifications(prev => [newNotification, ...prev]);
      setTitle('');
      setMessage('');
      setType('General');
    } catch (error) {
      console.error("Error creating notification", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenNotification = async (notification: Notification) => {
    setSelectedNotification(notification);
    
    // Mark as read if not already
    if (user && onUpdate && (!user.readNotificationIds || !user.readNotificationIds.includes(notification.id))) {
      try {
        const updatedUser = await dbService.markNotificationAsRead(user.id, notification.id);
        onUpdate(updatedUser);
      } catch (e) {
        console.error("Failed to mark notification as read", e);
      }
    }
  };

  const handleMarkAllRead = async () => {
    if (!user || !onUpdate) return;
    setMarkingAll(true);
    try {
        const updatedUser = await dbService.markAllNotificationsAsRead(user.id);
        onUpdate(updatedUser);
    } catch (e) {
        console.error("Failed to mark all as read", e);
    } finally {
        setMarkingAll(false);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'Delay': return <AlertTriangle className="text-red-500" size={24} />;
      case 'Schedule Change': return <Calendar className="text-orange-500" size={24} />;
      default: return <Info className="text-teal-500" size={24} />;
    }
  };

  const getBgColor = (type: NotificationType, isRead: boolean) => {
    if (isRead) return 'bg-white border-slate-100 opacity-75';
    
    switch (type) {
      case 'Delay': return 'bg-red-50 border-red-200 shadow-sm';
      case 'Schedule Change': return 'bg-orange-50 border-orange-200 shadow-sm';
      default: return 'bg-teal-50 border-teal-200 shadow-sm';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 relative">
      <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <Bell className="text-teal-600" size={32} />
            Service Alerts
            </h2>
            <p className="text-slate-500">Stay informed about delays, schedule changes, and updates.</p>
          </div>
          {user && (
              <button 
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-sm font-medium text-teal-600 hover:text-teal-800 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-teal-50 transition-colors"
              >
                  {markingAll ? <Loader2 className="animate-spin" size={14} /> : <CheckCheck size={16} />}
                  Mark all as read
              </button>
          )}
      </div>

      {/* Admin Creation Form */}
      {user?.role === UserRole.ADMIN && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Post New Alert</h3>
          <form onSubmit={handleCreateNotification} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="e.g. Traffic Delay on Route T1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as NotificationType)}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="General">General</option>
                  <option value="Delay">Delay</option>
                  <option value="Schedule Change">Schedule Change</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none h-24 resize-none"
                placeholder="Detailed description of the event..."
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Post Alert
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
            No active alerts at this time.
          </div>
        ) : (
          notifications.map((note) => {
            const isRead = user?.readNotificationIds?.includes(note.id) || false;
            return (
                <div 
                    key={note.id} 
                    onClick={() => handleOpenNotification(note)}
                    className={`p-6 rounded-2xl border ${getBgColor(note.type, isRead)} flex gap-4 transition-all hover:scale-[1.01] cursor-pointer group relative`}
                >
                    {!isRead && (
                        <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-teal-500"></span>
                    )}
                    <div className={`mt-1 flex-shrink-0 transition-opacity ${isRead ? 'opacity-50' : 'opacity-100'}`}>
                        {getIcon(note.type)}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                        <h3 className={`text-lg text-slate-800 ${isRead ? 'font-medium' : 'font-bold'}`}>{note.title}</h3>
                        <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                            {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                        </div>
                        <div className="mb-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${isRead ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white/50 border-slate-200 text-slate-600'}`}>
                                {note.type}
                            </span>
                        </div>
                        <p className={`text-slate-700 leading-relaxed line-clamp-2 ${isRead ? 'opacity-70' : ''}`}>
                        {note.message}
                        </p>
                        <p className="text-xs text-teal-600 mt-2 font-medium group-hover:underline">
                            Click to read more
                        </p>
                    </div>
                </div>
            );
          })
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in-up">
                <div className={`p-6 border-b ${
                    selectedNotification.type === 'Delay' ? 'bg-red-50 border-red-100' :
                    selectedNotification.type === 'Schedule Change' ? 'bg-orange-50 border-orange-100' :
                    'bg-teal-50 border-teal-100'
                }`}>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                {getIcon(selectedNotification.type)}
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">{selectedNotification.title}</h3>
                                <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                                    {selectedNotification.type}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedNotification(null)}
                            className="p-1 hover:bg-black/5 rounded-full transition-colors"
                        >
                            <X size={24} className="text-slate-500" />
                        </button>
                    </div>
                </div>
                
                <div className="p-8">
                    <p className="text-slate-700 text-lg leading-relaxed">
                        {selectedNotification.message}
                    </p>
                    
                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-sm text-slate-400">
                        <span>Posted by <span className="font-medium text-slate-600">{selectedNotification.author}</span></span>
                        <span>{new Date(selectedNotification.createdAt).toLocaleString()}</span>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={() => setSelectedNotification(null)}
                        className="px-6 py-2 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
