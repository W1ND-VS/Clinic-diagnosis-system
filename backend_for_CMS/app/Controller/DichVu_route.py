from flask import Blueprint, request, jsonify
from app.Services.DichVu_service import DichVuService
from app.extensions import db
from app.utils.response_utils import success_response, error_response
from datetime import datetime
from flask_jwt_extended import jwt_required

# Khởi tạo Blueprint
dichvu_bp = Blueprint("dichvu", __name__, url_prefix="/api/dichvu")

# Khởi tạo service
dichvu_service = DichVuService(db)


@dichvu_bp.route("getall", methods=["GET"])
def get_all():
    """Lấy tất cả dịch vụ y tế kèm đơn giá hiện tại"""
    try:
        dich_vu_list = dichvu_service.get_all()
        # Trả về trực tiếp kết quả vì đã là danh sách dictionary
        return success_response(dich_vu_list)
    except Exception as e:
        return error_response(str(e), 500)


@dichvu_bp.route("/with-price", methods=["GET"])
def get_all_with_price():
    """Lấy tất cả dịch vụ y tế kèm đơn giá hiện tại"""
    try:
        result = dichvu_service.get_all_with_current_price()
        return success_response(result)
    except Exception as e:
        return error_response(str(e), 500)


@dichvu_bp.route("/<string:dvyt_ma>", methods=["GET"])
def get_by_id(dvyt_ma):
    """Lấy dịch vụ y tế theo mã"""
    try:
        dich_vu = dichvu_service.get_by_id(dvyt_ma)
        if not dich_vu:
            return error_response(f"Không tìm thấy dịch vụ y tế với mã {dvyt_ma}", 404)

        return success_response(
            dich_vu.to_dict() if hasattr(dich_vu, "to_dict") else dich_vu
        )
    except Exception as e:
        return error_response(str(e), 500)



@dichvu_bp.route("", methods=["POST"])
@jwt_required()
def create():
    """Tạo mới dịch vụ y tế"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)

        # Kiểm tra dữ liệu đầu vào
        if not data.get("dvyt_ma") or not data.get("dvyt_ten"):
            return error_response("Mã và tên dịch vụ là bắt buộc", 400)

        # Xử lý ngày áp dụng nếu có
        if data.get("nad_ngay"):
            try:
                data["nad_ngay"] = datetime.strptime(
                    data["nad_ngay"], "%Y-%m-%d"
                ).date()
            except ValueError:
                return error_response(
                    "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
                )

        # Tạo dịch vụ mới
        try:
            dich_vu = dichvu_service.create(data)
            return success_response(
                dich_vu.to_dict() if hasattr(dich_vu, "to_dict") else dich_vu, 201
            )
        except ValueError as e:
            return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@dichvu_bp.route("/<string:dvyt_ma>", methods=["PUT"])
@jwt_required()
def update(dvyt_ma):
    """Cập nhật dịch vụ y tế"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)

        # Cập nhật dịch vụ
        try:
            dich_vu = dichvu_service.update(dvyt_ma, data)
            return success_response(
                dich_vu.to_dict() if hasattr(dich_vu, "to_dict") else dich_vu
            )
        except ValueError as e:
            return error_response(str(e), 404)
    except Exception as e:
        return error_response(str(e), 500)


@dichvu_bp.route("/<string:dvyt_ma>", methods=["DELETE"])
@jwt_required()
def delete(dvyt_ma):
    """Xóa dịch vụ y tế"""
    try:
        # Xóa dịch vụ
        try:
            result = dichvu_service.delete(dvyt_ma)
            if result:
                return success_response(
                    {"message": f"Đã xóa dịch vụ y tế với mã {dvyt_ma}"}
                )
            else:
                return error_response(
                    f"Không thể xóa dịch vụ y tế với mã {dvyt_ma}", 400
                )
        except ValueError as e:
            return error_response(str(e), 404)
    except Exception as e:
        return error_response(str(e), 500)


@dichvu_bp.route("/<string:dvyt_ma>/price", methods=["GET"])
def get_current_price(dvyt_ma):
    """Lấy đơn giá hiện tại của dịch vụ y tế"""
    try:
        # Kiểm tra dịch vụ có tồn tại không
        dich_vu = dichvu_service.get_by_id(dvyt_ma)
        if not dich_vu:
            return error_response(f"Không tìm thấy dịch vụ y tế với mã {dvyt_ma}", 404)

        # Lấy đơn giá hiện tại
        price = dichvu_service.get_current_price(dvyt_ma)
        return success_response({"dvyt_ma": dvyt_ma, "gia_hien_tai": price})
    except Exception as e:
        return error_response(str(e), 500)


