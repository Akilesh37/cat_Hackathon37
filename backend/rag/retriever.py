"""
RAG Retriever:
Performs keyword & semantic retrieval over CAT manual chunks.
"""
from typing import List, Dict, Any
from rag.ingest import load_or_init_chunks

def retrieve_manual_chunks(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """
    Ranks chunks based on semantic term overlap and topic matching.
    """
    chunks = load_or_init_chunks()
    query_lower = query.lower()
    query_terms = set(query_lower.replace("?", "").replace(",", "").replace(".", "").split())

    scored_chunks = []
    for chunk in chunks:
        score = 0.0
        content_lower = chunk["content"].lower()
        section_lower = chunk["section"].lower()
        keywords = [k.lower() for k in chunk.get("keywords", [])]

        # Check keyword matches
        for kw in keywords:
            if kw in query_lower:
                score += 3.0

        # Check section matches
        for term in query_terms:
            if term in section_lower:
                score += 2.0
            if term in content_lower:
                score += 1.0

        if score > 0:
            scored_chunks.append({
                "doc_name": chunk["doc_name"],
                "section": chunk["section"],
                "content": chunk["content"],
                "score": round(score, 2)
            })

    # Sort descending by relevance score
    scored_chunks.sort(key=lambda x: x["score"], reverse=True)

    if not scored_chunks:
        # Fallback to general safety and hydraulic chunks
        return [
            {
                "doc_name": chunks[2]["doc_name"],
                "section": chunks[2]["section"],
                "content": chunks[2]["content"],
                "score": 1.0
            },
            {
                "doc_name": chunks[0]["doc_name"],
                "section": chunks[0]["section"],
                "content": chunks[0]["content"],
                "score": 0.8
            }
        ][:top_k]

    return scored_chunks[:top_k]
