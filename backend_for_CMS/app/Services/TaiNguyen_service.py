from typing import List
from sqlalchemy import func
from app.Model.Thuoc import Thuoc
from app.Model.DichVuYTe import DichVuYTe
from app.Model.DonGiaDV import DonGiaDichVu
from app.Model.NgayApDung import NgayApDung
from app.extensions import db

class TaiNguyenService:
    def __init__(self, db):
        self.db = db

    def get_all_medicines(self) -> List[dict]:
        medicine_list = db.session.query(Thuoc).all()
        return [medicine.to_dict() for medicine in medicine_list]

    def get_all_medical_services(self) -> List[dict]:
        # Get the latest application date
        latest_date = db.session.query(func.max(NgayApDung.nad_ngay)).scalar()
        
        # Query services with their latest prices
        services_with_prices = (
            db.session.query(DichVuYTe, DonGiaDichVu)
            .outerjoin(DonGiaDichVu, DichVuYTe.dvyt_ma == DonGiaDichVu.dvyt_ma)
            .filter(DonGiaDichVu.nad_ngay == latest_date)
            .all()
        )

        result = []
        for service, price in services_with_prices:
            service_dict = service.to_dict()
            service_dict['don_gia'] = price.dgdv_dongia if price else None
            service_dict['ngay_ap_dung'] = price.nad_ngay if price else None
            result.append(service_dict)

        return result