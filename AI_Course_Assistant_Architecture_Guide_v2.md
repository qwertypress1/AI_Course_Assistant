# AI Course Assistant Chatbot — Complete Architecture Guide v2

---

## 1. Project Overview

### What the System Does

The AI Course Assistant Chatbot is a Retrieval-Augmented Generation (RAG) system designed for university students. Students upload course documents — PDFs, scanned notes, and images — which are processed through an OCR and text extraction pipeline, chunked, embedded into vector representations, and stored in a vector database. When a student asks a question, the system retrieves the most semantically relevant document chunks, assembles them into a context window, and uses a large language model to generate an answer grounded exclusively in the uploaded content. Every answer cites its source document and page number, and the system explicitly refuses to answer when no relevant information exists in the uploaded materials.

### User Roles

| Role | Description |
|------|-------------|
| **Student** | Uploads course documents, asks questions via chat, views chat history, manages own documents. |
| **Lecturer** | Creates and manages courses, views enrolled students and uploaded documents, monitors student usage, can upload documents on behalf of the course. |
| **Admin** | Full system access: manages all users (promote, demote, ban), views system-wide usage statistics, manages courses, monitors system health, manages system configuration. |

### Core Value Proposition

Students spend hours searching through hundreds of pages of lecture slides, notes, and textbooks to find answers to specific questions. This system eliminates that search time by providing instant, cited, ground-truth answers extracted directly from their own course materials. The key constraint — answers come only from uploaded content — prevents hallucinated or irrelevant responses and ensures academic integrity.

### Why RAG Over Fine-Tuning

| Factor | RAG | Fine-Tuning |
|--------|-----|-------------|
| **Data freshness** | Documents can be updated immediately; new uploads are searchable instantly. | Requires retraining, which takes hours and costs money per cycle. |
| **Cost** | Embedding a 100-page PDF costs ~$0.0004. Fine-tuning a model costs $5–$50+ per training run. | Recurring training costs scale linearly with course count. |
| **Attribution** | Each answer maps to exact source chunks with document name and page number. | Fine-tuned models cannot reliably cite where knowledge came from. |
| **Scope isolation** | Each course's data lives in its own Pinecone namespace; students only query their own course content. | Fine-tuning a single model with all course data makes scope isolation impossible without multiple models. |
| **Transparency** | The retrieval step is inspectable — you can see exactly what chunks were retrieved and why they influenced the answer. | Fine-tuned weights are opaque; debugging incorrect answers is extremely difficult. |
| **Implementation complexity** | Standard pipeline with well-documented libraries. | Requires training infrastructure, dataset formatting, evaluation pipelines, and ongoing maintenance. |

RAG is the correct architectural choice for this project because it is cheaper, more transparent, more maintainable, and provides source attribution — a hard requirement for an academic tool.

---

## 2. System Architecture

### Full Architecture Diagram

```
+-----------------------------------------------------------------------------+
|                              CLIENT LAYER                                   |
|                                                                             |
|   +---------------------------------------------------------------------+   |
|   |                    React Frontend (Vercel)                          |   |
|   |                                                                     |   |
|   |  +----------+ +----------+ +----------+ +----------+ +---------+  |   |
|   |  |  Login   | |Dashboard | |  Course  | |   Chat   | |  Admin  |  |   |
|   |  |  Page    | |  Page    | |  View    | |   View   | |  Panel  |  |   |
|   |  +----------+ +----------+ +----------+ +----------+ +---------+  |   |
|   |                                                                     |   |
|   |  +--------------------------------------------------------------+  |   |
|   |  |   Axios Client (JWT interceptors)                            |  |   |
|   |  |   EventSource / fetch ReadableStream (SSE streaming)         |  |   |
|   |  |   React Context (auth state)                                 |  |   |
|   |  +--------------------------------------------------------------+  |   |
|   +------------------------------+-------------------------------------+   |
|                                  | HTTPS                                    |
+----------------------------------+-------------------------------------------+
                                   |
+----------------------------------+-------------------------------------------+
|                           API GATEWAY LAYER                                  |
|                                  |                                            |
|   +------------------------------+-------------------------------------+    |
|   |                   FastAPI Backend (Render)                          |    |
|   |                                                                     |    |
|   |  +-------------------------------------------------------------+   |    |
|   |  |              Middleware Pipeline                             |   |    |
|   |  |  CORS -> Rate Limiter -> JWT Auth -> Request Logger -> Route |   |    |
|   |  +-------------------------------------------------------------+   |    |
|   |                                                                     |    |
|   |  +-------------------------------------------------------------+   |    |
|   |  |                   Route Handlers                             |   |    |
|   |  |  /auth/*  /documents/*  /chat/*  /courses/*  /admin/*       |   |    |
|   |  +-------------------------------------------------------------+   |    |
|   |                                                                     |    |
|   |  +-------------------------------------------------------------+   |    |
|   |  |                  Service Layer                               |   |    |
|   |  |  +----------+ +----------+ +----------+ +--------------+   |   |    |
|   |  |  |  Auth    | |Document  | |  Chat    | |  Document    |   |   |    |
|   |  |  | Service  | | Service  | | Service  | |  Processing  |   |   |    |
|   |  |  +----------+ +----------+ +----------+ +--------------+   |   |    |
|   |  |  +----------+ +----------+                                |   |    |
|   |  |  |  Admin   | |  Course  |                                |   |    |
|   |  |  | Service  | | Service  |                                |   |    |
|   |  |  +----------+ +----------+                                |   |    |
|   |  +-------------------------------------------------------------+   |    |
|   |                                                                     |    |
|   |  +-------------------------------------------------------------+   |    |
|   |  |               Background Tasks                              |   |    |
|   |  |  FastAPI BackgroundTasks (dev)  OR  Redis + Worker (prod)  |   |    |
|   |  +-------------------------------------------------------------+   |    |
|   +---------------------------------------------------------------------+    |
|                                                                              |
|   +------------------+  +------------------+  +--------------------------+   |
|   |  PostgreSQL       |  |  Supabase        |  |  OpenAI API              |   |
|   |  (Supabase)       |  |  Storage         |  |                          |   |
|   |                    |  |  (S3-compatible) |  |  +------------------+   |   |
|   |  - users           |  |                  |  |  | Embeddings API   |   |   |
|   |  - courses         |  |  - course files  |  |  | text-embedding-  |   |   |
|   |  - documents       |  |  - user uploads  |  |  |   3-small        |   |   |
|   |  - chat_sessions   |  |                  |  |  +------------------+   |   |
|   |  - chat_messages   |  |                  |  |  +------------------+   |   |
|   |  - usage_logs      |  |                  |  |  | Chat Completions |   |   |
|   |  - system_config   |  |                  |  |  | gpt-4o-mini      |   |   |
|   |                    |  |                  |  |  +------------------+   |   |
|   +---------+----------+  +------------------+  +--------------------------+   |
|            |                                                                   |
|            |              +----------------------------------------------+     |
|            |              |  Pinecone (Vector Database)                  |     |
|            |              |                                              |     |
|            |              |  Index: course-assistant-vectors             |     |
|            |              |  Dimensions: 1536                            |     |
|            |              |  Metric: cosine                              |     |
|            |              |  Namespaces: one per course_id               |     |
|            |              |                                              |     |
|            |              |  Metadata per vector:                        |     |
|            |              |  - document_id (string)                      |     |
|            |              |  - page_number (int)                         |     |
|            |              |  - chunk_index (int)                         |     |
|            |              |  - filename (string)                         |     |
|            |              |  - uploaded_by (string)                      |     |
|            |              |                                              |     |
|            +--------------|  Vector ID format:                          |     |
|                           |  {doc_id}_chunk_{index}                     |     |
|                           +----------------------------------------------+     |
|                                                                               |
+-------------------------------------------------------------------------------+
```

### Data Flow: Document Upload Pipeline

```
Student selects file
        |
        v
+------------------+     POST /documents/upload
|  React Frontend  | ---------------------------> FastAPI
|  (file upload)   |                               |
+------------------+                               |
                                                   v
                                       +------------------------+
                                       |  1. Validate file      |
                                       |     - MIME type?       |
                                       |     - Size < 10MB?     |
                                       |     - Password-free?   |
                                       +-----------+------------+
                                                   | Pass
                                                   v
                                       +------------------------+
                                       |  2. Store in Supabase  |
                                       |     Storage            |
                                       |     Path: {course_id}/ |
                                       |     {user_id}/{file}   |
                                       +-----------+------------+
                                                   | Success
                                                   v
                                       +------------------------+
                                       |  3. Create document    |
                                       |     record in DB       |
                                       |     status: "pending"  |
                                       +-----------+------------+
                                                   |
                                                   v
                                       +------------------------+
                                       |  4. Return 202 to      |
                                       |     client with doc_id |
                                       +-----------+------------+
                                                   |
                                                   v
                                   +-------------------------------+
                                   |  5. BackgroundTask launched   |
                                   +---------------+---------------+
                                                   |
                                                   v
                                       +------------------------+
                                       |  6. Download file       |
                                       |     from Supabase       |
                                       |     Storage to /tmp     |
                                       +-----------+------------+
                                                   |
                                                   v
                                       +------------------------+
                                       |  7. Detect type         |
                                       |     Digital PDF or      |
                                       |     Scanned Image?      |
                                       +-----------+------------+
                                             |         |
                                 Digital PDF |         | Scanned
                                             v         v
                                 +--------------+ +--------------+
                                 | pdfplumber   | | pytesseract  |
                                 | text extract | | OCR          |
                                 +------+-------+ +------+-------+
                                        |                |
                                        v                v
                                       +------------------------+
                                       |  8. Clean text          |
                                       |     - normalize         |
                                       |     - remove artifacts  |
                                       +-----------+------------+
                                                   |
                                                   v
                                       +------------------------+
                                       |  9. Chunk text          |
                                       |     ~512 tokens/chunk   |
                                       |     ~200 char overlap   |
                                       +-----------+------------+
                                                   |
                                                   v
                                       +------------------------+
                                       | 10. Embed chunks        |
                                       |     OpenAI API          |
                                       |     batch(512)          |
                                       +-----------+------------+
                                                   |
                                                   v
                                       +------------------------+
                                       | 11. Upsert to           |
                                       |     Pinecone            |
                                       |     namespace=course    |
                                       +-----------+------------+
                                                   |
                                                   v
                                       +------------------------+
                                       | 12. Update document     |
                                       |     status: "ready"     |
                                       |     + chunk count       |
                                       +-----------+------------+
                                                   |
                                                   v
                                       +------------------------+
                                       | 13. Cleanup /tmp file   |
                                       +------------------------+
```

### Data Flow: Chat Query Pipeline

```
Student types question
        |
        v
+------------------+     POST /chat/sessions/{id}/messages
|  React Frontend  | --------------------------------------> FastAPI
|  (SSE connection |                                         |
|   established)   |                                         |
+------------------+                                         |
                                                             v
                                                +------------------------------+
                                                |  1. Validate request         |
                                                |     - message non-empty?     |
                                                |     - session belongs to     |
                                                |       this user?             |
                                                +--------------+---------------+
                                                               |
                                                               v
                                                +------------------------------+
                                                |  2. Save user message        |
                                                |     to chat_messages         |
                                                +--------------+---------------+
                                                               |
                                                               v
                                                +------------------------------+
                                                |  3. Embed the question       |
                                                |     OpenAI                   |
                                                |     text-embedding-3-small   |
                                                +--------------+---------------+
                                                               |
                                                               v
                                                +------------------------------+
                                                |  4. Query Pinecone           |
                                                |     namespace = course_id    |
                                                |     top_k = 5                |
                                                |     include_metadata = true  |
                                                +--------------+---------------+
                                                               |
                                                      +--------+--------+
                                                      |                 |
                                                Results >= 0.7     No results or
                                                similarity         all < 0.7
                                                      |                 |
                                                      v                 v
                                   +------------------------+  +-------------------+
                                   |  5. Assemble context   |  |  Return "I don't  |
                                   |     from top chunks    |  |  have relevant    |
                                   |     (max 3000 tokens)  |  |  information"     |
                                   +-----------+------------+  +-------------------+
                                               |
                                               v
                                +------------------------------------------+
                                |  6. Build prompt                         |
                                |                                          |
                                |  System: "You are a course assistant.    |
                                |  Answer ONLY from the context below.     |
                                |  Cite sources as [Doc, p.X].            |
                                |  If irrelevant, say so."                 |
                                |                                          |
                                |  Context: [retrieved chunks]             |
                                |  History: [last 10 messages]             |
                                |  User: [current question]                |
                                +--------------------+---------------------+
                                                     |
                                                     v
                                +------------------------------------------+
                                |  7. Call OpenAI Chat API                 |
                                |     model: gpt-4o-mini                   |
                                |     temperature: 0.1                      |
                                |     top_p: 0.9                           |
                                |     stream: true                          |
                                |     max_tokens: 2048                      |
                                +--------------------+---------------------+
                                                     |
                                                     v  (streaming chunks)
                                +------------------------------------------+
                                |  8. Stream response to client via SSE    |
                                |                                          |
                                |  data: {"type":"chunk","content":        |
                                |    "The answer is..."}                   |
                                |  data: {"type":"chunk","content":        |
                                |    " based on Lecture 3, p.12"}         |
                                |  data: {"type":"sources",               |
                                |    "sources": [{"doc":"Lecture3.pdf",    |
                                |     "page":12,"chunk_id":"abc_5"}]}     |
                                |  data: {"type":"done",                  |
                                |    "tokens_used":342}                   |
                                +--------------------+---------------------+
                                                     |
                                                     v
                                +------------------------------------------+
                                |  9. Save assistant message to DB         |
                                |     with sources JSON and token count    |
                                +--------------------+---------------------+
                                                     |
                                                     v
                                +------------------------------------------+
                                | 10. Log usage to usage_logs              |
                                |     (tokens, model, latency)            |
                                +------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| **React Frontend** | User interface for authentication, document management, chat interaction, and admin panel. Handles JWT storage, SSE streaming, file upload UX, and route protection. |
| **CORS Middleware** | Validates incoming requests against an allowlist of origins. Rejects requests from unauthorized domains at the network level. |
| **Rate Limiter** | Tracks request counts per user per endpoint. Returns HTTP 429 with Retry-After header when limits are exceeded. Different limits per endpoint type. |
| **JWT Auth Middleware** | Extracts and validates the JWT from the Authorization header or httpOnly cookie. Attaches user_id and role to the request state. Returns HTTP 401 on invalid/expired tokens. |
| **Request Logger** | Logs method, path, status code, latency, and user_id for every request. Generates a correlation ID for tracing. |
| **Auth Service** | Handles registration (password hashing with bcrypt), login (password verification, token generation), token refresh, and current user retrieval. |
| **Document Service** | Manages document CRUD: creates database records, uploads files to Supabase Storage, triggers background processing, returns status, handles deletion with storage cleanup. |
| **Document Processing Service** | The core pipeline: file download, type detection, text extraction (pdfplumber or OCR), text cleaning, chunking, embedding, Pinecone upsert, status updates. Runs as a background task. |
| **Chat Service** | Manages chat sessions and messages: creates sessions, embeds questions, queries Pinecone, assembles prompts, streams OpenAI responses, saves messages, tracks token usage. |
| **Course Service** | CRUD operations for courses: creation, listing, enrollment management, document association. |
| **Admin Service** | System-wide operations: user management (list, promote, demote, ban), usage statistics aggregation, system health checks. |
| **Background Task Queue** | Executes document processing asynchronously. Uses FastAPI BackgroundTasks in development; can be swapped for a Redis-backed worker (Celery or RQ) in production without changing service code. |
| **PostgreSQL (Supabase)** | Relational data store for all structured data: users, courses, documents, chat sessions, messages, usage logs, system configuration. Provides ACID guarantees and referential integrity. |
| **Supabase Storage** | Object storage for uploaded files. S3-compatible API. Provides signed URLs for temporary file access. Files are organized by course_id and user_id. |
| **Pinecone** | Vector database for storing and querying document embeddings. Provides sub-second similarity search with metadata filtering. Namespaced by course_id for data isolation. |
| **OpenAI API** | Provides two services: (1) text-embedding-3-small for converting text to 1536-dimensional vectors, and (2) gpt-4o-mini/gpt-4o for generating chat responses with streaming support. |

---

## 3. Technology Stack (with justification)

| Layer | Technology | Version | Why Chosen | Alternatives Rejected |
|-------|-----------|---------|------------|----------------------|
| **Frontend Framework** | React | 18.x | Largest ecosystem, massive community, extensive libraries, Vercel has first-class React support. | Vue.js (smaller ecosystem), Angular (heavier, overkill), Svelte (smaller community) |
| **Frontend Language** | JavaScript (with JSDoc) | ES2022+ | Faster prototyping, sufficient for this project's complexity. | TypeScript (recommended for larger teams but adds build complexity for a solo project) |
| **Frontend Routing** | React Router | 6.x | Standard for React SPAs, nested routes, route guards, widely documented. | TanStack Router (newer, less documentation), Next.js (unnecessary SSR complexity) |
| **Frontend HTTP** | Axios | 1.x | Interceptors for automatic JWT injection, request/response transformation, wide browser support. | fetch API (no interceptors, manual header handling), ky (smaller ecosystem) |
| **Frontend Styling** | Tailwind CSS | 3.x | Utility-first, fast development, consistent design without custom CSS files, small production bundle. | CSS Modules (more files, slower dev), styled-components (runtime overhead), Bootstrap (generic look) |
| **State Management** | React Context + useReducer | 18.x | Built-in, no additional dependency, sufficient for auth state and simple global state. | Redux (too much boilerplate), Zustand (adds dependency for minimal benefit at this scale) |
| **Backend Framework** | FastAPI | 0.110+ | Automatic OpenAPI docs, native async support, Pydantic validation, SSE streaming, Python ecosystem for ML/AI. | Flask (no native async, no built-in validation), Django (too heavy, unnecessary ORM) |
| **Backend Language** | Python | 3.10+ | Required for pytesseract, pdfplumber, and the OpenAI Python SDK. Best ecosystem for document processing and AI. | Node.js (would need separate OCR service), Go (no OCR/AI libraries) |
| **Vector Database** | Pinecone | Serverless | Managed service with zero ops, sub-20ms query latency, native metadata filtering, generous free tier (100k vectors). | Weaviate (self-hosted), Qdrant (self-hosted), Chroma (not production-ready), FAISS (library, not a database) |
| **Relational Database** | PostgreSQL (Supabase) | 15+ | ACID compliance, JSON support, Supabase provides managed hosting with free tier, built-in auth and storage. | MySQL (less feature-rich), MongoDB (no relational integrity), Firebase (vendor lock-in) |
| **File Storage** | Supabase Storage | N/A | Free tier: 1GB storage + 2GB bandwidth/month, S3-compatible API, integrates with Supabase auth for RLS. | AWS S3 (complex IAM), Cloudflare R2 (adds another service), local filesystem (not viable for serverless) |
| **OCR Engine** | Tesseract (pytesseract) | 5.x | Free, open-source, supports 100+ languages, well-documented Python wrapper, no API costs. | Google Cloud Vision (costs money), AWS Textract (costs money), EasyOCR (less accurate for printed text) |
| **PDF Processing** | pdfplumber | 0.10+ | Extracts text and tables from digital PDFs with layout awareness, pure Python, better than PyPDF2 for multi-column layouts. | PyPDF2 (poor text extraction), pdf2image + OCR (slower, unnecessary for digital PDFs) |
| **AI Chat Model** | OpenAI gpt-4o-mini | Latest | Cost-effective ($0.15/1M input tokens), fast streaming, sufficient quality for RAG responses. | GPT-4o (4x more expensive, marginal quality improvement for RAG), Claude (separate API), Llama (requires GPU) |
| **AI Embedding Model** | OpenAI text-embedding-3-small | Latest | 1536 dimensions, $0.02/1M tokens, excellent retrieval performance, no infrastructure needed. | ada-002 (older, same price), Cohere embed (additional API key), Sentence Transformers (requires GPU) |
| **Background Tasks** | FastAPI BackgroundTasks | Built-in | Zero additional infrastructure for dev, sufficient for low-to-medium throughput, swappable for Redis/Celery later. | Celery (requires Redis/RabbitMQ), Huey (less documentation), ARQ (requires Redis) |
| **Rate Limiting** | slowapi | 0.1+ | Built for FastAPI, uses in-memory store (Redis optional), configurable per-user and per-endpoint limits. | Custom middleware (more maintenance), FastAPI-Limiter (less maintained) |
| **Auth** | JWT (PyJWT) | 2.x | Stateless authentication, no session storage needed, works across services, standard for SPAs. | Session-based auth (server-side storage), OAuth (overkill), Supabase Auth (couples auth to Supabase) |
| **Password Hashing** | bcrypt (passlib) | 1.x | Industry standard, adaptive cost factor, resistant to rainbow table attacks. | SHA-256 (not adaptive, insecure), argon2 (less widely supported in Python) |
| **Deployment - Backend** | Render | Free/Basic | Git-based deploys, free tier, managed PostgreSQL option, Docker support, auto-SSL. | Heroku (no free tier), Railway (newer, less docs), AWS (too complex) |
| **Deployment - Frontend** | Vercel | Free Hobby | Optimized for React/Next.js, global CDN, automatic previews per PR, free for personal projects. | Netlify (less React optimization), Cloudflare Pages (limited serverless) |
| **Logging** | structlog | 23.x | Structured JSON logging, integrates with FastAPI, supports correlation IDs, production-ready. | Standard logging (unstructured), loguru (less standard) |
| **Testing** | pytest | 7.x+ | Standard Python test framework, fixtures, parametrize, excellent plugin ecosystem. | unittest (verbose), nose2 (less maintained) |

---

## 4. Database Design

### PostgreSQL Schema

```sql
-- ============================================================
-- ENABLE REQUIRED EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: users
-- ============================================================

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'student'
                  CHECK (role IN ('student', 'lecturer', 'admin')),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_is_active ON users (is_active);

