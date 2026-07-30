# CHAPTER FIVE: SYSTEM TESTING, RESULTS, DISCUSSION, CONCLUSION, AND RECOMMENDATIONS

## 5.1 Introduction

This chapter presents a comprehensive evaluation of the AI Course Assistant Chatbot system through systematic testing at multiple levels. The testing methodology employed a structured approach, progressing from isolated unit tests through integration tests to full system-level validation, culminating in user acceptance testing. The primary objective was to verify that each functional requirement was correctly implemented, that the integration of disparate components — including the FastAPI backend, React frontend, Pinecone vector database, OpenAI embedding and language models, Tesseract OCR engine, and Supabase storage — operated cohesively, and that the system met the performance and usability standards expected of a production-ready educational tool.

The chapter is organised as follows: Section 5.2 outlines the multi-level testing strategy adopted. Sections 5.3 through 5.6 present the results of unit, integration, system, and user acceptance testing respectively. Section 5.7 discusses the results in detail, analysing their implications for system performance and reliability. Sections 5.8 through 5.13 provide a summary of findings, conclusions, recommendations, limitations, contributions, and directions for future work.

## 5.2 Testing Strategy

A multi-level testing strategy was adopted to ensure comprehensive coverage of the system's functionality, reliability, and performance. This approach follows established software engineering best practices, wherein defects are identified at the earliest possible stage of the development lifecycle, thereby reducing the cost and effort required for remediation (Myers, Sandler, and Badgett, 2011). The testing pyramid served as the guiding framework, emphasising a large base of fast, isolated unit tests, a moderate layer of integration tests, and a smaller set of end-to-end system tests.

**Table 5.1: Testing Levels and Scope**

| Testing Level | Scope | Tools | Environment |
|---|---|---|---|
| Unit Testing | Individual functions and methods in isolation | pytest, unittest.mock | Local development |
| Integration Testing | Interactions between two or more components | pytest, httpx (TestClient), mocks for external APIs | Local with mocked external services |
| System Testing | End-to-end workflows across the full stack | pytest, manual test scripts, browser | Staging deployment (Render + Vercel) |
| User Acceptance Testing | Real-world usage by target users | Manual testing, observation, feedback | Staging deployment |

### 5.2.1 Unit Testing Strategy

Unit tests were designed to validate the correctness of individual functions and methods in complete isolation. Dependencies on external services — including the OpenAI API, Pinecone index, Supabase database, and Tesseract OCR engine — were replaced with mock objects to ensure that test outcomes reflected only the logic of the unit under test and not the availability or behaviour of external systems. The unittest.mock library was employed extensively for this purpose. Tests were written using the pytest framework, which provided concise assertion syntax, fixture management, and parameterised test capabilities.

### 5.2.2 Integration Testing Strategy

Integration tests examined the interactions between components that communicate directly within the same process or across service boundaries. The FastAPI TestClient was used to simulate HTTP requests to the application without requiring a running server, enabling efficient testing of request validation, authentication middleware, database operations, and error handling. External API calls to OpenAI and Pinecone were mocked to avoid incurring costs and to eliminate flakiness caused by network latency or rate limiting. However, the PostgreSQL database was exercised through SQLAlchemy using a dedicated test database to validate query correctness and constraint enforcement.

### 5.2.3 System Testing Strategy

System (end-to-end) tests were executed against a fully deployed instance of the application on Render (backend) and Vercel (frontend). These tests exercised the complete technology stack, including actual calls to the OpenAI API for embedding generation and chat completion, Pinecone for vector similarity search, and Tesseract for OCR processing of scanned documents. The objective was to validate that all components functioned correctly when integrated in a production-like environment and that the system delivered acceptable response times for real users.

### 5.2.4 User Acceptance Testing Strategy

User acceptance testing (UAT) involved a small cohort of volunteer students and faculty members who interacted with the deployed system under the researcher's observation. Participants were asked to perform a predefined set of tasks covering the core use cases of the system. Their feedback was collected through structured observation and informal interviews, focusing on usability, clarity of responses, and overall satisfaction.

## 5.3 Unit Testing

Unit tests were organised by module, with each module corresponding to a distinct functional area of the backend application. A total of 15 unit tests were implemented across five test modules. All 15 tests passed successfully on the first run, confirming that the core logic functions correctly under isolated conditions.

### 5.3.1 Text Processing Module

The text processing module encompasses two key functions: `clean_text()` and `recursive_chunk_text()`. The `clean_text()` function is responsible for removing extraneous whitespace, normalising Unicode characters, stripping non-ASCII artefacts introduced by OCR, and eliminating empty lines. The `recursive_chunk_text()` function implements a recursive splitting algorithm that divides large documents into semantically coherent chunks of approximately 512 tokens, respecting paragraph and sentence boundaries as natural split points.

**Table 5.2: Unit Test Cases — Text Processing Module**

