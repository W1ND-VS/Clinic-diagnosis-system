from typing import TYPE_CHECKING, List
from sqlalchemy.orm import mapped_column, Mapped, relationship
from datetime import date
from app.extensions import db

if TYPE_CHECKING:
    from . import DonGiaDichVu

class NgayApDung(db.Model):
    __tablename__ = 'ngay_ap_dung'

    nad_ngay: Mapped[date] = mapped_column(db.Date, primary_key=True)

    # Add relationship
    don_gia_dv: Mapped[List["DonGiaDichVu"]] = relationship('DonGiaDichVu', back_populates='ngay_ap_dung')

    def to_dict(self) -> dict:
        return {
            'nad_ngay': self.nad_ngay
        }