# AI Course Assistant Chatbot — Phased Implementation Plan

**Reference architecture:** `AI_Course_Assistant_Architecture_Guide_v2.md`

**How to use this document:**
- Each phase is sequential. Do not start a phase until its entry gate is satisfied.
- Each sub-phase lists exactly what to build and how to verify it.
- The acceptance criteria at the end of each phase are **all-or-nothing**. Every item must pass before moving on.
- When a sub-phase says "implement X as described in Architecture Section Y," read that section before writing code.

---

## Table of Contents

| Phase | Title | Estimated Time |
|-------|-------|---------------|
| 0 | Environment & Account Setup | 1–2 hours |
| 1 | Project Scaffolding | 1–2 hours |
| 2 | Database Layer & Models | 2–3 hours |
| 3 | Authentication System | 3–4 hours |
| 4 | File Storage (Supabase Storage) | 2–3 hours |
| 5 | Document Upload API | 2–3 hours |
| 6 | Document Processing Pipeline | 4–6 hours |
| 7 | Pinecone Integration | 2–3 hours |
| 8 | RAG Chat System | 4–6 hours |
| 9 | Frontend: Core, Routing & Auth | 4–6 hours |
| 10 | Frontend: Document Management | 3–4 hours |
| 11 | Frontend: Chat Interface | 4–6 hours |
| 12 | Frontend: Admin Panel | 2–3 hours |
| 13 | Security Hardening & Middleware | 2–3 hours |
| 14 | Testing | 3–4 hours |
| 15 | Deployment | 2–3 hours |
| 16 | Monitoring, Logging & Cost Controls | 2–3 hours |
| 17 | Final Verification & Pre-Defense Prep | 2–3 hours |

---

## Phase 0: Environment & Account Setup

**Entry gate:** None. This is the starting point.

### Sub-phase 0.1: Create External Service Accounts

Create accounts on every external service the system depends on. Do not proceed until all accounts exist and you have copied every key/credential into a temporary safe location (password manager or encrypted note).

| Service | URL | What to create |
|---------|-----|---------------|
| GitHub | github.com | Repository (private) named `ai-course-assistant` |
| Supabase | supabase.com | New project named `ai-course-assistant` |
| Pinecone | pinecone.io | Free account |
| OpenAI | platform.openai.com | Account + API key + add payment method |

**Verification:** You have the following credentials written down somewhere safe:
- [ ] Supabase Project URL (`SUPABASE_URL`)
- [ ] Supabase service_role key (`SUPABASE_KEY`)
- [ ] Supabase database connection string (`DATABASE_URL`)
- [ ] Supabase anon key (`REACT_APP_SUPABASE_ANON_KEY`)
- [ ] Pinecone API key (`PINECONE_API_KEY`)
- [ ] Pinecone environment region
- [ ] OpenAI API key (`OPENAI_API_KEY`)

### Sub-phase 0.2: Create Pinecone Index

1. Log in to Pinecone dashboard.
2. Click **Create Index**.
3. Set: name = `course-assistant-vectors`, dimensions = `1536`, metric = `cosine`, environment = `us-east-1-aws`, capacity = `Serverless`.
4. Wait for status to become **Ready** (1–2 minutes).

**Verification:** [ ] Index `course-assistant-vectors` exists and shows status "Ready" in the Pinecone dashboard.

### Sub-phase 0.3: Configure Supabase Database

1. Open Supabase dashboard → **SQL Editor**.
2. Paste the entire PostgreSQL schema from Architecture Section 4 (all `CREATE TABLE` statements, indexes, constraints, and `system_config` seed data).
3. Execute the SQL.
4. Go to **Database → Tables** and verify all 8 tables exist: `users`, `courses`, `course_enrollments`, `documents`, `chat_sessions`, `chat_messages`, `usage_logs`, `system_config`.

**Verification:** [ ] All 8 tables visible in Supabase dashboard. [ ] `system_config` table contains the 6 seed rows.

### Sub-phase 0.4: Configure Supabase Storage

1. Go to **Storage** → **New Bucket**.
2. Name: `course-documents`, Public: **No**, File size limit: **10MB**.
3. Allowed MIME types: `application/pdf`, `image/png`, `image/jpeg`, `image/tiff`.
4. Go to **Storage → Policies** and add the 4 RLS policies from Architecture Section 10 (upload own folder, read enrolled courses, delete own uploads, admin full access).

**Verification:** [ ] Bucket `course-documents` exists and is private. [ ] All 4 storage policies are listed.

### Sub-phase 0.5: Generate JWT Secrets

Run this command twice to generate two distinct secrets:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Copy each output. One is `JWT_SECRET`, the other is `JWT_REFRESH_SECRET`. They must be different.

**Verification:** [ ] Two unique 64-character random strings generated and saved.

### Sub-phase 0.6: Install Local Development Tools

| Tool | Version | Install command / URL |
|------|---------|----------------------|
| Node.js | 18+ | https://nodejs.org |
| Python | 3.10+ | https://python.org |
| Git | Latest | https://git-scm.com |
| Tesseract OCR | 5.x | Windows: https://github.com/UB-Mannheim/tesseract/wiki — macOS: `brew install tesseract` — Linux: `sudo apt-get install tesseract-ocr` |

Verify each installed:
```bash
node --version    # Should show v18+
python --version  # Should show 3.10+
git --version
tesseract --version
```

**Verification:** [ ] All four tools installed and reporting correct versions.

---

**Phase 0 Acceptance Criteria — ALL must be true:**
- [ ] GitHub repository exists (empty, with `.gitignore`)
- [ ] Supabase project is live with all 8 tables created
- [ ] Supabase Storage bucket `course-documents` exists with 4 RLS policies
- [ ] Pinecone index `course-assistant-vectors` is Ready
- [ ] OpenAI API key is generated and has billing configured
- [ ] Two JWT secrets are generated
- [ ] Node.js 18+, Python 3.10+, Git, and Tesseract are installed locally
- [ ] All credentials saved in a secure location (not in any code file)

---

## Phase 1: Project Scaffolding

**Entry gate:** Phase 0 complete.

### Sub-phase 1.1: Initialize Git Repository

```bash
git clone https://github.com/yourusername/ai-course-assistant.git
cd ai-course-assistant
```

Create `.gitignore` at the repo root with the contents from Architecture Section 13 (the full `.gitignore` listing covering `node_modules/`, `__pycache__/`, `.env`, `venv/`, `build/`, etc.).

**Verification:** [ ] Repo cloned. [ ] `.gitignore` exists with all required entries.

### Sub-phase 1.2: Scaffold Backend Directory Structure

Create the following directory tree inside the repo root:

```
backend/
├── main.py
├── config.py
├── db.py
├── logging_config.py
├── models/
│   └── __init__.py
├── schemas/
│   └── __init__.py
├── routes/
│   └── __init__.py
├── services/
│   └── __init__.py
├── middleware/
│   └── __init__.py
├── utils/
│   └── __init__.py
├── tests/
│   ├── __init__.py
│   └── conftest.py
├── alembic/
│   └── versions/
├── alembic.ini
├── requirements.txt
└── .env.example
```

Create `requirements.txt` with the exact contents from Architecture Section 14.

Create `.env.example` with all backend environment variables from Architecture Section 13 (with placeholder values, not real keys).

Create a Python virtual environment and install dependencies:
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

**Verification:** [ ] Directory tree exists. [ ] `pip install -r requirements.txt` completes without errors. [ ] `.env.example` contains all variables listed in Architecture Section 13.

### Sub-phase 1.3: Scaffold Frontend Directory Structure

```bash
npx create-react-app frontend
cd frontend
npm install axios react-router-dom react-dropzone tailwindcss
npm install -D @tailwindcss/forms
npx tailwindcss init -p
```

Create the frontend directory structure as specified in Architecture Section 9:
- `src/contexts/`
- `src/hooks/`
- `src/services/`
- `src/pages/`
- `src/components/Layout/`
- `src/components/Auth/`
- `src/components/Documents/`
- `src/components/Chat/`
- `src/components/Admin/`
- `src/components/common/`

