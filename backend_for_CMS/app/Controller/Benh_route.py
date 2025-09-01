from flask import Blueprint, request, jsonify
from app.Services.Benh_service import BenhService
from app.extensions import db
from app.utils.response_utils import success_response, error_response
from datetime import datetime

# Khởi tạo Blueprint và service
benh_bp = Blueprint('benh', __name__, url_prefix='/api/benh')
benh_service = BenhService(db)

@benh_bp.route('', methods=['GET'])
def get_all_diseases():
    """Lấy danh sách tất cả bệnh"""
    try:
        diseases = benh_service.get_all()
        return success_response(diseases)
    except Exception as e:
        return error_response(str(e), 500)

@benh_bp.route('/<string:b_ma>', methods=['GET'])
def get_disease_by_id(b_ma):
    """Lấy bệnh theo mã"""
    try:
        disease = benh_service.get_by_id(b_ma)
        if not disease:
            return error_response(f"Không tìm thấy bệnh với mã {b_ma}", 404)
        return success_response(disease)
    except Exception as e:
        return error_response(str(e), 500)

@benh_bp.route('/name/<string:b_ten>', methods=['GET'])
def get_disease_by_name(b_ten):
    """Lấy bệnh theo tên"""
    try:
        disease = benh_service.get_by_name(b_ten)
        if not disease:
            return error_response(f"Không tìm thấy bệnh với tên {b_ten}", 404)
        return success_response(disease)
    except Exception as e:
        return error_response(str(e), 500)

@benh_bp.route('/search', methods=['GET'])
def search_diseases():
    """Tìm kiếm bệnh theo tên"""
    try:
        name = request.args.get('name', '')
        diseases = benh_service.search_by_name(name)
        return success_response(diseases)
    except Exception as e:
        return error_response(str(e), 500)

@benh_bp.route('/prescription/<string:tt_matthuoc>', methods=['GET'])
def get_by_prescription(tt_matthuoc):
    """Lấy danh sách bệnh theo mã toa thuốc"""
    try:
        diseases = benh_service.get_by_prescription(tt_matthuoc)
        return success_response(diseases)
    except Exception as e:
        return error_response(str(e), 500)

@benh_bp.route('/patient/<string:bn_ma>', methods=['GET'])
def get_by_patient(bn_ma):
    """Lấy danh sách bệnh theo mã bệnh nhân"""
    try:
        diseases = benh_service.get_by_patient(bn_ma)
        return success_response(diseases)
    except Exception as e:
        return error_response(str(e), 500)

@benh_bp.route('', methods=['POST'])
def create_disease():
    """Tạo mới bệnh"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)
            
        disease = benh_service.create(data)
        if not disease:
            return error_response("Không thể tạo bệnh", 500)
            
        return success_response(disease, "Tạo bệnh thành công")
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)

@benh_bp.route('/<string:b_ma>', methods=['PUT'])
def update_disease(b_ma):
    """Cập nhật thông tin bệnh"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)
            
        disease = benh_service.update(b_ma, data)
        if not disease:
            return error_response(f"Không thể cập nhật bệnh {b_ma}", 404)
            
        return success_response(disease, "Cập nhật bệnh thành công")
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)

@benh_bp.route('/<string:b_ma>', methods=['DELETE'])
def delete_disease(b_ma):
    """Xóa bệnh"""
    try:
        result = benh_service.delete(b_ma)
        if result:
            return success_response({"deleted": True}, "Xóa bệnh thành công")
        return error_response(f"Không thể xóa bệnh {b_ma}", 404)
    except Exception as e:
        return error_response(str(e), 500)

@benh_bp.route('/common', methods=['GET'])
def get_common_diseases():
    """Lấy danh sách bệnh phổ biến"""
    try:
        limit = request.args.get('limit', 10, type=int)
        diseases = benh_service.get_common_diseases(limit)
        return success_response(diseases)
    except Exception as e:
        return error_response(str(e), 500)

@benh_bp.route('/date-range', methods=['GET'])
def get_by_date_range():
    """Lấy danh sách bệnh theo khoảng thời gian"""
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
            
        diseases = benh_service.get_by_date_range(start, end)
        return success_response(diseases)
    except Exception as e:
        return error_response(str(e), 500)

@benh_bp.route('/statistics', methods=['GET'])
def get_disease_statistics():
    """Lấy thống kê bệnh theo khoảng thời gian"""
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
            
        statistics = benh_service.get_disease_statistics(start, end)
        return success_response(statistics)
    except Exception as e:
        return error_response(str(e), 500)