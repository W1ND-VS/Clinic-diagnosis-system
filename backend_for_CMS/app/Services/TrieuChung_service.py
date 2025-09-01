from app.Model import TrieuChung,TrieuChungPhieuHen
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, List, Dict, Any

class TrieuChungService:
    def __init__(self, db):
        self.db = db
    
    def get_all(self) -> List[TrieuChung]:
        """Lấy tất cả các triệu chứng"""
        return self.db.session.query(TrieuChung).all()
    
    def get_by_id(self, id: int) -> Optional[TrieuChung]:
        """Lấy triệu chứng theo ID"""
        return self.db.session.query(TrieuChung).filter(TrieuChung.tc_ma == id).first()
    
    def search_by_name(self, name: str) -> List[TrieuChung]:
        """Tìm kiếm triệu chứng theo tên"""
        return self.db.session.query(TrieuChung).filter(TrieuChung.tc_ten.ilike(f"%{name}%")).all()
    
    def create(self, data: Dict[str, Any]) -> Optional[TrieuChung]:
        """Tạo một triệu chứng mới"""
        try:
            new_symptom = TrieuChung(**data)
            self.db.session.add(new_symptom)
            self.db.session.commit()
            return new_symptom
        except SQLAlchemyError as e:
            self.db.session.rollback()
            print(f"Lỗi khi tạo triệu chứng: {str(e)}")
            return None
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi không xác định: {str(e)}")
            return None
    
    def update(self, id: int, data: Dict[str, Any]) -> Optional[TrieuChung]:
        """Cập nhật một triệu chứng hiện có"""
        try:
            symptom = self.get_by_id(id)
            if not symptom:
                return None
                
            # Cập nhật các trường
            for key, value in data.items():
                setattr(symptom, key, value)
                
            self.db.session.commit()
            return symptom
        except SQLAlchemyError as e:
            self.db.session.rollback()
            print(f"Lỗi khi cập nhật triệu chứng: {str(e)}")
            return None
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi không xác định: {str(e)}")
            return None
    
    def delete(self, id: int) -> bool:
        """Xóa một triệu chứng"""
        try:
            symptom = self.get_by_id(id)
            if not symptom:
                return False
                
            self.db.session.delete(symptom)
            self.db.session.commit()
            return True
        except SQLAlchemyError as e:
            self.db.session.rollback()
            print(f"Lỗi khi xóa triệu chứng: {str(e)}")
            return False
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi không xác định: {str(e)}")
            return False
    
    def get_all_by_phieu_hen(self, ph_ma: str) -> List[TrieuChung]:
        """Lấy tất cả triệu chứng của một phiếu hẹn"""
        try:
            # Join TrieuChungPhieuHen với TrieuChung để lấy thông tin triệu chứng đầy đủ
            return (
                self.db.session.query(TrieuChung)
                .join(
                    TrieuChungPhieuHen, 
                    TrieuChungPhieuHen.tc_ma == TrieuChung.tc_ma
                )
                .filter(TrieuChungPhieuHen.ph_ma == ph_ma)
                .all()
            )
        except Exception as e:
            print(f"Lỗi khi lấy triệu chứng của phiếu hẹn {ph_ma}: {str(e)}")
            return []

        