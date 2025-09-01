from flask import Blueprint, request
from app.Services.ChuyenKhoa_service import ChuyenKhoaService
from app.utils.response_utils import success_response, error_response
from app.extensions import db

chuyenkhoa_bp = Blueprint("chuyenkhoa", __name__, url_prefix="/api/chuyenkhoa")
chuyenkhoa_service = ChuyenKhoaService(db)


@chuyenkhoa_bp.route("getall", methods=["GET"])
def get_all():
    """Lấy tất cả chuyên khoa"""
    try:
        departments = chuyenkhoa_service.get_all()
        return success_response([department.to_dict() for department in departments])
    except Exception as e:
        return error_response(str(e), 500)


@chuyenkhoa_bp.route("/<string:ck_ma>", methods=["GET"])
def get_by_id(ck_ma):
    """Lấy chuyên khoa theo mã"""
    try:
        department = chuyenkhoa_service.get_by_id(ck_ma)
        if not department:
            return error_response(f"Không tìm thấy chuyên khoa với mã: {ck_ma}", 404)
        return success_response(department.to_dict())
    except Exception as e:
        return error_response(str(e), 500)


@chuyenkhoa_bp.route("/search", methods=["GET"])
def search():
    """Tìm kiếm chuyên khoa theo tên"""
    try:
        name = request.args.get("name", "")
        if not name:
            return error_response("Thiếu tham số tìm kiếm 'name'", 400)
        departments = chuyenkhoa_service.search_by_name(name)
        return success_response([department.to_dict() for department in departments])
    except Exception as e:
        return error_response(str(e), 500)


@chuyenkhoa_bp.route("", methods=["POST"])
def create():
    """Tạo chuyên khoa mới"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)

        # Kiểm tra các trường bắt buộc
        if "ck_ten" not in data:
            return error_response("Thiếu tên chuyên khoa", 400)

        # Tạo mã tự động nếu chưa có
        if "ck_ma" not in data:
            data["ck_ma"] = chuyenkhoa_service.get_max_ck_ma()

        department = chuyenkhoa_service.create(data)
        if not department:
            return error_response("Không thể tạo chuyên khoa", 500)

        return success_response(department.to_dict(), 201)
    except Exception as e:
        return error_response(str(e), 500)


@chuyenkhoa_bp.route("/<string:ck_ma>", methods=["PUT"])
def update(ck_ma):
    """Cập nhật chuyên khoa"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)

        department = chuyenkhoa_service.update(ck_ma, data)
        if not department:
            return error_response(f"Không tìm thấy chuyên khoa với mã: {ck_ma}", 404)

        return success_response(department.to_dict())
    except Exception as e:
        return error_response(str(e), 500)


@chuyenkhoa_bp.route("/<string:ck_ma>", methods=["DELETE"])
def delete(ck_ma):
    """Xóa chuyên khoa"""
    try:
        result = chuyenkhoa_service.delete(ck_ma)
        if not result:
            return error_response(f"Không tìm thấy chuyên khoa với mã: {ck_ma}", 404)

        return success_response({"message": f"Đã xóa chuyên khoa có mã: {ck_ma}"})
    except Exception as e:
        return error_response(str(e), 500)


@chuyenkhoa_bp.route("/<string:ck_ma>/doctors", methods=["GET"])
def get_doctors(ck_ma):
    """Lấy danh sách bác sĩ theo chuyên khoa"""
    try:
        doctors = chuyenkhoa_service.get_doctors_by_department(ck_ma)
        if doctors is None:
            return error_response(f"Không tìm thấy chuyên khoa với mã: {ck_ma}", 404)

        return success_response([doctor.to_dict() for doctor in doctors])
    except Exception as e:
        return error_response(str(e), 500)


@chuyenkhoa_bp.route("/<string:ck_ma>/rooms", methods=["GET"])
def get_rooms(ck_ma):
    """Lấy danh sách phòng theo chuyên khoa"""
    try:
        rooms = chuyenkhoa_service.get_rooms_by_department(ck_ma)
        if rooms is None:
            return error_response(f"Không tìm thấy chuyên khoa với mã: {ck_ma}", 404)

        return success_response([room.to_dict() for room in rooms])
    except Exception as e:
        return error_response(str(e), 500)


@chuyenkhoa_bp.route("/<string:ck_ma>/rooms/codes", methods=["GET"])
def get_room_codes_by_department(ck_ma):
    """
    Lấy tất cả mã phòng thuộc một chuyên khoa

    Args:
        ck_ma: Mã chuyên khoa

    Returns:
        Danh sách mã phòng thuộc chuyên khoa
    """
    try:
        # Kiểm tra chuyên khoa có tồn tại không
        chuyen_khoa = chuyenkhoa_service.get_by_id(ck_ma)
        if not chuyen_khoa:
            return error_response(f"Không tìm thấy chuyên khoa với mã {ck_ma}", 404)

        # Lấy danh sách mã phòng
        room_codes = chuyenkhoa_service.get_room_codes_by_department(ck_ma)

        return success_response(
            {
                "ck_ma": ck_ma,
                "ck_ten": chuyen_khoa.ck_ten,
                "room_codes": room_codes,
                "total_rooms": len(room_codes),
            }
        )
    except Exception as e:
        return error_response(f"Lỗi khi lấy danh sách mã phòng: {str(e)}", 500)
