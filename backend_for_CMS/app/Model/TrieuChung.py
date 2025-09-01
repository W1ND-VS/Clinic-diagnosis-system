from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.extensions import db
from typing import TYPE_CHECKING, List, Optional

if TYPE_CHECKING:
    from . import PhieuKham, ChiTietToaThuoc, TrieuChungPhieuHen # noqa: F401

class TrieuChung(db.Model):
    __tablename__ = "trieu_chung"
    
    tc_ma: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    tc_ten: Mapped[Optional[str]] = mapped_column(db.String(100), nullable=True)
    tc_mota: Mapped[Optional[str]] = mapped_column(db.String(100), nullable=True)
    
    # Relationships
    trieu_chung_phieu_hen: Mapped[List["TrieuChungPhieuHen"]] = relationship(
        "TrieuChungPhieuHen", 
        back_populates="trieu_chung"
    )

    def to_dict(self):
        return {
            "tc_ma": self.tc_ma,
            "tc_ten": self.tc_ten,
            "tc_mota": self.tc_mota,
        }

    def __str__(self):
        return f"Triệu chứng: {self.tc_ten} - Mã triệu chứng: {self.tc_ma}"

    def __repr__(self):
        return self.__str__()