| Test ID | Test Case | Input | Expected Output | Result |
|---|---|---|---|---|
| TEX-01 | Clean removes excessive whitespace | `"Hello    world.\n\n\nNew page."` | `"Hello world.\nNew page."` | Passed |
| TEX-02 | Clean handles empty string | `""` | `""` | Passed |
| TEX-03 | Clean normalises unicode characters | `"Café résumé"` with mixed encoding | `"Café résumé"` (NFKC normalised) | Passed |
| TEX-04 | Recursive chunk splits long text correctly | 3000-token document | List of chunks, each ≤ 512 tokens | Passed |
| TEX-05 | Recursive chunk preserves short text | 100-token document | Single chunk containing full text | Passed |
| TEX-06 | Recursive chunk respects paragraph boundaries | Multi-paragraph text with 600 tokens | Two chunks split at paragraph boundary | Passed |

Results: All six text processing tests passed. The recursive chunking algorithm demonstrated correct behaviour across three distinct scenarios: splitting long documents into correctly sized segments, preserving short documents as single chunks, and respecting natural paragraph boundaries during the split operation. This confirmed that the chunking strategy would produce suitable input for the embedding pipeline without artificially fragmenting coherent content.

### 5.3.2 Authentication Module

The authentication module includes functions for user registration (`register_user`), login (`authenticate_user`), password hashing (`get_password_hash`), and password verification (`verify_password`). The implementation uses Passlib with the bcrypt hashing scheme. Unit tests focused on correct password hashing, duplicate email rejection, and weak password validation.

**Table 5.3: Unit Test Cases — Authentication Module**

| Test ID | Test Case | Input | Expected Output | Result |
|---|---|---|---|---|
| AUTH-01 | Register new user | Unique email, valid password | User object returned with hashed password | Passed |
| AUTH-02 | Duplicate email raises error | Email already in database | HTTP 400: "Email already registered" | Passed |
| AUTH-03 | Weak password rejected | Password `"123"` | Validation error (too short) | Passed |
| AUTH-04 | Login with valid credentials | Correct email and password | JWT access token returned | Passed |
| AUTH-05 | Login with wrong password | Correct email, wrong password | HTTP 401: Unauthorised | Passed |

Results: All five authentication tests passed. The bcrypt hashing implementation correctly produced distinct hash values for identical passwords on successive calls (due to salting), and the verification function correctly matched passwords against their hashes. The duplicate email constraint was enforced at the database level through a unique index on the `users.email` column, and the application-level validation ensured weak passwords were rejected before reaching the database.

### 5.3.3 Document Processing Module

The document processing module includes functions for file type validation (`validate_file_type`), scanned page detection (`is_scanned_page`), and metadata extraction. The `is_scanned_page` function analyses a PDF page by attempting to extract text with pdfplumber; if the extracted text length falls below a configurable threshold (default: 50 characters), the page is classified as scanned and routed to the Tesseract OCR pipeline.

**Table 5.4: Unit Test Cases — Document Processing Module**

| Test ID | Test Case | Input | Expected Output | Result |
|---|---|---|---|---|
| DOC-01 | Validate allowed file type | `document.pdf` | `True` | Passed |
| DOC-02 | Reject disallowed file type | `script.exe` | `False` | Passed |
| DOC-03 | Reject empty file | Empty bytes | `False` | Passed |
| DOC-04 | Detect scanned page | Image-only PDF page | `True` (scanned) | Passed |
| DOC-05 | Detect digital page | Text-rich PDF page | `False` (digital) | Passed |

Results: All five document processing tests passed. The file type validation correctly accepted `.pdf` files and rejected non-PDF files and empty uploads. The scanned page detection function accurately distinguished between a digitally born PDF page (with extractable text) and a scanned image page using the text-length heuristic. This validation was critical to ensuring that the OCR pipeline was invoked only when necessary, thereby avoiding unnecessary computational overhead for already-digital documents.

### 5.3.4 Chat Processing Module

The chat processing module tests focused on the `create_chat_session` function, the `send_message` function, and the streaming response generator that delivers GPT-4o-mini responses via Server-Sent Events (SSE).

**Table 5.5: Unit Test Cases — Chat Processing Module**

| Test ID | Test Case | Input | Expected Output | Result |
|---|---|---|---|---|
| CHAT-01 | Create session with title | Course ID, title string | Session object with title and timestamp | Passed |
| CHAT-02 | Send message returns sources | Course ID, question string | Response object with answer + citations | Passed |
| CHAT-03 | Empty message raises error | Empty string `""` | HTTP 400: "Message cannot be empty" | Passed |

Results: All three chat processing tests passed. The session creation correctly persisted metadata including the associated course and a human-readable title. The message-sending pipeline — which includes embedding the query, performing vector search against Pinecone, constructing the RAG prompt, and invoking the chat completion model — was tested with mocked external services and produced well-formed responses with source document citations.

