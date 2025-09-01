from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
from typing import Optional, TYPE_CHECKING, List
from werkzeug.security import generate_password_hash, check_password_hash

if TYPE_CHECKING:
    from . import ChuyenKhoa, PhieuKham, LichLamViec, PhieuHen, DangKyLichLam

class BacSi(db.Model):
    __tablename__ = "bac_si"

    # Primary Key
    nv_ma: Mapped[str] = mapped_column(db.String(8), primary_key=True)
    
    # Regular columns
    nv_hoten: Mapped[str] = mapped_column(db.String(1024), nullable=False)
    nv_ngaysinh: Mapped[Optional[date]] = mapped_column(db.Date, nullable=True)
    nv_gioitinh: Mapped[bool] = mapped_column(db.Boolean, nullable=False)
    nv_password: Mapped[str] = mapped_column(db.String(255), nullable=False)
    bs_csdaotao: Mapped[Optional[str]] = mapped_column(db.String(1024))  # varchar(1024)
    bs_bcapchuyenmon: Mapped[Optional[str]] = mapped_column(db.String(1024))  # varchar(1024)
    ck_ma: Mapped[str] = mapped_column(
        db.String(8),
        db.ForeignKey("chuyen_khoa.ck_ma", ondelete="RESTRICT", onupdate="RESTRICT"),
        nullable=False
    )
    
    # Relationships
    chuyen_khoa: Mapped["ChuyenKhoa"] = relationship("ChuyenKhoa", back_populates="bac_si")
    lich_lam_viec: Mapped[List["LichLamViec"]] = relationship("LichLamViec", back_populates="bac_si")
    phieu_hen: Mapped[List["PhieuHen"]] = relationship("PhieuHen", back_populates="bac_si")
    dang_ky_lich_lam: Mapped[List["DangKyLichLam"]] = relationship("DangKyLichLam", back_populates="bac_si")
    
    def set_password(self, password: str):
        self.nv_password = generate_password_hash(password)
        
    def check_password(self, password: str):
        return check_password_hash(self.nv_password, password)
        
    def to_dict(self, include_department=False):
        result = {
            "nv_ma": self.nv_ma,
            "nv_hoten": self.nv_hoten,
            "nv_ngaysinh": self.nv_ngaysinh.strftime("%Y-%m-%d") if self.nv_ngaysinh else None,
            "nv_gioitinh": "Nam" if self.nv_gioitinh else "Nữ",
            "bs_csdaotao": self.bs_csdaotao,
            "bs_bcapchuyenmon": self.bs_bcapchuyenmon,
            "ck_ma": self.ck_ma
        }
        
        if include_department and self.chuyen_khoa:
            result["chuyen_khoa"] = self.chuyen_khoa.to_dict()
            
        return result

    def __repr__(self):
        return f"<BacSi {self.nv_hoten}>"


