from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING
from datetime import date

if TYPE_CHECKING:
    from . import CaLamViec, NgayLamViec, Phong, BacSi

class LichLamViec(db.Model):
    __tablename__ = "lich_lam_viec"
    
    # Composite Primary Key and Foreign Keys
    clv_stt: Mapped[int] = mapped_column(
        db.Integer,
        db.ForeignKey("ca_lam_viec.clv_stt", ondelete="RESTRICT", onupdate="RESTRICT"),
        primary_key=True
    )
    nl_ngay: Mapped[date] = mapped_column(
        db.Date,
        db.ForeignKey("ngay_lam_viec.nl_ngay", ondelete="RESTRICT", onupdate="RESTRICT"),
        primary_key=True
    )
    phong_ma: Mapped[str] = mapped_column(
        db.String(3),
        db.ForeignKey("phong.phong_ma", ondelete="RESTRICT", onupdate="RESTRICT"),
        primary_key=True
    )
    nv_ma: Mapped[str] = mapped_column(
        db.String(8),
        db.ForeignKey("bac_si.nv_ma", ondelete="RESTRICT", onupdate="RESTRICT"),
        nullable=False
    )
    
    # Relationships
    ca_lam_viec: Mapped["CaLamViec"] = relationship("CaLamViec", back_populates="lich_lam_viec")
    ngay_lam_viec: Mapped["NgayLamViec"] = relationship("NgayLamViec", back_populates="lich_lam_viec")
    phong: Mapped["Phong"] = relationship("Phong", back_populates="lich_lam_viec")
    bac_si: Mapped["BacSi"] = relationship("BacSi", back_populates="lich_lam_viec")
    
    def to_dict(self):
        return {
            "clv_stt": self.clv_stt,
            "nl_ngay": self.nl_ngay.strftime("%Y-%m-%d") if self.nl_ngay else None,
            "phong_ma": self.phong_ma,
            "nv_ma": self.nv_ma
        }