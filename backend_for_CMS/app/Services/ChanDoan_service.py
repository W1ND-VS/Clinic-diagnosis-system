from app.Services.Benh_service import BenhService
from app.Model import Benh, ChanDoan
from typing import List
import numpy as np
import joblib
from sklearn.metrics.pairwise import cosine_similarity
import json
import os
import pandas as pd


class ChanDoanService:
    def __init__(self, db_session):
        self.db_session = db_session
        self.benh_service = BenhService(db_session)

    def get_chan_doan_by_prescription(self, tt_matthuoc: str) -> List[Benh]:
        """Lấy danh sách chẩn đoán theo mã toa thuốc"""
        try:
            diagnoses = (
                self.db_session.query(ChanDoan)
                .filter(ChanDoan.tt_matthuoc == tt_matthuoc)
                .all()
            )
            Diseases = []
            for diagnosis in diagnoses:
                b_ma = diagnosis.b_ma
                benh_dict = self.benh_service.get_by_id(b_ma)
                if benh_dict:
                    benh_obj = Benh(
                        b_ma=benh_dict["b_ma"],
                        b_ten=benh_dict["b_ten"],
                        b_mota=benh_dict.get("b_mota"),
                    )
                    Diseases.append(benh_obj)
            return Diseases
        except Exception as e:
            print(f"Lỗi khi lấy chẩn đoán theo toa thuốc: {str(e)}")
            return []

    def diagnose_disease(
        self,
        symptoms_input,
        top_k=5,
        assits_folder="d:/CTU/Nien luan nganh/Clinic_Management_System/backend_for_CMS/app/assits",
    ):
        """
        symptoms_input: list các triệu chứng (có thể tiếng Việt hoặc tiếng Anh)
        Trả về top_k mã bệnh dự đoán và độ tương tự (có trọng số)
        """

        # Đường dẫn các file
        tfidf_path = os.path.join(assits_folder, "tfidf_transformer_full.pkl")
        X_tfidf_path = os.path.join(assits_folder, "X_tfidf_full.npy")
        feature_columns_path = os.path.join(
            assits_folder, "feature_matrix_full_columns.json"
        )
        disease_weights_path = os.path.join(assits_folder, "disease_weights_full.json")
        mapping_path = os.path.join(assits_folder, "symptom_mapping.json")
        feature_matrix_csv = os.path.join(assits_folder, "feature_matrix_full.csv")

        # Load các file đã lưu
        tfidf = joblib.load(tfidf_path)
        X_tfidf = np.load(X_tfidf_path)
        with open(feature_columns_path, "r", encoding="utf-8") as f:
            feature_columns = json.load(f)
        with open(disease_weights_path, "r", encoding="utf-8") as f:
            disease_weights = json.load(f)
        with open(mapping_path, "r", encoding="utf-8") as f:
            mapping = json.load(f)
        vi_to_en = {vi.strip().lower(): en for en, vi in mapping.items()}
        df = pd.read_csv(feature_matrix_csv)
        disease_labels = np.array(df["Mã bệnh"])

        # Chuẩn hóa input: chuyển tiếng Việt sang tiếng Anh nếu có
        input_en = []
        for sym in symptoms_input:
            sym_norm = sym.strip().lower()
            if sym_norm in vi_to_en:
                input_en.append(vi_to_en[sym_norm])
            elif sym_norm in feature_columns:
                input_en.append(sym_norm)
        # Tạo vector 1/0
        patient_vec = np.zeros(len(feature_columns))
        for idx, col in enumerate(feature_columns):
            if col in input_en:
                patient_vec[idx] = 1
        # TF-IDF
        patient_tfidf = tfidf.transform([patient_vec])
        # Cosine similarity
        sims = cosine_similarity(patient_tfidf, X_tfidf)[0]
        # Weighted similarity
        sims_weighted = np.array(
            [
                sims[i] * disease_weights.get(str(disease_labels[i]), 1.0)
                for i in range(len(disease_labels))
            ]
        )
        top_k_idx = sims_weighted.argsort()[::-1][:top_k]
        results = [
            (disease_labels[idx], float(sims_weighted[idx])) for idx in top_k_idx
        ]
        return results
