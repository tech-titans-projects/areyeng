
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bus, Loader2, User as UserIcon, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from '../services/firebase';
import { dbService } from '../services/dbService';
import { User } from '../types';

interface RegisterProps {
  onLogin: (user: User) => void;
}

const RegisterPage: React.FC<RegisterProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        setLoading(false);
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        const newUser = await dbService.createUser(username, email, password, uid);
        onLogin(newUser);
    } catch (error: any) {
        console.error("Registration Error:", error);
        let msg = "Failed to create account.";
        if (error.code === 'auth/email-already-in-use') {
            msg = "Email already in use. Please login.";
        }
        alert(msg);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="flex justify-center mb-6">
           <div className="bg-teal-100 p-3 rounded-full shadow-inner">
             <Bus className="h-10 w-10 text-teal-700" />
           </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Create Account</h2>
        <p className="text-center text-slate-500 mb-8">Join the community for smarter commuting.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <div className="relative">
                <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                placeholder="e.g. BusRider99"
                />
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
                <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                placeholder="e.g. you@example.com"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
                <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                placeholder="Minimum 6 characters"
                minLength={6}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-teal-600 transition"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20"
          >
            {loading && <Loader2 className="animate-spin" size={20} />}
            Create Account
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600 text-sm">
          Already have an account? <Link to="/login" className="text-teal-600 font-bold hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
