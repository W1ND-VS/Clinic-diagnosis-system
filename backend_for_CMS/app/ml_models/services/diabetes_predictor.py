import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
from ..utils.model_loader import model_loader


class DiabetesPredictor:
    def __init__(self):
        self.model = None
        self.use_fallback = False
        self._load_model()

    def _load_model(self):
        """Load diabetes prediction model"""
        try:
            self.model = model_loader.load_model("diabetes_rf_pipeline_v4.pkl")
            if self.model:
                print("✅ Diabetes prediction model loaded successfully")
                self.use_fallback = False
            else:
                print("⚠️ Failed to load diabetes prediction model, using fallback")
                self.use_fallback = True
        except Exception as e:
            print(f"⚠️ Error loading diabetes model: {str(e)}")
            print("🔄 Using fallback prediction logic")
            self.use_fallback = True

    def _prepare_input_data(self, form_data: dict) -> Optional[pd.DataFrame]:
        """
        Chuẩn hóa dữ liệu đầu vào: chỉ lấy đúng các feature model cần, tính BMI nếu cần.
        """
        try:
            # Tính BMI nếu chưa có
            bmi = form_data.get("bmi")
            if bmi is None:
                height = form_data.get("height")
                weight = form_data.get("weight")
                if height and weight:
                    bmi = float(weight) / ((float(height) / 100) ** 2)
                else:
                    bmi = 25.0

            # One-hot cho gender
            gender = str(form_data.get("gender", "")).lower()
            gender_Female = 1 if gender == "female" else 0
            gender_Male = 1 if gender == "male" else 0

            # One-hot cho smoking_history
            smoking = form_data.get("smoking_history", "never")
            smoking_history_current = 1 if smoking == "current" else 0
            smoking_history_non_smoker = 1 if smoking in ["never", "non-smoker"] else 0
            smoking_history_past_smoker = 1 if smoking == "past_smoker" else 0

            row = {
                "age": form_data.get("age", 50),
                "hypertension": int(form_data.get("hypertension", 0)),
                "heart_disease": int(form_data.get("heart_disease", 0)),
                "bmi": float(bmi),
                "HbA1c_level": float(form_data.get("HbA1c_level", 5.5)),
                "blood_glucose_level": float(form_data.get("blood_glucose_level", 120)),
                "gender_Female": gender_Female,
                "gender_Male": gender_Male,
                "smoking_history_current": smoking_history_current,
                "smoking_history_non-smoker": smoking_history_non_smoker,
                "smoking_history_past_smoker": smoking_history_past_smoker,
            }

            columns = [
                "age",
                "hypertension",
                "heart_disease",
                "bmi",
                "HbA1c_level",
                "blood_glucose_level",
                "gender_Female",
                "gender_Male",
                "smoking_history_current",
                "smoking_history_non-smoker",
                "smoking_history_past_smoker",
            ]
            return pd.DataFrame([row], columns=columns)
        except Exception as e:
            print(f"❌ Error preparing input data: {str(e)}")
            return None

    def predict_diabetes(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dự đoán khả năng mắc bệnh tiểu đường

        Args:
            patient_data: Dict chứa thông tin bệnh nhân và chỉ số sinh hiệu

        Returns:
            Dict chứa kết quả dự đoán và độ tin cậy
        """
        try:
            # Sử dụng fallback nếu model không load được
            if self.use_fallback or not self.model:
                return self._fallback_prediction(patient_data)

            # Chuẩn bị dữ liệu đầu vào
            input_data = self._prepare_input_data(patient_data)

            if input_data is None:
                return self._fallback_prediction(patient_data)

            # Thực hiện dự đoán
            prediction = self.model.predict(input_data)[0]
            prediction_proba = self.model.predict_proba(input_data)[0]

            # Xác suất mắc tiểu đường (class 1)
            diabetes_probability = (
                prediction_proba[1]
                if len(prediction_proba) > 1
                else prediction_proba[0]
            )

            # Phân loại mức độ rủi ro
            risk_level = self._classify_risk(diabetes_probability)

            # Kết quả trả về
            return {
                "prediction": int(prediction),  # 0: Không mắc, 1: Mắc tiểu đường
                "prediction_label": (
                    "Mắc tiểu đường" if prediction == 1 else "Không mắc tiểu đường"
                ),
                "probability": float(diabetes_probability),
                "probability_percentage": round(float(diabetes_probability) * 100, 2),
                "risk_level": risk_level,
                "input_data_used": input_data.to_dict("records")[0],
                "model_confidence": (
                    "Cao"
                    if max(prediction_proba) > 0.8
                    else "Trung bình" if max(prediction_proba) > 0.6 else "Thấp"
                ),
                "model_type": "ML Model",
            }

        except Exception as e:
            print(f"❌ Error in ML prediction, falling back: {str(e)}")
            return self._fallback_prediction(patient_data)

    def _fallback_prediction(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Không còn sử dụng fallback, chỉ trả về lỗi nếu model không khả dụng.
        """
        return {
            "error": "ML model không khả dụng. Không thể dự đoán tiểu đường.",
            "prediction": None,
            "probability": None,
            "probability_percentage": None,
            "prediction_label": "Không thể dự đoán",
            "risk_level": None,
            "model_type": "Unavailable",
            "model_confidence": "Không xác định",
            "note": "Vui lòng kiểm tra lại model hoặc liên hệ quản trị hệ thống.",
        }

    def _classify_risk(self, probability: float) -> str:
        """Phân loại mức độ rủi ro"""
        if probability < 0.3:
            return "Thấp"
        elif probability < 0.6:
            return "Trung bình"
        elif probability < 0.8:
            return "Cao"
        else:
            return "Rất cao"

    def get_input_requirements(self) -> Dict[str, Any]:
        """
        Trả về thông tin về các trường dữ liệu cần thiết cho dự đoán tiểu đường.
        UI nhập cả chiều cao/cân nặng, model chỉ lấy BMI.
        """
        return {
            "fields": [
                {
                    "id": "age",
                    "name": "Tuổi",
                    "type": "number",
                    "required": True,
                    "min": 18,
                    "max": 120,
                    "default": 50,
                    "step": 1,
                    "description": "Tuổi của bệnh nhân",
                },
                {
                    "id": "gender",
                    "name": "Giới tính",
                    "type": "select",
                    "required": True,
                    "options": [
                        {"value": "Male", "label": "Nam"},
                        {"value": "Female", "label": "Nữ"},
                    ],
                    "default": "Male",
                    "description": "Giới tính của bệnh nhân",
                },
                {
                    "id": "height",
                    "name": "Chiều cao (cm)",
                    "type": "number",
                    "required": False,
                    "min": 100,
                    "max": 250,
                    "step": 0.1,
                    "description": "Chiều cao của bệnh nhân (cm)",
                    "help_text": "Dùng để tính BMI nếu chưa nhập BMI",
                },
                {
                    "id": "weight",
                    "name": "Cân nặng (kg)",
                    "type": "number",
                    "required": False,
                    "min": 30,
                    "max": 200,
                    "step": 0.1,
                    "description": "Cân nặng của bệnh nhân (kg)",
                    "help_text": "Dùng để tính BMI nếu chưa nhập BMI",
                },
                {
                    "id": "bmi",
                    "name": "Chỉ số BMI",
                    "type": "number",
                    "required": True,
                    "min": 10,
                    "max": 50,
                    "step": 0.1,
                    "description": "Chỉ số khối cơ thể (BMI)",
                    "auto_calculated": True,
                    "formula": "weight / ((height/100) * (height/100))",
                    "depends_on": ["height", "weight"],
                },
                {
                    "id": "hypertension",
                    "name": "Tăng huyết áp",
                    "type": "radio",
                    "required": True,
                    "options": [
                        {"value": 0, "label": "Không"},
                        {"value": 1, "label": "Có"},
                    ],
                    "default": 0,
                    "description": "Bệnh nhân có tăng huyết áp không?",
                },
                {
                    "id": "heart_disease",
                    "name": "Bệnh tim",
                    "type": "radio",
                    "required": True,
                    "options": [
                        {"value": 0, "label": "Không"},
                        {"value": 1, "label": "Có"},
                    ],
                    "default": 0,
                    "description": "Bệnh nhân có tiền sử bệnh tim không?",
                },
                {
                    "id": "HbA1c_level",
                    "name": "Chỉ số HbA1c (%)",
                    "type": "number",
                    "required": True,
                    "min": 3.0,
                    "max": 15.0,
                    "step": 0.1,
                    "default": 5.5,
                    "description": "Chỉ số đường huyết trung bình 3 tháng",
                },
                {
                    "id": "blood_glucose_level",
                    "name": "Đường huyết (mg/dL)",
                    "type": "number",
                    "required": True,
                    "min": 50,
                    "max": 500,
                    "step": 1,
                    "default": 120,
                    "description": "Nồng độ đường trong máu",
                },
                {
                    "id": "smoking_history",
                    "name": "Tiền sử hút thuốc",
                    "type": "select",
                    "required": True,
                    "options": [
                        {"value": "never", "label": "Không bao giờ"},
                        {"value": "past_smoker", "label": "Đã từng hút"},
                        {"value": "current", "label": "Đang hút"},
                    ],
                    "default": "never",
                    "description": "Tiền sử hút thuốc lá",
                },
            ],
            "required_fields": [
                "age",
                "gender",
                "bmi",
                "hypertension",
                "heart_disease",
                "HbA1c_level",
                "blood_glucose_level",
                "smoking_history",
            ],
            "recommended_fields": ["height", "weight"],
            "ui_config": {
                "title": "Dự đoán nguy cơ tiểu đường",
                "description": "Nhập thông tin để dự đoán nguy cơ mắc bệnh tiểu đường",
                "theme_color": "#2ecc71",
                "result_title": "Kết quả dự đoán",
                "submit_button_text": "Dự đoán",
                "show_progress_indicator": True,
                "enable_auto_calculation": True,
                "layout": "grouped",
            },
            "metadata": {
                "model_name": "Diabetes Prediction Model",
                "version": "1.0.0",
                "description": "Dự đoán khả năng mắc bệnh tiểu đường dựa trên các chỉ số sinh học",
                "accuracy": "85%",
                "last_updated": "2025-07-30",
                "recommended_refresh": "6 months",
                "author": "CTU ML Team",
            },
            "success": True,
            "message": "Success",
        }


# Singleton instance
diabetes_predictor = DiabetesPredictor()
