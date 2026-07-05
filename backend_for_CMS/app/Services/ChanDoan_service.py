import csv
import json
import os
from typing import List

import joblib
import numpy as np

from app.config import Config, resolve_project_path
from app.Model import Benh, ChanDoan
from app.Services.Benh_service import BenhService


class ChanDoanService:
    def __init__(self, db_session):
        self.db_session = db_session
        self.benh_service = BenhService(db_session)
        self._diagnosis_assets_cache = {}

    def _load_disease_labels(self, feature_matrix_csv: str) -> np.ndarray:
        disease_labels = []
        with open(feature_matrix_csv, "r", encoding="utf-8-sig", newline="") as f:
            reader = csv.reader(f)
            next(reader, None)
            for row in reader:
                if row:
                    disease_labels.append(row[0])
        return np.array(disease_labels, dtype=object)

    def _load_diagnosis_assets(self, assits_folder: str):
        cached_assets = self._diagnosis_assets_cache.get(assits_folder)
        if cached_assets:
            return cached_assets

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
        X_tfidf = np.load(X_tfidf_path, mmap_mode="r")
        with open(feature_columns_path, "r", encoding="utf-8") as f:
            feature_columns = json.load(f)
        with open(disease_weights_path, "r", encoding="utf-8") as f:
            disease_weights = json.load(f)
        with open(mapping_path, "r", encoding="utf-8") as f:
            mapping = json.load(f)

        cached_assets = {
            "tfidf": tfidf,
            "X_tfidf": X_tfidf,
            "feature_columns": feature_columns,
            "disease_weights": disease_weights,
            "vi_to_en": {vi.strip().lower(): en for en, vi in mapping.items()},
            "disease_labels": self._load_disease_labels(feature_matrix_csv),
        }
        self._diagnosis_assets_cache[assits_folder] = cached_assets
        return cached_assets

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
        assets = self._load_diagnosis_assets(assits_folder)
        tfidf = assets["tfidf"]
        X_tfidf = assets["X_tfidf"]
        feature_columns = assets["feature_columns"]
        disease_weights = assets["disease_weights"]
        vi_to_en = assets["vi_to_en"]
        disease_labels = assets["disease_labels"]

        input_en = []
        for sym in symptoms_input:
            sym_norm = sym.strip().lower()
            if sym_norm in vi_to_en:
                input_en.append(vi_to_en[sym_norm])
            elif sym_norm in feature_columns:
                input_en.append(sym_norm)

        patient_vec = np.zeros(len(feature_columns), dtype=np.uint8)
        for idx, col in enumerate(feature_columns):
            if col in input_en:
                patient_vec[idx] = 1

        patient_tfidf = tfidf.transform([patient_vec])

        # Keep the large TF-IDF matrix memory-mapped and avoid pairwise helpers
        # that may allocate extra buffers large enough to trigger OOM kills.
        sims = np.asarray(X_tfidf @ patient_tfidf.toarray().ravel()).ravel()
        sims_weighted = np.array(
            [
                sims[i] * disease_weights.get(str(disease_labels[i]), 1.0)
                for i in range(len(disease_labels))
            ]
        )
        top_k_idx = sims_weighted.argsort()[::-1][: min(top_k, len(disease_labels))]
        results = [
            (disease_labels[idx], float(sims_weighted[idx])) for idx in top_k_idx
        ]
        return results

        """
        if missing_paths:
            print(f"⚠️ Missing required diagnosis assets: {', '.join(missing_paths)}")
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
        """