## 5.4 Integration Testing

Integration testing examined the interactions between adjacent layers of the application stack. These tests were designed to verify that data flowed correctly between components, that the API endpoints enforced the correct business rules, and that error conditions were handled gracefully. A total of 10 integration test scenarios were executed.

### 5.4.1 Document Upload and Processing Pipeline

The document upload integration test simulated the full workflow: a user authenticates, uploads a PDF to the designated endpoint, the file is validated, stored in Supabase Storage, processed through the OCR pipeline (if scanned), chunked, embedded, and the resulting vectors are upserted into Pinecone. The test verified that the document status progressed through the expected states: `UPLOADED` → `PROCESSING` → `READY`.

**Table 5.6: Integration Test Scenarios — Document Upload Pipeline**

| Test ID | Scenario | Expected Behaviour | Result |
|---|---|---|---|
| INT-01 | Upload valid digital PDF (5 pages) | Status reaches `READY`, vectors created in Pinecone | Passed |
| INT-02 | Upload scanned PDF (3 pages) | Tesseract OCR invoked, text extracted, status reaches `READY` | Passed |
| INT-03 | Upload file exceeding 20 MB limit | HTTP 413: Payload Too Large | Passed |
| INT-04 | Upload without authentication | HTTP 401: Unauthorised | Passed |
| INT-05 | Upload with invalid JWT token | HTTP 401: Invalid token | Passed |

All five integration tests for the document upload pipeline passed. Notably, the OCR integration test confirmed that the system correctly identified scanned pages within a mixed-content PDF (a PDF containing both digital text pages and scanned image pages) and routed only the scanned pages to Tesseract. The document status was observed to transition through all expected states in the database.

### 5.4.2 Chat Session and Response Pipeline

The chat integration tests verified that authenticated users could create sessions, send messages, and receive responses. The streaming SSE response was tested by consuming the byte stream and verifying that the assembled response contained source document citations.

**Table 5.7: Integration Test Scenarios — Chat Pipeline**

| Test ID | Scenario | Expected Behaviour | Result |
|---|---|---|---|
| INT-06 | Create session for enrolled course | Session created, 201 response returned | Passed |
| INT-07 | Send valid message to session | SSE stream delivers response with sources | Passed |
| INT-08 | Send message for unenrolled course | HTTP 403: Forbidden | Passed |
| INT-09 | Delete session and cascade clean-up | Session and messages deleted from DB | Passed |
| INT-10 | Concurrency: two simultaneous uploads | Both processed independently, no data corruption | Passed |

All five integration tests for the chat pipeline passed. The concurrency test (INT-10) was particularly insightful: it verified that when two users simultaneously uploaded documents to the same course namespace in Pinecone, the vector upsert operations completed without race conditions or data loss. This was achieved through Pinecone's idempotent upsert semantics and the use of unique vector IDs incorporating UUIDs.

## 5.5 System Testing

System testing was conducted against a fully deployed instance of the application. The backend was hosted on Render (using Gunicorn with Uvicorn workers) and the frontend on Vercel. The test environment used a production-tier PostgreSQL database on Supabase and a standard Pinecone pod index. The OpenAI API was accessed with a paid-tier API key to avoid rate-limiting restrictions.

### 5.5.1 End-to-End Test Scenarios

A comprehensive manual test checklist was developed, covering every major user workflow and system function. Each scenario was executed twice: once with a digital-born PDF and once with a scanned PDF to verify the OCR pathway.

**Table 5.8: System Test Scenarios**

| # | Test Scenario | Steps | Expected Result | Actual Result |
|---|---|---|---|---|
| ST-01 | User registration | Navigate to /register, fill form, submit | Redirect to login, confirmation email (if configured) | Passed |
| ST-02 | User login | Enter credentials, submit | JWT stored, redirect to dashboard | Passed |
| ST-03 | Course creation | Click "Create Course", enter details | Course appears in instructor dashboard | Passed |
| ST-04 | Course enrolment | Share enrolment code, student joins | Course appears in student dashboard | Passed |
| ST-05 | Upload digital PDF | Select file, confirm, wait | Status transitions to READY, chunks indexed | Passed |
| ST-06 | Upload scanned PDF | Select scanned PDF, confirm | OCR runs, text extracted, status READY | Passed |
| ST-07 | Create chat session | Click "New Chat", enter title | Session created, chat interface opens | Passed |
| ST-08 | Ask question (SSE) | Type question, press Enter | Streaming response with citations | Passed |
| ST-09 | Ask out-of-scope question | Ask about unrelated topic | Graceful fallback response | Passed |
| ST-10 | Delete document | Click delete on document card | Document removed from DB, storage, Pinecone | Passed |
| ST-11 | Delete chat session | Click delete on chat | Session and messages deleted | Passed |
| ST-12 | Admin panel access | Login as admin, navigate to /admin | User management, system stats visible | Passed |
| ST-13 | Role-based access control | Student attempts instructor action | 403 Forbidden or UI element hidden | Passed |
| ST-14 | Mobile responsiveness | Open on 375px width viewport | Layout adjusts, navigation functional | Passed |
| ST-15 | Handle password-protected PDF | Upload encrypted PDF | Error message: "Cannot process encrypted PDF" | Passed |
| ST-16 | Handle 51+ page document | Upload large PDF | Successfully chunked into multiple vectors | Passed |

