from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING
from datetime import date

if TYPE_CHECKING:
    from . import NgayLamViec, CaLamViec, BacSi

class DangKyLichLam(db.Model):
    __tablename__ = "dang_ky_lich_lam"
    
    # Primary Keys and Foreign Keys
    nl_ngay: Mapped[date] = mapped_column(
        db.Date,
        db.ForeignKey("ngay_lam_viec.nl_ngay", ondelete="RESTRICT", onupdate="RESTRICT"),
        primary_key=True
    )
    clv_stt: Mapped[int] = mapped_column(
        db.Integer,
        db.ForeignKey("ca_lam_viec.clv_stt", ondelete="RESTRICT", onupdate="RESTRICT"),
        primary_key=True
    )
    nv_ma: Mapped[str] = mapped_column(
        db.String(8),
        db.ForeignKey("bac_si.nv_ma", ondelete="RESTRICT", onupdate="RESTRICT"),
        primary_key=True
    )
    
    # Relationships
    ngay_lam_viec: Mapped["NgayLamViec"] = relationship("NgayLamViec", back_populates="dang_ky_lich_lam")
    ca_lam_viec: Mapped["CaLamViec"] = relationship("CaLamViec", back_populates="dang_ky_lich_lam")
    bac_si: Mapped["BacSi"] = relationship("BacSi", back_populates="dang_ky_lich_lam")
    
    def to_dict(self):
        return {
            "nl_ngay": self.nl_ngay.strftime("%Y-%m-%d") if self.nl_ngay else None,
            "clv_stt": self.clv_stt,
            "nv_ma": self.nv_ma
        }