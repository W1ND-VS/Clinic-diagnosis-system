from flask import Blueprint, request, jsonify
from app.Services.ChanDoan_service import ChanDoanService
from app.Services.Benh_service import BenhService
from app.extensions import db
from app.utils.response_utils import success_response, error_response
from datetime import datetime

# Khởi tạo Blueprint và service
chandoan_bp = Blueprint("chandoan", __name__, url_prefix="/api/chandoan")
chandoan_service = ChanDoanService(db.session)
benh_service = BenhService(db.session)


@chandoan_bp.route("", methods=["POST"])
def create_diagnosis():
    """Tạo chẩn đoán mới"""
    try:
        data = request.get_json()

        if not data:
            return error_response("Thiếu dữ liệu", 400)

        # Validate required fields
        required_fields = ["tt_matthuoc", "b_ma"]
        for field in required_fields:
            if field not in data:
                return error_response(f"Thiếu trường bắt buộc: {field}", 400)

        tt_matthuoc = data["tt_matthuoc"]
        b_ma = data["b_ma"]

        # Kiểm tra xem chẩn đoán đã tồn tại chưa
        existing_diagnosis = chandoan_service.get_chan_doan(tt_matthuoc, b_ma)
        if existing_diagnosis:
            return error_response("Chẩn đoán đã tồn tại", 409)

        # Tạo chẩn đoán mới
        diagnosis = chandoan_service.create_chan_doan(tt_matthuoc, b_ma)

        if diagnosis:
            return success_response(
                {"tt_matthuoc": diagnosis.tt_matthuoc, "b_ma": diagnosis.b_ma},
                "Tạo chẩn đoán thành công",
                201,
            )
        else:
            return error_response("Không thể tạo chẩn đoán", 500)

    except Exception as e:
        return error_response(str(e), 500)


@chandoan_bp.route("/toathuoc/<string:tt_matthuoc>", methods=["GET"])
def get_diagnosis_by_prescription(tt_matthuoc):
    """Lấy chẩn đoán theo mã toa thuốc"""
    try:
        Diseases = chandoan_service.get_chan_doan_by_prescription(tt_matthuoc)

        if not Diseases:
            return error_response(
                f"Không tìm thấy chẩn đoán với toa thuốc {tt_matthuoc}",
                404,
            )

        return success_response(
            {"Benh": [d.b_ma for d in Diseases]},
            f"Lấy chẩn đoán cho toa thuốc {tt_matthuoc} thành công",
        )

    except Exception as e:
        return error_response(str(e), 500)


@chandoan_bp.route("/<string:tt_matthuoc>/<string:b_ma>", methods=["GET"])
def get_diagnosis(tt_matthuoc, b_ma):
    """Lấy chẩn đoán theo mã toa thuốc và mã bệnh"""
    try:
        diagnosis = chandoan_service.get_chan_doan(tt_matthuoc, b_ma)

        if not diagnosis:
            return error_response(
                f"Không tìm thấy chẩn đoán với toa thuốc {tt_matthuoc} và bệnh {b_ma}",
                404,
            )

        return success_response(
            {"tt_matthuoc": diagnosis.tt_matthuoc, "b_ma": diagnosis.b_ma}
        )

    except Exception as e:
        return error_response(str(e), 500)


@chandoan_bp.route("/<string:tt_matthuoc>/<string:b_ma>", methods=["DELETE"])
def delete_diagnosis(tt_matthuoc, b_ma):
    """Xóa chẩn đoán"""
    try:
        # Kiểm tra xem chẩn đoán có tồn tại không
        diagnosis = chandoan_service.get_chan_doan(tt_matthuoc, b_ma)
        if not diagnosis:
            return error_response(
                f"Không tìm thấy chẩn đoán với toa thuốc {tt_matthuoc} và bệnh {b_ma}",
                404,
            )

        # Xóa chẩn đoán
        chandoan_service.delete_chan_doan(tt_matthuoc, b_ma)

        return success_response({"deleted": True}, "Xóa chẩn đoán thành công")

    except Exception as e:
        return error_response(str(e), 500)


