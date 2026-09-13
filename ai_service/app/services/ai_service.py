import json
import requests


OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.2"


AI_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {
            "type": "string"
        },
        "technologies": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "strengths": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "weaknesses": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "missing_sections": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "recommendations": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "ai_suggested_score": {
            "type": "number"
        },
        "confidence": {
            "type": "number"
        }
    },
    "required": [
        "summary",
        "technologies",
        "strengths",
        "weaknesses",
        "missing_sections",
        "recommendations",
        "ai_suggested_score",
        "confidence"
    ]
}


def build_report_prompt(report_text: str) -> str:

    return f"""
Bạn là AI hỗ trợ giảng viên đánh giá báo cáo đồ án sinh viên.

Hãy phân tích báo cáo dưới đây.

Nhiệm vụ:

1. Tóm tắt nội dung báo cáo.
2. Xác định các công nghệ được sử dụng.
3. Đánh giá điểm mạnh.
4. Đánh giá điểm yếu.
5. Xác định các phần quan trọng còn thiếu.
6. Đề xuất cải thiện.
7. Đề xuất điểm từ 0 đến 10.
8. Đánh giá độ tin cậy từ 0 đến 1.

QUY TẮC:

- Chỉ sử dụng thông tin có trong báo cáo.
- Không tự bịa thông tin.
- Nếu không tìm thấy thông tin thì dùng mảng [].
- ai_suggested_score phải từ 0 đến 10.
- confidence phải từ 0 đến 1.
- Trả về đúng các trường được yêu cầu.
- Không thêm trường khác.

BÁO CÁO:

--------------------
{report_text}
--------------------
"""


def normalize_result(result):

    # Nếu AI trả đúng cấu trúc
    if "summary" in result:
        return result

    # Một số trường hợp model đặt kết quả bên trong
    # một object khác.
    for key, value in result.items():

        if isinstance(value, dict):

            if "summary" in value:
                return value

    return result


def validate_ai_result(result):

    required_fields = [
        "summary",
        "technologies",
        "strengths",
        "weaknesses",
        "missing_sections",
        "recommendations",
        "ai_suggested_score",
        "confidence"
    ]

    result = normalize_result(result)

    for field in required_fields:

        if field not in result:
            raise ValueError(
                f"Kết quả AI thiếu trường: {field}"
            )

    score = result["ai_suggested_score"]

    if not isinstance(score, (int, float)):
        raise ValueError(
            "ai_suggested_score phải là số"
        )

    if score < 0 or score > 10:
        raise ValueError(
            "ai_suggested_score phải nằm trong khoảng 0-10"
        )

    confidence = result["confidence"]

    if not isinstance(confidence, (int, float)):
        raise ValueError(
            "confidence phải là số"
        )

    if confidence < 0 or confidence > 1:
        raise ValueError(
            "confidence phải nằm trong khoảng 0-1"
        )

    return result


def extract_json_from_response(response_text):

    response_text = response_text.strip()

    # JSON trực tiếp
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        pass

    # JSON nằm trong ```json
    if "```json" in response_text:

        cleaned = (
            response_text
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

    # Tìm object JSON
    start = response_text.find("{")
    end = response_text.rfind("}")

    if start != -1 and end != -1:

        json_text = response_text[
            start:end + 1
        ]

        try:
            return json.loads(json_text)
        except json.JSONDecodeError:
            pass

    raise ValueError(
        "AI không trả về JSON hợp lệ"
    )


def analyze_with_ai(report_text):

    prompt = build_report_prompt(
        report_text
    )

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,

            # Ép Ollama trả JSON
            "format": AI_SCHEMA,

            "options": {
                "temperature": 0.1
            }
        },

        timeout=300
    )

    response.raise_for_status()

    data = response.json()

    ai_response = data.get(
        "response",
        ""
    ).strip()

    if not ai_response:

        raise ValueError(
            "Ollama không trả về kết quả"
        )

    print("\n===== AI RESPONSE =====")
    print(ai_response)
    print("=======================\n")

    result = extract_json_from_response(
        ai_response
    )

    result = validate_ai_result(
        result
    )

    return result