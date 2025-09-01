from typing import Optional, List, Dict, Any
from sqlalchemy.exc import SQLAlchemyError
from datetime import date, timedelta
from app.Model.LichLamViec import LichLamViec
from app.Model.BacSi import BacSi
from app.Model.Phong import Phong
from app.Model.CaLamViec import CaLamViec
from app.Model.NgayLamViec import NgayLamViec


class LichLamViecService:
    """Service class for handling work schedules"""

    def __init__(self, db):
        self.db = db

    def get_all(self) -> List[Dict[str, Any]]:
        """Get all work schedules"""
        try:
            schedules = self.db.session.query(LichLamViec).all()
            return [schedule.to_dict() for schedule in schedules]
        except Exception as e:
            print(f"Lỗi khi lấy tất cả lịch làm việc: {str(e)}")
            return []

    def get_by_id(
        self, clv_stt: int, nl_ngay: date, phong_ma: str
    ) -> Optional[LichLamViec]:
        """Get work schedule by composite primary key"""
        try:
            return (
                self.db.session.query(LichLamViec)
                .filter(
                    LichLamViec.clv_stt == clv_stt,
                    LichLamViec.nl_ngay == nl_ngay,
                    LichLamViec.phong_ma == phong_ma,
                )
                .first()
            )
        except Exception as e:
            print(f"Lỗi khi lấy lịch làm việc theo ID: {str(e)}")
            return None

    def create(self, data: Dict[str, Any]) -> Optional[LichLamViec]:
        """Create a new work schedule"""
        try:
            # Convert date string to date object if needed
            nl_ngay = data.get("nl_ngay")
            if isinstance(nl_ngay, str):
                nl_ngay = date.fromisoformat(nl_ngay)
            else:
                nl_ngay = data.get("nl_ngay")

            # Check if schedule already exists
            existing = self.get_by_id(
                data.get("clv_stt"), nl_ngay, data.get("phong_ma")
            )

            if existing:
                raise ValueError(f"Lịch làm việc đã tồn tại")

            # Validate required fields
            if not all(
                key in data for key in ["clv_stt", "nl_ngay", "phong_ma", "nv_ma"]
            ):
                raise ValueError("Thiếu thông tin bắt buộc cho lịch làm việc")

            # Create new work schedule
            new_schedule = LichLamViec(
                clv_stt=data.get("clv_stt"),
                nl_ngay=nl_ngay,
                phong_ma=data.get("phong_ma"),
                nv_ma=data.get("nv_ma"),
            )

            # Ensure the work day exists
            ngay_lam_viec = (
                self.db.session.query(NgayLamViec)
                .filter(NgayLamViec.nl_ngay == nl_ngay)
                .first()
            )

            if not ngay_lam_viec:
                # Create work day if it doesn't exist
                ngay_lam_viec = NgayLamViec(nl_ngay=nl_ngay)
                self.db.session.add(ngay_lam_viec)

            self.db.session.add(new_schedule)
            self.db.session.commit()
            return new_schedule
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi tạo lịch làm việc: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi tạo lịch làm việc: {str(e)}")

    def update(
        self, clv_stt: int, nl_ngay: date, phong_ma: str, data: Dict[str, Any]
    ) -> Optional[LichLamViec]:
        """Update an existing work schedule"""
        try:
            # Convert date parameter if needed
            if isinstance(nl_ngay, str):
                nl_ngay = date.fromisoformat(nl_ngay)

            schedule = self.get_by_id(clv_stt, nl_ngay, phong_ma)
            if not schedule:
                raise ValueError(f"Không tìm thấy lịch làm việc")

            # Update doctor assignment
            if "nv_ma" in data:
                schedule.nv_ma = data["nv_ma"]

            self.db.session.commit()
            return schedule
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi cập nhật lịch làm việc: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi cập nhật lịch làm việc: {str(e)}")

    def delete(self, clv_stt: int, nl_ngay: date, phong_ma: str) -> bool:
        """Delete a work schedule"""
        try:
            # Convert date parameter if needed
            if isinstance(nl_ngay, str):
                nl_ngay = date.fromisoformat(nl_ngay)

            schedule = self.get_by_id(clv_stt, nl_ngay, phong_ma)
            if not schedule:
                raise ValueError(f"Không tìm thấy lịch làm việc")

            self.db.session.delete(schedule)
            self.db.session.commit()
            return True
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi xóa lịch làm việc: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi xóa lịch làm việc: {str(e)}")

    def get_by_doctor(self, nv_ma: str) -> List[Dict[str, Any]]:
        """Get all schedules for a specific doctor"""
        try:
            schedules = (
                self.db.session.query(LichLamViec)
                .filter(LichLamViec.nv_ma == nv_ma)
                .all()
            )
            return [schedule.to_dict() for schedule in schedules]
        except Exception as e:
            print(f"Lỗi khi lấy lịch làm việc theo bác sĩ: {str(e)}")
            return []

    def get_by_date(self, nl_ngay: date) -> List[Dict[str, Any]]:
        """Get all schedules for a specific date"""
        try:
            # Convert date parameter if needed
            if isinstance(nl_ngay, str):
                nl_ngay = date.fromisoformat(nl_ngay)

            schedules = (
                self.db.session.query(LichLamViec)
                .filter(LichLamViec.nl_ngay == nl_ngay)
                .all()
            )

            result = []
            for schedule in schedules:
                print(f"Processing schedule: {schedule.to_dict()}")
                # Get related information
                ca_lam_viec = (
                    self.db.session.query(CaLamViec)
                    .filter(CaLamViec.clv_stt == schedule.clv_stt)
                    .first()
                )

                phong = (
                    self.db.session.query(Phong)
                    .filter(Phong.phong_ma == schedule.phong_ma)
                    .first()
                )

                bac_si = (
                    self.db.session.query(BacSi)
                    .filter(BacSi.nv_ma == schedule.nv_ma)
                    .first()
                )

                # Create enriched schedule item
                schedule_item = schedule.to_dict()
                if ca_lam_viec:
                    schedule_item["ca_lam_viec"] = {
                        "clv_stt": ca_lam_viec.clv_stt,
                        "clv_giobatdau": (
                            ca_lam_viec.clv_tgbatdau.strftime("%H:%M")
                            if ca_lam_viec.clv_tgbatdau
                            else None
                        ),
                        "clv_gioketthuc": (
                            ca_lam_viec.clv_tgkthuc.strftime("%H:%M")
                            if ca_lam_viec.clv_tgkthuc
                            else None
                        ),
                    }

                if phong:
                    schedule_item["phong"] = {
                        "phong_ma": phong.phong_ma,
                    }

                if bac_si:
                    schedule_item["bac_si"] = {
                        "nv_ma": bac_si.nv_ma,
                        "bs_ten": bac_si.nv_hoten,
                    }

                result.append(schedule_item)

            return result
        except Exception as e:
            print(f"Lỗi khi lấy lịch làm việc theo ngày: {str(e)}")
            return []

    def get_by_date_range(
        self, start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        """Get all schedules within a date range"""
        try:
            # Convert date parameters if needed
            if isinstance(start_date, str):
                start_date = date.fromisoformat(start_date)
            if isinstance(end_date, str):
                end_date = date.fromisoformat(end_date)

            schedules = (
                self.db.session.query(LichLamViec)
                .filter(
                    LichLamViec.nl_ngay >= start_date, LichLamViec.nl_ngay <= end_date
                )
                .all()
            )

            return [schedule.to_dict() for schedule in schedules]
        except Exception as e:
            print(f"Lỗi khi lấy lịch làm việc theo khoảng thời gian: {str(e)}")
            return []

    def get_by_room(self, phong_ma: str) -> List[Dict[str, Any]]:
        """Get all schedules for a specific room"""
        try:
            schedules = (
                self.db.session.query(LichLamViec)
                .filter(LichLamViec.phong_ma == phong_ma)
                .all()
            )
            return [schedule.to_dict() for schedule in schedules]
        except Exception as e:
            print(f"Lỗi khi lấy lịch làm việc theo phòng: {str(e)}")
            return []

    def check_availability(self, clv_stt: int, nl_ngay: date, phong_ma: str) -> bool:
        """Check if a slot is available (no schedule exists)"""
        try:
            # Convert date parameter if needed
            if isinstance(nl_ngay, str):
                nl_ngay = date.fromisoformat(nl_ngay)

            schedule = self.get_by_id(clv_stt, nl_ngay, phong_ma)
            return schedule is None
        except Exception as e:
            print(f"Lỗi khi kiểm tra lịch trống: {str(e)}")
            return False

    def get_by_doctor_and_date_range(
        self, nv_ma: str, start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        """Get a doctor's schedule for a date range"""
        try:
            # Convert date parameters if needed
            if isinstance(start_date, str):
                start_date = date.fromisoformat(start_date)
            if isinstance(end_date, str):
                end_date = date.fromisoformat(end_date)

            schedules = (
                self.db.session.query(LichLamViec)
                .filter(
                    LichLamViec.nv_ma == nv_ma,
                    LichLamViec.nl_ngay >= start_date,
                    LichLamViec.nl_ngay <= end_date,
                )
                .all()
            )

            return [schedule.to_dict() for schedule in schedules]
        except Exception as e:
            print(
                f"Lỗi khi lấy lịch làm việc theo bác sĩ và khoảng thời gian: {str(e)}"
            )
            return []

    def get_room_by_doctor_date_shift(
        self, nl_ngay: date, clv_stt: int, nv_ma: str
    ) -> Optional[str]:
        """
        Lấy mã phòng duy nhất mà nhân viên làm việc trong ngày và ca cụ thể

        Args:
            nl_ngay: Ngày làm việc
            clv_stt: Số thứ tự ca làm việc
            nv_ma: Mã nhân viên (bác sĩ)

        Returns:
            str: Mã phòng nếu tìm thấy, None nếu không tìm thấy
        """
        try:
            # Chuyển đổi ngày nếu cần thiết
            if isinstance(nl_ngay, str):
                nl_ngay = date.fromisoformat(nl_ngay)

            # Tìm lịch làm việc thỏa mãn điều kiện
            schedule = (
                self.db.session.query(LichLamViec)
                .filter(
                    LichLamViec.nl_ngay == nl_ngay,
                    LichLamViec.clv_stt == clv_stt,
                    LichLamViec.nv_ma == nv_ma,
                )
                .first()
            )
            print(f"Schedule found: {schedule.phong_ma if schedule else 'None'}")
            # Trả về mã phòng nếu tìm thấy
            if schedule:
                return schedule.phong_ma

            return None
        except Exception as e:
            print(f"Lỗi khi lấy mã phòng theo nhân viên, ngày và ca: {str(e)}")
            return None

    def get_by_room_and_date_range(
        self, phong_ma: str, start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        """Get all schedules for a room within a date range"""
        try:
            # Convert date parameters if needed
            if isinstance(start_date, str):
                start_date = date.fromisoformat(start_date)
            if isinstance(end_date, str):
                end_date = date.fromisoformat(end_date)

            schedules = (
                self.db.session.query(LichLamViec)
                .filter(
                    LichLamViec.phong_ma == phong_ma,
                    LichLamViec.nl_ngay >= start_date,
                    LichLamViec.nl_ngay <= end_date,
                )
                .all()
            )

            return [schedule.to_dict() for schedule in schedules]
        except Exception as e:
            print(f"Lỗi khi lấy lịch làm việc theo phòng và khoảng thời gian: {str(e)}")
            return []

    def get_by_doctor_and_date(self, nv_ma: str, nl_ngay: date):
        """
        Lấy danh sách lịch làm việc của bác sĩ theo ngày.
        """
        try:
            schedules = (
                self.db.session.query(LichLamViec)
                .filter(LichLamViec.nv_ma == nv_ma, LichLamViec.nl_ngay == nl_ngay)
                .all()
            )
            return [s.to_dict() for s in schedules]
        except Exception as e:
            raise e
