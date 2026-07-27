# 🚀 Full-Stack Free Deployment Guide: Render & Vercel

This guide provides step-by-step instructions for deploying your **AI Course Assistant** application using 100% free tier services:
- **Backend**: [Render](https://render.com) (FastAPI Python API)
- **Frontend**: [Vercel](https://vercel.com) (Vite + React)
- **Database & Storage**: [Supabase](https://supabase.com) (PostgreSQL + Bucket Storage)
- **Vector DB**: [Pinecone](https://pinecone.io) (RAG Embeddings)

---

## 📋 Prerequisites Checklist

Before you begin, ensure you have active accounts for:
- [GitHub](https://github.com)
- [Render](https://render.com)
- [Vercel](https://vercel.com)
- [Supabase](https://supabase.com)
- [OpenAI API](https://platform.openai.com)
- [Pinecone](https://pinecone.io)

Your code repository must be pushed up to GitHub:
`https://github.com/qwertypress1/AI_Course_Assistant_Architecture`

---

## 🗄️ Step 1: Prepare Database & External Services

### 1. Supabase (PostgreSQL & Storage)
1. Go to your **Supabase Dashboard**.
2. Copy the following keys from **Project Settings -> API** & **Database**:
   - `DATABASE_URL`: Connection string (PostgreSQL URI with password).
   - `SUPABASE_URL`: Project URL (e.g., `https://xyz.supabase.co`).
   - `SUPABASE_KEY`: `service_role` secret key.
3. Ensure a storage bucket named `course-documents` is created in Supabase Storage with public/read access as required.

### 2. Pinecone & OpenAI
1. Get your `PINECONE_API_KEY` and set `PINECONE_INDEX_NAME` (e.g., `course-assistant-vectors`).
2. Get your `OPENAI_API_KEY` from OpenAI.

---

## ⚙️ Step 2: Deploy Backend to Render

1. Log in to **[Render.com](https://render.com)**.
2. Click **New +** -> **Web Service**.
3. Select **Connect a repository** and choose `qwertypress1/AI_Course_Assistant_Architecture`.
4. Configure the service settings:

   | Setting | Required Value |
   | :--- | :--- |
   | **Name** | `course-assistant-backend` |
   | **Language** | `Python 3` |
   | **Branch** | `main` |
   | **Region** | Any (e.g., `Oregon (US West)`) |
   | **Root Directory** | `backend` *(CRITICAL!)* |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
   | **Instance Type** | `Free` |

5. Scroll down to **Environment Variables** and add all the following keys:

   | Key | Example / Description |
   | :--- | :--- |
   | `DATABASE_URL` | *Your Supabase PostgreSQL URI* |
   | `OPENAI_API_KEY` | `sk-...` |
   | `PINECONE_API_KEY` | *Your Pinecone API Key* |
   | `PINECONE_INDEX_NAME` | `course-assistant-vectors` |
   | `JWT_SECRET` | *Random secret key for Auth tokens* |
   | `JWT_REFRESH_SECRET` | *Random secret key for Refresh tokens* |
   | `SUPABASE_URL` | `https://xyz.supabase.co` |
   | `SUPABASE_KEY` | *Your Supabase service role key* |
   | `SUPABASE_STORAGE_BUCKET` | `course-documents` |
   | `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` *(Temporary until Vercel URL is created)* |

6. Click **Create Web Service**.
7. Wait ~3–5 minutes for the build to finish.
8. Once deployed, note down your backend URL (e.g., `https://course-assistant-backend.onrender.com`).

---

## 🌐 Step 3: Deploy Frontend to Vercel

1. Log in to **[Vercel.com](https://vercel.com)**.
2. Click **Add New...** -> **Project**.
3. Import your repository: `qwertypress1/AI_Course_Assistant_Architecture`.
4. Configure the project settings:

   | Setting | Value |
   | :--- | :--- |
   | **Framework Preset** | `Vite` |
   | **Root Directory** | Click *Edit* -> Select `frontend` |
   | **Build Command** | `npm run build` (default) |
   | **Output Directory** | `dist` (default) |

5. Expand **Environment Variables** and add:

   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://course-assistant-backend.onrender.com/api/v1` *(Replace with your Render URL + `/api/v1`)* |

6. Click **Deploy**.
7. Wait ~1–2 minutes. Vercel will generate your live URL (e.g., `https://ai-course-assistant-architecture.vercel.app`).

---

## 🔄 Step 4: Synchronize CORS Settings

To allow your Vercel frontend to talk to your Render backend without browser blocking:

1. Return to your **Render Dashboard**.
2. Select your `course-assistant-backend` service -> Go to **Environment**.
3. Update the `CORS_ORIGINS` environment variable to include your Vercel production URL:
   ```text
   CORS_ORIGINS = https://ai-course-assistant-architecture.vercel.app,http://localhost:5173
   ```
4. Click **Save Changes**. Render will automatically trigger a light redeploy.

---

## 🛠️ Troubleshooting & Verification

### Issue 1: "Failed to create account" during Signup
- **Symptom**: Password fits requirements, but signup fails with generic error.
- **Cause**: Frontend defaults to `http://localhost:8000/api/v1` because `VITE_API_BASE_URL` was not configured in Vercel.
- **Fix**: Make sure `VITE_API_BASE_URL` is set in Vercel **Settings -> Environment Variables** to `https://<your-render-backend>.onrender.com/api/v1`, and redeploy the frontend on Vercel (**Deployments -> ... -> Redeploy**).

### Issue 2: Render Free Tier Cold Starts
- Render free instances spin down after 15 minutes of inactivity.
- The first request after inactivity might take 30–50 seconds to respond while the server wakes up.

---

## 🎉 Success Verification Checklist

- [ ] Backend status check: Navigate to `https://<your-render-app>.onrender.com/docs` to see FastAPI Swagger UI.
- [ ] Account creation: Register a test account on your live Vercel web app.
- [ ] Login test: Sign in with the registered credentials.
- [ ] Course & Chat test: Create a course and test asking the AI assistant a question.
