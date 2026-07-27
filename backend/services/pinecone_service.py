from typing import List, Dict, Any, Optional
from pinecone import Pinecone
from config import get_settings

settings = get_settings()


class PineconeService:
    def __init__(self):
        self._index = None

    @property
    def index(self):
        if self._index is None:
            if settings.pinecone_api_key and not settings.pinecone_api_key.startswith("placeholder"):
                pc = Pinecone(api_key=settings.pinecone_api_key)
                self._index = pc.Index(settings.pinecone_index_name)
        return self._index

    def query(
        self,
        embedding: List[float],
        namespace: str,
        top_k: int = 5,
        similarity_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Query Pinecone index for top_k matches above similarity threshold."""
        if not self.index:
            return []

        try:
            res = self.index.query(
                vector=embedding,
                namespace=namespace,
                top_k=top_k,
                include_metadata=True
            )
            matches = []
            for match in res.matches:
                score = getattr(match, "score", 0.0)
                if score >= similarity_threshold:
                    matches.append({
                        "id": match.id,
                        "score": score,
                        "metadata": getattr(match, "metadata", {})
                    })
            return matches
        except Exception:
            return []

    def delete_by_document(self, namespace: str, document_id: str) -> bool:
        """Delete all vectors for a given document from Pinecone."""
        if not self.index:
            return True

        try:
            self.index.delete(
                filter={"document_id": document_id},
                namespace=namespace
            )
            return True
        except Exception:
            return False

    def get_stats(self) -> Dict[str, Any]:
        """Return Pinecone index statistics for health checks."""
        if not self.index:
            return {"status": "unconfigured", "total_vector_count": 0}

        try:
            stats = self.index.describe_index_stats()
            return {
                "status": "connected",
                "total_vector_count": getattr(stats, "total_vector_count", 0),
                "namespaces": getattr(stats, "namespaces", {})
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}


pinecone_service = PineconeService()