-- ============================================================
-- TABLE: courses
-- ============================================================

CREATE TABLE courses (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    code        VARCHAR(50) NOT NULL,
    description TEXT,
    created_by  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_courses_code ON courses (code);
CREATE INDEX idx_courses_created_by ON courses (created_by);

-- ============================================================
-- TABLE: course_enrollments
-- ============================================================

CREATE TABLE course_enrollments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL DEFAULT 'student'
                CHECK (role IN ('student', 'lecturer')),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_enrollment UNIQUE (course_id, user_id)
);

CREATE INDEX idx_enrollments_course_id ON course_enrollments (course_id);
CREATE INDEX idx_enrollments_user_id ON course_enrollments (user_id);

-- ============================================================
-- TABLE: documents
-- ============================================================

CREATE TABLE documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id           UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    uploaded_by         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    filename            VARCHAR(500) NOT NULL,
    original_name       VARCHAR(500) NOT NULL,
    mime_type           VARCHAR(100) NOT NULL,
    file_size_bytes     BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
    storage_path        VARCHAR(1000) NOT NULL,
    page_count          INTEGER CHECK (page_count IS NULL OR (page_count > 0 AND page_count <= 50)),
    chunk_count         INTEGER DEFAULT 0 CHECK (chunk_count >= 0),
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
    error_message       TEXT,
    processing_time_ms  INTEGER,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_course_id ON documents (course_id);
CREATE INDEX idx_documents_uploaded_by ON documents (uploaded_by);
CREATE INDEX idx_documents_status ON documents (status);

-- ============================================================
-- TABLE: chat_sessions
-- ============================================================

CREATE TABLE chat_sessions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title       VARCHAR(255) DEFAULT 'New Chat',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions (user_id);
CREATE INDEX idx_chat_sessions_course_id ON chat_sessions (course_id);
CREATE INDEX idx_chat_sessions_user_course ON chat_sessions (user_id, course_id);

-- ============================================================
-- TABLE: chat_messages
-- ============================================================

CREATE TABLE chat_messages (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id       UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role             VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content          TEXT NOT NULL,
    sources          JSONB DEFAULT '[]'::jsonb,
    tokens_used      INTEGER DEFAULT 0 CHECK (tokens_used >= 0),
    model_used       VARCHAR(50),
    embedding_tokens INTEGER DEFAULT 0 CHECK (embedding_tokens >= 0),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages (session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages (created_at);

-- ============================================================
-- TABLE: usage_logs
-- ============================================================

CREATE TABLE usage_logs (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
    action           VARCHAR(50) NOT NULL,
    resource_type    VARCHAR(50) NOT NULL,
    resource_id      UUID,
    tokens_input     INTEGER DEFAULT 0 CHECK (tokens_input >= 0),
    tokens_output    INTEGER DEFAULT 0 CHECK (tokens_output >= 0),
    embedding_tokens INTEGER DEFAULT 0 CHECK (embedding_tokens >= 0),
    model_used       VARCHAR(50),
    latency_ms       INTEGER CHECK (latency_ms >= 0),
    cost_usd         NUMERIC(10, 6) DEFAULT 0 CHECK (cost_usd >= 0),
    metadata         JSONB DEFAULT '{}'::jsonb,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_user_id ON usage_logs (user_id);
CREATE INDEX idx_usage_logs_action ON usage_logs (action);
CREATE INDEX idx_usage_logs_created_at ON usage_logs (created_at);

-- ============================================================
-- TABLE: system_config
-- ============================================================

CREATE TABLE system_config (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key         VARCHAR(100) NOT NULL,
    value       TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_config_key UNIQUE (key)
);

-- Default configuration values
INSERT INTO system_config (key, value, description) VALUES
    ('max_documents_per_course', '100', 'Maximum number of documents per course'),
    ('max_chat_messages_per_session', '100', 'Maximum messages per chat session'),
    ('max_concurrent_processing', '5', 'Maximum concurrent document processing tasks'),
    ('daily_openai_budget_usd', '10.00', 'Daily OpenAI spending limit in USD'),
    ('similarity_threshold', '0.7', 'Minimum cosine similarity for RAG retrieval'),
    ('max_tokens_per_context', '3000', 'Maximum tokens allocated for retrieved context');
```

### Text-Based ER Diagram

```
+--------------+       +-------------------+       +--------------+
|    users     |       | course_enrollments |       |   courses    |
+--------------+       +-------------------+       +--------------+
| id (PK, UUID)|<--+   | id (PK, UUID)    |   +-->| id (PK, UUID)|
| email (UQ)   |   +---| user_id (FK)      |   |   | name         |
| password_hash|   |   | course_id (FK)    |---+   | code (UQ)    |
| full_name    |   |   | role              |       | description  |
| role         |   |   | enrolled_at       |       | created_by   |--+
| is_active    |   |   +-------------------+       | is_active    |  |
| created_at   |   |                               | created_at   |  |
| updated_at   |   |                               | updated_at   |  |
+------+-------+   |                               +------+-------+  |
       |           |                                      |          |
       |           |   +--------------+                   |          |
       |           |   |  documents   |                   |          |
       |           |   +--------------+                   |          |
       |           +---| uploaded_by  |                   |          |
       |               | id (PK, UUID)|<------------------┘----------+
       |               | course_id(FK)|
       |               | filename     |
       |               | storage_path |
       |               | status       |
       |               | chunk_count  |
       |               | created_at   |
       |               | updated_at   |
       |               +------+-------+
       |                      |
       |                      |  (chunk metadata references Pinecone vectors
       |                      |   via document_id in Pinecone metadata)
       |                      |
       |               +--------------+        +------------------+
       |               | chat_sessions|        |  chat_messages   |
       |               +--------------+        +------------------+
       +---------------| user_id (FK) |   +--->| id (PK, UUID)    |
                       | id (PK, UUID)|---+    | session_id (FK)  |
                       | course_id(FK)|        | role             |
                       | title        |        | content          |
                       | created_at   |        | sources (JSONB)  |
                       | updated_at   |        | tokens_used      |
                       +--------------+        | model_used       |
                                               | embedding_tokens |
                                               | created_at       |
                                               +------------------+

                       +----------------+
                       |  usage_logs    |
                       +----------------+
+-------------------+  | id (PK, UUID)  |
| users (cont'd)    |  | user_id (FK)   |
+-------------------+  | action         |
| (foreign key)  ----->| resource_type  |
                       | tokens_input   |
                       | tokens_output  |
                       | cost_usd       |
                       | created_at     |
                       +----------------+

                       +----------------+
                       | system_config  |
                       +----------------+
                       | id (PK, UUID)  |
                       | key (UQ)       |
                       | value          |
                       | description    |
                       | created_at     |
                       | updated_at     |
                       +----------------+
```

### Pinecone Index Configuration

| Setting | Value | Justification |
|---------|-------|---------------|
| **Index Name** | `course-assistant-vectors` | Descriptive, avoids conflicts with other projects. |
| **Dimension** | 1536 | Matches `text-embedding-3-small` output dimension. |
| **Metric** | `cosine` | Best for normalized embeddings; produces scores in [0, 1] range where 1 = identical. |
| **Environment** | `us-east-1` (AWS) | Lowest latency for most users, best availability. |
| **Capacity Mode** | Serverless | No infrastructure management, scales to zero, sufficient for university project scale. |

**Namespace Strategy:**

Each course gets its own Pinecone namespace, where the namespace ID equals the `courses.id` UUID. This provides:

1. **Automatic data isolation**: A query scoped to namespace `course-A` can never return vectors from course-B, even by accident.
2. **Efficient deletion**: When a course is deleted, call `pinecone.delete_namespace(course_id)` to remove all vectors in one operation.
3. **Scoped queries**: Every Pinecone query specifies `namespace=course_id`, so no metadata filtering is needed for course-level isolation.

**Metadata Schema per Vector:**

```json
{
    "document_id": "uuid-of-document",
    "page_number": 12,
    "chunk_index": 5,
    "filename": "Lecture_3_Machine_Learning.pdf",
    "uploaded_by": "uuid-of-uploader",
    "course_id": "uuid-of-course"
}
```

**Vector ID Format:** `{document_id}_chunk_{chunk_index}` -- deterministic, prevents duplicates on re-processing, easy to trace back to source.

---

## 5. API Design

### Base URL

All API requests go to: `https://your-backend.onrender.com/api/v1`

### Error Response Format (all endpoints)

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Human-readable description of what went wrong",
        "details": [
            {
                "field": "email",
                "message": "Invalid email format"
            }
        ]
    },
    "correlation_id": "req_abc123xyz"
}
```

**Error Codes:** `VALIDATION_ERROR`, `AUTH_REQUIRED`, `AUTH_INVALID_TOKEN`, `AUTH_TOKEN_EXPIRED`, `AUTH_FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `FILE_TOO_LARGE`, `UNSUPPORTED_FILE_TYPE`, `PROCESSING_FAILED`, `EXTERNAL_SERVICE_ERROR`, `INTERNAL_ERROR`

### Success Response Format (all endpoints)

```json
{
    "success": true,
    "data": { ... },
    "correlation_id": "req_abc123xyz"
}
```

---

### Auth Endpoints

#### POST /api/v1/auth/register

**Auth Required:** No
**Rate Limit:** 5 requests per minute per IP

**Request Body:**
```json
{
    "email": "student@university.edu",
    "password": "SecurePass123!",
    "full_name": "John Doe"
}
```

**Validation Rules:**
- `email`: Valid email format, max 255 chars
- `password`: Min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special character
- `full_name`: 2-255 chars, letters and spaces only

**Response (201):**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "student@university.edu",
            "full_name": "John Doe",
            "role": "student",
            "created_at": "2026-01-15T10:30:00Z"
        },
        "access_token": "eyJhbGciOiJIUzI1NiIs...",
        "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
        "token_type": "Bearer",
        "expires_in": 1800
    }
}
```

**Errors:** `409 CONFLICT` (email already registered), `422 VALIDATION_ERROR` (invalid input)

---

#### POST /api/v1/auth/login

**Auth Required:** No
**Rate Limit:** 10 requests per minute per IP

**Request Body:**
```json
{
    "email": "student@university.edu",
    "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "student@university.edu",
            "full_name": "John Doe",
            "role": "student"
        },
        "access_token": "eyJhbGciOiJIUzI1NiIs...",
        "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
        "token_type": "Bearer",
        "expires_in": 1800
    }
}
```

**Errors:** `401 AUTH_INVALID_TOKEN` (incorrect email or password -- same message for both to prevent enumeration)

---

#### POST /api/v1/auth/refresh

**Auth Required:** No (uses refresh token in body)

**Request Body:**
```json
{
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
    "success": true,
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIs...",
        "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
        "token_type": "Bearer",
        "expires_in": 1800
    }
}
```

**Errors:** `401 AUTH_TOKEN_EXPIRED`, `401 AUTH_INVALID_TOKEN`

---

#### GET /api/v1/auth/me

**Auth Required:** Yes (access token)

**Response (200):**
```json
{
    "success": true,
    "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "student@university.edu",
        "full_name": "John Doe",
        "role": "student",
        "is_active": true,
        "created_at": "2026-01-15T10:30:00Z"
    }
}
```

---

### Document Endpoints

#### POST /api/v1/documents/upload

**Auth Required:** Yes (student, lecturer, or admin)
**Rate Limit:** 10 requests per minute per user
**Content-Type:** `multipart/form-data`

**Request Body (form fields):**
- `file` (binary): The document file. Required.
- `course_id` (string, UUID): The course to upload to. Required.

**Constraints:**
- File max size: 10MB
- Allowed MIME types: `application/pdf`, `image/png`, `image/jpeg`, `image/tiff`
- Max 50 pages (checked after download)
- Password-protected PDFs are rejected

**Response (202 Accepted):**
```json
{
    "success": true,
    "data": {
        "id": "doc-uuid-here",
        "filename": "Lecture_3_ML.pdf",
        "status": "pending",
        "course_id": "course-uuid-here",
        "message": "Document uploaded and queued for processing"
    }
}
```

**Errors:** `413 FILE_TOO_LARGE`, `415 UNSUPPORTED_FILE_TYPE`, `403 AUTH_FORBIDDEN` (not enrolled), `409 CONFLICT` (duplicate filename)

---

#### GET /api/v1/documents/{document_id}/status

**Auth Required:** Yes (must be uploader, course lecturer, or admin)

**Response (200):**
```json
{
    "success": true,
    "data": {
        "id": "doc-uuid-here",
        "status": "ready",
        "filename": "Lecture_3_ML.pdf",
        "page_count": 24,
        "chunk_count": 87,
        "processing_time_ms": 4320,
        "created_at": "2026-01-15T10:30:00Z",
        "error_message": null
    }
}
```

**Status values:**
- `pending`: File uploaded, queued for processing
- `processing`: Currently being processed
- `ready`: Fully processed, vectors in Pinecone, available for chat
- `failed`: Processing failed, `error_message` contains the reason

---

#### GET /api/v1/documents

**Auth Required:** Yes

**Query Parameters:**
- `course_id` (UUID, required): Filter by course
- `status` (string, optional): Filter by status

**Response (200):**
```json
{
    "success": true,
    "data": {
        "documents": [
            {
                "id": "doc-uuid-here",
                "filename": "Lecture_3_ML.pdf",
                "original_name": "Lecture 3 - Machine Learning.pdf",
                "mime_type": "application/pdf",
                "file_size_bytes": 2048576,
                "page_count": 24,
                "chunk_count": 87,
                "status": "ready",
                "uploaded_by": {
                    "id": "user-uuid",
                    "full_name": "John Doe"
                },
                "created_at": "2026-01-15T10:30:00Z"
            }
        ],
        "total": 12,
        "page": 1,
        "per_page": 20
    }
}
```

---

#### DELETE /api/v1/documents/{document_id}

**Auth Required:** Yes (must be uploader, course lecturer, or admin)

**Response (200):**
```json
{
    "success": true,
    "data": {
        "message": "Document deleted successfully"
    }
}
```

**Side Effects:**
1. Deletes file from Supabase Storage
2. Deletes all vectors from Pinecone (namespace: course_id, filter: document_id = doc_id)
3. Deletes document record from PostgreSQL (cascades to related records)

---

### Chat Endpoints

#### POST /api/v1/chat/sessions

**Auth Required:** Yes

**Request Body:**
```json
{
    "course_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Questions about Neural Networks"
}
```

**Validation:** User must be enrolled in the specified course. Max 10 active sessions per user per course.

**Response (201):**
```json
{
    "success": true,
    "data": {
        "id": "session-uuid",
        "course_id": "course-uuid",
        "title": "Questions about Neural Networks",
        "created_at": "2026-01-15T10:30:00Z"
    }
}
```

---

#### POST /api/v1/chat/sessions/{session_id}/messages

**Auth Required:** Yes (must own the session)
**Rate Limit:** 20 requests per minute per user

**Request Body:**
```json
{
    "message": "What are the key differences between supervised and unsupervised learning?"
}
```

**Validation:** `message` must be non-empty, max 2000 characters. Session must exist and belong to the authenticated user.

**Response:** This endpoint returns Server-Sent Events (SSE). The response `Content-Type` is `text/event-stream`.

**SSE Event Stream Format:**

```
data: {"type": "start", "message_id": "msg-uuid-here"}

