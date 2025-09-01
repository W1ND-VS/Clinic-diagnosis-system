from app.Model import BacSi, TiepTan, BenhNhan
from datetime import timedelta
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity


class AuthService:
    def login_bacsi(username: str, password: str):
        bac_si = BacSi.query.filter_by(nv_ma=username).first()
        if not bac_si or not bac_si.check_password(password) or bac_si.ck_ma == "CK13":
            return None
        access_token = create_access_token(
            identity=bac_si.nv_ma,  # Truyền trực tiếp string
            additional_claims={"role": "bacsi"},  # Thêm các claim khác
            expires_delta=timedelta(hours=2),
        )
        return {"access_token": access_token, "user_info": bac_si.to_dict()}

    def login_bacsi_ck13(username: str, password: str):
        bac_si = BacSi.query.filter_by(nv_ma=username).first()
        if not bac_si or not bac_si.check_password(password) or bac_si.ck_ma != "CK13":
            return None
        access_token = create_access_token(
            identity=bac_si.nv_ma,  # Truyền trực tiếp string
            additional_claims={"role": "bacsi_ck13"},  # Thêm các claim khác
            expires_delta=timedelta(hours=2),
        )
        return {"access_token": access_token, "user_info": bac_si.to_dict()}

    def login_tieptan(username: str, password: str):
        tiep_tan = TiepTan.query.filter_by(nv_ma=username).first()
        if not tiep_tan or not tiep_tan.check_password(password):
            return None
        access_token = create_access_token(
            identity=tiep_tan.nv_ma,  # Truyền trực tiếp string
            additional_claims={"role": "tieptan"},  # Thêm các claim khác
            expires_delta=timedelta(hours=2),
        )
        return {"access_token": access_token, "user_info": tiep_tan.to_dict()}

    def login_admin(username: str, password: str):
        """
        Xác thực đăng nhập cho admin với thông tin hard-coded

        Args:
            username: Tên đăng nhập của admin
            password: Mật khẩu của admin

        Returns:
            Dict với access token và thông tin admin nếu đăng nhập thành công, None nếu thất bại
        """
        # Hard-coded admin credentials
        ADMIN_USERNAME = "manager"
        ADMIN_PASSWORD = "11111111"  # Trong thực tế nên dùng mật khẩu mạnh hơn

        # Kiểm tra thông tin đăng nhập
        if username != ADMIN_USERNAME or password != ADMIN_PASSWORD:
            return None

        # Tạo access token với role admin
        access_token = create_access_token(
            identity=username,
            additional_claims={"role": "admin"},
            expires_delta=timedelta(hours=4),  # Token có thời hạn dài hơn
        )

        # Thông tin admin
        admin_info = {
            "nv_ma": username,
            "ten": "Quản trị viên hệ thống",
            "email": "admin@clinic.com",
        }

        return {"access_token": access_token, "user_info": admin_info}

    def login_benhnhan(username: str, password: str):
        """
        Đăng nhập cho bệnh nhân bằng mã bệnh nhân (bn_ma) và mật khẩu.
        """
        benh_nhan = BenhNhan.query.filter_by(bn_sdt=username).first()
        if not benh_nhan or not benh_nhan.check_password(password):
            return None
        access_token = create_access_token(
            identity=benh_nhan.bn_ma,
            additional_claims={"role": "benhnhan"},
            expires_delta=timedelta(hours=2),
        )
        return {"access_token": access_token, "user_info": benh_nhan.to_dict()}
