from flask import Blueprint, request, jsonify
from app.Services.DangKyLichLam_service import DangKyLichLamService
from app.extensions import db
from app.utils.response_utils import success_response, error_response
from datetime import datetime

# Khởi tạo Blueprint và service
dangky_bp = Blueprint('dangky', __name__, url_prefix='/api/dangky-lich')
dangky_service = DangKyLichLamService(db)

@dangky_bp.route('', methods=['GET'])
def get_all_registrations():
    """Lấy tất cả đăng ký lịch làm"""
    try:
        registrations = dangky_service.get_all()
        return success_response(registrations)
    except Exception as e:
        return error_response(str(e), 500)

@dangky_bp.route('/doctor/<string:nv_ma>', methods=['GET'])
def get_by_doctor(nv_ma):
    """Lấy đăng ký theo bác sĩ"""
    try:
        registrations = dangky_service.get_by_doctor(nv_ma)
        return success_response(registrations)
    except Exception as e:
        return error_response(str(e), 500)

@dangky_bp.route('/date/<string:nl_ngay>', methods=['GET'])
def get_by_date(nl_ngay):
    """Lấy đăng ký theo ngày"""
    try:
        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            ngay = datetime.strptime(nl_ngay, "%Y-%m-%d").date()
        except ValueError:
            return error_response("Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400)
            
        registrations = dangky_service.get_by_date(ngay)
        return success_response(registrations)
    except Exception as e:
        return error_response(str(e), 500)

@dangky_bp.route('/shift/<int:clv_stt>', methods=['GET'])
def get_by_shift(clv_stt):
    """Lấy đăng ký theo ca làm việc"""
    try:
        registrations = dangky_service.get_by_shift(clv_stt)
        return success_response(registrations)
    except Exception as e:
        return error_response(str(e), 500)

@dangky_bp.route('/date/<string:nl_ngay>/shift/<int:clv_stt>/department/<string:department_id>', methods=['GET'])
def get_by_date_and_shift_department(nl_ngay, clv_stt, department_id):
    """Lấy đăng ký theo ngày và ca làm việc"""
    try:
        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            ngay = datetime.strptime(nl_ngay, "%Y-%m-%d").date()
        except ValueError:
            return error_response("Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400)

        registrations = dangky_service.get_by_date_and_shift_department(ngay, clv_stt, department_id)
        return success_response(registrations)
    except Exception as e:
        return error_response(str(e), 500)

@dangky_bp.route('/date-range', methods=['GET'])
def get_by_date_range():
    """Lấy đăng ký theo khoảng thời gian"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            return error_response("Thiếu tham số start_date hoặc end_date", 400)
            
        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return error_response("Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400)
            
        if start > end:
            return error_response("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc", 400)
            
        registrations = dangky_service.get_by_date_range(start, end)
        return success_response(registrations)
    except Exception as e:
        return error_response(str(e), 500)

@dangky_bp.route('/doctor/<string:nv_ma>/date-range', methods=['GET'])
def get_by_doctor_and_date_range(nv_ma):
    """Lấy đăng ký của bác sĩ theo khoảng thời gian"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            return error_response("Thiếu tham số start_date hoặc end_date", 400)
            
        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return error_response("Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400)
            
        if start > end:
            return error_response("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc", 400)
            
        registrations = dangky_service.get_by_doctor_and_date_range(nv_ma, start, end)
        return success_response(registrations)
    except Exception as e:
        return error_response(str(e), 500)

@dangky_bp.route('create', methods=['POST'])
def create_registration():
    """Tạo đăng ký lịch làm mới"""
    try:
        data = request.get_json()
        print(data)
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)
            
        # Kiểm tra dữ liệu bắt buộc
        if not all(key in data for key in ['nl_ngay', 'clv_stt', 'nv_ma']):
            return error_response("Thiếu thông tin bắt buộc (nl_ngay, clv_stt, nv_ma)", 400)
            
        registration = dangky_service.create(data)
        return success_response(registration.to_dict())
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)

@dangky_bp.route('/delete', methods=['DELETE'])
def delete_registration():
    """Xóa đăng ký lịch làm"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)
            
        # Kiểm tra dữ liệu bắt buộc
        if not all(key in data for key in ['nl_ngay', 'clv_stt', 'nv_ma']):
            return error_response("Thiếu thông tin bắt buộc (nl_ngay, clv_stt, nv_ma)", 400)
            
        nl_ngay = data.get('nl_ngay')
        clv_stt = data.get('clv_stt')
        nv_ma = data.get('nv_ma')
        
        result = dangky_service.delete(nl_ngay, clv_stt, nv_ma)
        return success_response({"success": result})
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)

@dangky_bp.route('/convert-to-schedule', methods=['POST'])
def convert_to_schedule():
    """Chuyển đăng ký thành lịch làm việc"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)
            
        # Kiểm tra dữ liệu bắt buộc
        if not all(key in data for key in ['nl_ngay', 'clv_stt', 'nv_ma', 'phong_ma']):
            return error_response("Thiếu thông tin bắt buộc (nl_ngay, clv_stt, nv_ma, phong_ma)", 400)
            
        nl_ngay = data.get('nl_ngay')
        clv_stt = data.get('clv_stt')
        nv_ma = data.get('nv_ma')
        phong_ma = data.get('phong_ma')
        
        schedule = dangky_service.convert_to_schedule(nl_ngay, clv_stt, nv_ma, phong_ma)
        return success_response(schedule.to_dict())
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)

@dangky_bp.route('/batch-convert', methods=['POST'])
def batch_convert():
    """Chuyển đổi hàng loạt đăng ký thành lịch làm việc"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)
            
        # Kiểm tra dữ liệu bắt buộc
        if not all(key in data for key in ['nl_ngay', 'clv_stt', 'assignments']):
            return error_response("Thiếu thông tin bắt buộc (nl_ngay, clv_stt, assignments)", 400)
            
        nl_ngay = data.get('nl_ngay')
        clv_stt = data.get('clv_stt')
        assignments = data.get('assignments')
        
        # Kiểm tra assignments có phải là danh sách không
        if not isinstance(assignments, list):
            return error_response("assignments phải là danh sách các gán phòng", 400)
            
        # Kiểm tra mỗi phần tử trong assignments có đúng định dạng không
        for assignment in assignments:
            if not isinstance(assignment, dict) or 'nv_ma' not in assignment or 'phong_ma' not in assignment:
                return error_response("Mỗi phần tử trong assignments phải có nv_ma và phong_ma", 400)
                
        results = dangky_service.batch_convert_to_schedule(nl_ngay, clv_stt, assignments)
        return success_response(results)
    except Exception as e:
        return error_response(str(e), 500)

@dangky_bp.route('/statistics', methods=['GET'])
def get_statistics():
    """Lấy thống kê về đăng ký và lịch làm việc"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            return error_response("Thiếu tham số start_date hoặc end_date", 400)
            
        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return error_response("Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400)
            
        if start > end:
            return error_response("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc", 400)
            
        statistics = dangky_service.get_schedule_statistics(start, end)
        return success_response(statistics)
    except Exception as e:
        return error_response(str(e), 500)