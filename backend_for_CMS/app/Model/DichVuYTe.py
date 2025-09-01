from typing import TYPE_CHECKING, Optional, List
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.extensions import db

if TYPE_CHECKING:
    from . import DonGiaDichVu, ChiSo

class DichVuYTe(db.Model):
    __tablename__ = 'dich_vu_y_te'

    dvyt_ma: Mapped[str] = mapped_column(db.String(8), primary_key=True)
    dvyt_ten: Mapped[Optional[str]] = mapped_column(db.Text)
    dvyt_mota: Mapped[Optional[str]] = mapped_column(db.Text, nullable=True)

    # Add relationships
    don_gia_dv: Mapped[List["DonGiaDichVu"]] = relationship('DonGiaDichVu', back_populates='dich_vu_y_te')
    chi_so: Mapped[List["ChiSo"]] = relationship("ChiSo", back_populates="dich_vu_y_te")

    def to_dict(self):
        return {
            'dvyt_ma': self.dvyt_ma,
            'dvyt_ten': self.dvyt_ten,
            'dvyt_mota': self.dvyt_mota
        }