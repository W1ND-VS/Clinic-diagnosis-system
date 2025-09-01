from flask import Blueprint, request
from app.Services.KetQua_service import KetQuaService
from app.extensions import db
from app.utils.response_utils import success_response, error_response
from datetime import datetime
from flask_jwt_extended import jwt_required

# Khởi tạo Blueprint
ketqua_bp = Blueprint("ketqua", __name__, url_prefix="/api/ketqua")


# Khởi tạo service
ketqua_service = KetQuaService(db)


@ketqua_bp.route("/create-with-prescription", methods=["POST"])
def create_with_prescription():
    """Tạo phiếu chỉ định dịch vụ y tế kèm kết quả"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)

        # Kiểm tra các trường bắt buộc
        required_fields = ["pk_ma", "pk_ngaykham", "dichvu_list"]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return error_response(
                f"Thiếu các trường bắt buộc: {', '.join(missing_fields)}", 400
            )

        pk_ma = data["pk_ma"]
        pk_ngaykham = data["pk_ngaykham"]
        dichvu_list = data["dichvu_list"]

        # Kiểm tra kiểu dữ liệu
        if not isinstance(dichvu_list, list):
            return error_response("dichvu_list phải là một mảng", 400)

        # Tạo phiếu chỉ định kèm kết quả - loại bỏ tham số nv_ma không sử dụng
        result = ketqua_service.create_prescription_with_results(
            pk_ma=pk_ma, pk_ngaykham=pk_ngaykham, dichvu_list=dichvu_list
        )

        return success_response(result, 201)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@ketqua_bp.route("/services/<string:pcd_ma>", methods=["GET"])
def get_services_by_prescription(pcd_ma):
    """Lấy thông tin các dịch vụ theo mã phiếu chỉ định"""
    try:
        results = ketqua_service.get_results_with_service_info(pcd_ma)
        if not results:
            return success_response([])
        return success_response(results)
    except Exception as e:
        return error_response(str(e), 500)


@ketqua_bp.route("/batch-update/<string:pcd_ma>", methods=["PUT"])
def batch_update_results(pcd_ma):
    """Cập nhật nhiều kết quả cùng lúc cho một phiếu chỉ định"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)

        # Chuẩn bị dữ liệu theo định dạng mới
        updated_data = {}

        # Trường hợp 1: Định dạng mới đã có sẵn các trường pcd_ngay, pcd_gio, items
        if "items" in data:
            updated_data = data.copy()
            # Kiểm tra và chuyển định dạng ngày nếu có
            if "pcd_ngay" in data:
                try:
                    datetime.strptime(data["pcd_ngay"], "%Y-%m-%d")
                except ValueError:
                    return error_response(
                        "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
                    )

            # Kiểm tra và chuyển định dạng giờ nếu có
            if "pcd_gio" in data:
                time_str = data["pcd_gio"]
                try:
                    if len(time_str.split(":")) == 2:
                        time_str += ":00"  # Thêm giây nếu chỉ có giờ:phút
                    datetime.strptime(time_str, "%H:%M:%S")
                    updated_data["pcd_gio"] = time_str  # Cập nhật giờ đã định dạng
                except ValueError:
                    return error_response(
                        "Định dạng giờ không hợp lệ. Sử dụng HH:MM:SS hoặc HH:MM", 400
                    )

        # Trường hợp 2: Định dạng cũ (data["results"] là một mảng)
        elif "results" in data:
            results = data["results"]

            # Kiểm tra kiểu dữ liệu
            if not isinstance(results, list):
                return error_response("Trường 'results' phải là một mảng", 400)

            # Kiểm tra mảng không rỗng
            if len(results) == 0:
                return error_response("Mảng 'results' không được rỗng", 400)

            # Chuyển đổi định dạng cũ sang định dạng mới
            updated_data["items"] = results

            # Thêm các trường tùy chọn khác nếu có
            if "pcd_ngay" in data:
                updated_data["pcd_ngay"] = data["pcd_ngay"]
            if "pcd_gio" in data:
                updated_data["pcd_gio"] = data["pcd_gio"]

        # Trường hợp 3: Không có trường nào phù hợp
        else:
            return error_response("Thiếu trường bắt buộc 'results' hoặc 'items'", 400)

        # Gọi phương thức cập nhật hàng loạt với dữ liệu đã được chuẩn hóa
        update_result = ketqua_service.batch_update_results(pcd_ma, updated_data)

        return success_response(update_result)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@ketqua_bp.route("/detailed-results/<string:pcd_ma>", methods=["GET"])
def get_detailed_results_by_pcd(pcd_ma):
    """Lấy kết quả chi tiết của tất cả dịch vụ và chỉ số theo phiếu chỉ định"""
    try:
        results = ketqua_service.get_detailed_results_by_pcd(pcd_ma)

        # Kiểm tra nếu không có thông tin phiếu
        if not results["phieu_info"]:
            return error_response(f"Không tìm thấy phiếu chỉ định với mã {pcd_ma}", 404)

        return success_response(results)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@ketqua_bp.route("/detailed-results/phieukham/<int:pk_ma>/<string:pk_ngaykham>", methods=["GET"])
def get_detailed_results_by_phieukham(pk_ma, pk_ngaykham):
    """Lấy kết quả chi tiết theo phiếu khám"""
    try:
        # Chuyển đổi chuỗi ngày thành đối tượng date
        try:
            ngay_kham = datetime.strptime(pk_ngaykham, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        results = ketqua_service.get_detailed_results_by_phieukham(pk_ma, ngay_kham)

        # Kiểm tra nếu không có dịch vụ nào
        if not results.get("dich_vu"):
            return success_response(
                results, results.get("message", "Không có dịch vụ nào")
            )

        return success_response(results)

    except Exception as e:
        return error_response(str(e), 500)
