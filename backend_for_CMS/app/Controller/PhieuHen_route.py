from app.Model import PhieuKham
from app.constants.phieu_hen_status import PhieuHenStatus
from flask import Blueprint, request
from app.Services.PhieuHen_service import PhieuHenService
from app.Services.PhieuKham_service import PhieuKhamService
from app.utils.response_utils import success_response, error_response
from app.extensions import db
from datetime import datetime, date

phieuhen_bp = Blueprint("phieuhen", __name__, url_prefix="/api/phieuhen")
phieuhen_service = PhieuHenService(db)


@phieuhen_bp.route("getall", methods=["GET"])
def get_all_appointments():
    """Lấy tất cả phiếu hẹn"""
    try:
        date_str = request.args.get("date")
        if date_str:
            appointment_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            appointments = phieuhen_service.get_all(appointment_date)
        else:
            appointments = phieuhen_service.get_all(date.today())
        return success_response([appointment.to_dict() for appointment in appointments])
    except Exception as e:
        return error_response(str(e), 500)


@phieuhen_bp.route("/<string:ph_ma>", methods=["GET"])
def get_appointment_by_id(ph_ma):
    """Lấy phiếu hẹn theo mã"""
    try:
        appointment = phieuhen_service.get_by_id(ph_ma)
        if not appointment:
            return error_response(f"Không tìm thấy phiếu hẹn với mã: {ph_ma}", 404)
        return success_response(appointment.to_dict())
    except Exception as e:
        return error_response(str(e), 500)


@phieuhen_bp.route("/benhnhan/<string:bn_ma>", methods=["GET"])
def get_appointments_by_patient(bn_ma):
    """Lấy phiếu hẹn theo mã bệnh nhân"""
    try:
        appointments = phieuhen_service.get_by_patient(bn_ma)
        return success_response([appointment.to_dict() for appointment in appointments])
    except Exception as e:
        return error_response(str(e), 500)


@phieuhen_bp.route("/bacsi/<string:nv_ma>", methods=["GET"])
def get_appointments_by_doctor(nv_ma):
    """Lấy phiếu hẹn theo mã bác sĩ"""
    try:
        appointments = phieuhen_service.get_by_doctor(nv_ma)
        return success_response([appointment.to_dict() for appointment in appointments])
    except Exception as e:
        return error_response(str(e), 500)


@phieuhen_bp.route("/ngaybacsi/<string:nv_ma>", methods=["GET"])
def get_appointments_by_day_and_doctor(nv_ma):
    """Lấy phiếu hẹn theo ngày và bác sĩ"""
    try:
        # Parse query parameters
        appointment_date_str = request.args.get("date")

        if not appointment_date_str or not nv_ma:
            return error_response("Thiếu thông tin ngày hoặc bác sĩ", 400)

        appointment_date = datetime.strptime(appointment_date_str, "%Y-%m-%d").date()
        appointments = phieuhen_service.get_by_day_and_doctor(appointment_date, nv_ma)
        return success_response([appointment.to_dict() for appointment in appointments])
    except ValueError:
        return error_response(
            "Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD", 400
        )
    except Exception as e:
        return error_response(str(e), 500)