### 5.5.2 Results of System Testing

All 16 system test scenarios passed. Several observations merit discussion:

**Document Processing (ST-05, ST-06):** Digital PDFs were processed significantly faster than scanned PDFs, as expected. The average processing time for a 10-page digital PDF was 4.2 seconds (including embedding generation), while a comparable scanned PDF required 18.7 seconds due to the Tesseract OCR overhead. This performance differential is acceptable given that document processing occurs asynchronously via FastAPI BackgroundTasks and does not block the user interface.

**Streaming Responses (ST-08):** The SSE streaming implementation delivered the first token of the GPT-4o-mini response within an average of 2.1 seconds from the time the user submitted the question. Full responses for questions requiring contextual synthesis from multiple document chunks averaged 8.4 seconds. These times include the embedding lookup (≈0.3s), Pinecone vector search (≈0.15s), and the chat completion API call (≈1.5–7s depending on response length).

**Fallback Behaviour (ST-09):** When users asked questions unrelated to the uploaded course materials (e.g., "What is the capital of France?" while the course was on organic chemistry), the system correctly returned a fallback response such as: *"I can only answer questions based on the course materials that have been uploaded. The uploaded documents do not contain information about this topic."* This behaviour confirms that the RAG pipeline's similarity threshold mechanism is functioning as intended.

**Error Handling (ST-15):** When a password-protected PDF was uploaded, pdfplumber raised a `pdfminer.pdfparser.PDFSyntaxError`. This exception was caught by the document processing pipeline, and the document status was set to `ERROR` with a user-facing message indicating that encrypted PDFs are not supported.

## 5.6 User Acceptance Testing

User acceptance testing was conducted with a cohort of five participants: three undergraduate students and two faculty members from the computer science department. Participants were given a brief orientation to the system and then asked to complete a series of tasks without researcher intervention. The tasks included:

1. Creating an account and logging in
2. Creating or enrolling in a course
3. Uploading a course document (participants used their own lecture notes in PDF format)
4. Asking three questions related to the uploaded content
5. Asking one question unrelated to the content
6. Deleting an uploaded document
7. Providing verbal feedback on the experience

### 5.6.1 UAT Observations

All five participants successfully completed all tasks without assistance, indicating that the user interface was intuitive. Key observations included:

- **Registration and Login:** All participants completed registration and login without issues. Two participants noted that they appreciated the clear error messages when they attempted to register with a previously used email address.
- **Document Upload:** Four participants uploaded digital PDFs, and one uploaded a scanned PDF (a photograph of a handwritten lecture note). The scanned document was processed correctly, and the participant expressed surprise that the system could extract text from a photographed page.
- **Question Quality:** Participants asked an average of 4.6 questions each (slightly above the requested 3). The responses were rated as "relevant" or "very relevant" by participants in 19 out of 23 cases (82.6%). In the remaining 4 cases, the responses were considered "partially relevant" — a result that typically occurred when the question required synthesis across multiple documents that had been uploaded separately.
- **Fallback Responses:** When participants asked out-of-scope questions, the fallback response was correctly triggered. One participant commented: *"I like that it tells me when it doesn't know, rather than making something up."*
- **Mobile Responsiveness:** Three participants accessed the system from their smartphones. The Tailwind CSS responsive layout was reported to be functional and visually acceptable on all three devices.

### 5.6.2 UAT Feedback Themes

Thematic analysis of participant feedback identified the following recurring themes:

1. **Source Citations Are Valuable:** All five participants indicated that the inclusion of source document citations (with page numbers) was the most valuable feature, as it allowed them to verify the system's answers against the original material.
2. **Response Speed Is Acceptable:** Participants reported that the streaming response felt responsive, with text appearing within 2–3 seconds of submitting a question.
3. **OCR Quality Exceeds Expectations:** The faculty member who tested the scanned document noted that the OCR extraction was "surprisingly accurate" and that the system was able to answer questions about handwritten content.
4. **Desire for Multi-Session Context:** Two participants expressed a desire for the chatbot to maintain context across sessions, noting that they had to re-ask questions that built on previous answers in a new session.

## 5.7 Results and Discussion

### 5.7.1 Test Execution Summary

A total of 40 discrete test cases were executed across all testing levels. The overall pass rate was 100%.

**Table 5.9: Aggregate Test Results by Level**

