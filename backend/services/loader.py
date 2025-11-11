"""services/loader.py
=====================
Responsible for turning raw user-uploaded files into plain text. By isolating
file reading logic, we make the ingestion pipeline easier to test and extend.
"""

from __future__ import annotations

from dataclasses import dataclass
from html import escape
from pathlib import Path
from typing import Dict, List, Literal

import shutil
import subprocess
import tempfile

import docx2txt
import mammoth
import textract
from loguru import logger
from pypdf import PdfReader

from .utils import normalize_text


@dataclass
class Document:
    """Simple container for extracted text and helpful metadata."""

    text: str
    metadata: Dict[str, str]
    page_texts: List[str] | None = None


@dataclass
class PreviewContent:
    """Represents lightweight preview data for the frontend."""

    kind: Literal["html", "pdf", "text"]
    html: str | None = None


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
        return _load_docx(file_path, original_name=file_path.name, original_type="docx")
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


def _load_docx(file_path: Path, original_name: str, original_type: str) -> Document:
    raw_text = docx2txt.process(str(file_path)) or ""
    normalized = normalize_text(raw_text)
    return Document(text=normalized, metadata={"file": original_name, "type": original_type})


def _load_doc(file_path: Path) -> Document:
    try:
        logger.info("Attempting textract ingestion for %s", file_path)
        raw_bytes = textract.process(str(file_path))
        text = raw_bytes.decode("utf-8", errors="ignore")
        normalized = normalize_text(text)
        return Document(text=normalized, metadata={"file": file_path.name, "type": "doc"})
    except Exception as exc:  # pragma: no cover - textract failure path is environment dependent
        logger.warning("Textract failed for %s, falling back to LibreOffice conversion: %s", file_path, exc)

    with tempfile.TemporaryDirectory() as tmp_dir:
        try:
            converted = _convert_doc_to_docx(file_path, Path(tmp_dir))
        except RuntimeError as exc:
            raise ValueError(str(exc)) from exc
        return _load_docx(converted, original_name=file_path.name, original_type="doc")


def _load_txt(file_path: Path) -> Document:
    raw_text = file_path.read_text(encoding="utf-8", errors="ignore")
    normalized = normalize_text(raw_text)
    return Document(
        text=normalized,
        metadata={"file": file_path.name, "type": "txt"},
    )


def generate_preview(file_path: Path) -> PreviewContent:
    suffix = file_path.suffix.lower()
    if suffix == ".pdf":
        return PreviewContent(kind="pdf")
    if suffix == ".docx":
        html = _docx_to_html(file_path)
        return PreviewContent(kind="html", html=html)
    if suffix == ".doc":
        html = _doc_to_html(file_path)
        return PreviewContent(kind="html", html=html)
    if suffix == ".txt":
        html = _txt_to_html(file_path)
        return PreviewContent(kind="text", html=html)

    raise ValueError(f"Preview not supported for file type: {suffix}")


def _doc_to_html(file_path: Path) -> str:
    with tempfile.TemporaryDirectory() as tmp_dir:
        try:
            converted = _convert_doc_to_docx(file_path, Path(tmp_dir))
        except RuntimeError as exc:
            raise ValueError(str(exc)) from exc
        return _docx_to_html(converted)


def _docx_to_html(file_path: Path) -> str:
    with file_path.open("rb") as docx_file:
        result = mammoth.convert_to_html(docx_file)
    html_body = result.value or ""
    return _wrap_html(html_body)


def _txt_to_html(file_path: Path) -> str:
    raw_text = file_path.read_text(encoding="utf-8", errors="ignore")
    return _wrap_html(f"<pre>{escape(raw_text)}</pre>")


def _wrap_html(body: str) -> str:
    return "<!doctype html><html><head><meta charset=\"utf-8\"></head><body>" + body + "</body></html>"


def _convert_doc_to_docx(file_path: Path, output_dir: Path) -> Path:
    soffice_path = shutil.which("soffice")
    if not soffice_path:
        raise RuntimeError(
            "LibreOffice (soffice) is required to process .doc files. Install it or ensure it's on PATH."
        )

    output_dir.mkdir(parents=True, exist_ok=True)
    command = [
        soffice_path,
        "--headless",
        "--convert-to",
        "docx",
        "--outdir",
        str(output_dir),
        str(file_path),
    ]
    logger.info("Converting .doc to .docx via LibreOffice: %s", " ".join(command))
    result = subprocess.run(command, capture_output=True, check=False)
    if result.returncode != 0:
        stderr = result.stderr.decode("utf-8", errors="ignore")
        raise RuntimeError(f"LibreOffice conversion failed: {stderr.strip()}")

    converted_path = output_dir / f"{file_path.stem}.docx"
    if not converted_path.exists():  # pragma: no cover - depends on external binary behaviour
        raise RuntimeError("LibreOffice conversion did not produce an output file")

    return converted_path
