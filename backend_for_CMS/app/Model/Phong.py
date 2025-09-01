from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, TYPE_CHECKING, List

if TYPE_CHECKING:
    from . import ChuyenKhoa, LichLamViec

class Phong(db.Model):
    __tablename__ = "phong"
    
    # Primary Key
    phong_ma: Mapped[str] = mapped_column(db.String(3), primary_key=True)
    
    # Foreign Keys
    ck_ma: Mapped[str] = mapped_column(
        db.String(8),
        db.ForeignKey("chuyen_khoa.ck_ma", ondelete="RESTRICT", onupdate="RESTRICT"),
        nullable=False
    )
    
    # Regular columns
    phong_mota: Mapped[Optional[str]] = mapped_column(db.String(100), nullable=True)
    
    # Relationships
    chuyen_khoa: Mapped["ChuyenKhoa"] = relationship("ChuyenKhoa", back_populates="phong")
    lich_lam_viec: Mapped[List["LichLamViec"]] = relationship("LichLamViec", back_populates="phong")
    
    def to_dict(self):
        return {
            "phong_ma": self.phong_ma,
            "ck_ma": self.ck_ma,
            "phong_mota": self.phong_mota
        }