@chandoan_bp.route("/toa-thuoc/<string:tt_matthuoc>", methods=["GET"])
def get_diseases_by_prescription(tt_matthuoc):
    """Lấy danh sách bệnh đầy đủ theo mã toa thuốc"""
    try:
        diseases = chandoan_service.get_chan_doan_by_prescription(tt_matthuoc)

        if not diseases:
            return error_response(
                f"Không tìm thấy bệnh nào với toa thuốc {tt_matthuoc}", 404
            )

        result = []
        for disease in diseases:
            if hasattr(disease, "to_dict"):
                disease_info = disease.to_dict()
            else:
                disease_info = {
                    "b_ma": getattr(disease, "b_ma", None),
                    "b_ten": getattr(disease, "b_ten", None),
                    "b_mota": getattr(disease, "b_mota", None),
                }

        result.append(disease_info)

        return success_response(
            {
                "tt_matthuoc": tt_matthuoc,
                "total_diseases": len(result),
                "diseases": result,
            }
        )

    except Exception as e:
        print(f"Lỗi trong get_diseases_by_prescription: {str(e)}")
        return error_response(str(e), 500)


@chandoan_bp.route("/toa-thuoc/<string:tt_matthuoc>/summary", methods=["GET"])
def get_diseases_summary_by_prescription(tt_matthuoc):
    """Lấy tóm tắt bệnh theo mã toa thuốc"""
    try:
        diseases = chandoan_service.get_chan_doan_by_prescription(tt_matthuoc)

        if not diseases:
            return error_response(
                f"Không tìm thấy bệnh nào với toa thuốc {tt_matthuoc}", 404
            )

        # Tạo summary với xử lý an toàn
        disease_names = []
        disease_codes = []

        for disease in diseases:
            if isinstance(disease, dict):
                disease_names.append(disease.get("b_ten", "Unknown"))
                disease_codes.append(disease.get("b_ma", "Unknown"))
            else:
                disease_names.append(getattr(disease, "b_ten", "Unknown"))
                disease_codes.append(getattr(disease, "b_ma", "Unknown"))

        return success_response(
            {
                "tt_matthuoc": tt_matthuoc,
                "total_diseases": len(diseases),
                "disease_codes": disease_codes,
                "disease_names": disease_names,
                "summary": ", ".join(disease_names),
            }
        )

    except Exception as e:
        print(f"Lỗi trong get_diseases_summary_by_prescription: {str(e)}")
        return error_response(str(e), 500)


@chandoan_bp.route("/toa-thuoc/<string:tt_matthuoc>/details", methods=["GET"])
def get_diseases_details_by_prescription(tt_matthuoc):
    """Lấy chi tiết đầy đủ bệnh theo mã toa thuốc"""
    try:
        diseases = chandoan_service.get_chan_doan_by_prescription(tt_matthuoc)

        if not diseases:
            return error_response(
                f"Không tìm thấy bệnh nào với toa thuốc {tt_matthuoc}", 404
            )

        # Tạo chi tiết đầy đủ
        detailed_diseases = []

        for disease in diseases:
            if isinstance(disease, dict):
                disease_detail = {
                    "b_ma": disease.get("b_ma"),
                    "b_ten": disease.get("b_ten"),
                    "b_mota": disease.get("b_mota"),
                    "created_at": disease.get("created_at"),
                    "updated_at": disease.get("updated_at"),
                }
            else:
                if hasattr(disease, "to_dict"):
                    disease_detail = disease.to_dict()
                else:
                    disease_detail = {
                        "b_ma": getattr(disease, "b_ma", None),
                        "b_ten": getattr(disease, "b_ten", None),
                        "b_mota": getattr(disease, "b_mota", None),
                        "created_at": getattr(disease, "created_at", None),
                        "updated_at": getattr(disease, "updated_at", None),
                    }

                    # Chuyển đổi datetime thành string nếu cần
                    if disease_detail.get("created_at"):
                        disease_detail["created_at"] = str(disease_detail["created_at"])
                    if disease_detail.get("updated_at"):
                        disease_detail["updated_at"] = str(disease_detail["updated_at"])

            detailed_diseases.append(disease_detail)

        return success_response(
            {
                "tt_matthuoc": tt_matthuoc,
                "total_diseases": len(detailed_diseases),
                "diseases": detailed_diseases,
                "metadata": {
                    "retrieved_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "source": "ChanDoan_service",
                },
            }
        )

    except Exception as e:
        print(f"Lỗi trong get_diseases_details_by_prescription: {str(e)}")
        return error_response(str(e), 500)