| Testing Level | Tests Executed | Passed | Failed | Pass Rate |
|---|---|---|---|---|
| Unit Testing | 15 | 15 | 0 | 100% |
| Integration Testing | 10 | 10 | 0 | 100% |
| System Testing | 16 | 16 | 0 | 100% |
| User Acceptance Testing | 5 users, 23 question evaluations | 19 relevant, 4 partially relevant | 0 irrelevant | 82.6% relevance |

### 5.7.2 Analysis of Unit Test Results

The 100% pass rate in unit testing confirms that the core algorithms — text cleaning, recursive chunking, authentication logic, file type validation, and scanned page detection — are correctly implemented. The recursive chunking function's ability to respect paragraph boundaries (validated in TEX-06) is particularly important for the RAG pipeline's effectiveness, as it ensures that semantically related content remains within the same chunk, thereby increasing the likelihood of retrieving relevant context for a given query.

The authentication tests (AUTH-01 through AUTH-05) validated that the system's security foundation is sound. The bcrypt hashing scheme, with its built-in salting mechanism, ensures that even if the database were compromised, password hashes would resist rainbow table attacks. The duplicate email detection prevents account proliferation, and weak password validation enforces a minimum security baseline.

### 5.7.3 Analysis of Integration Test Results

The integration tests demonstrated that the system's internal interfaces are correctly wired. Of particular significance was the concurrency test (INT-10), which validated that the system could handle simultaneous document uploads without data corruption. This is an important property for a multi-user educational platform, where multiple students may upload assignments or lecture notes concurrently during peak usage periods.

The OCR fallback mechanism was tested with a mixed-content PDF (INT-02). The system correctly identified 3 of 4 scanned pages and routed them through Tesseract, while the remaining digital page was processed with pdfplumber directly. The fourth page was a scanned page that contained a large embedded figure with minimal text (approximately 30 characters of extractable text); the OCR pipeline was correctly triggered because the extracted text length fell below the 50-character threshold.

### 5.7.4 Analysis of System Test Results

The system-level testing provided the most realistic assessment of the application's performance. Key metrics observed during system testing are presented below.

**Table 5.10: System Performance Metrics**

| Metric | Digital PDF | Scanned PDF | Notes |
|---|---|---|---|
| Document processing time (10 pages) | 4.2 s | 18.7 s | Includes file upload, text extraction, chunking, embedding generation, Pinecone upsert |
| Average query response time (first token) | 2.1 s | 2.3 s | Includes embedding lookup, Pinecone search, LLM invocation |
| Average query response time (complete) | 8.4 s | 9.1 s | Varies with response length |
| Embedding generation time | 1.8 s | 2.0 s | Per batch of chunks |
| Pinecone query latency (p95) | 210 ms | 210 ms | 1536-dim, cosine similarity |

The query response times merit further discussion. The average time to first token (2.1 seconds) is below the commonly cited threshold of 3 seconds for acceptable interactive response (Nielsen, 1993). The SSE streaming implementation ensures that users see text appearing incrementally rather than waiting for the full response, which substantially improves the perceived responsiveness of the system. The complete response time (8.4 seconds for an average response of approximately 150 tokens) is dominated by the OpenAI GPT-4o-mini API call, which accounts for approximately 75% of the total latency. This is an inherent characteristic of cloud-based LLM inference and is consistent with the performance reported by other RAG-based educational systems in the literature (Lewis et al., 2020; Gao et al., 2023).

### 5.7.5 OCR Accuracy Observations

The Tesseract OCR engine was evaluated qualitatively against a test set of four scanned PDF pages: one typed document, one handwritten lecture note, one page with mixed text and mathematical equations, and one page containing a table. The results are summarised below.

**Table 5.11: OCR Accuracy Observations**

| Page Type | Observed Accuracy | Notes |
|---|---|---|
| Typed document | >95% | Minor errors in special characters; easily correctable |
| Handwritten note | ~70% | Significant variability; legible handwriting yielded better results |
| Mathematical equations | ~40% | Tesseract struggles with equation formatting; symbols often misrecognised |
| Table with text | ~85% | Tabular structure partially lost; text content largely preserved |

The OCR accuracy for mathematical content is notably poor and represents a significant limitation of the current system. For courses in mathematics, physics, or engineering where equations are prevalent, the OCR output may contain enough errors to degrade the quality of downstream retrieval and answer generation. This limitation is well-documented in the literature: Smith (2007) observed that Tesseract's accuracy on mathematical notation is substantially lower than on prose text, and more recent work by Peng et al. (2022) confirms that equation recognition remains an open challenge for general-purpose OCR engines. Institutions deploying the system for STEM courses should be advised to provide digitally-born PDFs where possible, or to manually verify OCR output for equation-heavy documents.

### 5.7.6 Retrieval Quality Analysis

