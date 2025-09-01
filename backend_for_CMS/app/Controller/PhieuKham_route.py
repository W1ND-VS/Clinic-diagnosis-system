from flask import Blueprint, request
from app.Services.PhieuKham_service import PhieuKhamService
from app.utils.response_utils import success_response, error_response
from app.extensions import db
from datetime import datetime, date, timedelta
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

phieukham_bp = Blueprint("phieukham", __name__, url_prefix="/api/phieukham")
phieukham_service = PhieuKhamService(db)


@phieukham_bp.route("", methods=["GET"])
def get_all():
    """Lấy tất cả phiếu khám"""
    try:
        phieu_khams = phieukham_service.get_all()
        return success_response(
            [pk.to_dict() if hasattr(pk, "to_dict") else pk for pk in phieu_khams]
        )
    except Exception as e:
        return error_response(str(e), 500)


@phieukham_bp.route("/<int:pk_ma>/<string:pk_ngaykham>", methods=["GET"])
def get_by_id(pk_ma, pk_ngaykham):
    """Lấy phiếu khám theo mã và ngày khám"""
    try:
        # Chuyển đổi ngày từ chuỗi sang đối tượng date
        try:
            ngay_kham = datetime.strptime(pk_ngaykham, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        phieu_kham = phieukham_service.get_by_id(pk_ma, ngay_kham)
        if not phieu_kham:
            return error_response(
                f"Không tìm thấy phiếu khám với mã {pk_ma} và ngày {pk_ngaykham}", 404
            )

        return success_response(
            phieu_kham.to_dict() if hasattr(phieu_kham, "to_dict") else phieu_kham
        )
    except Exception as e:
        return error_response(str(e), 500)


@phieukham_bp.route("/benhnhan/<string:bn_ma>", methods=["GET"])
def get_by_patient(bn_ma):
    """Lấy phiếu khám theo mã bệnh nhân"""
    try:
        phieu_khams = phieukham_service.get_by_patient(bn_ma)
        return success_response(
            [pk.to_dict() if hasattr(pk, "to_dict") else pk for pk in phieu_khams]
        )
    except Exception as e:
        return error_response(str(e), 500)


@phieukham_bp.route("/bacsi/", methods=["GET"])
@jwt_required()
def get_by_doctor():
    """Lấy phiếu khám theo mã bác sĩ với phân trang"""
    try:
        # Lấy tham số phân trang
        offset = request.args.get("offset", default=0, type=int)
        limit = request.args.get("limit", default=10, type=int)
        # Lấy mã nhân viên từ token
        claims = get_jwt()
        nv_ma = claims.get("sub")  # Lấy mã nhân viên (identity) từ token
        # Tạo filter cho mã bác sĩ
        filters = {"nv_ma": nv_ma}

        # Thêm filter trạng thái nếu có
        trangthai = request.args.get("trangthai")
        if trangthai:
            filters["pk_trangthai"] = trangthai

        # Lọc theo ngày khám nếu có
        ngay = request.args.get("ngay")
        if ngay:
            filters["pk_ngaykham"] = ngay

        # Gọi service để lấy dữ liệu phân trang
        result = phieukham_service.get_paginated(offset, limit, filters)

        # Chuyển đổi kết quả từ model sang dict
        if result["data"]:
            result["data"] = [
                pk.to_dict() if hasattr(pk, "to_dict") else pk for pk in result["data"]
            ]

        return success_response(result)
    except Exception as e:
        return error_response(str(e), 500)


@phieukham_bp.route("/date-range", methods=["GET"])
def get_by_date_range():
    """Lấy phiếu khám theo khoảng ngày"""
    try:
        start_date_str = request.args.get("start_date")
        end_date_str = request.args.get("end_date")

        if not start_date_str or not end_date_str:
            return error_response("Thiếu tham số start_date hoặc end_date", 400)

        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        phieu_khams = phieukham_service.get_by_date_range(start_date, end_date)
        return success_response(
            [pk.to_dict() if hasattr(pk, "to_dict") else pk for pk in phieu_khams]
        )
    except Exception as e:
        return error_response(str(e), 500)


@phieukham_bp.route("", methods=["POST"])
def create():
    """Tạo phiếu khám mới"""
    try:
        data = request.get_json()

        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)

        # Chuyển đổi ngày khám nếu có
        if "pk_ngaykham" in data and isinstance(data["pk_ngaykham"], str):
            try:
                data["pk_ngaykham"] = datetime.strptime(
                    data["pk_ngaykham"], "%Y-%m-%d"
                ).date()
            except ValueError:
                return error_response(
                    "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
                )

        # Tạo phiếu khám
        try:
            phieu_kham = phieukham_service.create(data)
            return success_response(
                phieu_kham.to_dict() if hasattr(phieu_kham, "to_dict") else phieu_kham,
                201,
            )
        except ValueError as e:
            return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@phieukham_bp.route("/update/<int:pk_ma>/<string:pk_ngaykham>", methods=["PUT"])
