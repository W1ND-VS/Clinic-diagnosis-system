from typing import Optional, List, Dict, Any
from app.Model.DonGiaDV import DonGiaDichVu
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from datetime import date, datetime
from app.Model import PhieuCDDVYT, DichVuYTe, PhieuKham, KetQua, ChiSo, NgayApDung
from tkinter.tix import MAX


class PhieuCDDVYTService:
    def __init__(self, db):
        self.db = db

    def get_all(self) -> List[PhieuCDDVYT]:
        """Lấy tất cả phiếu chỉ định dịch vụ y tế"""
        try:
            return self.db.session.query(PhieuCDDVYT).all()
        except Exception as e:
            print(f"Lỗi khi lấy tất cả phiếu CĐDVYT: {str(e)}")
            return []

    def get_by_id(self, pcd_ma: str) -> Optional[PhieuCDDVYT]:
        """Lấy phiếu chỉ định dịch vụ y tế theo mã"""
        try:
            return (
                self.db.session.query(PhieuCDDVYT)
                .filter(PhieuCDDVYT.pcd_ma == pcd_ma)
                .first()
            )
        except Exception as e:
            print(f"Lỗi khi lấy phiếu CĐDVYT theo mã {pcd_ma}: {str(e)}")
            return None

    def get_by_phieukham(self, pk_ma: int, pk_ngaykham: date) -> List[PhieuCDDVYT]:
        """Lấy tất cả phiếu chỉ định dịch vụ y tế của một phiếu khám"""
        try:
            return (
                self.db.session.query(PhieuCDDVYT)
                .filter(
                    PhieuCDDVYT.pk_ma == pk_ma, PhieuCDDVYT.pk_ngaykham == pk_ngaykham
                )
                .all()
            )
        except Exception as e:
            print(
                f"Lỗi khi lấy phiếu CĐDVYT của phiếu khám {pk_ma} ngày {pk_ngaykham}: {str(e)}"
            )
            return []

    def get_by_dichvu(self, dvyt_ma: str) -> List[PhieuCDDVYT]:
        """Lấy tất cả phiếu chỉ định có dịch vụ y tế cụ thể"""
        try:
            return (
                self.db.session.query(PhieuCDDVYT)
                .filter(PhieuCDDVYT.dvyt_ma == dvyt_ma)
                .all()
            )
        except Exception as e:
            print(f"Lỗi khi lấy phiếu CĐDVYT theo dịch vụ {dvyt_ma}: {str(e)}")
            return []
        
    def get_revenue_by_date(self, date: date) -> float:
        """Lấy tổng doanh thu của phiếu chỉ định dịch vụ y tế trong ngày"""
        try:
            total_revenue = (
                self.db.session.query(func.sum(PhieuCDDVYT.pcd_tongtien))
                .filter(PhieuCDDVYT.pk_ngaykham == date)
                .scalar()
            )
            return float(total_revenue) if total_revenue else 0.0
        except SQLAlchemyError as e:
            print(f"Lỗi khi lấy doanh thu theo ngày {date}: {str(e)}")
            return 0.0

    def get_by_date_range(self, start_date: date, end_date: date) -> List[PhieuCDDVYT]:
        """Lấy phiếu chỉ định dịch vụ y tế trong khoảng thời gian"""
        try:
            return (
                self.db.session.query(PhieuCDDVYT)
                .filter(
                    PhieuCDDVYT.pcd_ngaygio >= start_date,
                    PhieuCDDVYT.pcd_ngaygio <= end_date,
                )
                .all()
            )
        except Exception as e:
            print(f"Lỗi khi lấy phiếu CĐDVYT theo khoảng thời gian: {str(e)}")
            return []

    def create(self, data: Dict[str, Any]) -> Optional[PhieuCDDVYT]:
        """Tạo mới phiếu chỉ định dịch vụ y tế"""
        try:
            # Kiểm tra phiếu khám có tồn tại không
            pk_ma = data.get("pk_ma")
            pk_ngaykham = data.get("pk_ngaykham")

            if isinstance(pk_ngaykham, str):
                pk_ngaykham = datetime.strptime(pk_ngaykham, "%Y-%m-%d").date()

            phieu_kham = (
                self.db.session.query(PhieuKham)
                .filter(PhieuKham.pk_ma == pk_ma, PhieuKham.pk_ngaykham == pk_ngaykham)
                .first()
            )

            if not phieu_kham:
                raise ValueError(
                    f"Không tìm thấy phiếu khám với mã {pk_ma} và ngày {pk_ngaykham}"
                )

            # Tạo mã phiếu chỉ định mới
            pcd_ma = self._generate_pcd_ma()

            # Tạo phiếu chỉ định mới - chỉ với các trường có trong model
            new_phieu_cd = PhieuCDDVYT(
                pcd_ma=pcd_ma,
                pk_ma=pk_ma,
                pk_ngaykham=pk_ngaykham,
                pcd_tongtien=None,  # Tổng tiền sẽ được tính sau
            )

            self.db.session.add(new_phieu_cd)
            self.db.session.commit()

            return new_phieu_cd
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi tạo phiếu CĐDVYT: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi tạo phiếu CĐDVYT: {str(e)}")

    def update(self, pcd_ma: str, data: Dict[str, Any]) -> Optional[PhieuCDDVYT]:
        """Cập nhật phiếu chỉ định dịch vụ y tế"""
        try:
            phieu_cd = self.get_by_id(pcd_ma)
            if not phieu_cd:
                raise ValueError(f"Không tìm thấy phiếu CĐDVYT với mã {pcd_ma}")

            # Cập nhật tổng tiền nếu có
            if "pcd_tongtien" in data:
                phieu_cd.pcd_tongtien = data["pcd_tongtien"]

            # Cập nhật ngày nếu có
            if "pcd_ngay" in data:
                if isinstance(data["pcd_ngay"], str):
                    # Chuyển đổi từ chuỗi sang đối tượng date
                    try:
                        phieu_cd.pcd_ngay = datetime.strptime(
                            data["pcd_ngay"], "%Y-%m-%d"
                        ).date()
                    except ValueError:
                        raise ValueError(
                            "Định dạng pcd_ngay không hợp lệ. Sử dụng YYYY-MM-DD"
                        )
                else:
                    phieu_cd.pcd_ngay = data["pcd_ngay"]

            # Cập nhật giờ nếu có
            if "pcd_gio" in data:
                if isinstance(data["pcd_gio"], str):
                    # Chuyển đổi từ chuỗi sang đối tượng time
                    try:
                        time_str = data["pcd_gio"]
                        # Hỗ trợ cả định dạng HH:MM và HH:MM:SS
                        if len(time_str.split(":")) == 2:
                            time_str += ":00"
                        phieu_cd.pcd_gio = datetime.strptime(
                            time_str, "%H:%M:%S"
                        ).time()
                    except ValueError:
                        raise ValueError(
                            "Định dạng pcd_gio không hợp lệ. Sử dụng HH:MM:SS hoặc HH:MM"
                        )
                else:
                    phieu_cd.pcd_gio = data["pcd_gio"]

            # Không cho phép thay đổi phiếu khám (pk_ma, pk_ngaykham)
            # vì đây là các khóa ngoại quan trọng

            self.db.session.commit()
            return phieu_cd
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi cập nhật phiếu CĐDVYT: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi cập nhật phiếu CĐDVYT: {str(e)}")

    def delete(self, pcd_ma: str) -> bool:
        """Xóa phiếu chỉ định dịch vụ y tế"""
        try:
            phieu_cd = self.get_by_id(pcd_ma)
            if not phieu_cd:
                raise ValueError(f"Không tìm thấy phiếu CĐDVYT với mã {pcd_ma}")

            # Kiểm tra xem phiếu đã có kết quả chưa
            existing_results = (
                self.db.session.query(KetQua).filter(KetQua.pcd_ma == pcd_ma).first()
            )

            if existing_results:
                raise ValueError(
                    f"Không thể xóa phiếu CĐDVYT {pcd_ma} vì đã có kết quả"
                )

            # Xóa phiếu chỉ định
            self.db.session.delete(phieu_cd)
            self.db.session.commit()
            return True
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi xóa phiếu CĐDVYT: {str(e)}")
            if isinstance(e, ValueError):
                raise
            return False

    def complete_prescription(
        self, pcd_ma: str, data: Dict[str, Any]
    ) -> Optional[PhieuCDDVYT]:
        """Hoàn thành phiếu chỉ định dịch vụ y tế và cập nhật kết quả"""
        try:
            phieu_cd = self.get_by_id(pcd_ma)
            if not phieu_cd:
                raise ValueError(f"Không tìm thấy phiếu CĐDVYT với mã {pcd_ma}")

            # Cập nhật trạng thái
            phieu_cd.pcd_trangthai = "Đã hoàn thành"

            # Cập nhật nhân viên thực hiện nếu có
            if "nv_ma" in data:
                phieu_cd.nv_ma = data["nv_ma"]

            # Lưu kết quả xét nghiệm nếu có
            if "ket_qua" in data and isinstance(data["ket_qua"], list):
                for kq_data in data["ket_qua"]:
                    # Kiểm tra chỉ số có tồn tại không
                    dvyt_ma = kq_data.get("dvyt_ma")
                    cs_ma = kq_data.get("cs_ma")

                    chi_so = (
                        self.db.session.query(ChiSo)
                        .filter(ChiSo.dvyt_ma == dvyt_ma, ChiSo.cs_ma == cs_ma)
                        .first()
                    )

                    if not chi_so:
                        continue  # Bỏ qua nếu không tìm thấy chỉ số

                    # Kiểm tra xem đã có kết quả cho chỉ số này chưa
                    existing_kq = (
                        self.db.session.query(KetQua)
                        .filter(
                            KetQua.pcd_ma == pcd_ma,
                            KetQua.dvyt_ma == dvyt_ma,
                            KetQua.cs_ma == cs_ma,
                        )
                        .first()
                    )

                    if existing_kq:
                        # Cập nhật kết quả hiện có
                        existing_kq.kq_ketqua = kq_data.get("kq_ketqua")
                    else:
                        # Tạo kết quả mới
                        new_kq = KetQua(
                            pcd_ma=pcd_ma,
                            dvyt_ma=dvyt_ma,
                            cs_ma=cs_ma,
                            kq_ketqua=kq_data.get("kq_ketqua"),
                        )
                        self.db.session.add(new_kq)

            self.db.session.commit()
            return phieu_cd
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi hoàn thành phiếu CĐDVYT: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi hoàn thành phiếu CĐDVYT: {str(e)}")

    def get_with_results(self, pcd_ma: str) -> Dict[str, Any]:
        """Lấy phiếu chỉ định kèm kết quả"""
        try:
            phieu_cd = self.get_by_id(pcd_ma)
            if not phieu_cd:
                raise ValueError(f"Không tìm thấy phiếu CĐDVYT với mã {pcd_ma}")

            # Lấy thông tin phiếu chỉ định
            result = (
                phieu_cd.to_dict()
                if hasattr(phieu_cd, "to_dict")
                else {
                    "pcd_ma": phieu_cd.pcd_ma,
                    "pk_ma": phieu_cd.pk_ma,
                    "pk_ngaykham": phieu_cd.pk_ngaykham.strftime("%Y-%m-%d"),
                    "dvyt_ma": phieu_cd.dvyt_ma,
                    "pcd_ngaygio": phieu_cd.pcd_ngaygio.strftime("%Y-%m-%d %H:%M:%S"),
                    "pcd_trangthai": phieu_cd.pcd_trangthai,
                    "nv_ma": phieu_cd.nv_ma,
                }
            )

            # Lấy thông tin dịch vụ y tế
            dich_vu = (
                self.db.session.query(DichVuYTe)
                .filter(DichVuYTe.dvyt_ma == phieu_cd.dvyt_ma)
                .first()
            )

            if dich_vu:
                result["dich_vu"] = (
                    dich_vu.to_dict()
                    if hasattr(dich_vu, "to_dict")
                    else {"dvyt_ma": dich_vu.dvyt_ma, "dvyt_ten": dich_vu.dvyt_ten}
                )

            # Lấy các kết quả
            ket_qua_list = (
                self.db.session.query(KetQua, ChiSo)
                .join(
                    ChiSo,
                    (KetQua.dvyt_ma == ChiSo.dvyt_ma) & (KetQua.cs_ma == ChiSo.cs_ma),
                )
                .filter(KetQua.pcd_ma == pcd_ma)
                .all()
            )

            result["ket_qua"] = []
            for kq, cs in ket_qua_list:
                kq_item = {
                    "dvyt_ma": kq.dvyt_ma,
                    "cs_ma": kq.cs_ma,
                    "cs_ten": cs.cs_ten,
                    "cs_donvi": cs.cs_donvi,
                    "cs_mucbthuong": cs.cs_mucbthuong,
                    "kq_ketqua": kq.kq_ketqua,
                }
                result["ket_qua"].append(kq_item)

            return result
        except Exception as e:
            print(f"Lỗi khi lấy phiếu CĐDVYT kèm kết quả: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi lấy phiếu CĐDVYT kèm kết quả: {str(e)}")

    def get_paginated(
        self, offset: int = 0, limit: int = 10, filters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Lấy danh sách phiếu chỉ định có phân trang"""
        try:
            # Bắt đầu truy vấn
            query = self.db.session.query(PhieuCDDVYT)

            # Thêm các điều kiện lọc nếu có
            if filters:
                for field, value in filters.items():
                    if value is not None:
                        if field == "pk_ma":
                            query = query.filter(PhieuCDDVYT.pk_ma == value)
                        elif field == "pk_ngaykham":
                            query = query.filter(PhieuCDDVYT.pk_ngaykham == value)
                        elif field == "dvyt_ma":
                            query = query.filter(PhieuCDDVYT.dvyt_ma == value)
                        elif field == "pcd_trangthai":
                            query = query.filter(PhieuCDDVYT.pcd_trangthai == value)
                        elif field == "nv_ma":
                            query = query.filter(PhieuCDDVYT.nv_ma == value)
                        elif field == "from_date":
                            query = query.filter(PhieuCDDVYT.pcd_ngaygio >= value)
                        elif field == "to_date":
                            query = query.filter(PhieuCDDVYT.pcd_ngaygio <= value)

            # Đếm tổng số bản ghi thỏa điều kiện
            total = query.count()

            # Thực hiện phân trang
            query = query.order_by(PhieuCDDVYT.pcd_ngaygio.desc())
            query = query.offset(offset).limit(limit)

            # Thực hiện truy vấn và lấy kết quả
            records = query.all()

            # Chuyển đổi kết quả thành dict
            result_data = []
            for record in records:
                record_dict = (
                    record.to_dict()
                    if hasattr(record, "to_dict")
                    else {
                        "pcd_ma": record.pcd_ma,
                        "pk_ma": record.pk_ma,
                        "pk_ngaykham": record.pk_ngaykham.strftime("%Y-%m-%d"),
                        "dvyt_ma": record.dvyt_ma,
                        "pcd_ngaygio": record.pcd_ngaygio.strftime("%Y-%m-%d %H:%M:%S"),
                        "pcd_trangthai": record.pcd_trangthai,
                        "nv_ma": record.nv_ma,
                    }
                )

                # Lấy thêm thông tin dịch vụ y tế
                dich_vu = (
                    self.db.session.query(DichVuYTe)
                    .filter(DichVuYTe.dvyt_ma == record.dvyt_ma)
                    .first()
                )

                if dich_vu:
                    record_dict["dvyt_ten"] = dich_vu.dvyt_ten

                result_data.append(record_dict)

            return {
                "data": result_data,
                "total": total,
                "offset": offset,
                "limit": limit,
                "has_more": offset + len(records) < total,
            }
        except Exception as e:
            print(f"Lỗi khi lấy danh sách phiếu CĐDVYT có phân trang: {str(e)}")
            return {
                "data": [],
                "total": 0,
                "offset": offset,
                "limit": limit,
                "has_more": False,
            }

    def _generate_pcd_ma(self) -> str:
        """Tạo mã phiếu chỉ định mới - đảm bảo tối đa 10 ký tự"""
        try:
            # Prefix ngắn hơn (2 ký tự)
            prefix = "PC"

            # Sử dụng 'yyMMdd' thay vì 'yyyyMMdd' để tiết kiệm 2 ký tự
            date_str = datetime.now().strftime("%y%m%d")

            # Lấy số lớn nhất trong ngày
            latest_pcd = (
                self.db.session.query(PhieuCDDVYT.pcd_ma)
                .filter(PhieuCDDVYT.pcd_ma.like(f"{prefix}{date_str}%"))
                .order_by(PhieuCDDVYT.pcd_ma.desc())
                .first()
            )

            if latest_pcd:
                # Nếu đã có phiếu trong ngày, lấy số tiếp theo
                latest_num = int(latest_pcd[0][len(prefix) + len(date_str) :])
                new_num = latest_num + 1
            else:
                # Nếu chưa có phiếu nào trong ngày, bắt đầu từ 1
                new_num = 1

            # Sử dụng 2 chữ số cho số thứ tự (tối đa 99 phiếu/ngày)
            new_pcd_ma = f"{prefix}{date_str}{new_num:02d}"

            # Đảm bảo không vượt quá 10 ký tự
            if len(new_pcd_ma) > 10:
                # Fallback nếu vẫn vượt quá (rất hiếm)
                timestamp = datetime.now().strftime("%H%M%S")[:4]
                new_pcd_ma = f"{prefix}{date_str}{timestamp}"[:10]

            return new_pcd_ma
        except Exception as e:
            print(f"Lỗi khi tạo mã phiếu chỉ định: {str(e)}")                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
            # Fallback dùng timestamp có kiểm soát độ dài
            timestamp = datetime.now().strftime("%y%m%d%H%M")[:8]
            return f"{prefix}{timestamp}"[:10]

