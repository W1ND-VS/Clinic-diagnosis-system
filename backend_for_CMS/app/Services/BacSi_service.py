from app.Model import BacSi
from typing import List, Optional
from datetime import time
from app.Model.LichLamViec import LichLamViec
from app.Model.CaLamViec import CaLamViec
from app.Services.PhieuHen_service import PhieuHenService
from datetime import datetime, time, date


class BacSiService:
    def __init__(self, db):
        self.db = db
        self.phieu_hen_service = PhieuHenService(db)

    def get_all(self, date_filter: Optional[date] = None, ck_ma: Optional[str] = None) -> List[BacSi]:
        """
        Lấy tất cả bác sĩ, có thể lọc theo ngày làm việc và chuyên khoa nếu có.

        Args:
            date_filter (date, optional): Ngày cần lọc lịch làm việc (nếu có).
            ck_ma (str, optional): Mã chuyên khoa (nếu có).

        Returns:
            List[BacSi]: Danh sách bác sĩ thỏa mãn điều kiện
        """
        try:
            query = self.db.session.query(BacSi)

            if ck_ma:
                query = query.filter(BacSi.ck_ma == ck_ma)

            if date_filter:
                # Lọc bác sĩ có lịch làm việc trong ngày này
                query = query.join(LichLamViec, LichLamViec.nv_ma == BacSi.nv_ma)\
                             .filter(LichLamViec.nl_ngay == date_filter)

            return query.distinct().all()
        except Exception as e:
            print(f"Lỗi khi lấy danh sách bác sĩ: {str(e)}")
            return []

    def get_by_id(self, id):
        return self.db.session.query(BacSi).filter(BacSi.nv_ma == id).first()

    def create(self, data):
        password = data.pop("nv_password")
        # Lấy mật khẩu thô ra, không đưa vào constructor
        if "nv_ma" not in data:
            data["nv_ma"] = self.doctor_id_auto_increment()  # Tự động tăng mã bác sĩ
        new_bacsi = BacSi(**data)
        new_bacsi.set_password(password)  # Hash và gán đúng cách

        # Add to database and commit
        self.db.session.add(new_bacsi)
        self.db.session.commit()
        return new_bacsi

    def get_by_phieukham(self, pk_ma: str, pk_ngaykham: date) -> Optional[BacSi]:
        """
        Lấy danh sách bác sĩ theo mã phiếu khám

        Args:
            pk_ma (str): Mã phiếu khám

        Returns:
            List[BacSi]: Danh sách bác sĩ liên quan đến phiếu khám
        """
        try:
            phieu_hen = self.phieu_hen_service.get_by_phieukham(pk_ma, pk_ngaykham)
            if not phieu_hen:
                return []

            return (
                self.db.session.query(BacSi)
                .filter(BacSi.nv_ma == phieu_hen.nv_ma)
                .first()
            )
        except Exception as e:
            print(f"Lỗi khi lấy danh sách bác sĩ theo phiếu khám: {str(e)}")
            return []

    def get_doctor_paginated(self, offset=0, limit=10, ck_ma=None):
        """
        Lấy danh sách bác sĩ với phân trang và tổng số bác sĩ, có thể lọc theo chuyên khoa.

        Returns:
            dict: {
                "data": [danh sách bác sĩ],
                "total": tổng số bác sĩ
            }
        """
        try:
            query = self.db.session.query(BacSi)
            if ck_ma:
                query = query.filter(BacSi.ck_ma == ck_ma)
            total = query.count()
            doctors = query.offset(offset).limit(limit).all()
            data = [bs.to_dict() for bs in doctors if hasattr(bs, "to_dict")]
            return {"data": data, "total": total}
        except Exception as e:
            print(f"Lỗi khi lấy danh sách bác sĩ: {str(e)}")
            return {"data": [], "total": 0}

    def update(self, id, data):
        try:
            bacsi = self.get_by_id(id)
            if not bacsi:
                return None

            # Xử lý mật khẩu riêng nếu được cung cấp
            if "nv_password" in data:
                password = data.pop("nv_password")
                bacsi.set_password(password)

            # Cập nhật các trường khác
            for key, value in data.items():
                setattr(bacsi, key, value)

            self.db.session.commit()
            return bacsi
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi cập nhật bác sĩ: {str(e)}")
            return None

    def delete(self, id):
        try:
            bacsi = self.get_by_id(id)
            if not bacsi:
                return False

            self.db.session.delete(bacsi)
            self.db.session.commit()
            return True
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi xóa bác sĩ: {str(e)}")
            return False

    def get_by_department(self, ck_ma: str) -> List[BacSi]:
        """
        Lấy danh sách bác sĩ theo mã chuyên khoa và kiểm tra ai đang trực

        Args:
            ck_ma: Mã chuyên khoa

        Returns:
            List[BacSi]: Danh sách bác sĩ theo chuyên khoa với thông tin đang trực
        """

        try:
            from app.Model.LichLamViec import LichLamViec
            from app.Model.CaLamViec import CaLamViec
            from datetime import datetime, date, time

            # Lấy bác sĩ theo chuyên khoa
            doctors = self.db.session.query(BacSi).filter(BacSi.ck_ma == ck_ma).all()

            if not doctors:
                return []

            # Lấy thời gian hiện tại
            current_date = date.today()
            current_time = time(14, 30, 0)  # dùng thời gian cố định để test
            print(f"Thời gian hiện tại: {current_date} {current_time}")
            # Tìm các bác sĩ đang trực thuộc chuyên khoa này
            doctors_on_duty = (
                self.db.session.query(BacSi)
                .join(LichLamViec, LichLamViec.nv_ma == BacSi.nv_ma)
                .join(CaLamViec, LichLamViec.clv_stt == CaLamViec.clv_stt)
                .filter(
                    BacSi.ck_ma == ck_ma,
                    LichLamViec.nl_ngay == current_date,
                    CaLamViec.clv_tgbatdau <= current_time,
                    CaLamViec.clv_tgkthuc >= current_time,
                )
                .all()
            )

            return doctors_on_duty
        except Exception as e:
            print(f"Lỗi khi lấy danh sách bác sĩ theo chuyên khoa: {str(e)}")
            # Fallback: Trả về danh sách bác sĩ không có thông tin trực
            return self.db.session.query(BacSi).filter(BacSi.ck_ma == ck_ma).all()

    def doctor_id_auto_increment(self):
        """
        Tự động tăng mã bác sĩ (nv_ma) theo định dạng BS000001, BS000002, ...
        """
        try:
            last_doctor = (
                self.db.session.query(BacSi).order_by(BacSi.nv_ma.desc()).first()
            )
            if not last_doctor:
                return "BS000001"

            last_id = int(last_doctor.nv_ma[2:])  # Lấy phần số sau BS
            new_id = last_id + 1
            return f"BS{new_id:06d}"  # Định dạng thành BSxxxxxx
        except Exception as e:
            print(f"Lỗi khi tự động tăng mã bác sĩ: {str(e)}")
            return "BS000001"
