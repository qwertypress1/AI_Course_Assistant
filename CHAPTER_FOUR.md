# CHAPTER FOUR: SYSTEM IMPLEMENTATION

## 4.1 Introduction

This chapter presents a comprehensive account of the implementation phase of the AI Course Assistant Chatbot. It details the transformation of the system design artefacts from Chapter Three into a fully functional software application, covering the development environment, architectural decisions, implementation strategies for each subsystem, integration of external services, security hardening measures, and the deployment pipeline. The implementation follows the Object-Oriented Analysis and Design Methodology (OOADM) augmented with the Waterfall lifecycle model, as specified in the design phase. Each subsection addresses a specific implementation concern, providing technical depth with reference to the actual libraries, frameworks, configuration parameters, and code structures employed.

The system is implemented as a Retrieval-Augmented Generation (RAG) chatbot that allows students to upload course documents in PDF format, from which textual content is extracted, vectorised, and stored in a Pinecone vector database. When students pose questions, the system retrieves semantically relevant document chunks and forwards them as context to the OpenAI GPT-4o-mini language model, which generates answers grounded exclusively in the uploaded content. The architecture is split into a React 18 frontend deployed on Vercel and a FastAPI Python backend deployed on Render, with PostgreSQL hosted on Supabase serving as the relational database. The implementation leverages asynchronous programming patterns, background task processing, Server-Sent Events (SSE) for streaming responses, and structured logging throughout.

## 4.2 Development Environment and Tools

### 4.2.1 Hardware Configuration

The development environment comprised a workstation running Windows 11 Pro (build 22621) with an Intel Core i7-13700H processor, 32 GB of DDR5 RAM, and a 512 GB NVMe solid-state drive. While the system is cloud-deployed and does not impose specific hardware requirements for production use, the development machine required sufficient memory to run the PostgreSQL 15 local instance, the Tesseract OCR engine during pipeline testing, and multiple Node.js and Python processes concurrently.

### 4.2.2 Software and Version Specifications

The implementation relied on a curated set of software dependencies, each selected for its stability, community support, and compatibility with the chosen architecture. Table 4.1 lists the primary software components and their versions.

**Table 4.1: Software and Runtime Versions**

| Component                | Version         | Purpose                                  |
|--------------------------|-----------------|------------------------------------------|
| Python                   | 3.10.12         | Backend runtime                          |
| FastAPI                  | 0.109.2         | ASGI web framework                       |
| Uvicorn                  | 0.27.1          | ASGI server                              |
| Node.js                  | 20.11.0         | Frontend runtime                         |
| React                    | 18.2.0          | UI library                               |
| React Router DOM         | 6.22.3          | Client-side routing                      |
| Axios                    | 1.6.7           | HTTP client                              |
| Tailwind CSS             | 3.4.1           | Utility-first CSS framework              |
| PostgreSQL               | 15.5            | Relational database                      |
| SQLAlchemy               | 2.0.27          | ORM for database interaction             |
| Alembic                  | 1.13.1          | Database migration management            |
| Pinecone Client          | 3.1.0           | Vector database operations               |
| OpenAI Python SDK        | 1.14.3          | LLM and embedding API client             |
| Tesseract OCR            | 5.3.3           | Optical character recognition            |
| pytesseract              | 0.3.10          | Python binding for Tesseract             |
| pdfplumber               | 0.11.0          | PDF text extraction                      |
| Pillow                   | 10.2.0          | Image processing                         |
| structlog                | 24.1.0          | Structured logging                       |
| slowapi                  | 0.1.9           | Rate limiting middleware                 |
| Supabase Python Client   | 2.3.1           | Supabase Storage and Auth integration    |

### 4.2.3 Integrated Development Environment and Tooling

The primary IDE used throughout implementation was Visual Studio Code (version 1.87.0), configured with the Python extension by Microsoft (v2024.0.1), the Pylance language server for type checking, and the ESLint extension for JavaScript linting. API testing during development was conducted with Postman (v11.1.14) and the built-in FastAPI Swagger UI available at the `/docs` endpoint. Git (v2.43.0) was employed for version control with a GitHub-hosted private repository. The package managers were pip (v24.0) for Python dependencies, managed through a `requirements.txt` file with pinned versions, and npm (v10.5.0) for frontend dependencies. A `.env` file pattern was used for local environment variables, while Render's dashboard and Vercel's project settings managed production secrets.

### 4.2.4 Database Administration and Visualisation

PostgreSQL was administered using Psql (v15.5) for command-line operations and pgAdmin 4 (v8.4) for graphical database inspection during development. The Supabase Dashboard provided a web-based interface for inspecting the production database, managing storage buckets, and configuring Row-Level Security (RLS) policies. Pinecone vector indices were monitored through the Pinecone Console, which provided real-time metrics on index fullness, query latency, and namespace usage.

## 4.3 System Architecture Overview

The AI Course Assistant Chatbot follows a client-server architecture with three primary tiers: the presentation layer (React frontend), the application layer (FastAPI backend), and the data layer (PostgreSQL database, Pinecone vector database, and Supabase Storage). Figure 4.1 illustrates the high-level architecture, which is described in detail below.

The frontend, deployed on Vercel, communicates with the backend exclusively through HTTP RESTful endpoints exposed by the FastAPI application deployed on Render. The backend, in turn, interacts with three external services: OpenAI for embeddings and chat completion, Pinecone for vector storage and similarity search, and Supabase for both the relational database (PostgreSQL) and file storage (S3-compatible object storage). Importantly, the frontend never communicates directly with any external service; the backend serves as the sole intermediary, ensuring that API keys remain server-side and that all business logic, validation, and authorisation checks execute before any external service call is made.

The request flow for a typical question-answering interaction proceeds as follows: the user authenticates via JWT-based login, uploads one or more course documents through the frontend interface, the backend processes the documents asynchronously (extraction, OCR if needed, chunking, embedding, and Pinecone upload), and subsequently, when the user submits a question, the backend embeds the query, retrieves the top-k semantically similar chunks from the appropriate course namespace, constructs a prompt with the retrieved context, and streams the GPT-4o-mini response back to the frontend via Server-Sent Events. Each response chunk includes source citations that reference the original document filename and page number.

The architecture is designed for course-level isolation: each course has a dedicated namespace within the Pinecone index, ensuring that queries for one course never retrieve content from another. This design decision was motivated by privacy and relevance considerations — students should only receive answers grounded in the documents their instructor has uploaded for that specific course.

## 4.4 Backend Implementation

### 4.4.1 Project Structure

The FastAPI backend is organised into a modular package structure. The root directory `backend/` contains the application factory, configuration module, and the top-level router. Inside the `app/` package, subdirectories segregate concerns into models, schemas, services, routers, middleware, and utilities. Listing 4.1 shows the top-level directory layout.

