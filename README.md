# 🚀 Intern Navigator - AI-Powered Internship Roadmap Platform

> **EEF (Ezitech Engineering Framework)** - Generate dynamic, personalized engineering roadmaps powered by AI

[![Deploy to Cloudflare](https://img.shields.io/badge/Deploy%20to-Cloudflare%20Pages-orange)](https://pages.cloudflare.com/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-green)](https://supabase.com/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)

## ✨ Features

- 🤖 **AI Roadmap Generation** - Personalized learning paths based on skills, goals, and progress
- 👥 **Role-Based Access** - Intern, Mentor, and Admin dashboards
- 📊 **Skill Tracking** - Track proficiency levels and identify gaps
- 📚 **Case Study Management** - Curated projects matched to skill level
- 🔔 **Smart Notifications** - Stay updated on goals, reviews, and deadlines
- 📈 **Progress Analytics** - Job readiness and promotion readiness scores
- 🎯 **Weekly & Monthly Goals** - AI-generated objectives
- ⚡ **Real-time Updates** - Powered by Supabase

## 🛠️ Tech Stack

- **Frontend**: React 19, TanStack Router, Tailwind CSS 4.2
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Build**: Vite 8, TypeScript 5.8
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS with custom design system
- **Deployment**: Cloudflare Pages

## 🚀 Quick Start

### Prerequisites

- Node.js 24+ (LTS recommended)
- npm or yarn
- Supabase account (free tier works!)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/intern-navigator.git
cd intern-navigator
npm install
```

### 2. Environment Setup

Create a `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

Get your Supabase credentials from: [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API

### 3. Database Setup

Run the database migrations in your Supabase SQL Editor:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. Run all migration files from `supabase/migrations/` in order

This will create:
- 12 database tables (profiles, roadmaps, skills, etc.)
- Row Level Security policies
- Database functions and triggers
- Sample data (30 skills, 10 case studies)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### 5. Create Your Account

1. Click "Get Started"
2. Fill in your details
3. Create your account
4. Start exploring!

## 📦 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

## 🌐 Deploy to Cloudflare Pages (FREE!)

### Quick Deploy

1. **Push to GitHub** (you're already here!)

2. **Sign up for Cloudflare**: [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
   - ✅ No credit card required
   - ✅ Completely free tier

3. **Create Pages Project**:
   - Go to Cloudflare Dashboard → Pages
   - Click "Create a project"
   - Connect your GitHub repository
   - Configure build settings:
     ```
     Build command: npm run build
     Build output directory: .output/public
     ```

4. **Add Environment Variables** in Cloudflare:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`

5. **Deploy!** 
   - Click "Save and Deploy"
   - Your app will be live at `https://your-project.pages.dev`

6. **Update Supabase Settings**:
   - Add your Cloudflare URL to Supabase Authentication → URL Configuration
   - Add redirect URLs: `https://your-project.pages.dev/**`

## 🎨 Design System

Custom cyber-tech theme with:
- 🌌 Dark mode by default
- 💠 Cyan accent colors with glow effects
- ✨ Gradient text animations
- 🔮 Glassmorphism panels
- 📱 Fully responsive design

## 📁 Project Structure

```
intern-navigator/
├── src/
│   ├── routes/              # App pages and routing
│   │   ├── _authenticated/  # Protected routes
│   │   ├── __root.tsx       # Root layout
│   │   ├── auth.tsx         # Authentication page
│   │   └── index.tsx        # Landing page
│   ├── components/          # Reusable UI components
│   ├── integrations/        # Supabase & external services
│   ├── lib/                 # Utility functions
│   └── styles.css           # Global styles
├── supabase/                # Database migrations
├── public/                  # Static assets
└── package.json
```

## 👥 User Roles

### Intern
- View personalized roadmap
- Track skills and progress
- Complete case studies
- View notifications
- Set preferences

### Mentor
- View assigned interns
- Review intern work
- Provide feedback
- Trigger roadmap regeneration

### Admin
- Manage all users
- Create invite codes
- Curate case studies
- View audit logs
- System configuration

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Server-side API key protection
- JWT-based authentication
- HTTPS-only in production
- Environment variable validation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 🙋 Support

For issues or questions:
- Open an issue on GitHub
- Check Supabase logs for backend errors
- Review browser console for frontend errors

## 🎉 Acknowledgments

- Built with [TanStack Start](https://tanstack.com/start)
- Backend powered by [Supabase](https://supabase.com/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ for engineering interns everywhere**
