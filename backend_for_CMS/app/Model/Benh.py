from flask.cli import F
from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from . import ChanDoan


class Benh(db.Model):
    __tablename__ = "benh"

    # Primary Key
    b_ma: Mapped[str] = mapped_column(db.String(10), primary_key=True)

    # Regular columns
    b_ten: Mapped[Optional[str]] = mapped_column(db.String(1024), nullable=False)
    b_mota: Mapped[Optional[str]] = mapped_column(db.String(1024), nullable=True)

    # Relationship
    chan_doan: Mapped[List["ChanDoan"]] = relationship(
        "ChanDoan", back_populates="benh", cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        return {
            "b_ma": self.b_ma,
            "b_ten": self.b_ten,
            "b_mota": self.b_mota,
        }
