from flask import Blueprint, request
from app.Services.auth_service import AuthService
from app.utils.response_utils import success_response
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app.utils.response_utils import error_response

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        username = data.get("nv_ma")
        password = data.get("nv_password")
        if not data or "nv_ma" not in data or "nv_password" not in data:
            return ({"message": "Invalid data"}, 400)

        result = AuthService.login_bacsi(username, password)

        if not result:
            result = AuthService.login_bacsi_ck13(username, password)
        if not result:
            return ({"message": "Invalid username or password"}, 401)
        
        print(result)
        
        return success_response(result)

    except Exception as e:
        return ({"message": str(e)}, 500)
    



@auth_bp.route("/login_tieptan", methods=["POST"])
def login_tieptan():
    try:
        data = request.get_json()
        username = data.get("nv_ma")
        password = data.get("nv_password")
        if not data or "nv_ma" not in data or "nv_password" not in data:
            return ({"message": "Invalid data"}, 400)

        result = AuthService.login_tieptan(username, password)

        if not result:
            return ({"message": "Invalid username or password"}, 401)

        return success_response(result)

    except Exception as e:
        return ({"message": str(e)}, 500)


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """Lấy thông tin người dùng hiện tại dựa trên JWT token"""
    try:
        # Lấy identity (nv_ma) từ JWT token
        nv_ma = get_jwt_identity()

        # Lấy tất cả claims từ JWT token hiện tại
        claims = get_jwt()
        role = claims.get("role")
        return success_response(
            {
                "role": role,
                "nv_ma": nv_ma,
            }
        )
    except Exception as e:
        return error_response(str(e), 500)


@auth_bp.route("/login/admin", methods=["POST"])
def login_admin():
    """Đăng nhập cho quản trị viên với thông tin hard-coded"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Dữ liệu không hợp lệ", 400)

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return error_response("Thiếu tên đăng nhập hoặc mật khẩu", 400)

        result = AuthService.login_admin(username, password)
        if not result:
            return error_response("Tên đăng nhập hoặc mật khẩu không đúng", 401)

        return success_response(result)
    except Exception as e:
        return error_response(str(e), 500)
    
@auth_bp.route("/login/benhnhan", methods=["POST"])
def login_benhnhan():
    """
    Đăng nhập cho bệnh nhân bằng bn_ma và bn_password
    """
    try:
        data = request.get_json()
        username = data.get("bn_sdt")
        password = data.get("bn_password")
        if not data or not username or not password:
            return ({"message": "Invalid data"}, 400)

        result = AuthService.login_benhnhan(username, password)
        if not result:
            return ({"message": "Invalid username or password"}, 401)

        return success_response(result)
    except Exception as e:
        return ({"message": str(e)}, 500)