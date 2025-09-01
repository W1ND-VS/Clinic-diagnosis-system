from typing import List, Dict, Any, Optional
from datetime import date, timedelta
from sqlalchemy.exc import SQLAlchemyError
from app.Model.DangKyLichLam import DangKyLichLam
from app.Model.BacSi import BacSi
from app.Model.NgayLamViec import NgayLamViec
from app.Model.CaLamViec import CaLamViec
from app.Model.LichLamViec import LichLamViec
from app.Model.Phong import Phong


class DangKyLichLamService:
    """Service class for handling work schedule registrations"""

    def __init__(self, db):
        self.db = db

    def get_all(self) -> List[Dict[str, Any]]:
        """Get all work registrations"""
        try:
            registrations = self.db.session.query(DangKyLichLam).all()
            return [reg.to_dict() for reg in registrations]
        except Exception as e:
            print(f"Lỗi khi lấy tất cả đăng ký lịch làm: {str(e)}")
            return []

    def get_by_doctor(self, nv_ma: str) -> List[Dict[str, Any]]:
        """Get registrations for a specific doctor"""
        try:
            registrations = (
                self.db.session.query(DangKyLichLam)
                .filter(DangKyLichLam.nv_ma == nv_ma)
                .all()
            )

            return [reg.to_dict() for reg in registrations]
        except Exception as e:
            print(f"Lỗi khi lấy đăng ký lịch làm theo bác sĩ: {str(e)}")
            return []

    def get_by_date(self, nl_ngay: date) -> List[Dict[str, Any]]:
        """Get registrations for a specific date"""
        try:
            # Convert date parameter if needed
            if isinstance(nl_ngay, str):
                nl_ngay = date.fromisoformat(nl_ngay)

            registrations = (
                self.db.session.query(DangKyLichLam)
                .filter(DangKyLichLam.nl_ngay == nl_ngay)
                .all()
            )

            result = []
            for reg in registrations:
                # Get detailed information
                doctor = (
                    self.db.session.query(BacSi)
                    .filter(BacSi.nv_ma == reg.nv_ma)
                    .first()
                )

                shift = (
                    self.db.session.query(CaLamViec)
                    .filter(CaLamViec.clv_stt == reg.clv_stt)
                    .first()
                )

                reg_dict = reg.to_dict()
                if doctor:
                    reg_dict["doctor_info"] = doctor.to_dict()
                if shift:
                    reg_dict["shift_info"] = shift.to_dict()

                result.append(reg_dict)

            return result
        except Exception as e:
            print(f"Lỗi khi lấy đăng ký lịch làm theo ngày: {str(e)}")
            return []

    def get_by_shift(self, clv_stt: int) -> List[Dict[str, Any]]:
        """Get registrations for a specific shift"""
        try:
            registrations = (
                self.db.session.query(DangKyLichLam)
                .filter(DangKyLichLam.clv_stt == clv_stt)
                .all()
            )

            return [reg.to_dict() for reg in registrations]
        except Exception as e:
            print(f"Lỗi khi lấy đăng ký lịch làm theo ca: {str(e)}")
            return []

    def get_by_date_and_shift_department(
        self, nl_ngay: date, clv_stt: int, department_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get registrations for a specific date and shift
        Exclude registrations that have been converted to confirmed schedules
        """
        try:
            # Convert date parameter if needed
            if isinstance(nl_ngay, str):
                nl_ngay = date.fromisoformat(nl_ngay)

            registrations = (
                self.db.session.query(DangKyLichLam)
                .filter(
                    DangKyLichLam.nl_ngay == nl_ngay, DangKyLichLam.clv_stt == clv_stt
                )
                .all()
            )

            result = []
            for reg in registrations:
                # Get detailed information
        
                doctor = (
                    self.db.session.query(BacSi)
                    .filter(BacSi.nv_ma == reg.nv_ma, BacSi.ck_ma == department_id)
                    .first()
                )
                print(doctor)

                # Check if this registration has been converted to a confirmed schedule
                # Chỉ kiểm tra nếu doctor tồn tại
                if doctor:
                    confirmed_schedule = (
                        self.db.session.query(LichLamViec)
                        .filter(
                            LichLamViec.nl_ngay == nl_ngay,
                            LichLamViec.clv_stt == clv_stt,
                            LichLamViec.nv_ma == doctor.nv_ma,
                        )
                        .first()
                    )
                else:
                    confirmed_schedule = None

                # Only include registrations that haven't been converted to schedules
                if not confirmed_schedule:
                    reg_dict = reg.to_dict()
                    if doctor:
                        reg_dict["doctor_info"] = doctor.to_dict()
                    else:
                        continue
                    reg_dict["is_confirmed"] = False
                    reg_dict["status"] = "Chờ xác nhận"
                    result.append(reg_dict)
                else:
                    print(
                        f"Đăng ký của bác sĩ {reg.nv_ma} ngày {nl_ngay} ca {clv_stt} đã được xác nhận, không hiển thị"
                    )

            return result
        except Exception as e:
            print(f"Lỗi khi lấy đăng ký lịch làm theo ngày và ca: {str(e)}")
            return []

    def create(self, data: Dict[str, Any]) -> Optional[DangKyLichLam]:
        """Create a new work registration"""
        try:
            # Convert date string to date object if needed
            nl_ngay = data.get("nl_ngay")
            if isinstance(nl_ngay, str):
                nl_ngay = date.fromisoformat(nl_ngay)

            # Check if registration already exists
            existing = (
                self.db.session.query(DangKyLichLam)
                .filter(
                    DangKyLichLam.nl_ngay == nl_ngay,
                    DangKyLichLam.clv_stt == data.get("clv_stt"),
                    DangKyLichLam.nv_ma == data.get("nv_ma"),
                )
                .first()
            )

            if existing:
                raise ValueError(f"Đăng ký lịch làm đã tồn tại")

            # Validate required fields
            if not all(key in data for key in ["nl_ngay", "clv_stt", "nv_ma"]):
                raise ValueError("Thiếu thông tin bắt buộc cho đăng ký lịch làm")

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

            # Create new registration
            new_registration = DangKyLichLam(
                nl_ngay=nl_ngay, clv_stt=data.get("clv_stt"), nv_ma=data.get("nv_ma")
            )

            self.db.session.add(new_registration)
            self.db.session.commit()
            return new_registration
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi tạo đăng ký lịch làm: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi tạo đăng ký lịch làm: {str(e)}")

    def delete(self, nl_ngay: date, clv_stt: int, nv_ma: str) -> bool:
        """Delete a work registration"""
        try:
            # Convert date parameter if needed
            if isinstance(nl_ngay, str):
                nl_ngay = date.fromisoformat(nl_ngay)

            registration = (
                self.db.session.query(DangKyLichLam)
                .filter(
                    DangKyLichLam.nl_ngay == nl_ngay,
                    DangKyLichLam.clv_stt == clv_stt,
                    DangKyLichLam.nv_ma == nv_ma,
                )
                .first()
            )

            if not registration:
                raise ValueError(f"Không tìm thấy đăng ký lịch làm")

            self.db.session.delete(registration)
            self.db.session.commit()
            return True
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi xóa đăng ký lịch làm: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi xóa đăng ký lịch làm: {str(e)}")

    def get_by_date_range(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Get registrations within a date range, grouped by date"""
        try:
            # Convert date parameters if needed
            if isinstance(start_date, str):
                start_date = date.fromisoformat(start_date)
            if isinstance(end_date, str):
                end_date = date.fromisoformat(end_date)

            registrations = (
                self.db.session.query(DangKyLichLam)
                .filter(
                    DangKyLichLam.nl_ngay >= start_date,
                    DangKyLichLam.nl_ngay <= end_date,
                )
                .all()
            )

            # Group by date
            result = {}
            for reg in registrations:
                date_str = reg.nl_ngay.strftime("%Y-%m-%d")
                if date_str not in result:
                    result[date_str] = []

                # Get doctor and shift information
                doctor = (
                    self.db.session.query(BacSi)
                    .filter(BacSi.nv_ma == reg.nv_ma)
                    .first()
                )

                shift = (
                    self.db.session.query(CaLamViec)
                    .filter(CaLamViec.clv_stt == reg.clv_stt)
                    .first()
                )

                reg_dict = reg.to_dict()
                if doctor:
                    reg_dict["doctor_info"] = {
                        "nv_ma": doctor.nv_ma,
                        "nv_hoten": doctor.nv_hoten,
                        "ck_ma": doctor.ck_ma,
                    }
                if shift:
                    reg_dict["shift_info"] = {
                        "clv_stt": shift.clv_stt,
                        "clv_tgbatdau": (
                            shift.clv_tgbatdau.strftime("%H:%M")
                            if shift.clv_tgbatdau
                            else None
                        ),
                        "clv_tgkthuc": (
                            shift.clv_tgkthuc.strftime("%H:%M")
                            if shift.clv_tgkthuc
                            else None
                        ),
                    }

                result[date_str].append(reg_dict)

            return result
        except Exception as e:
            print(f"Lỗi khi lấy đăng ký lịch làm theo khoảng thời gian: {str(e)}")
            return {}

    def get_by_doctor_and_date_range(
        self, nv_ma: str, start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        """Get registrations for a specific doctor within a date range"""
        try:
            # Convert date parameters if needed
            if isinstance(start_date, str):
                start_date = date.fromisoformat(start_date)
            if isinstance(end_date, str):
                end_date = date.fromisoformat(end_date)

            registrations = (
                self.db.session.query(DangKyLichLam)
                .filter(
                    DangKyLichLam.nv_ma == nv_ma,
                    DangKyLichLam.nl_ngay >= start_date,
                    DangKyLichLam.nl_ngay <= end_date,
                )
                .all()
            )

            result = []
            for reg in registrations:
                # Get shift information
                shift = (
                    self.db.session.query(CaLamViec)
                    .filter(CaLamViec.clv_stt == reg.clv_stt)
                    .first()
                )

                reg_dict = reg.to_dict()
                if shift:
                    reg_dict["shift_info"] = shift.to_dict()

                result.append(reg_dict)

            return result
        except Exception as e:
            print(
                f"Lỗi khi lấy đăng ký lịch làm theo bác sĩ và khoảng thời gian: {str(e)}"
            )
            return []

    def convert_to_schedule(
        self, nl_ngay: date, clv_stt: int, nv_ma: str, phong_ma: str
    ) -> Optional[LichLamViec]:
        """Convert a registration to an actual work schedule"""
        try:
            # Convert date parameter if needed
            if isinstance(nl_ngay, str):
                nl_ngay = date.fromisoformat(nl_ngay)

            # Check if registration exists
            registration = (
                self.db.session.query(DangKyLichLam)
                .filter(
                    DangKyLichLam.nl_ngay == nl_ngay,
                    DangKyLichLam.clv_stt == clv_stt,
                    DangKyLichLam.nv_ma == nv_ma,
                )
                .first()
            )

            if not registration:
                raise ValueError(f"Không tìm thấy đăng ký lịch làm")

            # Check if room exists
            room = (
                self.db.session.query(Phong).filter(Phong.phong_ma == phong_ma).first()
            )

            if not room:
                raise ValueError(f"Không tìm thấy phòng {phong_ma}")

            # Check if schedule already exists
            existing_schedule = (
                self.db.session.query(LichLamViec)
                .filter(
                    LichLamViec.clv_stt == clv_stt,
                    LichLamViec.nl_ngay == nl_ngay,
                    LichLamViec.phong_ma == phong_ma,
                )
                .first()
            )

            if existing_schedule:
                raise ValueError(f"Lịch làm việc cho phòng này đã tồn tại trong ca này")

            # Check if doctor already has a schedule for this shift and date
            doctor_schedule = (
                self.db.session.query(LichLamViec)
                .filter(
                    LichLamViec.clv_stt == clv_stt,
                    LichLamViec.nl_ngay == nl_ngay,
                    LichLamViec.nv_ma == nv_ma,
                )
                .first()
            )

            if doctor_schedule:
                raise ValueError(f"Bác sĩ đã có lịch làm việc trong ca này")

            # Create new schedule
            new_schedule = LichLamViec(
                clv_stt=clv_stt, nl_ngay=nl_ngay, phong_ma=phong_ma, nv_ma=nv_ma
            )

            self.db.session.add(new_schedule)
            self.db.session.commit()
            return new_schedule
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi chuyển đăng ký thành lịch làm việc: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi chuyển đăng ký thành lịch làm việc: {str(e)}")

    def batch_convert_to_schedule(
        self, nl_ngay: date, clv_stt: int, assignments: List[Dict[str, str]]
    ) -> List[Dict[str, Any]]:
        """
        Convert multiple registrations to actual work schedules with room assignments

        Args:
            nl_ngay: Work date
            clv_stt: Shift number
            assignments: List of dictionaries containing {'nv_ma': doctor_id, 'phong_ma': room_id}

        Returns:
            List of created schedules
        """
        try:
            # Convert date parameter if needed
            if isinstance(nl_ngay, str):
                nl_ngay = date.fromisoformat(nl_ngay)

            result = []
            errors = []

            for assignment in assignments:
                nv_ma = assignment.get("nv_ma")
                phong_ma = assignment.get("phong_ma")

                try:
                    schedule = self.convert_to_schedule(
                        nl_ngay, clv_stt, nv_ma, phong_ma
                    )
                    result.append(schedule.to_dict())
                except Exception as e:
                    errors.append(
                        {"nv_ma": nv_ma, "phong_ma": phong_ma, "error": str(e)}
                    )

            return {"success": result, "errors": errors}
        except Exception as e:
            print(f"Lỗi khi chuyển đăng ký thành lịch làm việc hàng loạt: {str(e)}")
            raise Exception(
                f"Lỗi khi chuyển đăng ký thành lịch làm việc hàng loạt: {str(e)}"
            )

    def get_schedule_statistics(
        self, start_date: date, end_date: date
    ) -> Dict[str, Any]:
        """Get statistics about registrations and schedules"""
        try:
            # Convert date parameters if needed
            if isinstance(start_date, str):
                start_date = date.fromisoformat(start_date)
            if isinstance(end_date, str):
                end_date = date.fromisoformat(end_date)

            # Get total registrations
            total_registrations = (
                self.db.session.query(DangKyLichLam)
                .filter(
                    DangKyLichLam.nl_ngay >= start_date,
                    DangKyLichLam.nl_ngay <= end_date,
                )
                .count()
            )

            # Get unique doctors who registered
            unique_doctors = (
                self.db.session.query(DangKyLichLam.nv_ma)
                .filter(
                    DangKyLichLam.nl_ngay >= start_date,
                    DangKyLichLam.nl_ngay <= end_date,
                )
                .distinct()
                .count()
            )

            # Get registrations converted to schedules
            converted_registrations = (
                self.db.session.query(LichLamViec)
                .join(
                    DangKyLichLam,
                    (LichLamViec.nl_ngay == DangKyLichLam.nl_ngay)
                    & (LichLamViec.clv_stt == DangKyLichLam.clv_stt)
                    & (LichLamViec.nv_ma == DangKyLichLam.nv_ma),
                )
                .filter(
                    LichLamViec.nl_ngay >= start_date, LichLamViec.nl_ngay <= end_date
                )
                .count()
            )

            # Calculate conversion rate
            conversion_rate = (
                (converted_registrations / total_registrations) * 100
                if total_registrations > 0
                else 0
            )

            return {
                "total_registrations": total_registrations,
                "unique_doctors": unique_doctors,
                "converted_registrations": converted_registrations,
                "conversion_rate": round(conversion_rate, 2),
            }
        except Exception as e:
            print(f"Lỗi khi lấy thống kê đăng ký lịch làm: {str(e)}")
            return {}

    def is_schedule_confirmed(
        self, nl_ngay: date, clv_stt: int, nv_ma: str, phong_ma: str
    ) -> bool:
        """Check if a schedule conflicts with existing registrations"""
        try:
            # Convert date parameter if needed
            if isinstance(nl_ngay, str):
                nl_ngay = date.fromisoformat(nl_ngay)

            # Check for existing registrations
            existing_schedule = (
                self.db.session.query(LichLamViec)
                .filter(
                    LichLamViec.nl_ngay == nl_ngay,
                    LichLamViec.clv_stt == clv_stt,
                    LichLamViec.nv_ma == nv_ma,
                    LichLamViec.phong_ma == phong_ma,
                )
                .first()
            )

            return existing_schedule is not None
        except Exception as e:
            print(f"Lỗi khi kiểm tra lịch làm việc: {str(e)}")
            return False
