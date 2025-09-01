from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.Services.BenhNhan_service import BenhNhanService
from app.utils.response_utils import success_response
from app.extensions import db
import re

benhnhan = Blueprint("benhnhan", __name__, url_prefix="/api/benhnhan")


@benhnhan.route("/getall", methods=["GET"])
def get_all_benhnhan():
    try:
        result = BenhNhanService(db)
        benhnhan_list = result.get_all()
        return success_response([benhnhan.to_dict() for benhnhan in benhnhan_list])
    except Exception as e:
        return {"message": str(e)}, 500


@benhnhan.route("/create", methods=["POST"])
def create():
    try:
        data = request.get_json()
        if not data:
            return ({"message": "Invalid data"}, 400)

        # Ràng buộc: Số điện thoại không được chứa chữ cái và phải đủ 10 số
        sdt = data.get("bn_sdt")
        if sdt:
            if re.search(r"[A-Za-z]", sdt):
                return ({"message": "Số điện thoại không được chứa chữ cái"}, 400)
            if not re.fullmatch(r"\d{10}", sdt):
                return ({"message": "Số điện thoại phải đúng 10 chữ số"}, 400)

        # Ràng buộc: CCCD phải đúng 12 số và không chứa chữ cái
        cccd = data.get("bn_cccd")
        if cccd:
            if re.search(r"[A-Za-z]", cccd):
                return ({"message": "CCCD không được chứa chữ cái"}, 400)
            if not re.fullmatch(r"\d{12}", cccd):
                return ({"message": "CCCD phải đúng 12 chữ số"}, 400)

        benhnhan_service = BenhNhanService(db)

        # Nếu chưa có bn_ma thì tự động sinh mã mới
        if "bn_ma" not in data:
            data["bn_ma"] = benhnhan_service.get_max_bn_ma()

        password = data.get("bn_password")
        if password:
            pass  # Service sẽ tự hash password

        try:
            new_patient = benhnhan_service.create(data)
            return success_response(new_patient.to_dict())
        except ValueError as e:
            return ({"message": str(e)}, 400)
    except Exception as e:
        import traceback

        print(traceback.format_exc())
        return ({"message": str(e)}, 500)


@benhnhan.route("/getbyid/<bn_ma>", methods=["GET"])
def get_by_id(bn_ma):
    try:
        result = BenhNhanService(db)
        benhnhan = result.get_by_id(bn_ma)
        return success_response(benhnhan.to_dict())
    except Exception as e:
        return ({"message": str(e)}, 500)


@benhnhan.route("/<bn_ma>/medical-records", methods=["GET"])
def get_patient_medical_records(bn_ma):
    """Get all medical examination records for a patient"""
    try:
        result = BenhNhanService(db)
        medical_records = result.get_pk_by_id(bn_ma)

        return success_response(medical_records)

    except Exception as e:
        return {"message": str(e)}, 500


@benhnhan.route("/<bn_ma>/prescription-history", methods=["GET"])
def get_patient_prescription_history(bn_ma):

    try:
        result = BenhNhanService(db)
        prescription_history = result.get_chi_tiet_toa_thuoc_by_id(bn_ma)

        return success_response(prescription_history)

    except Exception as e:
        return {"message": str(e)}, 500


@benhnhan.route("/<bn_ma>/medical-services", methods=["GET"])
def get_patient_medical_services(bn_ma):
    """Get detailed medical service history for a patient"""
    try:
        result = BenhNhanService(db)
        medical_services = result.get_chi_tiet_chi_dinh_by_id(bn_ma)

        return success_response(medical_services)

    except Exception as e:
        return {"message": str(e)}, 500


@benhnhan.route("/with-converted-appointments", methods=["GET"])
def get_patients_with_converted_appointments():
    """Lấy danh sách bệnh nhân có phiếu hẹn đã chuyển thành phiếu khám"""
    try:
        # Lấy tham số từ query string
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        # Kiểm tra tham số bắt buộc
        if not start_date or not end_date:
            return {"message": "Thiếu tham số start_date hoặc end_date"}, 400

        # Khởi tạo service
        benhnhan_service = BenhNhanService(db)

        # Gọi service để lấy dữ liệu
        result = benhnhan_service.get_patients_with_converted_appointments(
            start_date, end_date
        )

        return success_response(result)
    except Exception as e:
        # Log lỗi chi tiết để dễ debug
        import traceback

        print(traceback.format_exc())
        return {"message": str(e)}, 500
