class PhieuKhamStatus:
    """Constants for PhieuKham status values"""

    # Trạng thái phiếu khám
    CHO_KHAM = "Chờ khám"  # Vừa tạo, chờ bác sĩ khám
    DANG_KHAM = "Đang khám"  # Bác sĩ đang thực hiện khám
    CHO_XET_NGHIEM = "Chờ xét nghiệm"  # Cần làm xét nghiệm
    CHO_KET_QUA = "Chờ kết quả"  # Đã làm xét nghiệm, chờ kết quả
    DA_CO_KET_QUA = "Đã có kết quả"  # Đã có kết quả xét nghiệm
    DA_KHAM_XONG = "Đã khám xong"  # Hoàn thành khám, có thể kê toa
    DA_KEE_TOA = "Đã kê toa"  # Đã kê toa thuốc
    DA_THANH_TOAN = "Đã thanh toán"  # Đã thanh toán
    DA_HUY = "Đã hủy"  # Hủy phiếu khám

    @classmethod
    def get_all_statuses(cls):
        """Get all available status values"""
        return [
            cls.CHO_KHAM,
            cls.DANG_KHAM,
            cls.CHO_XET_NGHIEM,
            cls.CHO_KET_QUA,
            cls.DA_CO_KET_QUA,
            cls.DA_KHAM_XONG,
            cls.DA_KEE_TOA,
            cls.DA_THANH_TOAN,
            cls.DA_HUY,
        ]

    @classmethod
    def get_active_statuses(cls):
        """Get statuses that represent active examinations"""
        return [
            cls.CHO_KHAM,
            cls.DANG_KHAM,
            cls.CHO_XET_NGHIEM,
            cls.CHO_KET_QUA,
            cls.DA_CO_KET_QUA,
            cls.DA_KHAM_XONG,
        ]

    @classmethod
    def get_waiting_statuses(cls):
        """Get statuses that represent waiting states"""
        return [cls.CHO_KHAM, cls.CHO_XET_NGHIEM, cls.CHO_KET_QUA]

    @classmethod
    def get_in_progress_statuses(cls):
        """Get statuses that represent work in progress"""
        return [cls.DANG_KHAM, cls.DA_CO_KET_QUA, cls.DA_KHAM_XONG]

    @classmethod
    def get_completed_statuses(cls):
        """Get statuses that represent completed examinations"""
        return [cls.DA_KEE_TOA, cls.DA_THANH_TOAN]

    @classmethod
    def get_cancelled_statuses(cls):
        """Get statuses that represent cancelled examinations"""
        return [cls.DA_HUY]

    @classmethod
    def get_billable_statuses(cls):
        """Get statuses that can be billed"""
        return [cls.DA_KHAM_XONG, cls.DA_KEE_TOA, cls.DA_THANH_TOAN]

    @classmethod
    def is_valid_status(cls, status: str) -> bool:
        """Check if status is valid"""
        return status in cls.get_all_statuses()

    @classmethod
    def can_update_to(cls, current_status: str, new_status: str) -> bool:
        """Check if status transition is allowed"""
        # Define allowed transitions
        allowed_transitions = {
            cls.CHO_KHAM: [
                cls.DANG_KHAM,
                cls.CHO_XET_NGHIEM,
                cls.DA_KHAM_XONG,
                cls.DA_HUY,
            ],
            cls.DANG_KHAM: [cls.CHO_XET_NGHIEM, cls.DA_KHAM_XONG, cls.DA_HUY],
            cls.CHO_XET_NGHIEM: [
                cls.CHO_KET_QUA,
                cls.DA_KHAM_XONG,  # Không cần xét nghiệm
                cls.DA_HUY,
            ],
            cls.CHO_KET_QUA: [cls.DA_CO_KET_QUA, cls.DA_HUY],
            cls.DA_CO_KET_QUA: [
                cls.DA_KHAM_XONG,
                cls.CHO_XET_NGHIEM,  # Cần xét nghiệm thêm
            ],
            cls.DA_KHAM_XONG: [cls.DA_KEE_TOA, cls.DA_THANH_TOAN],  # Không cần kê toa
            cls.DA_KEE_TOA: [cls.DA_THANH_TOAN],
            cls.DA_THANH_TOAN: [],  # Final state
            cls.DA_HUY: [],  # Final state
        }

        return new_status in allowed_transitions.get(current_status, [])

    @classmethod
    def get_next_possible_statuses(cls, current_status: str):
        """Get list of possible next statuses"""
        transitions = {
            cls.CHO_KHAM: [cls.DANG_KHAM, cls.DA_HUY],
            cls.DANG_KHAM: [cls.CHO_XET_NGHIEM, cls.DA_KHAM_XONG, cls.DA_HUY],
            cls.CHO_XET_NGHIEM: [cls.CHO_KET_QUA, cls.DA_KHAM_XONG, cls.DA_HUY],
            cls.CHO_KET_QUA: [cls.DA_CO_KET_QUA, cls.DA_HUY],
            cls.DA_CO_KET_QUA: [cls.DA_KHAM_XONG, cls.CHO_XET_NGHIEM],
            cls.DA_KHAM_XONG: [cls.DA_KEE_TOA, cls.DA_THANH_TOAN],
            cls.DA_KEE_TOA: [cls.DA_THANH_TOAN],
            cls.DA_THANH_TOAN: [],
            cls.DA_HUY: [],
        }

        return transitions.get(current_status, [])

    @classmethod
    def get_status_description(cls, status: str) -> str:
        """Get description for status"""
        descriptions = {
            cls.CHO_KHAM: "Bệnh nhân đang chờ được khám",
            cls.DANG_KHAM: "Bác sĩ đang thực hiện khám bệnh",
            cls.CHO_XET_NGHIEM: "Cần thực hiện các xét nghiệm",
            cls.CHO_KET_QUA: "Đã làm xét nghiệm, chờ kết quả",
            cls.DA_CO_KET_QUA: "Đã có kết quả xét nghiệm",
            cls.DA_KHAM_XONG: "Đã hoàn thành khám bệnh",
            cls.DA_KEE_TOA: "Đã kê đơn thuốc",
            cls.DA_THANH_TOAN: "Đã hoàn thành thanh toán",
            cls.DA_HUY: "Phiếu khám đã bị hủy",
        }

        return descriptions.get(status, "Không xác định")

    @classmethod
    def get_status_color(cls, status: str) -> str:
        """Get color code for status (for UI)"""
        colors = {
            cls.CHO_KHAM: "#ffc107",  # Warning - Yellow
            cls.DANG_KHAM: "#17a2b8",  # Info - Blue
            cls.CHO_XET_NGHIEM: "#fd7e14",  # Warning - Orange
            cls.CHO_KET_QUA: "#6f42c1",  # Secondary - Purple
            cls.DA_CO_KET_QUA: "#20c997",  # Success - Teal
            cls.DA_KHAM_XONG: "#28a745",  # Success - Green
            cls.DA_KEE_TOA: "#007bff",  # Primary - Blue
            cls.DA_THANH_TOAN: "#28a745",  # Success - Green
            cls.DA_HUY: "#dc3545",  # Danger - Red
        }

        return colors.get(status, "#6c757d")  # Default - Gray