@phieuhen_bp.route("create", methods=["POST"])
def create_appointment():
    """Tạo phiếu hẹn mới"""
    try:
        data = request.get_json()

        # Kiểm tra dữ liệu
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)

        # Kiểm tra các trường bắt buộc
        required_fields = ["bn_ma", "nv_ma", "ph_ngayhen"]
        for field in required_fields:
            if field not in data:
                return error_response(f"Thiếu trường bắt buộc: {field}", 400)

        # Tự tạo mã phiếu hẹn nếu chưa có
        if "ph_ma" not in data:
            data["ph_ma"] = phieuhen_service.get_max_ph_ma()

        # Chuyển đổi định dạng ngày và giờ
        if isinstance(data["ph_ngayhen"], str):
            try:
                data["ph_ngayhen"] = datetime.strptime(
                    data["ph_ngayhen"], "%Y-%m-%d"
                ).date()
            except ValueError:
                return error_response(
                    "Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD",
                    400,
                )

        if "ph_giohen" in data and isinstance(data["ph_giohen"], str):
            try:
                time_parts = data["ph_giohen"].split(":")
                hours = int(time_parts[0])
                minutes = int(time_parts[1])
                data["ph_giohen"] = datetime.strptime(
                    f"{hours:02d}:{minutes:02d}", "%H:%M"
                ).time()
            except (ValueError, IndexError):
                return error_response(
                    "Định dạng giờ không hợp lệ. Vui lòng sử dụng định dạng HH:MM", 400
                )

        if "ph_gioketthuc" in data and isinstance(data["ph_gioketthuc"], str):
            try:
                time_parts = data["ph_gioketthuc"].split(":")
                hours = int(time_parts[0])
                minutes = int(time_parts[1])
                data["ph_gioketthuc"] = datetime.strptime(
                    f"{hours:02d}:{minutes:02d}", "%H:%M"
                ).time()
            except (ValueError, IndexError):
                return error_response("Định dạng giờ kết thúc không hợp lệ", 400)

        try:
            # Tạo phiếu hẹn mới
            new_appointment = phieuhen_service.create(data)
            return success_response(new_appointment.to_dict(), 201)
        except ValueError as e:
            return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)

@phieuhen_bp.route("/update-symptoms-from-phieukham", methods=["PUT"])
def update_symptoms_from_phieukham():
    """
    Cập nhật triệu chứng cho phiếu hẹn dựa trên phiếu khám.
    Body: {
        "pk_ma": "PK000001",
        "pk_ngaykham": "2025-08-17",
        "trieu_chung_list": ["TC01", "TC02", ...]
    }
    """
    try:
        data = request.get_json()
        pk_ma = data.get("pk_ma")
        pk_ngaykham = data.get("pk_ngaykham")
        trieu_chung_list = data.get("trieu_chung_list")

        if not pk_ma or not pk_ngaykham or not isinstance(trieu_chung_list, list):
            return error_response("Thiếu hoặc sai định dạng dữ liệu đầu vào", 400)

        # Chuyển đổi ngày khám sang kiểu date nếu là string
        if isinstance(pk_ngaykham, str):
            try:
                pk_ngaykham = datetime.strptime(pk_ngaykham, "%Y-%m-%d").date()
            except ValueError:
                return error_response("Định dạng ngày không hợp lệ. Dùng YYYY-MM-DD", 400)

        result = phieuhen_service.update_symptoms_from_phieukham(pk_ma, pk_ngaykham, trieu_chung_list)
        if result:
            return success_response({"message": "Cập nhật triệu chứng thành công"})
        else:
            return error_response("Cập nhật triệu chứng thất bại", 400)
    except Exception as e:
        return error_response(str(e), 500)

@phieuhen_bp.route("/<string:ph_ma>", methods=["PUT"])
def update_appointment(ph_ma):
    """Cập nhật thông tin phiếu hẹn"""
    try:
        data = request.get_json()

        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)

        # Chuyển đổi định dạng ngày và giờ nếu có
        if "ph_ngayhen" in data and isinstance(data["ph_ngayhen"], str):
            try:
                data["ph_ngayhen"] = datetime.strptime(
                    data["ph_ngayhen"], "%Y-%m-%d"
                ).date()
            except ValueError:
                return error_response(
                    "Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD",
                    400,
                )

        if "ph_giohen" in data and isinstance(data["ph_giohen"], str):
            try:
                time_parts = data["ph_giohen"].split(":")
                hours = int(time_parts[0])
                minutes = int(time_parts[1])
                data["ph_giohen"] = datetime.strptime(
                    f"{hours:02d}:{minutes:02d}", "%H:%M"
                ).time()
            except (ValueError, IndexError):
                return error_response(
                    "Định dạng giờ không hợp lệ. Vui lòng sử dụng định dạng HH:MM", 400
                )

        try:
            updated_appointment = phieuhen_service.update(ph_ma, data)
            if not updated_appointment:
                return error_response(f"Không tìm thấy phiếu hẹn với mã: {ph_ma}", 404)
            return success_response(updated_appointment.to_dict())
        except ValueError as e:
            return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@phieuhen_bp.route("/cancel/<string:ph_ma>", methods=["DELETE"])
