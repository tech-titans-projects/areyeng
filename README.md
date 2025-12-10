## 🚌 Areyeng Bus Tracker
A modern web application that helps commuters in Tshwane track **Areyeng bus routes in real time**.  
Built with scalability, clean design, and user-friendly authentication in mind.
 
---
 
## ✨ Features
- **Authentication**: Secure sign-in and registration system (email + password).
- **Bus Tracking**: Real-time updates on Areyeng bus locations and routes.
- **Modern UI**: Minimalist, pastel-inspired interface for a clean commuter experience.
- **Fast Deployment**: Hosted on [Vercel](https://vercel.com/) for speed and reliability.
- **AI-powered predictions**: Smarter route and timing estimates (future enhancement).
 
---
 
## 🛠️ Tech Stack
| Layer        | Technology |
|--------------|------------|
| Frontend     | React / Next.js |
| Backend      | Node.js / Express |
| Database     | Firebase / SQL (planned integration) |
| Hosting      | Vercel |
| Versioning   | Git + GitHub |
 
---
 
## 📂 Project Structure
```
areyeng-bus-tracker/  
 ├── public/              # Static assets  
 ├── src/  
 │   ├── components/      # Reusable UI components  
 │   │    └── Navbar.js  
 │   ├── pages/           # Next.js pages  
 │   │    ├── index.js    # Landing page (login/register)  
 │   │    ├── login.js  
 │   │    ├── register.js   
 │   │    └── dashboard.js  
 │   ├── services/        # API + Firebase integration  
 │   │    └── auth.js
 │   └── styles/          # CSS modules  
 │        └── globals.css  
 ├── .gitignore  
 ├── package.json  
 ├── README.md  
 └── next.config.js  
```
 ---

## 🚀 Setup Instructions  
1. Clone the Repository  
`git clone https://github.com/your-username/areyeng-bus-tracker.gitcd areyeng-bus-tracker`  

2. Install Dependencies  
`npm install`  

3. Configure Firebase  
Create a .env.local file in the root:   
`NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key  
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com  
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id`

4. Run Locally  
`npm run dev`   
 App will be available at http://localhost:3000.  

5. Deploy to Vercel 
- Push to GitHub (git push origin main)  
- Connect repo to Vercel  
- Automatic deployment will go live at https://areyeng.vercel.app  