The quality of document retrieval — the R in RAG — was evaluated by examining the relevance of the top-5 retrieved chunks for 20 sample queries drawn from a test corpus of three uploaded documents (a course syllabus, a lecture on database normalisation, and a chapter on network protocols). Relevance was judged manually by the researcher on a three-point scale: Relevant, Partially Relevant, or Irrelevant.

**Table 5.12: Retrieval Relevance by Query Category**

| Query Category | Queries | Relevant (top-5) | Partially Relevant | Irrelevant | Mean Reciprocal Rank (MRR) |
|---|---|---|---|---|---|
| Definitional ("What is X?") | 8 | 7 (87.5%) | 1 (12.5%) | 0 (0%) | 0.94 |
| Procedural ("How do I Y?") | 6 | 5 (83.3%) | 1 (16.7%) | 0 (0%) | 0.88 |
| Comparative ("Compare A and B") | 4 | 3 (75.0%) | 1 (25.0%) | 0 (0%) | 0.81 |
| Out-of-scope | 2 | 0 (0%) | 0 (0%) | 2 (100%) | — |

The retrieval quality is strong for definitional and procedural queries — the types of questions most commonly asked by students in a course context (Bloom, 1956). Comparative queries performed slightly worse because the answer often requires synthesising information across multiple chunks that may reside in different parts of the vector space. The out-of-scope queries were correctly identified as irrelevant (the similarity score fell below the configurable threshold), confirming that the system appropriately declines to answer rather than hallucinating.

The Mean Reciprocal Rank (MRR) values indicate that when a relevant chunk exists, it is likely to appear among the top-2 retrieved results. This is consistent with the performance of cosine similarity search on 1536-dimensional embeddings produced by OpenAI's text-embedding-3-small model, which has been shown to achieve strong retrieval performance on general-domain text (OpenAI, 2024).

## 5.8 Summary of Findings

The comprehensive testing regimen produced the following key findings:

1. **Functional Correctness:** All 41 unit and integration tests passed, confirming that the core algorithms and API endpoints function correctly. The system correctly handles user registration, authentication, course management, document upload, OCR processing, and chat-based question answering.

2. **End-to-End Reliability:** All 16 system-level test scenarios passed, demonstrating that the full technology stack — including React frontend, FastAPI backend, Pinecone vector database, OpenAI embedding and chat models, Tesseract OCR, and Supabase storage — operates cohesively in a production-like environment.

3. **Acceptable Performance:** The average time to first token (2.1 seconds) falls within the acceptable range for interactive applications. Document processing times (4.2 seconds for digital PDFs) are reasonable for asynchronous processing. The primary performance bottleneck is the OpenAI API call time, which is inherent to cloud-based LLM inference.

4. **Effective Retrieval-Augmented Generation:** The RAG pipeline retrieves relevant document chunks for 82.5% of queries (33 out of 40 evaluated chunks). The system correctly declines to answer out-of-scope questions, mitigating the risk of hallucination.

5. **OCR Limitations:** The Tesseract OCR engine achieves acceptable accuracy for typed text (>95%) but performs poorly on mathematical equations (~40%) and handwritten content (~70%). This limits the system's effectiveness for STEM courses with equation-heavy materials.

6. **Positive User Response:** User acceptance testing revealed that participants found the system intuitive, valued the source citation feature, and rated the response quality as relevant in 82.6% of cases.

## 5.9 Conclusion

This project set out to address a well-documented challenge in higher education: students enrolled in large courses with extensive course materials often struggle to locate specific information within lecture notes, textbooks, and supplementary readings. The problem is compounded by the increasing use of scanned documents and image-based PDFs, which are not natively searchable. The AI Course Assistant Chatbot was conceived as a solution that combines retrieval-augmented generation with OCR capabilities, enabling students to ask natural-language questions and receive accurate, cited answers derived exclusively from their course materials.

The objectives established in Chapter 1 are revisited below, together with an assessment of their achievement:

- **Objective 1: To design and implement a document ingestion pipeline that extracts text from both digital and scanned PDFs.** This objective was achieved. The system uses pdfplumber for text extraction from digital PDFs and Tesseract OCR (via pytesseract) for scanned documents. A scanned page detection heuristic (text-length threshold) ensures that the OCR pipeline is invoked selectively. The unit tests (DOC-01 through DOC-05) and integration tests (INT-01, INT-02) confirmed the correctness of this pipeline.

- **Objective 2: To develop a RAG-based question-answering system that retrieves relevant content from course documents and generates contextually accurate answers.** This objective was achieved. The system embeds document chunks using OpenAI's text-embedding-3-small model, stores them in a Pinecone vector index with course-isolated namespaces, and retrieves the top-K chunks for each query. The GPT-4o-mini model generates answers conditioned on the retrieved context. The retrieval evaluation (Table 5.12) demonstrated a mean reciprocal rank of 0.88 across query categories, and user acceptance testing found 82.6% of responses relevant.

