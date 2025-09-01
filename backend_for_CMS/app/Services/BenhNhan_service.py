from app.Model import BenhNhan
from typing import List
from sqlalchemy.exc import IntegrityError

class BenhNhanService:
    def __init__(self, db):
        self.db = db

    def get_all(self):
        return self.db.session.query(BenhNhan).all()
    
    def get_by_id(self, bn_ma):
        return self.db.session.query(BenhNhan).filter(BenhNhan.bn_ma == bn_ma).first()    
    
    def create(self, data):
        try:
            password = data.pop("bn_password", None)
            if "bn_ma" not in data:
                data["bn_ma"] = self.get_max_bn_ma()  # Tự động tăng mã bệnh nhân

            new_patient = BenhNhan(**data)
            if password:
                new_patient.set_password(password)  # Hash và gán mật khẩu
            
            self.db.session.add(new_patient)
            self.db.session.commit()
            return new_patient
        except IntegrityError as e:
            self.db.session.rollback()
            if 'uq_bn_sdt' in str(e) or 'Duplicate' in str(e):
                # Ném một ngoại lệ để controller xử lý
                raise ValueError("Số điện thoại đã được sử dụng")
            raise e
    
    def get_pk_by_id(self, bn_ma: str) -> List[dict]:

        try:
            patient = self.db.session.query(BenhNhan).filter(BenhNhan.bn_ma == bn_ma).first()
            if not patient:
                raise Exception(f"Patient with ID {bn_ma} not found")
            
            phieu_khams = patient.phieu_kham
            return [pk.to_dict() for pk in phieu_khams]

        except Exception as e:
            self.db.session.rollback()
            raise Exception(f"Error getting medical records: {str(e)}")
    
        
    def get_tt_by_id(self, bn_ma: str) -> List[dict]:

        try:
            patient = self.db.session.query(BenhNhan).filter(BenhNhan.bn_ma == bn_ma).first()
            if not patient:
                raise Exception(f"Patient with ID {bn_ma} not found")
            
            # Get all medical records and their prescriptions
            prescriptions = []
            for phieu_kham in patient.phieu_kham:
                if phieu_kham.toa_thuoc:  # Check if medical record has prescriptions
                    for toa in phieu_kham.toa_thuoc:
                        prescription = toa.to_dict()
                        prescription['thuoc_info'] = toa.thuoc.to_dict()  # Add medicine details
                        prescription['ngay_kham'] = phieu_kham.pk_ngaykham
                        prescriptions.append(prescription)
            
            return prescriptions

        except Exception as e:
            self.db.session.rollback()
            raise Exception(f"Error getting prescriptions: {str(e)}")
    
    def get_chi_tiet_toa_thuoc_by_id(self, bn_ma: str) -> dict:
        try:
            patient = self.db.session.query(BenhNhan).filter(BenhNhan.bn_ma == bn_ma).first()
            if not patient:
                raise Exception(f"Patient with ID {bn_ma} not found")
            
            result = {
                "benh_nhan": patient.to_dict(),
                "lich_su_toa_thuoc": {}
            }
            
            for phieu_kham in patient.phieu_kham:
                if phieu_kham.toa_thuoc is not None:  # Kiểm tra tồn tại toa thuốc
                    ngay_kham = phieu_kham.pk_ngaykham.strftime('%Y-%m-%d')
                    
                    if ngay_kham not in result["lich_su_toa_thuoc"]:
                        result["lich_su_toa_thuoc"][ngay_kham] = []
                    
                    # Lấy thông tin toa thuốc
                    toa = phieu_kham.toa_thuoc
                    toa_info = {
                        "tt_matthuoc": toa.tt_matthuoc,
                        "tt_ngayke": toa.tt_ngayke.strftime('%Y-%m-%d') if toa.tt_ngayke else None,
                        "tt_taikham": toa.tt_taikham.strftime('%Y-%m-%d') if toa.tt_taikham else None,
                        "chi_tiet_thuoc": []
                    }
                    
                    # Lấy chi tiết các thuốc trong toa
                    for ct in toa.chi_tiet_toa_thuoc:
                        detail = {
                            "thuoc_ma": ct.thuoc.thuoc_ma,
                            "cttt_soluong": ct.cttt_soluong,
                            "cttt_lieuluong": ct.cttt_lieuluong,
                            "thuoc_info": {
                                "thuoc_ten": ct.thuoc.thuoc_ten,
                                "thuoc_dvt": ct.thuoc.thuoc_dvt
                            }
                        }
                        toa_info["chi_tiet_thuoc"].append(detail)
                    
                    result["lich_su_toa_thuoc"][ngay_kham].append(toa_info)
            
            return result

        except Exception as e:
            self.db.session.rollback()
            raise Exception(f"Error getting prescription details: {str(e)}")
    
    def get_chi_tiet_chi_dinh_by_id(self, bn_ma: str) -> dict:

        try:
            patient = self.db.session.query(BenhNhan).filter(BenhNhan.bn_ma == bn_ma).first()
            if not patient:
                raise Exception(f"Patient with ID {bn_ma} not found")
            
            result = {
                "benh_nhan": patient.to_dict(),
                "lich_su_chi_dinh": {}
            }
            
            for phieu_kham in patient.phieu_kham:
                if phieu_kham.phieu_cd_dvyt:
                    ngay_kham = phieu_kham.pk_ngaykham.strftime('%Y-%m-%d')
                    
                    if ngay_kham not in result["lich_su_chi_dinh"]:
                        result["lich_su_chi_dinh"][ngay_kham] = []
                    
                    # Lấy thông tin phiếu chỉ định
                    phieu_cd = phieu_kham.phieu_cd_dvyt
                    phieu_info = {
                        "pcd_ma": phieu_cd.pcd_ma,
                        "pk_ma": phieu_cd.pk_ma,
                        "pk_ngaykham": ngay_kham,
                        "pcd_tongtien": phieu_cd.pcd_tongtien,
                        "chi_dinh_dich_vu": []
                    }
                    
                    # Lấy chi tiết các dịch vụ trong phiếu
                    for chi_dinh in phieu_cd.chi_dinh:
                        dich_vu = chi_dinh.dich_vu_y_te
                        detail = {
                            "dvyt_ma": dich_vu.dvyt_ma,
                            "dvyt_ten": dich_vu.dvyt_ten,
                            # Thêm giá dịch vụ nếu cần
                            # "don_gia": dich_vu.don_gia_dv[-1].dgdv_gia if dich_vu.don_gia_dv else None
                        }
                        phieu_info["chi_dinh_dich_vu"].append(detail)
                    
                    result["lich_su_chi_dinh"][ngay_kham].append(phieu_info)
            
            return result

        except Exception as e:
            self.db.session.rollback()
            raise Exception(f"Error getting medical service details: {str(e)}")
    
    def get_max_bn_ma(self):
        """Lấy mã bệnh nhân lớn nhất từ database và tạo mã mới 8 ký tự"""
        try:
            # Lấy bản ghi bệnh nhân có mã lớn nhất
            from app.Model import BenhNhan
            result = self.db.session.query(BenhNhan.bn_ma).order_by(BenhNhan.bn_ma.desc()).first()
            
            if result:
                # Trích xuất số từ mã BN
                current_id = result[0]
                if current_id.startswith('BN'):
                    try:
                        num = int(current_id[2:])
                        # Tăng số lên 1 và định dạng với 6 chữ số (tổng 8 ký tự với 'BN')
                        return f"BN{(num + 1):06d}"
                    except ValueError:
                        # Nếu không phải định dạng số, trả về mã mặc định
                        return "BN000001"
            # Nếu không có bản ghi nào
            return "BN000001"
        except Exception as e:
            print(f"Error getting max bn_ma: {str(e)}")
            # Trả về mã mặc định nếu có lỗi
            return "BN000001"
    
    def get_patients_with_converted_appointments(self, start_date, end_date):
        """
        Lấy danh sách bệnh nhân đã lập phiếu hẹn và phiếu hẹn đã được tạo thành phiếu khám
        có pk_ngaykham trong khoảng thời gian cho trước
        
        Args:
            start_date: Ngày bắt đầu (date object hoặc chuỗi YYYY-MM-DD)
            end_date: Ngày kết thúc (date object hoặc chuỗi YYYY-MM-DD)
            
        Returns:
            List: Danh sách bệnh nhân với thông tin phiếu hẹn và phiếu khám
        """
        try:
            from app.Model.PhieuHen import PhieuHen
            from app.Model.PhieuKham import PhieuKham
            from datetime import datetime, date
            
            # Chuyển đổi chuỗi ngày sang đối tượng date nếu cần
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
            
            # Truy vấn bệnh nhân có phiếu hẹn đã được chuyển thành phiếu khám
            query = (
                self.db.session.query(BenhNhan)
                .join(PhieuHen, BenhNhan.bn_ma == PhieuHen.bn_ma)
                .join(PhieuKham, PhieuHen.ph_ma == PhieuKham.ph_ma)
                .filter(
                    PhieuKham.pk_ngaykham >= start_date,
                    PhieuKham.pk_ngaykham <= end_date
                )
                .distinct()
            )
            
            # Lấy tất cả kết quả không giới hạn
            patients = query.all()
            
            result_list = []
            for patient in patients:
                patient_dict = patient.to_dict()
                
                # Lấy phiếu hẹn và phiếu khám tương ứng
                appointments_and_records = []
                
                # Truy vấn phiếu hẹn và phiếu khám tương ứng trong khoảng thời gian
                records = (
                    self.db.session.query(PhieuHen, PhieuKham)
                    .join(PhieuKham, PhieuHen.ph_ma == PhieuKham.ph_ma)
                    .filter(
                        PhieuHen.bn_ma == patient.bn_ma,
                        PhieuKham.pk_ngaykham >= start_date,
                        PhieuKham.pk_ngaykham <= end_date
                    )
                    .all()
                )
                
                for phieu_hen, phieu_kham in records:
                    appointments_and_records.append({
                        "phieu_hen": phieu_hen.to_dict(),
                        "phieu_kham": phieu_kham.to_dict()
                    })
                
                patient_dict["appointments_and_records"] = appointments_and_records
                result_list.append(patient_dict)
            
            return {
                "total": len(result_list),
                "patients": result_list
            }
        
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi lấy danh sách bệnh nhân có phiếu hẹn đã chuyển thành phiếu khám: {str(e)}")
            raise Exception(f"Lỗi khi lấy danh sách bệnh nhân: {str(e)}")

