from app.Model import PhieuHen, BacSi, BenhNhan, TrieuChungPhieuHen, TrieuChung
from app.constants.phieu_hen_status import PhieuHenStatus
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, List, Dict, Any
from datetime import date, time, datetime, timedelta


class PhieuHenService:
    def __init__(self, db):
        self.db = db

    def get_all(self, date: date) -> List[PhieuHen]:
        """Lấy tất cả các phiếu hẹn"""
        return self.db.session.query(PhieuHen).filter(PhieuHen.ph_ngayhen == date).all()

    def get_by_id(self, ph_ma: str) -> Optional[PhieuHen]:
        """Lấy phiếu hẹn theo mã phiếu"""
        return self.db.session.query(PhieuHen).filter(PhieuHen.ph_ma == ph_ma).first()

    def get_by_phieukham(self, pk_ma: str, pk_ngaykham: date) -> Optional[PhieuHen]:
        """Lấy các phiếu hẹn theo mã phiếu khám và ngày khám"""
        return (
            self.db.session.query(PhieuHen)
            .filter(PhieuHen.pk_ma == pk_ma, PhieuHen.pk_ngaykham == pk_ngaykham)
            .first()
        )

    def get_by_patient(self, bn_ma: str) -> List[PhieuHen]:
        """Lấy các phiếu hẹn của một bệnh nhân"""
        return self.db.session.query(PhieuHen).filter(PhieuHen.bn_ma == bn_ma).all()

    def get_by_doctor(self, nv_ma: str) -> List[PhieuHen]:
        """Lấy các phiếu hẹn của một bác sĩ"""
        return self.db.session.query(PhieuHen).filter(PhieuHen.nv_ma == nv_ma).all()

    def get_by_day_and_doctor(
        self, appointment_date: date, nv_ma: str
    ) -> List[PhieuHen]:
        """Lấy các phiếu hẹn theo ngày và bác sĩ"""
        return (
            self.db.session.query(PhieuHen)
            .filter(
                PhieuHen.ph_ngayhen == appointment_date,
                PhieuHen.nv_ma == nv_ma,
            )
            .all()
        )

    def get_by_date(self, appointment_date: date) -> List[PhieuHen]:
        """Lấy các phiếu hẹn theo ngày"""
        return (
            self.db.session.query(PhieuHen)
            .filter(PhieuHen.ph_ngayhen == appointment_date)
            .all()
        )

    def create(self, data: Dict[str, Any]) -> Optional[PhieuHen]:
        """Tạo phiếu hẹn mới"""
        try:
            # Kiểm tra sự tồn tại của bệnh nhân và bác sĩ
            benh_nhan = (
                self.db.session.query(BenhNhan)
                .filter(BenhNhan.bn_ma == data["bn_ma"])
                .first()
            )
            bac_si = (
                self.db.session.query(BacSi)
                .filter(BacSi.nv_ma == data["nv_ma"])
                .first()
            )

            if not benh_nhan:
                raise ValueError(f"Bệnh nhân với mã {data['bn_ma']} không tồn tại")
            if not bac_si:
                raise ValueError(f"Bác sĩ với mã {data['nv_ma']} không tồn tại")

            # Kiểm tra thời gian hẹn có sẵn không
            if "ph_ngayhen" in data and "ph_giohen" in data:
                appointment_date = data["ph_ngayhen"]
                appointment_time = data["ph_giohen"]
                appointment_end_time = data.get("ph_gioketthuc")

                if not self._is_time_slot_available(
                    data["nv_ma"],
                    appointment_date,
                    appointment_time,
                    appointment_end_time,
                ):
                    raise ValueError(
                        "Khung giờ đã được đặt, vui lòng chọn thời gian khác"
                    )

            # Tách trường triệu chứng ra khỏi data trước khi tạo đối tượng
            trieu_chung_list = []
            if "trieu_chung" in data:
                trieu_chung_list = data.pop("trieu_chung")

            # Tạo phiếu hẹn mới
            new_appointment = PhieuHen(**data)
            self.db.session.add(new_appointment)

            # Xử lý triệu chứng nếu có
            if (
                trieu_chung_list
                and isinstance(trieu_chung_list, list)
                and len(trieu_chung_list) > 0
            ):
                for tc_ma in trieu_chung_list:
                    trieu_chung = (
                        self.db.session.query(TrieuChung)
                        .filter(TrieuChung.tc_ma == tc_ma)
                        .first()
                    )
                    if trieu_chung:
                        tc_ph = TrieuChungPhieuHen(
                            tc_ma=tc_ma, ph_ma=new_appointment.ph_ma
                        )
                        self.db.session.add(tc_ph)

            self.db.session.commit()
            return new_appointment
        except SQLAlchemyError as e:
            self.db.session.rollback()
            print(f"Lỗi SQL khi tạo phiếu hẹn: {str(e)}")
            raise
        except ValueError as e:
            self.db.session.rollback()
            print(f"Lỗi giá trị khi tạo phiếu hẹn: {str(e)}")
            raise
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi không xác định: {str(e)}")
            raise

    def update(self, ph_ma: str, data: Dict[str, Any]) -> Optional[PhieuHen]:
        """Cập nhật thông tin phiếu hẹn"""
        try:
            appointment = self.get_by_id(ph_ma)
            if not appointment:
                return None

            # Kiểm tra thời gian mới có sẵn không (nếu thay đổi)
            if (
                "ph_ngayhen" in data
                and "ph_giohen" in data
                and (
                    data["ph_ngayhen"] != appointment.ph_ngayhen
                    or data["ph_giohen"] != appointment.ph_giohen
                    or data.get("ph_gioketthuc") != appointment.ph_gioketthuc
                )
            ):

                doctor_id = data.get("nv_ma", appointment.nv_ma)
                appointment_end_time = data.get("ph_gioketthuc")

                if not self._is_time_slot_available(
                    doctor_id,
                    data["ph_ngayhen"],
                    data["ph_giohen"],
                    appointment_end_time,
                    exclude_ph_ma=ph_ma,
                ):
                    raise ValueError(
                        "Khung giờ đã được đặt, vui lòng chọn thời gian khác"
                    )

            # Cập nhật các trường
            for key, value in data.items():
                if key != "trieu_chung":  # Xử lý triệu chứng riêng
                    setattr(appointment, key, value)

            # Cập nhật triệu chứng nếu có
            if "trieu_chung" in data and isinstance(data["trieu_chung"], list):
                # Xóa tất cả triệu chứng cũ
                self.db.session.query(TrieuChungPhieuHen).filter(
                    TrieuChungPhieuHen.ph_ma == ph_ma
                ).delete()

                # Thêm triệu chứng mới
                for tc_ma in data["trieu_chung"]:
                    trieu_chung = (
                        self.db.session.query(TrieuChung)
                        .filter(TrieuChung.tc_ma == tc_ma)
                        .first()
                    )
                    if trieu_chung:
                        tc_ph = TrieuChungPhieuHen(tc_ma=tc_ma, ph_ma=ph_ma)
                        self.db.session.add(tc_ph)

            self.db.session.commit()
            return appointment
        except SQLAlchemyError as e:
            self.db.session.rollback()
            print(f"Lỗi SQL khi cập nhật phiếu hẹn: {str(e)}")
            raise
        except ValueError as e:
            self.db.session.rollback()
            print(f"Lỗi giá trị khi cập nhật phiếu hẹn: {str(e)}")
            raise
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi không xác định: {str(e)}")
            raise

    def delete(self, ph_ma: str) -> bool:
        """Xóa phiếu hẹn"""
        try:
            appointment = self.get_by_id(ph_ma)
            if not appointment:
                return False

            # Xóa các bản ghi liên quan trong bảng trieu_chung_phieu_hen
            self.db.session.query(TrieuChungPhieuHen).filter(
                TrieuChungPhieuHen.ph_ma == ph_ma
            ).delete()

            # Xóa phiếu hẹn
            self.db.session.delete(appointment)
            self.db.session.commit()
            return True
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi xóa phiếu hẹn: {str(e)}")
            return False

    def _is_time_slot_available(
        self,
        doctor_id: str,
        appointment_date: date,
        appointment_time: time,
        appointment_end_time: time = None,
        exclude_ph_ma: str = None,
    ) -> bool:
        """Kiểm tra khung giờ có sẵn cho bác sĩ không"""
        if not appointment_end_time:
            # Nếu không cung cấp giờ kết thúc, kiểm tra theo cách cũ (chỉ so sánh giờ bắt đầu)
            query = (
                self.db.session.query(PhieuHen)
                .filter(PhieuHen.nv_ma == doctor_id)
                .filter(PhieuHen.ph_ngayhen == appointment_date)
                .filter(PhieuHen.ph_giohen == appointment_time)
            )

            if exclude_ph_ma:
                query = query.filter(PhieuHen.ph_ma != exclude_ph_ma)

            return query.first() is None
        else:
            # Kiểm tra chồng lấn thời gian với các phiếu hẹn khác
            existing_appointments = (
                self.db.session.query(PhieuHen)
                .filter(PhieuHen.nv_ma == doctor_id)
                .filter(PhieuHen.ph_ngayhen == appointment_date)
            )

            if exclude_ph_ma:
                existing_appointments = existing_appointments.filter(
                    PhieuHen.ph_ma != exclude_ph_ma
                )

            for appt in existing_appointments.all():
                # Bỏ qua những cuộc hẹn không có giờ kết thúc hoặc giờ bắt đầu
                if not appt.ph_giohen or not appt.ph_gioketthuc:
                    continue

                # Kiểm tra 4 trường hợp chồng lấn thời gian:
                # 1. Thời gian bắt đầu mới nằm trong khoảng thời gian đã có
                # 2. Thời gian kết thúc mới nằm trong khoảng thời gian đã có
                # 3. Thời gian mới bao trùm toàn bộ thời gian cũ
                # 4. Thời gian cũ bao trùm toàn bộ thời gian mới

                if (
                    (
                        appointment_time >= appt.ph_giohen
                        and appointment_time < appt.ph_gioketthuc
                    )
                    or (
                        appointment_end_time > appt.ph_giohen
                        and appointment_end_time <= appt.ph_gioketthuc
                    )
                    or (
                        appointment_time <= appt.ph_giohen
                        and appointment_end_time >= appt.ph_gioketthuc
                    )
                    or (
                        appointment_time >= appt.ph_giohen
                        and appointment_end_time <= appt.ph_gioketthuc
                    )
                ):
                    return False

            return True

    def get_available_slots(self, doctor_id: str, appointment_date: date) -> List[time]:
        """Lấy các khung giờ trống của bác sĩ trong ngày"""
        # Định nghĩa các khung giờ tiêu chuẩn
        standard_slots = [
            time(8, 0),
            time(8, 30),
            time(9, 0),
            time(9, 30),
            time(10, 0),
            time(10, 30),
            time(13, 30),
            time(14, 0),
            time(14, 30),
            time(15, 0),
            time(15, 30),
            time(16, 0),
        ]

        # Lấy các khung giờ đã được đặt
        booked_slots_query = (
            self.db.session.query(PhieuHen.ph_giohen)
            .filter(PhieuHen.nv_ma == doctor_id)
            .filter(PhieuHen.ph_ngayhen == appointment_date)
        )

        booked_slots = [slot[0] for slot in booked_slots_query.all()]

        # Trả về các khung giờ chưa được đặt
        return [slot for slot in standard_slots if slot not in booked_slots]

    def get_max_ph_ma(self) -> str:
        """Tạo mã phiếu hẹn tự động"""
        try:
            last_appointment = (
                self.db.session.query(PhieuHen).order_by(PhieuHen.ph_ma.desc()).first()
            )
            if last_appointment:
                # Phân tích mã hiện tại
                current_id = last_appointment.ph_ma
                if current_id.startswith("PH"):
                    try:
                        num = int(current_id[2:])
                        # Tạo mã mới
                        return f"PH{(num + 1):06d}"
                    except ValueError:
                        # Nếu không phải định dạng số, trả về mã mặc định
                        return "PH000001"
            # Nếu không có bản ghi nào
            return "PH000001"
        except Exception as e:
            print(f"Lỗi khi tạo mã phiếu hẹn: {str(e)}")
            return "PH000001"

    def get_upcoming_appointments(self, days: int = 7) -> List[PhieuHen]:
        """Lấy danh sách các cuộc hẹn sắp tới trong số ngày quy định"""
        today = date.today()
        end_date = today + timedelta(days=days)

        return (
            self.db.session.query(PhieuHen)
            .filter(PhieuHen.ph_ngayhen >= today)
            .filter(PhieuHen.ph_ngayhen <= end_date)
            .order_by(PhieuHen.ph_ngayhen, PhieuHen.ph_giohen)
            .all()
        )

    def update_status(self, ph_ma: str, new_status: str) -> bool:
        """Update appointment status"""
        try:
            phieu_hen = (
                self.db.session.query(PhieuHen).filter(PhieuHen.ph_ma == ph_ma).first()
            )

            if not phieu_hen:
                raise ValueError(f"Không tìm thấy phiếu hẹn {ph_ma}")

            phieu_hen.ph_trangthai = new_status
            self.db.session.commit()

            print(f"Cập nhật trạng thái phiếu hẹn {ph_ma}: {new_status}")
            return True

        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi cập nhật trạng thái: {str(e)}")
            return False

    def get_by_status(self, status: str) -> List[Dict[str, Any]]:
        """Get appointments by status"""
        try:
            phieu_hens = (
                self.db.session.query(PhieuHen)
                .filter(PhieuHen.ph_trangthai == status)
                .all()
            )

            return [ph.to_dict() for ph in phieu_hens]

        except Exception as e:
            print(f"Lỗi khi lấy phiếu hẹn theo trạng thái: {str(e)}")
            return []

    def get_active_appointments(self) -> List[Dict[str, Any]]:
        """Get all active appointments"""
        try:
            active_statuses = PhieuHenStatus.get_active_statuses()
            phieu_hens = (
                self.db.session.query(PhieuHen)
                .filter(PhieuHen.ph_trangthai.in_(active_statuses))
                .all()
            )

            return [ph.to_dict() for ph in phieu_hens]

        except Exception as e:
            print(f"Lỗi khi lấy phiếu hẹn đang hoạt động: {str(e)}")
            return []

    def update_symptoms_from_phieukham(
        self, pk_ma: str, pk_ngaykham: date, trieu_chung_list: list
    ) -> bool:
        """
        Cập nhật danh sách triệu chứng cho phiếu hẹn dựa trên phiếu khám.
        """
        try:
            phieu_hen = (
                self.db.session.query(PhieuHen)
                .filter(PhieuHen.pk_ma == pk_ma, PhieuHen.pk_ngaykham == pk_ngaykham)
                .first()
            )
            if not phieu_hen:
                print(
                    f"Không tìm thấy phiếu hẹn với pk_ma={pk_ma}, pk_ngaykham={pk_ngaykham}"
                )
                return False

            # Xóa các triệu chứng cũ và flush để đảm bảo xóa ngay
            self.db.session.query(TrieuChungPhieuHen).filter(
                TrieuChungPhieuHen.ph_ma == phieu_hen.ph_ma
            ).delete()
            self.db.session.flush()

            # Loại bỏ trùng lặp trong danh sách triệu chứng
            unique_tc_list = list(set(trieu_chung_list))

            # Thêm các triệu chứng mới
            for tc_ma in unique_tc_list:
                trieu_chung = (
                    self.db.session.query(TrieuChung)
                    .filter(TrieuChung.tc_ma == tc_ma)
                    .first()
                )
                if trieu_chung:
                    tc_ph = TrieuChungPhieuHen(tc_ma=tc_ma, ph_ma=phieu_hen.ph_ma)
                    self.db.session.add(tc_ph)

            self.db.session.commit()
            return True
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi cập nhật triệu chứng từ phiếu khám: {str(e)}")
            return False
