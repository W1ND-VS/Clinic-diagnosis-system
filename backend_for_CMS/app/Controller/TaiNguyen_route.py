from flask import Blueprint, jsonify
from app.Services.TaiNguyen_service import TaiNguyenService
from app.extensions import db


resource_bp = Blueprint('resource', __name__, url_prefix='/api/resource')

@resource_bp.route('/medicines', methods=['GET'])
def get_medicines():
    resource_service = TaiNguyenService(db)
    try:
        medicines = resource_service.get_all_medicines()
        return jsonify({
            'status': 'success',
            'data': medicines
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@resource_bp.route('/medical-services', methods=['GET'])
def get_medical_services():
    resource_service = TaiNguyenService(db)
    try:
        services = resource_service.get_all_medical_services()
        return jsonify({
            'status': 'success',
            'data': services
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500