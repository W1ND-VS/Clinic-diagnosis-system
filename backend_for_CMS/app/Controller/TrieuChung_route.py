from flask import Blueprint, request
from app.Services.TrieuChung_service import TrieuChungService
from app.utils.response_utils import success_response, error_response
from app.extensions import db

trieuchung_bp = Blueprint('trieuchung', __name__, url_prefix='/api/trieuchung')
trieuchung_service = TrieuChungService(db)

@trieuchung_bp.route('getall', methods=['GET'])
def get_all():
    """Lấy tất cả các triệu chứng"""
    try:
        symptoms = trieuchung_service.get_all()
        return success_response([symptom.to_dict() for symptom in symptoms])
    except Exception as e:
        return error_response(str(e), 500)

@trieuchung_bp.route('/<int:id>', methods=['GET'])
def get_by_id(id):
    """Lấy triệu chứng theo ID"""
    try:
        symptom = trieuchung_service.get_by_id(id)
        if not symptom:
            return error_response(f"Không tìm thấy triệu chứng với ID: {id}", 404)
        return success_response(symptom.to_dict())
    except Exception as e:
        return error_response(str(e), 500)

@trieuchung_bp.route('/search', methods=['GET'])
def search():
    """Tìm kiếm triệu chứng theo tên"""
    try:
        name = request.args.get('name', '')
        if not name:
            return error_response("Thiếu tham số tìm kiếm 'name'", 400)
            
        symptoms = trieuchung_service.search_by_name(name)
        return success_response([symptom.to_dict() for symptom in symptoms])
    except Exception as e:
        return error_response(str(e), 500)

@trieuchung_bp.route('', methods=['POST'])
def create():
    """Tạo một triệu chứng mới"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)
        
        # Kiểm tra các trường bắt buộc
        if 'tc_ten' not in data:
            return error_response("Thiếu tên triệu chứng", 400)
            
        # Tự động tạo ID nếu không được cung cấp
        if 'tc_ma' not in data:
            data['tc_ma'] = trieuchung_service.get_max_tc_ma()
        
        new_symptom = trieuchung_service.create(data)
        if not new_symptom:
            return error_response("Không thể tạo triệu chứng", 500)
            
        return success_response(new_symptom.to_dict(), 201)
    except Exception as e:
        return error_response(str(e), 500)

@trieuchung_bp.route('/<int:id>', methods=['PUT'])
def update(id):
    """Cập nhật một triệu chứng hiện có"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)
            
        updated_symptom = trieuchung_service.update(id, data)
        if not updated_symptom:
            return error_response(f"Không tìm thấy triệu chứng với ID: {id}", 404)
            
        return success_response(updated_symptom.to_dict())
    except Exception as e:
        return error_response(str(e), 500)

@trieuchung_bp.route('/<int:id>', methods=['DELETE'])
def delete(id):
    """Xóa một triệu chứng"""
    try:
        result = trieuchung_service.delete(id)
        if not result:
            return error_response(f"Không tìm thấy triệu chứng với ID: {id} hoặc không thể xóa", 404)
            
        return success_response({"message": f"Đã xóa triệu chứng có ID: {id}"})
    except Exception as e:
        return error_response(str(e), 500)

@trieuchung_bp.route('/phieu-hen/<string:ph_ma>', methods=['GET'])
def get_by_phieu_hen(ph_ma):
    """Lấy tất cả triệu chứng của một phiếu hẹn"""
    try:
        symptoms = trieuchung_service.get_all_by_phieu_hen(ph_ma)
        if not symptoms:
            # Trả về list rỗng nếu không có triệu chứng
            return success_response([])
        return success_response([symptom.to_dict() for symptom in symptoms])
    except Exception as e:
        return error_response(str(e), 500)