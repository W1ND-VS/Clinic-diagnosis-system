from typing import Optional, List, Dict, Any
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func, and_  # Thêm import này cho phiên bản optimized
from datetime import date
from app.Model import DichVuYTe, DonGiaDichVu, NgayApDung, ChiSo


class DichVuService:
    def __init__(self, db):
        self.db = db
        
    def get_all(self) -> List[Dict[str, Any]]:
        """Lấy tất cả dịch vụ y tế kèm đơn giá hiện tại"""
        try:
            today = date.today()
            result = []
            
            # Lấy tất cả dịch vụ
            dich_vu_list = self.db.session.query(DichVuYTe).all()
            
            for dv in dich_vu_list:
                # Lấy đơn giá hiện tại
                latest_price = self.db.session.query(DonGiaDichVu)\
                    .filter(DonGiaDichVu.dvyt_ma == dv.dvyt_ma)\
                    .filter(DonGiaDichVu.nad_ngay <= today)\
                    .order_by(DonGiaDichVu.nad_ngay.desc())\
                    .first()
                
                # Tạo dict với thông tin dịch vụ và đơn giá
                dv_dict = dv.to_dict()
                dv_dict['dongia'] = {
                    'gia': latest_price.dgdv_dongia if latest_price else None,
                    'ngay_ap_dung': latest_price.nad_ngay.strftime("%Y-%m-%d") if latest_price and latest_price.nad_ngay else None
                }
                
                result.append(dv_dict)
                
            return result
        except Exception as e:
            print(f"Lỗi khi lấy tất cả dịch vụ y tế kèm đơn giá: {str(e)}")
            return []
            
    def get_by_id(self, dvyt_ma: str) -> Optional[DichVuYTe]:
        """Lấy dịch vụ y tế theo mã"""
        try:
            return self.db.session.query(DichVuYTe).filter(
                DichVuYTe.dvyt_ma == dvyt_ma
            ).first()
        except Exception as e:
            print(f"Lỗi khi lấy dịch vụ y tế theo mã: {str(e)}")
            return None


    def create(self, data: Dict[str, Any]) -> Optional[DichVuYTe]:
        """Tạo mới dịch vụ y tế"""
        try:
            # Kiểm tra mã dịch vụ đã tồn tại chưa
            existing = self.get_by_id(data.get('dvyt_ma'))
            if existing:
                raise ValueError(f"Dịch vụ y tế với mã {data.get('dvyt_ma')} đã tồn tại")
                
            # Tạo đối tượng mới
            new_dv = DichVuYTe(
                dvyt_ma=data.get('dvyt_ma'),
                dvyt_ten=data.get('dvyt_ten')
            )
            
            # Thêm vào database
            self.db.session.add(new_dv)
            self.db.session.flush()
            
            # Nếu có thêm đơn giá
            if 'dgdv_dongia' in data:
                # Lấy ngày áp dụng, nếu không có thì sử dụng ngày hiện tại
                nad_ngay = data.get('nad_ngay') or date.today()
                
                # Kiểm tra ngày áp dụng đã tồn tại chưa
                ngay_ap_dung = self.db.session.query(NgayApDung).filter(
                    NgayApDung.nad_ngay == nad_ngay
                ).first()
                
                # Nếu chưa có ngày áp dụng, tạo mới
                if not ngay_ap_dung:
                    ngay_ap_dung = NgayApDung(nad_ngay=nad_ngay)
                    self.db.session.add(ngay_ap_dung)
                    self.db.session.flush()
                
                # Tạo đơn giá mới
                don_gia = DonGiaDichVu(
                    dvyt_ma=new_dv.dvyt_ma,
                    nad_ngay=nad_ngay,
                    dgdv_dongia=data.get('dgdv_dongia')
                )
                self.db.session.add(don_gia)
            
            self.db.session.commit()
            return new_dv
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi tạo dịch vụ y tế: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi tạo dịch vụ y tế: {str(e)}")
            
    def update(self, dvyt_ma: str, data: Dict[str, Any]) -> Optional[DichVuYTe]:
        """Cập nhật dịch vụ y tế"""
        try:
            dich_vu = self.get_by_id(dvyt_ma)
            if not dich_vu:
                raise ValueError(f"Không tìm thấy dịch vụ y tế với mã {dvyt_ma}")
                
            # Cập nhật thông tin
            if 'dvyt_ten' in data:
                dich_vu.dvyt_ten = data.get('dvyt_ten')
                
            self.db.session.commit()
            return dich_vu
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi cập nhật dịch vụ y tế: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi cập nhật dịch vụ y tế: {str(e)}")
            
    def delete(self, dvyt_ma: str) -> bool:
        """Xóa dịch vụ y tế"""
        try:
            dich_vu = self.get_by_id(dvyt_ma)
            if not dich_vu:
                raise ValueError(f"Không tìm thấy dịch vụ y tế với mã {dvyt_ma}")
                
            # Xóa các đơn giá liên quan
            self.db.session.query(DonGiaDichVu).filter(
                DonGiaDichVu.dvyt_ma == dvyt_ma
            ).delete()
            
            # Xóa dịch vụ
            self.db.session.delete(dich_vu)
            self.db.session.commit()
            return True
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi xóa dịch vụ y tế: {str(e)}")
            if isinstance(e, ValueError):
                raise
            return False
            
    def get_current_price(self, dvyt_ma: str) -> Optional[int]:
        """Lấy đơn giá hiện tại của dịch vụ y tế"""
        try:
            today = date.today()
            
            # Lấy ngày áp dụng gần nhất mà nhỏ hơn hoặc bằng ngày hiện tại
            latest_price = self.db.session.query(DonGiaDichVu)\
                .filter(DonGiaDichVu.dvyt_ma == dvyt_ma)\
                .filter(DonGiaDichVu.nad_ngay <= today)\
                .order_by(DonGiaDichVu.nad_ngay.desc())\
                .first()
                
            return latest_price.dgdv_dongia if latest_price else None
        except Exception as e:
            print(f"Lỗi khi lấy đơn giá hiện tại: {str(e)}")
            return None
            
    def get_price_history(self, dvyt_ma: str) -> List[DonGiaDichVu]:
        """Lấy lịch sử đơn giá của dịch vụ y tế"""
        try:
            return self.db.session.query(DonGiaDichVu)\
                .filter(DonGiaDichVu.dvyt_ma == dvyt_ma)\
                .order_by(DonGiaDichVu.nad_ngay.desc())\
                .all()
        except Exception as e:
            print(f"Lỗi khi lấy lịch sử đơn giá: {str(e)}")
            return []
            
    def update_price(self, dvyt_ma: str, dgdv_dongia: int, nad_ngay: date = None) -> Optional[DonGiaDichVu]:
        """Cập nhật đơn giá cho dịch vụ y tế"""
        try:
            # Kiểm tra dịch vụ có tồn tại không
            dich_vu = self.get_by_id(dvyt_ma)
            if not dich_vu:
                raise ValueError(f"Không tìm thấy dịch vụ y tế với mã {dvyt_ma}")
            
            # Nếu không có ngày áp dụng, sử dụng ngày hiện tại
            if not nad_ngay:
                nad_ngay = date.today()
                
            # Kiểm tra ngày áp dụng đã tồn tại chưa
            ngay_ap_dung = self.db.session.query(NgayApDung).filter(
                NgayApDung.nad_ngay == nad_ngay
            ).first()
            
            # Nếu chưa có ngày áp dụng, tạo mới
            if not ngay_ap_dung:
                ngay_ap_dung = NgayApDung(nad_ngay=nad_ngay)
                self.db.session.add(ngay_ap_dung)
                self.db.session.flush()
            
            # Kiểm tra đơn giá đã tồn tại chưa
            don_gia = self.db.session.query(DonGiaDichVu).filter(
                DonGiaDichVu.dvyt_ma == dvyt_ma,
                DonGiaDichVu.nad_ngay == nad_ngay
            ).first()
            
            if don_gia:
                # Cập nhật đơn giá hiện có
                don_gia.dgdv_dongia = dgdv_dongia
            else:
                # Tạo đơn giá mới
                don_gia = DonGiaDichVu(
                    dvyt_ma=dvyt_ma,
                    nad_ngay=nad_ngay,
                    dgdv_dongia=dgdv_dongia
                )
                self.db.session.add(don_gia)
                
            self.db.session.commit()
            return don_gia
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi cập nhật đơn giá: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi cập nhật đơn giá: {str(e)}")
        
    def get_chi_so_by_dich_vu(self, dvyt_ma: str) -> List[Dict[str, Any]]:
        """
        Lấy tất cả chỉ số của một dịch vụ y tế
        
        Args:
            dvyt_ma: Mã dịch vụ y tế
            
        Returns:
            Danh sách các chỉ số thuộc dịch vụ
        """
        try:
            # Kiểm tra dịch vụ có tồn tại không
            dich_vu = self.get_by_id(dvyt_ma)
            if not dich_vu:
                raise ValueError(f"Không tìm thấy dịch vụ y tế với mã {dvyt_ma}")
            
            # Lấy danh sách chỉ số
            chi_so_list = self.db.session.query(ChiSo).filter(
                ChiSo.dvyt_ma == dvyt_ma
            ).all()
            
            # Chuyển đổi danh sách chỉ số thành dictionary
            result = []
            for cs in chi_so_list:
                # Sử dụng phương thức to_dict đã có trong model ChiSo
                result.append(cs.to_dict())
            
            return result
        except Exception as e:
            print(f"Lỗi khi lấy chỉ số của dịch vụ y tế {dvyt_ma}: {str(e)}")
            if isinstance(e, ValueError):
                raise
            return []
        
    def get_paginated(self, offset: int = 0, limit: int = 10, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Lấy danh sách dịch vụ y tế phân trang kèm đơn giá và chỉ số
    
        Args:
            offset: Vị trí bắt đầu (default: 0)
            limit: Số lượng bản ghi (default: 10)
            filters: Bộ lọc tìm kiếm
                - dvyt_ma: Mã dịch vụ
                - dvyt_ten: Tên dịch vụ (tìm kiếm gần đúng)
                - dvyt_mota: Mô tả dịch vụ (tìm kiếm gần đúng)
                - min_price: Giá tối thiểu
                - max_price: Giá tối đa
            
        Returns:
            Dict chứa:
            - items: Danh sách dịch vụ với đầy đủ thông tin
            - total: Tổng số bản ghi
            - offset: Vị trí bắt đầu
            - limit: Số lượng bản ghi
            - has_next: Có trang tiếp theo
            - has_prev: Có trang trước
        """
        try:
            if filters is None:
                filters = {}
            
            today = date.today()
            
            # Build base query
            query = self.db.session.query(DichVuYTe)
            
            # Apply filters
            if 'dvyt_ma' in filters and filters['dvyt_ma']:
                query = query.filter(DichVuYTe.dvyt_ma.like(f"%{filters['dvyt_ma']}%"))
            
            if 'dvyt_ten' in filters and filters['dvyt_ten']:
                query = query.filter(DichVuYTe.dvyt_ten.like(f"%{filters['dvyt_ten']}%"))
            
            if 'dvyt_mota' in filters and filters['dvyt_mota']:
                query = query.filter(DichVuYTe.dvyt_mota.like(f"%{filters['dvyt_mota']}%"))
        
            # Count total records before pagination
            total = query.count()
            
            # Apply pagination
            dich_vu_list = query.offset(offset).limit(limit).all()
            
            # Process each service to include price and indicators
            items = []
            for dv in dich_vu_list:
                # Lấy đơn giá hiện tại
                latest_price = self.db.session.query(DonGiaDichVu)\
                    .filter(DonGiaDichVu.dvyt_ma == dv.dvyt_ma)\
                    .filter(DonGiaDichVu.nad_ngay <= today)\
                    .order_by(DonGiaDichVu.nad_ngay.desc())\
                    .first()
            
                # Lấy tất cả chỉ số của dịch vụ
                chi_so_list = self.db.session.query(ChiSo)\
                    .filter(ChiSo.dvyt_ma == dv.dvyt_ma)\
                    .all()
            
                # Tạo dict với thông tin đầy đủ
                dv_dict = dv.to_dict()
            
                # Thêm thông tin đơn giá
                dv_dict['dongia'] = {
                    'gia': latest_price.dgdv_dongia if latest_price else None,
                    'ngay_ap_dung': latest_price.nad_ngay.strftime("%Y-%m-%d") if latest_price and latest_price.nad_ngay else None,
                    'formatted_price': f"{latest_price.dgdv_dongia:,} VNĐ" if latest_price and latest_price.dgdv_dongia else "Chưa có giá"
                }
            
                # Thêm thông tin chỉ số
                dv_dict['chi_so'] = [cs.to_dict() for cs in chi_so_list]
                dv_dict['so_luong_chi_so'] = len(chi_so_list)
            
                # Apply price filter after getting price info
                if 'min_price' in filters and filters['min_price'] is not None:
                    if not latest_price or latest_price.dgdv_dongia < filters['min_price']:
                        continue
                    
                if 'max_price' in filters and filters['max_price'] is not None:
                    if not latest_price or latest_price.dgdv_dongia > filters['max_price']:
                        continue
            
                items.append(dv_dict)
        
            # Calculate pagination info
            has_next = (offset + limit) < total
            has_prev = offset > 0
        
            return {
                'items': items,
                'total': total,
                'offset': offset,
                'limit': limit,
                'has_next': has_next,
                'has_prev': has_prev,
                'total_pages': (total + limit - 1) // limit,  # Ceiling division
                'current_page': (offset // limit) + 1,
                'filters_applied': filters
            }
        
        except Exception as e:
            print(f"Lỗi khi lấy danh sách dịch vụ y tế phân trang: {str(e)}")
            return {
                'items': [],
                'total': 0,
                'offset': offset,
                'limit': limit,
                'has_next': False,
                'has_prev': False,
                'total_pages': 0,
                'current_page': 1,
                'error': str(e)
            }