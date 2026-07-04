import json
import os
from typing import List

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

from app.config import Config, resolve_project_path
from app.Model import Benh, ChanDoan
from app.Services.Benh_service import BenhService


class ChanDoanService:
    def __init__(self, db_session):
        self.db_session = db_session
        self.benh_service = BenhService(db_session)

    def get_chan_doan_by_prescription(self, tt_matthuoc: str) -> List[Benh]:
        """Lay danh sach chan doan theo ma toa thuoc."""
        try:
            diagnoses = (
                self.db_session.query(ChanDoan)
                .filter(ChanDoan.tt_matthuoc == tt_matthuoc)
                .all()
            )
            diseases = []
            for diagnosis in diagnoses:
                b_ma = diagnosis.b_ma
                benh_dict = self.benh_service.get_by_id(b_ma)
                if benh_dict:
                    benh_obj = Benh(
                        b_ma=benh_dict["b_ma"],
                        b_ten=benh_dict["b_ten"],
                        b_mota=benh_dict.get("b_mota"),
                    )
                    diseases.append(benh_obj)
            return diseases
        except Exception as e:
            print(f"Loi khi lay chan doan theo toa thuoc: {str(e)}")
            return []

    def diagnose_disease(
        self,
        symptoms_input,
        top_k=5,
        assits_folder=None,
    ):
        """
        symptoms_input: list cac trieu chung.
        Tra ve top_k ma benh du doan va do tuong tu.
        """

        assits_folder = resolve_project_path(
            assits_folder or Config.ASSITS_DIR,
            default_base_dir=Config.BACKEND_DIR,
        )
        print(f"Using diagnosis assets from: {assits_folder}")

        tfidf_path = os.path.join(assits_folder, "tfidf_transformer_full.pkl")
        X_tfidf_path = os.path.join(assits_folder, "X_tfidf_full.npy")
        feature_columns_path = os.path.join(
            assits_folder, "feature_matrix_full_columns.json"
        )
        disease_weights_path = os.path.join(assits_folder, "disease_weights_full.json")
        mapping_path = os.path.join(assits_folder, "symptom_mapping.json")
        feature_matrix_csv = os.path.join(assits_folder, "feature_matrix_full.csv")

        required_paths = [
            tfidf_path,
            X_tfidf_path,
            feature_columns_path,
            disease_weights_path,
            mapping_path,
            feature_matrix_csv,
        ]
        missing_paths = [path for path in required_paths if not os.path.exists(path)]
        if missing_paths:
            raise FileNotFoundError(
                "Missing diagnosis assets in "
                f"{assits_folder}: {', '.join(missing_paths)}"
            )

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

        input_en = []
        for sym in symptoms_input:
            sym_norm = sym.strip().lower()
            if sym_norm in vi_to_en:
                input_en.append(vi_to_en[sym_norm])
            elif sym_norm in feature_columns:
                input_en.append(sym_norm)

        patient_vec = np.zeros(len(feature_columns))
        for idx, col in enumerate(feature_columns):
            if col in input_en:
                patient_vec[idx] = 1

        patient_tfidf = tfidf.transform([patient_vec])
        sims = cosine_similarity(patient_tfidf, X_tfidf)[0]
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