data: {"type": "chunk", "content": "The key differences "}

data: {"type": "chunk", "content": "between supervised and "}

data: {"type": "chunk", "content": "unsupervised learning "}

data: {"type": "chunk", "content": "are outlined in Lecture 3 "}

data: {"type": "chunk", "content": "and Chapter 7 of the textbook. "}

data: {"type": "chunk", "content": "Supervised learning uses labeled data [Lecture3.pdf, p.12], "}

data: {"type": "chunk", "content": "while unsupervised learning works with unlabeled data [Chapter7.pdf, p.45]."}

data: {"type": "sources", "sources": [{"document_id": "doc-uuid-1", "filename": "Lecture3.pdf", "page_number": 12, "chunk_id": "doc-uuid-1_chunk_5"}, {"document_id": "doc-uuid-2", "filename": "Chapter7.pdf", "page_number": 45, "chunk_id": "doc-uuid-2_chunk_3"}]}

data: {"type": "done", "message_id": "msg-uuid-here", "tokens_used": 187, "model_used": "gpt-4o-mini"}

```

**Event Types:**
- `start`: Signals the beginning of the response. Contains `message_id`.
- `chunk`: A piece of the streaming response text. Multiple events follow each other.
- `sources`: Source documents referenced in the answer. Sent once after all chunks.
- `done`: Signals completion. Contains `message_id`, `tokens_used`, and `model_used`.
- `error`: Sent if an error occurs during processing. Contains `message` field.

**Errors:** `403 AUTH_FORBIDDEN`, `404 NOT_FOUND`, `422 VALIDATION_ERROR`, `429 RATE_LIMITED`

---

#### GET /api/v1/chat/sessions/{session_id}/messages

**Auth Required:** Yes (must own the session)

**Query Parameters:**
- `page` (integer, default 1)
- `per_page` (integer, default 50, max 100)

**Response (200):**
```json
{
    "success": true,
    "data": {
        "messages": [
            {
                "id": "msg-uuid",
                "role": "user",
                "content": "What is gradient descent?",
                "sources": null,
                "tokens_used": 0,
                "model_used": null,
                "created_at": "2026-01-15T10:30:00Z"
            },
            {
                "id": "msg-uuid-2",
                "role": "assistant",
                "content": "Gradient descent is an optimization algorithm described in Lecture 5, p.8...",
                "sources": [
                    {
                        "document_id": "doc-uuid",
                        "filename": "Lecture5.pdf",
                        "page_number": 8,
                        "chunk_id": "doc-uuid_chunk_2"
                    }
                ],
                "tokens_used": 156,
                "model_used": "gpt-4o-mini",
                "created_at": "2026-01-15T10:30:05Z"
            }
        ],
        "total": 8,
        "page": 1,
        "per_page": 50
    }
}
```

---

#### DELETE /api/v1/chat/sessions/{session_id}

**Auth Required:** Yes (must own the session)

**Response (200):**
```json
{
    "success": true,
    "data": {
        "message": "Chat session deleted successfully"
    }
}
```

**Side Effects:** Deletes the session and all associated messages (cascade).

---

#### GET /api/v1/chat/sessions

**Auth Required:** Yes

**Query Parameters:**
- `course_id` (UUID, optional): Filter by course

**Response (200):**
```json
{
    "success": true,
    "data": {
        "sessions": [
            {
                "id": "session-uuid",
                "course_id": "course-uuid",
                "title": "Neural Network Questions",
                "message_count": 12,
                "last_message_at": "2026-01-15T11:00:00Z",
                "created_at": "2026-01-15T10:30:00Z"
            }
        ],
        "total": 5
    }
}
```

---

### Course Endpoints

#### POST /api/v1/courses

**Auth Required:** Yes (lecturer or admin only)

**Request Body:**
```json
{
    "name": "Introduction to Machine Learning",
    "code": "CS470",
    "description": "Fundamentals of machine learning algorithms and applications."
}
```

**Response (201):**
```json
{
    "success": true,
    "data": {
        "id": "course-uuid",
        "name": "Introduction to Machine Learning",
        "code": "CS470",
        "description": "Fundamentals of machine learning algorithms and applications.",
        "created_by": "user-uuid",
        "is_active": true,
        "created_at": "2026-01-15T10:30:00Z"
    }
}
```

---

#### GET /api/v1/courses

**Auth Required:** Yes

**Query Parameters:**
- `include_enrolled` (boolean, default false): If true, only return courses the user is enrolled in

**Response (200):**
```json
{
    "success": true,
    "data": {
        "courses": [
            {
                "id": "course-uuid",
                "name": "Introduction to Machine Learning",
                "code": "CS470",
                "description": "Fundamentals of machine learning...",
                "document_count": 15,
                "enrolled_count": 45,
                "created_at": "2026-01-15T10:30:00Z"
            }
        ],
        "total": 8
    }
}
```

---

#### POST /api/v1/courses/{course_id}/enroll

**Auth Required:** Yes (lecturer of the course or admin)

**Request Body:**
```json
{
    "user_id": "student-uuid",
    "role": "student"
}
```

**Response (201):**
```json
{
    "success": true,
    "data": {
        "id": "enrollment-uuid",
        "course_id": "course-uuid",
        "user_id": "student-uuid",
        "role": "student",
        "enrolled_at": "2026-01-15T10:30:00Z"
    }
}
```

---

#### GET /api/v1/courses/{course_id}

**Auth Required:** Yes (must be enrolled in the course)

**Response (200):**
```json
{
    "success": true,
    "data": {
        "id": "course-uuid",
        "name": "Introduction to Machine Learning",
        "code": "CS470",
        "description": "Fundamentals of machine learning...",
        "is_active": true,
        "document_count": 15,
        "enrolled_count": 45,
        "created_at": "2026-01-15T10:30:00Z"
    }
}
```

---

### Admin Endpoints

#### GET /api/v1/admin/usage

**Auth Required:** Yes (admin only)

**Query Parameters:**
- `start_date` (ISO 8601 date, optional)
- `end_date` (ISO 8601 date, optional)
- `user_id` (UUID, optional): Filter by user

**Response (200):**
```json
{
    "success": true,
    "data": {
        "period": {
            "start": "2026-01-01T00:00:00Z",
            "end": "2026-01-31T23:59:59Z"
        },
        "totals": {
            "total_messages": 1250,
            "total_tokens_input": 450000,
            "total_tokens_output": 280000,
            "total_embedding_tokens": 89000,
            "total_cost_usd": 2.34,
            "unique_users": 32,
            "documents_uploaded": 67,
            "documents_processed": 64,
            "processing_failures": 3
        },
        "daily_breakdown": [
            {
                "date": "2026-01-15",
                "messages": 45,
                "tokens": 12500,
                "cost_usd": 0.08
            }
        ]
    }
}
```

---

#### GET /api/v1/admin/health

**Auth Required:** Yes (admin only)

**Response (200):**
```json
{
    "success": true,
    "data": {
        "status": "healthy",
        "checks": {
            "database": {
                "status": "ok",
                "latency_ms": 12
            },
            "pinecone": {
                "status": "ok",
                "latency_ms": 45,
                "vector_count": 15420
            },
            "openai": {
                "status": "ok",
                "key_valid": true
            },
            "supabase_storage": {
                "status": "ok",
                "used_bytes": 524288000,
                "limit_bytes": 1073741824
            }
        },
        "uptime_seconds": 86400,
        "version": "1.0.0"
    }
}
```

---

#### GET /api/v1/admin/users

**Auth Required:** Yes (admin only)

**Query Parameters:**
- `page` (integer, default 1)
- `per_page` (integer, default 20, max 100)
- `role` (string, optional)
- `search` (string, optional): Search by name or email

**Response (200):**
```json
{
    "success": true,
    "data": {
        "users": [
            {
                "id": "user-uuid",
                "email": "student@university.edu",
                "full_name": "John Doe",
                "role": "student",
                "is_active": true,
                "document_count": 5,
                "chat_session_count": 12,
                "created_at": "2026-01-15T10:30:00Z"
            }
        ],
        "total": 120,
        "page": 1,
        "per_page": 20
    }
}
```

---

#### PATCH /api/v1/admin/users/{user_id}

**Auth Required:** Yes (admin only)

**Request Body:**
```json
{
    "role": "lecturer",
    "is_active": true
}
```

**Response (200):**
```json
{
    "success": true,
    "data": {
        "id": "user-uuid",
        "email": "student@university.edu",
        "full_name": "John Doe",
        "role": "lecturer",
        "is_active": true,
        "updated_at": "2026-01-15T12:00:00Z"
    }
}
```

---

## 6. Authentication & Authorization

### JWT Token Flow

```
+----------+         +----------+         +----------+
|  Client  |         |  Server  |         |  Database|
+----+-----+         +----+-----+         +----+-----+
     |                     |                     |
     |  POST /auth/login   |                     |
     |-------------------->|                     |
     |                     |  SELECT user        |
     |                     |  WHERE email = ?    |
     |                     |-------------------->|
     |                     |  user row           |
     |                     |<--------------------|
     |                     |                     |
     |                     |  bcrypt.checkpw()   |
     |                     |                     |
     |  { access_token,    |                     |
     |    refresh_token }  |                     |
     |<--------------------|                     |
     |                     |                     |
     |  Store tokens       |                     |
     |  (httpOnly cookie)  |                     |
     |                     |                     |
     |  GET /api/v1/auth/me|                     |
     |  Cookie: access_token=eyJ...              |
     |-------------------->|                     |
     |                     |  Decode JWT         |
     |                     |  Verify signature   |
     |                     |  Check expiry       |
     |                     |  Attach user_id     |
     |  { user data }      |                     |
     |<--------------------|                     |
     |                     |                     |
     |  ... 30 minutes ... |                     |
     |                     |                     |
     |  GET /api/v1/something                     |
     |  Cookie: access_token=expired             |
     |-------------------->|                     |
     |  401 TOKEN_EXPIRED  |                     |
     |<--------------------|                     |
     |                     |                     |
     |  POST /auth/refresh |                     |
     |  { refresh_token }  |                     |
     |-------------------->|                     |
     |                     |  Verify refresh JWT |
     |                     |  Check not revoked  |
     |  { new access_token,|                     |
     |    new refresh_token}|                    |
     |<--------------------|                     |
```

### Token Specifications

| Property | Access Token | Refresh Token |
|----------|-------------|---------------|
| **Secret** | `JWT_SECRET` env var | `JWT_REFRESH_SECRET` env var (different from access) |
| **Expiry** | 30 minutes | 7 days |
| **Payload** | `user_id`, `role`, `email`, `iat`, `exp`, `type: "access"` | `user_id`, `iat`, `exp`, `type: "refresh"` |
| **Algorithm** | HS256 | HS256 |
| **Storage** | httpOnly, Secure, SameSite=Strict cookie + in-memory JS variable for SSE header | httpOnly, Secure, SameSite=Strict cookie |

### Token Storage: httpOnly Cookie

**Why httpOnly cookie over localStorage:**
- localStorage is accessible to any JavaScript running on the page, making it vulnerable to XSS attacks that steal tokens.
- httpOnly cookies cannot be read by JavaScript, closing this attack vector.
- SameSite=Strict prevents CSRF attacks from cross-origin requests.
- Secure flag ensures the cookie is only sent over HTTPS.

**Implementation:**

Backend sets cookies on login/register/refresh:
```python
response.set_cookie(
    key="access_token",
    value=access_token,
    httponly=True,
    secure=True,
    samesite="strict",
    max_age=1800,  # 30 minutes
    path="/"
)
response.set_cookie(
    key="refresh_token",
    value=refresh_token,
    httponly=True,
    secure=True,
    samesite="strict",
    max_age=604800,  # 7 days
    path="/api/v1/auth/refresh"
)
```

For SSE streaming, the frontend must also send the access token as an Authorization header because EventSource does not support custom cookies. The frontend stores the access token in a React ref (not localStorage) and passes it when creating the EventSource connection:
```javascript
const eventSource = new EventSource(
    `${API_URL}/chat/sessions/${sessionId}/messages?token=${accessToken}`
);
```

Alternatively, use `fetch()` with `ReadableStream` for SSE to send the Authorization header directly.

### Role-Based Access Control (RBAC) Matrix

| Endpoint | Student | Lecturer | Admin |
|----------|---------|----------|-------|
| `POST /auth/register` | Yes | Yes | Yes |
| `POST /auth/login` | Yes | Yes | Yes |
| `GET /auth/me` | Yes | Yes | Yes |
| `POST /documents/upload` | Own courses only | Own courses only | All courses |
| `GET /documents` | Own courses only | Own courses only | All courses |
| `GET /documents/{id}/status` | Own docs only | Own docs + course docs | All docs |
| `DELETE /documents/{id}` | Own docs only | Own docs + course docs | All docs |
| `POST /chat/sessions` | Own courses only | Own courses only | All courses |
| `POST /chat/sessions/{id}/messages` | Own sessions only | Own sessions only | All sessions |
| `GET /chat/sessions/{id}/messages` | Own sessions only | Own sessions only | All sessions |
| `DELETE /chat/sessions/{id}` | Own sessions only | Own sessions only | All sessions |
| `GET /chat/sessions` | Own sessions only | Own sessions only | All sessions |
| `POST /courses` | No | Yes | Yes |
| `GET /courses` | Enrolled only | Enrolled + created | All |
| `POST /courses/{id}/enroll` | No | Own courses only | All courses |
| `GET /courses/{id}` | Enrolled only | Enrolled + created | All |
| `GET /admin/usage` | No | No | Yes |
| `GET /admin/health` | No | No | Yes |
| `GET /admin/users` | No | No | Yes |
| `PATCH /admin/users/{id}` | No | No | Yes |

### Password Hashing

```python
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # Cost factor of 12 = ~250ms hash time on modern hardware
)

# Hashing
hashed = pwd_context.hash("user_password")

# Verification
is_valid = pwd_context.verify("user_password", hashed)
```

**Why bcrypt over alternatives:**
- **Argon2**: Stronger but requires the `argon2-cffi` C extension, which causes installation issues on some platforms.
- **scrypt**: Good but bcrypt is more widely audited and battle-tested.
- **SHA-256/MD5**: Not suitable for passwords -- they are fast hashes designed for data integrity, not authentication. A bcrypt hash with cost 12 takes ~250ms; SHA-256 takes microseconds, making brute-force trivial.

### Session Management

Sessions are stateless via JWT. There is no server-side session store. To revoke access:

1. **User logout**: Frontend deletes the cookies. The access token remains valid until expiry (30 min), but since the frontend no longer has it, the user is effectively logged out. For immediate revocation, maintain a token blocklist (a Redis set or a PostgreSQL table of revoked token JTI values).

2. **Admin ban**: Set `is_active = false` on the user record. The auth middleware checks `is_active` on every request and rejects tokens for inactive users.

3. **Password change**: Issue a new refresh token and invalidate the old one.

For this project, a simple approach is sufficient: check `is_active` on every authenticated request. The 30-minute access token expiry limits the window of any leaked token.

---

## 7. Document Processing Pipeline

### Complete Pipeline Implementation

```python
# backend/services/document_processing.py

import os
import re
import tempfile
import time
from typing import Optional

import pdfplumber
import pytesseract
from PIL import Image
from openai import OpenAI

from backend.config import settings
from backend.db import get_db
from backend.services.pinecone_service import pinecone_client
from backend.models import Document, DocumentStatus


