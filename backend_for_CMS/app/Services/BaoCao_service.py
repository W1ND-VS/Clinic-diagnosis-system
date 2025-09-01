from datetime import timedelta
import dis
from app.Model import PhieuHen
from app.Services import ChuyenKhoa_service
from app.Services.PhieuCDDVYT_service import PhieuCDDVYTService
from app.Services.PhieuKham_service import PhieuKhamService
from app.Services.Benh_service import BenhService
from app.Model.PhieuKham import PhieuKham
from sqlalchemy import func


class BaoCaoService:
    def __init__(self, db):
        self.db = db
        self.phieu_cddvyt_service = PhieuCDDVYTService(db)
        self.phieu_kham_service = PhieuKhamService(db)
        self.benh_service = BenhService(db)

    def revenue_report(self, start_date, end_date):
        """
        Lấy báo cáo doanh thu trong khoảng thời gian từ start_date đến end_date.

        Args:
            start_date (str): Ngày bắt đầu (định dạng 'YYYY-MM-DD').
            end_date (str): Ngày kết thúc (định dạng 'YYYY-MM-DD').

        Returns:
            dict: Báo cáo doanh thu.
        """
        revenue_data = []

        num_days = (end_date - start_date).days + 1
        for i in range(num_days):
            day = start_date + timedelta(days=i)
            service_revenue = self.phieu_cddvyt_service.get_revenue_by_date(day)
            exam_revenue = self.phieu_kham_service.get_revenue_by_date(day)
            daily_revenue = {
                "date": day.strftime("%Y-%m-%d"),
                "revenue": service_revenue + exam_revenue,
            }
            revenue_data.append(daily_revenue)

        return revenue_data

    def derpartment_report(self, start_date, end_date):
        """
        Tạo báo cáo chuyên khoa theo ngày trong khoảng thời gian từ start_date đến end_date.

        Args:
            start_date (str): Ngày bắt đầu (định dạng 'YYYY-MM-DD').
            end_date (str): Ngày kết thúc (định dạng 'YYYY-MM-DD').

        Returns:
            List[Dict[str, Any]]: Danh sách các chuyên khoa với số lượng bác sĩ và phòng.
        """
        departments = ChuyenKhoa_service.ChuyenKhoaService(self.db).get_all()
        department_data = []
        numdays = (end_date - start_date).days + 1
        for department in departments:
            ck_ma = department.ck_ma
            num_of_cases = 0
            for i in range(numdays):
                day = start_date + timedelta(days=i)
                num_of_cases += self.phieu_kham_service.get_by_derpartment(ck_ma, day)

            department_data.append(
                {
                    "name": department.ck_ten,
                    "caseCount": num_of_cases,
                }
            )

        return department_data

    def disease_report(self, start_date, end_date):
        """
        Generate disease statistics report for a date range

        Args:
            start_date: Start date
            end_date: End date

        Returns:
            Dict[str, Any]: Disease statistics report
        """
        try:
            from app.Model.Benh import Benh
            from app.Model.ChanDoan import ChanDoan
            from app.Model.ToaThuoc import ToaThuoc
            from sqlalchemy import func, desc

            # Lấy tổng số chẩn đoán trong khoảng thời gian
            total_count = (
                self.db.session.query(func.count(ChanDoan.b_ma))
                .join(ToaThuoc, ChanDoan.tt_matthuoc == ToaThuoc.tt_matthuoc)
                .filter(
                    ToaThuoc.tt_ngayke >= start_date, ToaThuoc.tt_ngayke <= end_date
                )
                .scalar()
            ) or 0

            # Đếm số bệnh duy nhất
            unique_count = (
                self.db.session.query(func.count(func.distinct(ChanDoan.b_ma)))
                .join(ToaThuoc, ChanDoan.tt_matthuoc == ToaThuoc.tt_matthuoc)
                .filter(
                    ToaThuoc.tt_ngayke >= start_date, ToaThuoc.tt_ngayke <= end_date
                )
                .scalar()
            ) or 0

            # Lấy danh sách bệnh phổ biến nhất
            common_diseases_query = (
                self.db.session.query(
                    Benh.b_ma, Benh.b_ten, func.count(ChanDoan.b_ma).label("count")
                )
                .join(ChanDoan, Benh.b_ma == ChanDoan.b_ma)
                .join(ToaThuoc, ChanDoan.tt_matthuoc == ToaThuoc.tt_matthuoc)
                .filter(
                    ToaThuoc.tt_ngayke >= start_date, ToaThuoc.tt_ngayke <= end_date
                )
                .group_by(Benh.b_ma, Benh.b_ten)
                .order_by(desc("count"))
                .limit(10)
                .all()
            )

            # Chuyển đổi kết quả Row thành list dictionaries
            common_diseases = [
                {"name": row[1], "count": row[2]} for row in common_diseases_query
            ]
            print(common_diseases)

            # Trả về dữ liệu đã được chuyển đổi sang định dạng JSON-serializable
            return {"most_common": common_diseases}
        except Exception as e:
            print(f"Lỗi khi tạo báo cáo bệnh: {str(e)}")
            return {
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
                "total_diagnoses": 0,
                "unique_diseases": 0,
                "most_common": [],
            }

    def patient_daily_report(self, start_date, end_date):
        """
        Báo cáo số lượng bệnh nhân theo từng ngày dựa trên pk_ngaykham.
        Returns: List[Dict] dạng [{"date": "YYYY-MM-DD", "count": số bệnh nhân}]
        """
        try:
            num_days = (end_date - start_date).days + 1
            report = []
            for i in range(num_days):
                day = start_date + timedelta(days=i)
                # Đếm số bệnh nhân duy nhất trong ngày đó
                count = (
                    self.db.session.query(func.count(func.distinct(PhieuHen.bn_ma)))
                    .filter(PhieuHen.pk_ngaykham == day)
                    .scalar()
                ) or 0
                report.append({"date": day.strftime("%Y-%m-%d"), "count": count})
            return report
        except Exception as e:
            print(f"Lỗi khi tạo báo cáo bệnh nhân theo ngày: {str(e)}")
            return []

    def doctor_summary_report(self, start_date, end_date):
        """
        Báo cáo tổng hợp bác sĩ: số bệnh nhân, doanh thu, chuyên khoa trong khoảng thời gian.
        Returns: List[Dict] dạng [{"doctor_name": ..., "patientCount": ..., "revenue": ..., "specialty": ...}]
        """
        try:
            from app.Model.BacSi import BacSi
            from app.Model.PhieuHen import PhieuHen
            from app.Model.PhieuKham import PhieuKham
            from app.Model.PhieuCDDVYT import PhieuCDDVYT
            from app.Model.ChuyenKhoa import ChuyenKhoa

            doctors = self.db.session.query(BacSi).all()
            report = []

            for doctor in doctors:
                # 1. Lấy tất cả phiếu hẹn của bác sĩ trong khoảng thời gian
                phieu_hen_list = (
                    self.db.session.query(PhieuHen)
                    .filter(
                        PhieuHen.nv_ma == doctor.nv_ma,
                        PhieuHen.ph_ngayhen >= start_date,
                        PhieuHen.ph_ngayhen <= end_date,
                    )
                    .all()
                )

                # 2. Lấy tất cả phiếu khám tương ứng các phiếu hẹn
                pk_keys = [
                    (ph.pk_ma, ph.pk_ngaykham)
                    for ph in phieu_hen_list
                    if ph.pk_ma is not None and ph.pk_ngaykham is not None
                ]
                # Đếm số bệnh nhân duy nhất đã khám qua phiếu hẹn
                patient_ids = set()
                for pk_ma, pk_ngaykham in pk_keys:
                    phieu_kham = (
                        self.db.session.query(PhieuKham)
                        .filter(
                            PhieuKham.pk_ma == pk_ma,
                            PhieuKham.pk_ngaykham == pk_ngaykham,
                        )
                        .first()
                    )
                    if phieu_kham and hasattr(phieu_kham, "phieu_hen"):
                        patient_ids.add(phieu_kham.phieu_hen.bn_ma)

                patient_count = len(patient_ids)

                # 3. Lấy phiếu chỉ định dịch vụ y tế từ các phiếu khám
                revenue = 0
                for pk_ma, pk_ngaykham in pk_keys:
                    phieu_cddvyt = (
                        self.db.session.query(PhieuCDDVYT)
                        .filter(
                            PhieuCDDVYT.pk_ma == pk_ma,
                            PhieuCDDVYT.pk_ngaykham == pk_ngaykham,
                        )
                        .first()
                    )
                    if phieu_cddvyt and phieu_cddvyt.pcd_tongtien:
                        revenue += int(phieu_cddvyt.pcd_tongtien)

                # 4. Lấy tên chuyên khoa
                specialty = None
                if doctor.ck_ma:
                    chuyen_khoa = (
                        self.db.session.query(ChuyenKhoa)
                        .filter_by(ck_ma=doctor.ck_ma)
                        .first()
                    )
                    specialty = chuyen_khoa.ck_ten if chuyen_khoa else None

                report.append(
                    {
                        "doctor_name": doctor.nv_hoten,
                        "patientCount": patient_count,
                        "revenue": revenue,
                        "specialty": specialty,
                    }
                )

            return report
        except Exception as e:
            print(f"Lỗi khi tạo báo cáo tổng hợp bác sĩ: {str(e)}")
            return []
