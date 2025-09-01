from typing import TYPE_CHECKING, Optional
from datetime import date
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.extensions import db

    
if TYPE_CHECKING:
    from . import DichVuYTe,NgayApDung

class DonGiaDichVu(db.Model):
    __tablename__ = 'don_gia_dv'

    dvyt_ma: Mapped[str] = mapped_column(db.String(8), db.ForeignKey('dich_vu_y_te.dvyt_ma'), primary_key=True)
    nad_ngay: Mapped[date] = mapped_column(db.Date, db.ForeignKey('ngay_ap_dung.nad_ngay'), primary_key=True)
    dgdv_dongia: Mapped[Optional[int]] = mapped_column(db.Integer)

    # Relationships
    dich_vu_y_te: Mapped["DichVuYTe"] = relationship('DichVuYTe', back_populates='don_gia_dv')
    ngay_ap_dung: Mapped["NgayApDung"] = relationship('NgayApDung', back_populates='don_gia_dv')

    def to_dict(self) -> dict:
        return {
            'dvyt_ma': self.dvyt_ma,
            'nad_ngay': self.nad_ngay,
            'dgdv_dongia': self.dgdv_dongia
        }