def delete_appointment(ph_ma):
    """Xóa phiếu hẹn"""
    try:
        result = phieuhen_service.delete(ph_ma)
        if not result:
            return error_response(f"Không tìm thấy phiếu hẹn với mã: {ph_ma}", 404)
        return success_response({"message": f"Đã xóa phiếu hẹn có mã: {ph_ma}"})
    except Exception as e:
        return error_response(str(e), 500)


@phieuhen_bp.route("/available-slots", methods=["GET"])
def get_available_slots():
    """Lấy các khung giờ trống của bác sĩ trong ngày"""
    try:
        doctor_id = request.args.get("doctor_id")
        date_str = request.args.get("date")

        if not doctor_id or not date_str:
            return error_response("Thiếu tham số doctor_id hoặc date", 400)

        # Chuyển đổi ngày
        try:
            appointment_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD",
                400,
            )

        # Lấy các khung giờ trống
        available_slots = phieuhen_service.get_available_slots(
            doctor_id, appointment_date
        )

        # Chuyển thành chuỗi để trả về
        available_slots_str = [slot.strftime("%H:%M") for slot in available_slots]

        return success_response({"available_slots": available_slots_str})
    except Exception as e:
        return error_response(str(e), 500)


@phieuhen_bp.route("/upcoming", methods=["GET"])
def get_upcoming_appointments():
    """Lấy các cuộc hẹn sắp tới"""
    try:
        # Lấy số ngày từ query parameter, mặc định là 7
        days = request.args.get("days", default=7, type=int)

        appointments = phieuhen_service.get_upcoming_appointments(days)
        return success_response([appointment.to_dict() for appointment in appointments])
    except Exception as e:
        return error_response(str(e), 500)


@phieuhen_bp.route("/huy-hen/<string:ph_ma>", methods=["PUT"])
def cancel_appointment(ph_ma):
    """Hủy hẹn một phiếu hẹn"""
    try:
        # Xử lý data linh hoạt
        data = {}
        try:
            if request.is_json:
                data = request.get_json() or {}
            elif request.data:
                # Force parse JSON
                import json

                data = json.loads(request.data.decode("utf-8")) or {}
            else:
                data = {}
        except (json.JSONDecodeError, UnicodeDecodeError):
            data = {}

        # Kiểm tra phiếu hẹn có tồn tại không
        appointment = phieuhen_service.get_by_id(ph_ma)
        if not appointment:
            return error_response(f"Không tìm thấy phiếu hẹn với mã: {ph_ma}", 404)

        # Kiểm tra trạng thái hiện tại có thể hủy không
        current_status = appointment.ph_trangthai
        if current_status in [PhieuHenStatus.DA_HUY]:
            return error_response(
                f"Không thể hủy phiếu hẹn với trạng thái hiện tại: {current_status}",
                400,
            )

        # Fix: Tạo instance của PhieuKhamService
        phieukham_service = PhieuKhamService(db)
        phieu_kham = phieukham_service.get_by_phieuhen(ph_ma)
        if phieu_kham:
            return error_response(
                "Không thể hủy phiếu hẹn đã có phiếu khám liên quan", 400
            )

        # Cập nhật trạng thái thành "Đã hủy"
        result = phieuhen_service.update_status(ph_ma, PhieuHenStatus.DA_HUY)

        if result:
            response_data = {
                "ph_ma": ph_ma,
                "old_status": current_status,
                "new_status": PhieuHenStatus.DA_HUY,
                "ly_do_huy": data.get("ly_do_huy", "Hủy bởi hệ thống"),
                "message": f"Đã hủy phiếu hẹn {ph_ma} thành công",
            }

            return success_response(response_data)
        else:
            return error_response("Không thể hủy phiếu hẹn", 500)

    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(f"Lỗi khi hủy phiếu hẹn: {str(e)}", 500)
