# Arena for Creatives (AFC) v2.0

A competitive art platform for Filipino digital artists featuring 4-phase submissions, reaction-based prizes, and gamification.

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS (Dark Mode)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: Zustand
- **Icons**: Lucide React

## 📋 Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Save your project URL and anon key

### 2. Setup Database

Run these SQL files in order in Supabase SQL Editor:

```
database/01-schema.sql
database/02-functions.sql
database/03-triggers.sql
database/04-policies.sql
database/05-seed.sql
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment

Create `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run Development Server

```bash
npm run dev
```

## 🎨 Features

### User Features
- 4-phase artwork submission (Sketch → Line Art → Base Colors → Final)
- Reaction-based voting (like, love, fire, clap, star)
- XP & leveling system (20 levels)
- Follow artists
- Comment on entries with replies
- Notifications
- Profile customization

### Admin Features
- Create and manage contests
- Review and approve submissions
- Finalize contests and distribute prizes
- View analytics

## 💰 Prize System

```
Prize Pool = Total reactions on top 3 entries

Distribution:
- 1st Place: 50%
- 2nd Place: 20%
- 3rd Place: 10%
- Platform: 20%
```

## 📁 Project Structure

```
src/
├── app/                 # App shell (Router, Providers)
├── components/
│   ├── ui/             # Reusable UI components
│   ├── layout/         # Layout components
│   ├── features/       # Feature-specific components
│   └── shared/         # Shared components
├── pages/
│   ├── public/         # Public pages
│   ├── auth/           # Auth pages
│   ├── user/           # User pages
│   └── admin/          # Admin pages
├── lib/                # Utilities
├── hooks/              # Custom hooks
├── stores/             # Zustand stores
├── types/              # TypeScript types
└── config/             # Configuration

database/
├── 01-schema.sql       # Tables
├── 02-functions.sql    # Functions
├── 03-triggers.sql     # Triggers
├── 04-policies.sql     # RLS policies
└── 05-seed.sql         # Seed data
```

## 🔐 User Roles

- **User**: Browse, submit, react, follow, comment
- **Admin**: All user functions + admin dashboard

## 📦 Contest Categories

- Art
- Cosplay
- Photography
- Music
- Video

## 🚀 Deployment

### Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

## 📄 License

Proprietary - All rights reserved
