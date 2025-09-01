from typing import Optional, List, Dict, Any
from sqlalchemy.exc import SQLAlchemyError
from app.Model.Thuoc import Thuoc

class ThuocService:

    def __init__(self, db):
        self.db = db

    def get_all(self) -> List[Dict[str, Any]]:
        """Get all medicines"""
        try:
            thuoc_list = self.db.session.query(Thuoc).all()
            return [thuoc.to_dict() for thuoc in thuoc_list]
        except Exception as e:
            print(f"Lỗi khi lấy danh sách thuốc: {str(e)}")
            return []

    def get_by_id(self, thuoc_ma: str) -> Optional[Thuoc]:
        """Get medicine by ID"""
        try:
            return self.db.session.query(Thuoc).filter(
                Thuoc.thuoc_ma == thuoc_ma
            ).first()
        except Exception as e:
            print(f"Lỗi khi lấy thuốc theo mã {thuoc_ma}: {str(e)}")
            return None

    def create(self, data: Dict[str, Any]) -> Optional[Thuoc]:
        """Create a new medicine"""
        try:
            # Check if medicine already exists
            existing = self.get_by_id(data.get('thuoc_ma'))
            if existing:
                raise ValueError(f"Thuốc với mã {data.get('thuoc_ma')} đã tồn tại")

            # Create new medicine
            new_thuoc = Thuoc(
                thuoc_ma=data.get('thuoc_ma'),
                thuoc_ten=data.get('thuoc_ten'),
                thuoc_dvt=data.get('thuoc_dvt')
            )

            # Validate required fields
            if not new_thuoc.thuoc_ma or not new_thuoc.thuoc_ten or not new_thuoc.thuoc_dvt:
                raise ValueError("Thiếu thông tin bắt buộc cho thuốc")

            self.db.session.add(new_thuoc)
            self.db.session.commit()
            return new_thuoc
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi tạo thuốc mới: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi tạo thuốc mới: {str(e)}")

    def update(self, thuoc_ma: str, data: Dict[str, Any]) -> Optional[Thuoc]:
        """Update an existing medicine"""
        try:
            thuoc = self.get_by_id(thuoc_ma)
            if not thuoc:
                raise ValueError(f"Không tìm thấy thuốc với mã {thuoc_ma}")

            # Update fields
            if 'thuoc_ten' in data:
                thuoc.thuoc_ten = data['thuoc_ten']
            if 'thuoc_dvt' in data:
                thuoc.thuoc_dvt = data['thuoc_dvt']

            self.db.session.commit()
            return thuoc
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi cập nhật thuốc: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi cập nhật thuốc: {str(e)}")

    def delete(self, thuoc_ma: str) -> bool:
        """Delete a medicine by ID"""
        try:
            thuoc = self.get_by_id(thuoc_ma)
            if not thuoc:
                raise ValueError(f"Không tìm thấy thuốc với mã {thuoc_ma}")

            self.db.session.delete(thuoc)
            self.db.session.commit()
            return True
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi xóa thuốc: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi xóa thuốc: {str(e)}")
    
    def search(self, keyword: str) -> List[Dict[str, Any]]:
        """Search for medicines by name or ID"""
        try:
            query = self.db.session.query(Thuoc).filter(
                (Thuoc.thuoc_ma.ilike(f"%{keyword}%")) | 
                (Thuoc.thuoc_ten.ilike(f"%{keyword}%"))
            )
            
            thuoc_list = query.all()
            return [thuoc.to_dict() for thuoc in thuoc_list]
        except Exception as e:
            print(f"Lỗi khi tìm kiếm thuốc: {str(e)}")
            return []
    
    def get_paginated(self, offset: int = 0, limit: int = 10, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get paginated list of medicines with optional filtering"""
        try:
            # Start with base query
            query = self.db.session.query(Thuoc)
            
            # Apply filters if provided
            if filters:
                if 'thuoc_ma' in filters and filters['thuoc_ma']:
                    query = query.filter(Thuoc.thuoc_ma.ilike(f"%{filters['thuoc_ma']}%"))
                if 'thuoc_ten' in filters and filters['thuoc_ten']:
                    query = query.filter(Thuoc.thuoc_ten.ilike(f"%{filters['thuoc_ten']}%"))
                if 'thuoc_dvt' in filters and filters['thuoc_dvt']:
                    query = query.filter(Thuoc.thuoc_dvt.ilike(f"%{filters['thuoc_dvt']}%"))
            
            # Count total results
            total = query.count()
            
            # Apply pagination
            thuoc_list = query.offset(offset).limit(limit).all()
            
            # Convert to dictionary
            result = {
                "total": total,
                "offset": offset,
                "limit": limit,
                "data": [thuoc.to_dict() for thuoc in thuoc_list]
            }
            
            return result
        except Exception as e:
            print(f"Lỗi khi lấy danh sách thuốc phân trang: {str(e)}")
            return {"total": 0, "offset": offset, "limit": limit, "data": []}