import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()  # Tải biến môi trường từ file .env nếu có


def _build_database_uri() -> str:
    database_url = os.getenv("DATABASE_URL") or os.getenv("DATABASE_URI")
    if database_url:
        return database_url

    mysql_host = os.getenv("MYSQLHOST") or os.getenv("MYSQL_HOST")
    mysql_port = os.getenv("MYSQLPORT") or os.getenv("MYSQL_PORT")
    mysql_user = os.getenv("MYSQLUSER") or os.getenv("MYSQL_USER")
    mysql_password = os.getenv("MYSQLPASSWORD") or os.getenv("MYSQL_PASSWORD")
    mysql_database = os.getenv("MYSQLDATABASE") or os.getenv("MYSQL_DATABASE")

    if mysql_host and mysql_user and mysql_database:
        port_part = f":{mysql_port}" if mysql_port else ""
        password_part = f":{mysql_password}" if mysql_password else ""
        return (
            f"mysql+pymysql://{mysql_user}{password_part}@"
            f"{mysql_host}{port_part}/{mysql_database}"
        )

    return "mysql+pymysql://root:@localhost:3307/db_clinic"


class Config:
    SQLALCHEMY_DATABASE_URI = _build_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY", "f7lL5JcQoNZaEOUrMKWfRMkgFtMBMpOJHtwp4Ap08iQ")
    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY", "f7lL5JcQoNZaEOUrMKWfRMkgFtMBMpOJHtwp4Ap08iQ"
    )  # Dùng giá trị tĩnh từ .env
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)
