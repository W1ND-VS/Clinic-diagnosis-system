from typing import List, Dict, Any, Optional
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from datetime import date, datetime
from app.Model import PhieuKham
from app.Model.Benh import Benh
from app.Model.ChanDoan import ChanDoan
from app.Model.ToaThuoc import ToaThuoc


class BenhService:
    """Service class for handling disease records"""

    def __init__(self, db):
        """Initialize the service with database session"""
        self.db = db

    def get_all(self) -> List[Dict[str, Any]]:
        """
        Get all diseases

        Returns:
            List[Dict[str, Any]]: List of all diseases
        """
        try:
            from app.Model.Benh import Benh

            benh_list = self.db.session.query(Benh).order_by(Benh.b_ten).all()
            return [benh.to_dict() for benh in benh_list]
        except Exception as e:
            print(f"Lỗi khi lấy danh sách bệnh: {str(e)}")
            return []

    def get_by_id(self, b_ma: str) -> Optional[Dict[str, Any]]:
        """
        Get disease by ID

        Args:
            b_ma: Disease ID

        Returns:
            Dict[str, Any]: Disease details or None if not found
        """
        try:
            from app.Model.Benh import Benh

            # Kiểm tra xem self.db có phải là session hay SQLAlchemy object
            if hasattr(self.db, "session"):
                session = self.db.session
            else:
                session = self.db

            benh = session.query(Benh).filter(Benh.b_ma == b_ma).first()

            if not benh:
                return None

            return benh.to_dict()
        except Exception as e:
            print(f"Lỗi khi lấy bệnh theo mã: {str(e)}")
            return None

    def get_revenue_by_date_range(
        self, start_date: str, end_date: str
    ) -> List[Dict[str, Any]]:
        try:
            # Calculate total revenue based on the number of diagnoses
            revenue_data = (
                self.db.session.query(
                    Benh.b_ten,
                    (func.count(ChanDoan.tt_matthuoc)).label("total_revenue"),
                )
                .join(PhieuKham, ChanDoan.tt_matthuoc == PhieuKham.tt_matthuoc)
                .join(Benh, ChanDoan.b_ma == Benh.b_ma)
                .filter(
                    PhieuKham.pk_ngaykham >= start_date,
                    PhieuKham.pk_ngaykham <= end_date,
                )
                .group_by(Benh.b_ma)
                .all()
            )
            return revenue_data
        except SQLAlchemyError as e:
            print(f"Lỗi khi tính doanh thu theo ngày: {str(e)}")
            return []

    def get_by_name(self, b_ten: str) -> Optional[Dict[str, Any]]:
        """
        Get disease by name

        Args:
            b_ten: Disease name

        Returns:
            Dict[str, Any]: Disease details or None if not found
        """
        try:
            from app.Model.Benh import Benh

            benh = self.db.session.query(Benh).filter(Benh.b_ten == b_ten).first()

            if not benh:
                return None

            return benh.to_dict()
        except Exception as e:
            print(f"Lỗi khi lấy bệnh theo tên: {str(e)}")
            return None

    def search_by_name(self, name: str) -> List[Dict[str, Any]]:
        """
        Search diseases by name

        Args:
            name: Disease name (partial match)

        Returns:
            List[Dict[str, Any]]: List of matching diseases
        """
        try:
            from app.Model.Benh import Benh

            if not name or len(name.strip()) == 0:
                return self.get_all()

            benh_list = (
                self.db.session.query(Benh)
                .filter(Benh.b_ten.ilike(f"%{name}%"))
                .order_by(Benh.b_ten)
                .all()
            )

            return [benh.to_dict() for benh in benh_list]
        except Exception as e:
            print(f"Lỗi khi tìm kiếm bệnh theo tên: {str(e)}")
            return []

    def get_by_prescription(self, tt_matthuoc: str) -> List[Dict[str, Any]]:
        """
        Get diseases by prescription ID

        Args:
            tt_matthuoc: Prescription ID

        Returns:
            List[Dict[str, Any]]: List of diseases for the prescription
        """
        try:
            from app.Model.Benh import Benh
            from app.Model.ChanDoan import ChanDoan

            # Use the association table to get the diseases
            benh_list = (
                self.db.session.query(Benh)
                .join(ChanDoan, Benh.b_ma == ChanDoan.b_ma)
                .filter(ChanDoan.tt_matthuoc == tt_matthuoc)
                .order_by(Benh.b_ten)
                .all()
            )

            return [benh.to_dict() for benh in benh_list]
        except Exception as e:
            print(f"Lỗi khi lấy bệnh theo toa thuốc: {str(e)}")
            return []

    def is_exists_by_id(self, b_ma: str) -> bool:
        """
        Check if a disease exists by its ID

        Args:
            b_ma: Disease ID

        Returns:
            bool: True if the disease exists, False otherwise
        """
        try:
            from app.Model.Benh import Benh

            exists = (
                self.db.session.query(Benh).filter(Benh.b_ma == b_ma).first()
                is not None
            )

            return exists
        except Exception as e:
            print(f"Lỗi khi kiểm tra sự tồn tại của bệnh theo mã: {str(e)}")
            return False

    def is_exists_by_name(self, b_ten: str) -> bool:
        """
        Check if a disease exists by its name

        Args:
            b_ten: Disease name

        Returns:
            bool: True if the disease exists, False otherwise
        """
        try:
            from app.Model.Benh import Benh

            exists = (
                self.db.session.query(Benh).filter(Benh.b_ten == b_ten).first()
                is not None
            )

            return exists
        except Exception as e:
            print(f"Lỗi khi kiểm tra sự tồn tại của bệnh theo tên: {str(e)}")
            return False

    def get_by_patient(self, bn_ma: str) -> List[Dict[str, Any]]:
        """
        Get diseases for a specific patient (from all prescriptions)

        Args:
            bn_ma: Patient ID

        Returns:
            List[Dict[str, Any]]: List of diseases for the patient
        """
        try:
            from app.Model.Benh import Benh
            from app.Model.ChanDoan import ChanDoan
            from app.Model.ToaThuoc import ToaThuoc
            from app.Model.PhieuKham import PhieuKham

            # Get all diseases from prescriptions linked to the patient
            benh_list = (
                self.db.session.query(Benh)
                .join(ChanDoan, Benh.b_ma == ChanDoan.b_ma)
                .join(ToaThuoc, ChanDoan.tt_matthuoc == ToaThuoc.tt_matthuoc)
                .join(
                    PhieuKham,
                    (ToaThuoc.pk_ma == PhieuKham.pk_ma)
                    & (ToaThuoc.pk_ngaykham == PhieuKham.pk_ngaykham),
                )
                .filter(PhieuKham.bn_ma == bn_ma)
                .distinct()
                .order_by(Benh.b_ten)
                .all()
            )

            return [benh.to_dict() for benh in benh_list]
        except Exception as e:
            print(f"Lỗi khi lấy bệnh theo bệnh nhân: {str(e)}")
            return []

    def create(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:

            # Validate required fields
            if "b_ten" not in data or not data["b_ten"]:
                raise ValueError("Thiếu tên bệnh")

            # Normalize disease name (capitalize first letter of each word)
            b_ten = data["b_ten"].strip()
            b_ten = " ".join(word.capitalize() for word in b_ten.split())

            # Check if disease already exists by name
            existing_disease = (
                self.db.session.query(Benh).filter(Benh.b_ten == b_ten).first()
            )

            if existing_disease:
                raise ValueError(f"Đã tồn tại bệnh với tên: {b_ten}")

            # Generate new disease ID
            b_ma = self._generate_disease_id()

            # Create new disease record
            benh = Benh(b_ma=b_ma, b_ten=b_ten, b_mota=data.get("b_mota"))

            self.db.session.add(benh)

            self.db.session.commit()

            # Return the created disease
            return benh.to_dict()
        except SQLAlchemyError as e:
            self.db.session.rollback()
            print(f"Lỗi SQLAlchemy khi tạo bệnh: {str(e)}")
            return None
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi tạo bệnh: {str(e)}")
            if isinstance(e, ValueError):
                raise
            return None

    def update(self, b_ma: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update a disease record

        Args:
            b_ma: Disease ID
            data: Updated disease data

        Returns:
            Dict[str, Any]: Updated disease or None if failed
        """
        try:
            from app.Model.Benh import Benh

            # Find the disease record
            benh = self.db.session.query(Benh).filter(Benh.b_ma == b_ma).first()

            if not benh:
                raise ValueError(f"Không tìm thấy bệnh với mã: {b_ma}")

            # Update name if provided
            if "b_ten" in data and data["b_ten"]:
                # Normalize disease name
                b_ten = data["b_ten"].strip()
                b_ten = " ".join(word.capitalize() for word in b_ten.split())

                # Check if another disease with this name exists
                existing = (
                    self.db.session.query(Benh)
                    .filter(Benh.b_ten == b_ten, Benh.b_ma != b_ma)
                    .first()
                )

                if existing:
                    raise ValueError(f"Đã tồn tại bệnh với tên: {b_ten}")

                benh.b_ten = b_ten

            # Update description if provided
            if "b_mota" in data:
                benh.b_mota = data.get("b_mota")

            # Link to prescription if provided
            if "tt_matthuoc" in data and data["tt_matthuoc"]:
                self._link_disease_to_prescription(b_ma, data["tt_matthuoc"])

            self.db.session.commit()

            # Return the updated disease
            return benh.to_dict()
        except SQLAlchemyError as e:
            self.db.session.rollback()
            print(f"Lỗi SQLAlchemy khi cập nhật bệnh: {str(e)}")
            return None
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi cập nhật bệnh: {str(e)}")
            if isinstance(e, ValueError):
                raise
            return None

    def delete(self, b_ma: str) -> bool:
        """
        Delete a disease record

        Args:
            b_ma: Disease ID

        Returns:
            bool: True if deleted successfully, False otherwise
        """
        try:
            from app.Model.Benh import Benh
            from app.Model.ChanDoan import ChanDoan

            # Check if disease is used in any diagnosis
            diagnosis_count = (
                self.db.session.query(ChanDoan).filter(ChanDoan.b_ma == b_ma).count()
            )

            if diagnosis_count > 0:
                raise ValueError(
                    f"Không thể xóa bệnh đã được sử dụng trong {diagnosis_count} chẩn đoán"
                )

            # Delete the disease
            result = self.db.session.query(Benh).filter(Benh.b_ma == b_ma).delete()

            self.db.session.commit()

            return result > 0
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi xóa bệnh: {str(e)}")
            if isinstance(e, ValueError):
                raise
            return False

    def get_common_diseases(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get most common diseases

        Args:
            limit: Maximum number of results to return

        Returns:
            List[Dict[str, Any]]: List of common diseases with count
        """
        try:
            from app.Model.Benh import Benh
            from app.Model.ChanDoan import ChanDoan
            from sqlalchemy import func, desc

            # Query for disease names and their frequency
            results = (
                self.db.session.query(
                    Benh.b_ma, Benh.b_ten, func.count(ChanDoan.b_ma).label("count")
                )
                .join(ChanDoan, Benh.b_ma == ChanDoan.b_ma)
                .group_by(Benh.b_ma, Benh.b_ten)
                .order_by(desc("count"))
                .limit(limit)
                .all()
            )

            # Format the results
            return [
                {"id": id, "name": name, "count": count} for id, name, count in results
            ]
        except Exception as e:
            print(f"Lỗi khi lấy bệnh phổ biến: {str(e)}")
            return []

    def _get_id_by_name(self, b_ten: str) -> Optional[str]:
        """
        Get disease ID by name

        Args:
            b_ten: Disease name

        Returns:
            str: Disease ID or None if not found
        """
        try:
            from app.Model.Benh import Benh

            benh = self.db.session.query(Benh).filter(Benh.b_ten == b_ten).first()

            return benh.b_ma if benh else None
        except Exception:
            return None

    def get_by_date_range(
        self, start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        """
        Get diseases diagnosed within a date range

        Args:
            start_date: Start date
            end_date: End date

        Returns:
            List[Dict[str, Any]]: List of diseases in the date range
        """
        try:
            from app.Model.Benh import Benh
            from app.Model.ChanDoan import ChanDoan
            from app.Model.ToaThuoc import ToaThuoc

            # Convert date parameters if needed
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

            # Get all diseases from prescriptions in the date range
            benh_list = (
                self.db.session.query(Benh)
                .join(ChanDoan, Benh.b_ma == ChanDoan.b_ma)
                .join(ToaThuoc, ChanDoan.tt_matthuoc == ToaThuoc.tt_matthuoc)
                .filter(
                    ToaThuoc.tt_ngayke >= start_date, ToaThuoc.tt_ngayke <= end_date
                )
                .distinct()
                .order_by(Benh.b_ten)
                .all()
            )

            return [benh.to_dict() for benh in benh_list]
        except Exception as e:
            print(f"Lỗi khi lấy bệnh theo khoảng thời gian: {str(e)}")
            return []

    def get_disease_statistics(
        self, start_date: date, end_date: date
    ) -> Dict[str, Any]:
        """
        Get disease statistics for a date range

        Args:
            start_date: Start date
            end_date: End date

        Returns:
            Dict[str, Any]: Disease statistics
        """
        try:
            from app.Model.Benh import Benh
            from app.Model.ChanDoan import ChanDoan
            from app.Model.ToaThuoc import ToaThuoc
            from sqlalchemy import func, desc

            # Convert date parameters if needed
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

            # Total count of diagnoses in the period
            total_count = (
                self.db.session.query(func.count(ChanDoan.b_ma))
                .join(ToaThuoc, ChanDoan.tt_matthuoc == ToaThuoc.tt_matthuoc)
                .filter(
                    ToaThuoc.tt_ngayke >= start_date, ToaThuoc.tt_ngayke <= end_date
                )
                .scalar()
                or 0
            )

            # Count of unique disease names
            unique_count = (
                self.db.session.query(func.count(func.distinct(Benh.b_ma)))
                .join(ChanDoan, Benh.b_ma == ChanDoan.b_ma)
                .join(ToaThuoc, ChanDoan.tt_matthuoc == ToaThuoc.tt_matthuoc)
                .filter(
                    ToaThuoc.tt_ngayke >= start_date, ToaThuoc.tt_ngayke <= end_date
                )
                .scalar()
                or 0
            )

            # Most common diseases in the period
            common_diseases = (
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

            # Format the statistics
            return {
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
                "total_diagnoses": total_count,
                "unique_diseases": unique_count,
                "most_common": [
                    {"id": id, "name": name, "count": count}
                    for id, name, count in common_diseases
                ],
            }
        except Exception as e:
            print(f"Lỗi khi lấy thống kê bệnh: {str(e)}")
            return {"total_diagnoses": 0, "unique_diseases": 0, "most_common": []}

    def _generate_disease_id(self) -> str:
        """
        Generate a unique disease ID

        Returns:
            str: New disease ID in format 1, 2, 3
        """
        try:
            from app.Model.Benh import Benh

            # Get the highest numeric ID currently in the database
            last_benh = self.db.session.query(Benh).order_by(Benh.b_ma.desc()).first()

            if last_benh:
                try:
                    # Check if ID is already in numeric format
                    if last_benh.b_ma.isdigit():
                        new_id = str(int(last_benh.b_ma) + 1)
                    # Handle old format starting with 'B'
                    elif last_benh.b_ma.startswith("B"):
                        # Extract numeric part and convert
                        last_id = int(last_benh.b_ma[1:])
                        new_id = str(last_id + 1)
                    else:
                        # Fallback for any other format
                        new_id = "1"
                except ValueError:
                    # If conversion fails, start from 1
                    new_id = "1"
            else:
                # Start with 1 if no existing records
                new_id = "1"

            return new_id
        except Exception as e:
            print(f"Lỗi khi tạo mã bệnh: {str(e)}")
            # Fallback with timestamp
            return str(int(datetime.now().timestamp()))

    def get_prescriptions_by_disease(self, b_ma: str) -> List[Dict[str, Any]]:
        """
        Get all prescriptions related to a specific disease

        Args:
            b_ma: Disease ID

        Returns:
            List[Dict[str, Any]]: List of prescriptions for the disease
        """
        try:
            from app.Model.ToaThuoc import ToaThuoc
            from app.Model.ChanDoan import ChanDoan

            toa_thuoc_list = (
                self.db.session.query(ToaThuoc)
                .join(ChanDoan, ToaThuoc.tt_matthuoc == ChanDoan.tt_matthuoc)
                .filter(ChanDoan.b_ma == b_ma)
                .all()
            )

            # Chuyển đổi kết quả sang dictionary
            result = []
            for toa_thuoc in toa_thuoc_list:
                toa_dict = toa_thuoc.to_dict()
                # Loại bỏ trường benh nếu có để tránh đệ quy
                if "benh" in toa_dict:
                    del toa_dict["benh"]
                result.append(toa_dict)

            return result
        except Exception as e:
            print(f"Lỗi khi lấy toa thuốc theo bệnh: {str(e)}")
            return []