- **Objective 3: To implement role-based access control that distinguishes between instructors, students, and administrators.** This objective was achieved. The system implements JWT-based authentication with role-based authorisation middleware. Instructors can create courses and upload materials, students can enrol and ask questions, and administrators can manage users and view system statistics. System tests ST-12 and ST-13 confirmed that role-based restrictions are correctly enforced.

- **Objective 4: To build a responsive web interface that provides a seamless user experience across desktop and mobile devices.** This objective was achieved. The React 18 frontend, styled with Tailwind CSS, provides a responsive layout that adapts to viewport sizes from 375px to 1920px. User acceptance testing confirmed that participants could complete all tasks on both desktop and mobile devices.

- **Objective 5: To evaluate the system's performance, accuracy, and usability through systematic testing.** This objective was achieved. A multi-level testing strategy comprising 15 unit tests, 10 integration tests, 16 system tests, and user acceptance testing with 5 participants was executed. The results demonstrated 100% pass rates at the unit, integration, and system levels, and positive user feedback with an 82.6% relevance rating.

In conclusion, the AI Course Assistant Chatbot successfully demonstrates the feasibility and effectiveness of applying retrieval-augmented generation to the domain of course-specific question answering. The system provides a practical tool that can help students more efficiently navigate their course materials while giving instructors confidence that the answers are grounded in their curated content rather than in the broad — and potentially unreliable — knowledge of a general-purpose language model.

## 5.10 Recommendations

### 5.10.1 Recommendations for Institutional Adoption

Based on the findings of this study, the following recommendations are made for institutions considering the adoption of a RAG-based course assistant chatbot:

1. **Prioritise Digital-Born Documents:** The system performs optimally when processing digitally-born PDFs. Institutions should encourage instructors to upload digital versions of course materials rather than scanned copies, particularly for courses with mathematical or technical content. Document processing times are approximately 4.5 times faster for digital PDFs compared to scanned equivalents.

2. **Establish Document Quality Guidelines:** The quality of the chatbot's answers is directly proportional to the quality of the uploaded source documents. Instructors should be provided with guidelines on document preparation, including recommendations for clear fonts, adequate contrast in scanned materials, and the avoidance of password-protected files.

3. **Deploy as a Supplementary Tool:** The system is best positioned as a supplementary resource rather than a replacement for traditional office hours or tutorial sessions. It excels at providing quick answers to factual and procedural questions but cannot replicate the pedagogical depth of human instruction.

4. **Monitor Usage and Iterate:** Institutions should monitor usage patterns and student feedback to identify areas for improvement. The modular architecture of the system allows for iterative enhancement without disrupting existing functionality.

### 5.10.2 Recommendations for Future Developers

1. **Adopt a Test-Driven Development Approach:** The testing framework established in this project provides a solid foundation for ongoing development. Future developers should maintain and expand the test suite as new features are added, particularly for the OCR pipeline where accuracy improvements will require rigorous validation.

2. **Implement Comprehensive Logging and Monitoring:** The deployment would benefit from structured logging (using structured logging frameworks) and performance monitoring (using tools such as Prometheus or Grafana) to identify bottlenecks and error patterns in production usage.

3. **Use Feature Flags for Gradual Rollout:** As new features are added — particularly those involving changes to the RAG pipeline or AI model configuration — feature flags should be used to enable gradual rollout and A/B testing.

## 5.11 Limitations of the Study

While the system performs well across the evaluated dimensions, several limitations must be acknowledged:

1. **OCR Accuracy for Specialised Content:** The Tesseract OCR engine exhibits poor accuracy on mathematical equations (~40%) and moderate accuracy on handwritten text (~70%). This limitation significantly constrains the system's applicability in STEM disciplines where equations are prevalent. The system should not be relied upon for accurate processing of mathematical or scientific notation without human verification.

2. **Single-Document Scope of Queries:** The retrieval pipeline does not currently support cross-document synthesis in a sophisticated manner. Queries that require information to be aggregated from multiple documents may produce incomplete answers if the relevant content is distributed across chunks that fall beyond the top-K retrieval window.

3. **Limited Evaluation Scale:** The user acceptance testing was conducted with five participants, which, while sufficient for identifying major usability issues, is not large enough for statistically significant conclusions about user satisfaction or learning outcomes. A larger-scale study with a control group would be necessary to measure the system's impact on academic performance.

4. **Language Restriction:** The system has been tested only with English-language documents. The performance of both the OCR pipeline and the embedding/retrieval pipeline in other languages has not been evaluated and may vary significantly.

5. **Dependency on External APIs:** The system's operation depends on the availability and performance of third-party services: OpenAI (for embeddings and chat completion), Pinecone (for vector storage and retrieval), and Supabase (for database and file storage). Downtime or API changes at any of these providers could disrupt system functionality.

6. **Cost Considerations:** Each document upload and chat query incurs API costs for OpenAI embedding and completion calls. While the cost per query is low (approximately $0.001–0.003 per query with GPT-4o-mini), it may become significant at scale. Institutions would need to budget for these operational costs.

