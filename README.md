# chat-rag

Internal research tool for comparing retrieval-augmented generation (RAG) answers with baseline LLM responses. The project ships with a FastAPI backend and a Create React App frontend so experiments can be run locally or deployed to a controlled lab environment.

## Getting started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

The backend loads a SentenceTransformers model on demand. To silence tokenizer warnings we set `TOKENIZERS_PARALLELISM=false` at process start.

### Frontend

```bash
cd frontend
npm install
npm start
```

Create React App proxies requests to `http://localhost:8000` by default. Adjust `REACT_APP_API_BASE_URL` if the backend runs elsewhere.

## Document ingestion and previews

Supported upload formats:

| Extension | Notes |
|-----------|-------|
| `.pdf`    | Parsed with `pypdf`; previews streamed through the raw endpoint. |
| `.docx`   | Parsed with `docx2txt`; previews rendered with `mammoth` to HTML. |
| `.doc`    | Parsed via `textract` when possible, with an optional LibreOffice (`soffice`) fallback that converts legacy Word files to `.docx` before processing. |
| `.txt`    | Read as UTF-8 and wrapped in `<pre>` for previews. |

> **LibreOffice requirement:** Install LibreOffice locally and ensure the `soffice` binary is on `PATH` if you plan to ingest legacy `.doc` files. Without it the backend will reject `.doc` uploads with a clear error.

The backend exposes two relevant endpoints:

- `POST /files/upload` followed by `POST /ingest` to persist and embed files.
- `GET /files/preview/{file_id}` returns lightweight metadata for previews. PDFs provide a `preview_url` that points to `/files/raw/{file_id}`; Word and text documents return HTML that the frontend renders inside an iframe.

## Chat comparison metrics

`POST /chat` accepts the usual `{ message, use_rag, top_k }` payload. Supplying `compare: true` triggers both the baseline and RAG pipelines. The response embeds per-mode metrics:

```json
{
  "baseline": {
    "message": "…",
    "metrics": {
      "latency_ms": 123,
      "semantic_similarity": 0.87
    }
  },
  "rag": {
    "message": "…",
    "retrieved_context": [
      { "file": "paper.pdf", "snippet": "…", "score": 0.42 }
    ],
    "metrics": {
      "latency_ms": 256,
      "semantic_similarity": 0.91
    }
  }
}
```

Latency is measured independently per branch. Semantic similarity compares each answer to the same retrieved context embedding so scores are comparable.

