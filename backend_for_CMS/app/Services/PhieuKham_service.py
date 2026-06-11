from re import DEBUG
import joblib
import pandas as pd
from datetime import datetime
from datetime import date

from app.ml_models.services import hypertension_predictor
from sqlalchemy import func
from app.Model import PhieuKham, PhieuHen, PhieuCDDVYT, ToaThuoc, BacSi, CaLamViec
from app.Services.BacSi_service import BacSiService
from app.Services.TrieuChung_service import TrieuChungService
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, List, Dict, Any
from app.ml_models.services.diabetes_predictor import diabetes_predictor
from app.ml_models.services.predict_heart_disease import heart_disease_predictor
from app.ml_models.services.hypertension_predictor import hypertension_predictor
from app.Services.LichLamViec_service import LichLamViecService
from app.Model.CaLamViec import CaLamViec
from app.ml_models.services.stroke_predictor import stroke_predictor
from app.constants.phieu_kham_status import PhieuKhamStatus


class PhieuKhamService:
    def __init__(self, db):
        self.db = db
        self.bac_si_service = BacSiService(db)
        self.trieu_chung_service = TrieuChungService(db)
        self.lich_lam_viec_service = LichLamViecService(db)  # Thêm dòng này

    def get_all(self) -> List[PhieuKham]:
        """Lấy tất cả phiếu khám"""
        try:
            return self.db.session.query(PhieuKham).all()
        except Exception as e:
            print(f"Lỗi khi lấy tất cả phiếu khám: {str(e)}")
            return []

    def get_by_id(self, pk_ma: int, pk_ngaykham: date) -> Optional[PhieuKham]:
        """Lấy phiếu khám theo mã và ngày khám"""
        try:
            return (
                self.db.session.query(PhieuKham)
                .filter(PhieuKham.pk_ma == pk_ma, PhieuKham.pk_ngaykham == pk_ngaykham)
                .first()
            )
        except Exception as e:
            print(f"Lỗi khi lấy phiếu khám: {str(e)}")
            return None

    def get_by_phieuhen(self, ph_ma: str) -> Optional[PhieuKham]:
        """Lấy phiếu khám theo mã phiếu hẹn"""
        try:
            return (
                self.db.session.query(PhieuKham)
                .filter(PhieuKham.ph_ma == ph_ma)
                .first()
            )
        except Exception as e:
            print(f"Lỗi khi lấy phiếu khám theo phiếu hẹn: {str(e)}")
            return None

    def get_by_patient(self, bn_ma: str) -> List[Dict[str, Any]]:
        """
        Lấy danh sách phiếu khám theo mã bệnh nhân kèm thông tin bác sĩ

        Args:
            bn_ma: Mã bệnh nhân

        Returns:
            List[Dict[str, Any]]: Danh sách phiếu khám với thông tin bác sĩ
        """
        try:
            # Join PhieuKham với PhieuHen để lấy phiếu khám của bệnh nhân
            phieukhams = (
                self.db.session.query(PhieuKham)
                .join(PhieuHen, (PhieuKham.ph_ma == PhieuHen.ph_ma))
                .filter(PhieuHen.bn_ma == bn_ma)
                .order_by(PhieuKham.pk_ngaykham.desc(), PhieuKham.pk_ma.desc())
                .all()
            )

            if not phieukhams:
                return []

            result = []
            for phieukham in phieukhams:
                # Chuyển đổi phiếu khám thành dictionary
                phieukham_dict = (
                    phieukham.to_dict()
                    if hasattr(phieukham, "to_dict")
                    else {
                        "pk_ma": phieukham.pk_ma,
                        "pk_ngaykham": (
                            phieukham.pk_ngaykham.strftime("%Y-%m-%d")
                            if phieukham.pk_ngaykham
                            else None
                        ),
                        "nv_ma": phieukham.nv_ma,
                        "ph_ma": phieukham.ph_ma,
                        "pk_trangthai": phieukham.pk_trangthai,
                        "pk_chandoan": phieukham.pk_chandoan,
                        "pk_ketluan": phieukham.pk_ketluan,
                        "pk_giokhamdukien": (
                            phieukham.pk_giokhamdukien.strftime("%H:%M:%S")
                            if phieukham.pk_giokhamdukien
                            else None
                        ),
                        "pk_giokhamthucte": (
                            phieukham.pk_giokhamthucte.strftime("%H:%M:%S")
                            if hasattr(phieukham, "pk_giokhamthucte")
                            and phieukham.pk_giokhamthucte
                            else None
                        ),
                        "pk_gioketthuc": (
                            phieukham.pk_gioketthuc.strftime("%H:%M:%S")
                            if hasattr(phieukham, "pk_gioketthuc")
                            and phieukham.pk_gioketthuc
                            else None
                        ),
                        "tt_matthuoc": phieukham.tt_matthuoc,
                        "pcd_ma": phieukham.pcd_ma,
                    }
                )

                # Sử dụng phương thức get_by_phieukham trong BacSi_service
                bac_si_info = None
                try:
                    bac_si = self.bac_si_service.get_by_phieukham(
                        phieukham.pk_ma, phieukham.pk_ngaykham
                    )
                    if bac_si:
                        if isinstance(bac_si, dict):
                            bac_si_info = bac_si
                        elif hasattr(bac_si, "to_dict"):
                            bac_si_info = bac_si.to_dict()
                        else:
                            bac_si_info = {
                                "nv_ma": getattr(bac_si, "nv_ma", None),
                                "nv_hoten": getattr(bac_si, "nv_hoten", None),
                                "nv_chuyenkhoa": getattr(bac_si, "nv_chuyenkhoa", None),
                                "nv_sdt": getattr(bac_si, "nv_sdt", None),
                                "nv_email": getattr(bac_si, "nv_email", None),
                                "ck_ma": getattr(bac_si, "ck_ma", None),
                            }
                except Exception as e:
                    print(
                        f"Lỗi khi lấy thông tin bác sĩ theo phiếu khám {phieukham.pk_ma}: {str(e)}"
                    )
                    bac_si_info = None

                # Thêm thông tin bác sĩ vào phiếu khám
                phieukham_dict["bac_si"] = bac_si_info

                # Lấy thông tin phiếu hẹn liên quan
                phieu_hen_info = None
                if phieukham.ph_ma:
                    try:
                        phieu_hen = (
                            self.db.session.query(PhieuHen)
                            .filter(PhieuHen.ph_ma == phieukham.ph_ma)
                            .first()
                        )

                        if phieu_hen:
                            phieu_hen_info = (
                                phieu_hen.to_dict()
                                if hasattr(phieu_hen, "to_dict")
                                else {
                                    "ph_ma": phieu_hen.ph_ma,
                                    "bn_ma": phieu_hen.bn_ma,
                                    "nv_ma": phieu_hen.nv_ma,
                                    "ph_ngayhen": (
                                        phieu_hen.ph_ngayhen.strftime("%Y-%m-%d")
                                        if phieu_hen.ph_ngayhen
                                        else None
                                    ),
                                    "ph_giohen": (
                                        phieu_hen.ph_giohen.strftime("%H:%M:%S")
                                        if phieu_hen.ph_giohen
                                        else None
                                    ),
                                    "ph_gioketthuc": (
                                        phieu_hen.ph_gioketthuc.strftime("%H:%M:%S")
                                        if phieu_hen.ph_gioketthuc
                                        else None
                                    ),
                                    "ph_trangthai": getattr(
                                        phieu_hen, "ph_trangthai", None
                                    ),
                                    "ph_lydohen": getattr(
                                        phieu_hen, "ph_lydohen", None
                                    ),
                                }
                            )
                    except Exception as e:
                        print(
                            f"Lỗi khi lấy thông tin phiếu hẹn {phieukham.ph_ma}: {str(e)}"
                        )
                        phieu_hen_info = None

                phieukham_dict["phieu_hen"] = phieu_hen_info

                result.append(phieukham_dict)

                print(
                    f"Phiếu khám: {phieukham.pk_ma}, Bác sĩ: {bac_si_info.get('nv_hoten') if bac_si_info else 'Không có'}"
                )

            return result

        except Exception as e:
            print(f"Lỗi khi lấy phiếu khám theo bệnh nhân: {str(e)}")
            return []

    def get_by_patient_with_doctor_info(self, bn_ma: str) -> List[Dict[str, Any]]:
        """
        Lấy danh sách phiếu khám theo mã bệnh nhân kèm đầy đủ thông tin bác sĩ
        Sử dụng phương thức get_by_phieukham từ BacSi_service

        Args:
            bn_ma: Mã bệnh nhân

        Returns:
            List[Dict[str, Any]]: Danh sách phiếu khám với thông tin bác sĩ đầy đủ
        """
        try:
            # Lấy danh sách phiếu khám của bệnh nhân
            phieukhams = (
                self.db.session.query(PhieuKham)
                .join(PhieuHen, (PhieuKham.ph_ma == PhieuHen.ph_ma))
                .filter(PhieuHen.bn_ma == bn_ma)
                .order_by(PhieuKham.pk_ngaykham.desc(), PhieuKham.pk_ma.desc())
                .all()
            )

            if not phieukhams:
                return []

            result = []
            for phieukham in phieukhams:
                # Chuyển đổi phiếu khám thành dictionary
                phieukham_dict = {
                    "pk_ma": phieukham.pk_ma,
                    "pk_ngaykham": (
                        phieukham.pk_ngaykham.strftime("%Y-%m-%d")
                        if phieukham.pk_ngaykham
                        else None
                    ),
                    "nv_ma": phieukham.nv_ma,
                    "ph_ma": phieukham.ph_ma,
                    "pk_trangthai": phieukham.pk_trangthai,
                    "pk_chandoan": phieukham.pk_chandoan,
                    "pk_ketluan": phieukham.pk_ketluan,
                    "pk_giokhamdukien": (
                        phieukham.pk_giokhamdukien.strftime("%H:%M:%S")
                        if phieukham.pk_giokhamdukien
                        else None
                    ),
                    "pk_giokhamthucte": (
                        phieukham.pk_giokhamthucte.strftime("%H:%M:%S")
                        if hasattr(phieukham, "pk_giokhamthucte")
                        and phieukham.pk_giokhamthucte
                        else None
                    ),
                    "pk_gioketthuc": (
                        phieukham.pk_gioketthuc.strftime("%H:%M:%S")
                        if hasattr(phieukham, "pk_gioketthuc")
                        and phieukham.pk_gioketthuc
                        else None
                    ),
                    "tt_matthuoc": phieukham.tt_matthuoc,
                    "pcd_ma": phieukham.pcd_ma,
                }

                # Sử dụng phương thức get_by_phieukham để lấy thông tin bác sĩ
                bac_si_info = None
                try:
                    print(
                        f"Lấy thông tin bác sĩ cho phiếu khám: {phieukham.pk_ma}, ngày: {phieukham.pk_ngaykham}"
                    )
                    bac_si = self.bac_si_service.get_by_phieukham(
                        phieukham.pk_ma, phieukham.pk_ngaykham
                    )

                    if bac_si:
                        # Xử lý trường hợp bac_si là object BacSi
                        bac_si_info = {
                            "nv_ma": getattr(bac_si, "nv_ma", None),
                            "nv_hoten": getattr(bac_si, "nv_hoten", None),
                            "nv_chuyenkhoa": getattr(bac_si, "nv_chuyenkhoa", None),
                            "nv_sdt": getattr(bac_si, "nv_sdt", None),
                            "nv_email": getattr(bac_si, "nv_email", None),
                            "ck_ma": getattr(bac_si, "ck_ma", None),
                            "nv_diachi": getattr(bac_si, "nv_diachi", None),
                            "nv_ngaysinh": (
                                getattr(bac_si, "nv_ngaysinh", None).strftime(
                                    "%Y-%m-%d"
                                )
                                if getattr(bac_si, "nv_ngaysinh", None)
                                else None
                            ),
                            "nv_gioitinh": getattr(bac_si, "nv_gioitinh", None),
                            "nv_cmnd": getattr(bac_si, "nv_cmnd", None),
                        }
                        print(f"Tìm thấy bác sĩ: {bac_si_info['nv_hoten']}")
                    else:
                        print(f"Không tìm thấy bác sĩ cho phiếu khám {phieukham.pk_ma}")

                except Exception as e:
                    print(
                        f"Lỗi khi lấy thông tin bác sĩ theo phiếu khám {phieukham.pk_ma}: {str(e)}"
                    )
                    bac_si_info = None

                # Thêm thông tin bác sĩ vào phiếu khám
                phieukham_dict["bac_si"] = bac_si_info

                # Lấy thông tin phiếu hẹn từ PhieuHen_service thông qua BacSi_service
                phieu_hen_info = None
                try:
                    # Sử dụng phieuhen_service thông qua bac_si_service
                    phieu_hen = self.bac_si_service.phieu_hen_service.get_by_phieukham(
                        phieukham.pk_ma, phieukham.pk_ngaykham
                    )

                    if phieu_hen:
                        phieu_hen_info = {
                            "ph_ma": getattr(phieu_hen, "ph_ma", None),
                            "bn_ma": getattr(phieu_hen, "bn_ma", None),
                            "nv_ma": getattr(phieu_hen, "nv_ma", None),
                            "ph_ngayhen": (
                                getattr(phieu_hen, "ph_ngayhen", None).strftime(
                                    "%Y-%m-%d"
                                )
                                if getattr(phieu_hen, "ph_ngayhen", None)
                                else None
                            ),
                            "ph_giohen": (
                                getattr(phieu_hen, "ph_giohen", None).strftime("%H:%M")
                                if getattr(phieu_hen, "ph_giohen", None)
                                else None
                            ),
                            "ph_gioketthuc": (
                                getattr(phieu_hen, "ph_gioketthuc", None).strftime(
                                    "%H:%M"
                                )
                                if getattr(phieu_hen, "ph_gioketthuc", None)
                                else None
                            ),
                            "ph_trangthai": getattr(phieu_hen, "ph_trangthai", None),
                            "ph_lydohen": getattr(phieu_hen, "ph_lydohen", None),
                        }

                except Exception as e:
                    print(
                        f"Lỗi khi lấy thông tin phiếu hẹn cho phiếu khám {phieukham.pk_ma}: {str(e)}"
                    )
                    phieu_hen_info = None

                phieukham_dict["phieu_hen"] = phieu_hen_info

                result.append(phieukham_dict)

                print(
                    f"Đã xử lý phiếu khám: {phieukham.pk_ma}, Bác sĩ: {bac_si_info.get('nv_hoten') if bac_si_info else 'Không có'}"
                )

            return result

        except Exception as e:
            print(
                f"Lỗi khi lấy phiếu khám theo bệnh nhân với thông tin bác sĩ: {str(e)}"
            )
            return []

    def get_by_doctor(self, nv_ma: str) -> List[PhieuKham]:
        """Lấy phiếu khám theo mã bác sĩ"""
        try:
            return (
                self.db.session.query(PhieuKham)
                .join(PhieuHen, (PhieuKham.ph_ma == PhieuHen.ph_ma))
                .filter(PhieuHen.nv_ma == nv_ma)
                .all()
            )
        except Exception as e:
            print(f"Lỗi khi lấy phiếu khám theo bác sĩ: {str(e)}")
            return []

    def get_by_date_range(self, start_date: date, end_date: date) -> List[PhieuKham]:
        """Lấy phiếu khám theo khoảng ngày"""
        try:
            return (
                self.db.session.query(PhieuKham)
                .filter(
                    PhieuKham.pk_ngaykham >= start_date,
                    PhieuKham.pk_ngaykham <= end_date,
                )
                .order_by(PhieuKham.pk_ngaykham, PhieuKham.pk_ma)
                .all()
            )
        except Exception as e:
            print(f"Lỗi khi lấy phiếu khám theo khoảng ngày: {str(e)}")
            return []

    def get_revenue_by_date(self, date: date) -> float:
        """Lấy tổng doanh thu của phiếu khám trong ngày"""
        try:
            total_revenue = (
                self.db.session.query(
                    (func.count(PhieuKham.pk_ma) * 50000).label("revenue"),
                    PhieuKham.pk_ngaykham,
                )
                .filter(PhieuKham.pk_ngaykham == date)
                .group_by(PhieuKham.pk_ngaykham)
                .first()
            )
            return float(total_revenue[0]) if total_revenue else 0.0
        except SQLAlchemyError as e:
            print(f"Lỗi khi lấy doanh thu theo ngày {date}: {str(e)}")
            return 0.0

    def get_by_derpartment(self, ck_ma: str, date: date) -> List[PhieuKham]:
        """Lấy phiếu khám theo chuyên khoa"""
        try:
            num_of_cases = (
                self.db.session.query(PhieuKham)
                .join(PhieuHen, (PhieuKham.ph_ma == PhieuHen.ph_ma))
                .join(BacSi)
                .filter(BacSi.ck_ma == ck_ma, PhieuKham.pk_ngaykham == date)
                .all()
            )
            return len(num_of_cases)
        except Exception as e:
            print(f"Lỗi khi lấy phiếu khám theo chuyên khoa: {str(e)}")
            return 0

    def create(self, data: Dict[str, Any]) -> Optional[PhieuKham]:
        """Tạo phiếu khám mới"""
        try:
            # Nếu có mã phiếu hẹn, kiểm tra phiếu hẹn tồn tại
            if "ph_ma" in data:
                phieu_hen = (
                    self.db.session.query(PhieuHen)
                    .filter(PhieuHen.ph_ma == data["ph_ma"])
                    .first()
                )

                if not phieu_hen:
                    raise ValueError(f"Phiếu hẹn với mã {data['ph_ma']} không tồn tại")

            # Tự động sinh mã phiếu khám nếu chưa có
            if "pk_ma" not in data:
                data["pk_ma"] = self._generate_pk_ma()

            # Đặt ngày khám là hôm nay nếu chưa có
            if "pk_ngaykham" not in data:
                data["pk_ngaykham"] = date.today()

            # Tạo phiếu khám mới
            new_phieu_kham = PhieuKham(**data)
            self.db.session.add(new_phieu_kham)

            # Cập nhật trạng thái phiếu hẹn nếu có
            if "ph_ma" in data:
                phieu_hen = (
                    self.db.session.query(PhieuHen)
                    .filter(PhieuHen.ph_ma == data["ph_ma"])
                    .first()
                )

                if phieu_hen:
                    # Cập nhật thông tin liên kết từ phiếu hẹn tới phiếu khám
                    phieu_hen.pk_ma = new_phieu_kham.pk_ma
                    phieu_hen.pk_ngaykham = new_phieu_kham.pk_ngaykham

            self.db.session.commit()
            return new_phieu_kham
        except SQLAlchemyError as e:
            self.db.session.rollback()
            print(f"Lỗi SQL khi tạo phiếu khám: {str(e)}")
            raise
        except ValueError as e:
            self.db.session.rollback()
            print(f"Lỗi giá trị khi tạo phiếu khám: {str(e)}")
            raise
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi không xác định: {str(e)}")
            raise

    def update(
        self, pk_ma: int, pk_ngaykham: date, data: Dict[str, Any]
    ) -> Optional[PhieuKham]:
        """Cập nhật phiếu khám"""
        try:
            phieu_kham = self.get_by_id(pk_ma, pk_ngaykham)
            if not phieu_kham:
                return None

            # Không cho phép thay đổi khóa chính
            if "pk_ma" in data:
                del data["pk_ma"]
            if "pk_ngaykham" in data:
                del data["pk_ngaykham"]

            # Cập nhật các trường
            for key, value in data.items():
                setattr(phieu_kham, key, value)

            self.db.session.commit()
            return phieu_kham
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi cập nhật phiếu khám: {str(e)}")
            return None

    def delete(self, pk_ma: int, pk_ngaykham: date) -> bool:
        """Xóa phiếu khám"""
        try:
            phieu_kham = self.get_by_id(pk_ma, pk_ngaykham)
            if not phieu_kham:
                return False

            # Kiểm tra các ràng buộc trước khi xóa
            has_toa_thuoc = (
                self.db.session.query(ToaThuoc)
                .filter(ToaThuoc.pk_ma == pk_ma, ToaThuoc.pk_ngaykham == pk_ngaykham)
                .first()
                is not None
            )

            has_chi_dinh = (
                self.db.session.query(PhieuCDDVYT)
                .filter(
                    PhieuCDDVYT.pk_ma == pk_ma, PhieuCDDVYT.pk_ngaykham == pk_ngaykham
                )
                .first()
                is not None
            )

            if has_toa_thuoc or has_chi_dinh:
                raise ValueError(
                    "Không thể xóa phiếu khám đã có toa thuốc hoặc chỉ định dịch vụ y tế"
                )

            # Cập nhật phiếu hẹn liên quan nếu có
            phieu_hen = (
                self.db.session.query(PhieuHen)
                .filter(PhieuHen.pk_ma == pk_ma, PhieuHen.pk_ngaykham == pk_ngaykham)
                .first()
            )

            if phieu_hen:
                phieu_hen.pk_ma = None
                phieu_hen.pk_ngaykham = None

            # Xóa phiếu khám
            self.db.session.delete(phieu_kham)
            self.db.session.commit()
            return True
        except ValueError as e:
            self.db.session.rollback()
            print(f"Lỗi khi xóa phiếu khám: {str(e)}")
            raise
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi xóa phiếu khám: {str(e)}")
            return False

    def create_from_appointment(self, ph_ma: str, nv_ma: str) -> Optional[PhieuKham]:
        """Tạo phiếu khám từ phiếu hẹn, kiểm tra lịch làm việc của bác sĩ tại thời điểm hiện tại"""
        try:
            # Lấy thông tin phiếu hẹn
            phieu_hen = (
                self.db.session.query(PhieuHen).filter(PhieuHen.ph_ma == ph_ma).first()
            )
            if not phieu_hen:
                raise ValueError(f"Phiếu hẹn với mã {ph_ma} không tồn tại")

            # Lấy ngày hiện tại và giờ hiện tại
            ngay_hen = date.today()
            gio_hien_tai = datetime.now().time()
            print(f"[DEBUG] Giờ hiện tại: {gio_hien_tai}")

            # Lấy nv_ma từ phiếu hẹn (ưu tiên lấy từ phiếu hẹn)
            nv_ma_hen = phieu_hen.nv_ma or nv_ma

            # Kiểm tra lịch làm việc của bác sĩ trong ngày hiện tại
            schedules = self.lich_lam_viec_service.get_by_doctor_and_date(
                nv_ma_hen, ngay_hen
            )
            print(
                f"[DEBUG] Số ca làm việc của bác sĩ {nv_ma_hen} ngày {ngay_hen}: {len(schedules)}"
            )

            if not schedules or len(schedules) == 0:
                raise ValueError(
                    "Hiện tại ngoài giờ làm việc của bác sĩ đã hẹn, không thể lập phiếu khám."
                )

            # Kiểm tra giờ hiện tại có nằm trong ca làm việc nào không
            found = False
            for schedule in schedules:
                clv_stt = schedule.get("clv_stt")
                if clv_stt:
                    ca = (
                        self.db.session.query(CaLamViec)
                        .filter_by(clv_stt=clv_stt)
                        .first()
                    )
                    if ca and ca.clv_tgbatdau and ca.clv_tgkthuc:
                        gio_batdau = ca.clv_tgbatdau
                        gio_ketthuc = ca.clv_tgkthuc
                        print(f"[DEBUG] Ca làm việc: {gio_batdau} - {gio_ketthuc}")
                        if gio_batdau <= gio_hien_tai <= gio_ketthuc:
                            found = True
                            print(
                                f"[DEBUG] Giờ hiện tại {gio_hien_tai} nằm trong ca làm việc này."
                            )
                            break  # Chỉ break khi đã tìm thấy ca hợp lệ
            # Không break nếu chưa tìm thấy, để kiểm tra hết các ca

            if not found:
                print(
                    f"[DEBUG] Giờ hiện tại {gio_hien_tai} không nằm trong bất kỳ ca làm việc nào của bác sĩ."
                )
                raise ValueError(
                    "Hiện tại ngoài giờ làm việc của bác sĩ đã hẹn, không thể lập phiếu khám."
                )

            # Kiểm tra nếu đã có phiếu khám cho phiếu hẹn này
            if phieu_hen.pk_ma is not None and phieu_hen.pk_ngaykham is not None:
                existing_phieu_kham = self.get_by_id(
                    phieu_hen.pk_ma, phieu_hen.pk_ngaykham
                )
                if existing_phieu_kham:
                    return existing_phieu_kham

            # Tạo phiếu khám mới
            new_pk_ma = self._generate_pk_ma()
            today = date.today()
            new_phieu_kham = PhieuKham(
                pk_ma=new_pk_ma,
                nv_ma=nv_ma,
                pk_ngaykham=today,
                ph_ma=ph_ma,
                pk_trangthai="Chờ khám",
                pk_giokhamdukien=phieu_hen.ph_giohen,
            )

            self.db.session.add(new_phieu_kham)

            # Cập nhật phiếu hẹn
            phieu_hen.pk_ma = new_pk_ma
            phieu_hen.pk_ngaykham = today

            self.db.session.commit()
            return new_phieu_kham
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi tạo phiếu khám từ phiếu hẹn: {str(e)}")
            raise ValueError(str(e))

    def _generate_pk_ma(self) -> int:
        """Tạo mã phiếu khám tự động (số tự tăng theo ngày)"""
        try:
            # Lấy ngày hiện tại
            today = date.today()

            # Lấy mã phiếu khám lớn nhất trong ngày
            max_pk = (
                self.db.session.query(self.db.func.max(PhieuKham.pk_ma))
                .filter(PhieuKham.pk_ngaykham == today)
                .scalar()
            )

            return (max_pk or 0) + 1
        except Exception as e:
            print(f"Lỗi khi tạo mã phiếu khám: {str(e)}")
            return 1

    def complete_examination(
        self, pk_ma: int, pk_ngaykham: date, data: Dict[str, Any] = None
    ) -> Optional[PhieuKham]:
        """
        Hoàn thành khám bệnh và cập nhật thông tin sinh hiệu nếu có

        Args:
            pk_ma: Mã phiếu khám
            pk_ngaykham: Ngày khám
            data: Dictionary chứa thông tin cập nhật và sinh hiệu (optional)

        Returns:
            PhieuKham hoặc None nếu có lỗi
        """
        try:
            phieu_kham = self.get_by_id(pk_ma, pk_ngaykham)
            if not phieu_kham:
                return None

            # kiểm tra xem đã tạo toa thuốc và phiếu chỉ định dịch vụ y tế chưa
            if phieu_kham.tt_matthuoc is None:
                raise ValueError(
                    "Phiếu khám chưa có toa thuốc hoặc phiếu chỉ định dịch vụ y tế"
                )

            # Cập nhật thông tin khám
            phieu_kham.pk_trangthai = "Đã khám"
            phieu_kham.pk_giokhamthucte = datetime.now().time()
            phieu_kham.pk_gioketthuc = datetime.now().time()

            # Cập nhật thông tin sinh hiệu nếu có trong data
            if data:
                # Huyết áp
                if "pk_huyetap_tamthu" in data and data["pk_huyetap_tamthu"]:
                    phieu_kham.pk_huyetap_tamthu = data["pk_huyetap_tamthu"]
                if "pk_huyetap_tamtruong" in data and data["pk_huyetap_tamtruong"]:
                    phieu_kham.pk_huyetap_tamtruong = data["pk_huyetap_tamtruong"]

                # Nhiệt độ
                if "pk_nhietdo" in data and data["pk_nhietdo"]:
                    phieu_kham.pk_nhietdo = data["pk_nhietdo"]

                # Nhịp tim và nhịp thở
                if "pk_nhiptim" in data and data["pk_nhiptim"]:
                    phieu_kham.pk_nhiptim = data["pk_nhiptim"]
                if "pk_nhiptho" in data and data["pk_nhiptho"]:
                    phieu_kham.pk_nhiptho = data["pk_nhiptho"]

                # Chiều cao và cân nặng
                if "pk_chieucao" in data and data["pk_chieucao"]:
                    phieu_kham.pk_chieucao = data["pk_chieucao"]
                if "pk_cannang" in data and data["pk_cannang"]:
                    phieu_kham.pk_cannang = data["pk_cannang"]

                print(f"Đã cập nhật thông tin sinh hiệu cho phiếu khám {pk_ma}")

            self.db.session.commit()
            return phieu_kham

        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi hoàn thành khám bệnh: {str(e)}")
            return None

    def get_paginated(
        self,
        offset: int = 0,
        limit: int = 10,
        filters: Dict[str, Any] = None,
        bs_ma: str = None,
    ) -> Dict[str, Any]:
        """
        Lấy danh sách phiếu khám có phân trang và join với phiếu hẹn.
        Nếu có bs_ma thì chỉ lấy phiếu khám có phiếu hẹn với bác sĩ đó.
        """
        try:
            # Bắt đầu truy vấn với join
            query = self.db.session.query(PhieuKham).outerjoin(
                PhieuHen, (PhieuKham.ph_ma == PhieuHen.ph_ma)
            )

            # Thêm các điều kiện lọc nếu có
            if filters:
                for field, value in filters.items():
                    if value is not None:
                        if field == "pk_ngaykham_from":
                            query = query.filter(PhieuKham.pk_ngaykham >= value)
                        elif field == "pk_ngaykham_to":
                            query = query.filter(PhieuKham.pk_ngaykham <= value)
                        elif field == "nv_ma":
                            query = query.filter(PhieuHen.nv_ma == value)
                        elif field == "ph_ma":
                            query = query.filter(PhieuKham.ph_ma == value)
                        elif hasattr(PhieuKham, field):
                            query = query.filter(getattr(PhieuKham, field) == value)

            # Nếu có bs_ma thì chỉ lấy phiếu khám có phiếu hẹn với bác sĩ đó
            if bs_ma:
                query = query.filter(PhieuHen.nv_ma == bs_ma)

            # Đếm tổng số bản ghi thỏa điều kiện
            total = query.count()

            # Luôn sắp xếp theo ngày khám giảm dần (mới nhất lên đầu), rồi đến mã phiếu khám
            query = query.order_by(PhieuKham.pk_ngaykham.desc(), PhieuKham.pk_ma)

            # Thực hiện phân trang
            query = query.offset(offset).limit(limit)

            # Thực hiện truy vấn và lấy kết quả
            records = query.all()

            # Tạo danh sách kết quả với thông tin mở rộng
            result_records = []
            for phieu_kham in records:
                # Lấy thông tin phiếu hẹn liên kết nếu có
                phieu_hen = None
                if phieu_kham.ph_ma:
                    phieu_hen = (
                        self.db.session.query(PhieuHen)
                        .filter(PhieuHen.ph_ma == phieu_kham.ph_ma)
                        .first()
                    )

                # Tạo dict từ phiếu khám
                pk_dict = (
                    phieu_kham.to_dict()
                    if hasattr(phieu_kham, "to_dict")
                    else {
                        "pk_ma": phieu_kham.pk_ma,
                        "pk_ngaykham": (
                            phieu_kham.pk_ngaykham.strftime("%Y-%m-%d")
                            if phieu_kham.pk_ngaykham
                            else None
                        ),
                        "nv_ma": phieu_kham.nv_ma,
                        "ph_ma": phieu_kham.ph_ma,
                        "pk_trangthai": phieu_kham.pk_trangthai,
                        "pk_chandoan": phieu_kham.pk_chandoan,
                        "pk_ketluan": phieu_kham.pk_ketluan,
                        "pk_giokhamdukien": (
                            phieu_kham.pk_giokhamdukien.strftime("%H:%M")
                            if hasattr(phieu_kham, "pk_giokhamdukien")
                            and phieu_kham.pk_giokhamdukien
                            else None
                        ),
                    }
                )

                # Thêm thông tin phiếu hẹn nếu có
                if phieu_hen:
                    pk_dict["phieu_hen"] = (
                        phieu_hen.to_dict()
                        if hasattr(phieu_hen, "to_dict")
                        else {
                            "ph_ma": phieu_hen.ph_ma,
                            "bn_ma": phieu_hen.bn_ma,
                            "nv_ma": phieu_hen.nv_ma,
                            "ph_ngayhen": (
                                phieu_hen.ph_ngayhen.strftime("%Y-%m-%d")
                                if phieu_hen.ph_ngayhen
                                else None
                            ),
                            "ph_giohen": (
                                phieu_hen.ph_giohen.strftime("%H:%M")
                                if phieu_hen.ph_giohen
                                else None
                            ),
                            "ph_gioketthuc": (
                                phieu_hen.ph_gioketthuc.strftime("%H:%M")
                                if phieu_hen.ph_gioketthuc
                                else None
                            ),
                        }
                    )

                result_records.append(pk_dict)

            return {
                "data": result_records,  # Sử dụng danh sách với thông tin mở rộng
                "total": total,
                "offset": offset,
                "limit": limit,
                "has_more": offset + len(records) < total,
            }
        except Exception as e:
            print(f"Lỗi khi lấy danh sách phiếu khám có phân trang: {str(e)}")
            return {
                "data": [],
                "total": 0,
                "offset": offset,
                "limit": limit,
                "has_more": False,
            }

    # Hàm lấy pcd_ma của phiếu khám theo mã và ngày khám
    def get_pcd_ma(self, pk_ma: int, pk_ngaykham: date) -> Optional[int]:
        """Lấy mã phiếu chỉ định dịch vụ y tế theo mã phiếu khám và ngày khám"""
        try:
            phieu_kham = (
                self.db.session.query(PhieuKham)
                .filter(PhieuKham.pk_ma == pk_ma, PhieuKham.pk_ngaykham == pk_ngaykham)
                .first()
            )
            if phieu_kham:
                return phieu_kham.pcd_ma
            return None
        except Exception as e:
            print(f"Lỗi khi lấy pcd_ma: {str(e)}")
            return None

    def get_trieuchung_by_phieukham(
        self, pk_ma: int, pk_ngaykham: date
    ) -> List[Dict[str, Any]]:
        """Lấy tất cả triệu chứng của phiếu khám"""
        try:
            phieu_hen = (
                self.db.session.query(PhieuHen)
                .filter(PhieuHen.pk_ma == pk_ma, PhieuHen.pk_ngaykham == pk_ngaykham)
                .first()
            )
            if not phieu_hen:
                print(f"Không tìm thấy phiếu hẹn với mã {pk_ma} và ngày {pk_ngaykham}")
                return []

            trieu_chungs = self.trieu_chung_service.get_all_by_phieu_hen(
                phieu_hen.ph_ma
            )
            return [tc.to_dict() for tc in trieu_chungs]
        except Exception as e:
            print(f"Lỗi khi lấy triệu chứng của phiếu khám: {str(e)}")
            return []

    def get_completed_examinations(
        self, target_date: date = None
    ) -> List[Dict[str, Any]]:
        """
        Lấy danh sách phiếu khám có trạng thái "Đã khám"

        Args:
            target_date: Ngày cần lấy dữ liệu (mặc định là hôm nay)

        Returns:
            List[Dict[str, Any]]: Danh sách phiếu khám đã khám
        """
        try:
            if target_date is None:
                target_date = date.today()

            # Query phiếu khám có trạng thái "Đã khám"
            phieu_khams = (
                self.db.session.query(PhieuKham)
                .filter(
                    PhieuKham.pk_ngaykham == target_date,
                    PhieuKham.pk_trangthai == "Đã khám",
                )
                .order_by(PhieuKham.pk_gioketthuc.desc(), PhieuKham.pk_ma.desc())
                .all()
            )

            if not phieu_khams:
                return []
            print(
                f"Đã tìm thấy {len(phieu_khams)} phiếu khám đã khám ngày {target_date}."
            )
            result = []
            for pk in phieu_khams:
                # Build basic examination dict
                pk_dict = {
                    "pk_ma": pk.pk_ma,
                    "pk_ngaykham": (
                        pk.pk_ngaykham.strftime("%Y-%m-%d") if pk.pk_ngaykham else None
                    ),
                    "pk_trangthai": pk.pk_trangthai,
                    "pk_giokhamdukien": (
                        pk.pk_giokhamdukien.strftime("%H:%M:%S")
                        if pk.pk_giokhamdukien
                        else None
                    ),
                    "pk_giokhamthucte": (
                        pk.pk_giokhamthucte.strftime("%H:%M:%S")
                        if hasattr(pk, "pk_giokhamthucte") and pk.pk_giokhamthucte
                        else None
                    ),
                    "pk_gioketthuc": (
                        pk.pk_gioketthuc.strftime("%H:%M:%S")
                        if hasattr(pk, "pk_gioketthuc") and pk.pk_gioketthuc
                        else None
                    ),
                    "tt_matthuoc": pk.tt_matthuoc,
                    "pcd_ma": pk.pcd_ma,
                }

                # Thêm thông tin phiếu hẹn và bệnh nhân

                # Thêm thông tin triệu chứng

                result.append(pk_dict)

            return result

        except Exception as e:
            print(f"Lỗi khi lấy phiếu khám đã khám ngày {target_date}: {str(e)}")
            return []

    def get_all_completed_examinations(self) -> List[Dict[str, Any]]:
        """
        Lấy tất cả phiếu khám có trạng thái "Đã khám" (không phân biệt ngày)

        Returns:
            List[Dict[str, Any]]: Danh sách tất cả phiếu khám đã khám
        """
        try:
            # Query tất cả phiếu khám có trạng thái "Đã khám"
            phieu_khams = (
                self.db.session.query(PhieuKham)
                .filter(PhieuKham.pk_trangthai == "Đã khám")
                .order_by(
                    PhieuKham.pk_ngaykham.desc(),
                    PhieuKham.pk_gioketthuc.desc(),
                    PhieuKham.pk_ma.desc(),
                )
                .all()
            )

            if not phieu_khams:
                return []
            print(f"Đã tìm thấy {len(phieu_khams)} phiếu khám đã khám.")

            result = []
            for pk in phieu_khams:
                # Build examination dict tương tự như hàm trên
                pk_dict = {
                    "pk_ma": pk.pk_ma,
                    "pk_ngaykham": (
                        pk.pk_ngaykham.strftime("%Y-%m-%d") if pk.pk_ngaykham else None
                    ),
                    "nv_ma": pk.nv_ma,
                    "ph_ma": pk.ph_ma,
                    "pk_trangthai": pk.pk_trangthai,
                    "pk_giokhamdukien": (
                        pk.pk_giokhamdukien.strftime("%H:%M:%S")
                        if pk.pk_giokhamdukien
                        else None
                    ),
                    "pk_giokhamthucte": (
                        pk.pk_giokhamthucte.strftime("%H:%M:%S")
                        if hasattr(pk, "pk_giokhamthucte") and pk.pk_giokhamthucte
                        else None
                    ),
                    "pk_gioketthuc": (
                        pk.pk_gioketthuc.strftime("%H:%M:%S")
                        if hasattr(pk, "pk_gioketthuc") and pk.pk_gioketthuc
                        else None
                    ),
                    "tt_matthuoc": pk.tt_matthuoc,
                    "pcd_ma": pk.pcd_ma,
                }

                # Thêm thông tin phiếu hẹn
                if pk.ph_ma:
                    try:
                        phieu_hen = (
                            self.db.session.query(PhieuHen)
                            .filter(PhieuHen.ph_ma == pk.ph_ma)
                            .first()
                        )

                        if phieu_hen:
                            pk_dict["phieu_hen"] = {
                                "ph_ma": phieu_hen.ph_ma,
                                "nv_ma": phieu_hen.nv_ma,
                                "ph_ngayhen": (
                                    phieu_hen.ph_ngayhen.strftime("%Y-%m-%d")
                                    if phieu_hen.ph_ngayhen
                                    else None
                                ),
                                "ph_giohen": (
                                    phieu_hen.ph_giohen.strftime("%H:%M:%S")
                                    if phieu_hen.ph_giohen
                                    else None
                                ),
                                "ph_trangthai": getattr(
                                    phieu_hen, "ph_trangthai", None
                                ),
                            }
                            pk_dict["bn_ma"] = phieu_hen.bn_ma
                        else:
                            pk_dict["phieu_hen"] = None
                            pk_dict["bn_ma"] = None
                    except Exception as e:
                        print(f"Lỗi khi lấy thông tin phiếu hẹn: {str(e)}")
                        pk_dict["phieu_hen"] = None
                        pk_dict["bn_ma"] = None

                result.append(pk_dict)

            return result

        except Exception as e:
            print(f"Lỗi khi lấy tất cả phiếu khám đã khám: {str(e)}")
            return []

    def get_completed_examinations_by_date_range(
        self, start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        """
        Lấy phiếu khám "Đã khám" trong khoảng thời gian

        Args:
            start_date: Ngày bắt đầu
            end_date: Ngày kết thúc

        Returns:
            List[Dict[str, Any]]: Danh sách phiếu khám đã khám trong khoảng thời gian
        """
        try:
            # Query phiếu khám trong khoảng thời gian
            phieu_khams = (
                self.db.session.query(PhieuKham)
                .filter(
                    PhieuKham.pk_trangthai == "Đã khám",
                    PhieuKham.pk_ngaykham >= start_date,
                    PhieuKham.pk_ngaykham <= end_date,
                )
                .order_by(
                    PhieuKham.pk_ngaykham.desc(),
                    PhieuKham.pk_gioketthuc.desc(),
                    PhieuKham.pk_ma.desc(),
                )
                .all()
            )

            if not phieu_khams:
                return []

            result = []
            for pk in phieu_khams:
                pk_dict = {
                    "pk_ma": pk.pk_ma,
                    "pk_ngaykham": (
                        pk.pk_ngaykham.strftime("%Y-%m-%d") if pk.pk_ngaykham else None
                    ),
                    "pk_trangthai": pk.pk_trangthai,
                    "pk_chandoan": pk.pk_chandoan,
                    "pk_ketluan": pk.pk_ketluan,
                    "pk_gioketthuc": (
                        pk.pk_gioketthuc.strftime("%H:%M:%S")
                        if hasattr(pk, "pk_gioketthuc") and pk.pk_gioketthuc
                        else None
                    ),
                    "tt_matthuoc": pk.tt_matthuoc,
                    "pcd_ma": pk.pcd_ma,
                }

                # Thêm thông tin cơ bản bệnh nhân và bác sĩ
                if pk.ph_ma:
                    phieu_hen = (
                        self.db.session.query(PhieuHen)
                        .filter(PhieuHen.ph_ma == pk.ph_ma)
                        .first()
                    )

                    if phieu_hen:
                        pk_dict["bn_ma"] = phieu_hen.bn_ma

                        # Thông tin bác sĩ
                        try:
                            bac_si = self.bac_si_service.get_by_phieukham(
                                pk.pk_ma, pk.pk_ngaykham
                            )
                            if bac_si:
                                pk_dict["bac_si_ten"] = getattr(
                                    bac_si, "nv_hoten", None
                                )
                                pk_dict["bac_si_chuyenkhoa"] = getattr(
                                    bac_si, "nv_chuyenkhoa", None
                                )
                        except Exception as e:
                            print(f"Lỗi khi lấy thông tin bác sĩ: {str(e)}")

                result.append(pk_dict)

            return result

        except Exception as e:
            print(f"Lỗi khi lấy phiếu khám đã khám theo khoảng thời gian: {str(e)}")
            return []

    def get_completed_examinations_summary_by_date(
        self, target_date: date = None
    ) -> Dict[str, Any]:
        """
        Lấy tóm tắt thống kê phiếu khám đã khám theo ngày

        Args:
            target_date: Ngày cần thống kê (mặc định là hôm nay)

        Returns:
            Dict chứa thống kê tổng hợp
        """
        try:
            if target_date is None:
                target_date = date.today()

            examinations = self.get_completed_examinations(target_date)

            total_examinations = len(examinations)
            examinations_with_medicine = 0
            examinations_with_services = 0
            unique_doctors = set()
            unique_patients = set()

            for exam in examinations:
                # Đếm phiếu khám có toa thuốc
                if exam.get("tt_matthuoc"):
                    examinations_with_medicine += 1

                # Đếm phiếu khám có dịch vụ y tế
                if exam.get("pcd_ma"):
                    examinations_with_services += 1

                # Đếm bác sĩ duy nhất
                if exam.get("bac_si") and exam["bac_si"].get("nv_ma"):
                    unique_doctors.add(exam["bac_si"]["nv_ma"])

                # Đếm bệnh nhân duy nhất
                if exam.get("bn_ma"):
                    unique_patients.add(exam["bn_ma"])

            return {
                "date": target_date.strftime("%Y-%m-%d"),
                "total_examinations": total_examinations,
                "examinations_with_medicine": examinations_with_medicine,
                "examinations_with_services": examinations_with_services,
                "unique_doctors_count": len(unique_doctors),
                "unique_patients_count": len(unique_patients),
                "statistics": {
                    "medicine_percentage": (
                        round(
                            (examinations_with_medicine / total_examinations * 100), 2
                        )
                        if total_examinations > 0
                        else 0
                    ),
                    "services_percentage": (
                        round(
                            (examinations_with_services / total_examinations * 100), 2
                        )
                        if total_examinations > 0
                        else 0
                    ),
                    "average_examinations_per_doctor": (
                        round(total_examinations / len(unique_doctors), 2)
                        if len(unique_doctors) > 0
                        else 0
                    ),
                    "average_examinations_per_patient": (
                        round(total_examinations / len(unique_patients), 2)
                        if len(unique_patients) > 0
                        else 0
                    ),
                },
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }

        except Exception as e:
            print(f"Lỗi khi tạo báo cáo tóm tắt phiếu khám đã khám: {str(e)}")
            return {
                "date": target_date.strftime("%Y-%m-%d") if target_date else None,
                "total_examinations": 0,
                "error": str(e),
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }

    def get_completed_examinations_by_doctor(
        self, nv_ma: str, target_date: date = None
    ) -> List[Dict[str, Any]]:
        """
        Lấy phiếu khám đã khám theo bác sĩ

        Args:
            nv_ma: Mã nhân viên (bác sĩ)
            target_date: Ngày cần lấy (mặc định là hôm nay)

        Returns:
            List[Dict[str, Any]]: Danh sách phiếu khám đã khám của bác sĩ
        """
        try:
            if target_date is None:
                target_date = date.today()

            # Query phiếu khám đã khám của bác sĩ cụ thể
            phieu_khams = (
                self.db.session.query(PhieuKham)
                .join(PhieuHen, PhieuKham.ph_ma == PhieuHen.ph_ma)
                .filter(
                    PhieuKham.pk_trangthai == "Đã khám",
                    PhieuKham.pk_ngaykham == target_date,
                    PhieuHen.nv_ma == nv_ma,
                )
                .order_by(PhieuKham.pk_gioketthuc.desc(), PhieuKham.pk_ma.desc())
                .all()
            )

            if not phieu_khams:
                return []

            result = []
            for pk in phieu_khams:
                pk_dict = {
                    "pk_ma": pk.pk_ma,
                    "pk_ngaykham": pk.pk_ngaykham.strftime("%Y-%m-%d"),
                    "pk_trangthai": pk.pk_trangthai,
                    "pk_chandoan": pk.pk_chandoan,
                    "pk_ketluan": pk.pk_ketluan,
                    "pk_gioketthuc": (
                        pk.pk_gioketthuc.strftime("%H:%M:%S")
                        if hasattr(pk, "pk_gioketthuc") and pk.pk_gioketthuc
                        else None
                    ),
                    "tt_matthuoc": pk.tt_matthuoc,
                    "pcd_ma": pk.pcd_ma,
                }

                # Thêm thông tin bệnh nhân
                if pk.ph_ma:
                    phieu_hen = (
                        self.db.session.query(PhieuHen)
                        .filter(PhieuHen.ph_ma == pk.ph_ma)
                        .first()
                    )

                    if phieu_hen:
                        pk_dict["bn_ma"] = phieu_hen.bn_ma

            result.append(pk_dict)

            return result

        except Exception as e:
            print(f"Lỗi khi lấy phiếu khám đã khám theo bác sĩ: {str(e)}")
            return []

    def predict_diabetes(
        self, pk_ma: int = None, pk_ngaykham: date = None, data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Dự đoán nguy cơ tiểu đường sử dụng ML model"""
        try:
            # Chuẩn bị dữ liệu đầu vào
            input_data = {}

            if data:
                # Sử dụng dữ liệu trực tiếp
                input_data = data
                data_source = "direct_input"
            elif pk_ma and pk_ngaykham:
                # Lấy từ phiếu khám
                phieu_kham = self.get_by_id(pk_ma, pk_ngaykham)
                if not phieu_kham:
                    return {
                        "success": False,
                        "message": f"Không tìm thấy phiếu khám với mã {pk_ma} và ngày {pk_ngaykham}",
                    }

                # Mapping từ phiếu khám sang input data
                input_data = self._map_phieukham_to_diabetes_input(phieu_kham)
                data_source = f"phieu_kham_{pk_ma}"
            else:
                return {
                    "success": False,
                    "message": "Không có đủ dữ liệu để dự đoán. Vui lòng cung cấp dữ liệu hoặc mã phiếu khám.",
                }

            # Đảm bảo có các trường bắt buộc
            if "age" not in input_data or not input_data["age"]:
                input_data["age"] = 40  # Default age
            if "gender" not in input_data or not input_data["gender"]:
                input_data["gender"] = "Male"  # Default gender

            # Thực hiện dự đoán sử dụng diabetes_predictor
            prediction_result = diabetes_predictor.predict_diabetes(input_data)

            # Kiểm tra lỗi trong kết quả dự đoán
            if "error" in prediction_result:
                return {
                    "success": False,
                    "message": "Dự đoán thất bại",
                    "error": prediction_result.get("error", "Unknown error"),
                    "prediction_result": prediction_result,
                }

            # Tạo kết quả trả về với format đầy đủ
            result = {
                "success": True,
                "data_source": data_source,
                "input_data": input_data,
                "prediction": prediction_result.get("prediction"),
                "probability": prediction_result.get("probability"),
                "probability_percentage": prediction_result.get(
                    "probability_percentage"
                ),
                "prediction_label": prediction_result.get("prediction_label"),
                "risk_level": prediction_result.get("risk_level"),
                "model_confidence": prediction_result.get("model_confidence"),
                "input_data_used": prediction_result.get("input_data_used", {}),
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }

            return result

        except Exception as e:
            import traceback

            return {
                "success": False,
                "message": f"Lỗi khi dự đoán tiểu đường: {str(e)}",
                "error": str(e),
                "traceback": traceback.format_exc(),
            }

    def get_diabetes_input_requirements(self) -> Dict[str, Any]:
        """Lấy input requirements từ diabetes predictor"""
        try:
            # Sử dụng diabetes_predictor đã import
            requirements = diabetes_predictor.get_input_requirements()
            return {"success": True, **requirements}
        except Exception as e:
            return {
                "success": False,
                "message": f"Lỗi khi lấy diabetes input requirements: {str(e)}",
            }

    def predict_heart_disease(
        self, pk_ma: int = None, pk_ngaykham: date = None, data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Dự đoán nguy cơ bệnh tim sử dụng ML model"""
        try:
            # Chuẩn bị dữ liệu đầu vào
            input_data = {}

            if data:
                # Sử dụng dữ liệu trực tiếp
                input_data = data
                data_source = "direct_input"
            elif pk_ma and pk_ngaykham:
                # Lấy từ phiếu khám
                phieu_kham = self.get_by_id(pk_ma, pk_ngaykham)
                if not phieu_kham:
                    return {
                        "success": False,
                        "message": f"Không tìm thấy phiếu khám với mã {pk_ma} và ngày {pk_ngaykham}",
                    }

                # Mapping từ phiếu khám sang input data
                input_data = self._map_phieukham_to_heart_disease_input(phieu_kham)
                data_source = f"phieu_kham_{pk_ma}"
            else:
                return {
                    "success": False,
                    "message": "Không có đủ dữ liệu để dự đoán. Vui lòng cung cấp dữ liệu hoặc mã phiếu khám.",
                }

            # Đảm bảo có các trường bắt buộc
            if "age" not in input_data or not input_data["age"]:
                input_data["age"] = 50  # Default age
            if "sex" not in input_data or input_data["sex"] is None:
                input_data["sex"] = 1  # Default male

            # Thực hiện dự đoán sử dụng heart_disease_predictor
            prediction_result = heart_disease_predictor.predict_heart_disease(
                input_data
            )

            # Kiểm tra lỗi trong kết quả dự đoán
            if "error" in prediction_result:
                return {
                    "success": False,
                    "message": "Dự đoán thất bại",
                    "error": prediction_result.get("error", "Unknown error"),
                    "prediction_result": prediction_result,
                }

            # Tạo kết quả trả về với format đầy đủ
            result = {
                "success": True,
                "data_source": data_source,
                "input_data": input_data,
                "prediction": prediction_result.get("prediction"),
                "probability": prediction_result.get("probability"),
                "probability_percentage": prediction_result.get(
                    "probability_percentage"
                ),
                "prediction_label": prediction_result.get("prediction_label"),
                "risk_level": prediction_result.get("risk_level"),
                "confidence": prediction_result.get("confidence"),
                "model_confidence": prediction_result.get("model_confidence"),
                "diagnosis": prediction_result.get("diagnosis"),
                "input_data_used": prediction_result.get("input_data_used", {}),
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }

            return result

        except Exception as e:
            import traceback

            return {
                "success": False,
                "message": f"Lỗi khi dự đoán bệnh tim: {str(e)}",
                "error": str(e),
                "traceback": traceback.format_exc(),
            }

    def get_heart_disease_input_requirements(self) -> Dict[str, Any]:
        """Lấy input requirements từ heart disease predictor"""
        try:
            # Sử dụng heart_disease_predictor đã import
            requirements = heart_disease_predictor.get_input_requirements()
            return {"success": True, **requirements}
        except Exception as e:
            return {
                "success": False,
                "message": f"Lỗi khi lấy heart disease input requirements: {str(e)}",
            }

    def predict_stroke(
        self, pk_ma: int = None, pk_ngaykham: date = None, data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Dự đoán nguy cơ đột quỵ sử dụng ML model stroke_predictor.
        Args:
            pk_ma: Mã phiếu khám
            pk_ngaykham: Ngày khám
            data: Dict thông tin bệnh nhân (nếu không lấy từ phiếu khám)
        Returns:
            Dict kết quả dự đoán
        """
        try:
            input_data = {}

            if data:
                input_data = data
                data_source = "direct_input"
            elif pk_ma and pk_ngaykham:
                phieu_kham = self.get_by_id(pk_ma, pk_ngaykham)
                if not phieu_kham:
                    return {
                        "success": False,
                        "message": f"Không tìm thấy phiếu khám với mã {pk_ma} và ngày {pk_ngaykham}",
                    }
                input_data = self._map_phieukham_to_stroke_input(phieu_kham)
                data_source = f"phieu_kham_{pk_ma}"
            else:
                return {
                    "success": False,
                    "message": "Không có đủ dữ liệu để dự đoán. Vui lòng cung cấp dữ liệu hoặc mã phiếu khám.",
                }

            # Đảm bảo các trường bắt buộc cho model stroke
            required_fields = [
                "gender",
                "age",
                "hypertension",
                "heart_disease",
                "ever_married",
                "work_type",
                "Residence_type",
                "avg_glucose_level",
                "bmi",
                "smoking_status",
            ]
            for field in required_fields:
                if field not in input_data or input_data[field] is None:
                    return {
                        "success": False,
                        "message": f"Thiếu trường bắt buộc: {field}",
                        "missing_field": field,
                    }

            prediction_result = stroke_predictor.predict_stroke(input_data)

            if "error" in prediction_result:
                return {
                    "success": False,
                    "message": "Dự đoán thất bại",
                    "error": prediction_result.get("error", "Unknown error"),
                    "prediction_result": prediction_result,
                }

            result = {
                "success": True,
                "data_source": data_source,
                "input_data": input_data,
                "prediction": prediction_result.get("prediction"),
                "probability": prediction_result.get("probability"),
                "probability_percentage": prediction_result.get(
                    "probability_percentage"
                ),
                "prediction_label": prediction_result.get("prediction_label"),
                "input_data_used": prediction_result.get("input_data_used", {}),
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }

            return result

        except Exception as e:
            import traceback

            return {
                "success": False,
                "message": f"Lỗi khi dự đoán đột quỵ: {str(e)}",
                "error": str(e),
                "traceback": traceback.format_exc(),
            }

    def get_stroke_input_requirements(self) -> Dict[str, Any]:
        """Lấy input requirements từ stroke_predictor"""
        try:
            requirements = stroke_predictor.get_input_requirements()
            return {"success": True, **requirements}
        except Exception as e:
            return {
                "success": False,
                "message": f"Lỗi khi lấy stroke input requirements: {str(e)}",
            }

    def _map_phieukham_to_stroke_input(self, phieu_kham) -> Dict[str, Any]:
        """
        Mapping từ phiếu khám sang input cho stroke model.
        Bạn cần chỉnh lại mapping này cho đúng với dữ liệu thực tế của bạn.
        """
        input_data = {}
        try:
            # Lấy thông tin bệnh nhân
            if hasattr(phieu_kham, "benhnhan"):
                bn = phieu_kham.benhnhan
                # gender: "Male"/"Female"
                if hasattr(bn, "bn_gioitinh"):
                    gender_str = str(bn.bn_gioitinh)
                    input_data["gender"] = (
                        "Male"
                        if gender_str.lower() in ["nam", "male", "m", "1"]
                        else "Female"
                    )
                # age
                if hasattr(bn, "bn_ngaysinh") and bn.bn_ngaysinh:
                    today = date.today()
                    input_data["age"] = today.year - bn.bn_ngaysinh.year

            # hypertension, heart_disease
            input_data["hypertension"] = getattr(phieu_kham, "pk_tanghuyetap", 0)
            input_data["heart_disease"] = getattr(phieu_kham, "pk_benh_tim", 0)

            # ever_married
            input_data["ever_married"] = getattr(
                phieu_kham, "pk_tinhtrang_honnhan", "No"
            )
            # work_type
            input_data["work_type"] = getattr(phieu_kham, "pk_nghenghiep", "Private")
            # Residence_type
            input_data["Residence_type"] = getattr(phieu_kham, "pk_noio", "Urban")
            # avg_glucose_level
            input_data["avg_glucose_level"] = getattr(
                phieu_kham, "pk_duonghuyet_tb", 100.0
            )
            # bmi
            if (
                hasattr(phieu_kham, "pk_chieucao")
                and hasattr(phieu_kham, "pk_cannang")
                and phieu_kham.pk_chieucao
                and phieu_kham.pk_cannang
            ):
                height_m = phieu_kham.pk_chieucao / 100
                input_data["bmi"] = round(phieu_kham.pk_cannang / (height_m**2), 2)
            else:
                input_data["bmi"] = getattr(phieu_kham, "pk_bmi", 22.0)
            # smoking_status
            input_data["smoking_status"] = getattr(
                phieu_kham, "pk_hutthuoc", "never smoked"
            )

        except Exception as e:
            print(f"❌ Error mapping phieu kham to stroke input: {e}")

        return input_data

    def predict_hypertension(
        self, pk_ma: int = None, pk_ngaykham: date = None, data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Dự đoán nguy cơ tăng huyết áp sử dụng ML model hypertension_predictor.
        Args:
            pk_ma: Mã phiếu khám
            pk_ngaykham: Ngày khám
            data: Dict thông tin bệnh nhân (nếu không lấy từ phiếu khám)
        Returns:
            Dict kết quả dự đoán
        """
        try:
            input_data = {}

            if data:
                input_data = data
                data_source = "direct_input"
            elif pk_ma and pk_ngaykham:
                phieu_kham = self.get_by_id(pk_ma, pk_ngaykham)
                if not phieu_kham:
                    return {
                        "success": False,
                        "message": f"Không tìm thấy phiếu khám với mã {pk_ma} và ngày {pk_ngaykham}",
                    }
                input_data = self._map_phieukham_to_hypertension_input(phieu_kham)
                data_source = f"phieu_kham_{pk_ma}"
            else:
                return {
                    "success": False,
                    "message": "Không có đủ dữ liệu để dự đoán. Vui lòng cung cấp dữ liệu hoặc mã phiếu khám.",
                }

            # Đảm bảo các trường bắt buộc cho model hypertension
            required_fields = [
                "age",
                "bmi",
                "salt_intake_level",
                "stress_score",
                "sleep_duration",
                "bp_history",
                "medication",
                "family_history",
                "exercise_level",
                "smoking_status",
            ]
            for field in required_fields:
                if field not in input_data or input_data[field] is None:
                    return {
                        "success": False,
                        "message": f"Thiếu trường bắt buộc: {field}",
                        "missing_field": field,
                    }

            prediction_result = hypertension_predictor.predict_hypertension(input_data)

            if "error" in prediction_result:
                return {
                    "success": False,
                    "message": "Dự đoán thất bại",
                    "error": prediction_result.get("error", "Unknown error"),
                    "prediction_result": prediction_result,
                }

            result = {
                "success": True,
                "data_source": data_source,
                "input_data": input_data,
                "prediction": prediction_result.get("prediction"),
                "probability": prediction_result.get("probability"),
                "probability_percentage": prediction_result.get(
                    "probability_percentage"
                ),
                "prediction_label": prediction_result.get("prediction_label"),
                "risk_level": prediction_result.get("risk_level"),
                "confidence": prediction_result.get("confidence"),
                "model_confidence": prediction_result.get("model_confidence"),
                "recommendations": prediction_result.get("recommendations", []),
                "input_data_used": prediction_result.get("input_data_used", {}),
                "model_info": prediction_result.get("model_info", {}),
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }

            return result

        except Exception as e:
            import traceback

            return {
                "success": False,
                "message": f"Lỗi khi dự đoán tăng huyết áp: {str(e)}",
                "error": str(e),
                "traceback": traceback.format_exc(),
            }

    def get_hypertension_input_requirements(self) -> Dict[str, Any]:
        """Lấy input requirements từ hypertension_predictor"""
        try:
            requirements = hypertension_predictor.get_input_requirements()
            return {"success": True, **requirements}
        except Exception as e:
            return {
                "success": False,
                "message": f"Lỗi khi lấy hypertension input requirements: {str(e)}",
            }

    def _map_phieukham_to_hypertension_input(self, phieu_kham) -> Dict[str, Any]:
        """
        Mapping từ phiếu khám sang input cho hypertension model.
        Bạn cần chỉnh lại mapping này cho đúng với dữ liệu thực tế của bạn.
        """
        input_data = {}
        try:
            # Lấy thông tin bệnh nhân
            if hasattr(phieu_kham, "benhnhan"):
                bn = phieu_kham.benhnhan
                # age
                if hasattr(bn, "bn_ngaysinh") and bn.bn_ngaysinh:
                    today = date.today()
                    input_data["age"] = today.year - bn.bn_ngaysinh.year

            # bmi
            if (
                hasattr(phieu_kham, "pk_chieucao")
                and hasattr(phieu_kham, "pk_cannang")
                and phieu_kham.pk_chieucao
                and phieu_kham.pk_cannang
            ):
                height_m = phieu_kham.pk_chieucao / 100
                input_data["bmi"] = round(phieu_kham.pk_cannang / (height_m**2), 2)
            else:
                input_data["bmi"] = getattr(phieu_kham, "pk_bmi", 25.0)

            # salt_intake_level
            input_data["salt_intake_level"] = getattr(phieu_kham, "pk_muoi", "moderate")
            # stress_score
            input_data["stress_score"] = getattr(phieu_kham, "pk_cangthang", 5)
            # sleep_duration
            input_data["sleep_duration"] = getattr(phieu_kham, "pk_ngungui", 7)
            # bp_history
            input_data["bp_history"] = getattr(phieu_kham, "pk_tien_su_huyet_ap", 0)
            # medication
            input_data["medication"] = getattr(phieu_kham, "pk_thuoc_ha_ap", 0)
            # family_history
            input_data["family_history"] = getattr(phieu_kham, "pk_tien_su_gd", 0)
            # exercise_level
            input_data["exercise_level"] = getattr(phieu_kham, "pk_van_dong", 1)
            # smoking_status
            input_data["smoking_status"] = getattr(phieu_kham, "pk_hutthuoc", 0)

        except Exception as e:
            print(f"❌ Error mapping phieu kham to hypertension input: {e}")

        return input_data

    def pay_examination(self, pk_ma: int, pk_ngaykham: date) -> bool:
        """
        Thanh toán phiếu khám: cập nhật trạng thái thành 'Đã thanh toán'
        Args:
            pk_ma: Mã phiếu khám
            pk_ngaykham: Ngày khám
        Returns:
            True nếu cập nhật thành công, False nếu lỗi hoặc không tìm thấy
        """
        try:
            phieu_kham = self.get_by_id(pk_ma, pk_ngaykham)
            if not phieu_kham:
                print(f"Không tìm thấy phiếu khám với mã {pk_ma} và ngày {pk_ngaykham}")
                return False

            phieu_kham.pk_trangthai = PhieuKhamStatus.DA_THANH_TOAN
            self.db.session.commit()
            print(f"Đã cập nhật trạng thái phiếu khám {pk_ma} thành Đã thanh toán.")
            return True
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi thanh toán phiếu khám: {str(e)}")
            return False

    def get_all_paid_examinations(self) -> list:
        """
        Lấy tất cả phiếu khám có trạng thái 'Đã thanh toán'
        """
        try:
            phieu_khams = (
                self.db.session.query(PhieuKham)
                .filter(PhieuKham.pk_trangthai == "Đã thanh toán")
                .order_by(PhieuKham.pk_ngaykham.desc(), PhieuKham.pk_ma.desc())
                .all()
            )
            return [
                pk.to_dict() if hasattr(pk, "to_dict") else pk for pk in phieu_khams
            ]
        except Exception as e:
            print(f"Lỗi khi lấy phiếu khám đã thanh toán: {str(e)}")
            return []
