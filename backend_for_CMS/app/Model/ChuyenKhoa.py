from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from . import BacSi, Phong


class ChuyenKhoa(db.Model):
    __tablename__ = "chuyen_khoa"

    ck_ma: Mapped[str] = mapped_column(db.String(8), primary_key=True)  # char(8)
    ck_ten: Mapped[str] = mapped_column(db.String(100))  # varchar(100)
    ck_mota: Mapped[str] = mapped_column(db.String(1024))  # varchar(1024)
    ck_trangthai: Mapped[str] = mapped_column(db.String(50))  # varchar(50)

    bac_si: Mapped[List["BacSi"]] = relationship(
        "BacSi", back_populates="chuyen_khoa", cascade="all, delete"
    )
    phong: Mapped[List["Phong"]] = relationship("Phong", back_populates="chuyen_khoa")

    def __repr__(self):
        return f"<ChuyenKhoa {self.ck_ten}>"

    def to_dict(self):
        """Chuyển đối tượng ChuyenKhoa thành dictionary"""
        return {
            "ck_ma": self.ck_ma,
            "ck_ten": self.ck_ten,
            "ck_mota": self.ck_mota,
            "ck_trangthai": self.ck_trangthai,
            "so_luong_bac_si": len(self.bac_si) if self.bac_si else 0,
            "so_luong_phong": len(self.phong) if self.phong else 0
        }