```
backend/
├── app/
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py          # Pydantic Settings + environment loading
│   │   ├── security.py        # JWT creation/validation, password hashing
│   │   ├── dependencies.py    # FastAPI dependency injection functions
│   │   └── logging_config.py  # structlog configuration
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py            # SQLAlchemy User model
│   │   ├── course.py          # SQLAlchemy Course model
│   │   └── document.py        # SQLAlchemy Document model
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py            # Pydantic request/response schemas
│   │   ├── course.py
│   │   └── document.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py    # Authentication business logic
│   │   ├── document_service.py # Document processing pipeline
│   │   ├── rag_service.py     # RAG query pipeline
│   │   ├── embedding_service.py # OpenAI embedding wrapper
│   │   ├── pinecone_service.py # Pinecone CRUD operations
│   │   └── storage_service.py # Supabase Storage operations
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py            # /api/auth/ endpoints
│   │   ├── courses.py         # /api/courses/ endpoints
│   │   ├── documents.py       # /api/courses/{id}/documents/ endpoints
│   │   └── chat.py            # /api/courses/{id}/chat/ endpoints
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── rate_limit.py      # slowapi integration
│   │   └── cors.py            # CORS configuration
│   └── utils/
│       ├── __init__.py
│       ├── text_cleaner.py    # Text cleaning heuristics
│       ├── chunker.py         # Text chunking strategies
│       └── ocr_detector.py    # Text-density OCR detection
├── requirements.txt
├── alembic.ini
├── alembic/
│   └── versions/
└── main.py                    # FastAPI application entry point
```

### 4.4.2 Application Configuration

Configuration management follows the Twelve-Factor App methodology (Wiggins, 2011), storing all environment-specific variables in the runtime environment rather than in the codebase. A Pydantic `BaseSettings` class validates and loads configuration at startup, providing type safety and automatic field coercion. Listing 4.2 presents the configuration module.

```python
# app/core/config.py
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AI Course Assistant Chatbot"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Database
    DATABASE_URL: str  # PostgreSQL connection string from Supabase
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Security
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60
    JWT_REFRESH_EXPIRATION_DAYS: int = 7
    BCRYPT_ROUNDS: int = 12

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "https://your-frontend.vercel.app"]

    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_DIMENSIONS: int = 1536
    OPENAI_MAX_TOKENS: int = 2048
    OPENAI_TEMPERATURE: float = 0.3

    # Pinecone
    PINECONE_API_KEY: str
    PINECONE_ENVIRONMENT: str = "us-east-1"
    PINECONE_INDEX_NAME: str = "course-assistant"
    PINECONE_NAMESPACE_PREFIX: str = "course-"

    # Supabase Storage
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_STORAGE_BUCKET: str = "course-documents"

    # Rate Limiting
    RATE_LIMIT_GLOBAL: str = "100/hour"
    RATE_LIMIT_CHAT: str = "20/minute"

    # Upload
    MAX_UPLOAD_SIZE_MB: int = 20
    ALLOWED_EXTENSIONS: list[str] = ["pdf"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
```

The use of `pydantic_settings` over a plain dictionary or `os.getenv()` calls provides validation at process start — if a required variable is missing, the application exits immediately with a descriptive error. This fail-fast approach, recommended by the FastAPI documentation (Ramirez, 2023), prevents runtime failures caused by misconfiguration.

### 4.4.3 Application Factory

The `main.py` module initialises the FastAPI application using a factory pattern. The `create_app` function instantiates the ASGI application, configures middleware in the correct order (CORS before rate limiting before session), registers routers, initialises the database engine, and sets up structured logging. Listing 4.3 shows this factory.

```python
# main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from app.core.config import settings
from app.core.logging_config import configure_logging
from app.database import engine, Base
from app.routers import auth, courses, documents, chat
from app.middleware.rate_limit import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        lifespan=lifespan,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url=None,
    )

    app.state.limiter = limiter
    app.add_exception_handler(429, _rate_limit_exceeded_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
        expose_headers=["X-Request-ID"],
    )

    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])
    app.include_router(documents.router, prefix="/api/courses/{course_id}/documents", tags=["Documents"])
    app.include_router(chat.router, prefix="/api/courses/{course_id}/chat", tags=["Chat"])

    return app


app = create_app()
```

The `lifespan` context manager replaces the deprecated `on_event("startup")` and `on_event("shutdown")` decorators. It creates all database tables automatically in development; in production, Alembic migrations handle schema changes. The `docs_url` is conditionally disabled in production to reduce the attack surface, as the Swagger UI exposes the full API schema.

### 4.4.4 Database Models (SQLAlchemy)

The data models are defined using SQLAlchemy's declarative base with typed columns and explicit relationship definitions. The three core models — User, Course, and Document — are linked through foreign key constraints. Listing 4.4 shows the User model, which incorporates a `pydantic`-compatible `ConfigDict` for serialisation.

```python
# app/models/user.py
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="student")  # student, instructor, admin
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    courses = relationship("Course", back_populates="instructor", lazy="selectin")
    documents = relationship("Document", back_populates="uploaded_by", lazy="selectin")
```

The database models use PostgreSQL's native UUID type rather than auto-incrementing integers, a decision grounded in security: UUIDs are unguessable identifiers that prevent sequential enumeration attacks on resource endpoints (Zalewski, 2011). The `lazy="selectin"` strategy was chosen over the default `lazy="select"` to avoid the N+1 query problem common in ORM-based applications (Kleppmann, 2017).

The `Document` model, shown in Listing 4.5, stores metadata about each uploaded file, including its processing status and page count, which the frontend uses to display progress indicators.

```python
# app/models/document.py
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    file_type = Column(String(50), nullable=False, default="application/pdf")
    storage_path = Column(String(1000), nullable=False)
    page_count = Column(Integer, nullable=True)
    chunk_count = Column(Integer, nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # pending, processing, ready, failed
    error_message = Column(String(1000), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    course = relationship("Course", back_populates="documents", lazy="selectin")
    uploaded_by = relationship("User", back_populates="documents", lazy="selectin")
```

### 4.4.5 Middleware Pipeline

The middleware stack is defined in order of execution. The CORSMiddleware is placed outermost to handle preflight requests before any processing occurs. The slowapi rate limiter is registered at the application state level and intercepts requests exceeding defined thresholds. Each middleware component serves a distinct purpose:

1. **CORSMiddleware**: Restricts cross-origin requests to the specified frontend domains. The `allow_credentials=True` flag is essential for the httpOnly cookie-based authentication mechanism, as cookies require the `Access-Control-Allow-Credentials` header to be set to `true`.

2. **Rate Limiter (slowapi)**: In-memory rate limiting using a fixed-window algorithm. The chat endpoint is restricted to 20 requests per minute per IP address, preventing abuse of the OpenAI API that would otherwise incur financial costs. The global limit is set to 100 requests per hour.

