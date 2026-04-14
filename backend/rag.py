"""
RAG (Retrieval-Augmented Generation) pipeline.

Architecture:
1. Document Chunking — split documents into overlapping chunks by sections
2. TF-IDF Scoring — rank chunks by relevance to query
3. Context Assembly — top-K chunks assembled into context window
4. LLM Generation — AI generates answer using only relevant context + source attribution
"""

import re
import math
from collections import Counter
from dataclasses import dataclass, field
from models import KnowledgeDocument


@dataclass
class Chunk:
    doc_id: str
    doc_title: str
    category: str
    section: str
    content: str
    tokens: list[str] = field(default_factory=list)


class RAGPipeline:
    def __init__(self, documents: list[KnowledgeDocument]):
        self.documents = documents
        self.chunks: list[Chunk] = []
        self.idf: dict[str, float] = {}
        self._build_index()

    def _tokenize(self, text: str) -> list[str]:
        text = text.lower()
        text = re.sub(r'[^\w\sа-яё]', ' ', text)
        return [w for w in text.split() if len(w) > 2]

    def _split_into_chunks(self, doc: KnowledgeDocument) -> list[Chunk]:
        """Split document into chunks by sections/paragraphs."""
        chunks = []
        content = doc.content.strip()

        # Split by double newlines or section headers
        sections = re.split(r'\n\s*\n', content)

        current_section = ""
        current_content = []

        for section in sections:
            stripped = section.strip()
            if not stripped:
                continue

            # Detect section header (line ending with : or short capitalized line)
            lines = stripped.split('\n')
            first_line = lines[0].strip()

            if (first_line.endswith(':') and len(first_line) < 80) or \
               (len(first_line) < 60 and not first_line.startswith('-')):
                # Save previous chunk
                if current_content:
                    chunk_text = '\n'.join(current_content)
                    chunks.append(Chunk(
                        doc_id=doc.id,
                        doc_title=doc.title,
                        category=doc.category,
                        section=current_section or doc.title,
                        content=chunk_text,
                    ))
                current_section = first_line.rstrip(':')
                current_content = [stripped]
            else:
                current_content.append(stripped)

        # Last chunk
        if current_content:
            chunk_text = '\n'.join(current_content)
            chunks.append(Chunk(
                doc_id=doc.id,
                doc_title=doc.title,
                category=doc.category,
                section=current_section or doc.title,
                content=chunk_text,
            ))

        # Fallback: if no chunks, use whole document
        if not chunks:
            chunks.append(Chunk(
                doc_id=doc.id,
                doc_title=doc.title,
                category=doc.category,
                section=doc.title,
                content=content,
            ))

        return chunks

    def _build_index(self):
        """Build TF-IDF index over all chunks."""
        self.chunks = []
        for doc in self.documents:
            doc_chunks = self._split_into_chunks(doc)
            for chunk in doc_chunks:
                chunk.tokens = self._tokenize(chunk.content + ' ' + chunk.section + ' ' + chunk.doc_title)
                self.chunks.append(chunk)

        # Compute IDF
        n = len(self.chunks)
        df: dict[str, int] = Counter()
        for chunk in self.chunks:
            unique_tokens = set(chunk.tokens)
            for token in unique_tokens:
                df[token] += 1

        self.idf = {
            token: math.log((n + 1) / (count + 1)) + 1
            for token, count in df.items()
        }

    def _score_chunk(self, chunk: Chunk, query_tokens: list[str]) -> float:
        """TF-IDF cosine-like scoring."""
        if not chunk.tokens or not query_tokens:
            return 0.0

        chunk_tf = Counter(chunk.tokens)
        query_tf = Counter(query_tokens)

        score = 0.0
        for token in query_tokens:
            if token in chunk_tf:
                tf_chunk = chunk_tf[token] / len(chunk.tokens)
                tf_query = query_tf[token] / len(query_tokens)
                idf = self.idf.get(token, 1.0)
                score += tf_chunk * tf_query * idf * idf

        # Boost for exact phrase match
        query_str = ' '.join(query_tokens)
        chunk_str = ' '.join(chunk.tokens)
        if query_str in chunk_str:
            score *= 2.0

        return score

    def retrieve(self, query: str, top_k: int = 5, min_score: float = 0.001) -> list[Chunk]:
        """Retrieve top-K relevant chunks for a query."""
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        scored = []
        for chunk in self.chunks:
            score = self._score_chunk(chunk, query_tokens)
            if score >= min_score:
                scored.append((score, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [chunk for _, chunk in scored[:top_k]]

    def build_context(self, query: str, top_k: int = 5) -> str:
        """Build RAG context string from retrieved chunks."""
        chunks = self.retrieve(query, top_k=top_k)

        if not chunks:
            return "Релевантных документов не найдено."

        parts = []
        seen_docs = set()
        for chunk in chunks:
            header = f"[DOC_ID={chunk.doc_id}] {chunk.doc_title} — {chunk.section}"
            parts.append(f"### {header}\n{chunk.content}")
            seen_docs.add(chunk.doc_id)

        context = "\n\n---\n\n".join(parts)
        return f"Найдено {len(chunks)} релевантных фрагментов из {len(seen_docs)} документов:\n\n{context}"

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        """Search and return structured results for the knowledge API."""
        chunks = self.retrieve(query, top_k=top_k)

        results = []
        seen_docs = set()
        for chunk in chunks:
            if chunk.doc_id in seen_docs:
                continue
            seen_docs.add(chunk.doc_id)
            results.append({
                "id": chunk.doc_id,
                "title": chunk.doc_title,
                "category": chunk.category,
                "snippet": chunk.content[:300],
                "source": f"{chunk.doc_title} — {chunk.section}",
            })

        return results

    @property
    def stats(self) -> dict:
        return {
            "documents": len(self.documents),
            "chunks": len(self.chunks),
            "vocabulary_size": len(self.idf),
        }
