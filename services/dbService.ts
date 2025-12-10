
import { User, UserRole, Review, Sentiment, Notification, NotificationType, Booking } from '../types';
import { doc, setDoc, collection, Timestamp, getDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from './firebase';
import { analyzeReviewSentiment } from './geminiService';

// Mock Data Initialization
const INITIAL_USERS: User[] = [
  { id: '1', username: 'Admin User', email: 'admin@areyeng.co.za', password: 'password123', role: UserRole.ADMIN, frequentRoutes: ['T1'], readNotificationIds: [] },
  { id: '2', username: 'Commuter One', email: 'user@gmail.com', password: 'password123', role: UserRole.USER, frequentRoutes: [], readNotificationIds: [] }
];

const MOCK_REVIEWS_KEY = 'areyeng_reviews';
const MOCK_USERS_KEY = 'areyeng_users';
const MOCK_NOTIFICATIONS_KEY = 'areyeng_notifications';
const MOCK_BOOKINGS_KEY = 'areyeng_bookings';

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Major Delay on T1 Route',
    message: 'Due to roadworks on Nana Sita street, expect delays of up to 15 minutes on the T1 route.',
    type: 'Delay',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    author: 'Admin'
  },
  {
    id: '2',
    title: 'Schedule Update: Public Holiday',
    message: 'Buses will operate on a Saturday schedule this coming Friday due to the public holiday.',
    type: 'Schedule Change',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    author: 'Admin'
  }
];