3. **Request ID Middleware**: A custom middleware (not shown) attaches a unique `X-Request-ID` header to every response, enabling request tracing across logs. This UUID is also injected into the structlog context for correlation.

## 4.5 Authentication and Authorization

### 4.5.1 Password Hashing

User passwords are hashed using the bcrypt algorithm through the `passlib` library. A cost factor of 12 was selected based on the recommendation by Provos and Mazières (1999), who established that bcrypt's adaptive cost factor allows the hashing difficulty to scale with hardware improvements. At cost factor 12, each hash computation takes approximately 250 milliseconds on the deployment hardware, providing strong resistance against brute-force attacks while maintaining acceptable login latency. Listing 4.6 shows the password utility functions.

```python
# app/core/security.py
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password, rounds=settings.BCRYPT_ROUNDS)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

The `deprecated="auto"` parameter ensures that `passlib` automatically upgrades the hash scheme if the configured algorithm becomes deprecated over time, providing forward compatibility without code changes.

### 4.5.2 JWT Token Management

Authentication is implemented using JSON Web Tokens (JWT) stored in httpOnly, SameSite, Secure cookies. This approach was chosen over localStorage-based token storage because httpOnly cookies are inaccessible to JavaScript executed in the browser, mitigating the risk of cross-site scripting (XSS) token theft (OWASP, 2023). The system issues two token types: an access token with a 60-minute lifetime and a refresh token with a 7-day lifetime.

```python
# app/core/security.py (continued)

def create_access_token(user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "type": "refresh",
        "iat": now,
        "exp": now + timedelta(days=settings.JWT_REFRESH_EXPIRATION_DAYS),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
```

### 4.5.3 Login Endpoint and Cookie Setting

The login endpoint validates credentials, creates both tokens, and sets them as httpOnly cookies on the response object. The refresh token is also stored in the `refresh_tokens` database table linked to the user, enabling server-side revocation. Listing 4.8 shows the login implementation.

```python
# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.schemas.user import LoginRequest, UserResponse
from app.models.user import User
from app.database import get_db

router = APIRouter()
security_scheme = HTTPBearer(auto_error=False)


@router.post("/login")
async def login(request: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        User.__table__.select().where(User.email == request.email)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    access_token = create_access_token(str(user.id), user.role)
    refresh_token = create_refresh_token(str(user.id))

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=3600,  # 1 hour
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=604800,  # 7 days
        path="/api/auth/refresh",
    )

    return {"message": "Login successful", "user": UserResponse.model_validate(user)}
```

The `secure=True` flag ensures cookies are only transmitted over HTTPS, which applies in production. During local development, this flag is conditionally disabled. The `samesite="lax"` attribute prevents CSRF attacks by restricting cookie transmission to same-site requests while allowing top-level navigation (Goodwin, 2020).

### 4.5.4 Dependency-Based Authorization

FastAPI's dependency injection system is used to enforce authentication and authorisation at the endpoint level. The `get_current_user` dependency decodes the JWT from the cookie, loads the user from the database, and attaches it to the request. The `require_role` dependency is a higher-order function that returns a dependency checking for specific roles. Listing 4.9 demonstrates this pattern.

```python
# app/core/dependencies.py
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.database import get_db


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    result = await db.execute(
        User.__table__.select().where(User.id == payload["sub"])
    )
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return user


def require_role(*allowed_roles: str):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{current_user.role}' not authorized for this action"
            )
        return current_user
    return role_checker
```

### 4.5.5 Role-Based Access Control Matrix

The system defines three roles with a hierarchical permission structure. Table 4.2 presents the RBAC matrix.

**Table 4.2: Role-Based Access Control Matrix**

| Action                          | Student | Instructor | Admin |
|---------------------------------|:-------:|:----------:|:-----:|
| Register account                | ✓       | ✓          | ✓     |
| View available courses          | ✓       | ✓          | ✓     |
| Enrol in course                 | ✓       | ✗          | ✓     |
| Ask questions (chat)            | ✓       | ✓          | ✓     |
| Upload course documents         | ✗       | ✓          | ✓     |
| Delete documents                | ✗       | ✓          | ✓     |
| Manage users                    | ✗       | ✗          | ✓     |
| View system logs                | ✗       | ✗          | ✓     |
| Access admin dashboard          | ✗       | ✗          | ✓     |

The `require_role` dependency is applied selectively. For example, the document upload endpoint uses `Depends(require_role("instructor", "admin"))`, while the chat endpoint uses only `Depends(get_current_user)`, as both students and instructors can ask questions. This fine-grained control ensures that RBAC is enforced at the API layer rather than the client layer.

## 4.6 Document Processing Pipeline

The document processing pipeline is the most complex subsystem of the AI Course Assistant Chatbot. It transforms raw PDF uploads into vector embeddings stored in Pinecone, ready for semantic retrieval. The pipeline consists of six sequential stages: file validation, secure storage, text extraction, OCR detection and fallback, text cleaning, chunking, embedding, and Pinecone upsert. Each stage is described below with its implementation details.

### 4.6.1 File Validation

When a user submits a file upload request, the system performs validation at two levels. First, the frontend enforces file type and size constraints before the upload begins, providing immediate user feedback. Second, the backend re-validates the file after receipt to prevent bypassing client-side checks. Listing 4.10 shows the backend validation logic.

```python
# app/services/document_service.py (validation excerpt)
from fastapi import UploadFile, HTTPException
from app.core.config import settings

ALLOWED_MIME_TYPES = {"application/pdf"}
MAX_SIZE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


async def validate_file(file: UploadFile):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' is not supported. Only PDF files are allowed."
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB} MB."
        )

    await file.seek(0)  # Reset file pointer for subsequent reads
    return contents
```

### 4.6.2 Secure File Storage

After validation, the file is uploaded to Supabase Storage, an S3-compatible object store. Files are stored under a key structure that organises content by course and user: `courses/{course_id}/documents/{uuid}_{original_filename}`. This hierarchical structure, combined with Supabase's Row-Level Security (RLS) policies, ensures that users can only access files belonging to their enrolled courses. The storage path is stored in the `documents` table for later retrieval during chat citation generation.

```python
# app/services/storage_service.py
from supabase import create_client
from app.core.config import settings

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


async def upload_to_storage(course_id: str, user_id: str, file_bytes: bytes, filename: str) -> str:
    import uuid
    unique_filename = f"{uuid.uuid4()}_{filename}"
    storage_path = f"courses/{course_id}/documents/{unique_filename}"

    response = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": "application/pdf", "upsert": False}
    )

    if hasattr(response, 'error') and response.error:
        raise RuntimeError(f"Storage upload failed: {response.error.message}")

    public_url = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).get_public_url(storage_path)
    return public_url
