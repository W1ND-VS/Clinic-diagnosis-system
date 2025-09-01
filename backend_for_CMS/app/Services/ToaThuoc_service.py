from shlex import join
from typing import List, Dict, Any, Optional
from datetime import date, datetime, timedelta
from sqlalchemy.exc import SQLAlchemyError
from app.Model import PhieuHen
from app.Model.ToaThuoc import ToaThuoc
from app.Model.ChiTietToaThuoc import ChiTietToaThuoc
from app.Model.Thuoc import Thuoc
from app.Model.PhieuKham import PhieuKham
from app.Model.Benh import Benh
from app.Services.Benh_service import BenhService


class ToaThuocService:
    """Service class for handling prescriptions"""

    def __init__(self, db):
        """Initialize the service with database session"""
        self.db = db
        self.benh_service = BenhService(db)

    def get_all(self) -> List[Dict[str, Any]]:
        """
        Get all prescriptions

        Returns:
            List[Dict[str, Any]]: List of all prescriptions
        """
        try:
            from app.Model.ToaThuoc import ToaThuoc

            toa_thuoc_list = self.db.session.query(ToaThuoc).all()
            return [toa.to_dict() for toa in toa_thuoc_list]
        except Exception as e:
            print(f"Lỗi khi lấy danh sách toa thuốc: {str(e)}")
            return []

    def get_by_id(self, tt_matthuoc: str) -> Optional[Dict[str, Any]]:
        """
        Get prescription by ID

        Args:
            tt_matthuoc: Prescription ID

        Returns:
            Dict[str, Any]: Prescription details or None if not found
        """
        try:
            from app.Model.ToaThuoc import ToaThuoc

            toa_thuoc = (
                self.db.session.query(ToaThuoc)
                .filter(ToaThuoc.tt_matthuoc == tt_matthuoc)
                .first()
            )

            if not toa_thuoc:
                return None

            return toa_thuoc.to_dict()
        except Exception as e:
            print(f"Lỗi khi lấy toa thuốc theo mã: {str(e)}")
            return None

    def get_by_phieu_kham(self, pk_ma: int, pk_ngaykham: date) -> List[Dict[str, Any]]:
        """
        Get prescriptions details for a specific medical examination

        Args:
            pk_ma: Medical examination ID
            pk_ngaykham: Medical examination date

        Returns:
            List[Dict[str, Any]]: List of prescription details with medicine information
        """
        try:
            from app.Model.ToaThuoc import ToaThuoc

            # Convert date parameter if needed
            if isinstance(pk_ngaykham, str):
                pk_ngaykham = datetime.strptime(pk_ngaykham, "%Y-%m-%d").date()

            toa_thuoc = (
                self.db.session.query(ToaThuoc)
                .filter(ToaThuoc.pk_ma == pk_ma, ToaThuoc.pk_ngaykham == pk_ngaykham)
                .first()
            )

            if not toa_thuoc:
                return []

            chi_tiet_toa_thuoc = (
                self.db.session.query(ChiTietToaThuoc)
                .filter(ChiTietToaThuoc.tt_matthuoc == toa_thuoc.tt_matthuoc)
                .all()
            )

            # Add medicine info to each prescription detail
            result = []
            for chi_tiet in chi_tiet_toa_thuoc:
                thuoc = (
                    self.db.session.query(Thuoc)
                    .filter(Thuoc.thuoc_ma == chi_tiet.thuoc_ma)
                    .first()
                )

                chi_tiet_dict = chi_tiet.to_dict()
                if thuoc:
                    chi_tiet_dict["thuoc_info"] = {
                        "thuoc_ma": thuoc.thuoc_ma,
                        "thuoc_ten": thuoc.thuoc_ten,
                        "thuoc_dvt": thuoc.thuoc_dvt,
                    }

                result.append(chi_tiet_dict)

            return result
        except Exception as e:
            print(f"Lỗi khi lấy toa thuốc theo phiếu khám: {str(e)}")
            return []

    def get_by_patient(self, bn_ma: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get all prescriptions for a specific patient grouped by date

        Args:
            bn_ma: Patient ID

        Returns:
            Dict[str, List[Dict[str, Any]]]: Prescriptions grouped by date
        """
        try:
            from app.Model.ToaThuoc import ToaThuoc
            from app.Model.PhieuKham import PhieuKham

            # Join ToaThuoc với PhieuKham để lấy các toa thuốc của bệnh nhân
            toa_thuoc_list = (
                self.db.session.query(ToaThuoc)
                .join(
                    PhieuHen,
                    (ToaThuoc.pk_ma == PhieuHen.pk_ma)
                    & (ToaThuoc.pk_ngaykham == PhieuHen.pk_ngaykham),
                )
                .filter(PhieuHen.bn_ma == bn_ma)
                .order_by(ToaThuoc.tt_ngayke.desc())  # Sắp xếp theo ngày kê toa
                .all()
            )

            # Nhóm toa thuốc theo ngày
            grouped_prescriptions = {}

            for toa in toa_thuoc_list:
                # Lấy chi tiết toa thuốc
                chi_tiet_toa_thuoc = (
                    self.db.session.query(ChiTietToaThuoc)
                    .filter(ChiTietToaThuoc.tt_matthuoc == toa.tt_matthuoc)
                    .all()
                )

                # Tạo danh sách chi tiết thuốc với thông tin thuốc
                chi_tiet_thuoc = []
                for chi_tiet in chi_tiet_toa_thuoc:
                    thuoc = (
                        self.db.session.query(Thuoc)
                        .filter(Thuoc.thuoc_ma == chi_tiet.thuoc_ma)
                        .first()
                    )

                    chi_tiet_dict = {
                        "thuoc_ma": chi_tiet.thuoc_ma,
                        "cttt_soluong": chi_tiet.cttt_soluong,
                        "cttt_lieuluong": chi_tiet.cttt_lieuluong,
                    }

                    if thuoc:
                        chi_tiet_dict["thuoc_info"] = {
                            "thuoc_ten": thuoc.thuoc_ten,
                            "thuoc_dvt": thuoc.thuoc_dvt,
                        }

                    chi_tiet_thuoc.append(chi_tiet_dict)

                # Tạo đối tượng toa thuốc
                toa_dict = {
                    "tt_matthuoc": toa.tt_matthuoc,
                    "tt_ngayke": toa.tt_ngayke.strftime("%Y-%m-%d"),
                    "tt_taikham": (
                        toa.tt_taikham.strftime("%Y-%m-%d") if toa.tt_taikham else None
                    ),
                    "chi_tiet_thuoc": chi_tiet_thuoc,
                }

                # Nhóm theo ngày kê toa
                ngay_ke = toa.tt_ngayke.strftime("%Y-%m-%d")
                if ngay_ke not in grouped_prescriptions:
                    grouped_prescriptions[ngay_ke] = []

                grouped_prescriptions[ngay_ke].append(toa_dict)

            return grouped_prescriptions

        except Exception as e:
            print(f"Lỗi khi lấy toa thuốc theo bệnh nhân: {str(e)}")
            return {}

    def get_by_doctor(self, nv_ma: str) -> List[Dict[str, Any]]:
        """
        Get all prescriptions written by a specific doctor

        Args:
            nv_ma: Doctor ID

        Returns:
            List[Dict[str, Any]]: List of prescriptions
        """
        try:
            from app.Model.ToaThuoc import ToaThuoc

            toa_thuoc_list = (
                self.db.session.query(ToaThuoc).filter(ToaThuoc.nv_ma == nv_ma).all()
            )

            return [toa.to_dict() for toa in toa_thuoc_list]
        except Exception as e:
            print(f"Lỗi khi lấy toa thuốc theo bác sĩ: {str(e)}")
            return []

    def get_by_date_range(
        self, start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        """
        Get prescriptions within a date range

        Args:
            start_date: Start date
            end_date: End date

        Returns:
            List[Dict[str, Any]]: List of prescriptions
        """
        try:
            from app.Model.ToaThuoc import ToaThuoc

            # Convert date parameters if needed
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

            toa_thuoc_list = (
                self.db.session.query(ToaThuoc)
                .filter(
                    ToaThuoc.tt_ngayke >= start_date, ToaThuoc.tt_ngayke <= end_date
                )
                .all()
            )

            return [toa.to_dict() for toa in toa_thuoc_list]
        except Exception as e:
            print(f"Lỗi khi lấy toa thuốc theo khoảng thời gian: {str(e)}")
            return []

    def update(
        self, tt_matthuoc: str, data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update an existing prescription

        Args:
            tt_matthuoc: Prescription ID
            data: Updated prescription data

        Returns:
            Dict[str, Any]: Updated prescription or None if failed
        """
        try:
            from app.Model.ToaThuoc import ToaThuoc

            # Kiểm tra toa thuốc tồn tại
            toa_thuoc = (
                self.db.session.query(ToaThuoc)
                .filter(ToaThuoc.tt_matthuoc == tt_matthuoc)
                .first()
            )

            if not toa_thuoc:
                raise ValueError(f"Không tìm thấy toa thuốc với mã {tt_matthuoc}")

            # Cập nhật các trường có thể thay đổi
            if "tt_ngayke" in data:
                tt_ngayke = data.get("tt_ngayke")
                if isinstance(tt_ngayke, str):
                    tt_ngayke = datetime.strptime(tt_ngayke, "%Y-%m-%d").date()
                toa_thuoc.tt_ngayke = tt_ngayke

            if "tt_taikham" in data:
                tt_taikham = data.get("tt_taikham")
                if tt_taikham:
                    if isinstance(tt_taikham, str):
                        tt_taikham = datetime.strptime(tt_taikham, "%Y-%m-%d").date()
                    toa_thuoc.tt_taikham = tt_taikham
                else:
                    toa_thuoc.tt_taikham = None

            if "nv_ma" in data:
                toa_thuoc.nv_ma = data.get("nv_ma")

            # Cập nhật chi tiết toa thuốc nếu có
            if "chi_tiet" in data:
                self._update_prescription_details(tt_matthuoc, data.get("chi_tiet", []))

            self.db.session.commit()
            return self.get_by_id(tt_matthuoc)
        except SQLAlchemyError as e:
            self.db.session.rollback()
            print(f"Lỗi SQLAlchemy khi cập nhật toa thuốc: {str(e)}")
            return None
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi cập nhật toa thuốc: {str(e)}")
            if isinstance(e, ValueError):
                raise
            return None

    def delete(self, tt_matthuoc: str) -> bool:
        """
        Delete a prescription

        Args:
            tt_matthuoc: Prescription ID

        Returns:
            bool: True if deleted successfully, False otherwise
        """
        try:
            from app.Model.ToaThuoc import ToaThuoc
            from app.Model.ChiTietToaThuoc import ChiTietToaThuoc

            # Xóa chi tiết toa thuốc trước
            self.db.session.query(ChiTietToaThuoc).filter(
                ChiTietToaThuoc.tt_matthuoc == tt_matthuoc
            ).delete()

            # Xóa toa thuốc
            result = (
                self.db.session.query(ToaThuoc)
                .filter(ToaThuoc.tt_matthuoc == tt_matthuoc)
                .delete()
            )

            self.db.session.commit()
            return result > 0
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi xóa toa thuốc: {str(e)}")
            return False

    def get_prescription_with_details(
        self, tt_matthuoc: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get a prescription with all its details

        Args:
            tt_matthuoc: Prescription ID

        Returns:
            Dict[str, Any]: Prescription with details or None if not found
        """
        try:
            from app.Model.ToaThuoc import ToaThuoc
            from app.Model.ChiTietToaThuoc import ChiTietToaThuoc
            from app.Model.Thuoc import Thuoc

            # Lấy toa thuốc
            toa_thuoc = (
                self.db.session.query(ToaThuoc)
                .filter(ToaThuoc.tt_matthuoc == tt_matthuoc)
                .first()
            )

            if not toa_thuoc:
                return None

            result = toa_thuoc.to_dict()

            # Lấy chi tiết toa thuốc
            chi_tiet_list = (
                self.db.session.query(ChiTietToaThuoc)
                .filter(ChiTietToaThuoc.tt_matthuoc == tt_matthuoc)
                .all()
            )

            # Thêm thông tin thuốc vào chi tiết
            result["chi_tiet"] = []
            for chi_tiet in chi_tiet_list:
                thuoc = (
                    self.db.session.query(Thuoc)
                    .filter(Thuoc.thuoc_ma == chi_tiet.thuoc_ma)
                    .first()
                )

                chi_tiet_dict = chi_tiet.to_dict()
                if thuoc:
                    chi_tiet_dict["thuoc_info"] = thuoc.to_dict()

                result["chi_tiet"].append(chi_tiet_dict)

            return result
        except Exception as e:
            print(f"Lỗi khi lấy toa thuốc với chi tiết: {str(e)}")
            return None

    def _update_prescription_details(
        self, tt_matthuoc: str, chi_tiet_list: List[Dict[str, Any]]
    ) -> bool:
        """
        Update prescription details

        Args:
            tt_matthuoc: Prescription ID
            chi_tiet_list: List of prescription details

        Returns:
            bool: True if updated successfully, False otherwise
        """
        try:
            from app.Model.ChiTietToaThuoc import ChiTietToaThuoc
            from app.Model.Thuoc import Thuoc

            # Xóa tất cả chi tiết cũ
            self.db.session.query(ChiTietToaThuoc).filter(
                ChiTietToaThuoc.tt_matthuoc == tt_matthuoc
            ).delete()

            # Thêm chi tiết mới
            for chi_tiet in chi_tiet_list:
                thuoc_ma = chi_tiet.get("thuoc_ma")

                # Kiểm tra thuốc có tồn tại không
                thuoc = (
                    self.db.session.query(Thuoc)
                    .filter(Thuoc.thuoc_ma == thuoc_ma)
                    .first()
                )

                if not thuoc:
                    raise ValueError(f"Không tìm thấy thuốc với mã {thuoc_ma}")

                # Tạo chi tiết toa thuốc mới
                chi_tiet_toa = ChiTietToaThuoc(
                    tt_matthuoc=tt_matthuoc,
                    thuoc_ma=thuoc_ma,
                    cttt_soluong=chi_tiet.get("cttt_soluong", 0),
                    cttt_lieuluong=chi_tiet.get("cttt_lieuluong", ""),
                )

                self.db.session.add(chi_tiet_toa)

            return True
        except Exception as e:
            print(f"Lỗi khi cập nhật chi tiết toa thuốc: {str(e)}")
            raise

    def _generate_prescription_id(self) -> str:
        """
        Generate a unique prescription ID

        Returns:
            str: New prescription ID
        """
        try:
            from app.Model.ToaThuoc import ToaThuoc

            # Lấy ngày hiện tại
            today = date.today()
            prefix = f"TT{today.strftime('%y%m%d')}"

            # Tìm mã lớn nhất hiện tại
            last_prescription = (
                self.db.session.query(ToaThuoc)
                .filter(ToaThuoc.tt_matthuoc.like(f"{prefix}%"))
                .order_by(ToaThuoc.tt_matthuoc.desc())
                .first()
            )

            if last_prescription:
                # Tăng số thứ tự lên 1
                last_id = last_prescription.tt_matthuoc
                counter = int(last_id[-4:]) + 1
            else:
                # Bắt đầu từ 1
                counter = 1

            # Tạo mã mới với định dạng TT + YY + MM + DD + 0001
            new_id = f"{prefix}{counter:04d}"
            return new_id
        except Exception as e:
            print(f"Lỗi khi tạo mã toa thuốc: {str(e)}")
            # Fallback nếu có lỗi
            return (
                f"TT{today.strftime('%y%m%d')}{datetime.now().microsecond % 10000:04d}"
            )

    def get_prescription_statistics(
        self, start_date: date, end_date: date
    ) -> Dict[str, Any]:
        """
        Get prescription statistics within a date range

        Args:
            start_date: Start date
            end_date: End date

        Returns:
            Dict[str, Any]: Prescription statistics
        """
        try:
            from app.Model.ToaThuoc import ToaThuoc
            from app.Model.ChiTietToaThuoc import ChiTietToaThuoc
            from sqlalchemy import func, distinct

            # Convert date parameters if needed
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

            # Số lượng toa thuốc
            total_prescriptions = (
                self.db.session.query(func.count(ToaThuoc.tt_matthuoc))
                .filter(
                    ToaThuoc.tt_ngayke >= start_date, ToaThuoc.tt_ngayke <= end_date
                )
                .scalar()
            )

            # Số lượng bác sĩ kê toa
            total_doctors = (
                self.db.session.query(func.count(distinct(ToaThuoc.nv_ma)))
                .filter(
                    ToaThuoc.tt_ngayke >= start_date, ToaThuoc.tt_ngayke <= end_date
                )
                .scalar()
            )

            # Số lượng loại thuốc đã kê
            total_medicines = (
                self.db.session.query(func.count(distinct(ChiTietToaThuoc.thuoc_ma)))
                .join(ToaThuoc, ChiTietToaThuoc.tt_matthuoc == ToaThuoc.tt_matthuoc)
                .filter(
                    ToaThuoc.tt_ngayke >= start_date, ToaThuoc.tt_ngayke <= end_date
                )
                .scalar()
            )

            # Thuốc kê nhiều nhất
            most_prescribed = (
                self.db.session.query(
                    ChiTietToaThuoc.thuoc_ma,
                    func.count(ChiTietToaThuoc.thuoc_ma).label("count"),
                )
                .join(ToaThuoc, ChiTietToaThuoc.tt_matthuoc == ToaThuoc.tt_matthuoc)
                .filter(
                    ToaThuoc.tt_ngayke >= start_date, ToaThuoc.tt_ngayke <= end_date
                )
                .group_by(ChiTietToaThuoc.thuoc_ma)
                .order_by(func.count(ChiTietToaThuoc.thuoc_ma).desc())
                .limit(5)
                .all()
            )

            top_medicines = []
            for thuoc_ma, count in most_prescribed:
                from app.Model.Thuoc import Thuoc

                thuoc = (
                    self.db.session.query(Thuoc)
                    .filter(Thuoc.thuoc_ma == thuoc_ma)
                    .first()
                )
                if thuoc:
                    top_medicines.append(
                        {
                            "thuoc_ma": thuoc_ma,
                            "thuoc_ten": thuoc.thuoc_ten,
                            "count": count,
                        }
                    )

            return {
                "total_prescriptions": total_prescriptions,
                "total_doctors": total_doctors,
                "total_medicines": total_medicines,
                "top_medicines": top_medicines,
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
            }

        except Exception as e:
            print(f"Lỗi khi lấy thống kê toa thuốc: {str(e)}")
            return {
                "total_prescriptions": 0,
                "total_doctors": 0,
                "total_medicines": 0,
                "top_medicines": [],
            }

    def create(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a new prescription with medicines and diagnoses

        Args:
            data: Dictionary containing:
                - pk_ma: Medical examination ID
                - pk_ngaykham: Medical examination date
                - tt_ngayke: Prescription date
                - tt_taikham: Re-examination date (optional)
                - medicines: List of medicines with details
                - diagnoses: List of diagnoses

        Returns:
            Dict[str, Any]: Created prescription or None if failed
        """
        try:
            from app.Model.ToaThuoc import ToaThuoc
            from app.Model.ChiTietToaThuoc import ChiTietToaThuoc
            from app.Model.ChanDoan import ChanDoan
            from app.Model.Thuoc import Thuoc
            from app.Model.PhieuKham import PhieuKham

            # Validate required fields
            required_fields = ["pk_ma", "pk_ngaykham", "tt_ngayke", "medicines"]
            for field in required_fields:
                if field not in data:
                    raise ValueError(f"Thiếu trường bắt buộc: {field}")

            # Convert date fields
            pk_ngaykham = data["pk_ngaykham"]
            if isinstance(pk_ngaykham, str):
                pk_ngaykham = datetime.strptime(pk_ngaykham, "%Y-%m-%d").date()

            tt_ngayke = data["tt_ngayke"]
            if isinstance(tt_ngayke, str):
                tt_ngayke = datetime.strptime(tt_ngayke, "%Y-%m-%d").date()

            tt_taikham = data.get("tt_taikham")
            if tt_taikham and tt_taikham.strip():
                if isinstance(tt_taikham, str):
                    tt_taikham = datetime.strptime(tt_taikham, "%Y-%m-%d").date()
            else:
                tt_taikham = None

            # Validate medical examination exists using composite foreign key
            phieu_kham = (
                self.db.session.query(PhieuKham)
                .filter(
                    PhieuKham.pk_ma == data["pk_ma"],
                    PhieuKham.pk_ngaykham == pk_ngaykham,
                )
                .first()
            )

            if not phieu_kham:
                raise ValueError(
                    f"Không tìm thấy phiếu khám với mã {data['pk_ma']} và ngày {pk_ngaykham}"
                )

            # Check if prescription already exists for this medical examination
            existing_prescription = (
                self.db.session.query(ToaThuoc)
                .filter(
                    ToaThuoc.pk_ma == data["pk_ma"], ToaThuoc.pk_ngaykham == pk_ngaykham
                )
                .first()
            )

            if existing_prescription:
                raise ValueError(
                    f"Phiếu khám {data['pk_ma']} ngày {pk_ngaykham} đã có toa thuốc: {existing_prescription.tt_matthuoc}"
                )

            # Generate prescription ID
            tt_matthuoc = self._generate_prescription_id()

            # Create prescription using composite foreign key
            toa_thuoc = ToaThuoc(
                tt_matthuoc=tt_matthuoc,
                tt_ngayke=tt_ngayke,
                tt_taikham=tt_taikham,
                pk_ma=data["pk_ma"],
                pk_ngaykham=pk_ngaykham,
            )

            self.db.session.add(toa_thuoc)
            self.db.session.flush()  # Get the ID without committing

            # Validate and create medicine details using relationship
            medicines = data.get("medicines", [])
            if not medicines:
                raise ValueError("Toa thuốc phải có ít nhất một loại thuốc")

            created_medicines = []
            for medicine in medicines:
                # Validate medicine exists
                thuoc = (
                    self.db.session.query(Thuoc)
                    .filter(Thuoc.thuoc_ma == medicine["thuoc_ma"])
                    .first()
                )

                if not thuoc:
                    raise ValueError(
                        f"Không tìm thấy thuốc với mã {medicine['thuoc_ma']}"
                    )

                # Validate quantity
                soluong = medicine.get("cttt_soluong", 0)
                if not isinstance(soluong, int) or soluong <= 0:
                    raise ValueError(
                        f"Số lượng thuốc {medicine['thuoc_ma']} phải là số nguyên dương"
                    )

                # Create medicine detail using relationship
                chi_tiet = ChiTietToaThuoc(
                    tt_matthuoc=tt_matthuoc,
                    thuoc_ma=medicine["thuoc_ma"],
                    cttt_soluong=soluong,
                    cttt_lieuluong=medicine.get("cttt_lieuluong", ""),
                )

                # Add to prescription's chi_tiet_toa_thuoc relationship
                toa_thuoc.chi_tiet_toa_thuoc.append(chi_tiet)

                # Add medicine info to result
                created_medicines.append(
                    {
                        "thuoc_ma": medicine["thuoc_ma"],
                        "thuoc_ten": thuoc.thuoc_ten,
                        "thuoc_dvt": thuoc.thuoc_dvt,
                        "cttt_soluong": soluong,
                        "cttt_lieuluong": medicine.get("cttt_lieuluong", ""),
                        "thuoc_dongia": getattr(thuoc, "thuoc_dongia", None),
                        "thuoc_hansudung": getattr(thuoc, "thuoc_hansudung", None),
                    }
                )

            # Create diagnoses if provided using relationship with cascade
            diagnoses = data.get("diagnoses", [])
            created_diagnoses = []

            for diagnosis in diagnoses:
                b_ma = diagnosis.get("b_ma")
                if not b_ma:
                    continue

                # Check if diagnosis already exists for this prescription
                existing_diagnosis = (
                    self.db.session.query(ChanDoan)
                    .filter(ChanDoan.tt_matthuoc == tt_matthuoc, ChanDoan.b_ma == b_ma)
                    .first()
                )

                if not existing_diagnosis:
                    # Validate disease exists using benh_service
                    benh = self.benh_service.get_by_id(b_ma)
                    if not benh:
                        print(f"Cảnh báo: Không tìm thấy bệnh với mã {b_ma}")
                        continue

                    # Create diagnosis using relationship with cascade
                    chan_doan = ChanDoan(tt_matthuoc=tt_matthuoc, b_ma=b_ma)

                    # Add to prescription's chan_doan relationship (cascade will handle deletion)
                    toa_thuoc.chan_doan.append(chan_doan)

                    created_diagnoses.append(
                        {
                            "b_ma": b_ma,
                            "b_ten": diagnosis.get("b_ten", benh.get("b_ten", "")),
                        }
                    )

            # Update medical examination with prescription reference using relationship
            phieu_kham.tt_matthuoc = tt_matthuoc

            # Commit all changes (relationships will be handled automatically)
            self.db.session.commit()

            # Get complete prescription data using relationships
            prescription_dict = toa_thuoc.to_dict()

            # Return created prescription with details
            result = {
                "tt_matthuoc": tt_matthuoc,
                "tt_ngayke": tt_ngayke.strftime("%Y-%m-%d"),
                "tt_taikham": tt_taikham.strftime("%Y-%m-%d") if tt_taikham else None,
                "pk_ma": data["pk_ma"],
                "pk_ngaykham": pk_ngaykham.strftime("%Y-%m-%d"),
                "medicines": created_medicines,
                "diagnoses": created_diagnoses,
                "total_medicines": len(created_medicines),
                "total_diagnoses": len(created_diagnoses),
                "benh_names": prescription_dict.get(
                    "benh", []
                ),  # From to_dict() method
                "phieu_kham_info": {
                    "pk_ma": phieu_kham.pk_ma,
                    "pk_ngaykham": phieu_kham.pk_ngaykham.strftime("%Y-%m-%d"),
                    "nv_ma": getattr(phieu_kham, "nv_ma", None),
                    "pk_trangthai": getattr(phieu_kham, "pk_trangthai", None),
                },
            }

            print(f"Tạo toa thuốc thành công: {tt_matthuoc}")
            print(
                f"Số thuốc: {len(created_medicines)}, Số chẩn đoán: {len(created_diagnoses)}"
            )

            return result

        except SQLAlchemyError as e:
            self.db.session.rollback()
            print(f"Lỗi SQLAlchemy khi tạo toa thuốc: {str(e)}")
            return None
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi tạo toa thuốc: {str(e)}")
            if isinstance(e, ValueError):
                raise
            return None
