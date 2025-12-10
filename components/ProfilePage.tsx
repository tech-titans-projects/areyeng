
import React, { useState, useEffect } from 'react';
import { User, UserRole, Booking } from '../types';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Save, Loader2, MapPin, TicketCheck, Calendar, ArrowUpRight, LogOut, Eye, EyeOff } from 'lucide-react';
import { dbService } from '../services/dbService';

interface ProfilePageProps {
  user: User;
  onUpdate: (user: User) => void;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdate, onLogout }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState(user.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (user) {
        dbService.getUserBookings(user.id).then(setBookings);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const updatedUser: User = { ...user, username, email, password };
      await dbService.updateUser(updatedUser);
      onUpdate(updatedUser);
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <div className="bg-teal-100 p-2 rounded-lg text-teal-700">
                <UserIcon size={32} />
            </div>
            My Profile
        </h2>
        <p className="text-slate-500">Manage your account information and preferences.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Username</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Email Address</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">New Password</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"}
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Leave unchanged to keep current password"
                            className="w-full p-3 pr-12 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-teal-600 transition"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <p className="text-xs text-slate-400">Enter a new password to update your login credentials.</p>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
                <label className="text-sm font-semibold text-slate-700 mb-4 block">Account Type</label>
                <div className="inline-block px-4 py-2 bg-slate-100 rounded-full text-slate-600 text-sm font-medium">
                    {user.role} Account
                </div>
            </div>

            {/* Frequent Routes Display (Read-only here) - Hidden for Admins */}
            {!isAdmin && (
                <>
                    <div className="pt-4 border-t border-slate-100">
                        <label className="text-sm font-semibold text-slate-700 mb-3 block">My Frequent Routes</label>
                        {user.frequentRoutes && user.frequentRoutes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {user.frequentRoutes.map(routeId => (
                                    <button 
                                        key={routeId} 
                                        type="button"
                                        onClick={() => navigate(`/schedule?route=${routeId}`)}
                                        className="flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg border border-teal-100 hover:bg-teal-100 transition-colors"
                                        title="View Schedule"
                                    >
                                        <MapPin size={14} />
                                        <span className="text-sm font-medium">{routeId}</span>
                                        <ArrowUpRight size={12} className="opacity-50" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">No frequent routes saved yet. View the schedule to add some!</p>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                         <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                             <TicketCheck size={18} className="text-teal-600" /> My Booked Rides
                         </label>
                         {bookings.length > 0 ? (
                             <div className="space-y-3">
                                 {bookings.map(booking => (
                                     <div key={booking.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center">
                                         <div>
                                             <div className="font-bold text-slate-700 text-sm">{booking.routeName}</div>
                                             <div className="text-xs text-slate-500 flex items-center gap-1">
                                                 <MapPin size={10} /> {booking.stopName}
                                             </div>
                                         </div>
                                         <div className="text-right">
                                             <div className="bg-teal-100 text-teal-800 text-xs font-bold px-2 py-1 rounded">
                                                 {booking.time}
                                             </div>
                                             <div className="text-[10px] text-slate-400 mt-1">
                                                 {new Date(booking.createdAt).toLocaleDateString()}
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         ) : (
                             <p className="text-sm text-slate-400 italic">No bookings yet. Visit the schedule page to book.</p>
                         )}
                    </div>
                </>
            )}

            {message && (
                <div className={`p-3 rounded-lg text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message}
                </div>
            )}

            <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-2">
                {/* Mobile Sign Out Button */}
                <button 
                    type="button"
                    onClick={onLogout}
                    className="md:hidden w-full bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>

                <button 
                    type="submit" 
                    disabled={isSaving}
                    className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Save Changes
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
