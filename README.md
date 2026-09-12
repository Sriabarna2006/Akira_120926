# Aura — Real-World Intelligence & Learning Assistant

An AI-powered web platform that transforms overwhelming real-world news and events into structured, digestible, and personalized learning pathways.

## Core Learning Loop
$$\text{DISCOVER} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{LEARN} \longrightarrow \text{TEST} \longrightarrow \text{REMEMBER} \longrightarrow \text{PERSONALIZE}$$

---

## 🚀 Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, TanStack Query v5, React Router v7.
- **Backend:** Node.js, Express, TypeScript, Zod, RSS-Parser.
- **Database & Auth (Configured):** Supabase (PostgreSQL 15+) with Row-Level Security (RLS).
- **AI Service:** Google Gemini / LLM backend service for structured multi-level explanations, concept prerequisite extraction, and adaptive quizzes.

---

## 📁 Project Structure

```
.
├── client/                     # Frontend Application (React + Vite + TS)
│   ├── src/
│   │   ├── components/         # Reusable UI component library (Navbar, Sidebar, Layout)
│   │   ├── pages/              # Views (Dashboard, DailyBrief, EventDetail, Learn, Knowledge, etc.)
│   │   ├── services/           # API Client (Axios + TanStack Query)
│   │   ├── types/              # TypeScript Domain Interfaces
│   │   ├── App.tsx             # Root Router & Providers
│   │   ├── index.css           # Custom Design System CSS & Glassmorphism
│   │   └── main.tsx            # Entry Point
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── server/                     # Backend API (Node.js + Express + TS)
│   ├── src/
│   │   ├── controllers/        # Express Controllers (News, Learning, Quizzes)
│   │   ├── middleware/         # Error Handling & Auth Middleware
│   │   ├── routes/             # REST API Routes
│   │   └── index.ts            # Server Initialization (Port 5000)
│   ├── tsconfig.json
│   └── .env.example
│
└── package.json                # Workspaces Configuration & Dev Scripts
```

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
- Copy `client/.env.example` to `client/.env`
- Copy `server/.env.example` to `server/.env`

### 3. Run Development Servers
```bash
# Run both Frontend (port 5173) and Backend (port 5000) concurrently:
npm run dev

# Or run separately:
npm run dev:client
npm run dev:server
```

### 4. Build for Production
```bash
npm run build
```

---

## 🔒 Security Principles
- **No Secret Leaking:** AI API keys and database service-role secrets reside strictly on the server.
- **Source Transparency:** All events cite original, verified publications without fabricated sources.
- **Adaptive Comprehension:** Multi-level explanations (Very Simple, Beginner, Student, Technical, Deep Dive).
