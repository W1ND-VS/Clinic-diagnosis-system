import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()  # Tải biến môi trường từ file .env nếu có


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "mysql+pymysql://root:@localhost:3307/db_clinic"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY", "f7lL5JcQoNZaEOUrMKWfRMkgFtMBMpOJHtwp4Ap08iQ")
    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY", "f7lL5JcQoNZaEOUrMKWfRMkgFtMBMpOJHtwp4Ap08iQ"
    )  # Dùng giá trị tĩnh từ .env
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)
