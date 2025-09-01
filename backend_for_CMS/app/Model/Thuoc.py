from typing import TYPE_CHECKING, List
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.extensions import db

    
if TYPE_CHECKING:
    from . import ChiTietToaThuoc

class Thuoc(db.Model):
    __tablename__ = 'thuoc'

    thuoc_ma: Mapped[str] = mapped_column(db.String(8), primary_key=True)
    thuoc_ten: Mapped[str] = mapped_column(db.String(1024), nullable=False)
    thuoc_dvt: Mapped[str] = mapped_column(db.String(30), nullable=False)
    
    # Add relationship
    chi_tiet_toa_thuoc: Mapped[List["ChiTietToaThuoc"]]  = relationship('ChiTietToaThuoc', back_populates='thuoc')

    def to_dict(self):
        return {
            'thuoc_ma': self.thuoc_ma,
            'thuoc_ten': self.thuoc_ten,
            'thuoc_dvt': self.thuoc_dvt
        }