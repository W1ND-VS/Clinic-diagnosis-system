from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date, time
from typing import Optional, TYPE_CHECKING
from app.constants.phieu_kham_status import PhieuKhamStatus
from decimal import Decimal

if TYPE_CHECKING:
    from . import TiepTan, PhieuHen, ToaThuoc, PhieuCDDVYT


class PhieuKham(db.Model):
    __tablename__ = "phieu_kham"

    # Primary Keys
    pk_ma: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    pk_ngaykham: Mapped[date] = mapped_column(db.Date, primary_key=True)

    # Foreign Keys - All foreign keys from the SQL schema
    pcd_ma: Mapped[Optional[str]] = mapped_column(
        db.String(10),
        nullable=True,  # Schema shows this can be NULL
    )
    tt_matthuoc: Mapped[Optional[str]] = mapped_column(
        db.String(12),
        nullable=True,  # Schema shows this can be NULL
    )
    ph_ma: Mapped[str] = mapped_column(
        db.String(8),
        db.ForeignKey("phieu_hen.ph_ma", ondelete="RESTRICT", onupdate="RESTRICT"),
        nullable=False,  # Required in schema
    )
    nv_ma: Mapped[str] = mapped_column(
        db.String(8),
        db.ForeignKey("tiep_tan.nv_ma", ondelete="RESTRICT", onupdate="RESTRICT"),
        nullable=False,  # Required in schema
    )

    # Regular columns
    pk_giokhamdukien: Mapped[Optional[time]] = mapped_column(db.Time, nullable=True)
    pk_giokhamthucte: Mapped[Optional[time]] = mapped_column(db.Time, nullable=True)
    pk_gioketthuc: Mapped[Optional[time]] = mapped_column(db.Time, nullable=True)
    pk_trangthai: Mapped[Optional[str]] = mapped_column(
        db.String(20),
        nullable=True,
        default=PhieuKhamStatus.CHO_KHAM,
        comment="Trạng thái phiếu khám",
    )
    
    # === THÊM CÁC TRƯỜNG CHỈ SỐ SINH HIỆU ===
    pk_huyetap_tamthu: Mapped[Optional[int]] = mapped_column(
        db.Integer,
        nullable=True,
        comment="Huyết áp tâm thu (mmHg)"
    )
    pk_huyetap_tamtruong: Mapped[Optional[int]] = mapped_column(
        db.Integer,
        nullable=True,
        comment="Huyết áp tâm trương (mmHg)"
    )
    pk_nhietdo: Mapped[Optional[Decimal]] = mapped_column(
        db.Numeric(4, 1),  # 999.9 độ C
        nullable=True,
        comment="Nhiệt độ cơ thể (°C)"
    )
    pk_nhiptim: Mapped[Optional[int]] = mapped_column(
        db.Integer,
        nullable=True,
        comment="Nhịp tim (lần/phút)"
    )
    pk_nhiptho: Mapped[Optional[int]] = mapped_column(
        db.Integer,
        nullable=True,
        comment="Nhịp thở (lần/phút)"
    )
    pk_chieucao: Mapped[Optional[Decimal]] = mapped_column(
        db.Numeric(5, 2),  # 999.99 cm
        nullable=True,
        comment="Chiều cao (cm)"
    )
    pk_cannang: Mapped[Optional[Decimal]] = mapped_column(
        db.Numeric(5, 2),  # 999.99 kg
        nullable=True,
        comment="Cân nặng (kg)"
    )

    # Relationships
    tiep_tan: Mapped["TiepTan"] = relationship("TiepTan", back_populates="phieu_kham")
    phieu_hen: Mapped["PhieuHen"] = relationship(
        "PhieuHen",
        back_populates="phieu_kham",
        uselist=False,  # Ensure one-to-one relationship
    )
    # Keep the same viewonly relationships to handle circular references
    toa_thuoc: Mapped[Optional["ToaThuoc"]] = relationship(
        "ToaThuoc",
        back_populates="phieu_kham",
        uselist=False,
        viewonly=True,  # Added to break circular reference
    )
    phieu_cd_dvyt: Mapped[Optional["PhieuCDDVYT"]] = relationship(
        "PhieuCDDVYT",
        back_populates="phieu_kham",
        uselist=False,
        post_update=True,  # This tells SQLAlchemy to update this relationship after insert
    )

    def __init__(self, **kwargs):
        # Set default status if not provided
        if "pk_trangthai" not in kwargs:
            kwargs["pk_trangthai"] = PhieuKhamStatus.CHO_KHAM
        super().__init__(**kwargs)

    def update_status(self, new_status: str) -> bool:
        """
        Update examination status with validation

        Args:
            new_status: New status to set

        Returns:
            bool: True if update successful, False otherwise
        """
        if not PhieuKhamStatus.is_valid_status(new_status):
            raise ValueError(f"Trạng thái không hợp lệ: {new_status}")

        if not PhieuKhamStatus.can_update_to(self.pk_trangthai, new_status):
            raise ValueError(
                f"Không thể chuyển từ trạng thái '{self.pk_trangthai}' sang '{new_status}'"
            )

        self.pk_trangthai = new_status
        return True

    def get_possible_next_statuses(self):
        """Get list of possible next statuses"""
        return PhieuKhamStatus.get_next_possible_statuses(self.pk_trangthai)

    def is_active(self) -> bool:
        """Check if examination is still active"""
        return self.pk_trangthai in PhieuKhamStatus.get_active_statuses()

    def is_completed(self) -> bool:
        """Check if examination is completed"""
        return self.pk_trangthai in PhieuKhamStatus.get_completed_statuses()

    def is_cancelled(self) -> bool:
        """Check if examination is cancelled"""
        return self.pk_trangthai in PhieuKhamStatus.get_cancelled_statuses()

    def can_be_billed(self) -> bool:
        """Check if examination can be billed"""
        return self.pk_trangthai in PhieuKhamStatus.get_billable_statuses()

    def to_dict(self):
        base_dict = {
            "pk_ma": self.pk_ma,
            "pk_ngaykham": (
                self.pk_ngaykham.strftime("%Y-%m-%d") if self.pk_ngaykham else None
            ),
            "pcd_ma": self.pcd_ma,
            "tt_matthuoc": self.tt_matthuoc,
            "ph_ma": self.ph_ma,
            "nv_ma": self.nv_ma,
            "pk_giokhamdukien": (
                self.pk_giokhamdukien.strftime("%H:%M")
                if self.pk_giokhamdukien
                else None
            ),
            "pk_giokhamthucte": (
                self.pk_giokhamthucte.strftime("%H:%M")
                if self.pk_giokhamthucte
                else None
            ),
            "pk_gioketthuc": (
                self.pk_gioketthuc.strftime("%H:%M") if self.pk_gioketthuc else None
            ),
            "pk_trangthai": self.pk_trangthai,
            
            # === THÊM CÁC TRƯỜNG CHỈ SỐ SINH HIỆU VÀO to_dict() ===
            "pk_huyetap_tamthu": self.pk_huyetap_tamthu,
            "pk_huyetap_tamtruong": self.pk_huyetap_tamtruong,
            "pk_nhietdo": float(self.pk_nhietdo) if self.pk_nhietdo else None,
            "pk_nhiptim": self.pk_nhiptim,
            "pk_nhiptho": self.pk_nhiptho,
            "pk_chieucao": float(self.pk_chieucao) if self.pk_chieucao else None,
            "pk_cannang": float(self.pk_cannang) if self.pk_cannang else None,
            
            "status_info": {
                "description": PhieuKhamStatus.get_status_description(
                    self.pk_trangthai
                ),
                "color": PhieuKhamStatus.get_status_color(self.pk_trangthai),
                "is_active": self.is_active(),
                "is_completed": self.is_completed(),
                "is_cancelled": self.is_cancelled(),
                "can_be_billed": self.can_be_billed(),
                "next_possible_statuses": self.get_possible_next_statuses(),
            },
        }

        return base_dict