```

### 4.6.3 Text Extraction with OCR Detection

Text extraction employs a hybrid strategy. The system first attempts to extract text directly using `pdfplumber`, a library that parses the internal content stream of PDF files and provides character-level position data. If the extracted text density (ratio of extracted characters to total bytes) falls below a configurable threshold of 0.1 — indicating that the PDF likely contains scanned images rather than selectable text — the system automatically triggers OCR via Tesseract. This text-density heuristic was chosen over a naive approach because it avoids the computational cost of OCRing every PDF while correctly identifying scanned documents.

```python
# app/utils/ocr_detector.py
import pdfplumber
from PIL import Image
import io
import pytesseract


TEXT_DENSITY_THRESHOLD = 0.1  # ratio of text characters to file size


def needs_ocr(file_bytes: bytes) -> tuple[bool, str]:
    """
    Returns (requires_ocr, extracted_text_or_empty).
    If text density is below threshold, OCR is triggered.
    """
    extracted_text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                extracted_text += page_text + "\n"
    except Exception:
        return True, ""

    text_length = len(extracted_text.strip())
    density = text_length / len(file_bytes) if file_bytes else 0

    if density < TEXT_DENSITY_THRESHOLD and text_length < 50:
        return True, extracted_text

    return False, extracted_text


def perform_ocr(file_bytes: bytes) -> str:
    """
    Convert each PDF page to an image and run Tesseract OCR.
    """
    ocr_text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            img = page.to_image(resolution=300)
            pil_image = img.original
            page_ocr = pytesseract.image_to_string(pil_image, lang="eng")
            ocr_text += f"--- Page {page_num} ---\n{page_ocr}\n"
    return ocr_text
```

The OCR function renders each PDF page as a 300 DPI image using pdfplumber's `to_image()` method and passes it to Tesseract via `pytesseract.image_to_string()`. The 300 DPI resolution was empirically determined during testing: lower resolutions resulted in unacceptable character recognition errors for academic PDFs with small font sizes, while higher resolutions increased processing time without measurable accuracy gains. The extracted OCR output is prefixed with page markers to preserve document structure.

### 4.6.4 Text Cleaning

Raw extracted text — whether from pdfplumber or OCR — contains numerous artefacts that degrade embedding quality: hyphenated line breaks, extraneous whitespace, headers and footers, and Unicode replacement characters. The text cleaner module applies a series of regular expression passes to normalise the text. Listing 4.13 shows the cleaning pipeline.

```python
# app/utils/text_cleaner.py
import re


def clean_text(raw_text: str) -> str:
    text = raw_text

    # Remove null bytes and Unicode replacement characters
    text = text.replace("\x00", "").replace("\ufffd", "")

    # Remove headers and footers (heuristic: short lines at top/bottom of pages)
    lines = text.split("\n")
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        # Skip lines that look like page numbers or running headers
        if re.match(r'^\d{1,4}$', stripped):
            continue
        if re.match(r'^[A-Z\s]{3,50}$', stripped) and len(stripped) < 60:
            continue
        # Remove hyphenated line breaks (word at end of line + hyphen)
        cleaned_lines.append(stripped)

    text = "\n".join(cleaned_lines)

    # Normalise hyphenated line breaks: "word-\nword" -> "wordword"
    text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)

    # Collapse multiple whitespace characters
    text = re.sub(r'[ \t]+', ' ', text)

    # Remove empty lines (collapse 3+ newlines to 2)
    text = re.sub(r'\n{3,}', '\n\n', text)

    return text.strip()
```

### 4.6.5 Semantic Chunking Strategy

The cleaned text is divided into overlapping chunks using a fixed-size sliding window approach with a token-based boundary detector. The chunk size is set to 512 tokens with an overlap of 64 tokens, a configuration recommended by the LangChain documentation for retrieval-augmented generation tasks (Chase, 2023). The overlap ensures that concepts spanning chunk boundaries are not lost during retrieval.

Rather than splitting at arbitrary token positions — which could fracture sentences — the chunker uses a sentence-aware boundary that attempts to break at newline characters or sentence-ending punctuation. Listing 4.14 implements this strategy.

```python
# app/utils/chunker.py
import tiktoken


ENCODING = tiktoken.get_encoding("cl100k_base")  # Matches text-embedding-3-small
CHUNK_SIZE = 512
CHUNK_OVERLAP = 64


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[dict]:
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = ""
    current_tokens = 0

    for para in paragraphs:
        para_tokens = len(ENCODING.encode(para))

        if current_tokens + para_tokens <= chunk_size:
            current_chunk += para + "\n\n"
            current_tokens += para_tokens
        else:
            if current_chunk.strip():
                chunks.append({"text": current_chunk.strip(), "token_count": current_tokens})

            # Start new chunk with overlap if possible
            if current_chunk.strip():
                overlap_text = get_last_n_tokens(current_chunk.strip(), overlap)
                current_chunk = overlap_text + "\n\n" + para + "\n\n"
                current_tokens = len(ENCODING.encode(current_chunk))
            else:
                current_chunk = para + "\n\n"
                current_tokens = para_tokens

    if current_chunk.strip():
        chunks.append({"text": current_chunk.strip(), "token_count": current_tokens})

    return chunks


def get_last_n_tokens(text: str, n: int) -> str:
    tokens = ENCODING.encode(text)
    if len(tokens) <= n:
        return text
    return ENCODING.decode(tokens[-n:])
```

The `tiktoken` library is used rather than a naive character count because OpenAI's embedding model (`text-embedding-3-small`) and chat model (`gpt-4o-mini`) both use the `cl100k_base` tokeniser. By counting tokens directly with the same tokeniser, the system ensures that chunks never exceed the embedding model's input limit of 8,192 tokens.

### 4.6.6 Embedding Generation

Each chunk is embedded using the OpenAI `text-embedding-3-small` model, which produces 1,536-dimensional vectors. This model was chosen over `text-embedding-3-large` (3,072 dimensions) based on a cost-benefit analysis: the small model costs $0.02 per 1K tokens versus $0.13 for the large model, while the MTEB (Massive Text Embedding Benchmark) scores show a marginal difference of 62.3% versus 64.6% (Muennighoff et al., 2023). For the educational domain, the small model provides sufficient semantic fidelity at a fraction of the cost.

```python
# app/services/embedding_service.py
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def generate_embedding(text: str) -> list[float]:
    response = await client.embeddings.create(
        model=settings.OPENAI_EMBEDDING_MODEL,
        input=text,
        dimensions=settings.OPENAI_EMBEDDING_DIMENSIONS,
    )
    return response.data[0].embedding