@chandoan_bp.route("/test/<string:tt_matthuoc>", methods=["GET"])
def test_prescription(tt_matthuoc):
    """Test endpoint với toa thuốc TT2506260002"""
    try:
        diseases = chandoan_service.get_chan_doan_by_prescription(tt_matthuoc)

        # Debug thông tin
        debug_info = []
        processed_diseases = []

        for i, disease in enumerate(diseases):
            debug_info.append(
                {
                    "index": i,
                    "type": str(type(disease)),
                    "is_dict": isinstance(disease, dict),
                    "has_to_dict": hasattr(disease, "to_dict"),
                    "attributes": (
                        dir(disease) if hasattr(disease, "__dict__") else "N/A"
                    ),
                }
            )

            # Xử lý disease
            if isinstance(disease, dict):
                processed_disease = disease
            else:
                if hasattr(disease, "to_dict"):
                    processed_disease = disease.to_dict()
                else:
                    processed_disease = {
                        "b_ma": getattr(disease, "b_ma", None),
                        "b_ten": getattr(disease, "b_ten", None),
                        "b_mota": getattr(disease, "b_mota", None),
                    }

            processed_diseases.append(processed_disease)

        return success_response(
            {
                "test_prescription": tt_matthuoc,
                "found_diseases": len(diseases),
                "diseases": processed_diseases,
                "debug_info": debug_info,
                "raw_data": str(diseases),
            }
        )

    except Exception as e:
        import traceback

        return error_response(
            {"error": str(e), "traceback": traceback.format_exc()}, 500
        )


@chandoan_bp.route("/debug", methods=["GET"])
def debug_service():
    """Debug endpoint để kiểm tra service"""
    try:
        return success_response(
            {
                "chandoan_service_type": str(type(chandoan_service)),
                "chandoan_service_methods": [
                    method
                    for method in dir(chandoan_service)
                    if not method.startswith("_")
                ],
                "db_type": str(type(db)),
                "db_session_type": str(type(db.session)),
                "available_methods": [
                    "get_chan_doan_by_prescription(tt_matthuoc) -> List[Benh]"
                ],
            }
        )
    except Exception as e:
        return error_response(f"Debug error: {str(e)}", 500)


@chandoan_bp.route("/status", methods=["GET"])
def get_service_status():
    """Lấy trạng thái service"""
    try:
        return success_response(
            {
                "status": "active",
                "service_name": "ChanDoan Service",
                "available_endpoints": [
                    "GET /api/chandoan/toa-thuoc/<tt_matthuoc> - Lấy danh sách bệnh theo toa thuốc",
                    "GET /api/chandoan/toa-thuoc/<tt_matthuoc>/summary - Lấy tóm tắt bệnh theo toa thuốc",
                    "GET /api/chandoan/toa-thuoc/<tt_matthuoc>/details - Lấy chi tiết đầy đủ bệnh theo toa thuốc",
                    "GET /api/chandoan/test/<tt_matthuoc> - Test endpoint với debug info",
                    "GET /api/chandoan/debug - Debug service",
                    "GET /api/chandoan/status - Trạng thái service",
                ],
                "note": "Service trả về đầy đủ thông tin bệnh với xử lý an toàn dict/object",
            }
        )
    except Exception as e:
        return error_response(str(e), 500)


@chandoan_bp.route("/predict", methods=["POST"])
def predict_disease():
    """
    Dự đoán bệnh dựa trên danh sách triệu chứng (symptoms_input).
    Body: { "symptoms": ["sốt", "đau bụng", ...] }
    """
    try:
        data = request.get_json()
        symptoms = data.get("symptoms") if data else None
        if not symptoms or not isinstance(symptoms, list):
            return error_response(
                "Thiếu hoặc sai định dạng trường 'symptoms' (phải là list)", 400
            )

        # Gọi hàm dự đoán (pipeline mới, dùng file trong assits)
        results = chandoan_service.diagnose_disease(
            symptoms, top_k=5, assits_folder="d:/CTU/Nien luan nganh/Clinic_Management_System/backend_for_CMS/app/assits"
        )
        # Lấy thông tin chi tiết bệnh cho từng disease_code
        detailed_results = []
        for code, sim in results:
            benh_info = benh_service.get_by_id(code)
            detailed_results.append(
                {
                    "disease_code": code,
                    "similarity": round(sim, 3),
                    "disease_info": benh_info,  # Có thể là None nếu không tìm thấy
                }
            )

        return success_response({"results": detailed_results})
    except Exception as e:
        import traceback

        return error_response(
            {"error": str(e), "traceback": traceback.format_exc()}, 500
        )
