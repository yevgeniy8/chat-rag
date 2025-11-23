"""services/preview.py
======================
Provide lightweight HTML previews for documents. Currently focuses on DOCX files
using Mammoth so the frontend can render a quick look without exposing binary
content.
"""

from __future__ import annotations

from pathlib import Path

import mammoth


def docx_to_html(path: Path) -> str:
    """Convert a DOCX file to raw HTML for inline previewing."""

    if not path.exists():
        raise FileNotFoundError(path)

    with path.open("rb") as docx_file:
        html = mammoth.convert_to_html(docx_file).value or ""
    return html
