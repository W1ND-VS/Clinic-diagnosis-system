from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date, time
from typing import Optional, TYPE_CHECKING
from typing import List

if TYPE_CHECKING:
    from . import BenhNhan, BacSi, PhieuKham, TrieuChungPhieuHen


class PhieuHen(db.Model):
    __tablename__ = "phieu_hen"

    # Primary Key
    ph_ma: Mapped[str] = mapped_column(db.String(8), primary_key=True)

    # Foreign Keys
    bn_ma: Mapped[str] = mapped_column(
        db.String(8),  # Thay đổi từ 5 thành 8 ký tự
        db.ForeignKey("benh_nhan.bn_ma", ondelete="RESTRICT", onupdate="RESTRICT"),
        nullable=False,
    )
    nv_ma: Mapped[str] = mapped_column(
        db.String(8),
        db.ForeignKey("bac_si.nv_ma", ondelete="RESTRICT", onupdate="RESTRICT"),
        nullable=False,
    )

    # Foreign Keys to PhieuKham (nullable since they can be NULL)
    pk_ma: Mapped[Optional[int]] = mapped_column(db.Integer, nullable=True)
    pk_ngaykham: Mapped[Optional[date]] = mapped_column(db.Date, nullable=True)

    # Regular columns
    ph_giohen: Mapped[Optional[time]] = mapped_column(db.Time, nullable=True)
    ph_gioketthuc: Mapped[Optional[time]] = mapped_column(
        db.Time, nullable=True
    )  # Thêm giờ kết thúc
    ph_ngayhen: Mapped[Optional[date]] = mapped_column(db.Date, nullable=True)
    
    # Thêm cột trạng thái phiếu hẹn
    ph_trangthai: Mapped[Optional[str]] = mapped_column(
        db.String(20), 
        nullable=True,
        default="Đang chờ",
        comment="Trạng thái phiếu hẹn: Đang chờ, Đã xác nhận, Đã khám, Đã hủy, Không đến"
    )

    # Relationships
    benh_nhan: Mapped["BenhNhan"] = relationship("BenhNhan", back_populates="phieu_hen")
    bac_si: Mapped["BacSi"] = relationship("BacSi", back_populates="phieu_hen")

    phieu_kham: Mapped[Optional["PhieuKham"]] = relationship(
        "PhieuKham",
        back_populates="phieu_hen",
        uselist=False,  # Ensure one-to-one relationship
    )
    trieu_chung_phieu_hen: Mapped[List["TrieuChungPhieuHen"]] = relationship(
        "TrieuChungPhieuHen", back_populates="phieu_hen"
    )

    def to_dict(self):
        return {
            "ph_ma": self.ph_ma,
            "bn_ma": self.bn_ma,
            "nv_ma": self.nv_ma,
            "pk_ma": self.pk_ma,
            "pk_ngaykham": (
                self.pk_ngaykham.strftime("%Y-%m-%d") if self.pk_ngaykham else None
            ),
            "ph_giohen": self.ph_giohen.strftime("%H:%M") if self.ph_giohen else None,
            "ph_gioketthuc": (
                self.ph_gioketthuc.strftime("%H:%M") if self.ph_gioketthuc else None
            ),
            "ph_ngayhen": (
                self.ph_ngayhen.strftime("%Y-%m-%d") if self.ph_ngayhen else None
            ),
            "ph_trangthai": self.ph_trangthai,  # Thêm trạng thái vào to_dict
        }
