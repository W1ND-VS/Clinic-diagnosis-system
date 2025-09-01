from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from . import TrieuChung, PhieuHen

class TrieuChungPhieuHen(db.Model):
    __tablename__ = "trieu_chung_phieu_hen"

    # Composite Primary Key and Foreign Keys
    tc_ma: Mapped[int] = mapped_column(
        db.Integer,
        db.ForeignKey("trieu_chung.tc_ma", ondelete="RESTRICT", onupdate="RESTRICT"),
        primary_key=True
    )
    ph_ma: Mapped[str] = mapped_column(
        db.String(8),
        db.ForeignKey("phieu_hen.ph_ma", ondelete="RESTRICT", onupdate="RESTRICT"),
        primary_key=True
    )

    # Relationships
    trieu_chung: Mapped["TrieuChung"] = relationship("TrieuChung", back_populates="trieu_chung_phieu_hen")
    phieu_hen: Mapped["PhieuHen"] = relationship("PhieuHen", back_populates="trieu_chung_phieu_hen")

    def to_dict(self):
        return {
            "tc_ma": self.tc_ma,
            "ph_ma": self.ph_ma
        }