def update(pk_ma, pk_ngaykham):
    """Cập nhật phiếu khám"""
    try:
        data = request.get_json()

        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)

        # Chuyển đổi ngày khám
        try:
            ngay_kham = datetime.strptime(pk_ngaykham, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        # Cập nhật phiếu khám
        phieu_kham = phieukham_service.update(pk_ma, ngay_kham, data)

        if not phieu_kham:
            return error_response(
                f"Không tìm thấy phiếu khám với mã {pk_ma} và ngày {pk_ngaykham}", 404
            )

        return success_response(
            phieu_kham.to_dict() if hasattr(phieu_kham, "to_dict") else phieu_kham
        )
    except Exception as e:
        return error_response(str(e), 500)


@phieukham_bp.route("/<int:pk_ma>/<string:pk_ngaykham>", methods=["DELETE"])
def delete(pk_ma, pk_ngaykham):
    """Xóa phiếu khám"""
    try:
        # Chuyển đổi ngày khám
        try:
            ngay_kham = datetime.strptime(pk_ngaykham, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        # Xóa phiếu khám
        try:
            result = phieukham_service.delete(pk_ma, ngay_kham)

            if not result:
                return error_response(
                    f"Không tìm thấy phiếu khám với mã {pk_ma} và ngày {pk_ngaykham}",
                    404,
                )

            return success_response(
                {"message": f"Đã xóa phiếu khám với mã {pk_ma} và ngày {pk_ngaykham}"}
            )
        except ValueError as e:
            return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@phieukham_bp.route("/from-appointment/<string:ph_ma>", methods=["POST"])
@jwt_required()
def create_from_appointment(ph_ma):
    """Tạo phiếu khám từ phiếu hẹn"""
    try:
        try:
            claims = get_jwt()
            nv_ma = claims["sub"]  # Lấy mã nhân viên (identity)
            user_role = claims.get("role")  # Lấy role từ claim

            print(f"Claims: {claims}")
            print(f"User role: {user_role}")

            # Kiểm tra role phải là tiếp tân
            if user_role != "tieptan":
                return error_response(
                    "Chỉ tiếp tân mới có quyền tạo phiếu khám từ phiếu hẹn", 403
                )

            if not nv_ma:
                return error_response("Không tìm thấy mã nhân viên trong token", 401)

            print(f"Current user ID: {nv_ma}")
            phieu_kham = phieukham_service.create_from_appointment(ph_ma, nv_ma)
            return success_response(
                phieu_kham.to_dict() if hasattr(phieu_kham, "to_dict") else phieu_kham,
                201,
            )
        except ValueError as e:
            return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@phieukham_bp.route("/<int:pk_ma>/<string:pk_ngaykham>/complete", methods=["PUT"])
def complete_examination(pk_ma, pk_ngaykham):
    """Hoàn thành khám bệnh với thông tin sinh hiệu"""
    try:
        # Chuyển đổi ngày khám
        try:
            ngay_kham = datetime.strptime(pk_ngaykham, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        # Lấy data từ request body (có thể có hoặc không)
        data = request.get_json() if request.is_json else {}

        # Validate và xử lý data nếu có
        vital_signs_data = {}
        if data:
            # Lọc và validate các trường sinh hiệu
            vital_fields = [
                "pk_huyetap_tamthu",
                "pk_huyetap_tamtruong",
                "pk_nhietdo",
                "pk_nhiptim",
                "pk_nhiptho",
                "pk_chieucao",
                "pk_cannang",
            ]

            for field in vital_fields:
                if field in data and data[field] is not None:
                    try:
                        # Validate numeric values
                        if field in [
                            "pk_huyetap_tamthu",
                            "pk_huyetap_tamtruong",
                            "pk_nhiptim",
                            "pk_nhiptho",
                        ]:
                            vital_signs_data[field] = int(data[field])
                        elif field in ["pk_nhietdo", "pk_chieucao", "pk_cannang"]:
                            vital_signs_data[field] = float(data[field])
                    except (ValueError, TypeError):
                        return error_response(
                            f"Giá trị không hợp lệ cho trường {field}", 400
                        )

        # Hoàn thành khám bệnh với dữ liệu sinh hiệu
        phieu_kham = phieukham_service.complete_examination(
            pk_ma, ngay_kham, vital_signs_data if vital_signs_data else None
        )

        if not phieu_kham:
            return error_response(
                f"Không tìm thấy phiếu khám với mã {pk_ma} và ngày {pk_ngaykham}", 404
            )

        return success_response(
            {
                "message": "Hoàn thành khám bệnh thành công",
                "phieu_kham": (
                    phieu_kham.to_dict()
                    if hasattr(phieu_kham, "to_dict")
                    else phieu_kham
                ),
                "vital_signs_updated": len(vital_signs_data) > 0,
                "updated_fields": (
                    list(vital_signs_data.keys()) if vital_signs_data else []
                ),
            }
        )

    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(f"Lỗi khi hoàn thành khám bệnh: {str(e)}", 500)


@phieukham_bp.route("/paged", methods=["GET"])
def get_paged_phieukham():
    """Lấy phiếu khám có phân trang"""
    try:
        # Lấy tham số phân trang
        offset = request.args.get("offset", default=0, type=int)
        limit = request.args.get("limit", default=10, type=int)
        bs_ma = request.args.get("bs_ma")
        print(f"BS_MA: {bs_ma}")
        # Xây dựng các bộ lọc từ tham số truy vấn
        filters = {}

        # Lọc theo trạng thái
        trangthai = request.args.get("trangthai")
        if trangthai:
            filters["pk_trangthai"] = trangthai

        # Lọc theo bác sĩ
        bacsi = request.args.get("bacsi")
        if bacsi:
            filters["nv_ma"] = bacsi

        # Lọc theo ngày khám
        ngay = request.args.get("ngay")  # Lọc theo ngày khám
        if ngay:
            filters["pk_ngaykham"] = ngay

        # Bỏ lọc theo khoảng ngày (đã xóa code liên quan đến from_date và to_date)

        # Lọc theo phiếu hẹn
        phieuhen = request.args.get("phieuhen")
        if phieuhen:
            filters["ph_ma"] = phieuhen
        print(f"Filters: {filters}")

        # Gọi service để lấy dữ liệu
        result = phieukham_service.get_paginated(offset, limit, filters, bs_ma)

        # Chuyển đổi kết quả từ model sang dict
        if result["data"]:
            result["data"] = [
                pk.to_dict() if hasattr(pk, "to_dict") else pk for pk in result["data"]
            ]

        return success_response(result)
    except Exception as e:
        return error_response(str(e), 500)


@phieukham_bp.route("/<int:pk_ma>/<string:pk_ngaykham>/pcd_ma", methods=["GET"])
def get_pcd_ma(pk_ma, pk_ngaykham):
    """Lấy mã phiếu chỉ định dịch vụ y tế theo mã và ngày phiếu khám"""
    try:
        # Chuyển đổi ngày từ chuỗi sang đối tượng date
        try:
            ngay_kham = datetime.strptime(pk_ngaykham, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        pcd_ma = phieukham_service.get_pcd_ma(pk_ma, ngay_kham)
        if pcd_ma is None:
            return error_response(
                f"Không tìm thấy phiếu chỉ định cho phiếu khám với mã {pk_ma} và ngày {pk_ngaykham}",
                404,
            )

        return success_response({"pcd_ma": pcd_ma})
    except Exception as e:
        return error_response(str(e), 500)


@phieukham_bp.route("/benh-nhan/<string:bn_ma>/with-doctor", methods=["GET"])
def get_by_patient_with_doctor(bn_ma):
    """Lấy phiếu khám theo bệnh nhân kèm đầy đủ thông tin bác sĩ"""
    try:
        phieukhams = phieukham_service.get_by_patient_with_doctor_info(bn_ma)

        if not phieukhams:
            return error_response(
                f"Không tìm thấy phiếu khám cho bệnh nhân {bn_ma}", 404
            )

        return success_response(
            {"bn_ma": bn_ma, "total": len(phieukhams), "phieu_khams": phieukhams}
        )

    except Exception as e:
        return error_response(str(e), 500)


@phieukham_bp.route("/trieu-chung/<int:pk_ma>/<string:pk_ngaykham>", methods=["GET"])
def get_trieu_chung_by_phieu_kham(pk_ma, pk_ngaykham):
    """Lấy tất cả triệu chứng của phiếu khám"""
    try:
        # Chuyển đổi ngày từ chuỗi sang đối tượng date
        try:
            ngay_kham = datetime.strptime(pk_ngaykham, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        trieu_chungs = phieukham_service.get_trieuchung_by_phieukham(pk_ma, ngay_kham)
        return success_response(
            [tc.to_dict() if hasattr(tc, "to_dict") else tc for tc in trieu_chungs]
        )
    except Exception as e:
        return error_response(str(e), 500)


# Thêm các route sau vào cuối file, trước dòng cuối cùng


@phieukham_bp.route(
    "/<int:pk_ma>/<string:pk_ngaykham>/predict-heart-disease", methods=["POST"]
)
def predict_heart_disease_endpoint(pk_ma, pk_ngaykham):
    """Dự đoán nguy cơ bệnh tim từ phiếu khám hoặc dữ liệu trực tiếp"""
    try:
        # Chuyển đổi chuỗi ngày thành đối tượng date
        try:
            pk_date = datetime.strptime(pk_ngaykham, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        # Lấy dữ liệu từ request nếu có
        data = (
            request.json
            if request.is_json
            else request.form.to_dict() if request.form else None
        )

        # Gọi service dự đoán bệnh tim
        result = phieukham_service.predict_heart_disease(pk_ma, pk_date, data)

        if not result.get("success", False):
            return error_response(result.get("message", "Lỗi dự đoán bệnh tim"), 400)

        return success_response(result)

    except Exception as e:
        return error_response(f"Lỗi khi dự đoán bệnh tim: {str(e)}", 500)


@phieukham_bp.route("/predict-heart-disease", methods=["POST"])
def predict_heart_disease_direct():
    """Dự đoán nguy cơ bệnh tim trực tiếp từ dữ liệu đầu vào"""
    try:
        # Lấy dữ liệu từ request
        data = request.get_json()

        if not data:
            return error_response("Thiếu dữ liệu đầu vào", 400)

        # Gọi service dự đoán bệnh tim với dữ liệu trực tiếp
        result = phieukham_service.predict_heart_disease(data=data)

        if not result.get("success", False):
            return error_response(result.get("message", "Lỗi dự đoán bệnh tim"), 400)

        return success_response(result)

    except Exception as e:
        return error_response(f"Lỗi khi dự đoán bệnh tim: {str(e)}", 500)


@phieukham_bp.route("/heart-input-requirements", methods=["GET"])
def get_heart_disease_input_requirements():
    """Lấy danh sách các trường đầu vào cần thiết cho model dự đoán bệnh tim"""
    try:
        requirements = phieukham_service.get_heart_disease_input_requirements()

        if not requirements.get("success", False):
            return error_response(
                requirements.get("message", "Lỗi khi lấy requirements"), 500
            )

        return success_response(requirements)

    except Exception as e:
        return error_response(f"Lỗi khi lấy input requirements: {str(e)}", 500)


@phieukham_bp.route("/diabetes-input-requirements", methods=["GET"])
def get_diabetes_input_requirements():
    """Lấy danh sách các trường đầu vào cần thiết cho model dự đoán tiểu đường"""
    try:
        requirements = phieukham_service.get_diabetes_input_requirements()

        if not requirements.get("success", False):
            return error_response(
                requirements.get("message", "Lỗi khi lấy requirements"), 500
            )

        return success_response(requirements)

    except Exception as e:
        return error_response(f"Lỗi khi lấy diabetes input requirements: {str(e)}", 500)


@phieukham_bp.route("/validate-heart-disease-input", methods=["POST"])
def validate_heart_disease_input():
    """Validate dữ liệu đầu vào cho model dự đoán bệnh tim"""
    try:
        # Lấy dữ liệu từ request
        input_data = request.get_json()

        if not input_data:
            return error_response("Thiếu dữ liệu đầu vào", 400)

        # Gọi service validation
        validation_result = phieukham_service.validate_heart_disease_input(input_data)

        return success_response(validation_result)

    except Exception as e:
        return error_response(f"Lỗi khi validate dữ liệu: {str(e)}", 500)


@phieukham_bp.route("/predict-diabetes-disease", methods=["POST"])
def predict_diabetes_direct():
    """Dự đoán nguy cơ tiểu đường trực tiếp từ dữ liệu đầu vào"""
    try:
        # Lấy dữ liệu từ request
        data = request.get_json()

        if not data:
            return error_response("Thiếu dữ liệu đầu vào", 400)

        # Gọi service dự đoán tiểu đường với dữ liệu trực tiếp
        result = phieukham_service.predict_diabetes(data=data)

        if not result.get("success", False):
            return error_response(result.get("message", "Lỗi dự đoán tiểu đường"), 400)

        return success_response(result)

    except Exception as e:
        return error_response(f"Lỗi khi dự đoán tiểu đường: {str(e)}", 500)


@phieukham_bp.route("/ml-models-info", methods=["GET"])
def get_ml_models_info():
    """Lấy thông tin về tất cả các model machine learning có sẵn"""
    try:
        models_info = {
            "success": True,
            "available_models": {
                "heart_disease": {
                    "name": "Heart Disease Prediction",
                    "description": "Dự đoán nguy cơ bệnh tim dựa trên các thông số sinh hiệu",
                    "model_file": "enhanced_rf_pipeline_20250804_161101.pkl",
                    "status": "active",
                    "endpoints": {
                        "predict_from_phieukham": "/api/phieukham/<pk_ma>/<pk_ngaykham>/predict-heart-disease",
                        "predict_direct": "/api/phieukham/predict-heart-disease",
                        "input_requirements": "/api/phieukham/heart-disease-input-requirements",
                        "validate_input": "/api/phieukham/validate-heart-disease-input",
                    },
                },
                "diabetes": {
                    "name": "Diabetes Prediction",
                    "description": "Dự đoán nguy cơ tiểu đường dựa trên các thông số y tế",
                    "status": "active",
                    "endpoints": {
                        "predict_from_phieukham": "/api/phieukham/<pk_ma>/<pk_ngaykham>/predict-diabetes",
                        "predict_direct": "/api/phieukham/predict-diabetes",
                        "input_requirements": "/api/phieukham/diabetes-input-requirements",
                    },
                },
            },
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }

        return success_response(models_info)

    except Exception as e:
        return error_response(f"Lỗi khi lấy thông tin models: {str(e)}", 500)


@phieukham_bp.route("/batch-predict-heart-disease", methods=["POST"])
def batch_predict_heart_disease():
    """Dự đoán bệnh tim cho nhiều bệnh nhân cùng lúc"""
    try:
        # Lấy dữ liệu từ request
        data = request.get_json()

        if not data or "patients" not in data:
            return error_response(
                "Thiếu dữ liệu bệnh nhân. Cần trường 'patients' chứa danh sách bệnh nhân",
                400,
            )

        patients_data = data["patients"]

        if not isinstance(patients_data, list):
            return error_response("Trường 'patients' phải là một mảng", 400)

        results = []

        for i, patient_data in enumerate(patients_data):
            try:
                # Dự đoán cho từng bệnh nhân
                prediction_result = phieukham_service.predict_heart_disease(
                    data=patient_data
                )

                results.append(
                    {
                        "index": i,
                        "patient_id": patient_data.get("patient_id", f"patient_{i}"),
                        "result": prediction_result,
                    }
                )

            except Exception as e:
                results.append(
                    {
                        "index": i,
                        "patient_id": patient_data.get("patient_id", f"patient_{i}"),
                        "result": {"success": False, "error": str(e)},
                    }
                )

        # Tính thống kê
        successful_predictions = sum(
            1 for r in results if r["result"].get("success", False)
        )
        high_risk_count = sum(
            1
            for r in results
            if r["result"].get("success", False) and r["result"].get("prediction") == 1
        )

        return success_response(
            {
                "total_patients": len(patients_data),
                "successful_predictions": successful_predictions,
                "failed_predictions": len(patients_data) - successful_predictions,
                "high_risk_patients": high_risk_count,
                "results": results,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
        )

    except Exception as e:
        return error_response(f"Lỗi khi dự đoán batch: {str(e)}", 500)


@phieukham_bp.route(
    "/<int:pk_ma>/<string:pk_ngaykham>/predict-hypertension", methods=["POST"]
)
def predict_hypertension_from_phieukham(pk_ma, pk_ngaykham):
    """
    Dự đoán nguy cơ tăng huyết áp từ phiếu khám hoặc dữ liệu trực tiếp
    """
    try:
        try:
            pk_date = datetime.strptime(pk_ngaykham, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        data = request.get_json() if request.is_json else None

        result = phieukham_service.predict_hypertension(pk_ma, pk_date, data)
        if not result.get("success", False):
            return error_response(
                result.get("message", "Lỗi dự đoán tăng huyết áp"), 400
            )
        return success_response(result)
    except Exception as e:
        return error_response(f"Lỗi khi dự đoán tăng huyết áp: {str(e)}", 500)


@phieukham_bp.route("/predict-hypertension-disease", methods=["POST"])
def predict_hypertension_direct():
    """
    Dự đoán nguy cơ tăng huyết áp trực tiếp từ dữ liệu đầu vào
    """
    try:
        data = request.get_json()
        if not data:
            return error_response("Thiếu dữ liệu đầu vào", 400)
        result = phieukham_service.predict_hypertension(data=data)
        if not result.get("success", False):
            return error_response(
                result.get("message", "Lỗi dự đoán tăng huyết áp"), 400
            )
        return success_response(result)
    except Exception as e:
        return error_response(f"Lỗi khi dự đoán tăng huyết áp: {str(e)}", 500)


@phieukham_bp.route("/hypertension-input-requirements", methods=["GET"])
def get_hypertension_input_requirements_route():
    """
    Lấy danh sách các trường đầu vào cần thiết cho model dự đoán tăng huyết áp
    """
    try:
        requirements = phieukham_service.get_hypertension_input_requirements()
        if not requirements.get("success", False):
            return error_response(
                requirements.get("message", "Lỗi khi lấy requirements"), 500
            )
        return success_response(requirements)
    except Exception as e:
        return error_response(f"Lỗi khi lấy input requirements: {str(e)}", 500)


@phieukham_bp.route("/completed", methods=["GET"])
def get_all_completed_examinations():
    """
    Lấy tất cả phiếu khám đã hoàn thành hoặc theo ngày nếu có query param 'date'
    GET /api/phieukham/completed?date=YYYY-MM-DD
    """
    try:

        date_str = request.args.get("date")
        if date_str:
            try:
                print(date_str)
                date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                return error_response(
                    "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
                )
            result = phieukham_service.get_completed_examinations(date_obj)
        else:
            result = phieukham_service.get_all_completed_examinations()
        return success_response(result)
    except Exception as e:
        return error_response(str(e), 500)


@phieukham_bp.route("/completed/by-date-range", methods=["GET"])
def get_completed_examinations_by_date_range():
    """
    Lấy phiếu khám đã khám trong khoảng thời gian.
    Truyền tham số start_date, end_date dạng yyyy-mm-dd trên query string.
    """
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        if not start_date or not end_date:
            return error_response("Thiếu start_date hoặc end_date", 400)
        start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        result = phieukham_service.get_completed_examinations_by_date_range(
            start_date, end_date
        )
        return success_response(result)
    except Exception as e:
        return error_response(str(e), 500)


@phieukham_bp.route("/<int:pk_ma>/<string:pk_ngaykham>/pay", methods=["PUT"])
def pay_examination(pk_ma, pk_ngaykham):
    """
    Thanh toán phiếu khám: cập nhật trạng thái thành Đã thanh toán
    """
    try:
        # Chuyển đổi ngày khám từ chuỗi sang đối tượng date
        try:
            ngay_kham = datetime.strptime(pk_ngaykham, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        result = phieukham_service.pay_examination(pk_ma, ngay_kham)
        if not result:
            return error_response(
                f"Không tìm thấy hoặc không thể cập nhật phiếu khám với mã {pk_ma} và ngày {pk_ngaykham}",
                404,
            )
        return success_response({"message": "Thanh toán phiếu khám thành công"})
    except Exception as e:
        return error_response(f"Lỗi khi thanh toán phiếu khám: {str(e)}", 500)


@phieukham_bp.route(
    "/predict-stroke-disease1", methods=["POST"]
)
def predict_stroke_from_phieukham():
    """
    Dự đoán nguy cơ đột quỵ từ phiếu khám hoặc dữ liệu trực tiếp
    """
    try:
        data = request.get_json() if request.is_json else None

        data = request.get_json() if request.is_json else None

        result = phieukham_service.predict_stroke(data)
        if not result.get("success", False):
            return error_response(result.get("message", "Lỗi dự đoán đột quỵ"), 400)
        return success_response(result)
    except Exception as e:
        return error_response(f"Lỗi khi dự đoán đột quỵ: {str(e)}", 500)


@phieukham_bp.route("/predict-stroke-disease", methods=["POST"])
def predict_stroke_direct():
    """
    Dự đoán nguy cơ đột quỵ trực tiếp từ dữ liệu đầu vào
    """
    try:
        data = request.get_json()
        if not data:
            return error_response("Thiếu dữ liệu đầu vào", 400)
        result = phieukham_service.predict_stroke(data=data)
        if not result.get("success", False):
            return error_response(result.get("message", "Lỗi dự đoán đột quỵ"), 400)
        return success_response(result)
    except Exception as e:
        return error_response(f"Lỗi khi dự đoán đột quỵ: {str(e)}", 500)


@phieukham_bp.route("/stroke-input-requirements", methods=["GET"])
def get_stroke_input_requirements():
    """
    Lấy danh sách các trường đầu vào cần thiết cho model dự đoán đột quỵ
    """
    try:
        requirements = phieukham_service.get_stroke_input_requirements()
        if not requirements.get("success", False):
            return error_response(
                requirements.get("message", "Lỗi khi lấy requirements"), 500
            )
        return success_response(requirements)
    except Exception as e:
        return error_response(f"Lỗi khi lấy input requirements: {str(e)}", 500)


@phieukham_bp.route("/paid", methods=["GET"])
def get_all_paid_examinations():
    """
    Lấy tất cả phiếu khám đã thanh toán
    GET /api/phieukham/paid
    """
    try:
        result = phieukham_service.get_all_paid_examinations()
        return success_response(result)
    except Exception as e:
        return error_response(str(e), 500)
