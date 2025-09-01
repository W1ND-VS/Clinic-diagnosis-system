class PhieuHenStatus:
    """Constants for PhieuHen status values"""

    DANG_CHO = "Đang chờ"  # Vừa tạo, chờ xác nhận
    DA_XAC_NHAN = "Đã xác nhận"  # Đã xác nhận cuộc hẹn
    DA_KHAM = "Đã khám"  # Đã thực hiện khám
    DA_HUY = "Đã hủy"  # Hủy cuộc hẹn
    KHONG_DEN = "Không đến"  # Bệnh nhân không đến

    @classmethod
    def get_all_statuses(cls):
        """Get all available status values"""
        return [cls.DANG_CHO, cls.DA_XAC_NHAN, cls.DA_KHAM, cls.DA_HUY, cls.KHONG_DEN]

    @classmethod
    def get_active_statuses(cls):
        """Get statuses that represent active appointments"""
        return [cls.DANG_CHO, cls.DA_XAC_NHAN]

    @classmethod
    def get_completed_statuses(cls):
        """Get statuses that represent completed appointments"""
        return [cls.DA_KHAM]

    @classmethod
    def get_cancelled_statuses(cls):
        """Get statuses that represent cancelled appointments"""
        return [cls.DA_HUY, cls.KHONG_DEN]

    @classmethod
    def is_valid_status(cls, status: str) -> bool:
        """Check if status is valid"""
        return status in cls.get_all_statuses()

    @classmethod
    def can_update_to(cls, current_status: str, new_status: str) -> bool:
        """Check if status transition is allowed"""
        allowed_transitions = {
            cls.DANG_CHO: [cls.DA_XAC_NHAN, cls.DA_HUY],
            cls.DA_XAC_NHAN: [cls.DA_KHAM, cls.DA_HUY, cls.KHONG_DEN],
            cls.DA_KHAM: [],  # Final state
            cls.DA_HUY: [],  # Final state
            cls.KHONG_DEN: [],  # Final state
        }

        return new_status in allowed_transitions.get(current_status, [])
