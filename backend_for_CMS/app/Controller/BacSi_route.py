from flask import Blueprint, request
from app.Services.BacSi_service import BacSiService
from app.extensions import db
from app.utils.response_utils import success_response, error_response
from datetime import datetime

bacsi_bp = Blueprint("bacsi", __name__, url_prefix="/api/bacsi")
bacsi_service = BacSiService(db)


@bacsi_bp.route("/getall", methods=["GET"])
def get_all_bacsi():
    """
    Lấy tất cả bác sĩ, có thể lọc theo ngày và chuyên khoa nếu có.
    Query params:
        date (YYYY-MM-DD, optional): Ngày cần lọc lịch làm việc.
        ck_ma (str, optional): Mã chuyên khoa.
    """
    try:
        date_str = request.args.get("date")
        ck_ma = request.args.get("ck_ma")
        date_filter = None
        if date_str:
            try:
                date_filter = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                return error_response(
                    "Định dạng ngày không hợp lệ. Dùng YYYY-MM-DD", 400
                )
        doctors = bacsi_service.get_all(date_filter=date_filter, ck_ma=ck_ma)
        return success_response([doctor.to_dict() for doctor in doctors])
    except Exception as e:
        return error_response(str(e), 500)


@bacsi_bp.route("/getall_paginated", methods=["GET"])
def get_paginated_bacsi():
    """
    Lấy danh sách bác sĩ có phân trang, có thể lọc theo chuyên khoa nếu có.
    Query params:
        offset (int): Vị trí bắt đầu.
        limit (int): Số lượng mỗi trang.
        ck_ma (str, optional): Mã chuyên khoa.
    """
    try:
        offset = request.args.get("offset", 0, type=int)
        limit = request.args.get("limit", 10, type=int)
        ck_ma = request.args.get("ck_ma", None)

        result = bacsi_service.get_doctor_paginated(
            offset=offset, limit=limit, ck_ma=ck_ma
        )
        return success_response(result)
    except Exception as e:
        return error_response(str(e), 500)


@bacsi_bp.route("/<string:id>", methods=["GET"])
def get_bacsi_by_id(id):
    """Lấy bác sĩ theo ID"""
    try:
        doctor = bacsi_service.get_by_id(id)
        if not doctor:
            return error_response(f"Không tìm thấy bác sĩ với ID: {id}", 404)
        return success_response(doctor.to_dict())
    except Exception as e:
        return error_response(str(e), 500)


@bacsi_bp.route("/phieukham/<string:pk_ma>/<string:pk_ngaykham>", methods=["GET"])
def get_bacsi_by_phieukham(pk_ma, pk_ngaykham):
    """Lấy danh sách bác sĩ theo mã phiếu khám"""
    try:
        doctors = bacsi_service.get_by_phieukham(pk_ma, pk_ngaykham)
        if not doctors:
            return success_response([])  # Trả về mảng rỗng nếu không có bác sĩ
        return success_response([doctor.to_dict() for doctor in doctors])
    except Exception as e:
        return error_response(str(e), 500)


@bacsi_bp.route("/create", methods=["POST"])
def create_bacsi():
    """Tạo mới bác sĩ"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["nv_hoten", "nv_password", "nv_gioitinh"]
        for field in required_fields:
            if field not in data:
                return error_response(f"Missing required field: {field}", 400)

        # Create new doctor
        new_bacsi = bacsi_service.create(data)

        # Return success response with doctor data (excluding password)
        return success_response(new_bacsi.to_dict(), 201)

    except Exception as e:
        return error_response(str(e), 500)


@bacsi_bp.route("/<string:id>", methods=["PUT"])
def update_bacsi(id):
    """Cập nhật thông tin bác sĩ"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)

        # Sửa lại phương thức BacSiService.update trước khi sử dụng
        doctor = bacsi_service.get_by_id(id)
        if not doctor:
            return error_response(f"Không tìm thấy bác sĩ với ID: {id}", 404)

        # Xử lý mật khẩu riêng nếu được cung cấp
        if "nv_password" in data:
            password = data.pop("nv_password")
            doctor.set_password(password)

        # Cập nhật các trường khác
        for key, value in data.items():
            setattr(doctor, key, value)

        bacsi_service.db.session.commit()

        return success_response(doctor.to_dict())
    except Exception as e:
        bacsi_service.db.session.rollback()
        return error_response(str(e), 500)


@bacsi_bp.route("/<string:id>", methods=["DELETE"])
def delete_bacsi(id):
    """Xóa bác sĩ"""
    try:
        doctor = bacsi_service.get_by_id(id)
        if not doctor:
            return error_response(f"Không tìm thấy bác sĩ với ID: {id}", 404)

        bacsi_service.db.session.delete(doctor)
        bacsi_service.db.session.commit()

        return success_response({"message": f"Đã xóa bác sĩ có ID: {id}"})
    except Exception as e:
        bacsi_service.db.session.rollback()
        return error_response(str(e), 500)


@bacsi_bp.route("/chuyenkhoa/<string:ck_ma>", methods=["GET"])
def get_bacsi_by_department(ck_ma):
    """Lấy danh sách bác sĩ theo chuyên khoa"""
    try:

        doctors = bacsi_service.get_by_department(ck_ma)
        if not doctors:
            return success_response([])  # Trả về mảng rỗng nếu không có bác sĩ
        return success_response([doctor.to_dict() for doctor in doctors])
    except Exception as e:
        return error_response(str(e), 500)