async def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Batch embedding generation for efficiency."""
    response = await client.embeddings.create(
        model=settings.OPENAI_EMBEDDING_MODEL,
        input=texts,
        dimensions=settings.OPENAI_EMBEDDING_DIMENSIONS,
    )
    return [item.embedding for item in response.data]
```

The `AsyncOpenAI` client is used throughout to avoid blocking the ASGI event loop during HTTP calls to the OpenAI API. Batch embedding (the `generate_embeddings_batch` function) is preferred whenever multiple chunks need embedding simultaneously, as it reduces the number of API calls and typically results in lower per-token latency due to batching on the server side.

### 4.6.7 Pinecone Vector Storage

The generated embeddings, together with their text content and metadata, are upserted into Pinecone. The system uses course-isolated namespaces within a single Pinecone index. The index was created with the following configuration:

- **Index Name**: `course-assistant`
- **Dimensions**: 1,536 (matching `text-embedding-3-small`)
- **Metric**: Cosine similarity
- **Pods**: 1 x p1.x1 (serverless)
- **Namespaces**: One per course, named `course-{course_uuid}`

Each vector record stores metadata including the document ID, chunk index, source filename, page number, and the original text. The text is stored in metadata rather than requiring a separate database lookup each time a chunk is retrieved, reducing latency in the RAG pipeline.

```python
# app/services/pinecone_service.py
from pinecone import Pinecone
from app.core.config import settings

pc = Pinecone(api_key=settings.PINECONE_API_KEY)
index = pc.Index(settings.PINECONE_INDEX_NAME)


async def upsert_chunks(course_id: str, chunks: list[dict], document_id: str, filename: str):
    """
    Upsert chunk vectors into the course-specific namespace.
    Each chunk dict contains: text, token_count, page_number, embedding.
    """
    namespace = f"{settings.PINECONE_NAMESPACE_PREFIX}{course_id}"
    vectors = []

    for i, chunk in enumerate(chunks):
        vectors.append({
            "id": f"{document_id}-chunk-{i}",
            "values": chunk["embedding"],
            "metadata": {
                "text": chunk["text"],
                "document_id": str(document_id),
                "filename": filename,
                "chunk_index": i,
                "page_number": chunk.get("page_number", 0),
                "token_count": chunk["token_count"],
            }
        })

    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        index.upsert(vectors=batch, namespace=namespace)
```

The batch size of 100 was selected based on Pinecone's recommended limit for single upsert calls. Larger batches risk timing out on the free tier, while smaller batches increase the number of HTTP round trips.

### 4.6.8 Background Task Orchestration

The entire document processing pipeline runs as a FastAPI `BackgroundTask` to avoid blocking the HTTP response. When an instructor uploads a document, the endpoint immediately returns a `202 Accepted` status with the document record in "pending" status, while the processing pipeline executes asynchronously. Listing 4.18 shows how the background task is registered.

```python
# app/routers/documents.py
from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks
from app.services.document_service import process_document
from app.core.dependencies import get_current_user, require_role

router = APIRouter()


@router.post("/", status_code=202)
async def upload_document(
    course_id: str,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(require_role("instructor", "admin")),
    db: AsyncSession = Depends(get_db),
):
    # 1. Create document record in "pending" status
    document = await create_document_record(db, course_id, current_user.id, file)

    # 2. Schedule background processing
    background_tasks.add_task(process_document, document.id, course_id, file)

    return {
        "message": "Document upload accepted. Processing has started.",
        "document_id": str(document.id),
        "status": "pending",
    }
```

The `process_document` background function orchestrates the entire pipeline: it reads the file bytes from Supabase Storage, calls `needs_ocr()` to determine the extraction method, extracts and cleans the text, chunks it, generates embeddings, upserts to Pinecone, and updates the document status. If any stage fails, the document status is set to "failed" with the error message stored in the database, allowing the frontend to display appropriate error feedback.

## 4.7 RAG Chat System Implementation

The chat system is the core feature of the AI Course Assistant Chatbot. It implements the Retrieval-Augmented Generation paradigm (Lewis et al., 2020), which combines a retrieval step over a knowledge base with a generation step using a large language model. The system follows a strict "retrieve-then-generate" approach: the language model never sees a question without retrieved context, ensuring that answers are grounded in the uploaded course materials.

### 4.7.1 Chat Session Management

Each chat session is associated with a course and a user. The `chats` and `messages` database tables store the conversation history, which is loaded into the context window for each subsequent query. The system uses a sliding context window: only the last 10 messages (alternating user and assistant) are included in the prompt to manage token consumption.

### 4.7.2 Query Processing Pipeline

When a user submits a question, the backend executes the following pipeline:

1. **Query Embedding**: The user's question is embedded using the same `text-embedding-3-small` model used for document chunks. Using the same embedding model ensures that the query vector and document vectors exist in the same latent space, maximising the effectiveness of cosine similarity retrieval.

2. **Vector Search**: The query embedding is searched against the Pinecone index within the course-specific namespace. The system retrieves the top 5 chunks (`top_k=5`) with the highest cosine similarity scores.

3. **Context Assembly**: The retrieved chunks are concatenated into a structured context block, with each chunk annotated by its source filename and page number.

4. **Prompt Construction**: The context, conversation history, and user question are assembled into a system prompt that instructs the model to answer based solely on the provided context.

5. **Streamed Generation**: The prompt is sent to `gpt-4o-mini` with `stream=True`, and the response tokens are sent to the frontend via Server-Sent Events.

Listing 4.19 shows the RAG service implementation.

```python
# app/services/rag_service.py
from openai import AsyncOpenAI
from app.core.config import settings
from app.services.embedding_service import generate_embedding
from app.services.pinecone_service import index as pinecone_index

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """You are an AI course assistant. Your purpose is to help students understand their course materials.

RULES:
1. Answer ONLY using the provided context from the course documents.
2. If the context does not contain enough information to answer the question, say "The course materials do not contain sufficient information to answer this question."
3. Always cite the source filename and page number for each piece of information you provide.
4. Do not use any external knowledge or training data to answer.
5. Be precise and academic in your tone.
6. Format your response with clear sections and bullet points where appropriate.

CONTEXT:
{context}

CONVERSATION HISTORY:
{history}

USER QUESTION: {question}

