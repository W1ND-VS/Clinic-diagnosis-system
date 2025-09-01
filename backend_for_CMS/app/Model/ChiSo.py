from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from . import KetQua, DichVuYTe

class ChiSo(db.Model):
    __tablename__ = "chi_so"
    
    # Composite Primary Key
    dvyt_ma: Mapped[str] = mapped_column(
        db.String(8),
        db.ForeignKey("dich_vu_y_te.dvyt_ma", ondelete="RESTRICT", onupdate="RESTRICT"),
        primary_key=True
    )
    cs_ma: Mapped[str] = mapped_column(db.String(8), primary_key=True)
    
    # Regular columns
    cs_ten: Mapped[Optional[str]] = mapped_column(db.String(225), nullable=True)
    cs_mucbthuong: Mapped[Optional[str]] = mapped_column(db.String(100), nullable=True)  # Đổi từ Integer sang String(100)
    cs_donvi: Mapped[Optional[str]] = mapped_column(db.String(50), nullable=True)
    
    # Relationships
    ket_qua: Mapped[List["KetQua"]] = relationship("KetQua", back_populates="chi_so")
    dich_vu_y_te: Mapped["DichVuYTe"] = relationship("DichVuYTe", back_populates="chi_so")
    
    def to_dict(self):
        return {
            "dvyt_ma": self.dvyt_ma,
            "cs_ma": self.cs_ma,
            "cs_ten": self.cs_ten,
            "cs_mucbthuong": self.cs_mucbthuong,
            "cs_donvi": self.cs_donvi
        }