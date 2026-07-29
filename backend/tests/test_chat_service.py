from uuid import uuid4
from unittest.mock import patch

from services.chat_service import ChatService
from services.pinecone_service import pinecone_service


def test_fetch_relevant_chunks_falls_back_to_db_context():
    service = ChatService()
    fallback_chunks = [
        {
            "id": "chunk-1",
            "score": 0.91,
            "metadata": {
                "document_id": str(uuid4()),
                "filename": "lecture_notes.pdf",
                "page_number": 3,
                "text_preview": "The final exam will be held on May 20th.",
            },
        }
    ]

    with patch.object(pinecone_service, "query", return_value=[]):
        with patch.object(service, "_query_db_vector_store", return_value=fallback_chunks):
            chunks = service._fetch_relevant_chunks(
                db=None,
                course_id=uuid4(),
                question_embedding=[0.1, 0.2, 0.3],
                user_message="When is the final exam?",
                top_k=3,
            )

    assert len(chunks) == 1
    assert chunks[0]["metadata"]["filename"] == "lecture_notes.pdf"
