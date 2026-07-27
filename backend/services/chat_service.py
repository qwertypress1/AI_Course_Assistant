import json
import time
from typing import List, Dict, Any, Optional, AsyncGenerator
from uuid import UUID
from sqlalchemy.orm import Session
from openai import OpenAI

from config import get_settings
from models import ChatSession, ChatMessage, UsageLog
from services.pinecone_service import pinecone_service

settings = get_settings()

SYSTEM_PROMPT = """You are the AI Course Assistant, a helpful academic tutor for university students.

Your primary rule: You MUST answer user questions using ONLY the provided course document context below.

STRICT RULES:
1. Grounding: Answer strictly using facts directly mentioned in the Context. Do not make up information or use outside knowledge not supported by the context.
2. Citations: At the end of key statements or paragraphs, cite the exact source document and page number in format: [Document: <filename>, Page: <page_number>].
3. Refusal: If the provided Context does NOT contain enough information to answer the question, state explicitly:
   "I don't have relevant information in your uploaded documents to answer this question. Please upload documents covering this topic or rephrase your question."
4. Tone: Academic, clear, objective, and encouraging.
"""


class ChatService:
    def __init__(self):
        self._openai_client = None

    @property
    def openai_client(self) -> Optional[OpenAI]:
        if self._openai_client is None:
            if settings.openai_api_key and not settings.openai_api_key.startswith("sk-placeholder"):
                self._openai_client = OpenAI(api_key=settings.openai_api_key)
        return self._openai_client

    def create_session(self, db: Session, user_id: UUID, course_id: UUID, title: str = "New Chat") -> ChatSession:
        session = ChatSession(
            user_id=user_id,
            course_id=course_id,
            title=title,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def list_sessions(self, db: Session, user_id: UUID, course_id: Optional[UUID] = None) -> List[ChatSession]:
        query = db.query(ChatSession).filter(ChatSession.user_id == user_id)
        if course_id:
            query = query.filter(ChatSession.course_id == course_id)
        return query.order_by(ChatSession.updated_at.desc()).all()

    def get_session(self, db: Session, session_id: UUID) -> Optional[ChatSession]:
        return db.query(ChatSession).filter(ChatSession.id == session_id).first()

    def get_messages(self, db: Session, session_id: UUID, limit: int = 50) -> List[ChatMessage]:
        return (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
            .limit(limit)
            .all()
        )

    def delete_session(self, db: Session, session_id: UUID) -> bool:
        session = self.get_session(db, session_id)
        if session:
            db.delete(session)
            db.commit()
            return True
        return False

    def embed_question(self, question: str) -> List[float]:
        if not self.openai_client:
            return [0.0] * 1536
        try:
            res = self.openai_client.embeddings.create(
                model=settings.openai_embedding_model,
                input=question
            )
            return res.data[0].embedding
        except Exception:
            return [0.0] * 1536

    async def generate_rag_response(
        self,
        db: Session,
        session: ChatSession,
        user_message: str
    ) -> AsyncGenerator[str, None]:
        start_time = time.time()

        # Step 1: Save User Message
        user_msg_rec = ChatMessage(
            session_id=session.id,
            role="user",
            content=user_message
        )
        db.add(user_msg_rec)
        db.commit()

        # Step 2: Retrieve Recent Chat History
        history = self.get_messages(db, session.id, limit=10)

        # Step 3: Embed Question & Query Pinecone
        question_embedding = self.embed_question(user_message)
        chunks = pinecone_service.query(
            embedding=question_embedding,
            namespace=str(session.course_id),
            top_k=5,
            similarity_threshold=0.7
        )

        sources = []
        for chunk in chunks:
            meta = chunk.get("metadata", {})
            sources.append({
                "document_id": meta.get("document_id"),
                "filename": meta.get("filename", "Course Document"),
                "page_number": meta.get("page_number", 1),
                "chunk_id": chunk.get("id")
            })

        # Yield Initial Event
        yield f'data: {json.dumps({"type": "start", "session_id": str(session.id)})}\n\n'

        # Step 4: If no OpenAI client or no relevant context found, yield fallback
        if not self.openai_client or not chunks:
            fallback = (
                "I don't have relevant information in your uploaded documents "
                "to answer this question. Please try rephrasing your question "
                "or upload course documents covering this topic."
            )
            assistant_msg = ChatMessage(
                session_id=session.id,
                role="assistant",
                content=fallback,
                sources=[],
                tokens_used=0,
                model_used="fallback"
            )
            db.add(assistant_msg)
            db.commit()

            yield f'data: {json.dumps({"type": "chunk", "content": fallback})}\n\n'
            yield f'data: {json.dumps({"type": "sources", "sources": []})}\n\n'
            yield f'data: {json.dumps({"type": "done", "message_id": str(assistant_msg.id)})}\n\n'
            return

        # Step 5: Assemble Context Prompt
        context_str = ""
        for i, chunk in enumerate(chunks, 1):
            meta = chunk.get("metadata", {})
            fname = meta.get("filename", "Doc")
            page = meta.get("page_number", 1)
            preview = meta.get("text_preview", "")
            context_str += f"\n--- [Source {i}: {fname}, Page {page}] ---\n{preview}\n"

        messages_for_llm = [{"role": "system", "content": f"{SYSTEM_PROMPT}\n\nCONTEXT:\n{context_str}"}]
        for h in history[:-1]:  # exclude the user message just added
            messages_for_llm.append({"role": h.role, "content": h.content})
        messages_for_llm.append({"role": "user", "content": user_message})

        # Step 6: Stream Response from OpenAI
        full_content = ""
        try:
            stream = self.openai_client.chat.completions.create(
                model=settings.openai_chat_model,
                messages=messages_for_llm,
                temperature=0.1,
                top_p=0.9,
                max_tokens=2048,
                stream=True
            )

            for chunk_res in stream:
                if chunk_res.choices and chunk_res.choices[0].delta.content:
                    delta = chunk_res.choices[0].delta.content
                    full_content += delta
                    yield f'data: {json.dumps({"type": "chunk", "content": delta})}\n\n'

        except Exception as e:
            full_content = f"An error occurred while generating answer: {str(e)}"
            yield f'data: {json.dumps({"type": "chunk", "content": full_content})}\n\n'

        # Save assistant message to DB
        assistant_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=full_content,
            sources=sources,
            tokens_used=len(full_content) // 4,
            model_used=settings.openai_chat_model
        )
        db.add(assistant_msg)
        db.commit()

        # Log Usage
        latency = int((time.time() - start_time) * 1000)
        log = UsageLog(
            user_id=session.user_id,
            action="rag_chat_completion",
            resource_type="chat_session",
            resource_id=session.id,
            tokens_input=len(str(messages_for_llm)) // 4,
            tokens_output=len(full_content) // 4,
            model_used=settings.openai_chat_model,
            latency_ms=latency
        )
        db.add(log)
        db.commit()

        yield f'data: {json.dumps({"type": "sources", "sources": sources})}\n\n'
        yield f'data: {json.dumps({"type": "done", "message_id": str(assistant_msg.id)})}\n\n'


chat_service = ChatService()