@dichvu_bp.route("/<string:dvyt_ma>/price-history", methods=["GET"])
def get_price_history(dvyt_ma):
    """Lấy lịch sử đơn giá của dịch vụ y tế"""
    try:
        # Kiểm tra dịch vụ có tồn tại không
        dich_vu = dichvu_service.get_by_id(dvyt_ma)
        if not dich_vu:
            return error_response(f"Không tìm thấy dịch vụ y tế với mã {dvyt_ma}", 404)

        # Lấy lịch sử đơn giá
        price_history = dichvu_service.get_price_history(dvyt_ma)

        # Chuyển đổi kết quả thành dict
        result = []
        for price in price_history:
            price_dict = {
                "dvyt_ma": price.dvyt_ma,
                "nad_ngay": (
                    price.nad_ngay.strftime("%Y-%m-%d") if price.nad_ngay else None
                ),
                "dgdv_dongia": price.dgdv_dongia,
            }
            result.append(price_dict)

        return success_response(result)
    except Exception as e:
        return error_response(str(e), 500)


@dichvu_bp.route("/<string:dvyt_ma>/price", methods=["POST"])
@jwt_required()
def update_price(dvyt_ma):
    """Cập nhật đơn giá cho dịch vụ y tế"""
    try:
        data = request.get_json()
        if not data or "dgdv_dongia" not in data:
            return error_response("Đơn giá là bắt buộc", 400)

        # Xử lý ngày áp dụng nếu có
        nad_ngay = None
        if data.get("nad_ngay"):
            try:
                nad_ngay = datetime.strptime(data["nad_ngay"], "%Y-%m-%d").date()
            except ValueError:
                return error_response(
                    "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
                )

        # Cập nhật đơn giá
        try:
            dongia = dichvu_service.update_price(
                dvyt_ma, int(data["dgdv_dongia"]), nad_ngay
            )

            result = {
                "dvyt_ma": dongia.dvyt_ma,
                "nad_ngay": (
                    dongia.nad_ngay.strftime("%Y-%m-%d") if dongia.nad_ngay else None
                ),
                "dgdv_dongia": dongia.dgdv_dongia,
            }

            return success_response(result, 201)
        except ValueError as e:
            return error_response(str(e), 404)
    except Exception as e:
        return error_response(str(e), 500)


@dichvu_bp.route("/<string:dvyt_ma>/chi-so", methods=["GET"])
def get_chi_so_by_dich_vu(dvyt_ma):
    """Lấy tất cả chỉ số của một dịch vụ y tế"""
    try:
        # Kiểm tra dịch vụ có tồn tại không
        dich_vu = dichvu_service.get_by_id(dvyt_ma)
        if not dich_vu:
            return error_response(f"Không tìm thấy dịch vụ y tế với mã {dvyt_ma}", 404)

        # Lấy danh sách chỉ số
        chi_so_list = dichvu_service.get_chi_so_by_dich_vu(dvyt_ma)
        return success_response(chi_so_list)
    except Exception as e:
        return error_response(str(e), 500)


@dichvu_bp.route("/paged", methods=["GET"])
def get_paged():
    """Lấy danh sách dịch vụ y tế phân trang"""
    try:
        # Lấy các tham số từ query string
        offset = request.args.get("offset", default=0, type=int)
        limit = request.args.get("limit", default=10, type=int)
        
        # Các bộ lọc
        filters = {}
        if 'dvyt_ma' in request.args:
            filters['dvyt_ma'] = request.args.get('dvyt_ma')
        if 'dvyt_ten' in request.args:
            filters['dvyt_ten'] = request.args.get('dvyt_ten')
        if 'dvyt_mota' in request.args:
            filters['dvyt_mota'] = request.args.get('dvyt_mota')
        if 'min_price' in request.args:
            filters['min_price'] = request.args.get('min_price', type=int)
        if 'max_price' in request.args:
            filters['max_price'] = request.args.get('max_price', type=int)
            
        result = dichvu_service.get_paginated(offset, limit, filters)
        return success_response(result)
    except Exception as e:
        return error_response(str(e), 500)




