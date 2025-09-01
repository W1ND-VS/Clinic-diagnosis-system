from flask import Blueprint, request
from app.Services.BaoCao_service import BaoCaoService
from app.extensions import db
from app.utils.response_utils import success_response, error_response
from datetime import datetime

# Khởi tạo Blueprint và service
baocao_bp = Blueprint("baocao", __name__, url_prefix="/api/baocao")
baocao_service = BaoCaoService(db)


@baocao_bp.route("/doanh-thu", methods=["GET"])
def get_revenue_report():
    """Lấy báo cáo doanh thu trong khoảng thời gian"""
    try:
        # Lấy tham số từ query string
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        # Kiểm tra tham số bắt buộc
        if not start_date or not end_date:
            return error_response("Thiếu tham số start_date hoặc end_date", 400)

        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        if start > end:
            return error_response(
                "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc", 400
            )

        # Lấy báo cáo doanh thu
        revenue_data = baocao_service.revenue_report(start, end)

        # Xử lý dữ liệu để trả về dưới dạng JSON

        return success_response(revenue_data)
    except Exception as e:
        return error_response(str(e), 500)


@baocao_bp.route("/chuyen-khoa", methods=["GET"])
def get_department_report():
    """Lấy báo cáo chuyên khoa trong khoảng thời gian"""
    try:
        # Lấy tham số từ query string
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        # Kiểm tra tham số bắt buộc
        if not start_date or not end_date:
            return error_response("Thiếu tham số start_date hoặc end_date", 400)

        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        if start > end:
            return error_response(
                "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc", 400
            )

        # Lấy báo cáo chuyên khoa
        department_data = baocao_service.derpartment_report(start, end)

        return success_response(department_data)
    except Exception as e:
        return error_response(str(e), 500)


@baocao_bp.route("/benh", methods=["GET"])
def get_disease_report():
    """Lấy báo cáo bệnh trong khoảng thời gian"""
    try:
        # Lấy tham số từ query string
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        # Kiểm tra tham số bắt buộc
        if not start_date or not end_date:
            return error_response("Thiếu tham số start_date hoặc end_date", 400)

        # Chuyển đổi chuỗi ngày sang đối tượng date
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        if start > end:
            return error_response(
                "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc", 400
            )

        # Lấy báo cáo bệnh
        disease_data = baocao_service.disease_report(start, end)

        return success_response(disease_data)
    except Exception as e:
        return error_response(str(e), 500)


@baocao_bp.route("/bac-si", methods=["GET"])
def get_doctor_summary_report():
    """Lấy báo cáo tổng hợp bác sĩ trong khoảng thời gian"""
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        if not start_date or not end_date:
            return error_response("Thiếu tham số start_date hoặc end_date", 400)

        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        if start > end:
            return error_response(
                "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc", 400
            )

        doctor_data = baocao_service.doctor_summary_report(start, end)
        return success_response(doctor_data)
    except Exception as e:
        return error_response(str(e), 500)


@baocao_bp.route("/bac-si-lich-hen", methods=["GET"])
def get_doctor_appointment_report():
    """Lấy báo cáo phiếu hẹn đã xác nhận của bác sĩ theo ngày"""
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        if not start_date or not end_date:
            return error_response("Thiếu tham số start_date hoặc end_date", 400)

        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        if start > end:
            return error_response(
                "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc", 400
            )

        data = baocao_service.doctor_appointment_report(start, end)
        return success_response(data)
    except Exception as e:
        return error_response(str(e), 500)


@baocao_bp.route("/benh-nhan-theo-ngay", methods=["GET"])
def get_patient_daily_report():
    """Lấy báo cáo số lượng bệnh nhân theo từng ngày dựa trên pk_ngaykham"""
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        if not start_date or not end_date:
            return error_response("Thiếu tham số start_date hoặc end_date", 400)

        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return error_response(
                "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD", 400
            )

        if start > end:
            return error_response(
                "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc", 400
            )

        data = baocao_service.patient_daily_report(start, end)
        return success_response(data)
    except Exception as e:
        return error_response(str(e), 500)
