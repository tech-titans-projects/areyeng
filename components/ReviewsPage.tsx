
import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Send, Loader2, ThumbsUp, ThumbsDown, Minus, CornerDownRight, ShieldCheck } from 'lucide-react';
import { User, Review, Sentiment, UserRole } from '../types';
import { dbService } from '../services/dbService';
import { analyzeReviewSentiment } from '../services/geminiService';

interface ReviewsPageProps {
  user: User;
}

const ReviewsPage: React.FC<ReviewsPageProps> = ({ user }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewText, setNewReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin Reply State
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    const data = await dbService.getReviews();
    setReviews(data);
    setLoading(false);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    setIsSubmitting(true);

    try {
      // AI Analysis
      const analysis = await analyzeReviewSentiment(newReviewText);

      const review: Review = {
        id: crypto.randomUUID(),
        userId: user.id,
        username: user.username,
        text: newReviewText,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.score,
        createdAt: new Date().toISOString()
      };

      await dbService.addReview(review);
      setReviews(prev => [review, ...prev]);
      setNewReviewText('');
    } catch (err) {
      console.error("Failed to submit review", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    
    try {
        await dbService.replyToReview(reviewId, replyText);
        // Optimistic update
        setReviews(prev => prev.map(r => {
            if (r.id === reviewId) {
                return {
                    ...r,
                    adminReply: replyText,
                    replyCreatedAt: new Date().toISOString()
                };
            }
            return r;
        }));
        setReplyText('');
        setReplyingTo(null);
    } catch (err) {
        console.error("Failed to submit reply", err);
    } finally {
        setIsSubmittingReply(false);
    }
  };

  const getSentimentIcon = (sentiment: Sentiment) => {
    switch (sentiment) {
      case Sentiment.POSITIVE: return <ThumbsUp size={16} className="text-green-500" />;
      case Sentiment.NEGATIVE: return <ThumbsDown size={16} className="text-red-500" />;
      default: return <Minus size={16} className="text-gray-400" />;
    }
  };

  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Community Voices</h2>
        <p className="text-slate-500">{isAdmin ? "Manage user feedback and respond to inquiries." : "Share your experience with Areyeng."}</p>
      </div>

      {/* Input Form - Hidden for Admins */}
      {!isAdmin && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <form onSubmit={handleSubmitReview}>
            <textarea
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
              placeholder="How was your bus ride today?"
              className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none h-32"
            />
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs text-slate-400">AI analyzes your feedback for better service.</span>
              <button
                type="submit"
                disabled={isSubmitting || !newReviewText.trim()}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Post Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-slate-400">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">No reviews yet.</div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                     <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold uppercase">
                        {review.username[0]}
                     </div>
                     <div>
                        <h4 className="font-bold text-slate-800 text-sm">{review.username}</h4>
                        <span className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                     </div>
                  </div>
                  
                  {/* Sentiment Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100" title={`Confidence: ${(review.sentimentScore * 100).toFixed(0)}%`}>
                     {getSentimentIcon(review.sentiment)}
                     <span className={`text-xs font-medium ${
                        review.sentiment === Sentiment.POSITIVE ? 'text-green-600' :
                        review.sentiment === Sentiment.NEGATIVE ? 'text-red-600' : 'text-gray-600'
                     }`}>
                        {review.sentiment}
                     </span>
                  </div>
               </div>
               
               <p className="text-slate-600 leading-relaxed mb-4">
                  {review.text}
               </p>

               {/* Admin Reply Display */}
               {review.adminReply && (
                 <div className="bg-slate-50 rounded-xl p-4 ml-8 border-l-2 border-teal-500">
                    <div className="flex items-center gap-2 mb-1">
                        <CornerDownRight size={14} className="text-teal-500" />
                        <span className="text-xs font-bold text-teal-700 flex items-center gap-1">
                            <ShieldCheck size={12} /> Admin Response
                        </span>
                        <span className="text-[10px] text-slate-400">
                            {review.replyCreatedAt && new Date(review.replyCreatedAt).toLocaleDateString()}
                        </span>
                    </div>
                    <p className="text-sm text-slate-600">{review.adminReply}</p>
                 </div>
               )}

               {/* Admin Reply Action */}
               {isAdmin && !review.adminReply && (
                 <div className="mt-4 pt-4 border-t border-slate-100">
                    {replyingTo === review.id ? (
                        <div className="space-y-2 animate-fade-in">
                            <textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-teal-500"
                                placeholder="Write an official response..."
                                rows={2}
                            />
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleSubmitReply(review.id)}
                                    disabled={isSubmittingReply || !replyText.trim()}
                                    className="px-3 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1"
                                >
                                    {isSubmittingReply && <Loader2 size={10} className="animate-spin" />}
                                    Send Reply
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setReplyingTo(review.id)}
                            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                        >
                            <MessageSquare size={12} /> Reply to user
                        </button>
                    )}
                 </div>
               )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;
