import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { dbService } from '../services/dbService';
import { Review, Sentiment } from '../types';
import { ShieldCheck, TrendingUp, AlertCircle } from 'lucide-react';

const AdminPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  
  useEffect(() => {
    dbService.getReviews().then(setReviews);
  }, []);

  // Calculate stats
  const total = reviews.length;
  const positive = reviews.filter(r => r.sentiment === Sentiment.POSITIVE).length;
  const negative = reviews.filter(r => r.sentiment === Sentiment.NEGATIVE).length;
  const neutral = reviews.filter(r => r.sentiment === Sentiment.NEUTRAL).length;

  const data = [
    { name: 'Positive', count: positive, color: '#10b981' },
    { name: 'Neutral', count: neutral, color: '#94a3b8' },
    { name: 'Negative', count: negative, color: '#ef4444' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 rounded-xl">
           <ShieldCheck className="text-indigo-600" size={32} />
        </div>
        <div>
           <h2 className="text-3xl font-bold text-slate-800">Admin Dashboard</h2>
           <p className="text-slate-500">AI-Powered System Overview</p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <h3 className="text-slate-400 text-sm font-medium uppercase mb-2">Total Feedback</h3>
           <p className="text-4xl font-bold text-slate-800">{total}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <h3 className="text-slate-400 text-sm font-medium uppercase mb-2">Satisfaction Rate</h3>
           <p className="text-4xl font-bold text-green-600">
              {total > 0 ? Math.round((positive / total) * 100) : 0}%
           </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <h3 className="text-slate-400 text-sm font-medium uppercase mb-2">Critical Issues</h3>
           <p className="text-4xl font-bold text-red-500">{negative}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Chart */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
               <TrendingUp size={20} className="text-teal-600" /> Sentiment Distribution
            </h3>
            <ResponsiveContainer width="100%" height="80%">
               <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={50}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>

         {/* Recent Negatives */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96 overflow-y-auto">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <AlertCircle size={20} className="text-red-500" /> Recent Complaints (Action Required)
            </h3>
            <div className="space-y-4">
               {reviews.filter(r => r.sentiment === Sentiment.NEGATIVE).slice(0, 5).map(r => (
                  <div key={r.id} className="p-4 bg-red-50 border border-red-100 rounded-xl">
                     <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-red-900 text-sm">{r.username}</span>
                        <span className="text-xs text-red-400">Score: {r.sentimentScore}</span>
                     </div>
                     <p className="text-red-800 text-sm">{r.text}</p>
                  </div>
               ))}
               {reviews.filter(r => r.sentiment === Sentiment.NEGATIVE).length === 0 && (
                  <p className="text-slate-400 text-sm italic">No negative reviews found. Good job!</p>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default AdminPage;