Create `frontend/.env.example` with:
```
REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
```

**Verification:** [ ] `npm start` runs without errors (blank page is fine). [ ] Tailwind CSS is configured and `@apply` directives work. [ ] Directory tree matches Architecture Section 9.

### Sub-phase 1.4: Initialize Backend Application Skeleton

Write `backend/main.py` with:
- FastAPI app instantiation
- CORS middleware (localhost:3000 only for now)
- A single `GET /health` endpoint returning `{"status": "ok"}`
- A single `GET /api/v1` endpoint returning `{"message": "AI Course Assistant API v1"}`

Write `backend/config.py` with a Pydantic `Settings` class that loads all variables from `.env` using `python-dotenv`.

Write `backend/db.py` with SQLAlchemy engine creation, `SessionLocal`, and `get_db` dependency.

**Verification:** [ ] `uvicorn backend.main:app --reload --port 8000` starts without errors. [ ] `GET http://localhost:8000/health` returns `{"status": "ok"}`. [ ] `GET http://localhost:8000/docs` shows Swagger UI with the two endpoints.

---

**Phase 1 Acceptance Criteria — ALL must be true:**
- [ ] Backend runs on localhost:8000 and shows Swagger docs at `/docs`
- [ ] Frontend runs on localhost:3000
- [ ] All directories from Architecture Section 15 exist in both backend and frontend
- [ ] `.env.example` files exist in both backend and frontend with all required variables
- [ ] `.gitignore` prevents committing `.env`, `node_modules/`, `venv/`, `__pycache__/`
- [ ] `requirements.txt` and `package.json` install without errors
- [ ] Git has at least one commit: `chore: initial project scaffolding`

---

## Phase 2: Database Layer & Models

**Entry gate:** Phase 1 complete. Backend starts and `/health` returns 200.

### Sub-phase 2.1: SQLAlchemy Models

Create one model file per entity, following the exact schema from Architecture Section 4:

| File | Model | Table |
|------|-------|-------|
| `backend/models/user.py` | `User` | `users` |
| `backend/models/course.py` | `Course` | `courses` |
| `backend/models/enrollment.py` | `CourseEnrollment` | `course_enrollments` |
| `backend/models/document.py` | `Document` | `documents` |
| `backend/models/chat.py` | `ChatSession`, `ChatMessage` | `chat_sessions`, `chat_messages` |
| `backend/models/usage.py` | `UsageLog` | `usage_logs` |
| `backend/models/config.py` | `SystemConfig` | `system_config` |

Requirements:
- Every model must have `id` (UUID primary key), `created_at`, `updated_at` (where applicable).
- Use `uuid_generate_v4()` as server default for UUIDs.
- All foreign key relationships must be defined with `relationship()`.
- `DocumentStatus` enum: `pending`, `processing`, `ready`, `failed`.
- `UserRole` enum: `student`, `lecturer`, `admin`.
- All `CHECK` constraints from the SQL schema must be enforced at the model level.

Export all models from `backend/models/__init__.py`.

**Verification:** [ ] Every model class exists. [ ] `from backend.models import User, Course, ...` works without import errors. [ ] Model field names and types match Architecture Section 4 exactly.

### Sub-phase 2.2: Pydantic Schemas

Create request/response schemas in `backend/schemas/`:

| File | Schemas |
|------|---------|
| `schemas/auth.py` | `RegisterRequest`, `LoginRequest`, `TokenResponse`, `UserResponse` |
| `schemas/document.py` | `DocumentUploadResponse`, `DocumentStatusResponse`, `DocumentListResponse` |
| `schemas/chat.py` | `CreateSessionRequest`, `ChatMessageRequest`, `SessionResponse`, `MessageResponse` |
| `schemas/course.py` | `CreateCourseRequest`, `CourseResponse`, `EnrollRequest` |
| `schemas/common.py` | `SuccessResponse`, `ErrorResponse`, `ErrorResponseDetail` |

Validation rules (from Architecture Section 5 and 11):
- `RegisterRequest.email`: `EmailStr`
- `RegisterRequest.password`: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
- `RegisterRequest.full_name`: 2–255 chars, letters and spaces only
- `ChatMessageRequest.message`: non-empty, max 2000 chars
- `CreateCourseRequest.code`: 2–50 uppercase alphanumeric

**Verification:** [ ] All schemas importable. [ ] Pydantic validation works: `RegisterRequest(email="bad", password="123", full_name="X")` raises `ValidationError`. [ ] `RegisterRequest(email="ok@uni.edu", password="Strong1!", full_name="John Doe")` passes.

### Sub-phase 2.3: Alembic Configuration

Initialize Alembic:
```bash
cd backend
alembic init alembic
```

Edit `alembic/env.py` to:
- Import `Base` from `backend.models`
- Read `DATABASE_URL` from environment variables
- Set `target_metadata = Base.metadata`

Generate initial migration:
```bash
alembic revision --autogenerate -m "initial schema"
```

Apply migration:
```bash
alembic upgrade head
```

Verify against Supabase: all 8 tables should already exist (from Phase 0), so the migration should be empty or only add minor differences. If there are differences, resolve them now.

**Verification:** [ ] `alembic upgrade head` runs without errors. [ ] `alembic current` shows the migration version. [ ] `alembic history` shows the migration chain.

### Sub-phase 2.4: Update `db.py` for Production

Update `backend/db.py` to:
- Use `DATABASE_URL` from settings
- Configure `pool_size=5`, `max_overflow=10`, `pool_pre_ping=True`
- Add `engine.event_listeners` for connection logging (optional, for debugging)

**Verification:** [ ] Backend starts and connects to Supabase PostgreSQL without errors. [ ] A simple `db.execute(text("SELECT 1"))` succeeds.

---

**Phase 2 Acceptance Criteria — ALL must be true:**
- [ ] All 8 SQLAlchemy models defined with correct fields, types, and relationships
- [ ] All Pydantic schemas defined with correct validation rules
- [ ] Alembic configured and `alembic upgrade head` runs cleanly
- [ ] Backend connects to the Supabase PostgreSQL database
- [ ] `alembic revision --autogenerate` produces an empty migration (schema matches models)
- [ ] Git commit: `feat(models): add SQLAlchemy models and Pydantic schemas`

---

## Phase 3: Authentication System

**Entry gate:** Phase 2 complete. All models defined, database connected.

### Sub-phase 3.1: Auth Service

Create `backend/services/auth_service.py` with:

- `hash_password(password: str) -> str` — uses `passlib` with bcrypt, cost factor 12
- `verify_password(plain: str, hashed: str) -> bool`
- `create_access_token(user_id: str, role: str, email: str) -> str` — JWT with 30-minute expiry, signed with `JWT_SECRET`
- `create_refresh_token(user_id: str) -> str` — JWT with 7-day expiry, signed with `JWT_REFRESH_SECRET`
- `decode_token(token: str, secret: str) -> dict` — decodes and validates JWT, raises on expiry or invalid signature

Test each function manually in a Python REPL:
```python
from backend.services.auth_service import hash_password, verify_password, create_access_token
hashed = hash_password("Test123!")
assert verify_password("Test123!", hashed)
token = create_access_token("user-123", "student", "test@uni.edu")
assert len(token) > 50
```

**Verification:** [ ] Password hashing and verification work. [ ] Token creation and decoding work. [ ] Expired tokens are rejected.

### Sub-phase 3.2: Auth Routes

Create `backend/routes/auth.py` with these endpoints, implementing the exact request/response shapes from Architecture Section 5:

| Endpoint | Status Code | Notes |
|----------|-------------|-------|
| `POST /api/v1/auth/register` | 201 | Hash password, create user, return tokens |
| `POST /api/v1/auth/login` | 200 | Verify credentials, return tokens |
| `POST /api/v1/auth/refresh` | 200 | Accept refresh token, return new token pair |
| `GET /api/v1/auth/me` | 200 | Requires auth, return current user profile |

