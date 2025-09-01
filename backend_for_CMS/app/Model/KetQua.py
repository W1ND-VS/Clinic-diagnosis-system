from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, TYPE_CHECKING
from sqlalchemy import ForeignKeyConstraint

if TYPE_CHECKING:
    from . import PhieuCDDVYT, ChiSo

class KetQua(db.Model):
    __tablename__ = "ket_qua"
    
    # Composite Primary Key
    pcd_ma: Mapped[str] = mapped_column(
        db.String(10),
        db.ForeignKey("phieu_cd_dvyt.pcd_ma", ondelete="RESTRICT", onupdate="RESTRICT"),
        primary_key=True
    )
    dvyt_ma: Mapped[str] = mapped_column(db.String(8), primary_key=True)
    cs_ma: Mapped[str] = mapped_column(db.String(8), primary_key=True)
    
    # Regular columns
    kq_ketqua: Mapped[Optional[str]] = mapped_column(db.String(1024), nullable=True)
    
    # Foreign Key constraint for composite key to ChiSo
    __table_args__ = (
        ForeignKeyConstraint(
            ['dvyt_ma', 'cs_ma'],
            ['chi_so.dvyt_ma', 'chi_so.cs_ma'],
            ondelete="RESTRICT",
            onupdate="RESTRICT"
        ),
    )
    
    # Relationships
    phieu_cd_dvyt: Mapped["PhieuCDDVYT"] = relationship("PhieuCDDVYT", back_populates="ket_qua")
    chi_so: Mapped["ChiSo"] = relationship("ChiSo", back_populates="ket_qua")
    
    def to_dict(self):
        return {
            "pcd_ma": self.pcd_ma,
            "dvyt_ma": self.dvyt_ma,
            "cs_ma": self.cs_ma,
            "kq_ketqua": self.kq_ketqua
        }