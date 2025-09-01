from typing import TYPE_CHECKING, Optional, List
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.extensions import db
from datetime import date, time

if TYPE_CHECKING:
    from . import PhieuKham, KetQua


class PhieuCDDVYT(db.Model):
    __tablename__ = "phieu_cd_dvyt"

    # Primary key
    pcd_ma: Mapped[str] = mapped_column(db.String(10), primary_key=True)

    # Foreign key fields - Add nullable=False to match SQL constraint
    pk_ma: Mapped[int] = mapped_column(db.Integer, nullable=False)
    pk_ngaykham: Mapped[date] = mapped_column(db.Date, nullable=False)

    # Regular fields
    pcd_tongtien: Mapped[Optional[int]] = mapped_column(db.Integer)
    pcd_ngay: Mapped[Optional[date]] = mapped_column(db.Date)
    pcd_gio: Mapped[Optional[time]] = mapped_column(db.Time)

    # Composite foreign key for phieu_kham
    __table_args__ = (
        db.ForeignKeyConstraint(
            ["pk_ma", "pk_ngaykham"],
            ["phieu_kham.pk_ma", "phieu_kham.pk_ngaykham"],
            ondelete="RESTRICT",
            onupdate="RESTRICT",
        ),
    )

    # Relationships
    phieu_kham: Mapped["PhieuKham"] = relationship(
        "PhieuKham", back_populates="phieu_cd_dvyt"
    )
    ket_qua: Mapped[List["KetQua"]] = relationship(
        "KetQua", back_populates="phieu_cd_dvyt"
    )

    def to_dict(self) -> dict:
        return {
            "pcd_ma": self.pcd_ma,
            "pk_ma": self.pk_ma,
            "pk_ngaykham": (
                self.pk_ngaykham.strftime("%Y-%m-%d") if self.pk_ngaykham else None
            ),
            "pcd_tongtien": self.pcd_tongtien,
            "pcd_ngay": self.pcd_ngay.strftime("%Y-%m-%d") if self.pcd_ngay else None,
            "pcd_gio": self.pcd_gio.strftime("%H:%M:%S") if self.pcd_gio else None,
        }