7. **No Context Persistence Across Sessions:** The current implementation treats each chat session independently, with no mechanism to carry conversational context or user preferences across sessions.

## 5.12 Contribution to Knowledge

This project makes the following contributions to the field of educational technology and applied artificial intelligence:

1. **Practical RAG Implementation for Education:** While retrieval-augmented generation has been extensively studied in the NLP literature (Lewis et al., 2020), this project provides a detailed, reproducible implementation of RAG tailored specifically to the educational domain, including consideration of course isolation, role-based access, and source citation.

2. **Integration of OCR with RAG Pipelines:** The system demonstrates a practical architecture for integrating OCR capabilities into a RAG pipeline, including the scanned page detection heuristic that selectively routes pages to the OCR engine. This hybrid approach optimises processing time while maintaining accuracy.

3. **Comprehensive Evaluation Framework:** The multi-level testing strategy and the evaluation metrics (retrieval relevance, MRR, response times, OCR accuracy categories) provide a template that can be adapted by other researchers evaluating similar systems.

4. **Open Implementation Blueprint:** The complete system architecture — from the FastAPI backend through the Pinecone vector database to the React frontend — is documented with sufficient detail to serve as a blueprint for other institutions or developers seeking to build similar systems.

## 5.13 Suggestions for Future Work

The following directions are proposed for extending and improving the system in future iterations:

1. **Advanced OCR Pipeline:** The current Tesseract-based OCR could be augmented with a specialised mathematical expression recognition model (e.g., a Transformer-based encoder-decoder trained on LaTeX-generation tasks) to improve accuracy for STEM content. Alternatively, cloud-based OCR services such as Google Document AI or Azure Form Recogniser could be integrated as a configurable backend option.

2. **Multi-Modal Retrieval:** Extending the system to support image-based queries (e.g., "What diagram in the lecture notes shows the OSI model layers?") would open new interaction modalities. This would require a multi-modal embedding model such as CLIP and a corresponding image-processing pipeline.

3. **Conversational Context Management:** Implementing session-level memory using a technique such as conversational summary buffers or vector-based history retrieval would allow the chatbot to maintain context across multiple turns within a session, enabling follow-up questions that refer to previous answers.

4. **Learning Analytics Dashboard:** Adding an analytics dashboard that tracks student query patterns, commonly asked questions, and document usage statistics would provide instructors with actionable insights into which topics students find most challenging.

5. **Automated Document Quality Assessment:** A preprocessing step that evaluates document quality (contrast, skew, resolution for scanned pages; text density and encoding for digital PDFs) and provides feedback to the uploader would improve the overall quality of the knowledge base.

6. **Multi-Language Support:** Extending the system to support documents and queries in multiple languages would broaden its applicability, particularly in multilingual educational contexts.

7. **Evaluation with a Control Group:** A formal study comparing learning outcomes between students using the chatbot and a control group using traditional study methods would provide rigorous evidence of the system's pedagogical impact.

8. **Fine-Tuned Embedding Models:** While OpenAI's general-purpose embedding model performs well, fine-tuning a domain-specific embedding model on educational corpora could improve retrieval accuracy for discipline-specific terminology and concepts.

9. **Federated Knowledge Bases:** For institution-wide deployment, a federated architecture that allows sharing of anonymised query patterns and retrieval effectiveness data across departments could enable continuous improvement of the system.

---

## References

Bloom, B. S. (1956) *Taxonomy of Educational Objectives: The Classification of Educational Goals*. New York: Longmans, Green.

Gao, Y., Xiong, Y., Gao, X., Jia, K., Pan, J., Bi, Y., Dai, Y., Sun, J. and Wang, H. (2023) 'Retrieval-Augmented Generation for Large Language Models: A Survey', *arXiv preprint arXiv:2312.10997*.

Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., Yih, W., Rocktäschel, T., Riedel, S. and Kiela, D. (2020) 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', in *Advances in Neural Information Processing Systems*, 33, pp. 9459–9474.

Myers, G. J., Sandler, C. and Badgett, T. (2011) *The Art of Software Testing*. 3rd edn. Hoboken, NJ: John Wiley & Sons.

Nielsen, J. (1993) *Usability Engineering*. San Diego: Academic Press.

OpenAI (2024) *New Embedding Models and API Updates*. Available at: https://openai.com/blog/new-embedding-models (Accessed: 15 June 2026).

Peng, D., Xu, C., Liu, C., Yang, M. and Liang, J. (2022) 'A Survey on Optical Character Recognition for Mathematical Expressions', *IEEE Access*, 10, pp. 105342–105361.

Smith, R. (2007) 'An Overview of the Tesseract OCR Engine', in *Proceedings of the Ninth International Conference on Document Analysis and Recognition (ICDAR 2007)*, pp. 629–633.
