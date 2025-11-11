"""services/loader.py
=====================
Responsible for turning raw user-uploaded files into plain text. By isolating
file reading logic, we make the ingestion pipeline easier to test and extend.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import subprocess
from typing import Dict, List

import docx2txt
from loguru import logger
from pypdf import PdfReader

from .utils import normalize_text

try:  # Optional dependency used for legacy ``.doc`` extraction.
    import textract  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    textract = None


@dataclass
class Document:
    """Simple container for extracted text and helpful metadata."""

    text: str
    metadata: Dict[str, str]
    page_texts: List[str] | None = None


def load_document(file_path: Path) -> Document:
    """Load a document and return its text content with metadata.

    Parameters
    ----------
    file_path:
        Where the uploaded file lives on disk.

    Returns
    -------
    Document
        The extracted plain text and metadata such as file name and page info.
    """

    suffix = file_path.suffix.lower()
    logger.info("Loading document from %s", file_path)

    if suffix == ".pdf":
        return _load_pdf(file_path)
    if suffix == ".docx":
        return _load_docx(file_path)
    if suffix == ".doc":
        return _load_doc(file_path)
    if suffix == ".txt":
        return _load_txt(file_path)

    raise ValueError(f"Unsupported file type: {suffix}")


def _load_pdf(file_path: Path) -> Document:
    reader = PdfReader(str(file_path))
    page_texts: List[str] = []
    for page in reader.pages:
        extracted = page.extract_text() or ""
        page_texts.append(normalize_text(extracted))
    combined = "\n".join(page_texts)
    return Document(
        text=combined,
        metadata={"file": file_path.name, "type": "pdf"},
        page_texts=page_texts,
    )


def _load_docx(file_path: Path) -> Document:
    try:
        raw_text = docx2txt.process(str(file_path)) or ""
    except Exception as exc:  # pragma: no cover - library errors are rare
        logger.error("Unable to read DOCX file %s: %s", file_path, exc)
        raise ValueError("File is not readable or format not supported") from exc

    normalized = normalize_text(raw_text)
    return Document(
        text=normalized,
        metadata={"file": file_path.name, "type": "docx"},
    )


def _load_doc(file_path: Path) -> Document:
    """Extract text from legacy ``.doc`` files using available tooling."""

    extraction_errors: List[str] = []

    if textract is not None:
        try:
            raw_bytes = textract.process(str(file_path))  # type: ignore[attr-defined]
            raw_text = raw_bytes.decode("utf-8", errors="ignore")
            normalized = normalize_text(raw_text)
            return Document(
                text=normalized,
                metadata={"file": file_path.name, "type": "doc"},
            )
        except Exception as exc:  # pragma: no cover - depends on external binary
            logger.warning("textract failed to parse DOC file %s: %s", file_path, exc)
            extraction_errors.append(f"textract: {exc}")

    try:
        result = subprocess.run(
            ["antiword", str(file_path)],
            check=True,
            capture_output=True,
        )
        raw_text = result.stdout.decode("utf-8", errors="ignore")
        normalized = normalize_text(raw_text)
        return Document(
            text=normalized,
            metadata={"file": file_path.name, "type": "doc"},
        )
    except FileNotFoundError:
        extraction_errors.append("antiword executable not found")
    except subprocess.CalledProcessError as exc:  # pragma: no cover - depends on binary
        logger.warning("antiword failed to parse DOC file %s: %s", file_path, exc)
        extraction_errors.append(f"antiword: {exc}")

    logger.error(
        "Unable to extract DOC file %s. Errors: %s", file_path, "; ".join(extraction_errors)
    )
    raise ValueError("File is not readable or format not supported")


def _load_txt(file_path: Path) -> Document:
    raw_text = file_path.read_text(encoding="utf-8", errors="ignore")
    normalized = normalize_text(raw_text)
    return Document(
        text=normalized,
        metadata={"file": file_path.name, "type": "txt"},
    )
