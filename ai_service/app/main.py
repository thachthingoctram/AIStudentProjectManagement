import os
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException

from app.services.document_service import extract_text
from app.services.report_analysis_service import analyze_report
from app.services.ai_service import analyze_with_ai


app = FastAPI(
    title="AI Student Project Management",
    description="AI Service for Student Project Management System",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "success": True,
        "message": "AI Service hoạt động bình thường"
    }


@app.get("/api/health")
def health():
    return {
        "success": True,
        "service": "AI Service",
        "status": "running"
    }


@app.post("/api/ai/analyze-report")
async def analyze_report_api(
    file: UploadFile = File(...)
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="File không hợp lệ"
        )

    extension = os.path.splitext(
        file.filename
    )[1].lower()

    if extension not in [".pdf", ".docx"]:
        raise HTTPException(
            status_code=400,
            detail="Chỉ hỗ trợ file PDF và DOCX"
        )

    temp_path = None

    try:
        # Đọc file
        content = await file.read()

        # Tạo file tạm
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as temp_file:

            temp_file.write(content)
            temp_path = temp_file.name

        # Extract text
        extracted_text = extract_text(
            temp_path
        )

        if not extracted_text:
            raise HTTPException(
                status_code=400,
                detail="Không thể đọc nội dung trong file"
            )

        # Phân tích cơ bản
        basic_analysis = analyze_report(
            extracted_text
        )

        # Phân tích bằng AI
        ai_analysis = analyze_with_ai(
            extracted_text
        )

        return {
            "success": True,
            "message": "Phân tích báo cáo bằng AI thành công",
            "data": {
                "file_name": file.filename,
                "file_type": extension.replace(".", ""),
                "basic_analysis": basic_analysis,
                "ai_analysis": ai_analysis
            }
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Lỗi analyze_report:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=f"Lỗi xử lý file: {str(error)}"
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)