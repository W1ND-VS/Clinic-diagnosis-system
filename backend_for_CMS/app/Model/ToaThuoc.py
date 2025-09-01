from typing import TYPE_CHECKING, Optional, List
from datetime import date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.extensions import db

if TYPE_CHECKING:
    from . import ChiTietToaThuoc, PhieuKham, ChanDoan


class ToaThuoc(db.Model):
    __tablename__ = "toa_thuoc"

    # Primary key
    tt_matthuoc: Mapped[str] = mapped_column(db.String(13), primary_key=True)

    # Foreign key fields
    pk_ma: Mapped[int] = mapped_column(db.Integer, primary_key=False)
    pk_ngaykham: Mapped[date] = mapped_column(db.Date, primary_key=False)

    # Regular fields
    tt_ngayke: Mapped[Optional[date]] = mapped_column(db.Date)
    tt_taikham: Mapped[Optional[date]] = mapped_column(db.Date)

    # Composite foreign key for phieu_kham
    __table_args__ = (
        db.ForeignKeyConstraint(
            ["pk_ma", "pk_ngaykham"], ["phieu_kham.pk_ma", "phieu_kham.pk_ngaykham"]
        ),
    )

    # Relationships
    phieu_kham: Mapped["PhieuKham"] = relationship(
        "PhieuKham", back_populates="toa_thuoc"
    )
    chi_tiet_toa_thuoc: Mapped[List["ChiTietToaThuoc"]] = relationship(
        "ChiTietToaThuoc", back_populates="toa_thuoc"
    )
    chan_doan: Mapped[List["ChanDoan"]] = relationship(
        "ChanDoan", back_populates="toa_thuoc", cascade="all, delete-orphan"
    )

    # Methods
    def to_dict(self) -> dict:
        return {
            "tt_matthuoc": self.tt_matthuoc,
            "pk_ma": self.pk_ma,
            "pk_ngaykham": self.pk_ngaykham,
            "tt_ngayke": self.tt_ngayke,
            "tt_taikham": self.tt_taikham,
            "benh": [cd.benh.b_ten for cd in self.chan_doan] if self.chan_doan else [],
        }