Implement cookie setting on login/register/refresh responses:
```python
response.set_cookie(
    key="access_token", value=access_token,
    httponly=True, secure=True, samesite="strict",
    max_age=1800, path="/"
)
response.set_cookie(
    key="refresh_token", value=refresh_token,
    httponly=True, secure=True, samesite="strict",
    max_age=604800, path="/api/v1/auth/refresh"
)
```

Register the router in `backend/main.py`:
```python
from backend.routes.auth import router as auth_router
app.include_router(auth_router, prefix="/api/v1")
```

Test with curl or Postman:
```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@uni.edu","password":"Strong1!","full_name":"Test User"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@uni.edu","password":"Strong1!"}'

# Me (use token from login response)
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

**Verification:** [ ] Register returns 201 with user data and tokens. [ ] Login returns 200 with tokens. [ ] `/me` returns user profile with valid token. [ ] `/me` returns 401 with no token. [ ] Duplicate email returns 409. [ ] Weak password returns 422.

### Sub-phase 3.3: Auth Middleware

Create `backend/middleware/auth.py` with a `get_current_user` dependency:

```python
async def get_current_user(request: Request, db = Depends(get_db)):
    # Extract token from Authorization header OR cookie
    # Decode JWT
    # Look up user in database
    # Check is_active
    # Return user object
    # Raise 401 if any step fails
