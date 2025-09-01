from flask import Blueprint, request, jsonify
from app.extensions import db
from app.Services.Thuoc_service import ThuocService
from app.utils.response_utils import success_response, error_response
from flask_jwt_extended import jwt_required

# Khởi tạo Blueprint
thuoc_bp = Blueprint("thuoc", __name__, url_prefix="/api/thuoc")

# Khởi tạo service
thuoc_service = ThuocService(db)


@thuoc_bp.route("/getall", methods=["GET"])
def get_all():
    """Lấy tất cả thuốc"""
    try:
        thuoc_list = thuoc_service.get_all()
        return success_response(thuoc_list)
    except Exception as e:
        return error_response(str(e), 500)


@thuoc_bp.route("/paged", methods=["GET"])
def get_paged():
    """Lấy danh sách thuốc phân trang"""
    try:
        # Lấy các tham số từ query string
        offset = request.args.get("offset", default=0, type=int)
        limit = request.args.get("limit", default=10, type=int)
        
        # Các bộ lọc
        filters = {}
        if 'thuoc_ma' in request.args:
            filters['thuoc_ma'] = request.args.get('thuoc_ma')
        if 'thuoc_ten' in request.args:
            filters['thuoc_ten'] = request.args.get('thuoc_ten')
        if 'thuoc_dvt' in request.args:
            filters['thuoc_dvt'] = request.args.get('thuoc_dvt')
            
        result = thuoc_service.get_paginated(offset, limit, filters)
        return success_response(result)
    except Exception as e:
        return error_response(str(e), 500)


@thuoc_bp.route("/search", methods=["GET"])
def search():
    """Tìm kiếm thuốc theo từ khóa"""
    try:
        keyword = request.args.get("keyword", "")
        if not keyword:
            return error_response("Thiếu từ khóa tìm kiếm", 400)
            
        result = thuoc_service.search(keyword)
        return success_response(result)
    except Exception as e:
        return error_response(str(e), 500)


@thuoc_bp.route("/<string:thuoc_ma>", methods=["GET"])
def get_by_id(thuoc_ma):
    """Lấy thuốc theo mã"""
    try:
        thuoc = thuoc_service.get_by_id(thuoc_ma)
        if not thuoc:
            return error_response(f"Không tìm thấy thuốc với mã {thuoc_ma}", 404)
            
        return success_response(thuoc.to_dict())
    except Exception as e:
        return error_response(str(e), 500)


@thuoc_bp.route("", methods=["POST"])
@jwt_required()
def create():
    """Tạo thuốc mới"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)
            
        # Kiểm tra các trường bắt buộc
        required_fields = ["thuoc_ma", "thuoc_ten", "thuoc_dvt"]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return error_response(
                f"Thiếu các trường bắt buộc: {', '.join(missing_fields)}", 400
            )
            
        new_thuoc = thuoc_service.create(data)
        return success_response(new_thuoc.to_dict(), 201)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@thuoc_bp.route("/<string:thuoc_ma>", methods=["PUT"])
@jwt_required()
def update(thuoc_ma):
    """Cập nhật thuốc"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)
            
        updated_thuoc = thuoc_service.update(thuoc_ma, data)
        return success_response(updated_thuoc.to_dict())
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)


@thuoc_bp.route("/<string:thuoc_ma>", methods=["DELETE"])
@jwt_required()
def delete(thuoc_ma):
    """Xóa thuốc"""
    try:
        result = thuoc_service.delete(thuoc_ma)
        return success_response({"deleted": result, "thuoc_ma": thuoc_ma})
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(str(e), 500)