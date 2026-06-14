# Viewra 📺 - Full-Stack MVP Live Streaming Platform

Viewra is a complete, production-ready, full-stack live streaming platform built with React, Vite, Node.js, Express, Socket.IO, LiveKit Cloud, and Prisma ORM.

It operates seamlessly, utilizing a dual state strategy that allows the preview sandbox to run instantly with file-backed storage (`local_db.json`) and a simulated camera capture casting terminal out-of-the-box, whilst transitioning automatically to relational PostgreSQL (Neon/Supabase) and real LiveKit streaming when environment secrets are provided.

---

## 🎨 Design Philosophy
- **Modern Slate-Dark Aesthetic**: Structured gracefully with premium slate panels, balanced margins, crisp white typographies, and deep contrast buttons.
- **Micro Interactions**: Interactive state buttons (Go Live, End Broadcast), audio-responsive viewer indicators, and real-time feedback.
- **Architectural Honesty**: Humbler, literal labels, keeping workspace elements uncluttered, providing absolute functional utility.

---

## 🚀 Tech Stack

### Frontend
* **React 19** & **Vite**: Fast HMR runtime and compact builds.
* **Tailwind CSS**: Modern styled layout classes.
* **React Router v6**: Dynamic client routing and navigational state.
* **Axios**: Interceptor-based automatic JWT token authorization mapping.
* **Socket.IO Client**: Real-time room joining and instant chat.
* **LiveKit React SDK**: Professional media streaming client.

### Backend & Database
* **Node.js** & **Express**: Solid REST API routes.
* **Socket.IO Server**: Channel presence, viewer-count updates, and chat distribution.
* **JWT Authentication**: Password cryptographic checking via `bcryptjs` and signed JWT bearer tokens.
* **Prisma ORM**: Modern database relational mapper.
* **Zod**: Secure input validations.
* **JSON Fallback Engine**: Local-DB resilience backplane if `DATABASE_URL` is missing.

---

## 📂 Project Structure
```text
viewra/
├── prisma/
│   └── schema.prisma         # Prisma schemas defining User, Stream, & Message models
├── src/
│   ├── backend/
│   │   ├── middleware/
│   │   │   └── auth.ts       # Secure JWT route protector middleware
│   │   ├── routes/
│   │   │   ├── auth.ts       # Register, Login endpoints & Rate-Limiters
│   │   │   ├── streams.ts    # Creation, details, starting, and ending endpoints
│   │   │   └── livekit.ts    # Secure token signing on LiveKit cloud services
│   │   └── db.ts             # Relational Prisma + Local JSON db broker
│   ├── components/
│   │   ├── Navbar.tsx        # Navigation bars and logout trigger actions
│   │   ├── StreamCard.tsx    # Live channels dashboard cards
│   │   ├── VideoPlayer.tsx   # Native LiveKit client or sandbox webcam capturing stage
│   │   └── ChatBox.tsx       # Live chat, character counter, scroll locks
│   ├── pages/
│   │   ├── Login.tsx         # Responsive login interface
│   │   ├── Register.tsx      # Secure password hashing signup
│   │   ├── Dashboard.tsx     # Channel directory and interactive CTAs
│   │   ├── CreateStream.tsx  # Interactive stream configuration form
│   │   └── StreamRoom.tsx    # Real-time streaming & chat hub
│   ├── utils/
│   │   └── api.ts            # Client Axios setup with automatic bearer intercepts
│   ├── App.tsx               # Client React Router and active session restorer
│   ├── types.ts              # Centralized TypeScript definitions
│   └── index.css             # Tailwind imports
├── server.ts                 # Master Express + Socket.IO and dev middleware server
├── metadata.json             # Applet metadata permissions (camera/mic requests)
└── package.json              # Script directives and full packaging
```

---

## ⚡ Setup & Local Running

### Prerequisite
Ensure that you have [Node.js](https://nodejs.org/) (v18+) installed.

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a file named `.env` in the root directory (using `.env.example` as a solid baseline):
```env
DATABASE_URL="postgresql://user:password@hostname:5432/dbname?sslmode=require"
JWT_SECRET="any-large-cryptographic-random-value"
LIVEKIT_API_KEY="your-livekit-api-key"
LIVEKIT_API_SECRET="your-livekit-api-secret"
LIVEKIT_URL="wss://your-project.livekit.cloud"
```

### 3. Setup Relational Database & Migrations (Prisma)
If you have supplied the `DATABASE_URL`, execute:
```bash
# Push schema structure directly to databases
npx prisma db push

# Generate Prisma Client classes
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your web browser.

---

## 🛡️ Security Features
1. **Auth Rate Limiting**: Limit registrations and login queries dynamically (max 10 hits/minute per IP) to block brute-force scripts.
2. **Strict Encrypts**: Hashes passwords with 10 salt rounds of `bcryptjs` before entering storage.
3. **Zod Input Verification**: Clean regular expressions checking characters, formatting, mail addresses, and field lengths.
4. **Token Security**: Tokens with 10-minute expirations for LiveKit streams. LiveKit Secret Keys never leak to frontend browsers.

---

## 🌐 Production Deployment Directories

### Database (Neon / Supabase)
1. Sign up on [Neon Console](https://neon.tech/) or [Supabase](https://supabase.com/) and spin up an empty relational database.
2. Copy the database connection URL and append it inside the Environment fields.

### Backend (Render / Railway / Cloud Run)
1. Link your github repository containing the Viewra folder structure.
2. Select **Node Runtime** environment rules.
3. Configure Environment Secrets corresponding to variables in `.env.example`.
4. Define:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`

### Frontend (Vercel)
1. Link your repo directly to Vercel.
2. Build commands default to standard Vite compilation (`npm run build`).
3. Deploy! Since Viewra packages the Vite static build inside the Express server, this single-slug deployment operates with maximum simplicity.