class MockMySQLService {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(MOCK_USERS_KEY)) {
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(MOCK_REVIEWS_KEY)) {
      localStorage.setItem(MOCK_REVIEWS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(MOCK_NOTIFICATIONS_KEY)) {
      localStorage.setItem(MOCK_NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
    if (!localStorage.getItem(MOCK_BOOKINGS_KEY)) {
      localStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify([]));
    }
  }

  // --- USER MANAGEMENT ---

  // 1. Get User Profile (Handles Cross-Device Login)
  async getUserProfile(uid: string): Promise<User | null> {
    // A. Try Local Storage first (fastest)
    const users: User[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    const localUser = users.find(u => u.id === uid);
    if (localUser) return localUser;

    // B. Try Firestore (Cross-device fallback)
    try {
        console.log("Fetching user profile from Firestore:", uid);
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const firestoreUser: User = {
                id: uid,
                username: data.username || 'User',
                email: data.email || '',
                role: (data.role as UserRole) || UserRole.USER,
                frequentRoutes: data.frequentRoutes || [],
                readNotificationIds: [],
                password: '' // Auth handled by Firebase, password field mostly for legacy mock
            };
            
            // Hydrate local storage for session speed
            users.push(firestoreUser);
            localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
            
            return firestoreUser;
        }
    } catch (e) {
        console.error("Error fetching user profile from Firestore:", e);
    }
    return null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    await this.delay(200);
    const users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    return users.find((u: User) => u.email === email) || null;
  }

  async getKnownEmails(): Promise<string[]> {
    await this.delay(100);
    const users: User[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    return users.map((u: User) => u.email);
  }

  async createUser(username: string, email: string, password: string, uid?: string): Promise<User> {
    await this.delay(400);
    
    // 1. Write to Firestore
    if (uid) {
        try {
            await setDoc(doc(db, "users", uid), {
                username: username,
                email: email,
                role: UserRole.USER,
                createdAt: new Date().toISOString()
            });
            console.log("User successfully written to Firestore");
        } catch (error: any) {
             if (error.code === 'permission-denied') {
                 console.warn("Firestore: Write permission denied. Saving to local storage only.");
            } else {
                 console.warn("Firestore sync failed:", error.message);
            }
        }
    }

    // 2. Write to Local Mock DB
    const users: User[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    const existingIndex = users.findIndex(u => u.email === email);
    
    if (existingIndex !== -1) {
        const updatedUser = { 
            ...users[existingIndex], 
            id: uid || users[existingIndex].id,
            username: username || users[existingIndex].username,
            password: password
        };
        users[existingIndex] = updatedUser;
        localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
        return updatedUser;
    }

    const newUser: User = {
      id: uid || crypto.randomUUID(),
      username,
      email,
      password,
      role: UserRole.USER,
      frequentRoutes: [],
      readNotificationIds: []
    };
    users.push(newUser);
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    return newUser;
  }

  async updateUser(user: User): Promise<User> {
    await this.delay(300);
    const users: User[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...user }; 
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
      
      if (user.id && user.id.length > 10) {
          try {
             await setDoc(doc(db, "users", user.id), {
                 username: user.username,
                 email: user.email,
                 updatedAt: new Date().toISOString()
             }, { merge: true });
          } catch (e: any) { 
              if (e.code !== 'permission-denied') console.warn("Firestore sync failed", e);
          }
      }
      return users[index];
    }
    throw new Error("User not found");
  }

  async addFrequentRoute(userId: string, routeId: string): Promise<void> {
    const users: User[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      const currentRoutes = users[index].frequentRoutes || [];
      if (!currentRoutes.includes(routeId)) {
        users[index].frequentRoutes = [...currentRoutes, routeId];
        localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
        
        const sessionUser = JSON.parse(localStorage.getItem('areyeng_session') || '{}');
        if (sessionUser.id === userId) {
            localStorage.setItem('areyeng_session', JSON.stringify(users[index]));
        }
      }
    }
  }

  // --- NOTIFICATIONS ---
  async getNotifications(): Promise<Notification[]> {
    await this.delay(200);
    return JSON.parse(localStorage.getItem(MOCK_NOTIFICATIONS_KEY) || '[]');
  }

  async addNotification(notification: Notification): Promise<void> {
    await this.delay(300);
    const notifications = JSON.parse(localStorage.getItem(MOCK_NOTIFICATIONS_KEY) || '[]');
    notifications.unshift(notification);
    localStorage.setItem(MOCK_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<User> {
    const users: User[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      const currentRead = users[index].readNotificationIds || [];
      if (!currentRead.includes(notificationId)) {
        users[index].readNotificationIds = [...currentRead, notificationId];
        localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
        return users[index];
      }
      return users[index];
    }
    throw new Error("User not found");
  }

  async markAllNotificationsAsRead(userId: string): Promise<User> {
    const users: User[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    const notifications: Notification[] = JSON.parse(localStorage.getItem(MOCK_NOTIFICATIONS_KEY) || '[]');
    const allIds = notifications.map(n => n.id);
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].readNotificationIds = [...new Set([...(users[index].readNotificationIds || []), ...allIds])];
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
      return users[index];
    }
    throw new Error("User not found");
  }

  // --- BOOKINGS ---
  async createBooking(booking: Booking): Promise<void> {
    await this.delay(300);
    const bookings = JSON.parse(localStorage.getItem(MOCK_BOOKINGS_KEY) || '[]');
    bookings.push(booking);
    localStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(bookings));
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    await this.delay(200);
    const bookings: Booking[] = JSON.parse(localStorage.getItem(MOCK_BOOKINGS_KEY) || '[]');
    return bookings.filter(b => b.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- REVIEWS ---
  async addReview(review: Review): Promise<void> {
    await this.delay(100);
    
    // 1. Firestore Sync (Primary for Persistence)
    try {
        console.log("Attempting to write review to Firestore:", review.id);
        
        // Strategy: Embed sentiment into the review string using a delimiter
        // Format: "Review text content...|||POSITIVE|||0.95"
        // This strictly complies with rules allowing ONLY 'username', 'review', 'time'
        const sentimentPayload = `|||${review.sentiment}|||${review.sentimentScore}`;
        
        const strictPayload = {
            username: review.username,
            review: review.text + sentimentPayload,
            time: Timestamp.fromDate(new Date())
        };
        await setDoc(doc(db, "communityReviews", review.id), strictPayload);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
             console.warn("Firestore: Write permission denied.");
        } else {
             console.error("Firestore Review Write Error:", error);
        }
    }

    // 2. Local Storage (Immediate feedback)
    const reviews = JSON.parse(localStorage.getItem(MOCK_REVIEWS_KEY) || '[]');
    reviews.unshift(review); 
    localStorage.setItem(MOCK_REVIEWS_KEY, JSON.stringify(reviews));
  }

  async getReviews(): Promise<Review[]> {
    // 1. Try Fetching from Firestore (Persistent Source)
    try {
        const q = query(collection(db, "communityReviews"), orderBy("time", "desc"));
        const querySnapshot = await getDocs(q);
        
        // Use Promise.all to map asynchronously because we might need to call Gemini for legacy data
        const reviewsPromises = querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const date = data.time?.toDate ? data.time.toDate().toISOString() : new Date().toISOString();
            
            let textContent = data.review;
            let sentiment = Sentiment.NEUTRAL;
            let score = 0.5;

            // Check for metadata delimiter (New Format)
            if (textContent && textContent.includes('|||')) {
                const parts = textContent.split('|||');
                if (parts.length >= 3) {
                    const parsedScore = parseFloat(parts.pop() || '0.5');
                    const parsedSentiment = parts.pop();
                    
                    if (!isNaN(parsedScore)) score = parsedScore;
                    if (parsedSentiment) sentiment = parsedSentiment as Sentiment;
                    
                    textContent = parts.join('|||');
                }
            } else if (textContent) {
                // Legacy Format (Raw Text) - Analyze on the fly
                // Check local cache first to save API calls and time
                const cacheKey = `sentiment_cache_${doc.id}`;
                const cached = localStorage.getItem(cacheKey);
                
                if (cached) {
                    const parsed = JSON.parse(cached);
                    sentiment = parsed.sentiment;
                    score = parsed.score;
                } else {
                    // Fetch from Gemini
                    try {
                        console.log(`Analyzing legacy review ${doc.id} on the fly...`);
                        const analysis = await analyzeReviewSentiment(textContent);
                        sentiment = analysis.sentiment;
                        score = analysis.score;
                        // Cache it indefinitely for this device
                        localStorage.setItem(cacheKey, JSON.stringify({ sentiment, score }));
                    } catch (err) {
                        console.warn("Failed to analyze legacy review:", err);
                    }
                }
            }

            return {
                id: doc.id,
                userId: 'unknown', 
                username: data.username,
                text: textContent,
                sentiment: sentiment,
                sentimentScore: score,
                createdAt: date,
            };
        });
        
        const firestoreReviews = await Promise.all(reviewsPromises);
        if (firestoreReviews.length > 0) return firestoreReviews;

    } catch (e) {
         console.warn("Firestore read failed, falling back to local", e);
    }

    // 2. Fallback to Local Storage
    return JSON.parse(localStorage.getItem(MOCK_REVIEWS_KEY) || '[]');
  }

  async replyToReview(reviewId: string, replyText: string): Promise<void> {
    await this.delay(300);
    // Local only due to rules
    const reviews: Review[] = JSON.parse(localStorage.getItem(MOCK_REVIEWS_KEY) || '[]');
    const index = reviews.findIndex(r => r.id === reviewId);
    if (index !== -1) {
      reviews[index].adminReply = replyText;
      reviews[index].replyCreatedAt = new Date().toISOString();
      localStorage.setItem(MOCK_REVIEWS_KEY, JSON.stringify(reviews));
    }
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const dbService = new MockMySQLService();
