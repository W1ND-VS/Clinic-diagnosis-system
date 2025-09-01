from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from . import ToaThuoc, Benh

class ChanDoan(db.Model):

    __tablename__ = "chan_doan"

    # Composite Primary Key and Foreign Keys
    tt_matthuoc: Mapped[str] = mapped_column(
        db.String(13),
        db.ForeignKey(
            "toa_thuoc.tt_matthuoc", ondelete="RESTRICT", onupdate="RESTRICT"
        ),
        primary_key=True,
    )
    b_ma: Mapped[str] = mapped_column(
        db.String(10),
        db.ForeignKey("benh.b_ma", ondelete="RESTRICT", onupdate="RESTRICT"),
        primary_key=True,
    )

    # Relationships
    toa_thuoc: Mapped["ToaThuoc"] = relationship("ToaThuoc", back_populates="chan_doan")
    benh: Mapped["Benh"] = relationship("Benh", back_populates="chan_doan")

    def to_dict(self):
        """Convert the model instance to a dictionary"""
        return {"tt_matthuoc": self.tt_matthuoc, "b_ma": self.b_ma}

    def __repr__(self):
        return f"<ChanDoan {self.tt_matthuoc}-{self.b_ma}>"
