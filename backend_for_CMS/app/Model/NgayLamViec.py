from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING, List
from datetime import date

if TYPE_CHECKING:
    from . import LichLamViec, DangKyLichLam

class NgayLamViec(db.Model):
    __tablename__ = "ngay_lam_viec"
    
    # Primary Key
    nl_ngay: Mapped[date] = mapped_column(db.Date, primary_key=True)
    
    # Relationship to LichLamViec
    lich_lam_viec: Mapped[List["LichLamViec"]] = relationship("LichLamViec", back_populates="ngay_lam_viec")
    dang_ky_lich_lam: Mapped[List["DangKyLichLam"]] = relationship("DangKyLichLam", back_populates="ngay_lam_viec")
    
    def to_dict(self):
        return {
            "nl_ngay": self.nl_ngay.strftime("%Y-%m-%d") if self.nl_ngay else None
        }