class DocumentProcessingService:
    """Handles the full pipeline from uploaded file to queryable vectors."""

    def __init__(self):
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self._circuit_breaker_failures = 0
        self._circuit_breaker_last_failure = 0

    def process_document(self, document_id: str) -> None:
        """
        Main entry point. Called as a BackgroundTask.
        Handles the full pipeline with error recovery at each stage.
        """
        db = next(get_db())
        document = db.query(Document).filter(Document.id == document_id).first()

        if not document:
            return

        document.status = DocumentStatus.PROCESSING
        db.commit()

        tmp_file_path = None

        try:
            # Stage 1: Download file from Supabase Storage
            tmp_file_path = self._download_file(document)

            # Stage 2: Validate file
            self._validate_file(tmp_file_path, document.mime_type)

            # Stage 3: Extract text
            pages_text = self._extract_text(tmp_file_path, document.mime_type)

            if not pages_text or all(not text.strip() for text in pages_text):
                raise ValueError("No text content could be extracted from the document")

            # Stage 4: Clean text
            cleaned_pages = [self._clean_text(text) for text in pages_text]

            # Stage 5: Chunk text
            chunks = self._chunk_text(cleaned_pages, document.id)

            if not chunks:
                raise ValueError("Document produced no chunks after processing")

            # Stage 6: Embed chunks
            embedded_chunks = self._embed_chunks(chunks)

            # Stage 7: Upsert to Pinecone
            self._upsert_to_pinecone(embedded_chunks, document.course_id, document.id)

            # Stage 8: Update document status
            document.status = DocumentStatus.READY
            document.chunk_count = len(chunks)
            document.page_count = len(pages_text)
            document.processing_time_ms = int(
                (time.time() - document.created_at.timestamp()) * 1000
            )
            db.commit()

        except Exception as e:
            document.status = DocumentStatus.FAILED
            document.error_message = str(e)[:1000]
            db.commit()
            raise

        finally:
            if tmp_file_path and os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
            db.close()
```

    # ── Stage 1: File Download ─────────────────────────────────

    def _download_file(self, document: Document) -> str:
        """Download file from Supabase Storage to a temporary local path."""
        from backend.services.storage_service import storage_service

        file_bytes = storage_service.download(document.storage_path)

        suffix = self._get_file_suffix(document.mime_type)
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        tmp.write(file_bytes)
        tmp.close()
        return tmp.name

    def _get_file_suffix(self, mime_type: str) -> str:
        mime_to_ext = {
            "application/pdf": ".pdf",
            "image/png": ".png",
            "image/jpeg": ".jpg",
            "image/tiff": ".tiff",
        }
        return mime_to_ext.get(mime_type, ".bin")

    # ── Stage 2: File Validation ───────────────────────────────

    def _validate_file(self, file_path: str, mime_type: str) -> None:
        """Validate file is processable (not corrupted, not password-protected)."""
        file_size = os.path.getsize(file_path)
        if file_size > settings.MAX_FILE_SIZE_BYTES:
            raise ValueError(
                f"File size {file_size} exceeds maximum {settings.MAX_FILE_SIZE_BYTES}"
            )

        if mime_type == "application/pdf":
            try:
                with pdfplumber.open(file_path) as pdf:
                    page_count = len(pdf.pages)
                    if page_count > settings.MAX_PAGE_COUNT:
                        raise ValueError(
                            f"PDF has {page_count} pages, maximum is {settings.MAX_PAGE_COUNT}"
                        )
                    # Check for password-protected PDF
                    try:
                        pdf.pages[0].extract_text()
                    except Exception as e:
                        if "encrypted" in str(e).lower() or "password" in str(e).lower():
                            raise ValueError("Password-protected PDFs are not supported")
            except ValueError:
                raise
            except Exception as e:
                raise ValueError(f"PDF validation failed: {str(e)}")

    # ── Stage 3: Text Extraction ───────────────────────────────

    def _extract_text(self, file_path: str, mime_type: str) -> list[str]:
        """Extract text from each page. Routes to digital PDF extraction or OCR."""
        if mime_type == "application/pdf":
            return self._extract_from_pdf(file_path)
        elif mime_type in ("image/png", "image/jpeg", "image/tiff"):
            return self._extract_from_image(file_path)
        else:
            raise ValueError(f"Unsupported MIME type for extraction: {mime_type}")

    def _extract_from_pdf(self, file_path: str) -> list[str]:
        """
        Attempt digital text extraction first.
        If extracted text is too sparse, fall back to OCR.
        """
        pages_text = []

        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""

                # Determine if page is scanned (low text density)
                if self._is_scanned_page(text, page):
                    img = page.to_image(resolution=300)
                    pil_image = img.original
                    ocr_text = pytesseract.image_to_string(pil_image, lang="eng")
                    pages_text.append(ocr_text)
                else:
                    pages_text.append(text)

        return pages_text

    def _is_scanned_page(self, extracted_text: str, page) -> bool:
        """
        Heuristic to detect scanned pages in a PDF.
        A page is considered scanned if:
        1. Extracted text is very short (< 50 characters), OR
        2. Text-to-area ratio is below threshold (indicates mostly image)
        """
        text_length = len(extracted_text.strip())

        if text_length < 50:
            return True

        page_area = page.width * page.height
        if page_area == 0:
            return True

        # Approximate text area from character count
        # Average character occupies ~8x12 pixels at 72 DPI
        approx_text_area = text_length * 96
        ratio = approx_text_area / page_area

        # If text covers less than 2% of page, treat as scanned
        return ratio < 0.02

    def _extract_from_image(self, file_path: str) -> list[str]:
        """Run OCR on a single image file."""
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image, lang="eng")
        return [text]
```

    # ── Stage 4: Text Cleaning ─────────────────────────────────

    def _clean_text(self, text: str) -> str:
        """Normalize and clean extracted text for chunking."""
        if not text:
            return ""

        # Remove excessive whitespace but preserve paragraph breaks
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)

        # Remove common PDF artifacts
        text = re.sub(r'(?<!\S)(?:Page|PAGE)\s+\d+(?:\s+of\s+\d+)?(?!\S)', '', text)
        text = re.sub(r'(?<!\S)\d+\s*$', '', text, flags=re.MULTILINE)

        # Remove header/footer patterns
        lines = text.split('\n')
        if len(lines) > 4:
            cleaned_lines = []
            for i, line in enumerate(lines):
                stripped = line.strip()
                if i < 3 and (re.match(r'^[\s\-=_*]+$', stripped) or len(stripped) < 3):
                    continue
                if i > len(lines) - 3 and (
                    re.match(r'^[\s\-=_*]+$', stripped) or re.match(r'^\d+$', stripped)
                ):
                    continue
                cleaned_lines.append(line)
            text = '\n'.join(cleaned_lines)

        # Normalize LaTeX equations (preserve them but clean formatting)
        text = re.sub(r'\$\$\s*', '$$', text)
        text = re.sub(r'\$\s*', '$', text)

        # Remove null bytes and control characters (except newlines and tabs)
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

        return text.strip()

    # ── Stage 5: Chunking ──────────────────────────────────────

    def _chunk_text(
        self, cleaned_pages: list[str], document_id: str
    ) -> list[dict]:
        """
        Split text into chunks using recursive character splitting.
        Returns list of dicts with: text, page_number, chunk_index
        """
        chunks = []
        chunk_index = 0

        for page_num, page_text in enumerate(cleaned_pages, start=1):
            if not page_text.strip():
                continue

            page_chunks = self._recursive_split(
                text=page_text,
                max_chars=2000,   # ~512 tokens
                overlap_chars=200  # ~50 tokens
            )

            for chunk_text in page_chunks:
                chunks.append({
                    "text": chunk_text,
                    "page_number": page_num,
                    "chunk_index": chunk_index,
                    "document_id": document_id,
                })
                chunk_index += 1

        return chunks

    def _recursive_split(
        self, text: str, max_chars: int, overlap_chars: int
    ) -> list[str]:
        """
        Recursively split text by decreasing separators until chunks fit.
        Tries to split on paragraphs first, then sentences, then words.
        Never splits mid-word.
        """
        separators = ["\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " "]
        return self._split_recursive(text, separators, max_chars, overlap_chars)

    def _split_recursive(
        self, text: str, separators: list[str], max_chars: int, overlap_chars: int
    ) -> list[str]:
        if len(text) <= max_chars:
            return [text.strip()] if text.strip() else []

        if not separators:
            # Last resort: hard split at max_chars
            chunks = []
            start = 0
            while start < len(text):
                end = start + max_chars
                chunks.append(text[start:end].strip())
                start = end - overlap_chars
            return [c for c in chunks if c]

        separator = separators[0]
        remaining_separators = separators[1:]

        parts = text.split(separator)
        chunks = []
        current_chunk = ""

        for part in parts:
            candidate = (current_chunk + separator + part) if current_chunk else part

            if len(candidate) <= max_chars:
                current_chunk = candidate
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                # If single part exceeds max_chars, recurse with finer separators
                if len(part) > max_chars:
                    sub_chunks = self._split_recursive(
                        part, remaining_separators, max_chars, overlap_chars
                    )
                    chunks.extend(sub_chunks)
                    current_chunk = ""
                else:
                    current_chunk = part

        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        # Apply overlap
        if overlap_chars > 0 and len(chunks) > 1:
            overlapped = [chunks[0]]
            for i in range(1, len(chunks)):
                prev_text = chunks[i - 1]
                overlap = prev_text[-overlap_chars:] if len(prev_text) > overlap_chars else prev_text
                space_idx = overlap.find(' ')
                if space_idx > 0:
                    overlap = overlap[space_idx + 1:]
                overlapped.append(overlap + separator + chunks[i])
            chunks = overlapped

        return chunks
```

    # ── Stage 6: Embedding ─────────────────────────────────────

    def _embed_chunks(self, chunks: list[dict]) -> list[dict]:
        """Generate embeddings for all chunks using OpenAI API in batches."""
        self._check_circuit_breaker()

        embedded = []
        batch_size = 512  # OpenAI allows up to 2048 per call, 512 is safe

        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            texts = [chunk["text"] for chunk in batch]

            try:
                response = self._call_embedding_api_with_retry(texts)
                embeddings = [item.embedding for item in response.data]

                for chunk, embedding in zip(batch, embeddings):
                    chunk["embedding"] = embedding
                    embedded.append(chunk)

                self._circuit_breaker_failures = 0

            except Exception as e:
                self._record_circuit_breaker_failure()
                raise RuntimeError(f"Embedding failed after retries: {str(e)}")

        return embedded

    def _call_embedding_api_with_retry(
        self, texts: list[str], max_retries: int = 3
    ):
        """Call OpenAI embedding API with exponential backoff retry."""
        last_error = None

        for attempt in range(max_retries):
            try:
                response = self.openai_client.embeddings.create(
                    model=settings.OPENAI_EMBEDDING_MODEL,
                    input=texts
                )
                return response
            except Exception as e:
                last_error = e
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # 1s, 2s, 4s
                    time.sleep(wait_time)

        raise last_error

    # ── Stage 7: Pinecone Upsert ───────────────────────────────

    def _upsert_to_pinecone(
        self, embedded_chunks: list[dict], course_id: str, document_id: str
    ) -> None:
        """Upsert all embedded vectors to Pinecone with metadata."""
        vectors = []

        for chunk in embedded_chunks:
            vector_id = f"{document_id}_chunk_{chunk['chunk_index']}"
            vectors.append({
                "id": vector_id,
                "values": chunk["embedding"],
                "metadata": {
                    "document_id": document_id,
                    "page_number": chunk["page_number"],
                    "chunk_index": chunk["chunk_index"],
                    "filename": chunk.get("filename", ""),
                    "uploaded_by": chunk.get("uploaded_by", ""),
                    "course_id": course_id,
                    "text_preview": chunk["text"][:200],
                }
            })

        # Upsert in batches of 100 (Pinecone limit per upsert call)
        pinecone_index = pinecone_client.Index(settings.PINECONE_INDEX_NAME)

        for i in range(0, len(vectors), 100):
            batch = vectors[i:i + 100]
            pinecone_index.upsert(
                vectors=batch,
                namespace=course_id
            )

    # ── Circuit Breaker ────────────────────────────────────────

    def _check_circuit_breaker(self):
        """If too many recent failures, stop trying to prevent wasted API calls."""
        if self._circuit_breaker_failures >= 5:
            time_since_last = time.time() - self._circuit_breaker_last_failure
            if time_since_last < 60:
                raise RuntimeError(
                    f"Circuit breaker open: {self._circuit_breaker_failures} "
                    f"failures in last 60 seconds. Retry after "
                    f"{int(60 - time_since_last)} seconds."
                )
            else:
                self._circuit_breaker_failures = 0

    def _record_circuit_breaker_failure(self):
        self._circuit_breaker_failures += 1
        self._circuit_breaker_last_failure = time.time()


# Singleton instance
document_processing_service = DocumentProcessingService()
```

### Background Task Integration

```python
# backend/routes/documents.py

from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile, File, Form

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", status_code=202)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    course_id: str = Form(...),
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    # ... validation and storage ...

    # Create document record
    document = Document(
        course_id=course_id,
        uploaded_by=current_user.id,
        filename=sanitized_filename,
        original_name=file.filename,
        mime_type=file.content_type,
        file_size_bytes=file_size,
        storage_path=storage_path,
        status=DocumentStatus.PENDING
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # Launch background processing
    background_tasks.add_task(
        document_processing_service.process_document,
        document_id=str(document.id)
    )

    return {
        "id": document.id,
        "filename": document.filename,
        "status": document.status,
        "course_id": document.course_id,
        "message": "Document uploaded and queued for processing"
    }
```

### Dead Letter Handling

When document processing fails permanently (after all retries), the system:

1. Sets `document.status = "failed"` with the error message in `document.error_message`.
2. Logs the full error with stack trace to structured logs.
3. Logs to the `usage_logs` table with `action = "document_processing_failed"`.
4. The document remains in Supabase Storage (not deleted) so the user can download their original file.
5. The user sees the error status on the frontend and can delete the document and re-upload.
6. No retry is attempted automatically -- the user must manually re-upload.

### Pipeline Error Handling Summary

| Stage | Failure Mode | Recovery Action |
|-------|-------------|-----------------|
| Download | Supabase Storage unreachable | Retry 3x with backoff; if still fails, mark document as `failed` |
| Validation | Password-protected PDF | Mark as `failed` with clear error message |
| Validation | Exceeds page limit | Mark as `failed` with error: "Document has X pages, maximum is 50" |
| Text extraction | pdfplumber fails | Fall back to OCR for all pages |
| Text extraction | OCR returns empty text | Mark as `failed` with "No text content could be extracted" |
| Chunking | Empty after cleaning | Mark as `failed` with "Document produced no chunks" |
| Embedding | OpenAI API down | Circuit breaker: retry 3x, then halt for 60s; mark as `failed` |
| Pinecone upsert | Pinecone unreachable | Retry 3x with backoff; if still fails, mark as `failed` |
| Any unhandled | Unexpected exception | Catch-all handler marks document as `failed`, logs stack trace |

---

## 8. RAG Chat System

### Complete RAG Pipeline Implementation

```python
# backend/services/chat_service.py

import time
from openai import OpenAI
from backend.config import settings
from backend.services.pinecone_service import pinecone_client


class ChatService:
    def __init__(self):
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def process_message(
        self, session_id: str, user_message: str, user_id: str, course_id: str
    ) -> dict:
        """
        Full RAG pipeline.
        Returns dict with streaming generator and metadata.
        """
        start_time = time.time()

        # Step 1: Save user message to database
        self._save_message(session_id, "user", user_message)

        # Step 2: Retrieve conversation history (last 10 messages)
        history = self._get_conversation_history(session_id, limit=10)

        # Step 3: Embed the user's question
        question_embedding = self._embed_question(user_message)

        # Step 4: Query Pinecone for relevant chunks
        relevant_chunks = self._retrieve_chunks(
            embedding=question_embedding,
            namespace=course_id,
            top_k=5,
            similarity_threshold=0.7
        )

        # Step 5: If no relevant chunks, return fallback
        if not relevant_chunks:
            fallback_response = (
                "I don't have relevant information in your uploaded documents "
                "to answer this question. Please try rephrasing your question "
                "or upload documents that cover this topic."
            )
            self._save_message(
                session_id, "assistant", fallback_response,
                sources=[], tokens_used=0, model_used=None
            )
            return {
                "type": "fallback",
                "content": fallback_response,
                "sources": []
            }

        # Step 6: Assemble context from chunks
        context = self._assemble_context(relevant_chunks, max_tokens=3000)

        # Step 7: Build prompt
        system_prompt = self._build_system_prompt()
        messages = self._build_messages(system_prompt, context, history, user_message)

        # Step 8: Stream OpenAI response
        sources = [
            {
                "document_id": chunk["metadata"]["document_id"],
                "filename": chunk["metadata"]["filename"],
                "page_number": chunk["metadata"]["page_number"],
                "chunk_id": chunk["id"]
            }
            for chunk in relevant_chunks
        ]

        return {
            "type": "stream",
            "messages": messages,
            "sources": sources,
            "session_id": session_id,
            "start_time": start_time
        }

    def _embed_question(self, question: str) -> list[float]:
        """Embed the user's question using OpenAI."""
        response = self.openai_client.embeddings.create(
            model=settings.OPENAI_EMBEDDING_MODEL,
            input=[question]
        )
        return response.data[0].embedding

    def _retrieve_chunks(
        self,
        embedding: list[float],
        namespace: str,
        top_k: int = 5,
        similarity_threshold: float = 0.7
    ) -> list[dict]:
        """Query Pinecone and filter by similarity threshold."""
        pinecone_index = pinecone_client.Index(settings.PINECONE_INDEX_NAME)

        results = pinecone_index.query(
            vector=embedding,
            top_k=top_k,
            namespace=namespace,
            include_metadata=True
        )

        # Filter by similarity threshold
        relevant = [
            match for match in results.matches
            if match.score >= similarity_threshold
        ]

        return relevant

    def _assemble_context(self, chunks: list[dict], max_tokens: int = 3000) -> str:
        """
        Assemble context string from retrieved chunks.
        Respects token budget by truncating when limit is reached.
        Rough estimate: 1 token = ~4 characters.
        """
        max_chars = max_tokens * 4
        context_parts = []
        current_length = 0

        for chunk in chunks:
            text = chunk["metadata"].get("text_preview", "")
            if not text:
                continue

            filename = chunk["metadata"].get("filename", "Unknown")
            page = chunk["metadata"].get("page_number", "?")

            part = f"[Source: {filename}, Page {page}]\n{text}\n"

            if current_length + len(part) > max_chars:
                remaining = max_chars - current_length
                if remaining > 100:
                    context_parts.append(part[:remaining] + "...")
                break

            context_parts.append(part)
            current_length += len(part)

        return "\n---\n".join(context_parts)
```

    def _build_system_prompt(self) -> str:
        """The exact system prompt used for all RAG responses."""
        return """You are an AI Course Assistant that helps students understand their course materials.

IMPORTANT RULES:
1. Answer questions ONLY based on the provided context from course documents.
2. If the context does not contain information to answer the question, say exactly: "I don't have relevant information in your uploaded documents to answer this question. Please try rephrasing or upload documents that cover this topic."
3. Do NOT make up, infer, or hallucinate information that is not present in the context.
4. Always cite your sources using the format: [DocumentName, p.XX] where XX is the page number.
5. If multiple sources support your answer, cite all of them.
6. Provide clear, well-structured answers with proper formatting.
7. If the context partially answers the question, explain what information is available and note what is missing.
8. Use the same level of technical detail as the source material.
9. For mathematical formulas, use clear notation.
10. If a student asks something off-topic, politely redirect them to course-related questions."""

    def _build_messages(
        self,
        system_prompt: str,
        context: str,
        history: list[dict],
        current_question: str
    ) -> list[dict]:
        """Build the message array for the OpenAI API call."""
        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "system",
                "content": f"Here is the relevant context from course documents:\n\n{context}"
            }
        ]

        # Add conversation history (sliding window of last 10 messages)
        for msg in history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        # Add current question
        messages.append({
            "role": "user",
            "content": current_question
        })

        return messages

    def stream_response(self, messages: list[dict]):
        """Generator that yields SSE-formatted chunks from OpenAI streaming."""
        stream = self.openai_client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=messages,
            temperature=0.1,
            top_p=0.9,
            max_tokens=2048,
            stream=True
        )

        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    def _get_conversation_history(self, session_id: str, limit: int = 10) -> list[dict]:
        """Fetch the last N messages from the session for context."""
        from backend.db import get_db
        from backend.models import ChatMessage

        db = next(get_db())
        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
            .all()
        )
        db.close()

        # Reverse to get chronological order
        return [{"role": m.role, "content": m.content} for m in reversed(messages)]

    def _save_message(
        self,
        session_id: str,
        role: str,
        content: str,
        sources: list = None,
        tokens_used: int = 0,
        model_used: str = None,
        embedding_tokens: int = 0
    ):
        """Persist a message to the database."""
        from backend.db import get_db
        from backend.models import ChatMessage

        db = next(get_db())
        message = ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            sources=sources or [],
            tokens_used=tokens_used,
            model_used=model_used,
            embedding_tokens=embedding_tokens
        )
        db.add(message)
        db.commit()
        db.close()