```

Create a `require_role(*roles)` dependency factory:
```python
def require_role(*roles):
    async def role_checker(current_user = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker
```

Test: protect the `/auth/me` endpoint with `get_current_user` and verify unauthenticated requests are rejected.

**Verification:** [ ] `GET /auth/me` with valid token returns user. [ ] Without token returns 401. [ ] With expired token returns 401. [ ] With invalid token returns 401.

### Sub-phase 3.4: Course & Enrollment Models (Basic CRUD)

Create `backend/routes/courses.py` and `backend/services/course_service.py`:

| Endpoint | Auth | Role | Description |
|----------|------|------|-------------|
| `POST /api/v1/courses` | Yes | lecturer, admin | Create course |
| `GET /api/v1/courses` | Yes | all | List courses (filtered by enrollment for students) |
| `GET /api/v1/courses/{id}` | Yes | enrolled | Get course details |
| `POST /api/v1/courses/{id}/enroll` | Yes | lecturer (own course), admin | Enroll user |

Create the enrollment check dependency:
```python
async def require_enrolled(course_id: str, current_user = Depends(get_current_user), db = Depends(get_db)):
    # For admins: allow all
    # For lecturers: allow if they created the course
    # For students: check course_enrollments table
```

Register router in `main.py`.

Test all endpoints with curl/Postman.

**Verification:** [ ] Lecturer can create a course. [ ] Student cannot create a course (403). [ ] Enrollment works. [ ] Unenrolled student cannot access course (403). [ ] Enrolled student can list and view course.

---

**Phase 3 Acceptance Criteria — ALL must be true:**
- [ ] Register, login, refresh, me endpoints work end-to-end
- [ ] JWT tokens are set as httpOnly cookies with correct expiry and flags
- [ ] Auth middleware rejects unauthorized requests (401) and wrong-role requests (403)
- [ ] Course CRUD works: create, list, get, enroll
- [ ] Enrollment check prevents unenrolled users from accessing course data
- [ ] All endpoints return the standard response envelope (`success`, `data`/`error`, `correlation_id`)
- [ ] Test: register a student, register a lecturer, create a course as lecturer, enroll student in course
- [ ] Git commit: `feat(auth): implement JWT auth, course CRUD, and enrollment`

---

## Phase 4: File Storage (Supabase Storage)

**Entry gate:** Phase 3 complete. Auth works, Supabase Storage bucket exists.

### Sub-phase 4.1: Storage Service

Create `backend/services/storage_service.py`:

```python
class StorageService:
    def __init__(self):
        self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        self.bucket = settings.SUPABASE_STORAGE_BUCKET

    def upload(self, file_bytes: bytes, storage_path: str) -> str:
        """Upload file to Supabase Storage. Returns the storage path."""

    def download(self, storage_path: str) -> bytes:
        """Download file from Supabase Storage. Returns file bytes."""

    def delete(self, storage_path: str) -> bool:
        """Delete file from Supabase Storage."""

    def get_signed_url(self, storage_path: str, expires_in: int = 3600) -> str:
        """Generate a temporary signed URL for the file."""
```

Implement filename sanitization (Architecture Section 10):
- Replace spaces with underscores
- Remove: `/ \ : * ? " < > |`
- Truncate to 100 characters (excluding extension)
- Prepend Unix timestamp

Storage path format: `{course_id}/{user_id}/{timestamp}_{sanitized_filename}`

Test each method manually:
```python
from backend.services.storage_service import storage_service
# Upload a small test file
path = storage_service.upload(b"test content", "test-course/test-user/test.txt")
# Download it
content = storage_service.download(path)
assert content == b"test content"
# Delete it
storage_service.delete(path)
```

**Verification:** [ ] Upload stores file in Supabase Storage. [ ] Download retrieves correct bytes. [ ] Delete removes the file. [ ] Filename sanitization produces correct output for edge cases (spaces, special chars, long names).

### Sub-phase 4.2: Integrate Storage into Document Upload Endpoint

Create `backend/routes/documents.py` and `backend/services/document_service.py` (for now, just the upload and storage parts — processing comes in Phase 6).

`POST /api/v1/documents/upload`:
1. Validate file type (MIME check) and size (10MB max)
2. Read file bytes
3. Generate storage path
4. Upload to Supabase Storage via `storage_service`
5. Create `Document` record in database with `status="pending"`
6. Return 202 with document ID

Do NOT launch background processing yet (that's Phase 6). The endpoint should return immediately after creating the DB record.

**Verification:** [ ] Upload a PDF via Postman: returns 202 with document ID and `status: "pending"`. [ ] File appears in Supabase Storage bucket. [ ] Document record exists in database. [ ] Upload a .txt file: returns 415. [ ] Upload a 15MB file: returns 413. [ ] Upload without auth: returns 401.

---

**Phase 4 Acceptance Criteria — ALL must be true:**
- [ ] `StorageService` can upload, download, delete, and generate signed URLs
- [ ] `POST /documents/upload` stores file in Supabase Storage and creates DB record
- [ ] File validation rejects wrong types and oversized files
- [ ] Storage path follows the `{course_id}/{user_id}/{timestamp}_{filename}` format
- [ ] `GET /documents` lists documents for a course (implement basic list endpoint now)
- [ ] `DELETE /documents/{id}` removes file from storage and record from DB
- [ ] Git commit: `feat(storage): implement Supabase Storage service and document upload`

---

## Phase 5: Document Upload API (Complete)

**Entry gate:** Phase 4 complete. File upload and storage work.

### Sub-phase 5.1: Document List & Status Endpoints

Implement the remaining document endpoints from Architecture Section 5:

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/documents?course_id=X` | List documents for a course with pagination |
| `GET /api/v1/documents/{id}/status` | Get processing status of a specific document |
| `DELETE /api/v1/documents/{id}` | Delete document, storage file, and Pinecone vectors |

For `DELETE`: implement the cleanup cascade:
1. Delete file from Supabase Storage
2. Delete vectors from Pinecone (namespace = course_id, filter by document_id) — stub this for now, implement fully in Phase 7
3. Delete document record from PostgreSQL

**Verification:** [ ] `GET /documents?course_id=X` returns list with pagination metadata. [ ] `GET /documents/{id}/status` returns current status. [ ] `DELETE /documents/{id}` removes file and record. [ ] Deleting a non-existent document returns 404.

### Sub-phase 5.2: Document Ownership & Access Control

Enforce these rules (from Architecture Section 6 RBAC matrix):
- Students can only upload to courses they are enrolled in
- Students can only view/delete their own documents
- Lecturers can view/delete documents in their courses
- Admins can view/delete all documents

Test all permutations:
- [ ] Student uploads to own course → 202
- [ ] Student uploads to unenrolled course → 403
- [ ] Student deletes own document → 200
- [ ] Student deletes other user's document → 403
- [ ] Lecturer deletes document in their course → 200
- [ ] Admin deletes any document → 200

**Verification:** [ ] All ownership checks pass. [ ] RBAC matrix from Architecture Section 6 is fully enforced for document endpoints.

---

**Phase 5 Acceptance Criteria — ALL must be true:**
- [ ] All document endpoints implemented: upload, list, status, delete
- [ ] Pagination works on list endpoint
- [ ] Document ownership and course enrollment checks enforced
- [ ] Delete cascades: storage file removed, DB record removed
- [ ] Standard error responses for all failure modes
- [ ] Git commit: `feat(documents): complete document CRUD with access control`

---

## Phase 6: Document Processing Pipeline

**Entry gate:** Phase 5 complete. Documents can be uploaded and stored. Phase 2 (models) and Phase 7 (Pinecone) stubs are in place.

> **Note:** You need Tesseract OCR installed (Phase 0.6) for this phase.

### Sub-phase 6.1: Text Extraction Service

Create `backend/services/document_processing.py` with the `DocumentProcessingService` class.

Implement the text extraction stages (Architecture Section 7):

**Stage 1 — File Download:**
- Download file from Supabase Storage to a temporary file in `/tmp`
- Use `tempfile.NamedTemporaryFile(delete=False, suffix=...)`

**Stage 2 — File Validation:**
- Check file size against `MAX_FILE_SIZE_BYTES`
- For PDFs: open with pdfplumber, check page count (max 50), attempt to read first page (detects password-protected PDFs)

**Stage 3 — Text Extraction:**
- For digital PDFs: use `pdfplumber` to extract text page by page
- Implement the OCR detection heuristic (`_is_scanned_page`):
  - If extracted text < 50 characters → scanned
  - If text-to-area ratio < 0.02 → scanned
- For scanned pages: convert to image at 300 DPI with `page.to_image()`, run `pytesseract.image_to_string()`
- For image files (PNG, JPEG, TIFF): run OCR directly

**Stage 4 — Text Cleaning:**
- Implement `_clean_text()` exactly as in Architecture Section 7:
  - Remove excessive whitespace (collapse 3+ newlines to 2)
  - Remove page number patterns
  - Remove header/footer artifacts
  - Normalize LaTeX delimiters
  - Remove control characters

Test text extraction with:
1. A digital PDF (should extract text directly)
2. A scanned PDF image (should trigger OCR)
3. A plain image file (should run OCR)

**Verification:** [ ] Digital PDF text extraction returns correct text. [ ] Scanned PDF triggers OCR and returns readable text. [ ] Image OCR works. [ ] Text cleaning removes artifacts without destroying content. [ ] Password-protected PDF is rejected with clear error. [ ] 60-page PDF is rejected.

### Sub-phase 6.2: Chunking Service

Implement `_chunk_text()` and `_recursive_split()` exactly as in Architecture Section 7:

- Max chunk size: 2000 characters (~512 tokens)
- Overlap: 200 characters (~50 tokens)
- Separator priority: `\n\n` → `\n` → `. ` → `! ` → `? ` → `; ` → `, ` → ` `
- Never split mid-word
- Each chunk carries: `text`, `page_number`, `chunk_index`, `document_id`

Test chunking:
```python
# Short text → 1 chunk
chunks = service._recursive_split("Hello world.", max_chars=2000, overlap_chars=200)
assert len(chunks) == 1

# Long text → multiple chunks
text = "This is a sentence. " * 500
chunks = service._recursive_split(text, max_chars=2000, overlap_chars=200)
assert len(chunks) > 1
for chunk in chunks:
    assert len(chunk) <= 2200  # Allow overlap overshoot
```

**Verification:** [ ] Short text produces 1 chunk. [ ] Long text produces multiple chunks. [ ] No chunk exceeds max size by more than overlap amount. [ ] Chunks split on paragraph/sentence boundaries when possible.

### Sub-phase 6.3: Embedding Service

Implement `_embed_chunks()` as in Architecture Section 7:

- Use OpenAI `text-embedding-3-small` model
- Batch size: 512 texts per API call
- Retry with exponential backoff (3 retries, 1s/2s/4s delays)
- Implement the circuit breaker class from Architecture Section 12

Test embedding:
```python
response = openai_client.embeddings.create(
    model="text-embedding-3-small",
    input=["Hello world", "Test text"]
)
assert len(response.data) == 2
assert len(response.data[0].embedding) == 1536
```

**Verification:** [ ] Embedding API call returns 1536-dimensional vectors. [ ] Batch embedding works. [ ] Retry works on simulated failure. [ ] Circuit breaker opens after 5 failures and recovers after 60 seconds.

### Sub-phase 6.4: Pinecone Upsert

Implement `_upsert_to_pinecone()` as in Architecture Section 7:

- Vector ID format: `{document_id}_chunk_{chunk_index}`
- Namespace: `course_id`
- Metadata: `document_id`, `page_number`, `chunk_index`, `filename`, `uploaded_by`, `course_id`, `text_preview` (first 200 chars)
- Upsert in batches of 100

Test: after upserting, query Pinecone with a known embedding and verify the vectors are retrievable.

**Verification:** [ ] Vectors appear in Pinecone with correct namespace. [ ] Metadata is correct on all vectors. [ ] Vector ID format matches specification.

### Sub-phase 6.5: End-to-End Processing Pipeline

Wire all stages together in `process_document()`:
1. Set document status to `processing`
2. Download file
3. Validate
4. Extract text
5. Clean text
6. Chunk
7. Embed
8. Upsert to Pinecone
9. Set document status to `ready` with `chunk_count` and `page_count`
10. Clean up temp file (in `finally` block)

If any stage fails: set document status to `failed` with `error_message`.

### Sub-phase 6.6: Background Task Integration

Update `POST /documents/upload` to launch processing as a BackgroundTask:

```python
background_tasks.add_task(
    document_processing_service.process_document,
    document_id=str(document.id)
)
```

Test the full flow:
1. Upload a PDF via Postman → returns 202 with `status: "pending"`
2. Wait 10–30 seconds
3. Check `GET /documents/{id}/status` → should show `status: "ready"` with `chunk_count > 0`
4. Query Pinecone directly to verify vectors exist

**Verification:** [ ] Upload returns 202 immediately. [ ] Background processing completes and status changes to `ready`. [ ] Chunk count and page count are correct. [ ] Vectors are in Pinecone. [ ] Failed documents show `status: "failed"` with error message. [ ] Temp files are cleaned up after processing.

---

**Phase 6 Acceptance Criteria — ALL must be true:**
- [ ] Digital PDF text extraction works correctly
- [ ] OCR fallback triggers on scanned pages and extracts readable text
- [ ] Text cleaning removes artifacts
- [ ] Chunking produces correctly-sized chunks with overlap
- [ ] Embedding produces 1536-dimensional vectors
- [ ] Pinecone upsert stores vectors with correct metadata and namespace
- [ ] Background processing runs after upload and updates document status
- [ ] Circuit breaker and retry logic work
- [ ] Error handling: failed documents show error message, temp files cleaned up
- [ ] Full flow: upload → process → ready → queryable in Pinecone
- [ ] Git commit: `feat(processing): implement document processing pipeline with OCR`

---

## Phase 7: Pinecone Integration (Complete)

**Entry gate:** Phase 6.4 complete. Vectors can be upserted.

### Sub-phase 7.1: Pinecone Service

Create `backend/services/pinecone_service.py`:

```python
class PineconeService:
    def __init__(self):
        self.client = Pinecone(api_key=settings.PINECONE_API_KEY)
        self.index = self.client.Index(settings.PINECONE_INDEX_NAME)

    def query(self, embedding, namespace, top_k=5, include_metadata=True):
        """Query Pinecone and return matches."""

    def delete_by_document(self, namespace, document_id):
        """Delete all vectors for a document from a namespace."""

    def get_stats(self):
        """Return index statistics (total vector count, namespace counts)."""
```

### Sub-phase 7.2: Document Deletion with Vector Cleanup

Update `DELETE /documents/{id}` to call `pinecone_service.delete_by_document(course_id, document_id)` before deleting the DB record.

Test: upload a document, verify vectors exist, delete the document, verify vectors are gone.

**Verification:** [ ] `delete_by_document` removes all vectors for a document. [ ] Document deletion cascades correctly: storage → vectors → DB.

### Sub-phase 7.3: Health Check Integration

Update the `/health` endpoint to include Pinecone connectivity check:
- Query `index.describe_index_stats()`
- Return `vector_count` and `latency_ms`

**Verification:** [ ] `GET /health` includes Pinecone status with vector count.

---

**Phase 7 Acceptance Criteria — ALL must be true:**
- [ ] Pinecone query returns relevant vectors with metadata
- [ ] `delete_by_document` removes all vectors for a document
- [ ] Document deletion removes storage file, vectors, and DB record
- [ ] Health check includes Pinecone status
- [ ] Git commit: `feat(pinecone): complete vector database integration`

---

## Phase 8: RAG Chat System

**Entry gate:** Phase 6 complete (documents process and vectors exist in Pinecone). Phase 7 complete.

### Sub-phase 8.1: Chat Service — Core RAG Pipeline

Create `backend/services/chat_service.py` implementing the exact pipeline from Architecture Section 8:

1. **Save user message** to `chat_messages` table
2. **Retrieve conversation history** — last 10 messages from the session (chronological order)
3. **Embed the question** using OpenAI `text-embedding-3-small`
4. **Query Pinecone** — namespace = course_id, top_k = 5, include_metadata = true
5. **Filter by similarity threshold** — only keep matches with score >= 0.7
6. **If no relevant chunks** — return fallback message: "I don't have relevant information in your uploaded documents..."
7. **Assemble context** from top chunks (max 3000 tokens / ~12000 chars)
8. **Build prompt** using the exact system prompt from Architecture Section 8:
   - System message: role instructions + citation rules + "I don't know" instruction
   - Context message: assembled chunks with source labels
   - History messages: last 10 messages
   - User message: current question
9. **Stream OpenAI response** using `gpt-4o-mini`, temperature=0.1, top_p=0.9, max_tokens=2048
10. **Save assistant message** with sources JSON and token count
11. **Log usage** to `usage_logs` table

Test the core RAG logic (without streaming) first:
- Create a test with a known document
- Ask a question that the document answers
- Verify relevant chunks are retrieved
- Verify the response is grounded in the context

**Verification:** [ ] RAG pipeline retrieves relevant chunks. [ ] Context assembly respects token budget. [ ] System prompt is correctly formatted. [ ] Fallback fires when no relevant chunks found. [ ] Message history is included in prompt. [ ] Usage is logged.

### Sub-phase 8.2: Chat Routes

Create `backend/routes/chat.py`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/v1/chat/sessions` | POST | Create new chat session |
| `GET /api/v1/chat/sessions` | GET | List sessions (optional course_id filter) |
| `POST /api/v1/chat/sessions/{id}/messages` | POST | Send message (SSE streaming response) |
| `GET /api/v1/chat/sessions/{id}/messages` | GET | Get message history with pagination |
| `DELETE /api/v1/chat/sessions/{id}` | DELETE | Delete session and all messages |

### Sub-phase 8.3: SSE Streaming Endpoint

Implement the streaming response for `POST /chat/sessions/{id}/messages`:

1. Validate request (message non-empty, max 2000 chars, session belongs to user)
2. Run RAG pipeline (get messages array and sources)
3. Stream SSE events using `StreamingResponse` with `text/event-stream`:

```
data: {"type": "start", "message_id": "msg-uuid"}

data: {"type": "chunk", "content": "The answer is"}

data: {"type": "chunk", "content": " based on Lecture 3..."}

data: {"type": "sources", "sources": [{"document_id": "...", "filename": "Lecture3.pdf", "page_number": 12, "chunk_id": "..."}]}

data: {"type": "done", "message_id": "msg-uuid", "tokens_used": 187, "model_used": "gpt-4o-mini"}
```

Test with curl:
```bash
curl -N -X POST http://localhost:8000/api/v1/chat/sessions/SESSION_ID/messages \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is supervised learning?"}'
```

Verify SSE events arrive in the correct order and format.

**Verification:** [ ] SSE stream starts with `type: "start"`. [ ] Chunks arrive sequentially. [ ] Sources event contains correct document/page metadata. [ ] Done event contains token count. [ ] Error event fires on failure. [ ] Streaming response completes without hanging.

### Sub-phase 8.4: Chat Access Control

Enforce these rules:
- Students can only create sessions in enrolled courses
- Students can only send messages in own sessions
- Students can only view/delete own sessions
- Lecturers can view sessions in their courses
- Admins can access all sessions

**Verification:** [ ] Student cannot send message in another user's session (403). [ ] Student cannot create session in unenrolled course (403). [ ] Lecturer can view sessions in their course. [ ] Admin can access all sessions.

### Sub-phase 8.5: Session Title Auto-generation

When creating a new chat session, if no title is provided, auto-generate one from the first message. Update the session title after the first message exchange.

**Verification:** [ ] Session created with default title "New Chat". [ ] After first message, title updates to a summary of the question.

---

**Phase 8 Acceptance Criteria — ALL must be true:**
- [ ] RAG pipeline retrieves relevant chunks and assembles context
- [ ] System prompt enforces grounded responses with source citation
- [ ] Fallback response fires when no relevant documents exist
- [ ] SSE streaming works: start → chunks → sources → done
- [ ] Conversation history (last 10 messages) is included in context
- [ ] Usage logged to `usage_logs` with token counts and cost
- [ ] Chat session CRUD works: create, list, get messages, delete
- [ ] Access control: users can only access own sessions / enrolled courses
- [ ] End-to-end test: upload document → process → create session → ask question → get streamed answer with sources
- [ ] Git commit: `feat(chat): implement RAG chat system with SSE streaming`

---

## Phase 9: Frontend — Core, Routing & Auth

**Entry gate:** Phase 3 complete (auth endpoints work). Phase 1.3 complete (frontend scaffolded).

### Sub-phase 9.1: API Client

Create `src/services/api.js` as specified in Architecture Section 9:
- Axios instance with `baseURL`, `withCredentials: true`, `timeout: 30000`
- Response interceptor: on 401, attempt token refresh, retry original request
- On refresh failure: redirect to `/login`

**Verification:** [ ] API client sends requests to backend. [ ] 401 triggers automatic refresh. [ ] Failed refresh redirects to login.

### Sub-phase 9.2: Auth Context & Provider

Create `src/contexts/AuthContext.js` as specified in Architecture Section 9:
- State: `user` (null or user object), `loading` (boolean)
- On mount: call `GET /auth/me` to check existing session
- Methods: `login(email, password)`, `register(email, password, fullName)`, `logout()`
- `useAuth()` convenience hook

**Verification:** [ ] On page load, if valid session exists, user state is populated. [ ] Login sets user state. [ ] Register sets user state. [ ] Logout clears user state.

### Sub-phase 9.3: Routing Setup

Configure `src/App.js` with React Router:

```
/login        → LoginPage
/register     → RegisterPage
/             → DashboardPage (protected)
/courses/:id  → CoursePage (protected)
/courses/:id/chat/:sessionId → ChatPage (protected)
/admin        → AdminPage (protected, admin only)
```

Create `ProtectedRoute.js`:
- If not authenticated and not loading → redirect to `/login`
- If loading → show spinner
- If authenticated → render children

Create `RoleGate.js`:
- If user role not in allowed roles → show "Access Denied" or redirect

**Verification:** [ ] Unauthenticated user visiting `/` is redirected to `/login`. [ ] Authenticated user can access protected pages. [ ] Non-admin visiting `/admin` sees access denied.

### Sub-phase 9.4: Login & Register Pages

Create `src/pages/LoginPage.js`:
- Email and password fields
- Client-side validation (email format, password not empty)
- Submit calls `login()` from AuthContext
- On success: redirect to `/`
- On failure: show error message
- Link to register page

Create `src/pages/RegisterPage.js`:
- Full name, email, password, confirm password fields
- Client-side validation: email format, password strength, passwords match
- Submit calls `register()` from AuthContext
- On success: redirect to `/`
- On failure: show error message
- Link to login page

Style with Tailwind CSS. Make forms centered, clean, responsive.

**Verification:** [ ] Login page renders with email/password fields. [ ] Successful login redirects to dashboard. [ ] Failed login shows error. [ ] Register page works end-to-end. [ ] Form validation prevents invalid submissions.

### Sub-phase 9.5: Layout Components

Create `src/components/Layout/Header.js`:
- App name/logo on the left
- User name and role badge on the right
- Logout button

Create `src/components/Layout/Sidebar.js` (for course navigation):
- List of enrolled courses (for students)
- List of created courses (for lecturers)
- Active course highlighted

Create `src/components/Layout/Layout.js`:
- Composes Header + Sidebar + main content area
- Responsive: sidebar collapses on mobile

**Verification:** [ ] Header shows user name and logout button. [ ] Sidebar lists courses. [ ] Layout is responsive (sidebar collapses on small screens).

---

**Phase 9 Acceptance Criteria — ALL must be true:**
- [ ] Login and Register pages work end-to-end
- [ ] JWT tokens are stored in httpOnly cookies (set by backend)
- [ ] Protected routes redirect unauthenticated users to login
- [ ] Admin routes are restricted to admin role
- [ ] Layout shows header, sidebar, and content area
- [ ] Responsive design works on mobile and desktop
- [ ] API client handles token refresh automatically
- [ ] Git commit: `feat(frontend): implement auth pages, routing, and layout`

---

## Phase 10: Frontend — Document Management

**Entry gate:** Phase 9 complete (auth and routing work). Phase 5 complete (document API works).

### Sub-phase 10.1: Dashboard Page

Create `src/pages/DashboardPage.js`:
- Fetch courses from `GET /courses`
- Display as a grid of cards: course title, code, document count, enrollment count
- Click card → navigate to `/courses/:id`
- For lecturers: "Create Course" button
- For admins: link to Admin Panel

Create `src/components/common/LoadingSpinner.js` and `src/components/common/ErrorMessage.js`.

**Verification:** [ ] Dashboard loads and displays courses. [ ] Clicking a course navigates to course page. [ ] Loading spinner shows during data fetch. [ ] Error state shows on failure.

### Sub-phase 10.2: Course Page — Document Panel

Create `src/pages/CoursePage.js`:
- Split layout: left panel for documents, right panel for chat sessions
- Left panel: upload button + document list

Create `src/components/Documents/DocumentUpload.js` as specified in Architecture Section 9:
- Drag-and-drop zone with react-dropzone (or manual implementation)
- Client-side validation: file type, size
- Upload progress bar
- Success/error feedback

Create `src/components/Documents/DocumentList.js`:
- Table/list of documents with columns: filename, status, uploaded by, date
- Status badges: pending (yellow), processing (blue), ready (green), failed (red)

Create `src/components/Documents/DocumentStatusBadge.js`:
- Color-coded badge component

### Sub-phase 10.3: Document Status Polling

Create `src/hooks/useDocumentStatus.js`:
- Polls `GET /documents/{id}/status` every 3 seconds
- Stops polling when status is `ready` or `failed`
- Updates document list when status changes

**Verification:** [ ] Upload a document: progress bar shows, document appears in list with "pending" status. [ ] Status updates automatically: pending → processing → ready. [ ] Failed documents show error state. [ ] Drag-and-drop works. [ ] File type and size validation works on client side.

---

**Phase 10 Acceptance Criteria — ALL must be true:**
- [ ] Dashboard displays courses as cards
- [ ] Course page shows document list and upload area
- [ ] File upload works with drag-and-drop and progress bar
- [ ] Document status updates in real-time (polling)
- [ ] Status badges are color-coded correctly
- [ ] Responsive layout: documents and chat side by side on desktop, stacked on mobile
- [ ] Git commit: `feat(frontend-docs): implement document upload and management UI`

---

## Phase 11: Frontend — Chat Interface

**Entry gate:** Phase 10 complete (course page with document panel works). Phase 8 complete (chat API with SSE streaming works).

### Sub-phase 11.1: Chat Sessions Panel

In the course page's right panel:
- List of chat sessions for this course
- "New Chat" button → calls `POST /chat/sessions`
- Click session → navigate to `/courses/:id/chat/:sessionId`
- Show message count and last message timestamp

### Sub-phase 11.2: Chat Page

Create `src/pages/ChatPage.js`:
- Full-height chat interface
- Message list (scrollable)
- Input field at bottom with send button

Create `src/components/Chat/ChatWindow.js`:
- Displays messages in chronological order
- Auto-scrolls to bottom on new messages
- Shows loading indicator while waiting for first response

Create `src/components/Chat/ChatMessage.js`:
- User messages: right-aligned, blue background
- Assistant messages: left-aligned, gray background
- Render markdown in assistant messages (use a simple markdown renderer or `dangerouslySetInnerHTML` with sanitization — or better, use `react-markdown`)

Create `src/components/Chat/ChatInput.js`:
- Text area (auto-growing height)
- Send button (disabled while streaming)
- Enter to send, Shift+Enter for newline
- Max 2000 character limit with counter

### Sub-phase 11.3: SSE Streaming in Frontend

Create `src/hooks/useSSE.js` as specified in Architecture Section 9:
- Uses `fetch()` with `ReadableStream` for SSE (not `EventSource`, because we need POST + credentials)
- State: `streamingContent` (accumulated text), `sources` (array), `isStreaming` (boolean)
- Parse SSE `data:` lines
- Handle event types: `start`, `chunk`, `sources`, `done`, `error`
- `startStream(sessionId, message, onDone)` function
- `stopStream()` function (aborts the fetch)

Create `src/components/Chat/StreamingMessage.js`:
- Displays `streamingContent` as it arrives
- Shows blinking cursor while streaming
- Finalizes when `done` event arrives

### Sub-phase 11.4: Source Citations

Create `src/components/Chat/SourceCitation.js`:
- Renders below assistant messages
- Shows list of source documents with page numbers
- Styled as small badges or cards: "Lecture3.pdf, p.12"

**Verification:** [ ] Send a message: streaming response appears word-by-word. [ ] Sources appear after streaming completes. [ ] Conversation history loads when opening an existing session. [ ] Enter sends, Shift+Enter creates newline. [ ] Send button disabled during streaming. [ ] Auto-scroll works. [ ] Empty message cannot be sent.

---

**Phase 11 Acceptance Criteria — ALL must be true:**
- [ ] Chat sessions can be created, listed, and deleted
- [ ] Messages can be sent and streamed responses are displayed
- [ ] SSE streaming works correctly with the fetch ReadableStream approach
- [ ] Source citations are displayed below assistant messages
- [ ] Conversation history loads and displays correctly
- [ ] Input validation: empty messages blocked, max length enforced
- [ ] Responsive: chat works on mobile and desktop
- [ ] Full flow: upload document → create chat → ask question → see streamed answer with sources
- [ ] Git commit: `feat(frontend-chat): implement chat interface with SSE streaming`

---

## Phase 12: Frontend — Admin Panel

**Entry gate:** Phase 9 complete (auth and routing work). Phase 3.4 complete (course API works).

### Sub-phase 12.1: Admin Page Structure

Create `src/pages/AdminPage.js`:
- Tabbed interface: Users | Usage | Health
- Only accessible to admin role (protected by `RoleGate`)

### Sub-phase 12.2: User Management Tab

Create `src/components/Admin/UserTable.js`:
- Fetch users from `GET /admin/users`
- Table with columns: name, email, role, status, joined date
- Search bar (filters by name or email)
- Role filter dropdown
- Role change dropdown (promote to lecturer, demote to student)
- Pagination

### Sub-phase 12.3: Usage Stats Tab

Create `src/components/Admin/UsageStats.js`:
- Fetch stats from `GET /admin/usage`
- Display: total messages, total tokens, total cost, unique users, documents uploaded
- Daily breakdown table (date, messages, tokens, cost)

### Sub-phase 12.4: Health Check Tab

Create `src/components/Admin/HealthCheck.js`:
- Fetch from `GET /admin/health`
- Display status of each component: Database, Pinecone, OpenAI, Storage
- Show latency and status (green/red indicator)
- Auto-refresh every 30 seconds

**Verification:** [ ] Admin panel loads with three tabs. [ ] User table shows all users with search and filter. [ ] Role change works. [ ] Usage stats display correctly. [ ] Health check shows component status with auto-refresh. [ ] Non-admin cannot access admin page.

---

**Phase 12 Acceptance Criteria — ALL must be true:**
- [ ] Admin panel accessible only to admin role
- [ ] User management: list, search, filter, role change
- [ ] Usage statistics: totals and daily breakdown
- [ ] Health check: component status with latency
- [ ] Auto-refresh on health tab
- [ ] Git commit: `feat(frontend-admin): implement admin panel`

---

## Phase 13: Security Hardening & Middleware

**Entry gate:** Phases 8 and 11 complete (core features work end-to-end).

### Sub-phase 13.1: Rate Limiting

Implement rate limiting with `slowapi` as specified in Architecture Section 11:

| Endpoint | Limit |
|----------|-------|
| `POST /auth/register` | 5/minute per IP |
| `POST /auth/login` | 10/minute per IP |
| `POST /documents/upload` | 10/minute per user |
| `POST /chat/sessions/{id}/messages` | 20/minute per user |
| Default | 60/minute |

Configure in `backend/main.py`:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
```

Apply `@limiter.limit(...)` decorator to each endpoint.

**Verification:** [ ] Excessive login attempts return 429 with `Retry-After` header. [ ] Normal usage is not affected.

### Sub-phase 13.2: Request Logging Middleware

Implement the correlation ID and request logging middleware from Architecture Section 12:

```python
@app.middleware("http")
async def add_correlation_id(request, call_next):
    correlation_id = f"req_{uuid.uuid4().hex[:16]}"
    request.state.correlation_id = correlation_id
    # ... timing, logging, response headers
```

**Verification:** [ ] Every response includes `X-Correlation-ID` header. [ ] Every response includes `X-Process-Time` header. [ ] Logs include correlation_id.

### Sub-phase 13.3: Global Exception Handlers

Implement from Architecture Section 12:
- `@app.exception_handler(Exception)` — catch-all returning 500 with correlation_id
- `@app.exception_handler(ValidationError)` — Pydantic validation errors returning 422 with field details

**Verification:** [ ] Unhandled exception returns structured 500 error. [ ] Validation error returns structured 422 with field-level details. [ ] No stack traces leak to the client.

### Sub-phase 13.4: CORS Update for Production

Update CORS origins to include the production Vercel URL:
```python
allow_origins=[
    "http://localhost:3000",
    "https://your-app.vercel.app",
]
```

**Verification:** [ ] Local frontend can communicate with backend. [ ] No CORS errors in browser console.

### Sub-phase 13.5: Security Headers (Frontend)

Add security headers via `frontend/vercel.json` as specified in Architecture Section 11:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

**Verification:** [ ] Response headers include all security headers.

---

**Phase 13 Acceptance Criteria — ALL must be true:**
- [ ] Rate limiting returns 429 with Retry-After when limits exceeded
- [ ] Every request gets a correlation ID
- [ ] Unhandled errors return structured 500 (no stack traces)
- [ ] Validation errors return structured 422 with field details
- [ ] CORS allows localhost:3000 and production Vercel URL
- [ ] Security headers present on frontend responses
- [ ] Git commit: `feat(security): add rate limiting, logging middleware, and security headers`

---

## Phase 14: Testing

**Entry gate:** Phases 8–13 complete (all features implemented).

### Sub-phase 14.1: Test Infrastructure

Create `backend/tests/conftest.py` with:
- SQLite test database fixture
- Test client fixture with overridden `get_db`
- Sample user fixture (registers and returns tokens)
- Sample course fixture (creates a course and enrollment)

**Verification:** [ ] `pytest` runs without import errors. [ ] Test client connects to SQLite test database.

### Sub-phase 14.2: Unit Tests

Write tests as specified in Architecture Section 16:

| Test file | What it tests |
|-----------|--------------|
| `test_processing.py` | Text cleaning, chunking, scanned page detection |
| `test_auth.py` | Registration, login, password validation, duplicate email |
| `test_documents.py` | Upload, file validation, ownership checks |
| `test_chat.py` | Session creation, message sending, empty message |

Aim for:
- Text cleaning: 5+ test cases
- Chunking: 5+ test cases
- Auth: 6+ test cases (register, login, weak password, duplicate, wrong password, token refresh)
- Documents: 4+ test cases (upload, too large, unauthorized, forbidden)
- Chat: 3+ test cases (create session, send empty message, send to other user's session)

**Verification:** [ ] `pytest` passes all unit tests. [ ] Test coverage for core services is reasonable.

### Sub-phase 14.3: Manual Testing

Execute the full manual testing checklist from Architecture Section 16:

- [ ] Register a new account
- [ ] Login with existing account
- [ ] Create a course (as lecturer)
- [ ] Enroll a student
- [ ] Upload a digital PDF
- [ ] Upload a scanned document
- [ ] Verify OCR processing completes
- [ ] Verify document status updates (pending → processing → ready)
- [ ] Create a chat session
- [ ] Ask a question and verify streaming response
- [ ] Verify source citations appear
- [ ] Ask a question not in documents (verify fallback)
- [ ] Upload password-protected PDF (verify rejection)
- [ ] Upload oversized file (verify rejection)
- [ ] Delete a document and verify cleanup
- [ ] Delete a chat session
- [ ] Test on mobile viewport
- [ ] Test admin panel
- [ ] Test role-based access

**Verification:** [ ] All unit tests pass. [ ] All manual test items verified. [ ] Git commit: `test: add unit tests and verify manual testing checklist`

---

## Phase 15: Deployment

**Entry gate:** Phase 14 complete (all tests pass, manual testing complete).

### Sub-phase 15.1: Push to GitHub

```bash
git add .
git commit -m "chore: prepare for deployment"
git push origin main
```

Verify the repository is clean and all `.env` files are excluded.

**Verification:** [ ] Repository pushed to GitHub. [ ] `.env` files are NOT in the repository.

### Sub-phase 15.2: Deploy Backend to Render

1. Log in to Render (render.com).
2. Click **New → Web Service**.
3. Connect your GitHub repository.
4. Configure:
   - Name: `ai-course-assistant-backend`
   - Runtime: Python 3
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - Instance Type: Free (or Basic for always-on)
5. Add all environment variables from Architecture Section 13 in the Render dashboard (use encrypted values for secrets).
6. Deploy and wait for the build to complete.

Verify:
- `GET https://your-backend.onrender.com/health` returns 200
- `GET https://your-backend.onrender.com/docs` shows Swagger UI

**Verification:** [ ] Backend is live on Render. [ ] Health check returns 200. [ ] API docs are accessible.

### Sub-phase 15.3: Deploy Frontend to Vercel

1. Log in to Vercel (vercel.com).
2. Click **Import Project** → select your GitHub repo.
3. Configure:
   - Framework: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
4. Add environment variable: `REACT_APP_API_BASE_URL` = `https://your-backend.onrender.com/api/v1`
5. Deploy.

Verify:
- `https://your-app.vercel.app` loads without errors
- Login/register works
- Full flow works end-to-end

**Verification:** [ ] Frontend is live on Vercel. [ ] No console errors. [ ] API communication works.

### Sub-phase 15.4: Post-Deployment Verification

Run through the Post-Deployment Checklist from Architecture Section 17:

- [ ] Health check returns 200
- [ ] API docs accessible at `/docs`
- [ ] Frontend loads without errors
- [ ] Registration works end-to-end
- [ ] Login works and sets cookies
- [ ] Course creation works
- [ ] Document upload works
- [ ] Document processing completes
- [ ] Chat streaming works
- [ ] Source citations appear
- [ ] Fallback response works
- [ ] Admin panel loads
- [ ] CORS works (no browser errors)
- [ ] Rate limiting works (429 when exceeded)

### Sub-phase 15.5: Render Free Tier Wake-Up Strategy

Set up a cron job to keep the backend alive:

1. Go to cron-job.org (or similar).
2. Create a job that sends `GET https://your-backend.onrender.com/health` every 10 minutes.
3. This prevents the Render free tier from sleeping.

**Verification:** [ ] Cron job is running and pinging the health endpoint. [ ] Backend stays awake for 1+ hours without manual intervention.

---

**Phase 15 Acceptance Criteria — ALL must be true:**
- [ ] Backend deployed on Render and accessible via public URL
- [ ] Frontend deployed on Vercel and accessible via public URL
- [ ] All environment variables set in Render dashboard (not in code)
- [ ] CORS allows production frontend URL
- [ ] Full end-to-end flow works on deployed version
- [ ] Health check accessible and returns healthy status
- [ ] Wake-up cron job configured
- [ ] Git commit: `chore(deploy): deploy to Render and Vercel`

---

## Phase 16: Monitoring, Logging & Cost Controls

**Entry gate:** Phase 15 complete (deployed and verified).

### Sub-phase 16.1: Structured Logging

Implement `backend/logging_config.py` as specified in Architecture Section 18:
- Use `structlog` with JSON renderer in production, console renderer in development
- Initialize in `main.py`
- Add `structlog` processors: add_log_level, TimeStamper, StackInfoRenderer, format_exc_info

**Verification:** [ ] Backend logs are structured JSON in production. [ ] Backend logs are human-readable in development.

### Sub-phase 16.2: Usage Logging

Ensure every OpenAI call logs to the `usage_logs` table:
- Document embedding: `action = "document_embedding"`
- Chat message: `action = "chat_message"`
- Fields: user_id, tokens_input, tokens_output, embedding_tokens, model_used, latency_ms, cost_usd

**Verification:** [ ] After sending a chat message, a record appears in `usage_logs` with correct token counts and cost.

### Sub-phase 16.3: Daily Budget Check

Implement `check_daily_budget()` as specified in Architecture Section 19:
- Before each OpenAI call, check if daily spend >= 80% of budget → log warning
- If daily spend >= budget → raise error, block the request

**Verification:** [ ] Warning log appears when approaching budget. [ ] Request is blocked when budget exceeded.

### Sub-phase 16.4: Update Health Check

Ensure health check endpoint tests all components:
- Database: `SELECT 1`
- Pinecone: `describe_index_stats()`
- OpenAI: `client.models.list()`
- Storage: check bucket exists

**Verification:** [ ] `GET /health` returns status of all 4 components with latency.

---

**Phase 16 Acceptance Criteria — ALL must be true:**
- [ ] Structured JSON logging in production
- [ ] All OpenAI calls logged to `usage_logs` with cost calculation
- [ ] Daily budget check blocks requests when exceeded
- [ ] Health check tests all 4 external components
- [ ] Render logs show structured log entries
- [ ] Git commit: `feat(monitoring): add structured logging, usage tracking, and budget controls`

---

## Phase 17: Final Verification & Pre-Defense Prep

**Entry gate:** Phases 15 and 16 complete (deployed, monitored, cost-controlled).

### Sub-phase 17.1: Full End-to-End Smoke Test (Production)

On the deployed system, execute this exact sequence:

1. Register a new student account
2. Register a new lecturer account
3. Lecturer creates a course "CSC401 - Introduction to AI"
4. Lecturer enrolls student in the course
5. Student uploads a digital PDF (3-5 pages) → verify status goes pending → processing → ready
6. Student uploads a scanned document (image) → verify OCR extracts text → ready
7. Student creates a chat session
8. Student asks: "What is machine learning?" (answer should be in uploaded docs)
   - Verify: streaming response with source citations
9. Student asks: "What is the capital of France?" (not in any document)
   - Verify: fallback response "I don't have relevant information..."
10. Student deletes a document → verify vectors removed from Pinecone
11. Admin logs in → views usage stats → views health check
12. Verify all three components show green/healthy

**Verification:** [ ] All 12 steps complete without errors.

### Sub-phase 17.2: Backup Plan Verification

Test the local demo fallback:
1. Have the full project cloned locally
2. Ensure `.env` points to the real Supabase/Pinecone/OpenAI services
3. Run backend locally: `uvicorn backend.main:app --reload --port 8000`
4. Run frontend locally: `npm start` in frontend/
5. Verify the full flow works locally

**Verification:** [ ] Local demo works with cloud services.

### Sub-phase 17.3: Presentation Preparation

1. Create test accounts:
   - `student@test.com` / `Student1!`
   - `lecturer@test.com` / `Lecturer1!`
   - `admin@test.com` / `Admin1!`
2. Pre-upload 3-4 documents to the course
3. Pre-create 2 chat sessions with conversations
4. Prepare a demo script:
   - Start with the problem statement (30 seconds)
   - Show architecture diagram (1 minute)
   - Live demo: register → upload → chat (3 minutes)
   - Discuss RAG, hallucination prevention, cost (2 minutes)
   - Future work (1 minute)
5. Practice the demo at least twice
6. Prepare a backup: screen recording of the demo in case of network issues

**Verification:** [ ] Test accounts exist with pre-loaded data. [ ] Demo script is written. [ ] Practice run completed at least twice. [ ] Backup recording exists.

### Sub-phase 17.4: Defense Q&A Preparation

Review and prepare answers to these common questions (from Architecture Section 20):

| Question | Key points to cover |
|----------|-------------------|
| Why RAG over fine-tuning? | Source attribution, cost, transparency, instant updates |
| How do you handle hallucination? | temp=0.1, system prompt, similarity threshold, citation requirement |
| How do you detect scanned PDFs? | Text-density heuristic (< 50 chars or < 2% area ratio) |
| How is data isolated between courses? | Pinecone namespaces, foreign keys in PostgreSQL |
| What are the limitations? | OCR accuracy, math notation, limited to uploaded docs, chunk boundaries |
| How would you scale? | Celery, paid Pinecone, CDN, connection pooling, caching |
| What happens if OpenAI goes down? | Circuit breaker, graceful degradation, user-friendly error |
| What's the cost per query? | ~$0.0004 per chat message |

**Verification:** [ ] Can answer each question in 30-60 seconds. [ ] Can explain the architecture diagram from memory.

---

**Phase 17 Acceptance Criteria — ALL must be true:**
- [ ] Full end-to-end flow works on production (all 12 steps)
- [ ] Local fallback demo works
- [ ] Test accounts created with pre-loaded data
- [ ] Demo script written and practiced
- [ ] Backup recording prepared
- [ ] Defense Q&A answers rehearsed
- [ ] All git commits are clean and descriptive
- [ ] Architecture document is complete and up-to-date

---

## Summary: Phase Dependencies

```
Phase 0 (Accounts & Setup)
    ↓
Phase 1 (Scaffolding)
    ↓
Phase 2 (Database & Models)
    ↓
Phase 3 (Auth) ───────────────────────┐
    ↓                                   ↓
Phase 4 (File Storage)            Phase 9 (Frontend Core)
    ↓                                   ↓
Phase 5 (Document API)           Phase 10 (Frontend Docs)
    ↓                                   ↓
Phase 6 (Processing Pipeline)    Phase 11 (Frontend Chat)
    ↓                                   ↓
Phase 7 (Pinecone)               Phase 12 (Frontend Admin)
    ↓                                   ↓
Phase 8 (RAG Chat) ──────────────────┘
    ↓
Phase 13 (Security Hardening)
    ↓
Phase 14 (Testing)
    ↓
Phase 15 (Deployment)
    ↓
Phase 16 (Monitoring & Cost Controls)
    ↓
Phase 17 (Final Verification & Defense Prep)
```

**Backend phases (0–8, 13–16) and frontend phases (9–12) can be developed in parallel once their entry gates are met.** The recommended approach is:
1. Complete backend phases 0–8 first
2. Then build frontend phases 9–12 against the working backend API
3. Then do phases 13–17 sequentially

---

*End of Implementation Plan*
*Reference: AI_Course_Assistant_Architecture_Guide_v2.md*
*Version: 1.0 — July 2026*
