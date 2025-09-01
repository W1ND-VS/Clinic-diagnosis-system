from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
from typing import TYPE_CHECKING, Optional, List
from werkzeug.security import generate_password_hash, check_password_hash

if TYPE_CHECKING:
    from . import PhieuKham


class TiepTan(db.Model):
    __tablename__ = "tiep_tan"

    nv_ma: Mapped[str] = mapped_column(db.String(8), primary_key=True)  # char(8)
    nv_hoten: Mapped[str] = mapped_column(db.String(1024))  # varchar(1024)
    nv_ngaysinh: Mapped[Optional[date]] = mapped_column(db.Date)  # date
    nv_gioitinh: Mapped[bool] = mapped_column(db.Boolean)  # bool
    nv_password: Mapped[str] = mapped_column(db.String(255))  # varchar(30)

    # Add relationship to PhieuKham
    phieu_kham: Mapped[List["PhieuKham"]] = relationship(
        "PhieuKham", back_populates="tiep_tan"
    )

    def set_password(self, password: str):
        self.nv_password = generate_password_hash(password)

    def check_password(self, password: str):
        return check_password_hash(self.nv_password, password)

    def to_dict(self):
        return {
            "nv_ma": self.nv_ma,
            "nv_hoten": self.nv_hoten,
            "nv_ngaysinh": (
                self.nv_ngaysinh.strftime("%d/%m/%Y") if self.nv_ngaysinh else None
            ),
            "nv_gioitinh": "Nam" if self.nv_ngaysinh in [True, 1, "1", "Nam"] else "Nữ",
        }