chat_service = ChatService()
```

### Conversation Context Management

| Parameter | Value | Justification |
|-----------|-------|---------------|
| **History window** | Last 10 messages | Enough for coherent multi-turn conversation. More than 10 wastes context window tokens. |
| **Token budget allocation** | 70% context, 30% response | GPT-4o-mini has 128k context but we limit output to 2048 tokens. The 70/30 split ensures enough context while leaving room for thorough responses. |
| **Max context characters** | 12,000 chars (~3,000 tokens) | 5 chunks x ~2,000 chars each, capped at 3,000 tokens to leave room for system prompt + history + question. |
| **Max tokens per response** | 2,048 | Sufficient for detailed answers without wasting tokens. |

### Hallucination Prevention

1. **Temperature = 0.1**: Very low randomness makes the model stick closely to provided context.
2. **top_p = 0.9**: Limits token sampling to the top 90% probability mass, further reducing creative drift.
3. **System prompt instruction**: Explicit instruction to say "I don't know" when context is insufficient.
4. **Similarity threshold = 0.7**: Chunks with low relevance are excluded, preventing the model from being influenced by loosely related content.
5. **No real-time web access**: The model cannot look up external information.
6. **Source citation requirement**: The prompt requires citation, which forces the model to reference specific source text.

### Source Citation Mapping

When chunks are retrieved from Pinecone, each carries metadata with `document_id`, `filename`, and `page_number`. The chat service:

1. Collects unique `(document_id, page_number)` pairs from all retrieved chunks.
2. Passes this list to the frontend as `sources` in the SSE `done` event.
3. The frontend displays clickable source links below the response.
4. In the response text, the model is prompted to write citations like `[Lecture3.pdf, p.12]`, which map directly to the metadata.

---

## 9. Frontend Architecture

### Component Hierarchy

```
src/
├── index.js                          # Entry point, renders <App />
├── App.js                            # Router setup, AuthProvider wrapping
│
├── contexts/
│   └── AuthContext.js                # Auth state (user, tokens, login, logout, register)
│
├── hooks/
│   ├── useAuth.js                    # Convenience hook for AuthContext
│   ├── useSSE.js                     # Hook for managing SSE connections
│   └── useDocumentStatus.js          # Hook for polling document processing status
│
├── services/
│   └── api.js                        # Axios instance, interceptors, API methods
│
├── pages/
│   ├── LoginPage.js                  # Login form
│   ├── RegisterPage.js               # Registration form
│   ├── DashboardPage.js              # Course list view
│   ├── CoursePage.js                 # Course detail: documents + chat
│   ├── ChatPage.js                   # Chat interface with streaming
│   └── AdminPage.js                  # Admin panel (user management, stats)
│
├── components/
│   ├── Layout/
│   │   ├── Header.js                 # Top nav bar with user info, logout
│   │   ├── Sidebar.js                # Course navigation sidebar
│   │   └── Layout.js                 # Composes Header + Sidebar + main content
│   │
│   ├── Auth/
│   │   ├── ProtectedRoute.js         # Redirects unauthenticated users to login
│   │   └── RoleGate.js               # Restricts content based on user role
│   │
│   ├── Documents/
│   │   ├── DocumentUpload.js         # Drag-and-drop file upload with progress
│   │   ├── DocumentList.js           # Table/list of uploaded documents with status
│   │   └── DocumentStatusBadge.js    # Colored badge: pending/processing/ready/failed
│   │
│   ├── Chat/
│   │   ├── ChatWindow.js             # Main chat area with message list
│   │   ├── ChatMessage.js            # Single message bubble (user or assistant)
│   │   ├── ChatInput.js              # Text input with send button
│   │   ├── SourceCitation.js         # Clickable source reference below messages
│   │   └── StreamingMessage.js       # Displays streaming response with cursor
│   │
│   ├── Admin/
│   │   ├── UserTable.js              # User management table
│   │   ├── UsageStats.js             # Usage statistics dashboard
│   │   └── HealthCheck.js            # System health display
│   │
│   └── common/
│       ├── LoadingSpinner.js          # Loading indicator
│       ├── ErrorMessage.js            # Error display component
│       ├── ConfirmDialog.js           # Confirmation modal
│       └── Pagination.js             # Pagination controls
│
└── styles/
    └── globals.css                   # Tailwind directives + custom styles
```

### Key Pages

**Login Page (`LoginPage.js`):**
- Email and password fields with client-side validation.
- "Register" link to registration page.
- On submit: calls `POST /auth/login`, stores tokens via `AuthContext`, redirects to Dashboard.
- Error display for invalid credentials.

**Register Page (`RegisterPage.js`):**
- Full name, email, password, confirm password fields.
- Client-side validation: email format, password strength, password match.
- On submit: calls `POST /auth/register`, stores tokens, redirects to Dashboard.

**Dashboard Page (`DashboardPage.js`):**
- Grid of course cards showing name, code, document count, enrollment count.
- For lecturers: "Create Course" button.
- For admins: link to Admin Panel.
- Clicking a card navigates to `/courses/:courseId`.

**Course View Page (`CoursePage.js`):**
- Split layout: left panel shows document list, right panel shows chat.
- Document panel: upload button, list of documents with status badges.
- Chat panel: list of chat sessions for this course, "New Chat" button.
- Document processing status updates via polling every 3 seconds.

**Chat Page (`ChatPage.js`):**
- Full-height chat interface.
- Message history with streaming display for new messages.
- Source citations rendered below each assistant message.
- Input field at bottom with send button and keyboard shortcut (Enter to send).

**Admin Panel (`AdminPage.js`):**
- Tabbed interface: Users, Usage, Health.
- User table with search, role filter, and role change dropdown.
- Usage charts (daily message count, token usage, cost).
- Health check display with auto-refresh every 30 seconds.

### State Management

```javascript
// src/contexts/AuthContext.js

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get('/auth/me');
                setUser(response.data.data);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = useCallback(async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        setUser(response.data.data.user);
        return response.data.data;
    }, []);

    const register = useCallback(async (email, password, fullName) => {
        const response = await api.post('/auth/register', {
            email,
            password,
            full_name: fullName
        });
        setUser(response.data.data.user);
        return response.data.data;
    }, []);

    const logout = useCallback(async () => {
        await api.post('/auth/logout');
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
```

### API Client Setup

```javascript
// src/services/api.js

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,  // Send cookies with every request
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,  // 30 second timeout
});

// Response interceptor: handle 401 by attempting token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                await api.post('/auth/refresh');
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed -- redirect to login
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
```

### Streaming Response Handling (SSE)

```javascript
// src/hooks/useSSE.js

import { useState, useCallback, useRef } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

export function useSSE() {
    const [streamingContent, setStreamingContent] = useState('');
    const [sources, setSources] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const abortControllerRef = useRef(null);

    const startStream = useCallback(async (sessionId, message, onDone) => {
        setStreamingContent('');
        setSources([]);
        setIsStreaming(true);
        abortControllerRef.current = new AbortController();

        try {
            // Use fetch with ReadableStream for SSE with credentials
            const response = await fetch(
                `${API_BASE_URL}/chat/sessions/${sessionId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ message }),
                    signal: abortControllerRef.current.signal,
                }
            );

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));

                        switch (data.type) {
                            case 'chunk':
                                setStreamingContent(prev => prev + data.content);
                                break;
                            case 'sources':
                                setSources(data.sources);
                                break;
                            case 'done':
                                setIsStreaming(false);
                                onDone?.(data);
                                break;
                            case 'error':
                                setIsStreaming(false);
                                throw new Error(data.message);
                            default:
                                break;
                        }
                    }
                }
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                setIsStreaming(false);
                throw error;
            }
        }
    }, []);

    const stopStream = useCallback(() => {
        abortControllerRef.current?.abort();
        setIsStreaming(false);
    }, []);

    return { streamingContent, sources, isStreaming, startStream, stopStream };
}
```

### File Upload UX

```javascript
// src/components/Documents/DocumentUpload.js

import { useState, useRef, useCallback } from 'react';
import api from '../../services/api';

function DocumentUpload({ courseId, onUploadComplete }) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff'];
    const MAX_SIZE_MB = 10;

    const handleFile = useCallback(async (file) => {
        setError(null);

        // Client-side validation
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError(`Unsupported file type: ${file.type}. Allowed: PDF, PNG, JPEG, TIFF`);
            return;
        }

        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setError(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: ${MAX_SIZE_MB}MB`);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('course_id', courseId);

        setUploadProgress(0);

        try {
            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percent);
                },
            });

            setUploadProgress(null);
            onUploadComplete?.();
        } catch (err) {
            setUploadProgress(null);
            const message = err.response?.data?.error?.message || 'Upload failed';
            setError(message);
        }
    }, [courseId, onUploadComplete]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors duration-200
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            `}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.tiff"
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                className="hidden"
            />

            {uploadProgress !== null ? (
                <div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
                </div>
            ) : (
                <div>
                    <p className="text-lg font-medium text-gray-700">
                        Drop a file here or click to upload
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        PDF, PNG, JPEG, or TIFF -- Max {MAX_SIZE_MB}MB
                    </p>
                </div>
            )}

            {error && (
                <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
        </div>
    );
}

export default DocumentUpload;
```

### Responsive Design Approach

- **Mobile**: Single column layout. Chat takes full width; document list becomes a slide-over panel.
- **Tablet (768px-1024px)**: Two-column layout with collapsible sidebar.
- **Desktop (1024px+)**: Full three-panel layout (sidebar, document list, chat).
- Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) are used throughout.
- Touch-friendly targets: minimum 44px tap targets for buttons and links.

---

## 10. File Storage Strategy

### Supabase Storage Configuration

| Setting | Value |
|---------|-------|
| **Bucket Name** | `course-documents` |
| **Public Access** | No (private bucket) |
| **File Size Limit** | 10MB per file |
| **Allowed MIME Types** | `application/pdf`, `image/png`, `image/jpeg`, `image/tiff` |
| **Storage Region** | Same as Supabase project (typically US East) |

### File Naming Convention

```
{course_id}/{user_id}/{timestamp}_{sanitized_filename}
```

**Example:**
```
550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-ef1234567890/1705312200_Lecture_3_Machine_Learning.pdf
```

**Sanitization rules:**
- Replace spaces with underscores.
- Remove characters: `/ \ : * ? " < > |`
- Truncate filename to 100 characters (excluding extension).
- Preserve original extension.
- Prepend Unix timestamp to prevent collisions.

### Storage Policies (Row Level Security)

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'course-documents'
    AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to read files from courses they're enrolled in
CREATE POLICY "Users can read enrolled course files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'course-documents'
    AND (storage.foldername(name))[1] IN (
        SELECT course_id::text
        FROM course_enrollments
        WHERE user_id = auth.uid()
    )
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'course-documents'
    AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow admins full access
CREATE POLICY "Admins have full access"
ON storage.objects
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);
```

### Cleanup Strategy

When a document is deleted:
1. The backend calls `supabase.storage.from_('course-documents').remove([storage_path])`.
2. The document record is deleted from PostgreSQL (cascading to related records).
3. Vectors are deleted from Pinecone by filtering on `document_id` metadata.
4. The /tmp file from processing is cleaned up in the `finally` block of the processing service.

### No Local Filesystem Storage

The system never stores files on the local filesystem permanently. During document processing, files are temporarily downloaded to `/tmp` for text extraction, but are always deleted in the `finally` block of the processing pipeline regardless of success or failure. This is critical for:
- Render's ephemeral filesystem (files are lost on redeploy).
- Security (no residual sensitive data on disk).
- Memory management (large PDFs can be 10MB+).

---

## 11. Security

### Input Validation

Every API endpoint uses Pydantic models for request validation. No raw dictionaries are accepted.

```python
# backend/schemas/auth.py

from pydantic import BaseModel, EmailStr, field_validator
import re


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v):
        if not re.match(r"^[a-zA-Z\s]{2,255}$", v):
            raise ValueError("Full name must be 2-255 characters, letters and spaces only")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ChatMessageRequest(BaseModel):
    message: str

    @field_validator("message")
    @classmethod
    def validate_message(cls, v):
        v = v.strip()
        if len(v) == 0:
            raise ValueError("Message cannot be empty")
        if len(v) > 2000:
            raise ValueError("Message cannot exceed 2000 characters")
        return v


class CreateCourseRequest(BaseModel):
    name: str
    code: str
    description: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        if len(v.strip()) < 3 or len(v.strip()) > 255:
            raise ValueError("Course name must be 3-255 characters")
        return v.strip()

    @field_validator("code")
    @classmethod
    def validate_code(cls, v):
        if not re.match(r"^[A-Z0-9]{2,50}$", v.strip()):
            raise ValueError("Course code must be 2-50 uppercase alphanumeric characters")
        return v.strip()
```

### SQL Injection Prevention

- SQLAlchemy ORM is used for all database queries. User input never enters raw SQL.
- Parameterized queries are used everywhere. SQLAlchemy handles escaping automatically.
- No string concatenation for SQL queries anywhere in the codebase.
- Raw SQL is only used in migrations (Alembic), which do not accept user input.

### XSS Prevention

- React auto-escapes all JSX content. User-provided strings rendered via `{variable}` are automatically escaped.
- No `dangerouslySetInnerHTML` is used anywhere.
- API responses set `Content-Type: application/json` which browsers will not render as HTML.
- SSE responses use `text/event-stream` content type with JSON-encoded data payloads.

### CORS Configuration

```python
# backend/main.py

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Local development
        "https://your-app.vercel.app",  # Production frontend
    ],
    allow_credentials=True,  # Required for httpOnly cookies
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["X-Correlation-ID", "Retry-After"],
    max_age=600,  # Cache preflight for 10 minutes
)
```

**Why not `allow_origins=["*"]`:** Wildcard CORS with `allow_credentials=True` is a security anti-pattern. It allows any website to make authenticated requests to your API, enabling session hijacking.

### Rate Limiting

```python
# backend/middleware/rate_limiter.py

from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="memory://",  # Use "redis://..." for production with multiple workers
)

# Per-endpoint limits
RATE_LIMITS = {
    "auth_register": "5/minute",
    "auth_login": "10/minute",
    "auth_refresh": "20/minute",
    "documents_upload": "10/minute",
    "chat_messages": "20/minute",
    "default": "60/minute",
}


@limiter.limit(RATE_LIMITS["auth_register"])
@router.post("/auth/register")
async def register(request: Request, ...):
    ...


@limiter.limit(RATE_LIMITS["auth_login"])
@router.post("/auth/login")
async def login(request: Request, ...):
    ...


@limiter.limit(RATE_LIMITS["chat_messages"])
@router.post("/chat/sessions/{session_id}/messages")
async def send_message(request: Request, ...):
    ...
