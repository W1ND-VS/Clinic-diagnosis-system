from flask import Flask
from app.extensions import db, migrate, jwt
from app.config import Config
from app.Controller.BacSi_route import bacsi_bp
from app.Controller.auth import auth_bp
from app.Controller.BenhNhan_route import benhnhan
from app.Controller.TiepTan_route import tieptan_bp
from app.Controller.TaiNguyen_route import resource_bp
from app.Controller.TrieuChung_route import trieuchung_bp
from app.Controller.PhieuHen_route import phieuhen_bp
from app.Controller.ChuyenKhoa_route import chuyenkhoa_bp
from app.Controller.PhieuKham_route import phieukham_bp
from app.Controller.DichVu_route import dichvu_bp
from app.Controller.KetQua_route import ketqua_bp
from app.Controller.Thuoc_route import thuoc_bp
from app.Controller.LichLamViec_route import lichlv_bp
from app.Controller.DangKyLichLam_route import dangky_bp
from app.Controller.PhieuCDDVYT_route import phieu_cddvyt_bp
from app.Controller.BaoCao_route import baocao_bp
from app.Controller.ToaThuoc_route import toathuoc_bp
from app.Controller.Benh_route import benh_bp
from app.Controller.ChanDoan_route import chandoan_bp
from flask_cors import CORS


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://localhost:5174","http://localhost:5175","http://localhost:5176","http://localhost:5177"]}})
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    app.register_blueprint(bacsi_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(benhnhan)
    app.register_blueprint(resource_bp)
    app.register_blueprint(tieptan_bp)
    app.register_blueprint(trieuchung_bp)
    app.register_blueprint(phieuhen_bp)
    app.register_blueprint(chuyenkhoa_bp)
    app.register_blueprint(phieukham_bp)
    app.register_blueprint(dichvu_bp)
    app.register_blueprint(ketqua_bp)
    app.register_blueprint(thuoc_bp)
    app.register_blueprint(lichlv_bp)
    app.register_blueprint(dangky_bp)
    app.register_blueprint(phieu_cddvyt_bp)
    app.register_blueprint(baocao_bp)
    app.register_blueprint(toathuoc_bp)
    app.register_blueprint(benh_bp)
    app.register_blueprint(chandoan_bp)
    app.logger.info("Flask app initialized with CORS and Blueprints")
    return app
