
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bus, Loader2, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from '../services/firebase';
import { dbService } from '../services/dbService';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [knownEmails, setKnownEmails] = useState<string[]>([]);

  useEffect(() => {
    const loadSuggestions = async () => {
        const emails = await dbService.getKnownEmails();
        setKnownEmails(emails);
    };
    loadSuggestions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
        setError("Please fill in all fields.");
        setLoading(false);
        return;
    }

    try {
        // 1. Authenticate with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        
        // 2. Retrieve User Profile (Check Local then Firestore)
        let user = await dbService.findUserByEmail(email);
        
        if (!user) {
             // If not found locally (new device), fetch from Firestore
             user = await dbService.getUserProfile(uid);
        }
        
        if (user) {
            onLogin(user);
        } else {
            // Profile missing locally and in Firestore, but Auth passed.
            // This is a rare edge case, but we can try to recover by using the auth data.
            console.warn("User authenticated but profile not found. Creating fallback profile.");
            const fallbackUser: User = await dbService.createUser(
                email.split('@')[0], 
                email, 
                '', 
                uid
            );
            onLogin(fallbackUser);
        }

    } catch (err: any) {
        console.error("Login Error:", err);
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
             setError("Invalid email or password. If you haven't registered yet, please create an account below.");
        } else if (err.code === 'auth/too-many-requests') {
             setError("Too many failed attempts. Please try again later.");
        } else {
             setError('Login failed. Please check your internet connection.');
        }
    } finally {
        setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
      if (!email) {
          setError("Please enter your email address first to reset password.");
          return;
      }
      try {
          await sendPasswordResetEmail(auth, email);
          setSuccessMsg(`Password reset email sent to ${email}. Check your inbox.`);
          setError('');
      } catch (err: any) {
          setError("Failed to send reset email. Verify the email is correct.");
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
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Welcome Back</h2>
        <p className="text-center text-slate-500 mb-8">Sign in to track your Areyeng bus.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
                <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                list="email-suggestions"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                placeholder="e.g. commuter1@gmail.com"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            </div>
            <datalist id="email-suggestions">
                {knownEmails.map(e => (
                    <option key={e} value={e} />
                ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
                <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full pl-10 pr-12 py-3 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                placeholder="••••••••"
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

          <div className="flex justify-end">
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-sm text-teal-600 hover:text-teal-800 hover:underline"
              >
                  Forgot Password?
              </button>
          </div>
          
          {error && (
            <div className="flex items-start gap-2 bg-red-50 p-3 rounded-lg border border-red-100 text-red-600 text-sm animate-pulse">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
            </div>
          )}
          
          {successMsg && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-green-700 text-sm text-center">
                {successMsg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20"
          >
            {loading && <Loader2 className="animate-spin" size={20} />}
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600 text-sm">
          Don't have an account? <Link to="/register" className="text-teal-600 font-bold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