```

When rate limit is exceeded, the response is:
```json
{
    "success": false,
    "error": {
        "code": "RATE_LIMITED",
        "message": "Too many requests. Please try again in 30 seconds."
    }
}
```
With header `Retry-After: 30`.

### File Upload Security

1. **MIME type validation**: Check `file.content_type` against the allowlist. Additionally, check file magic bytes (first 4 bytes) to verify the file is actually the claimed type.
2. **Filename sanitization**: Strip all special characters, truncate to 100 chars, prepend timestamp.
3. **Size limit**: 10MB enforced at both the FastAPI middleware level and in the processing pipeline.
4. **No executable files**: The allowed MIME type list excludes `.exe`, `.sh`, `.bat`, etc.
5. **Storage path isolation**: Files are stored in paths that include `user_id`, preventing path traversal attacks.

### API Key Management

- All API keys (`OPENAI_API_KEY`, `PINECONE_API_KEY`, `JWT_SECRET`, etc.) are stored as environment variables.
- No API keys are committed to the repository.
- `.env` files are in `.gitignore`.
- If a key is leaked, rotate it immediately from the provider's dashboard.
- Render and Vercel both support encrypted environment variables at rest.

### CORS Preflight Handling

FastAPI handles OPTIONS requests automatically with the CORS middleware. The middleware responds with:
- `Access-Control-Allow-Origin`: The specific requesting origin (not `*`).
- `Access-Control-Allow-Methods`: Only the methods you explicitly list.
- `Access-Control-Allow-Headers`: Only `Authorization` and `Content-Type`.
- `Access-Control-Max-Age`: 600 seconds (browsers cache preflight for 10 min).

### CSRF Protection

With `SameSite=Strict` cookies and `allow_credentials=True` CORS, CSRF protection is built-in:
- Cross-origin requests will not include cookies unless explicitly configured.
- The browser will not send `SameSite=Strict` cookies in cross-origin contexts.
- For additional protection, the `Authorization` header can be used instead of cookies for the most sensitive operations.

### Security Headers (Frontend)

```javascript
// Set via Vercel configuration or meta tags in public/index.html
// Or via response headers from a middleware on the frontend

// Recommended security headers:
// Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// X-XSS-Protection: 1; mode=block
// Referrer-Policy: strict-origin-when-cross-origin
// Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 12. Error Handling & Resilience

### Global Exception Handler

```python
# backend/main.py

import uuid
import time
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


@app.middleware("http")
async def add_correlation_id(request: Request, call_next):
    """Generate a unique correlation ID for every request."""
    correlation_id = f"req_{uuid.uuid4().hex[:16]}"
    request.state.correlation_id = correlation_id

    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    response.headers["X-Correlation-ID"] = correlation_id
    response.headers["X-Process-Time"] = f"{process_time:.3f}"

    logger.info(
        "request_completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        latency_ms=int(process_time * 1000),
        correlation_id=correlation_id,
    )

    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all handler for unhandled exceptions."""
    correlation_id = getattr(request.state, "correlation_id", "unknown")

    logger.error(
        "unhandled_exception",
        exception_type=type(exc).__name__,
        exception_message=str(exc),
        path=request.url.path,
        method=request.method,
        correlation_id=correlation_id,
        exc_info=True,
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
            },
            "correlation_id": correlation_id,
        },
    )


@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    """Handle Pydantic validation errors with field-level details."""
    correlation_id = getattr(request.state, "correlation_id", "unknown")

    details = [
        {"field": ".".join(str(loc) for loc in err["loc"]), "message": err["msg"]}
        for err in exc.errors()
    ]

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": details,
            },
            "correlation_id": correlation_id,
        },
    )
```

### Structured Error Response Format

All errors follow the same format (defined in Section 5):
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Human-readable message",
        "details": []
    },
    "correlation_id": "req_abc123xyz"
}
```

### Retry Strategy

```python
# backend/utils/retry.py

import time
import functools
import logging

logger = logging.getLogger(__name__)


def with_retry(max_retries=3, base_delay=1.0, max_delay=30.0):
    """
    Decorator that retries a function with exponential backoff.
    base_delay=1.0 means delays of 1s, 2s, 4s between retries.
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    delay = min(base_delay * (2 ** attempt), max_delay)

                    if attempt < max_retries - 1:
                        logger.warning(
                            "retry_attempt",
                            function=func.__name__,
                            attempt=attempt + 1,
                            max_retries=max_retries,
                            delay_seconds=delay,
                            error=str(e),
                        )
                        time.sleep(delay)

            logger.error(
                "retry_exhausted",
                function=func.__name__,
                max_retries=max_retries,
                final_error=str(last_exception),
            )
            raise last_exception

        return wrapper
    return decorator
```

**Usage:**
```python
@with_retry(max_retries=3, base_delay=1.0)
def call_openai_embedding(texts):
    return openai_client.embeddings.create(
        model=settings.OPENAI_EMBEDDING_MODEL,
        input=texts
    )
```

### Circuit Breaker Pattern

```python
# backend/utils/circuit_breaker.py

import time
import logging

logger = logging.getLogger(__name__)


class CircuitBreaker:
    """
    Simplified circuit breaker.
    - CLOSED: Normal operation, requests pass through.
    - OPEN: Too many failures, requests are blocked for `recovery_timeout` seconds.
    - HALF_OPEN: After recovery timeout, one test request is allowed through.
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        name: str = "default"
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.name = name
        self._failure_count = 0
        self._last_failure_time = 0
        self._state = "closed"

    @property
    def state(self) -> str:
        if self._state == "open":
            if time.time() - self._last_failure_time >= self.recovery_timeout:
                self._state = "half_open"
        return self._state

    def record_success(self):
        self._failure_count = 0
        self._state = "closed"

    def record_failure(self):
        self._failure_count += 1
        self._last_failure_time = time.time()

        if self._failure_count >= self.failure_threshold:
            self._state = "open"
            logger.warning(
                "circuit_breaker_opened",
                name=self.name,
                failure_count=self._failure_count,
                recovery_timeout=self.recovery_timeout,
            )

    def can_execute(self) -> bool:
        state = self.state
        return state in ("closed", "half_open")


# Usage
openai_breaker = CircuitBreaker(
    failure_threshold=5,
    recovery_timeout=60.0,
    name="openai_api"
)

pinecone_breaker = CircuitBreaker(
    failure_threshold=5,
    recovery_timeout=60.0,
    name="pinecone_api"
)
```

### Graceful Degradation

| Service | Failure | User Impact | Recovery |
|---------|---------|-------------|----------|
| **Pinecone** | Unavailable | Return error message: "Document search is temporarily unavailable. Please try again in a few minutes." No crash. | Auto-recovers via circuit breaker. |
| **OpenAI Chat** | API error or timeout | Return error message: "AI service is temporarily unavailable. Please try again shortly." | Auto-recovers via circuit breaker + retry. |
| **OpenAI Embedding** | API error | Document processing fails; document marked as `failed` with error message. User can re-process. | Auto-recovers via retry. |
| **Supabase Storage** | Unavailable | Document upload fails with clear error. Existing documents continue to work if already processed. | Retry on next upload attempt. |
| **PostgreSQL** | Unavailable | All operations fail with 500. | Requires manual intervention; Render auto-restarts. |
| **Tesseract** | Crashes or not installed | OCR pages extracted as empty; document marked as `failed` with clear error. | Install/fix Tesseract, user re-uploads. |

### Health Check Endpoint

```python
# backend/routes/health.py

import time
from fastapi import APIRouter, Depends

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check(db=Depends(get_db)):
    checks = {}
    overall_status = "healthy"

    # Database check
    try:
        start = time.time()
        db.execute("SELECT 1")
        checks["database"] = {
            "status": "ok",
            "latency_ms": int((time.time() - start) * 1000)
        }
    except Exception as e:
        checks["database"] = {"status": "error", "message": str(e)}
        overall_status = "unhealthy"

    # Pinecone check
    try:
        start = time.time()
        pinecone_index = pinecone_client.Index(settings.PINECONE_INDEX_NAME)
        stats = pinecone_index.describe_index_stats()
        checks["pinecone"] = {
            "status": "ok",
            "latency_ms": int((time.time() - start) * 1000),
            "vector_count": stats.get("total_vector_count", 0)
        }
    except Exception as e:
        checks["pinecone"] = {"status": "error", "message": str(e)}
        overall_status = "degraded"

    # OpenAI key validity check
    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        client.models.list()
        checks["openai"] = {"status": "ok", "key_valid": True}
    except Exception as e:
        checks["openai"] = {"status": "error", "key_valid": False, "message": str(e)}
        overall_status = "degraded"

    return {
        "success": True,
        "data": {
            "status": overall_status,
            "checks": checks,
            "version": "1.0.0",
        }
    }
```

### Request Timeouts

| Endpoint Type | Timeout | Justification |
|---------------|---------|---------------|
| **Chat (POST /chat/sessions/{id}/messages)** | 30 seconds | Streaming response; includes embedding + Pinecone query + OpenAI streaming. |
| **Document upload (POST /documents/upload)** | 60 seconds | File upload + validation + storage. Processing happens in background. |
| **All other endpoints** | 10 seconds | Simple database operations. |
| **Document processing (BackgroundTask)** | 120 seconds | Full pipeline: download + extract + clean + chunk + embed + upsert. |
| **Health check** | 5 seconds | Should be fast; if slow, something is wrong. |

---

## 13. Environment Variables

### Backend Environment Variables

| Variable | Example Value | Required | Description |
|----------|--------------|----------|-------------|
| `OPENAI_API_KEY` | `sk-proj-abc123...` | Yes | OpenAI API key for embeddings and chat completions. |
| `PINECONE_API_KEY` | `abc123def456...` | Yes | Pinecone API key for vector database operations. |
| `PINECONE_INDEX_NAME` | `course-assistant-vectors` | Yes | Name of the Pinecone index to use. |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` | Yes | PostgreSQL connection string (Supabase). |
| `JWT_SECRET` | `your-random-64-char-string-here` | Yes | Secret key for signing JWT access tokens. Must be at least 32 characters. |
| `JWT_REFRESH_SECRET` | `your-different-random-64-char-string` | Yes | Separate secret for signing JWT refresh tokens. Must be different from JWT_SECRET. |
| `SUPABASE_URL` | `https://your-project.supabase.co` | Yes | Supabase project URL for storage and database operations. |
| `SUPABASE_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Yes | Supabase service role key (NOT the anon key -- use service role for backend). |
| `SUPABASE_STORAGE_BUCKET` | `course-documents` | Yes | Name of the Supabase Storage bucket. |
| `CORS_ORIGINS` | `http://localhost:3000,https://your-app.vercel.app` | Yes | Comma-separated list of allowed CORS origins. |
| `RATE_LIMIT_PER_MINUTE` | `60` | No | Default rate limit per user per minute. Default: 60. |
| `MAX_FILE_SIZE_MB` | `10` | No | Maximum upload file size in MB. Default: 10. |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | No | OpenAI model for generating embeddings. Default: text-embedding-3-small. |
| `OPENAI_CHAT_MODEL` | `gpt-4o-mini` | No | OpenAI model for chat completions. Default: gpt-4o-mini. |
| `ENVIRONMENT` | `development` or `production` | No | Controls logging verbosity and debug features. Default: development. |

### Frontend Environment Variables

| Variable | Example Value | Required | Description |
|----------|--------------|----------|-------------|
| `REACT_APP_API_BASE_URL` | `https://your-backend.onrender.com/api/v1` | Yes | Base URL for all API requests from the frontend. |
| `REACT_APP_SUPABASE_URL` | `https://your-project.supabase.co` | Only if using Supabase client directly | Supabase project URL. |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Only if using Supabase client directly | Supabase anonymous (public) key. |

**Important notes:**
- Frontend env vars must be prefixed with `REACT_APP_` for Create React App to include them in the build.
- Frontend env vars are embedded in the JavaScript bundle and are visible to users. Never put secret keys in frontend env vars.
- Backend env vars are never exposed to the client.

### .gitignore Contents

```gitignore
# Dependencies
node_modules/
__pycache__/
*.pyc
*.pyo
.venv/
venv/
env/

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Build outputs
build/
dist/
*.egg-info/

# Logs
*.log
logs/

# Temporary files
tmp/
temp/
/tmp/

# Testing
.coverage
htmlcov/
.pytest_cache/

# Render
render.yaml

# Supabase
supabase/.temp/
```

---

## 14. Development Setup

### Prerequisites

| Tool | Version | Purpose | Install |
|------|---------|---------|---------|
| **Node.js** | 18+ | Frontend build and development | https://nodejs.org |
| **Python** | 3.10+ | Backend runtime | https://python.org |
| **Git** | Latest | Version control | https://git-scm.com |
| **Tesseract** | 5.x | OCR for scanned documents | See below |

**Installing Tesseract:**

Windows:
```powershell
# Download installer from https://github.com/UB-Mannheim/tesseract/wiki
# During installation, check "Add to PATH"
# Verify installation:
tesseract --version
```

macOS:
```bash
brew install tesseract
```

Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

### Step-by-Step Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/ai-course-assistant.git
cd ai-course-assistant/backend

# 2. Create a virtual environment
python -m venv venv

# 3. Activate the virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file (copy from template)
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux

# 6. Fill in the .env file with your keys (see Environment Variables section)

# 7. Run database migrations
alembic upgrade head

# 8. Start the development server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend requirements.txt:**
```
fastapi==0.110.0
uvicorn[standard]==0.27.1
sqlalchemy==2.0.27
alembic==1.13.1
psycopg2-binary==2.9.9
pydantic[email]==2.6.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
httpx==0.26.0
openai==1.12.0
pinecone-client==3.0.0
pdfplumber==0.10.3
pytesseract==0.3.10
Pillow==10.2.0
supabase==2.3.0
slowapi==0.1.9
structlog==24.1.0
pytest==8.0.0
pytest-asyncio==0.23.0
```

### Step-by-Step Frontend Setup

```bash
# 1. Navigate to frontend directory
cd ai-course-assistant/frontend

# 2. Install dependencies
npm install

# 3. Create .env file
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux

# 4. Fill in REACT_APP_API_BASE_URL with your backend URL

# 5. Start the development server
npm start
```

### How to Create Supabase Project

1. Go to https://supabase.com and sign up for a free account.
2. Click "New Project" and provide:
   - Project name: `ai-course-assistant`
   - Database password: (generate a strong password and save it)
   - Region: US East (or closest to your users)
3. Wait for the project to be created (2-3 minutes).
4. Go to **Settings > API** and copy:
   - `Project URL` (used as `SUPABASE_URL`)
   - `service_role key` (used as `SUPABASE_KEY` -- click "Reveal" and copy)
   - `anon / public key` (used as `REACT_APP_SUPABASE_ANON_KEY` for frontend if needed)
5. Go to **SQL Editor** and paste the full database schema from Section 4. Execute it.
6. Go to **Storage** and create a new bucket:
   - Name: `course-documents`
   - Public: No (uncheck "Public bucket")
7. Go to **Storage > Policies** and paste the RLS policies from Section 10.
8. Go to **Settings > Database** and copy the connection string (used as `DATABASE_URL`). It looks like: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

### How to Create Pinecone Index

1. Go to https://www.pinecone.io and sign up for a free account.
2. Go to **Indexes** and click "Create Index".
3. Configure:
   - Index name: `course-assistant-vectors`
   - Dimensions: `1536`
   - Metric: `cosine`
   - Environment: `us-east-1-aws` (or closest region)
   - Capacity mode: `Serverless`
4. Click "Create Index" and wait for it to initialize (1-2 minutes).
5. Copy your API key from **API Keys** section (used as `PINECONE_API_KEY`).

### How to Get OpenAI API Key

