<div align="center">

# 💊 Healthcare AI

### Intelligent Health Companion

An AI-powered medication management and health assistant built with **React 19**, **TypeScript**, **FastAPI**, and **Google Gemini AI**.

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## ✨ Features

### 🤖 AI-Powered Health Assistant
- **Chat Consultant** — Ask health questions with full conversation context
- **Image Analysis** — Upload photos of symptoms or pills for AI assessment
- **Voice Mode** — Real-time bidirectional voice assistant via Gemini Live API
- **Medical Disclaimers** — Every AI response includes professional guidance reminders

### 📷 Smart Scanning
- **Medication Scanner** — Point your camera at any pill for instant AI identification (name, dosage, usage)
- **Prescription Scanner** — Upload a prescription image to auto-extract all medications with dosage and frequency

### 💊 Medication Management
- **Add / Delete Medications** — Track name, dosage, frequency, instructions, and stock count
- **Stock Monitoring** — Visual progress bars with low-stock warnings (< 5 units)
- **Profile Scoping** — Medications are isolated per family member profile

### ⏰ Reminders & Alarms
- **Configurable Reminders** — Set multiple time-based reminders per medication
- **Real-Time Alarms** — Full-screen modal with animated UI and audio notification
- **Browser Notifications** — Native push notifications when alarms trigger
- **Smart Scheduling** — Day-of-week selection and custom messages

### 📊 Insights & Analytics
- **Adherence Tracking** — Daily dose logging with custom date/time
- **Interactive Charts** — Bar charts and pie charts powered by Recharts
- **AI Health Summaries** — One-click AI-generated analysis of your health data
- **Trend Analysis** — Weekly adherence trends and per-medication stats

### 👤 User Management
- **Authentication** — Sign up / login with email and password
- **Demo Mode** — One-click demo access without registration
- **Family Profiles** — Manage medications for multiple family members
- **Offline Support** — Full access to cached data when server is unavailable

### 🎨 Premium UI
- **Glassmorphism Design** — Frosted-glass cards with subtle transparency
- **Micro-Animations** — 8+ smooth CSS animations (fade, scale, float, pulse, shimmer)
- **Responsive Layout** — Desktop sidebar + mobile bottom navigation
- **Modern Typography** — Inter & Outfit fonts from Google Fonts

---

## 🛠️ Tech Stack

| Layer        | Technology                                         |
|--------------|----------------------------------------------------|
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS            |
| **Backend**  | Python, FastAPI, Uvicorn, Pydantic                 |
| **AI**       | Google Gemini AI (`gemini-3-flash-preview`)        |
| **Charts**   | Recharts 2.15                                      |
| **Icons**    | Lucide React                                       |
| **Storage**  | JSON file persistence + localStorage fallback      |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Python** (v3.8+)
- **Google Gemini API Key** — [Get one here](https://aistudio.google.com/apikey)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/healthcare-ai.git
cd healthcare-ai
npm install
```

### 2. Configure API Key

Edit `.env.local` and add your Gemini API key:

```env
GEMINI_API_KEY=your_api_key_here
```

### 3. Start the Frontend

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

### 4. Start the Backend (Optional)

```bash
pip install fastapi uvicorn pydantic[email]
python server.py
```

The API server runs at **http://localhost:8000**

> **Note**: The app works without the backend — it falls back to localStorage for data persistence.

---

## 📁 Project Structure

```
healthcare-ai/
├── index.html                  # Entry HTML with importmap
├── index.tsx                   # React root
├── index.css                   # Glassmorphism design system
├── App.tsx                     # Root component & state management
├── types.ts                    # TypeScript interfaces & enums
├── server.py                   # FastAPI backend
├── .env.local                  # API key config
│
├── components/
│   ├── Auth.tsx                # Login / Signup / Demo Access
│   ├── Dashboard.tsx           # Stats, charts, quick actions
│   ├── AIConsultant.tsx        # AI chat + voice assistant
│   ├── MedicationScanner.tsx   # Camera pill identification
│   ├── PrescriptionScanner.tsx # Prescription OCR
│   ├── MedicationForm.tsx      # Add medication form
│   ├── MedicationAlarm.tsx     # Full-screen alarm modal
│   ├── ReminderSettings.tsx    # Reminder configuration
│   ├── LogDoseModal.tsx        # Dose logging
│   ├── Insights.tsx            # Analytics & AI summaries
│   ├── UserProfile.tsx         # Profile management
│   ├── HelpCenter.tsx          # FAQ & support
│   ├── Sidebar.tsx             # Desktop navigation
│   └── MobileNav.tsx           # Mobile bottom nav
│
└── services/
    ├── dbService.ts            # REST API + localStorage
    ├── geminiService.ts        # Gemini AI integration
    └── supabaseClient.ts       # Deprecated stub
```

---

## 🔌 API Endpoints

All data endpoints require the `X-User-Email` header.

| Method | Endpoint            | Description              |
|--------|---------------------|--------------------------|
| POST   | `/api/register`     | Create new user account  |
| POST   | `/api/login`        | Authenticate user        |
| GET    | `/api/medications`  | Get user medications     |
| POST   | `/api/medications`  | Save medications         |
| GET    | `/api/adherence`    | Get adherence records    |
| POST   | `/api/adherence`    | Save adherence records   |
| GET    | `/api/logs`         | Get health logs          |
| POST   | `/api/logs`         | Save health logs         |
| GET    | `/api/profile`      | Get user profile         |
| POST   | `/api/profile`      | Save user profile        |

---

## 📸 Screenshots

> _Add screenshots of the application here._

---

## 📄 Documentation

- [**SRS Document**](SRS_Document.md) — Software Requirements Specification
- [**Project Report**](Project_Report.md) — Comprehensive project report

---

## ⚠️ Disclaimer

Healthcare AI is an **informational tool** for medication tracking and AI-assisted health queries. It is **not** a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions.

---

## 📝 License

This project is licensed under the MIT License.

---

<div align="center">

**Built with ❤️ using React, FastAPI, and Google Gemini AI**

</div>
