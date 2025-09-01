from flask import Blueprint, request
from app.Services.PhieuCDDVYT_service import PhieuCDDVYTService
from app.extensions import db
from app.utils.response_utils import success_response, error_response
from datetime import datetime

# Khởi tạo Blueprint và service
phieu_cddvyt_bp = Blueprint('phieu_cddvyt', __name__, url_prefix='/api/phieu-cddvyt')
phieu_cddvyt_service = PhieuCDDVYTService(db)

@phieu_cddvyt_bp.route('', methods=['GET'])
def get_all_phieu_cddvyt():
    """Lấy tất cả phiếu chỉ định dịch vụ y tế"""
    try:
        phieu_list = phieu_cddvyt_service.get_all()
        return success_response([phieu.to_dict() for phieu in phieu_list])
    except Exception as e:
        return error_response(str(e), 500)

@phieu_cddvyt_bp.route('/paginated', methods=['GET'])
def get_paginated_phieu_cddvyt():
    """Lấy danh sách phiếu chỉ định có phân trang"""
    try:
        # Lấy tham số phân trang
        offset = request.args.get('offset', default=0, type=int)
        limit = request.args.get('limit', default=10, type=int)
        
        # Lấy các tham số lọc
        filters = {}
        
        pk_ma = request.args.get('pk_ma')
        if pk_ma:
            filters['pk_ma'] = int(pk_ma)
        
        pk_ngaykham = request.args.get('pk_ngaykham')
        if pk_ngaykham:
            try:
                filters['pk_ngaykham'] = datetime.strptime(pk_ngaykham, "%Y-%m-%d").date()
            except ValueError:
                return error_response("Định dạng pk_ngaykham không hợp lệ. Sử dụng YYYY-MM-DD", 400)
        
        dvyt_ma = request.args.get('dvyt_ma')
        if dvyt_ma:
            filters['dvyt_ma'] = dvyt_ma
            
        pcd_trangthai = request.args.get('pcd_trangthai')
        if pcd_trangthai:
            filters['pcd_trangthai'] = pcd_trangthai
            
        nv_ma = request.args.get('nv_ma')
        if nv_ma:
            filters['nv_ma'] = nv_ma
            
        from_date = request.args.get('from_date')
        if from_date:
            try:
                filters['from_date'] = datetime.strptime(from_date, "%Y-%m-%d")
            except ValueError:
                return error_response("Định dạng from_date không hợp lệ. Sử dụng YYYY-MM-DD", 400)
                
        to_date = request.args.get('to_date')
        if to_date:
            try:
                filters['to_date'] = datetime.strptime(to_date, "%Y-%m-%d")
            except ValueError:
                return error_response("Định dạng to_date không hợp lệ. Sử dụng YYYY-MM-DD", 400)
        
        result = phieu_cddvyt_service.get_paginated(offset, limit, filters)
        return success_response(result)
    except Exception as e:
        return error_response(str(e), 500)

@phieu_cddvyt_bp.route('/<string:pcd_ma>', methods=['GET'])
def get_phieu_cddvyt_by_id(pcd_ma):
    """Lấy phiếu chỉ định theo mã"""
    try:
        phieu = phieu_cddvyt_service.get_by_id(pcd_ma)
        if not phieu:
            return error_response(f"Không tìm thấy phiếu chỉ định với mã {pcd_ma}", 404)
        
        return success_response(phieu.to_dict())
    except Exception as e:
        return error_response(str(e), 500)

@phieu_cddvyt_bp.route('/<string:pcd_ma>/with-results', methods=['GET'])
def get_phieu_cddvyt_with_results(pcd_ma):
    """Lấy phiếu chỉ định kèm kết quả"""
    try:
        result = phieu_cddvyt_service.get_with_results(pcd_ma)
        return success_response(result)
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(str(e), 500)

@phieu_cddvyt_bp.route('/phieukham/<int:pk_ma>/<string:pk_ngaykham>', methods=['GET'])
def get_by_phieukham(pk_ma, pk_ngaykham):
    """Lấy tất cả phiếu chỉ định của một phiếu khám"""
    try:
        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            ngay_kham = datetime.strptime(pk_ngaykham, "%Y-%m-%d").date()
        except ValueError:
            return error_response("Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400)
        
        phieu_list = phieu_cddvyt_service.get_by_phieukham(pk_ma, ngay_kham)
        return success_response([phieu.to_dict() for phieu in phieu_list])
    except Exception as e:
        return error_response(str(e), 500)

@phieu_cddvyt_bp.route('/dichvu/<string:dvyt_ma>', methods=['GET'])
def get_by_dichvu(dvyt_ma):
    """Lấy tất cả phiếu chỉ định có dịch vụ y tế cụ thể"""
    try:
        phieu_list = phieu_cddvyt_service.get_by_dichvu(dvyt_ma)
        return success_response([phieu.to_dict() for phieu in phieu_list])
    except Exception as e:
        return error_response(str(e), 500)

@phieu_cddvyt_bp.route('/date-range', methods=['GET'])
def get_by_date_range():
    """Lấy phiếu chỉ định trong khoảng thời gian"""
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
        
        phieu_list = phieu_cddvyt_service.get_by_date_range(start, end)
        return success_response([phieu.to_dict() for phieu in phieu_list])
    except Exception as e:
        return error_response(str(e), 500)

@phieu_cddvyt_bp.route('', methods=['POST'])
def create_phieu_cddvyt():
    """Tạo phiếu chỉ định dịch vụ y tế mới"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)
        
        # Kiểm tra dữ liệu bắt buộc
        required_fields = ['pk_ma', 'pk_ngaykham']
        for field in required_fields:
            if field not in data or data[field] is None:
                return error_response(f"Thiếu thông tin bắt buộc: {field}", 400)
        
        phieu = phieu_cddvyt_service.create(data)
        return success_response(phieu.to_dict(), "Tạo phiếu chỉ định thành công")
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)

@phieu_cddvyt_bp.route('/<string:pcd_ma>', methods=['PUT'])
def update_phieu_cddvyt(pcd_ma):
    """Cập nhật phiếu chỉ định dịch vụ y tế"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)
        
        phieu = phieu_cddvyt_service.update(pcd_ma, data)
        return success_response(phieu.to_dict(), "Cập nhật phiếu chỉ định thành công")
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)

@phieu_cddvyt_bp.route('/<string:pcd_ma>', methods=['DELETE'])
def delete_phieu_cddvyt(pcd_ma):
    """Xóa phiếu chỉ định dịch vụ y tế"""
    try:
        result = phieu_cddvyt_service.delete(pcd_ma)
        if result:
            return success_response({"deleted": True}, "Xóa phiếu chỉ định thành công")
        else:
            return error_response("Không thể xóa phiếu chỉ định", 500)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)

@phieu_cddvyt_bp.route('/<string:pcd_ma>/complete', methods=['POST'])
def complete_phieu_cddvyt(pcd_ma):
    """Hoàn thành phiếu chỉ định và cập nhật kết quả"""
    try:
        data = request.get_json()
        if not data:
            data = {}
        
        phieu = phieu_cddvyt_service.complete_prescription(pcd_ma, data)
        return success_response(phieu.to_dict(), "Hoàn thành phiếu chỉ định thành công")
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)

@phieu_cddvyt_bp.route('/calculate/<string:pcd_ma>/', methods=['POST'])
def calculate_phieu_cddvyt(pcd_ma):
    """Tính toán phiếu chỉ định dịch vụ y tế"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)

        phieu = phieu_cddvyt_service.calculate(pcd_ma, data)
        return success_response(phieu.to_dict(), "Tính toán phiếu chỉ định thành công")
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)