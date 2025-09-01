from typing import Optional, List, Dict, Any
from sqlalchemy.exc import SQLAlchemyError
from datetime import date, datetime
from app.Model import PhieuCDDVYT, KetQua, ChiSo, PhieuKham, DichVuYTe
from app.Services.PhieuCDDVYT_service import PhieuCDDVYTService
from app.Services.DichVu_service import DichVuService
from app.Services.PhieuKham_service import PhieuKhamService


class KetQuaService:
    def __init__(self, db):
        self.db = db
        self.phieucddvyt_service = PhieuCDDVYTService(db)
        self.dichvu_service = DichVuService(db)
        self.phieukham_service = PhieuKhamService(db)  # Thêm PhieuKham_service

    # Hàm này sử dụng để tạo phiếu chỉ định
    def create_prescription_with_results(
        self, pk_ma: int, pk_ngaykham: date, dichvu_list: List[str]
    ) -> Dict[str, Any]:

        try:
            # Chuyển đổi kiểu dữ liệu nếu cần
            if isinstance(pk_ngaykham, str):
                pk_ngaykham = datetime.strptime(pk_ngaykham, "%Y-%m-%d").date()

            # Kiểm tra phiếu khám có tồn tại không
            phieu_kham = (
                self.db.session.query(PhieuKham)
                .filter(PhieuKham.pk_ma == pk_ma, PhieuKham.pk_ngaykham == pk_ngaykham)
                .first()
            )

            if not phieu_kham:
                raise ValueError(
                    f"Không tìm thấy phiếu khám với mã {pk_ma} và ngày {pk_ngaykham}"
                )

            # Kiểm tra danh sách dịch vụ có hợp lệ không
            if not dichvu_list or len(dichvu_list) == 0:
                raise ValueError("Danh sách dịch vụ không được để trống")

            total_price = 0
            result_count = 0
            valid_dichvu_count = 0

            # Tạo phiếu chỉ định dịch vụ y tế theo mô hình mới
            phieu_cd = self.phieucddvyt_service.create(
                {
                    "pk_ma": pk_ma,
                    "pk_ngaykham": pk_ngaykham,
                    # Không có các trường khác theo model mới
                }
            )

            if not phieu_cd:
                raise Exception("Không thể tạo phiếu chỉ định dịch vụ y tế")

            # Cập nhật phiếu khám với mã phiếu chỉ định sử dụng PhieuKham_service
            self.phieukham_service.update(
                pk_ma, pk_ngaykham, {"pcd_ma": phieu_cd.pcd_ma}
            )

            # Tạo kết quả cho tất cả các dịch vụ
            for dvyt_ma in dichvu_list:
                # Kiểm tra dịch vụ có tồn tại không
                dich_vu = (
                    self.db.session.query(DichVuYTe)
                    .filter(DichVuYTe.dvyt_ma == dvyt_ma)
                    .first()
                )

                if not dich_vu:
                    continue  # Bỏ qua nếu không tìm thấy dịch vụ

                valid_dichvu_count += 1

                # Lấy giá dịch vụ
                price = self.dichvu_service.get_current_price(dvyt_ma) or 0
                total_price += price

                # Lấy danh sách chỉ số của dịch vụ
                chi_so_list = (
                    self.db.session.query(ChiSo).filter(ChiSo.dvyt_ma == dvyt_ma).all()
                )
                print(f"Dịch vụ {dvyt_ma} có {len(chi_so_list)} chỉ số")
                # Tạo kết quả trống cho mỗi chỉ số
                for chi_so in chi_so_list:
                    new_result = KetQua(
                        pcd_ma=phieu_cd.pcd_ma,
                        dvyt_ma=chi_so.dvyt_ma,
                        cs_ma=chi_so.cs_ma,
                        kq_ketqua=None,  # Kết quả ban đầu là trống
                    )
                    self.db.session.add(new_result)
                    result_count += 1

            # Cập nhật tổng tiền cho phiếu chỉ định
            self.phieucddvyt_service.update(
                phieu_cd.pcd_ma, {"pcd_tongtien": total_price}
            )

            # Lưu tất cả thay đổi vào database
            self.db.session.commit()

            return {
                "success": True,
                "pcd_ma": phieu_cd.pcd_ma,
                "valid_dichvu_count": valid_dichvu_count,
                "result_count": result_count,
                "total_price": total_price,
                "message": "Tạo phiếu chỉ định và kết quả thành công",
            }

        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi tạo phiếu chỉ định và kết quả: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi tạo phiếu chỉ định và kết quả: {str(e)}")

    def get_results_with_service_info(self, pcd_ma: str) -> List[Dict[str, Any]]:
        """
        Trả về thông tin các dịch vụ có kết quả theo mã phiếu chỉ định
        Mỗi dịch vụ chỉ xuất hiện một lần trong kết quả

        Args:
            pcd_ma: Mã phiếu chỉ định dịch vụ y tế

        Returns:
            Danh sách các dict chứa thông tin dịch vụ và đơn giá
        """
        try:
            # Lấy danh sách duy nhất các dịch vụ liên quan đến phiếu chỉ định
            unique_services = (
                self.db.session.query(KetQua.dvyt_ma)
                .filter(KetQua.pcd_ma == pcd_ma)
                .distinct()
                .all()
            )

            # Danh sách kết quả trả về
            result_list = []
            # Dictionary để theo dõi các dịch vụ đã xử lý (đảm bảo không trùng lặp)
            processed_services = {}

            # Duyệt qua từng dịch vụ duy nhất
            for (dvyt_ma,) in unique_services:
                # Bỏ qua nếu dịch vụ này đã được xử lý
                if dvyt_ma in processed_services:
                    continue

                # Đánh dấu dịch vụ này đã được xử lý
                processed_services[dvyt_ma] = True

                # Lấy thông tin dịch vụ
                dich_vu = (
                    self.db.session.query(DichVuYTe)
                    .filter(DichVuYTe.dvyt_ma == dvyt_ma)
                    .first()
                )

                if not dich_vu:
                    continue

                # Lấy đơn giá dịch vụ
                price = self.dichvu_service.get_current_price(dvyt_ma) or 0

                # Thêm vào danh sách kết quả
                service_info = {
                    "dvyt_ma": dvyt_ma,
                    "dvyt_ten": dich_vu.dvyt_ten,
                    "dvyt_mota": dich_vu.dvyt_mota,
                    "don_gia": price,
                    "pcd_ma": pcd_ma,
                }

                result_list.append(service_info)

            return result_list
        except Exception as e:
            print(f"Lỗi khi lấy thông tin dịch vụ theo phiếu chỉ định: {str(e)}")
            if isinstance(e, ValueError):
                raise
            return []

    def update_result(
        self, pcd_ma: str, dvyt_ma: str, cs_ma: str, kq_ketqua: str
    ) -> Optional[Dict[str, Any]]:
        """
        Cập nhật kết quả cho một chỉ số cụ thể

        Args:
            pcd_ma: Mã phiếu chỉ định dịch vụ y tế
            dvyt_ma: Mã dịch vụ y tế
            cs_ma: Mã chỉ số
            kq_ketqua: Giá trị kết quả mới

        Returns:
            Dict chứa thông tin kết quả đã cập nhật hoặc None nếu không tìm thấy
        """
        try:
            # Tìm bản ghi kết quả theo khóa chính
            ket_qua = (
                self.db.session.query(KetQua)
                .filter(
                    KetQua.pcd_ma == pcd_ma,
                    KetQua.dvyt_ma == dvyt_ma,
                    KetQua.cs_ma == cs_ma,
                )
                .first()
            )

            if not ket_qua:
                raise ValueError(
                    f"Không tìm thấy kết quả với mã phiếu {pcd_ma}, "
                    f"dịch vụ {dvyt_ma}, chỉ số {cs_ma}"
                )

            # Cập nhật giá trị kết quả
            ket_qua.kq_ketqua = kq_ketqua

            # Lấy thông tin chỉ số để trả về
            chi_so = (
                self.db.session.query(ChiSo)
                .filter(ChiSo.dvyt_ma == dvyt_ma, ChiSo.cs_ma == cs_ma)
                .first()
            )

            # Lưu thay đổi vào cơ sở dữ liệu
            self.db.session.commit()

            # Tạo dictionary kết quả để trả về
            result = {
                "pcd_ma": pcd_ma,
                "dvyt_ma": dvyt_ma,
                "cs_ma": cs_ma,
                "kq_ketqua": kq_ketqua,
                "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "cs_info": {
                    "cs_ten": chi_so.cs_ten if chi_so else None,
                    "cs_donvi": chi_so.cs_donvi if chi_so else None,
                    "cs_mucbthuong": chi_so.cs_mucbthuong if chi_so else None,
                },
            }

            return result
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi cập nhật kết quả: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi cập nhật kết quả: {str(e)}")

    def batch_update_results(
        self, pcd_ma: str, results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Cập nhật nhiều kết quả cùng lúc và cập nhật ngày giờ thực hiện từ dữ liệu đầu vào

        Args:
            pcd_ma: Mã phiếu chỉ định dịch vụ y tế
            results: Danh sách các kết quả cần cập nhật và thông tin ngày giờ
                    Format: {
                      "pcd_ngay": "YYYY-MM-DD",  # Tùy chọn
                      "pcd_gio": "HH:MM:SS",     # Tùy chọn
                      "items": [                 # Bắt buộc
                        {"dvyt_ma": str, "cs_ma": str, "kq_ketqua": str},
                        ...
                      ]
                    }

        Returns:
            Dict chứa thông tin về số lượng kết quả đã cập nhật/thất bại
        """
        try:
            success_count = 0
            failed_count = 0
            failed_items = []

            # Lấy ngày giờ từ dữ liệu đầu vào nếu có, nếu không thì dùng ngày giờ hiện tại
            current_date = None
            current_time = None

            # Kiểm tra cấu trúc dữ liệu đầu vào
            items = results.get("items", [])

            # Nếu results không có cấu trúc mới, xử lý như cũ để tương thích ngược
            if not items and isinstance(results, list):
                items = results

            # Lấy ngày từ dữ liệu đầu vào
            if "pcd_ngay" in results:
                try:
                    current_date = datetime.strptime(
                        results["pcd_ngay"], "%Y-%m-%d"
                    ).date()
                except ValueError:
                    return {
                        "success": False,
                        "message": "Định dạng pcd_ngay không hợp lệ. Sử dụng YYYY-MM-DD",
                    }
            else:
                current_date = datetime.now().date()

            # Lấy giờ từ dữ liệu đầu vào
            if "pcd_gio" in results:
                try:
                    time_str = results["pcd_gio"]
                    # Hỗ trợ cả định dạng HH:MM và HH:MM:SS
                    if len(time_str.split(":")) == 2:
                        time_str += ":00"
                    current_time = datetime.strptime(time_str, "%H:%M:%S").time()
                except ValueError:
                    return {
                        "success": False,
                        "message": "Định dạng pcd_gio không hợp lệ. Sử dụng HH:MM:SS hoặc HH:MM",
                    }
            else:
                current_time = datetime.now().time()

            for result_item in items:
                try:
                    # Kiểm tra các trường bắt buộc
                    if not all(
                        key in result_item for key in ["dvyt_ma", "cs_ma", "kq_ketqua"]
                    ):
                        failed_count += 1
                        failed_items.append(
                            {"item": result_item, "error": "Thiếu trường bắt buộc"}
                        )
                        continue

                    dvyt_ma = result_item["dvyt_ma"]
                    cs_ma = result_item["cs_ma"]
                    kq_ketqua = result_item["kq_ketqua"]

                    # Tìm kết quả cần cập nhật
                    ket_qua = (
                        self.db.session.query(KetQua)
                        .filter(
                            KetQua.pcd_ma == pcd_ma,
                            KetQua.dvyt_ma == dvyt_ma,
                            KetQua.cs_ma == cs_ma,
                        )
                        .first()
                    )

                    if not ket_qua:
                        failed_count += 1
                        failed_items.append(
                            {
                                "item": result_item,
                                "error": f"Không tìm thấy kết quả với mã phiếu {pcd_ma}, "
                                f"dịch vụ {dvyt_ma}, chỉ số {cs_ma}",
                            }
                        )
                        continue

                    # Cập nhật kết quả
                    ket_qua.kq_ketqua = kq_ketqua
                    success_count += 1

                except Exception as item_error:
                    failed_count += 1
                    failed_items.append({"item": result_item, "error": str(item_error)})

            # Nếu có ít nhất một cập nhật thành công
            if success_count > 0:
                # Cập nhật ngày và giờ cho phiếu chỉ định
                phieu_cd = self.phieucddvyt_service.get_by_id(pcd_ma)
                if phieu_cd:
                    # Cập nhật ngày và giờ thực hiện
                    print(
                        f"Cập nhật ngày {current_date} và giờ {current_time} cho phiếu {pcd_ma}"
                    )
                    self.phieucddvyt_service.update(
                        pcd_ma, {"pcd_ngay": current_date, "pcd_gio": current_time}
                    )

                # Lưu tất cả thay đổi
                self.db.session.commit()

            return {
                "success": True,
                "pcd_ma": pcd_ma,
                "total": len(items),
                "success_count": success_count,
                "failed_count": failed_count,
                "failed_items": failed_items,
                "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "pcd_ngay": current_date.strftime("%Y-%m-%d") if current_date else None,
                "pcd_gio": current_time.strftime("%H:%M:%S") if current_time else None,
            }
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi cập nhật hàng loạt kết quả: {str(e)}")
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Lỗi khi cập nhật hàng loạt kết quả: {str(e)}")

    def get_detailed_results_by_pcd(self, pcd_ma: str) -> List[Dict[str, Any]]:
        """
        Trả về kết quả chi tiết theo chỉ số của tất cả dịch vụ cho một phiếu chỉ định

        Args:
            pcd_ma: Mã phiếu chỉ định dịch vụ y tế

        Returns:
            Danh sách các dịch vụ và kết quả các chỉ số của chúng
        """
        try:
            # Lấy danh sách duy nhất các dịch vụ liên quan đến phiếu chỉ định
            unique_services = (
                self.db.session.query(KetQua.dvyt_ma)
                .filter(KetQua.pcd_ma == pcd_ma)
                .distinct()
                .all()
            )

            # Danh sách kết quả trả về
            result_list = []

            # Lấy thông tin phiếu chỉ định
            phieu_cd = self.phieucddvyt_service.get_by_id(pcd_ma)
            phieu_info = None
            if phieu_cd:
                phieu_info = {
                    "pcd_ma": phieu_cd.pcd_ma,
                    "pcd_ngay": (
                        phieu_cd.pcd_ngay.strftime("%Y-%m-%d")
                        if phieu_cd.pcd_ngay
                        else None
                    ),
                    "pcd_gio": (
                        phieu_cd.pcd_gio.strftime("%H:%M:%S")
                        if phieu_cd.pcd_gio
                        else None
                    ),
                    "pcd_tongtien": phieu_cd.pcd_tongtien,
                }

            # Duyệt qua từng dịch vụ
            for (dvyt_ma,) in unique_services:
                # Lấy thông tin dịch vụ
                dich_vu = (
                    self.db.session.query(DichVuYTe)
                    .filter(DichVuYTe.dvyt_ma == dvyt_ma)
                    .first()
                )

                if not dich_vu:
                    continue

                # Lấy đơn giá dịch vụ
                price = self.dichvu_service.get_current_price(dvyt_ma) or 0

                # Tạo thông tin dịch vụ
                service_info = {
                    "dvyt_ma": dvyt_ma,
                    "dvyt_ten": dich_vu.dvyt_ten,
                    "dvyt_mota": dich_vu.dvyt_mota,
                    "don_gia": price,
                    "chi_so": [],  # Danh sách chỉ số và kết quả
                }

                # Lấy tất cả kết quả của dịch vụ này trong phiếu chỉ định
                ket_qua_list = (
                    self.db.session.query(KetQua)
                    .filter(KetQua.pcd_ma == pcd_ma, KetQua.dvyt_ma == dvyt_ma)
                    .all()
                )

                # Thêm các chỉ số và kết quả
                for kq in ket_qua_list:
                    # Lấy thông tin chỉ số
                    chi_so = (
                        self.db.session.query(ChiSo)
                        .filter(ChiSo.dvyt_ma == dvyt_ma, ChiSo.cs_ma == kq.cs_ma)
                        .first()
                    )

                    if not chi_so:
                        continue

                    # Thêm thông tin chỉ số và kết quả
                    chi_so_info = {
                        "cs_ma": chi_so.cs_ma,
                        "cs_ten": chi_so.cs_ten,
                        "cs_donvi": chi_so.cs_donvi,
                        "cs_mucbthuong": chi_so.cs_mucbthuong,
                        "kq_ketqua": kq.kq_ketqua,
                    }

                    service_info["chi_so"].append(chi_so_info)

                # Thêm dịch vụ vào danh sách kết quả
                result_list.append(service_info)

            # Trả về kết quả kèm thông tin phiếu
            return {"phieu_info": phieu_info, "dich_vu": result_list}
        except Exception as e:
            print(f"Lỗi khi lấy kết quả theo dịch vụ và chỉ số: {str(e)}")
            if isinstance(e, ValueError):
                raise
            return {"phieu_info": None, "dich_vu": []}

    def get_detailed_results_by_phieukham(
        self, pk_ma: int, pk_ngaykham: date
    ) -> Dict[str, Any]:
        """
        Trả về kết quả chi tiết theo chỉ số của tất cả dịch vụ cho một phiếu khám

        Args:
            pk_ma: Mã phiếu khám
            pk_ngaykham: Ngày khám

        Returns:
            Dict chứa thông tin phiếu khám và danh sách dịch vụ (có thể rỗng)
        """
        try:
            # Lấy thông tin phiếu khám
            phieu_kham = self.phieukham_service.get_by_id(pk_ma, pk_ngaykham)
            
            if not phieu_kham:
                return {
                    "phieu_info": None,
                    "dich_vu": [],
                    "message": "Không tìm thấy phiếu khám"
                }
            
            # Lấy pcd_ma từ phiếu khám
            pcd_ma = None
            if isinstance(phieu_kham, dict):
                pcd_ma = phieu_kham.get('pcd_ma')
            else:
                pcd_ma = getattr(phieu_kham, 'pcd_ma', None)
            
            # Nếu chưa có phiếu chỉ định dịch vụ
            if not pcd_ma:
                return {
                    "phieu_info": {
                        "pk_ma": pk_ma,
                        "pk_ngaykham": pk_ngaykham.strftime("%Y-%m-%d") if isinstance(pk_ngaykham, date) else pk_ngaykham,
                        "pcd_ma": None,
                        "status": "Chưa có phiếu chỉ định dịch vụ"
                    },
                    "dich_vu": [],
                    "message": "Phiếu khám chưa có phiếu chỉ định dịch vụ y tế"
                }
            
            # Lấy kết quả chi tiết nếu có phiếu chỉ định
            detailed_results = self.get_detailed_results_by_pcd(pcd_ma)
            
            # Thêm thông tin phiếu khám vào kết quả
            if isinstance(detailed_results, dict):
                detailed_results["phieu_kham_info"] = {
                    "pk_ma": pk_ma,
                    "pk_ngaykham": pk_ngaykham.strftime("%Y-%m-%d") if isinstance(pk_ngaykham, date) else pk_ngaykham,
                    "pcd_ma": pcd_ma
                }
                return detailed_results
            
            return {
                "phieu_info": None,
                "dich_vu": [],
                "message": "Lỗi khi lấy kết quả chi tiết"
            }
            
        except Exception as e:
            print(f"Lỗi khi lấy kết quả theo phiếu khám: {str(e)}")
            return {
                "phieu_info": None,
                "dich_vu": [],
                "message": f"Lỗi hệ thống: {str(e)}"
            }
