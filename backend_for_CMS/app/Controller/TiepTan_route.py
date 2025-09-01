from flask import Blueprint, request
from app.Services.TiepTan_service import TiepTanService
from app.utils.response_utils import success_response, error_response
from app.extensions import db

tieptan_bp = Blueprint("tieptan", __name__, url_prefix="/api/tieptan")
tieptan_service = TiepTanService(db)  # Tạo một instance duy nhất của service


@tieptan_bp.route("create", methods=["POST"])
def create_tieptan():
    try:
        data = request.get_json()
        
        # Kiểm tra dữ liệu đầu vào
        if not data:
            return error_response("Invalid data", 400)

        # Kiểm tra các trường bắt buộc
        required_fields = ["nv_ma", "nv_hoten", "nv_password", "nv_gioitinh"]
        for field in required_fields:
            if field not in data:
                return error_response(f"Missing required field: {field}", 400)

        # Kiểm tra tiếp tân đã tồn tại chưa
        existing_tieptan = tieptan_service.get_by_id(data["nv_ma"])
        if existing_tieptan:
            return error_response("Receptionist with this ID already exists", 409)

        # Tạo tiếp tân mới
        new_tieptan = tieptan_service.create(data)

        if not new_tieptan:
            return error_response("Failed to create receptionist", 500)

        # Trả về kết quả thành công
        return success_response(new_tieptan.to_dict(), 201)

    except Exception as e:
        return error_response(str(e), 500)


@tieptan_bp.route("/getall", methods=["GET"])
def get_all_tieptan():
    try:
        offset = request.args.get("offset", 0, type=int)
        limit = request.args.get("limit", 10, type=int)
        receptionists = tieptan_service.get_all(offset=offset, limit=limit)
        print(f"Fetched receptionists: {receptionists}")
        return success_response([r.to_dict() for r in receptionists])
    except Exception as e:
        return error_response(str(e), 500)


@tieptan_bp.route("/<string:id>", methods=["GET"])
def get_tieptan_by_id(id):
    try:
        tieptan = tieptan_service.get_by_id(id)
        if not tieptan:
            return error_response(f"Receptionist with ID {id} not found", 404)
        return success_response(tieptan.to_dict())
    except Exception as e:
        return error_response(str(e), 500)


@tieptan_bp.route("/<string:id>", methods=["PUT"])
def update_tieptan(id):
    try:
        data = request.get_json()
        if not data:
            return error_response("Invalid data", 400)

        updated_tieptan = tieptan_service.update(id, data)
        if not updated_tieptan:
            return error_response(
                f"Receptionist with ID {id} not found or update failed", 404
            )

        return success_response(updated_tieptan.to_dict())
    except Exception as e:
        return error_response(str(e), 500)


@tieptan_bp.route("/<string:id>", methods=["DELETE"])
def delete_tieptan(id):
    try:
        result = tieptan_service.delete(id)
        if not result:
            return error_response(
                f"Receptionist with ID {id} not found or delete failed", 404
            )

        return success_response({"message": f"Receptionist {id} successfully deleted"})
    except Exception as e:
        return error_response(str(e), 500)
