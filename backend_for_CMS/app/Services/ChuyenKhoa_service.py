from datetime import date
from app.Model import ChuyenKhoa, BacSi, Phong
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, List, Dict, Any


class ChuyenKhoaService:
    def __init__(self, db):
        self.db = db

    def get_all(self) -> List[ChuyenKhoa]:
        """Lấy danh sách tất cả các chuyên khoa"""
        return self.db.session.query(ChuyenKhoa).all()

    def get_by_id(self, ck_ma: str) -> Optional[ChuyenKhoa]:
        """Lấy thông tin chuyên khoa theo mã"""
        return (
            self.db.session.query(ChuyenKhoa).filter(ChuyenKhoa.ck_ma == ck_ma).first()
        )

    def search_by_name(self, name: str) -> List[ChuyenKhoa]:
        """Tìm kiếm chuyên khoa theo tên"""
        return (
            self.db.session.query(ChuyenKhoa)
            .filter(ChuyenKhoa.ck_ten.ilike(f"%{name}%"))
            .all()
        )

    def create(self, data: Dict[str, Any]) -> Optional[ChuyenKhoa]:
        """Tạo chuyên khoa mới"""
        try:
            new_chuyen_khoa = ChuyenKhoa(**data)
            self.db.session.add(new_chuyen_khoa)
            self.db.session.commit()
            return new_chuyen_khoa
        except SQLAlchemyError as e:
            self.db.session.rollback()
            print(f"Lỗi SQL khi tạo chuyên khoa: {str(e)}")
            return None
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi không xác định: {str(e)}")
            return None

    def update(self, ck_ma: str, data: Dict[str, Any]) -> Optional[ChuyenKhoa]:
        """Cập nhật thông tin chuyên khoa"""
        try:
            chuyen_khoa = self.get_by_id(ck_ma)
            if not chuyen_khoa:
                return None

            # Cập nhật các trường
            for key, value in data.items():
                setattr(chuyen_khoa, key, value)

            self.db.session.commit()
            return chuyen_khoa
        except SQLAlchemyError as e:
            self.db.session.rollback()
            print(f"Lỗi SQL khi cập nhật chuyên khoa: {str(e)}")
            return None
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi không xác định: {str(e)}")
            return None

    def delete(self, ck_ma: str) -> bool:
        """Xóa chuyên khoa"""
        try:
            chuyen_khoa = self.get_by_id(ck_ma)
            if not chuyen_khoa:
                return False

            self.db.session.delete(chuyen_khoa)
            self.db.session.commit()
            return True
        except SQLAlchemyError as e:
            self.db.session.rollback()
            print(f"Lỗi SQL khi xóa chuyên khoa: {str(e)}")
            return False
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi không xác định: {str(e)}")
            return False

    def get_doctors_by_department(self, ck_ma: str) -> List[BacSi]:
        """Lấy danh sách bác sĩ theo chuyên khoa"""
        try:
            chuyen_khoa = self.get_by_id(ck_ma)
            if not chuyen_khoa:
                return []
            return chuyen_khoa.bac_si
        except Exception as e:
            print(f"Lỗi khi lấy danh sách bác sĩ theo chuyên khoa: {str(e)}")
            return []

    def get_rooms_by_department(self, ck_ma: str) -> List[Phong]:
        """Lấy danh sách phòng theo chuyên khoa"""
        try:
            chuyen_khoa = self.get_by_id(ck_ma)
            if not chuyen_khoa:
                return []
            return chuyen_khoa.phong
        except Exception as e:
            print(f"Lỗi khi lấy danh sách phòng theo chuyên khoa: {str(e)}")
            return []

    def get_max_ck_ma(self) -> str:
        """Lấy mã chuyên khoa lớn nhất và tạo mã mới"""
        try:
            max_id = (
                self.db.session.query(ChuyenKhoa)
                .order_by(ChuyenKhoa.ck_ma.desc())
                .first()
            )
            if max_id:
                # Trích xuất số từ mã CK
                current_id = max_id.ck_ma
                if current_id.startswith("CK"):
                    try:
                        num = int(current_id[2:])
                        # Tăng số lên 1 và định dạng 6 chữ số (8 ký tự với 'CK')
                        return f"CK{(num + 1):06d}"
                    except ValueError:
                        return "CK000001"
            return "CK000001"
        except Exception as e:
            print(f"Lỗi khi tạo mã chuyên khoa mới: {str(e)}")
            return "CK000001"

    def get_room_codes_by_department(self, ck_ma: str) -> List[str]:
        """
        Lấy tất cả mã phòng dựa vào mã chuyên khoa

        Args:
            ck_ma: Mã chuyên khoa

        Returns:
            List[str]: Danh sách các mã phòng thuộc chuyên khoa
        """
        try:
            # Truy vấn trực tiếp mã phòng từ bảng phòng
            room_codes = (
                self.db.session.query(Phong.phong_ma).filter(Phong.ck_ma == ck_ma).all()
            )

            # Chuyển đổi kết quả từ list of tuples sang list of strings
            return [code[0] for code in room_codes]
        except Exception as e:
            print(f"Lỗi khi lấy danh sách mã phòng theo chuyên khoa: {str(e)}")
            return []
    
    def department_report(self,date: date) -> List[Dict[str, Any]]:
        """
        Tạo báo cáo chuyên khoa theo ngày

        Args:
            date: Ngày cần tạo báo cáo

        Returns:
            List[Dict[str, Any]]: Danh sách các chuyên khoa với số lượng bác sĩ và phòng
        """
        try:
            departments = self.get_all()
            report = []
            for department in departments:
                report.append({
                    "ck_ma": department.ck_ma,
                    "ck_ten": department.ck_ten,
                    "so_luong_bac_si": len(department.bac_si),
                    "so_luong_phong": len(department.phong),
                    "ngay_bao_cao": date.isoformat()
                })
            return report
        except Exception as e:
            print(f"Lỗi khi tạo báo cáo chuyên khoa: {str(e)}")
            return []