# SAY — Sound Around You 🎵

> Aesthetic Micro-Blogging for True Audiophiles: Share the exact 30 seconds that moves your soul.

---

## 🏛 Architecture Overview

This monorepo is engineered as a high-performance **Modular Monolith** backend paired with a reactive **React 19 + Tailwind CSS** frontend, following international clean architecture standards (3-Tier Layered Architecture with strict Domain Boundary Isolation):

```
say-app/
├── backend/                         # Spring Boot 3.x (Java 21) - Modular Monolith
│   ├── src/main/java/com/say/backend/
│   │   ├── common/                  # Cross-cutting concerns (Config, ExceptionHandler, ApiResponse, Utils)
│   │   ├── modules/                 # Modular Domain Subsystems (Ready for Microservices extraction)
│   │   │   ├── auth/                # Google OAuth2, User Profiles, Audiophile Ranks
│   │   │   ├── note/                # 30s Snippet Notes, Templates (Vinyl, Cassette, Receiptify, Stamp), Streaks
│   │   │   ├── reply/               # Song Dialogue Responses
│   │   │   ├── social/              # Friendships, Connections, Friends Feed
│   │   │   └── music/               # Spotify & YouTube API Integrations
│   │   └── SayBackendApplication.java
│   ├── src/main/resources/
│   │   ├── application.yml          # Multi-profile config (local, prod)
│   │   └── schema.sql               # PostgreSQL Schema with uuid-ossp
│   ├── pom.xml
│   └── Dockerfile                   # Multi-stage production container
│
├── frontend/                        # React 19 + Vite + Tailwind CSS (JavaScript)
│   ├── src/
│   │   ├── assets/                  # Icons, illustrations
│   │   ├── components/              # StudioModal, MusicCard, PlayerDock, Navbar
│   │   ├── pages/                   # Landing, Feed, Profile (Sonic Aura Calendar), Friends
│   │   ├── services/                # Axios/Fetch API callers
│   │   ├── store/                   # Reactive State Management
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js           # Midnight Petrol design system tokens
│   └── vite.config.js
│
├── docker-compose.yml               # PostgreSQL 16 local development container
├── .gitignore
└── README.md
```

---

## 🎨 Design System: Midnight Petrol
- **Background**: `#081724`
- **Surface**: `#142C40`
- **Elevated Border**: `#31566A`
- **Primary Accent**: `#91B9C5`
- **Secondary Accent**: `#B39DDB`
- **Text**: `#E8EEF0`

---

## 🚀 Getting Started

### 1. Start PostgreSQL with Docker
```bash
docker compose up -d
```
The database initialization script `backend/src/main/resources/schema.sql` runs automatically on initial startup.

### 2. Run Backend (Spring Boot 3 + Java 21)
```bash
cd backend
./mvnw spring-boot:run
```
The backend API server runs at `http://localhost:8080/api/v1`.

### 3. Run Frontend (React 19 + Vite)
```bash
cd frontend
npm install
npm run dev
```
The frontend application will be live at `http://localhost:5173`.

---

## 🧪 CI/CD & Production Build
- **Backend Docker build**:
  ```bash
  docker build -t say-backend:latest ./backend
  ```
- **Frontend Production bundle**:
  ```bash
  cd frontend && npm run build
  ```
