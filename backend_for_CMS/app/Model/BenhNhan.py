from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
from typing import Optional, TYPE_CHECKING, List
from werkzeug.security import generate_password_hash, check_password_hash


if TYPE_CHECKING:
    from . import PhieuHen


class BenhNhan(db.Model):
    __tablename__ = "benh_nhan"

    # Primary Key - Changed to char(8) to match SQL schema
    bn_ma: Mapped[str] = mapped_column(db.String(8), primary_key=True)

    # Regular columns - Updated to match SQL schema
    bn_hoten: Mapped[Optional[str]] = mapped_column(db.String(1024), nullable=True)
    bn_ngaysinh: Mapped[Optional[date]] = mapped_column(db.Date, nullable=True)
    # Changed from Boolean to String to match varchar(10)
    bn_gioitinh: Mapped[Optional[str]] = mapped_column(db.String(10), nullable=True)
    # Changed length from 15 to 11 and added unique constraint
    bn_sdt: Mapped[Optional[str]] = mapped_column(
        db.String(11), nullable=True, unique=True
    )
    # Thêm trường password và cccd
    bn_password: Mapped[Optional[str]] = mapped_column(db.String(255), nullable=True)
    bn_cccd: Mapped[Optional[str]] = mapped_column(
        db.String(20), nullable=True, unique=True
    )

    # Relationships
    phieu_hen: Mapped[List["PhieuHen"]] = relationship(
        "PhieuHen", back_populates="benh_nhan"
    )
    
    def set_password(self, password: str):
        self.bn_password = generate_password_hash(password)

    def check_password(self, password: str):
        return check_password_hash(self.bn_password, password)

    def to_dict(self):
        return {
            "bn_ma": self.bn_ma,
            "bn_hoten": self.bn_hoten,
            "bn_ngaysinh": (
                self.bn_ngaysinh.strftime("%d/%m/%Y") if self.bn_ngaysinh else None
            ),
            "bn_gioitinh":  "Nam" if self.bn_gioitinh == '1' else "Nữ",
            "bn_sdt": self.bn_sdt,
            "bn_cccd": self.bn_cccd,
            # Không trả về password vì lý do bảo mật
        }

    def __repr__(self):
        return f"<BenhNhan {self.bn_ma} - {self.bn_hoten}>"
