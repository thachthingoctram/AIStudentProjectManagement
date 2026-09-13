import re


def analyze_report(text: str):
    """
    Phân tích cơ bản nội dung báo cáo.
    Chưa sử dụng AI/LLM.
    """

    text = text.strip()

    # Đếm số từ
    word_count = len(text.split())

    # Đếm số ký tự
    character_count = len(text)

    # Tìm các tiêu đề/chương
    sections = []

    lines = text.splitlines()

    for line in lines:
        line = line.strip()

        if not line:
            continue

        # Các dạng:
        # 1. GIỚI THIỆU
        # 1.1 Tổng quan
        # CHƯƠNG 1
        # Chương 1: Giới thiệu
        if re.match(
            r"^(CHƯƠNG|Chương)\s+\d+",
            line
        ):
            sections.append(line)

        elif re.match(
            r"^\d+(\.\d+)*[\.\s]+.+",
            line
        ):
            sections.append(line)

    # Nội dung chuyển thành chữ thường
    lower_text = text.lower()

    # Kiểm tra các phần quan trọng
    has_introduction = any(
        keyword in lower_text
        for keyword in [
            "giới thiệu",
            "mở đầu",
            "introduction"
        ]
    )

    has_objectives = any(
        keyword in lower_text
        for keyword in [
            "mục tiêu",
            "mục đích",
            "objectives"
        ]
    )

    has_technology = any(
        keyword in lower_text
        for keyword in [
            "công nghệ",
            "technology",
            "công cụ",
            "framework"
        ]
    )

    has_conclusion = any(
        keyword in lower_text
        for keyword in [
            "kết luận",
            "conclusion"
        ]
    )

    has_references = any(
        keyword in lower_text
        for keyword in [
            "tài liệu tham khảo",
            "references"
        ]
    )

    # Xác định phần còn thiếu
    missing_sections = []

    if not has_introduction:
        missing_sections.append("Giới thiệu")

    if not has_objectives:
        missing_sections.append("Mục tiêu")

    if not has_technology:
        missing_sections.append("Công nghệ sử dụng")

    if not has_conclusion:
        missing_sections.append("Kết luận")

    if not has_references:
        missing_sections.append("Tài liệu tham khảo")

    return {
        "word_count": word_count,
        "character_count": character_count,
        "sections": sections,
        "structure": {
            "has_introduction": has_introduction,
            "has_objectives": has_objectives,
            "has_technology": has_technology,
            "has_conclusion": has_conclusion,
            "has_references": has_references
        },
        "missing_sections": missing_sections
    }