1. Go to https://platform.openai.com and sign up or log in.
2. Go to **API Keys** (Settings > API Keys).
3. Click "Create new secret key". Give it a descriptive name like `course-assistant-dev`.
4. Copy the key immediately (it won't be shown again). This is your `OPENAI_API_KEY`.
5. Go to **Billing** and add a payment method. The free trial has limited credits.
6. Set a usage limit in the **Limits** section (recommended: $10/month for development).

### How to Run the Full Stack Locally

```bash
# Terminal 1: Backend
cd backend
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux
uvicorn backend.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm start
```

The frontend will be available at http://localhost:3000 and the backend at http://localhost:8000. The backend auto-generates API docs at http://localhost:8000/docs (Swagger UI) and http://localhost:8000/redoc (ReDoc).

### Database Migration Commands

```bash
# Initialize Alembic (already done, but for reference)
alembic init alembic

# Generate a migration after model changes
alembic revision --autogenerate -m "description_of_changes"

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current migration version
alembic current

# Show migration history
alembic history
```

---

## 15. Coding Conventions

### Python Conventions

| Rule | Example | Notes |
|------|---------|-------|
| **Naming** | `snake_case` for variables, functions, methods, and modules. `PascalCase` for classes and exceptions. | `user_id`, `get_document`, `DocumentProcessingService` |
| **Type hints** | Required on all function signatures. | `def process_document(self, document_id: str) -> None:` |
| **Docstrings** | Required on all public functions and classes. Use triple double quotes. | See Section 7 for examples. |
| **Max function length** | Guideline: 50 lines. If longer, break into helper methods. | Processing pipeline is an exception (linear flow). |
| **Imports** | Group in order: stdlib, third-party, local. Separate groups with blank lines. | `import os` (blank line) `import pdfplumber` (blank line) `from backend.config import settings` |
| **String quotes** | Double quotes for strings, single quotes for dict keys in non-JSON contexts. | Consistent with JSON compatibility. |
| **Line length** | 100 characters max. | Allows side-by-side terminal windows. |

### JavaScript Conventions

| Rule | Example | Notes |
|------|---------|-------|
| **Naming** | `camelCase` for variables and functions. `PascalCase` for components. `SCREAMING_SNAKE_CASE` for constants. | `userSession`, `DocumentUpload`, `MAX_FILE_SIZE` |
| **Components** | One component per file. File name matches component name. | `DocumentUpload.js` exports `DocumentUpload` |
| **PropTypes** | Use PropTypes for runtime type checking (or TypeScript if preferred). | Recommended but optional for solo projects. |
| **Exports** | Default exports for pages and components. Named exports for utilities and hooks. | `export default DocumentUpload;` / `export function useSSE() {}` |
| **Line length** | 100 characters max. | Matches backend convention. |

### File Naming Conventions

```
backend/
├── main.py                     # FastAPI app instance
├── config.py                   # Settings and env var loading
├── db.py                       # Database session management
├── models/                     # SQLAlchemy models
│   ├── __init__.py
│   ├── user.py
│   ├── course.py
│   ├── document.py
│   ├── chat.py
│   └── usage.py
├── schemas/                    # Pydantic schemas
│   ├── __init__.py
│   ├── auth.py
│   ├── document.py
│   ├── chat.py
│   └── course.py
├── routes/                     # API route handlers
│   ├── __init__.py
│   ├── auth.py
│   ├── documents.py
│   ├── chat.py
│   ├── courses.py
│   └── admin.py
├── services/                   # Business logic
│   ├── __init__.py
│   ├── auth_service.py
│   ├── document_service.py
│   ├── document_processing.py
│   ├── chat_service.py
│   ├── course_service.py
│   ├── admin_service.py
│   ├── pinecone_service.py
│   └── storage_service.py
├── middleware/                  # Custom middleware
│   ├── __init__.py
│   └── rate_limiter.py
├── utils/                      # Utility functions
│   ├── __init__.py
│   ├── retry.py
│   └── circuit_breaker.py
├── tests/                      # Test files
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_documents.py
│   ├── test_chat.py
│   └── test_processing.py
├── alembic/                    # Database migrations
│   ├── env.py
│   └── versions/
├── alembic.ini
├── requirements.txt
├── .env.example
└── .gitignore

frontend/
├── src/
│   ├── index.js
│   ├── App.js
│   ├── contexts/
│   ├── hooks/
│   ├── services/
│   ├── pages/
│   ├── components/
│   └── styles/
├── public/
│   └── index.html
├── package.json
├── .env.example
└── .gitignore
```

### Git Workflow

**Branch Naming:**
- `feature/*`: New features (e.g., `feature/chat-streaming`, `feature/admin-panel`)
- `fix/*`: Bug fixes (e.g., `fix/document-upload-validation`)
- `chore/*`: Maintenance tasks (e.g., `chore/update-dependencies`, `chore/setup-ci`)

**Commit Message Format:**
```
<type>(<scope>): <short description>

<optional body>
```

Examples:
```
feat(chat): implement SSE streaming for responses
fix(upload): validate MIME type before storage
docs(architecture): add database schema section
chore(deps): update FastAPI to 0.110.0
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`

**PR Process:**
1. Create a feature branch from `main`.
2. Make changes, commit with descriptive messages.
3. Push to remote and create a Pull Request.
4. PR description should explain what changed and why.
5. Self-review before merging (for solo project).
6. Merge to `main` after verification.

### API Response Format Standard

All responses follow the envelope pattern:
```json
{
    "success": true|false,
    "data": { ... },
    "error": { ... },
    "correlation_id": "req_..."
}
```

`data` is present on success. `error` is present on failure. `correlation_id` is always present.

### Logging Format

```python
# Structured JSON logging for production
import structlog

logger = structlog.get_logger()

logger.info(
    "document_uploaded",
    user_id=str(user.id),
    document_id=str(document.id),
    filename=document.filename,
    file_size_bytes=document.file_size_bytes,
    course_id=str(document.course_id),
)

# Output in production (JSON):
# {"event": "document_uploaded", "user_id": "...", "document_id": "...", ...}

# Output in development (human-readable):
# 2026-01-15 10:30:00 [info] document_uploaded user_id=... document_id=...
```

**What to log at each level:**
- **DEBUG**: Variable values, function entry/exit, SQL queries (dev only).
- **INFO**: Request handled, document uploaded, chat message sent, background task started/completed.
- **WARNING**: Rate limit hit, circuit breaker opened, retry attempt, daily budget approaching.
- **ERROR**: Unhandled exception, API call failed after retries, document processing failed, authentication failure.

---

## 16. Testing Strategy

### Unit Tests

```python
# backend/tests/conftest.py

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app
from backend.db import get_db
from backend.models import Base


@pytest.fixture(scope="function")
def test_db():
    """Create a fresh test database for each test."""
    engine = create_engine("sqlite:///./test.db")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield engine
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client(test_db):
    """Test client with overridden database."""
    return TestClient(app)


@pytest.fixture
def sample_user(client):
    """Create and return a registered test user."""
    response = client.post("/api/v1/auth/register", json={
        "email": "test@university.edu",
        "password": "TestPass123!",
        "full_name": "Test User"
    })
    return response.json()["data"]
```

```python
# backend/tests/test_processing.py

from backend.services.document_processing import DocumentProcessingService


class TestTextCleaning:
    def setup_method(self):
        self.service = DocumentProcessingService()

    def test_removes_excessive_whitespace(self):
        text = "Hello    world\n\n\n\n\nNew paragraph"
        result = self.service._clean_text(text)
        assert "\n\n\n" not in result
        assert "    " not in result

    def test_removes_page_numbers(self):
        text = "Some content\nPage 12\nMore content"
        result = self.service._clean_text(text)
        assert "Page 12" not in result
        assert "Some content" in result

    def test_preserves_paragraph_breaks(self):
        text = "Paragraph one.\n\nParagraph two."
        result = self.service._clean_text(text)
        assert "\n\n" in result

    def test_removes_control_characters(self):
        text = "Hello\x00\x01\x02world"
        result = self.service._clean_text(text)
        assert result == "Helloworld"

    def test_empty_text(self):
        assert self.service._clean_text("") == ""
        assert self.service._clean_text(None) == ""


class TestChunking:
    def setup_method(self):
        self.service = DocumentProcessingService()

    def test_short_text_single_chunk(self):
        text = "This is a short text."
        chunks = self.service._recursive_split(text, max_chars=2000, overlap_chars=200)
        assert len(chunks) == 1
        assert chunks[0] == text

    def test_long_text_multiple_chunks(self):
        text = "Word " * 1000  # ~5000 characters
        chunks = self.service._recursive_split(text, max_chars=2000, overlap_chars=200)
        assert len(chunks) > 1
        for chunk in chunks:
            assert len(chunk) <= 2200  # Allow some overlap overshoot

    def test_prefers_paragraph_split(self):
        text = "Paragraph one.\n\n" + "Word " * 500 + "\n\nParagraph two."
        chunks = self.service._recursive_split(text, max_chars=2000, overlap_chars=200)
        assert len(chunks) >= 2

    def test_empty_text(self):
        chunks = self.service._recursive_split("", max_chars=2000, overlap_chars=200)
        assert len(chunks) == 0


class TestScannedPageDetection:
    def setup_method(self):
        self.service = DocumentProcessingService()

    def test_empty_text_is_scanned(self):
        assert self.service._is_scanned_page("", None) is True

    def test_very_short_text_is_scanned(self):
        assert self.service._is_scanned_page("Hi", None) is True
```

```python
# backend/tests/test_auth.py

import pytest


class TestRegister:
    def test_successful_registration(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "new@university.edu",
            "password": "StrongPass1!",
            "full_name": "New User"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert "access_token" in data["data"]
        assert data["data"]["user"]["email"] == "new@university.edu"
        assert data["data"]["user"]["role"] == "student"

    def test_duplicate_email(self, client):
        user_data = {
            "email": "dup@university.edu",
            "password": "StrongPass1!",
            "full_name": "First User"
        }
        client.post("/api/v1/auth/register", json=user_data)
        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 409

    def test_weak_password(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "weak@university.edu",
            "password": "123",
            "full_name": "Weak User"
        })
        assert response.status_code == 422

    def test_invalid_email(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "password": "StrongPass1!",
            "full_name": "Bad Email User"
        })
        assert response.status_code == 422


class TestLogin:
    def test_successful_login(self, client):
        # Register first
        client.post("/api/v1/auth/register", json={
            "email": "login@university.edu",
            "password": "StrongPass1!",
            "full_name": "Login User"
        })
        # Then login
        response = client.post("/api/v1/auth/login", json={
            "email": "login@university.edu",
            "password": "StrongPass1!"
        })
        assert response.status_code == 200
        assert "access_token" in response.json()["data"]

    def test_wrong_password(self, client):
        client.post("/api/v1/auth/register", json={
            "email": "wrong@university.edu",
            "password": "StrongPass1!",
            "full_name": "Wrong User"
        })
        response = client.post("/api/v1/auth/login", json={
            "email": "wrong@university.edu",
            "password": "WrongPassword!"
        })
        assert response.status_code == 401
```

### Integration Tests

```python
# backend/tests/test_documents.py

import io
import pytest


class TestDocumentUpload:
    def test_upload_pdf(self, client, sample_user):
        # Create a minimal PDF in memory
        pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n..."
        response = client.post(
            "/api/v1/documents/upload",
            files={"file": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")},
            data={"course_id": "some-course-id"},
            headers={"Authorization": f"Bearer {sample_user['access_token']}"}
        )
        assert response.status_code == 202
        assert response.json()["data"]["status"] == "pending"

    def test_upload_too_large(self, client, sample_user):
        large_content = b"x" * (11 * 1024 * 1024)  # 11MB
        response = client.post(
            "/api/v1/documents/upload",
            files={"file": ("large.pdf", io.BytesIO(large_content), "application/pdf")},
            data={"course_id": "some-course-id"},
            headers={"Authorization": f"Bearer {sample_user['access_token']}"}
        )
        assert response.status_code == 413

    def test_upload_unauthorized(self, client):
        response = client.post(
            "/api/v1/documents/upload",
            files={"file": ("test.pdf", io.BytesIO(b"content"), "application/pdf")},
            data={"course_id": "some-course-id"}
        )
        assert response.status_code == 401


# backend/tests/test_chat.py

class TestChatSessions:
    def test_create_session(self, client, sample_user):
        response = client.post(
            "/api/v1/chat/sessions",
            json={"course_id": "some-course-id", "title": "Test Chat"},
            headers={"Authorization": f"Bearer {sample_user['access_token']}"}
        )
        assert response.status_code == 201
        assert response.json()["data"]["title"] == "Test Chat"

    def test_send_empty_message(self, client, sample_user):
        # Create session first
        session_resp = client.post(
            "/api/v1/chat/sessions",
            json={"course_id": "some-course-id"},
            headers={"Authorization": f"Bearer {sample_user['access_token']}"}
        )
        session_id = session_resp.json()["data"]["id"]

        response = client.post(
            f"/api/v1/chat/sessions/{session_id}/messages",
            json={"message": ""},
            headers={"Authorization": f"Bearer {sample_user['access_token']}"}
        )
        assert response.status_code == 422
```

### Test Scenarios to Cover

| Scenario | Test Type | What to Verify |
|----------|-----------|---------------|
| OCR fallback | Unit | `_is_scanned_page` returns True for low-text pages; OCR is invoked |
| Failed upload (wrong type) | Integration | Returns 415 error, no file stored |
| Failed upload (too large) | Integration | Returns 413 error, no file stored |
| Unauthorized access | Integration | Returns 401 without valid token |
| Forbidden access | Integration | Returns 403 when accessing other user's resources |
| Empty document | Unit | Processing marks document as `failed` with appropriate message |
| Large document (>50 pages) | Unit | Validation rejects before processing |
| Password-protected PDF | Unit | Validation rejects with clear error |
| Chat with no relevant docs | Integration | Returns fallback "I don't have relevant information" message |
| Chat streaming | Integration | SSE events are properly formatted and complete |
| Token refresh | Integration | Expired access token triggers successful refresh |
| Rate limiting | Integration | Excessive requests return 429 with Retry-After header |
| Circuit breaker | Unit | Opens after 5 failures, recovers after 60 seconds |

### Frontend Tests (Optional but Recommended)

```javascript
// src/components/Documents/DocumentUpload.test.js

import { render, screen, fireEvent } from '@testing-library/react';
import DocumentUpload from './DocumentUpload';

describe('DocumentUpload', () => {
    it('renders upload area', () => {
        render(<DocumentUpload courseId="test-course" />);
        expect(screen.getByText(/drop a file here/i)).toBeInTheDocument();
    });

    it('shows error for oversized file', async () => {
        render(<DocumentUpload courseId="test-course" />);
        const file = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
            type: 'application/pdf',
        });
        const input = screen.getByRole('button').querySelector('input[type="file"]');
        fireEvent.change(input, { target: { files: [file] } });
        expect(await screen.findByText(/file too large/i)).toBeInTheDocument();
    });
});
```

### Manual Testing Checklist

- [ ] Register a new account
- [ ] Login with existing account
- [ ] Create a new course (as lecturer)
- [ ] Enroll a student in a course
- [ ] Upload a digital PDF document
- [ ] Upload a scanned image document
- [ ] Verify OCR processing completes
- [ ] Verify document status updates (pending -> processing -> ready)
- [ ] Create a new chat session
- [ ] Ask a question and verify streaming response
- [ ] Verify source citations appear in response
- [ ] Ask a question not covered by documents (verify fallback response)
- [ ] Upload a password-protected PDF (verify rejection)
- [ ] Upload an oversized file (verify rejection)
- [ ] Delete a document and verify cleanup
- [ ] Delete a chat session
- [ ] Test on mobile viewport (responsive design)
- [ ] Test admin panel: view users, view usage stats, check health
- [ ] Test role-based access: student cannot access admin endpoints
- [ ] Test concurrent document processing

---

## 17. Deployment

### Render Backend Deployment

**Service Configuration:**

| Setting | Value |
|---------|-------|
| **Service Type** | Web Service |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `cd backend && uvicorn backend.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free (for demo) or Basic ($7/month for always-on) |
| **Auto Deploy** | Yes (from main branch) |

**Environment Variables (set in Render Dashboard):**

Set all backend environment variables from Section 13 in the Render dashboard under Environment. Use Render's "Encrypt" feature for sensitive values.

**Key notes for Render:**
- Render free tier spins down after 15 minutes of inactivity. The first request after sleep takes 30-60 seconds to wake up.
- For the defense demo, use the "wake-up strategy" described below.
- Render assigns a random `$PORT` -- the start command must use it.

### Vercel Frontend Deployment

**Project Settings:**

| Setting | Value |
|---------|-------|
| **Framework Preset** | Create React App |
| **Build Command** | `npm run build` |
| **Output Directory** | `build` |
| **Root Directory** | `frontend` |
| **Install Command** | `npm install` |

**Environment Variables:**

Set `REACT_APP_API_BASE_URL` in Vercel dashboard under Settings > Environment Variables. Set it to your Render backend URL: `https://your-backend.onrender.com/api/v1`.

**Vercel Configuration File (`frontend/vercel.json`):**

```json
{
    "rewrites": [
        {
            "source": "/(.*)",
            "destination": "/index.html"
        }
    ],
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                { "key": "X-Content-Type-Options", "value": "nosniff" },
                { "key": "X-Frame-Options", "value": "DENY" },
                { "key": "X-XSS-Protection", "value": "1; mode=block" },
                { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
            ]
        }
    ]
}
```

The rewrite rule ensures React Router handles client-side routing (all paths serve `index.html`).

### Supabase Setup

**1. Database Schema Migration:**

Go to Supabase Dashboard > SQL Editor. Paste the entire schema from Section 4 and execute it. Verify all tables exist under Database > Tables.

**2. Storage Bucket Creation:**

Go to Storage > Buckets > New Bucket:
- Name: `course-documents`
- Public: No (disable public access)
- File size limit: 10MB
- Allowed MIME types: `application/pdf, image/png, image/jpeg, image/tiff`

**3. Row Level Security Policies:**

Go to Storage > Policies. Add the four policies from Section 10:
- "Users can upload to own folder" (INSERT)
- "Users can read enrolled course files" (SELECT)
- "Users can delete own uploads" (DELETE)
- "Admins have full access" (ALL)

**4. Disable Email Confirmation (for development):**

Go to Authentication > Providers > Email. Disable "Confirm email" for faster development. Re-enable before production launch if needed.

### Pinecone Index Creation

Via Pinecone Dashboard (described in Section 14).

Via API (alternative):
```python
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key="your-api-key")

pc.create_index(
    name="course-assistant-vectors",
    dimension=1536,
    metric="cosine",
    spec=ServerlessSpec(
        cloud="aws",
        region="us-east-1"
    )
)
```

### Post-Deployment Verification Checklist

- [ ] Backend health check returns 200: `GET https://your-backend.onrender.com/health`
- [ ] Backend API docs accessible: `GET https://your-backend.onrender.com/docs`
- [ ] Frontend loads without errors: `GET https://your-app.vercel.app`
- [ ] Registration works end-to-end (frontend -> backend -> Supabase)
- [ ] Login works and sets cookies correctly
- [ ] Course creation works (as lecturer)
- [ ] Document upload works (file appears in Supabase Storage)
- [ ] Document processing completes (status changes from `pending` to `ready`)
- [ ] Chat streaming works with SSE
- [ ] Source citations appear in chat responses
- [ ] Fallback response works when asking about topics not in documents
- [ ] Admin panel loads and shows data
- [ ] CORS works (no browser console errors)
- [ ] Rate limiting returns 429 when exceeded
- [ ] Token refresh works (wait 30 minutes, make a request)

### Custom Domain Setup (Optional)

**Vercel:**
1. Go to your Vercel project > Settings > Domains.
2. Add your custom domain (e.g., `chat.youruniversity.edu`).
3. Configure DNS: Add a CNAME record pointing to `cname.vercel-dns.com`.
4. Vercel auto-provisions SSL certificate.

**Render:**
1. Go to your Render service > Settings > Custom Domains.
2. Add your domain.
3. Configure DNS: Add a CNAME record pointing to `your-backend.onrender.com`.
4. Render auto-provisions SSL certificate.

### Handling Render Free Tier Sleep

Render free tier spins down after 15 minutes of inactivity. The first request takes 30-60 seconds as the service cold-starts.

**Wake-up strategies:**

1. **Before demo**: Open the backend health check URL in a browser tab 2 minutes before the demo. This keeps the service alive.

2. **Automated keep-alive**: Set up a cron job (using cron-job.org or similar) to ping the health check endpoint every 10 minutes:
   ```
   GET https://your-backend.onrender.com/health
   ```
   This prevents the service from sleeping.

3. **Upgrade to Basic ($7/month)**: If the defense requires guaranteed availability, upgrade to Render Basic tier which has no sleep.

4. **Local fallback**: Have the full stack running locally as a backup. If Render is slow during demo, switch to localhost.

**Frontend wake-up**: The Vercel frontend does not sleep (free tier for static sites is always-on). Only the backend on Render sleeps.

---

## 18. Monitoring & Observability

### Structured Logging

```python
# backend/logging_config.py

import structlog
import logging
import sys


def setup_logging(environment: str = "development"):
    """Configure structured logging for the application."""

    if environment == "production":
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer()

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            renderer,
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )

    # Also configure standard logging for third-party libraries
    logging.basicConfig(
        format="%(message)s",
        level=logging.INFO,
        stream=sys.stdout,
    )
```

**Initialization in main.py:**
```python
from backend.logging_config import setup_logging

app = FastAPI(title="AI Course Assistant API", version="1.0.0")
setup_logging(environment=os.getenv("ENVIRONMENT", "development"))

logger = structlog.get_logger()
```

### Correlation IDs

Every request gets a unique correlation ID (generated in the middleware from Section 12). This ID is:
1. Returned in the response header `X-Correlation-ID`.
2. Included in every log entry generated during that request.
3. Stored in `structlog.contextvars` so all log calls automatically include it.

```python
# In any service or route:
import structlog

logger = structlog.get_logger()

# This log entry will automatically include the correlation_id
logger.info("document_uploaded", document_id="abc-123", filename="lecture.pdf")
```

### What to Log

| Event | Log Level | Fields |
|-------|-----------|--------|
| Request received | INFO | `method`, `path`, `user_id`, `correlation_id` |
| Request completed | INFO | `method`, `path`, `status_code`, `latency_ms`, `correlation_id` |
| Document uploaded | INFO | `user_id`, `document_id`, `filename`, `file_size_bytes`, `course_id` |
| Document processing started | INFO | `document_id`, `course_id` |
| Document processing completed | INFO | `document_id`, `chunk_count`, `page_count`, `processing_time_ms` |
| Document processing failed | ERROR | `document_id`, `error_message`, `traceback` |
| Chat message sent | INFO | `user_id`, `session_id`, `message_length`, `chunks_retrieved` |
| Chat response completed | INFO | `session_id`, `tokens_used`, `model_used`, `latency_ms` |
| OpenAI API call | INFO | `model`, `tokens_input`, `tokens_output`, `latency_ms` |
| OpenAI API error | ERROR | `model`, `error_message`, `attempt`, `max_retries` |
| Rate limit exceeded | WARNING | `user_id`, `path`, `limit`, `window` |
| Circuit breaker opened | WARNING | `service_name`, `failure_count`, `recovery_timeout` |
| Authentication failure | WARNING | `email`, `ip_address`, `reason` |
| Daily budget warning | WARNING | `current_spend_usd`, `budget_usd` |
| Health check | INFO | `component`, `status`, `latency_ms` |

### Simple Metrics

Track in the `usage_logs` table and compute on demand via the admin endpoint:

| Metric | How to Compute |
|--------|---------------|
| **Request count** | `SELECT COUNT(*) FROM usage_logs WHERE created_at > NOW() - INTERVAL '1 day'` |
| **Average response time** | `SELECT AVG(latency_ms) FROM usage_logs WHERE created_at > NOW() - INTERVAL '1 hour'` |
| **Error rate** | `SELECT COUNT(*) FROM usage_logs WHERE action = 'error' AND created_at > NOW() - INTERVAL '1 day'` |
| **OpenAI token usage** | `SELECT SUM(tokens_input + tokens_output) FROM usage_logs WHERE action = 'chat_message' AND created_at > NOW() - INTERVAL '1 day'` |
| **Daily cost** | `SELECT SUM(cost_usd) FROM usage_logs WHERE created_at::date = CURRENT_DATE` |
| **Active users** | `SELECT COUNT(DISTINCT user_id) FROM usage_logs WHERE created_at > NOW() - INTERVAL '7 days'` |
| **Documents processed today** | `SELECT COUNT(*) FROM documents WHERE status = 'ready' AND updated_at::date = CURRENT_DATE` |

### Sentry Integration (Optional but Recommended)

```python
# backend/main.py

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    traces_sample_rate=0.1,  # 10% of requests for performance monitoring
    environment=os.getenv("ENVIRONMENT", "development"),
    integrations=[
        FastApiIntegration(
            auto_enables_integrations=True,
        )
    ],
)
```

Free tier: 5,000 errors/month, 10,000 performance events/month.

### How to Check Logs on Render

1. Go to your Render dashboard > your backend service > Logs.
2. Logs are streamed in real-time.
3. Use the search bar to filter by correlation_id, user_id, or error message.
4. For persistent logs, configure a log drain to an external service (e.g., Datadog, Logflare).

**Render CLI (alternative):**
```bash
# Install Render CLI
npm install -g @renderinc/render-cli

# View logs
render logs --service your-backend-name --tail
```

---

## 19. Cost Management

### Detailed Cost Breakdown

| Service | Tier | Monthly Cost | What's Included |
|---------|------|-------------|-----------------|
| **Render (Backend)** | Free | $0 | 750 hours/month, spins down after 15min inactivity. |
| **Render (Backend)** | Basic | $7 | Always-on, 512MB RAM, 0.5 CPU. |
| **Vercel (Frontend)** | Hobby | $0 | Unlimited static deployments, 100GB bandwidth. |
| **Supabase (Database + Storage)** | Free | $0 | 500MB database, 1GB storage, 2GB bandwidth, 50,000 monthly active users. |
| **Pinecone** | Free | $0 | 100k vectors, 100k queries/month, 1 namespace (upgrade for multiple). |
| **OpenAI** | Pay-as-you-go | ~$0.50-$5.00/month | Depends on usage (see calculator below). |
| **Domain (optional)** | -- | ~$10-15/year | Only if using custom domain. |
| **Sentry (optional)** | Free | $0 | 5,000 errors/month. |
| **Total (minimum)** | -- | **$0-$0.50/month** | All free tiers + minimal OpenAI usage. |
| **Total (recommended)** | -- | **~$8-$13/month** | Render Basic + OpenAI usage. |

### OpenAI Cost Calculator

**Embedding Costs (text-embedding-3-small):**
- Price: $0.02 per 1M tokens
- 1 page of text ~ 500 tokens
- Embedding 1 page ~ $0.00001 (0.001 cents)
- Embedding a 100-page PDF ~ $0.001 (0.1 cents)
- Embedding 1,000 pages across all documents ~ $0.01

**Chat Completion Costs (gpt-4o-mini):**
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens
- Average chat query: ~1,500 input tokens (system prompt + context + history + question) + ~300 output tokens
- Cost per query: ~$0.00023 + ~$0.00018 = **~$0.0004 per query** (less than 1/10th of a cent)

**Usage Estimates for University Project:**

| Usage Pattern | Documents | Queries/Day | Monthly OpenAI Cost |
|--------------|-----------|-------------|-------------------|
| Light (personal) | 10 | 5 | ~$0.06 |
| Medium (small class, 30 students) | 50 | 50 | ~$0.60 |
| Heavy (large class, 100 students) | 100 | 200 | ~$2.40 |
| Extreme (department-wide) | 500 | 1000 | ~$12.00 |

### Token Budget per Chat Session

Each chat session is limited to manage costs:

| Limit | Value | Justification |
|-------|-------|---------------|
| Max messages per session | 100 | Prevents runaway token accumulation. |
| Max context window | 3,000 tokens | Limits per-query cost to ~$0.0005. |
| Max history sent | 10 messages | Prevents growing cost per query in long conversations. |
| Max response tokens | 2,048 | Caps output cost at ~$0.0012 per response. |

**Worst-case cost per chat session:** 100 queries x $0.0005 = $0.05 per fully-used session.

### Usage Tracking

Every API call that uses OpenAI is logged to the `usage_logs` table:

```python
# In chat service, after response:
from backend.models import UsageLog

usage_log = UsageLog(
    user_id=user_id,
    action="chat_message",
    resource_type="chat_session",
    resource_id=session_id,
    tokens_input=prompt_tokens,
    tokens_output=completion_tokens,
    embedding_tokens=embedding_tokens,
    model_used="gpt-4o-mini",
    latency_ms=int((time.time() - start_time) * 1000),
    cost_usd=calculate_cost(model, prompt_tokens, completion_tokens),
)
db.add(usage_log)
db.commit()
```

**Cost calculation function:**
```python
MODEL_PRICING = {
    "gpt-4o-mini": {"input": 0.15 / 1_000_000, "output": 0.60 / 1_000_000},
    "gpt-4o": {"input": 2.50 / 1_000_000, "output": 10.00 / 1_000_000},
    "text-embedding-3-small": {"input": 0.02 / 1_000_000, "output": 0},
}


def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    pricing = MODEL_PRICING.get(model, MODEL_PRICING["gpt-4o-mini"])
    return (input_tokens * pricing["input"]) + (output_tokens * pricing["output"])
```

### Hard Limits

| Resource | Limit | Enforcement |
|----------|-------|-------------|
| Max documents per course | 100 | Checked on upload; return 409 if exceeded |
| Max chat messages per session | 100 | Checked before saving new message; return 429 if exceeded |
| Max concurrent processing | 5 | Checked before launching BackgroundTask; queue if exceeded |
| Max file size | 10MB | Checked at upload and in processing pipeline |
| Max pages per document | 50 | Checked during processing validation |
| Max chat sessions per user per course | 10 | Checked on session creation |
| Daily OpenAI budget | $10.00 | Checked before each OpenAI call; block if exceeded |

### Warning System

```python
# In any function that makes OpenAI calls:
import structlog

logger = structlog.get_logger()

DAILY_BUDGET_USD = float(os.getenv("DAILY_OPENAI_BUDGET_USD", "10.00"))


def check_daily_budget(db):
    """Log a warning if daily OpenAI spend is approaching the limit."""
    today = datetime.utcnow().date()
    result = db.execute(
        "SELECT COALESCE(SUM(cost_usd), 0) FROM usage_logs "
        "WHERE created_at::date = :today",
        {"today": today}
    ).scalar()

    current_spend = float(result)

    if current_spend >= DAILY_BUDGET_USD * 0.8:
        logger.warning(
            "daily_budget_warning",
            current_spend_usd=current_spend,
            budget_usd=DAILY_BUDGET_USD,
            percentage=round(current_spend / DAILY_BUDGET_USD * 100, 1),
        )

    if current_spend >= DAILY_BUDGET_USD:
        logger.error(
            "daily_budget_exceeded",
            current_spend_usd=current_spend,
            budget_usd=DAILY_BUDGET_USD,
        )
        raise BudgetExceededError("Daily OpenAI budget has been exceeded. Please try again tomorrow.")
```

---

## 20. Pre-Defense Checklist

### Functionality Checklist

- [ ] User registration works with email validation
- [ ] User login works and returns JWT tokens
- [ ] Token refresh works transparently
- [ ] Logout clears tokens and redirects to login
- [ ] Role-based access: student, lecturer, admin
- [ ] Course creation (lecturer/admin only)
- [ ] Course enrollment works
- [ ] Document upload: PDF, PNG, JPEG, TIFF
- [ ] File size validation (10MB max)
- [ ] Document processing pipeline: upload -> processing -> ready
- [ ] OCR works on scanned documents
- [ ] Digital PDF text extraction works
- [ ] Document status polling updates in real-time
- [ ] Document deletion cleans up storage, vectors, and database
- [ ] Chat session creation
- [ ] Chat message sending with streaming SSE response
- [ ] Source citations appear in responses
- [ ] Fallback response when no relevant documents exist
- [ ] Conversation history maintained within session
- [ ] Chat session deletion
- [ ] Admin panel: user management, usage stats, health check
- [ ] Responsive design works on mobile and desktop
- [ ] Error messages are clear and user-friendly

### Security Checklist

- [ ] Passwords are hashed with bcrypt (never stored in plain text)
- [ ] JWT tokens have appropriate expiry (30min access, 7-day refresh)
- [ ] httpOnly cookies used for token storage (not localStorage)
- [ ] CORS configured with specific origins (not wildcard)
- [ ] Rate limiting on auth and chat endpoints
- [ ] Input validation on all endpoints (Pydantic models)
- [ ] File upload validation (MIME type, size, name sanitization)
- [ ] SQL injection prevented (SQLAlchemy ORM)
- [ ] XSS prevented (React auto-escaping)
- [ ] No API keys in source code (all in environment variables)
- [ ] .env files in .gitignore
- [ ] Supabase RLS policies active on storage bucket

### Deployment Checklist

- [ ] Backend deployed on Render and accessible
- [ ] Frontend deployed on Vercel and accessible
- [ ] Backend health check returns 200
- [ ] Frontend loads without console errors
- [ ] Database schema applied in Supabase
- [ ] Pinecone index created and populated
- [ ] Storage bucket created with RLS policies
- [ ] All environment variables set correctly
- [ ] CORS allows production frontend URL
- [ ] HTTPS enabled on all services
- [ ] Render free tier wake-up strategy configured (cron keep-alive)
- [ ] Backup plan ready (local demo)

### Documentation Checklist

- [ ] Architecture document complete (this document)
- [ ] README.md with setup instructions
- [ ] API documentation auto-generated at /docs
- [ ] Code comments on complex logic
- [ ] .env.example with all required variables
- [ ] Git repository with clean commit history

### Presentation Preparation Checklist

- [ ] Demo script prepared with step-by-step flow
- [ ] Test accounts created (student, lecturer, admin)
- [ ] Sample documents uploaded and processed
- [ ] Pre-made chat conversation to demonstrate streaming
- [ ] Slides covering: problem, solution, architecture, demo, future work
- [ ] Backup video recording of demo in case of network issues
- [ ] Practice run-through completed at least twice

### Common Defense Questions and Suggested Answers

**Q: Why RAG instead of fine-tuning?**
A: RAG provides source attribution (we can cite exactly which document and page an answer came from), is cheaper (embedding a PDF costs a fraction of a cent vs. $5+ for fine-tuning), supports instant document updates without retraining, and is transparent -- we can inspect exactly which chunks influenced the answer.

**Q: How does the system handle hallucination?**
A: We use four techniques: (1) low temperature (0.1) to reduce creative drift, (2) explicit system prompt instructions to say "I don't know" when context is insufficient, (3) similarity threshold of 0.7 to exclude loosely related content that might confuse the model, and (4) source citation requirement which forces the model to reference specific source text rather than generating from memory.

**Q: What happens if the OpenAI API goes down?**
A: The circuit breaker pattern detects repeated failures and stops making requests for 60 seconds, preventing wasted API calls. Users see a friendly error message: "AI service is temporarily unavailable. Please try again shortly." The document processing pipeline marks affected documents as `failed` so users can re-process them later.

**Q: How do you handle scanned PDFs?**
A: The system detects scanned pages using a text-density heuristic -- if the extracted text is less than 50 characters or covers less than 2% of the page area, the page is treated as scanned. The system then converts the page to a high-resolution image (300 DPI) and runs Tesseract OCR to extract text. This is seamless to the user.

**Q: How is data isolated between courses?**
A: Each course has its own Pinecone namespace, so vector queries are automatically scoped to that course's documents. PostgreSQL uses foreign keys to enforce course-level relationships. A student enrolled in Course A cannot retrieve vectors from Course B because the namespace boundary is absolute.

**Q: What are the limitations of the system?**
A: (1) OCR accuracy varies with document quality -- handwritten notes may produce poor results. (2) Complex mathematical notation in PDFs may not extract cleanly. (3) The system is limited to the uploaded documents -- it cannot access external knowledge. (4) Token limits mean very long documents may lose some context at chunk boundaries. (5) The free tier has storage and query limits that would need upgrading for large-scale use.

**Q: How would you scale this to 10,000 users?**
A: (1) Move from FastAPI BackgroundTasks to Celery with Redis for reliable async processing. (2) Upgrade Pinecone to a paid plan for higher query throughput. (3) Add a CDN layer for the frontend. (4) Use connection pooling for PostgreSQL. (5) Add caching for frequently asked questions. (6) Implement horizontal scaling on Render with multiple instances behind a load balancer.

### Backup Plan (Local Demo Setup)

If any cloud service is unreachable during the defense:

1. Have the full project cloned locally.
2. Run `docker-compose up` (create a docker-compose.yml for local development):
   - Backend on localhost:8000
   - Frontend on localhost:3000
   - Supabase local alternative: Use a local PostgreSQL instance
   - For Pinecone: Use a local vector store (ChromaDB) as fallback

3. Pre-load the local database with test data:
   - 2 test users (student + admin)
   - 1 course with 3 documents already processed
   - 2 chat sessions with existing conversations

4. Test the full flow locally before the defense.

**Quick local setup without Docker:**
```bash
# Terminal 1: Backend
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm start
```

Ensure your `.env` file points to the real Supabase/Pinecone/OpenAI services even for local development -- this way the full stack works locally without needing local database setup.

---

*End of AI Course Assistant Chatbot Architecture Guide v2.*
*Document version: 2.0*
*Last updated: July 2026*
