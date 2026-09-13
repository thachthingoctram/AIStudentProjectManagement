import fitz
from docx import Document


ALLOWED_EXTENSIONS = {".pdf", ".docx"}


def extract_pdf_text(file_path: str) -> str:
    """
    Đọc toàn bộ nội dung text từ file PDF.
    """

    document = fitz.open(file_path)

    pages = []

    for page in document:
        text = page.get_text()

        if text:
            pages.append(text)

    document.close()

    return "\n".join(pages).strip()


def extract_docx_text(file_path: str) -> str:
    """
    Đọc nội dung text từ file DOCX.
    """

    document = Document(file_path)

    paragraphs = []

    for paragraph in document.paragraphs:
        text = paragraph.text.strip()

        if text:
            paragraphs.append(text)

    return "\n".join(paragraphs).strip()


def extract_text(file_path: str) -> str:
    """
    Tự động xác định loại file và trích xuất nội dung.
    """

    extension = file_path.lower()

    if extension.endswith(".pdf"):
        return extract_pdf_text(file_path)

    if extension.endswith(".docx"):
        return extract_docx_text(file_path)

    raise ValueError(
        "Chỉ hỗ trợ file PDF và DOCX"
    )