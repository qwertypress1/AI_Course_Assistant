# File Upload, Processing, and OpenAI Integration

## 1. File upload flow

- User drags and drops or selects a file on the frontend.
- The frontend sends:
  - `course_id`
  - `file`
- This goes to the backend endpoint:
  - `POST /api/v1/documents/upload`

## 2. Backend receives and validates the file

- The backend checks:
  - course exists
  - user can upload for that course
  - file type is allowed: `PDF`, `PNG`, `JPEG`, `TIFF`
  - file size is under the max limit
- It saves metadata to the database.
- It uploads the raw file bytes to storage (Supabase Storage in this project).

## 3. Background document processing

- After upload, the backend starts a background job:
  - `document_processing_service.process_document(document_id)`
- This means upload returns quickly while processing continues later.

## 4. Text extraction

- The document is downloaded from storage.
- If it is a PDF:
  - normal text extraction is attempted
  - if the page is scanned or low-text, OCR is used via `pytesseract`
- If it is an image:
  - OCR extracts the text directly

## 5. Text cleaning and chunking

- Extracted text is cleaned to remove noise.
- Text is split into chunks:
  - each chunk is a manageable piece of text
  - this keeps context accurate
- Each chunk is saved as a `DocumentChunk`

## 6. Embedding and indexing

- Each chunk is converted into an embedding vector using OpenAI
- The embedding represents the chunk’s meaning
- The vectors are stored in Pinecone
- Metadata is kept with each chunk:
  - document name
  - page number
  - chunk preview

## 7. How the chatbot uses the document

### 7.1 User asks a question
- The user sends a message to:
  - `POST /api/v1/chat/sessions/{session_id}/messages`

### 7.2 The system retrieves relevant chunks
- The question is converted into an embedding
- The system searches Pinecone for the most relevant chunks
- If Pinecone is empty or unavailable, it falls back to stored chunks in the database

### 7.3 OpenAI gets the relevant text
- The system builds a prompt containing:
  - system instructions
  - the retrieved document snippets
  - the user’s question
- The prompt is sent to OpenAI’s chat API

### 7.4 OpenAI returns an answer
- The AI generates a response using the provided context
- The chatbot reply is saved in the database
- The frontend receives the answer

---

## In plain terms

1. **Upload file** → browser sends file + course ID to backend
2. **Save file** → backend stores file and metadata
3. **Extract text** → PDF/image → text/OCR
4. **Split text** → chunk into smaller pieces
5. **Embed chunks** → convert text into vectors
6. **Index chunks** → save in Pinecone or DB
7. **Ask question** → user asks chatbot
8. **Search chunks** → find relevant text
9. **Call OpenAI** → send relevant text + question
10. **Return answer** → chatbot replies from the document

---

## Implementation checklist

### Frontend
- `frontend/src/services/api.ts`
  - upload should use `FormData`
  - do not force `Content-Type: application/json`
- `frontend/src/pages/DocumentsPage.tsx`
  - use `useDropzone`
  - append `file` and `course_id` correctly

### Backend
- `backend/routes/documents.py`
  - should accept `course_id = Form(...)`
  - should accept `file: UploadFile = File(...)`
- `backend/services/document_processing.py`
  - extract text from file
  - chunk text
  - index embeddings
- `backend/services/chat_service.py`
  - retrieve relevant chunks
  - send them to OpenAI

---

## Key point

- The file itself is not sent to OpenAI.
- OpenAI only sees the extracted text snippets that are relevant to the question.
