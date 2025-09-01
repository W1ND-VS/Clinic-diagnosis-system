from flask import Blueprint, request
from app.Services.ToaThuoc_service import ToaThuocService
from app.extensions import db
from app.utils.response_utils import success_response, error_response
from datetime import datetime

# Khởi tạo Blueprint và service
toathuoc_bp = Blueprint('toathuoc', __name__, url_prefix='/api/toathuoc')
toathuoc_service = ToaThuocService(db)

@toathuoc_bp.route('', methods=['GET'])
def get_all_prescriptions():
    """Lấy tất cả toa thuốc"""
    try:
        prescriptions = toathuoc_service.get_all()
        return success_response(prescriptions)
    except Exception as e:
        return error_response(str(e), 500)

@toathuoc_bp.route('/<string:tt_matthuoc>', methods=['GET'])
def get_prescription_by_id(tt_matthuoc):
    """Lấy toa thuốc theo mã"""
    try:
        prescription = toathuoc_service.get_by_id(tt_matthuoc)
        if not prescription:
            return error_response(f"Không tìm thấy toa thuốc với mã {tt_matthuoc}", 404)
        return success_response(prescription)
    except Exception as e:
        return error_response(str(e), 500)

@toathuoc_bp.route('/<string:tt_matthuoc>/details', methods=['GET'])
def get_prescription_with_details(tt_matthuoc):
    """Lấy toa thuốc kèm chi tiết"""
    try:
        prescription = toathuoc_service.get_prescription_with_details(tt_matthuoc)
        if not prescription:
            return error_response(f"Không tìm thấy toa thuốc với mã {tt_matthuoc}", 404)
        return success_response(prescription)
    except Exception as e:
        return error_response(str(e), 500)

@toathuoc_bp.route('/phieukham/<int:pk_ma>/<string:pk_ngaykham>', methods=['GET'])
def get_by_phieukham(pk_ma, pk_ngaykham):
    """Lấy toa thuốc theo phiếu khám"""
    try:
        
        prescriptions = toathuoc_service.get_by_phieu_kham(pk_ma, pk_ngaykham)
        
        return success_response(prescriptions)
    except Exception as e:
        return error_response(str(e), 500)

@toathuoc_bp.route('/benhnhan/<string:bn_ma>', methods=['GET'])
def get_by_patient(bn_ma):
    """Lấy toa thuốc theo bệnh nhân"""
    try:
        
        prescriptions = toathuoc_service.get_by_patient(bn_ma)
        return success_response(prescriptions)
    except Exception as e:
        return error_response(str(e), 500)

@toathuoc_bp.route('/doctor/<string:nv_ma>', methods=['GET'])
def get_by_doctor(nv_ma):
    """Lấy toa thuốc theo bác sĩ"""
    try:
        prescriptions = toathuoc_service.get_by_doctor(nv_ma)
        return success_response(prescriptions)
    except Exception as e:
        return error_response(str(e), 500)

@toathuoc_bp.route('/date-range', methods=['GET'])
def get_by_date_range():
    """Lấy toa thuốc theo khoảng thời gian"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            return error_response("Thiếu tham số start_date hoặc end_date", 400)
            
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return error_response("Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400)
            
        if start > end:
            return error_response("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc", 400)
            
        prescriptions = toathuoc_service.get_by_date_range(start, end)
        return success_response(prescriptions)
    except Exception as e:
        return error_response(str(e), 500)

@toathuoc_bp.route('create', methods=['POST'])
def create_prescription():
    """Tạo toa thuốc mới"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)
            
        prescription = toathuoc_service.create(data)
        if not prescription:
            return error_response("Không thể tạo toa thuốc", 500)
            
        return success_response(prescription, "Tạo toa thuốc thành công")
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)

@toathuoc_bp.route('/<string:tt_matthuoc>', methods=['PUT'])
def update_prescription(tt_matthuoc):
    """Cập nhật toa thuốc"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)
            
        prescription = toathuoc_service.update(tt_matthuoc, data)
        if not prescription:
            return error_response(f"Không thể cập nhật toa thuốc {tt_matthuoc}", 500)
            
        return success_response(prescription, "Cập nhật toa thuốc thành công")
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)

@toathuoc_bp.route('/<string:tt_matthuoc>', methods=['DELETE'])
def delete_prescription(tt_matthuoc):
    """Xóa toa thuốc"""
    try:
        result = toathuoc_service.delete(tt_matthuoc)
        if result:
            return success_response({"deleted": True}, "Xóa toa thuốc thành công")
        return error_response(f"Không thể xóa toa thuốc {tt_matthuoc}", 404)
    except Exception as e:
        return error_response(str(e), 500)

@toathuoc_bp.route('/statistics', methods=['GET'])
def get_prescription_statistics():
    """Lấy thống kê toa thuốc"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            return error_response("Thiếu tham số start_date hoặc end_date", 400)
            
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return error_response("Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400)
            
        if start > end:
            return error_response("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc", 400)
            
        statistics = toathuoc_service.get_prescription_statistics(start, end)
        return success_response(statistics)
    except Exception as e:
        return error_response(str(e), 500)