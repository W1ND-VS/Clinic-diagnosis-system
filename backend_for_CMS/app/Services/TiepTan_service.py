from app.Model import TiepTan
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, List, Dict, Any


class TiepTanService:
    def __init__(self, db):
        self.db = db

    def get_all(self, offset: int = 0, limit: int = 10) -> List[TiepTan]:
        """Lấy danh sách nhân viên có tham số phân trang"""
        try:
            return self.db.session.query(TiepTan).offset(offset).limit(limit).all()
        except SQLAlchemyError as e:
            print(f"Error fetching receptionists: {str(e)}")
            return []
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return []
        
    def get_by_id(self, id: str) -> Optional[TiepTan]:
        """Get receptionist by ID"""
        return self.db.session.query(TiepTan).filter(TiepTan.nv_ma == id).first()
    
    def create(self, data: Dict[str, Any]) -> Optional[TiepTan]:
        """Create a new receptionist"""
        try:
            # Extract password before creating object
            password = data.pop('nv_password')
            
            # Create receptionist object
            new_tieptan = TiepTan(**data)
            
            # Set password with hashing
            new_tieptan.set_password(password)
            
            # Add to database and commit
            self.db.session.add(new_tieptan)
            self.db.session.commit()
            
            return new_tieptan
            
        except SQLAlchemyError as e:
            self.db.session.rollback()
            print(f"Error creating receptionist: {str(e)}")
            return None
        except Exception as e:
            self.db.session.rollback()
            print(f"Unexpected error: {str(e)}")
            return None
    
    def update(self, id: str, data: Dict[str, Any]) -> Optional[TiepTan]:
        """Update an existing receptionist"""
        try:
            tieptan = self.get_by_id(id)
            if not tieptan:
                return None
                
            # Handle password separately if provided
            if 'nv_password' in data:
                password = data.pop('nv_password')
                tieptan.set_password(password)
                
            # Update other fields
            for key, value in data.items():
                setattr(tieptan, key, value)
                
            self.db.session.commit()
            return tieptan
            
        except Exception as e:
            self.db.session.rollback()
            print(f"Error updating receptionist: {str(e)}")
            return None
    
    def delete(self, id: str) -> bool:
        """Delete a receptionist"""
        try:
            tieptan = self.get_by_id(id)
            if not tieptan:
                return False
                
            self.db.session.delete(tieptan)
            self.db.session.commit()
            return True
            
        except Exception as e:
            self.db.session.rollback()
            print(f"Error deleting receptionist: {str(e)}")
            return False