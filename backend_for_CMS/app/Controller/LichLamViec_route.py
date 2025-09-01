from flask import Blueprint, request, jsonify
from app.extensions import db
from app.Services.LichLamViec_service import LichLamViecService
from app.utils.response_utils import success_response, error_response
from flask_jwt_extended import jwt_required
from datetime import datetime, date, timedelta

# Khởi tạo Blueprint
lichlv_bp = Blueprint("lichlv", __name__, url_prefix="/api/lichlv")

# Khởi tạo service
lichlv_service = LichLamViecService(db)


@lichlv_bp.route("/getall", methods=["GET"])
def get_all():
    """Lấy tất cả lịch làm việc"""
    try:
        lichlv_list = lichlv_service.get_all()
        return success_response(lichlv_list)
    except Exception as e:
        return error_response(str(e), 500)


@lichlv_bp.route("/<int:clv_stt>/<string:nl_ngay>/<string:phong_ma>", methods=["GET"])
def get_by_id(clv_stt, nl_ngay, phong_ma):
    """Lấy lịch làm việc theo ID"""
    try:
        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            ngay = datetime.strptime(nl_ngay, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        lichlv = lichlv_service.get_by_id(clv_stt, ngay, phong_ma)
        if not lichlv:
            return error_response(
                f"Không tìm thấy lịch làm việc với ID đã cung cấp", 404
            )

        return success_response(lichlv.to_dict())
    except Exception as e:
        return error_response(str(e), 500)


@lichlv_bp.route("", methods=["POST"])
@jwt_required()
def create():
    """Tạo lịch làm việc mới"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)

        # Kiểm tra các trường bắt buộc
        required_fields = ["clv_stt", "nl_ngay", "phong_ma", "nv_ma"]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return error_response(
                f"Thiếu các trường bắt buộc: {', '.join(missing_fields)}", 400
            )

        # Xác thực định dạng ngày
        try:
            if isinstance(data["nl_ngay"], str):
                datetime.strptime(data["nl_ngay"], "%Y-%m-%d")
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        new_lichlv = lichlv_service.create(data)
        return success_response(new_lichlv.to_dict(), 201)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@lichlv_bp.route("/<int:clv_stt>/<string:nl_ngay>/<string:phong_ma>", methods=["PUT"])
@jwt_required()
def update(clv_stt, nl_ngay, phong_ma):
    """Cập nhật lịch làm việc"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)

        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            ngay = datetime.strptime(nl_ngay, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        updated_lichlv = lichlv_service.update(clv_stt, ngay, phong_ma, data)
        return success_response(updated_lichlv.to_dict())
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@lichlv_bp.route(
    "/<int:clv_stt>/<string:nl_ngay>/<string:phong_ma>", methods=["DELETE"]
)
@jwt_required()
def delete(clv_stt, nl_ngay, phong_ma):
    """Xóa lịch làm việc"""
    try:
        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            ngay = datetime.strptime(nl_ngay, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        result = lichlv_service.delete(clv_stt, ngay, phong_ma)
        return success_response({"deleted": result})
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@lichlv_bp.route("/doctor/<string:nv_ma>", methods=["GET"])
def get_by_doctor(nv_ma):
    """Lấy lịch làm việc của một bác sĩ"""
    try:
        lichlv_list = lichlv_service.get_by_doctor(nv_ma)
        return success_response(lichlv_list)
    except Exception as e:
        return error_response(str(e), 500)


@lichlv_bp.route("/date/<string:nl_ngay>", methods=["GET"])
def get_by_date(nl_ngay):
    """Lấy lịch làm việc theo ngày"""
    try:
        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            ngay = datetime.strptime(nl_ngay, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        lichlv_list = lichlv_service.get_by_date(ngay)
        return success_response(lichlv_list)
    except Exception as e:
        return error_response(str(e), 500)


@lichlv_bp.route("/date-range", methods=["GET"])
def get_by_date_range():
    """Lấy lịch làm việc trong khoảng thời gian"""
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        if not start_date or not end_date:
            return error_response("Thiếu tham số start_date hoặc end_date", 400)

        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        if start > end:
            return error_response(
                "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc", 400
            )

        lichlv_list = lichlv_service.get_by_date_range(start, end)
        return success_response(lichlv_list)
    except Exception as e:
        return error_response(str(e), 500)


@lichlv_bp.route("/room/<string:phong_ma>", methods=["GET"])
def get_by_room(phong_ma):
    """Lấy lịch làm việc theo phòng"""
    try:
        lichlv_list = lichlv_service.get_by_room(phong_ma)
        return success_response(lichlv_list)
    except Exception as e:
        return error_response(str(e), 500)


@lichlv_bp.route("/check-availability", methods=["GET"])
def check_availability():
    """Kiểm tra tính khả dụng của một slot lịch làm việc"""
    try:
        clv_stt = request.args.get("clv_stt", type=int)
        nl_ngay = request.args.get("nl_ngay")
        phong_ma = request.args.get("phong_ma")

        if not clv_stt or not nl_ngay or not phong_ma:
            return error_response("Thiếu các tham số bắt buộc", 400)

        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            ngay = datetime.strptime(nl_ngay, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        is_available = lichlv_service.check_availability(clv_stt, ngay, phong_ma)
        return success_response({"available": is_available})
    except Exception as e:
        return error_response(str(e), 500)


@lichlv_bp.route("/doctor/<string:nv_ma>/date-range", methods=["GET"])
def get_by_doctor_and_date_range(nv_ma):
    """Lấy lịch làm việc của bác sĩ trong khoảng thời gian"""
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        if not start_date or not end_date:
            return error_response("Thiếu tham số start_date hoặc end_date", 400)

        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        if start > end:
            return error_response(
                "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc", 400
            )

        lichlv_list = lichlv_service.get_by_doctor_and_date_range(nv_ma, start, end)
        return success_response(lichlv_list)
    except Exception as e:
        return error_response(str(e), 500)


@lichlv_bp.route("/get-room", methods=["GET"])
def get_room_by_doctor_date_shift():
    """Lấy mã phòng theo bác sĩ, ngày và ca làm việc"""
    try:
        # Lấy tham số từ query string
        nv_ma = request.args.get("nv_ma")
        nl_ngay = request.args.get("nl_ngay")
        clv_stt = request.args.get("clv_stt", type=int)

        # Kiểm tra tham số bắt buộc
        if not nv_ma or not nl_ngay or not clv_stt:
            return error_response(
                "Thiếu các tham số bắt buộc: nv_ma, nl_ngay, clv_stt", 400
            )

        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            ngay = datetime.strptime(nl_ngay, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        # Gọi service để lấy mã phòng
        phong_ma = lichlv_service.get_room_by_doctor_date_shift(ngay, clv_stt, nv_ma)

        if phong_ma:
            return success_response({"phong_ma": phong_ma})
        else:
            return error_response(
                f"Không tìm thấy phòng làm việc cho bác sĩ {nv_ma} vào ngày {nl_ngay}, ca {clv_stt}",
                404,
            )
    except Exception as e:
        return error_response(str(e), 500)


@lichlv_bp.route("/room/<string:phong_ma>/date-range", methods=["GET"])
def get_by_room_and_date_range(phong_ma):
    """Lấy lịch làm việc của phòng trong khoảng thời gian"""
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        if not start_date or not end_date:
            return error_response("Thiếu tham số start_date hoặc end_date", 400)

        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        if start > end:
            return error_response(
                "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc", 400
            )

        lichlv_list = lichlv_service.get_by_room_and_date_range(phong_ma, start, end)
        return success_response(lichlv_list)
    except Exception as e:
        return error_response(str(e), 500)


@lichlv_bp.route("/doctor/<string:nv_ma>/date/<string:nl_ngay>", methods=["GET"])
def get_by_doctor_and_date(nv_ma, nl_ngay):
    """Lấy lịch làm việc của bác sĩ theo ngày"""
    try:
        try:
            ngay = datetime.strptime(nl_ngay, "%Y-%m-%d").date()
        except ValueError:
            return error_response("Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400)

        lichlv_list = lichlv_service.get_by_doctor_and_date(nv_ma, ngay)
        return success_response(lichlv_list)
    except Exception as e:
        return error_response(str(e), 500)
