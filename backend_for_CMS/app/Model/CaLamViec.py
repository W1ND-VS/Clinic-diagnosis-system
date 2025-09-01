from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, TYPE_CHECKING, List
from datetime import time

if TYPE_CHECKING:
    from . import LichLamViec, DangKyLichLam

class CaLamViec(db.Model):
    __tablename__ = "ca_lam_viec"

    # Primary Key
    clv_stt: Mapped[int] = mapped_column(db.Integer, primary_key=True)

    # Regular columns
    clv_tgbatdau: Mapped[Optional[time]] = mapped_column(db.Time, nullable=True)
    clv_tgkthuc: Mapped[Optional[time]] = mapped_column(db.Time, nullable=True)

    # Relationship to LichLamViec
    lich_lam_viec: Mapped[List["LichLamViec"]] = relationship(
        "LichLamViec", back_populates="ca_lam_viec"
    )

    # Relationship to DangKyLichLam
    dang_ky_lich_lam: Mapped[List["DangKyLichLam"]] = relationship("DangKyLichLam", back_populates="ca_lam_viec")

    def to_dict(self):
        return {
            "clv_stt": self.clv_stt,
            "clv_tgbatdau": (
                self.clv_tgbatdau.strftime("%H:%M") if self.clv_tgbatdau else None
            ),
            "clv_tgkthuc": (
                self.clv_tgkthuc.strftime("%H:%M") if self.clv_tgkthuc else None
            ),
        }