Provide your answer based strictly on the context above. Include source citations in the format [Source: filename.pdf, Page X] after each claim."""


async def generate_chat_response(course_id: str, question: str, history: list[dict]):
    # Step 1: Embed the question
    query_embedding = await generate_embedding(question)

    # Step 2: Retrieve top-k chunks from Pinecone
    namespace = f"{settings.PINECONE_NAMESPACE_PREFIX}{course_id}"
    query_result = pinecone_index.query(
        vector=query_embedding,
        top_k=5,
        namespace=namespace,
        include_metadata=True,
    )

    # Step 3: Assemble context from retrieved chunks
    context_parts = []
    for match in query_result.matches:
        metadata = match.metadata
        chunk_text = metadata.get("text", "")
        source = f"[Source: {metadata.get('filename', 'Unknown')}, Page {metadata.get('page_number', 'N/A')}]"
        context_parts.append(f"{source}\n{chunk_text}")

    context = "\n\n---\n\n".join(context_parts)

    # Step 4: Format conversation history
    history_text = "\n".join([
        f"{'Student' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}"
        for msg in history[-10:]
    ])

    # Step 5: Build the prompt
    prompt = SYSTEM_PROMPT.format(
        context=context,
        history=history_text,
        question=question,
    )

    # Step 6: Stream the response
    response = await client.chat.completions.create(
        model=settings.OPENAI_CHAT_MODEL,
        messages=[{"role": "system", "content": prompt}],
        temperature=settings.OPENAI_TEMPERATURE,
        max_tokens=settings.OPENAI_MAX_TOKENS,
        stream=True,
    )

    return response, query_result.matches
```

### 4.7.3 Server-Sent Events Streaming

The system uses Server-Sent Events (SSE) to stream the model's response tokens to the frontend in real-time. SSE was chosen over WebSocket for this use case because the communication is unidirectional (server to client) after the initial question, and SSE built on standard HTTP eliminates the need for a WebSocket handshake and connection management.

```python
# app/routers/chat.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.services.rag_service import generate_chat_response
from app.core.dependencies import get_current_user

router = APIRouter()


@router.post("/ask")
async def ask_question(
    course_id: str,
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify user is enrolled in the course
    if not await is_user_enrolled(db, current_user.id, course_id):
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    # Retrieve conversation history
    history = await get_chat_history(db, current_user.id, course_id)

    # Generate streaming response
    stream, sources = await generate_chat_response(course_id, request.question, history)

    async def event_generator():
        full_response = ""
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_response += content
                yield f"data: {json.dumps({'type': 'token', 'content': content})}\n\n"

        # After completion, send source citations
        citations = []
        seen = set()
        for match in sources:
            filename = match.metadata.get("filename", "Unknown")
            if filename not in seen:
                seen.add(filename)
                citations.append({
                    "filename": filename,
                    "page": match.metadata.get("page_number", "N/A"),
                    "score": round(match.score, 3),
                })

        yield f"data: {json.dumps({'type': 'done', 'citations': citations})}\n\n"

        # Save messages to database
        await save_chat_messages(db, current_user.id, course_id, request.question, full_response)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
```

The `X-Accel-Buffering: no` header is critical when deploying behind Nginx (as Render does), because it disables proxy buffering that would otherwise delay the streaming response until the entire response is buffered.

### 4.7.4 Source Citation Generation

After the complete response is generated, the system sends a final SSE event containing structured citation data. Each citation includes the source filename, page number, and the cosine similarity score from the vector search. The frontend renders these as clickable links that scroll the user to the relevant section of the document viewer. The citation deduplication logic (`seen` set) ensures that the same document is not listed multiple times even if multiple chunks from it were retrieved.

### 4.7.5 Relevance Thresholding

The system implements a relevance threshold for retrieved chunks: any chunk with a cosine similarity score below 0.75 is excluded from the context. This prevents irrelevant or tangentially related content from being included in the prompt, which could degrade response quality. If fewer than 2 chunks pass the threshold, the system returns a response indicating insufficient information rather than attempting to answer with weak evidence.

## 4.8 Frontend Implementation

### 4.8.1 Component Architecture

The frontend is a single-page application built with React 18. The component hierarchy follows a container-presentational pattern, where container components manage state and data fetching, while presentational components focus solely on rendering. The top-level component tree is:

```
<App>
  <AuthProvider>          # Context for auth state
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/courses" element={<ProtectedRoute><CourseListPage /></ProtectedRoute>} />
        <Route path="/courses/:id" element={<ProtectedRoute><CourseDetailPage /></ProtectedRoute>} />
        <Route path="/courses/:id/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/courses/:id/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </Router>
  </AuthProvider>
</App>
```

### 4.8.2 API Client Configuration

The Axios HTTP client is configured with default settings for the backend URL and with `withCredentials: true`, which instructs the browser to include cookies in cross-origin requests. Listing 4.22 shows the API client configuration.

```javascript
// src/api/client.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${apiClient.defaults.baseURL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        return apiClient(originalRequest);
      } catch {
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

The response interceptor implements transparent token refresh: when a request receives a 401 response, it automatically attempts to refresh the access token using the httpOnly refresh cookie. If the refresh also fails, the user is redirected to the login page. This pattern provides seamless authentication without requiring the user to manually log in again after token expiry.

### 4.8.3 Authentication Context

React's Context API manages authentication state globally. The `AuthProvider` component tracks the current user and exposes login, logout, and registration functions. Unlike many examples that store user data in localStorage, this implementation stores only non-sensitive user metadata (name, email, role) in a React state variable, which is lost on page refresh — requiring the user to re-authenticate.

```javascript
// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await apiClient.get('/api/auth/me');
      setUser(response.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const response = await apiClient.post('/api/auth/login', { email, password });
    setUser(response.data.user);
    return response.data;
  }

  async function logout() {
    await apiClient.post('/api/auth/logout');
    setUser(null);
  }

  async function register(data) {
    const response = await apiClient.post('/api/auth/register', data);
    return response.data;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

### 4.8.4 Server-Sent Events Hook

A custom React hook encapsulates the SSE connection logic, handling connection lifecycle, error recovery, and message parsing. Listing 4.24 shows the hook implementation.

```javascript
// src/hooks/useSSE.js
import { useState, useRef, useCallback } from 'react';

export function useSSE() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [tokens, setTokens] = useState('');
  const [citations, setCitations] = useState([]);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);

  const startStream = useCallback((url, body) => {
    setIsStreaming(true);
    setTokens('');
    setCitations([]);
    setError(null);

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
      .then(async (response) => {
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
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'token') {
                  setTokens((prev) => prev + data.content);
                } else if (data.type === 'done') {
                  setCitations(data.citations);
                  setIsStreaming(false);
                }
              } catch {
                // Skip malformed SSE messages
              }
            }
          }
        }
      })
      .catch((err) => {
        setError(err.message);
        setIsStreaming(false);
      });
  }, []);

  const cancelStream = useCallback(() => {
    setIsStreaming(false);
  }, []);

  return { isStreaming, tokens, citations, error, startStream, cancelStream };
}
```

The hook uses the Fetch API's stream reader directly rather than the `EventSource` API because `EventSource` does not support POST requests or custom headers, both of which are required for the chatbot endpoint. The manual SSE parser handles the `text/event-stream` protocol by reading the response body as a stream, decoding the UTF-8 bytes, splitting on newline delimiters, and parsing each `data:` line as JSON.

### 4.8.5 File Upload Component

The file upload component provides drag-and-drop functionality with real-time validation and progress indication. It uses the native HTML5 Drag and Drop API and Axios's `onUploadProgress` callback to display upload percentage to the user.

```javascript
// src/components/FileUpload.jsx
import { useState, useRef, useCallback } from 'react';
import apiClient from '../api/client';

export default function FileUpload({ courseId }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  const handleUpload = useCallback(async (file) => {
    if (file.size > 20 * 1024 * 1024) {
      alert('File exceeds 20 MB limit');
      return;
    }
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await apiClient.post(`/api/courses/${courseId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          setProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
    } catch (error) {
      alert(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [courseId]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleUpload(e.dataTransfer.files[0]);
  }, [handleUpload]);

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => e.target.files?.length && handleUpload(e.target.files[0])}
      />
      {uploading ? (
        <div>
          <p className="text-gray-600">Uploading... {progress}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-600">Drop a PDF here or click to upload</p>
          <p className="text-gray-400 text-sm mt-1">Maximum file size: 20 MB</p>
        </div>
      )}
    </div>
  );
}
```

### 4.8.6 Chat Interface

The chat page renders the conversation as a scrollable message list and a fixed input bar at the bottom. Each assistant message is rendered with Markdown formatting using the `react-markdown` library and includes inline source citation links. The message list uses an Intersection Observer to auto-scroll to the latest message when new tokens arrive.

### 4.8.7 Tailwind CSS Configuration

Tailwind CSS is configured with a custom theme that matches the university's branding colours. The configuration extends the default palette with primary, secondary, and accent colours defined in hexadecimal values. The purge configuration scans component files for class name usage, producing a minimal CSS bundle in production.

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#eff6ff', 500: '#3b82f6', 700: '#1d4ed8' },
        secondary: { 50: '#f8fafc', 500: '#64748b', 700: '#334155' },
        accent: { 500: '#f59e0b', 700: '#d97706' },
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
```

The `@tailwindcss/typography` plugin is used to style the Markdown-rendered chat responses with proper typographic scales for headings, lists, and code blocks.

## 4.9 Database Implementation

### 4.9.1 Schema Design

The PostgreSQL database schema consists of seven tables implementing the relational model specified in Chapter Three. Table 4.3 lists each table with its purpose and key columns.

**Table 4.3: Database Schema Overview**

| Table             | Purpose                                          | Key Columns                                    |
|-------------------|--------------------------------------------------|------------------------------------------------|
| `users`           | Stores user accounts and credentials             | id (UUID PK), email (unique), password_hash, role |
| `courses`         | Represents academic courses                      | id (UUID PK), code, title, instructor_id (FK)  |
| `enrolments`      | Many-to-many relationship between users and courses | id (UUID PK), user_id (FK), course_id (FK), unique constraint |
| `documents`       | Metadata for uploaded PDF files                  | id (UUID PK), course_id (FK), filename, status  |
| `chats`           | Chat session headers                             | id (UUID PK), user_id (FK), course_id (FK)     |
| `messages`        | Individual messages within a chat session        | id (UUID PK), chat_id (FK), role, content, tokens_used |
| `refresh_tokens`  | Server-side refresh token storage for revocation | id (UUID PK), user_id (FK), token_hash, expires_at |

### 4.9.2 Indexing Strategy

Database performance is optimised through strategic indexing. The following indexes were created based on query pattern analysis:

```sql
-- Optimise login queries (lookup by email)
CREATE INDEX idx_users_email ON users (email);

-- Optimise course enrolment lookups
CREATE INDEX idx_enrolments_user_id ON enrolments (user_id);
CREATE INDEX idx_enrolments_course_id ON enrolments (course_id);
CREATE UNIQUE INDEX idx_enrolments_unique ON enrolments (user_id, course_id);

-- Optimise document listing for a course
CREATE INDEX idx_documents_course_id ON documents (course_id);
CREATE INDEX idx_documents_course_status ON documents (course_id, status);

-- Optimise message retrieval for chat history
CREATE INDEX idx_messages_chat_id ON messages (chat_id, created_at);
```

The composite index `idx_documents_course_status` supports the query that lists documents for a course filterable by processing status, which the frontend uses to display "Processing..." indicators beneath newly uploaded files.

### 4.9.3 Row-Level Security in Supabase

Since the system uses the Supabase service key (which bypasses RLS) for backend operations, RLS policies on the database tables serve as a defence-in-depth measure. If a service key were ever exposed, RLS policies would still restrict direct table access. Policy examples include:

- **Users table**: Users can only read their own record.
- **Documents table**: Instructors can insert and delete documents for their own courses; students can only read documents for courses they are enrolled in.
- **Courses table**: All authenticated users can read course records; only admins can modify them.

## 4.10 External Service Integration

### 4.10.1 OpenAI Integration

The system integrates with two OpenAI API endpoints: the Embeddings API for vector generation and the Chat Completions API for answer generation. Both integrations use the `AsyncOpenAI` Python client, which is initialised once at module load time and reused across requests. The API key is injected via the environment and never logged or exposed to the frontend.

A critical implementation detail is the temperature setting: the chat endpoint is configured with `temperature=0.3`, a deliberate choice that balances creativity with faithfulness to the source material. Lower temperatures (closer to 0) produce more deterministic, conservative outputs that are less likely to hallucinate facts not present in the context (Brown et al., 2020). Through empirical testing, a temperature of 0.3 was found to provide faithful answers while still allowing natural language variation in phrasing.

### 4.10.2 Pinecone Integration

The Pinecone client is initialised with the API key and environment at startup. The index configuration — 1,536 dimensions with cosine similarity — was chosen to match OpenAI's `text-embedding-3-small` model specifications. The use of namespaces rather than separate indexes per course was driven by cost considerations: Pinecone charges per index pod, and a single pod (`p1.x1`) is sufficient for a university deployment. Namespaces provide logical isolation without additional infrastructure cost.

The query method uses `include_metadata=True` because the response must include the chunk text and source information for context assembly. The metadata fields are indexed by Pinecone's metadata filter engine, which enables the optional filtering of results by document ID or date range.

### 4.10.3 Supabase Storage Integration

The Supabase Python client (`supabase-py`) handles file uploads and signed URL generation. Files are uploaded with the `upsert=False` option to prevent accidental overwrites. The `get_public_url` method generates a publicly accessible URL for the uploaded file, which is stored in the `documents` table and used later for generating source citation links.

RLS policies on the storage bucket restrict access: the bucket has a policy that permits read access to authenticated users enrolled in the associated course and write access to users with the instructor or admin role. These policies are defined in the Supabase Dashboard using SQL:

```sql
-- Storage bucket policy for read access
CREATE POLICY "Enrolled students can read documents"
ON storage.objects FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND bucket_id = 'course-documents'
  AND EXISTS (
    SELECT 1 FROM enrolments e
    JOIN documents d ON d.course_id = e.course_id
    WHERE e.user_id = auth.uid()
    AND d.storage_path = storage.objects.name
  )
);
```

## 4.11 Security Implementation

### 4.11.1 Rate Limiting

The `slowapi` library provides in-memory rate limiting using a fixed-window algorithm. Two limiters are configured: a global limiter (100 requests per hour per IP) and a chat-specific limiter (20 requests per minute per IP). The chat endpoint is more aggressively rate-limited because each request consumes OpenAI API credits. Listing 4.28 shows the rate limiter configuration.

```python
# app/middleware/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/hour"],
    storage_uri="memory://",
)
```

Rate limit exceeded responses return HTTP 429 with a `Retry-After` header indicating when the client can retry. The frontend intercepts 429 responses and displays a user-friendly message rather than a generic error.

### 4.11.2 CORS Configuration

The CORS middleware is configured with an explicit allowlist of origins rather than the permissive `allow_origins=["*"]`. This prevents unauthorised domains from making API requests from a user's browser. The `allow_credentials=True` flag is required for cookie-based authentication and is incompatible with the wildcard origin, which is why the explicit origin list is necessary.

### 4.11.3 Input Validation

All API inputs are validated using Pydantic schemas. FastAPI automatically validates request bodies against the defined schemas and returns a 422 Unprocessable Entity response with detailed error messages for invalid input. This validation layer provides protection against injection attacks, malformed data, and type mismatches before any business logic is executed.

```python
# app/schemas/user.py
from pydantic import BaseModel, EmailStr, field_validator
import re


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "student"

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain a digit")
        return v

    @field_validator("role")
    @classmethod
    def valid_role(cls, v: str) -> str:
        if v not in ("student", "instructor"):
            raise ValueError("Role must be 'student' or 'instructor'")
        return v
```

The `EmailStr` type from `pydantic[email]` validates email format at the schema level, and the custom `password_strength` validator enforces the application's password policy — a minimum of 8 characters with at least one uppercase letter and one digit.

### 4.11.4 Exception Handling

A global exception handler catches all unhandled exceptions and returns a standardised JSON error response, preventing stack traces from being exposed to the client in production. FastAPI's built-in exception handling is extended with a custom handler that logs the error via structlog before returning a generic 500 response.

```python
# main.py (excerpt)
import structlog
from fastapi import Request
from fastapi.responses import JSONResponse

logger = structlog.get_logger()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", exc_info=exc, path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )
```

## 4.12 Deployment Implementation

### 4.12.1 Backend Deployment on Render

The FastAPI backend is deployed on Render as a Web Service. Render was chosen over alternatives such as Heroku (which discontinued its free tier) and AWS Elastic Beanstalk (which required more configuration overhead) because it provides a managed Python runtime with automatic HTTPS, custom domains, and a straightforward deployment workflow via Git integration.

The Render deployment configuration is specified in a `render.yaml` file:

```yaml
# render.yaml
services:
  - type: web
    name: course-assistant-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4 --timeout-keep-alive 75
    healthCheckPath: /api/health
    autoDeploy: true
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: course-assistant-db
          property: connectionString
      - key: ENVIRONMENT
        value: production
```

The `--workers 4` flag runs four Uvicorn worker processes, utilising the Render instance's multi-core CPU. The `--timeout-keep-alive 75` parameter configures the keep-alive timeout for SSE connections, which is necessary because streaming responses hold the connection open for extended periods. The health check endpoint (`/api/health`) is used by Render's load balancer to determine instance availability.

### 4.12.2 Database as a Service

The PostgreSQL database is provisioned through Supabase, which provides a managed PostgreSQL 15 instance with automated backups, point-in-time recovery, and a built-in connection pooler (PgBouncer). The connection string is injected into the backend via the `DATABASE_URL` environment variable. Supabase's connection pooler is essential for the deployed environment because Render's free-tier instances have a limited number of simultaneous database connections, and the pooler multiplexes client connections efficiently.

### 4.12.3 Frontend Deployment on Vercel

The React frontend is deployed on Vercel, which provides automatic HTTPS, global CDN distribution, and seamless integration with the Git repository. The Vercel configuration is specified in `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

The rewrites rule ensures that all routes serve `index.html`, enabling client-side routing with React Router. Without this rule, direct navigation to `/courses/123` would return a 404 from Vercel's static file server.

### 4.12.4 Environment Variable Management

Sensitive configuration values are stored as environment variables in Render's dashboard and Vercel's project settings, never in the codebase. Table 4.4 lists the environment variables required in each deployment environment.

**Table 4.4: Environment Variables by Deployment Target**

| Variable                    | Render (Backend) | Vercel (Frontend) |
|-----------------------------|:----------------:|:-----------------:|
| `DATABASE_URL`              | ✓                | ✗                 |
| `SECRET_KEY`                | ✓                | ✗                 |
| `OPENAI_API_KEY`            | ✓                | ✗                 |
| `PINECONE_API_KEY`          | ✓                | ✗                 |
| `PINECONE_ENVIRONMENT`      | ✓                | ✗                 |
| `SUPABASE_URL`              | ✓                | ✗                 |
| `SUPABASE_SERVICE_KEY`      | ✓                | ✗                 |
| `VITE_API_URL`              | ✗                | ✓                 |
| `ENVIRONMENT`               | ✓                | ✓                 |

The frontend accesses its environment variables through Vite's `import.meta.env` mechanism, which statically replaces them at build time. The `VITE_` prefix is required by Vite to distinguish client-exposed variables from server-only ones.

### 4.12.5 Cold Start Mitigation

Render's free tier spins down web services after 15 minutes of inactivity, causing a cold start delay of 5-15 seconds on the next request. Two strategies mitigate this issue. First, a UptimeRobot monitoring service sends a GET request to the `/api/health` endpoint every 10 minutes to prevent the instance from spinning down. Second, the backend implements a "warm-up" handler that pre-loads the Pinecone index reference and OpenAI client on the first request, reducing the latency impact when a cold start does occur.

## 4.13 Summary

This chapter presented the complete implementation of the AI Course Assistant Chatbot system, detailing the technical decisions, code structures, and integration patterns that transform the design specification into a working application. The implementation was guided by three cardinal principles: security (httpOnly cookies, bcrypt hashing, rate limiting), scalability (course-isolated Pinecone namespaces, async processing, batch embedding), and user experience (SSE streaming, drag-and-drop upload, real-time processing status).

The backend was implemented as a modular FastAPI application with a clear separation of concerns across routers, services, models, and schemas. The document processing pipeline demonstrated a robust hybrid approach to text extraction, combining pdfplumber for native PDF parsing with Tesseract OCR for scanned documents, selected through a text-density heuristic. The RAG pipeline implemented the retrieve-then-generate paradigm with strict source grounding, using OpenAI's text-embedding-3-small and gpt-4o-mini models orchestrated through the Pinecone vector database.

The frontend, built with React 18 and Tailwind CSS, provided an intuitive interface for authentication, document management, and chat interaction, with custom hooks for SSE streaming and transparent token refresh. Deployment was split across Render for the backend and Vercel for the frontend, with Supabase managing both the PostgreSQL database and file storage.

The next chapter presents the testing methodology and results, evaluating the system against the functional and non-functional requirements established in Chapter Three.
