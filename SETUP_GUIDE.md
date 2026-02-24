# 🚀 ChatGPT MVP — Complete Setup Guide

## ✅ Final Folder Structure

```
CONTEXT/
├── backend/
│   ├── app/
│   │   ├── main.py              ← FastAPI app entry point
│   │   ├── core/
│   │   │   ├── config.py        ← pydantic-settings (env vars)
│   │   │   └── security.py      ← JWT create/decode
│   │   ├── db/
│   │   │   ├── base.py          ← SQLAlchemy declarative base
│   │   │   └── session.py       ← Async engine + session factory
│   │   ├── models/
│   │   │   ├── user.py          ← Users ORM model
│   │   │   └── message.py       ← Messages ORM model
│   │   ├── schemas/
│   │   │   ├── user_schema.py   ← Pydantic user schemas
│   │   │   └── message_schema.py ← Pydantic message schemas
│   │   ├── services/
│   │   │   ├── auth_service.py  ← Google token verify + user upsert
│   │   │   └── chat_service.py  ← Message save + history
│   │   └── api/
│   │       ├── deps.py          ← FastAPI dependencies (JWT guard)
│   │       ├── auth_routes.py   ← POST /auth/google
│   │       └── chat_routes.py   ← POST /chat/message, GET /chat/history
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── LoginPage.jsx    ← Google login UI
    │   │   └── ChatPage.jsx     ← Main chat interface
    │   ├── components/
    │   │   ├── ChatMessage.jsx  ← Message bubble component
    │   │   └── ChatInput.jsx    ← Auto-resize textarea + send button
    │   ├── services/
    │   │   └── api.js           ← Axios with JWT interceptor
    │   ├── context/
    │   │   └── AuthContext.jsx  ← Global auth state
    │   ├── App.jsx              ← Router + providers
    │   ├── main.jsx             ← React DOM mount
    │   └── index.css            ← Tailwind + custom styles
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── .env.example
```

---

## 🔧 STEP 1 — Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Add **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   ```
7. Add **Authorized redirect URIs**:
   ```
   http://localhost:5173
   ```
8. Click **Create** — copy your **Client ID**

> ⚠️ The Client ID ends with `.apps.googleusercontent.com`

---

## 🗄️ STEP 2 — Neon Postgres Database Setup

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Click **New Project**
3. Choose a region closest to you
4. After creation, go to **Connection Details**
5. Select **Connection string** → **Asyncpg format**
6. Copy the connection string — it looks like:
   ```
   postgresql+asyncpg://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

> ✅ Tables (users, messages) are created automatically on backend startup!  
> No manual SQL needed.

---

## ⚙️ STEP 3 — Backend Environment Setup

```bash
# 1. Open a terminal in the backend directory
cd CONTEXT/backend

# 2. Copy the example env file
cp .env.example .env        # Linux/Mac
copy .env.example .env      # Windows

# 3. Edit .env with your values
```

Edit `backend/.env`:
```env
APP_NAME="ChatGPT MVP"
DEBUG=True

# Generate with: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=your_generated_secret_here

JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# From Google Cloud Console
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com

# From Neon dashboard
DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

FRONTEND_URL=http://localhost:5173
```

---

## ⚙️ STEP 4 — Frontend Environment Setup

```bash
cd CONTEXT/frontend

cp .env.example .env        # Linux/Mac
copy .env.example .env      # Windows
```

Edit `frontend/.env`:
```env
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

---

## 📦 STEP 5 — Install Dependencies

### Backend
```bash
cd CONTEXT/backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### Frontend
```bash
cd CONTEXT/frontend
npm install   # Already done — but run again if needed
```

---

## 🚀 STEP 6 — Run the Application

### Terminal 1 — Backend
```bash
cd CONTEXT/backend
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

uvicorn app.main:app --reload --port 8000
```

✅ Backend running at: http://localhost:8000  
✅ Swagger UI: http://localhost:8000/docs  
✅ Health check: http://localhost:8000/health

### Terminal 2 — Frontend
```bash
cd CONTEXT/frontend
npm run dev
```

✅ Frontend running at: http://localhost:5173

---

## 🔑 API Endpoints Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/google` | ❌ Public | Exchange Google ID token → JWT |
| POST | `/api/v1/chat/message` | ✅ JWT | Save a new message |
| GET | `/api/v1/chat/history` | ✅ JWT | Get paginated message history |
| GET | `/health` | ❌ Public | Health check |

---

## 🔐 Authentication Flow (Text Diagram)

```
┌─────────────┐         ┌─────────────────┐         ┌──────────────┐
│   Frontend  │         │    Google OAuth  │         │  FastAPI     │
│  (React)    │         │   (Google CDN)   │         │  Backend     │
└─────┬───────┘         └────────┬────────┘         └──────┬───────┘
      │                          │                          │
      │  1. User clicks          │                          │
      │    "Login with Google"   │                          │
      │─────────────────────────►│                          │
      │                          │                          │
      │  2. Google shows consent │                          │
      │     & login popup        │                          │
      │◄─────────────────────────│                          │
      │                          │                          │
      │  3. User approves        │                          │
      │─────────────────────────►│                          │
      │                          │                          │
      │  4. Google returns       │                          │
      │     ID Token (JWT)       │                          │
      │◄─────────────────────────│                          │
      │                          │                          │
      │  5. POST /auth/google    │                          │
      │     { id_token: "..." }  │                          │
      │─────────────────────────────────────────────────────►
      │                          │                          │
      │                          │  6. Verify token at      │
      │                          │  oauth2.googleapis.com   │
      │                          │◄─────────────────────────│
      │                          │                          │
      │                          │  7. Google confirms token │
      │                          │─────────────────────────►│
      │                          │                          │
      │                          │    8. Upsert user in DB  │
      │                          │    9. Create JWT          │
      │                          │                          │
      │  10. Returns:            │                          │
      │  { access_token, user }  │                          │
      │◄─────────────────────────────────────────────────────
      │                          │                          │
      │  11. Store JWT in        │                          │
      │      localStorage        │                          │
      │                          │                          │
      │  12. All future requests │                          │
      │  → Authorization: Bearer │                          │
      │─────────────────────────────────────────────────────►
      │                          │                          │
      │  13. Backend validates   │                          │
      │      JWT, loads user     │                          │
      │      from DB             │                          │
      │                          │                          │
      │  14. Returns data ✅     │                          │
      │◄─────────────────────────────────────────────────────
```

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `GOOGLE_CLIENT_ID not matching` | Ensure same Client ID in both `.env` files |
| `Database connection refused` | Check Neon connection string has `?sslmode=require` |
| `CORS error in browser` | Ensure `FRONTEND_URL=http://localhost:5173` in backend `.env` |
| `401 Unauthorized` | JWT expired — log out and log in again |
| `422 Unprocessable Entity` | Request body validation failed — check Swagger docs |
| Google popup blocked | Allow popups for `localhost:5173` in browser settings |

---

## 🔮 Phase 2 Roadmap (Next Steps)

- [ ] Connect OpenAI / Groq / Claude API for AI responses
- [ ] Add `assistant` role messages with streaming
- [ ] Multiple conversation threads (sidebar history)
- [ ] Message search
- [ ] Rate limiting
- [ ] Production deployment (Railway + Vercel)
