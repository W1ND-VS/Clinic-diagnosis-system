from typing import TYPE_CHECKING, Optional
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.extensions import db

if TYPE_CHECKING:
    from . import Thuoc,ToaThuoc

class ChiTietToaThuoc(db.Model):
    __tablename__ = 'chi_tiet_toa_thuoc'

    # Composite primary key and foreign keys
    tt_matthuoc: Mapped[str] = mapped_column(db.String(13), db.ForeignKey('toa_thuoc.tt_matthuoc'), primary_key=True)
    thuoc_ma: Mapped[str] = mapped_column(db.String(12), db.ForeignKey('thuoc.thuoc_ma'), primary_key=True)

    # Regular fields
    cttt_soluong: Mapped[Optional[int]] = mapped_column(db.Integer)
    cttt_lieuluong: Mapped[Optional[str]] = mapped_column(db.String(1024))

    # Relationships
    toa_thuoc: Mapped["ToaThuoc"] = relationship('ToaThuoc', back_populates='chi_tiet_toa_thuoc')
    thuoc: Mapped["Thuoc"] = relationship('Thuoc', back_populates='chi_tiet_toa_thuoc')


    def to_dict(self) -> dict:
        return {
            'tt_matthuoc': self.tt_matthuoc,
            'thuoc_ma': self.thuoc_ma,
            'cttt_soluong': self.cttt_soluong,
            'cttt_lieuluong': self.cttt_lieuluong
        }