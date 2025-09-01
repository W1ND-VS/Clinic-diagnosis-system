import pandas as pd
import numpy as np
import warnings
from typing import Dict, Any, List, Optional
from ..utils.model_loader import model_loader


class HypertensionPredictor:
    def __init__(self):
        self.model = None
        self.use_fallback = False
        self.model_info = {
            "status": "not_loaded",
            "model_file": ".pkl",
        }
        self._model_loaded = False
        self._load_model()

    def _load_model(self):
        """Chỉ load hypertension model"""
        if self._model_loaded:
            return self.model is not None

        try:
            self.model = model_loader.load_model("hypertension_rf_model_v4.pkl")
            if self.model:
                print("✅ Hypertension prediction model loaded successfully")
                self.use_fallback = False
                self.model_info.update(
                    {
                        "status": "loaded",
                    }
                )
                self._model_loaded = True
                return True
            else:
                print("⚠️ Failed to load hypertension prediction model")
                self.use_fallback = True
                self.model_info["status"] = "failed_to_load"
                self._model_loaded = True
                return False

        except Exception as e:
            print(f"❌ Error loading hypertension model: {str(e)}")
            self.use_fallback = True
            self.model_info.update({"status": "error", "error": str(e)})
            self._model_loaded = True
            return False

    def predict_hypertension(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dự đoán khả năng mắc bệnh tăng huyết áp

        Args:
            patient_data: Dict chứa thông tin bệnh nhân và chỉ số sinh hiệu

        Returns:
            Dict chứa kết quả dự đoán và độ tin cậy
        """
        try:
            print(patient_data)
            if self.use_fallback or not self.model:
                print("🔄 Hypertension using fallback rule-based prediction")
                return self._fallback_prediction(patient_data)

            # Prepare input data
            input_data = self._prepare_input_data(patient_data)
            if input_data is None:
                print("🔄 Hypertension input failed, using fallback")
                return self._fallback_prediction(patient_data)

            # Make prediction
            pred_test = self.model.predict(input_data)
            prediction = pred_test.astype(int)[0]
            prediction_proba = self.model.predict_proba(input_data)[0]
            print(f"✅ Hypertension ML prediction successful: {prediction}")

            # Process results
            hypertension_probability = (
                prediction_proba[1]
                if len(prediction_proba) > 1
                else prediction_proba[0]
            )

            risk_level = self._classify_risk(hypertension_probability)
            confidence = self._get_model_confidence(prediction_proba)
            
            return {
                "success": True,
                "prediction": int(prediction),
                "prediction_label": (
                    "Có nguy cơ tăng huyết áp"
                    if prediction == 1
                    else "Không có nguy cơ tăng huyết áp"
                ),
                "probability": float(hypertension_probability),
                "probability_percentage": round(
                    float(hypertension_probability) * 100, 2
                ),
                "risk_level": risk_level,
                "confidence": float(confidence),
                "model_confidence": self._get_confidence_level(confidence),
                "recommendations": self._get_recommendations(
                    prediction, hypertension_probability
                ),
                "input_data_used": (
                    input_data.to_dict("records")[0]
                    if hasattr(input_data, "to_dict")
                    else input_data
                ),
                "model_info": self.model_info,
            }

        except Exception as e:
            print(f"❌ Error in hypertension ML prediction: {str(e)}")
            return self._fallback_prediction(patient_data)

    def get_input_requirements(self) -> Dict[str, Any]:
        """
        Trả về thông tin về các trường dữ liệu cần thiết cho dự đoán tăng huyết áp.
        UI nhập cả chiều cao/cân nặng, model chỉ lấy BMI và các feature đúng như model.
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
                    "default": 45,
                    "step": 1,
                    "description": "Tuổi của bệnh nhân (năm)",
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
                    "id": "salt_intake_level",
                    "name": "Lượng muối tiêu thụ",
                    "type": "select",
                    "required": True,
                    "options": [
                        {"value": "low", "label": "Ít (<6g/ngày)"},
                        {"value": "moderate", "label": "Vừa (6-10g/ngày)"},
                        {"value": "high", "label": "Nhiều (>10g/ngày)"},
                    ],
                    "default": "moderate",
                    "description": "Chọn mức tiêu thụ muối hàng ngày",
                },
                {
                    "id": "stress_score",
                    "name": "Điểm căng thẳng",
                    "type": "number",
                    "required": True,
                    "min": 1,
                    "max": 10,
                    "step": 1,
                    "default": 5,
                    "description": "Điểm đánh giá mức độ căng thẳng (1-10)",
                },
                {
                    "id": "sleep_duration",
                    "name": "Thời gian ngủ (giờ/ngày)",
                    "type": "number",
                    "required": True,
                    "min": 0,
                    "max": 24,
                    "step": 0.1,
                    "default": 7,
                    "description": "Thời gian ngủ trung bình mỗi ngày (giờ)",
                },
                {
                    "id": "bp_history",
                    "name": "Tiền sử huyết áp cao",
                    "type": "radio",
                    "required": True,
                    "options": [
                        {"value": 0, "label": "Không"},
                        {"value": 1, "label": "Có"},
                    ],
                    "default": 0,
                    "description": "Tiền sử huyết áp cao (0: Không, 1: Có)",
                },
                {
                    "id": "medication",
                    "name": "Tình trạng dùng thuốc huyết áp",
                    "type": "select",
                    "required": True,
                    "options": [
                        {"value": 0, "label": "Không dùng"},
                        {"value": 1, "label": "Đang dùng"},
                        {"value": 2, "label": "Đã từng dùng"},
                    ],
                    "default": 0,
                    "description": "Tình trạng dùng thuốc điều trị huyết áp",
                },
                {
                    "id": "family_history",
                    "name": "Tiền sử gia đình tăng huyết áp",
                    "type": "radio",
                    "required": True,
                    "options": [
                        {"value": 0, "label": "Không"},
                        {"value": 1, "label": "Có"},
                    ],
                    "default": 0,
                    "description": "Tiền sử gia đình có người bị tăng huyết áp (0: Không, 1: Có)",
                },
                {
                    "id": "exercise_level",
                    "name": "Mức độ vận động thể chất",
                    "type": "select",
                    "required": True,
                    "options": [
                        {"value": 0, "label": "Thấp"},
                        {"value": 1, "label": "Trung bình"},
                        {"value": 2, "label": "Cao"},
                    ],
                    "default": 1,
                    "description": "Mức độ vận động thể chất (0: Thấp, 1: Trung bình, 2: Cao)",
                },
                {
                    "id": "smoking_status",
                    "name": "Tình trạng hút thuốc",
                    "type": "select",
                    "required": True,
                    "options": [
                        {"value": 0, "label": "Không hút"},
                        {"value": 1, "label": "Đang hút"},
                    ],
                    "default": 0,
                    "description": "Tình trạng hút thuốc (0: Không hút, 1: Đang hút)",
                },
            ],
            "required_fields": [
                "age",
                "bmi",
                "salt_intake_level",
                "stress_score",
                "sleep_duration",
                "bp_history",
                "medication",
                "family_history",
                "exercise_level",
                "smoking_status",
            ],
            "recommended_fields": ["height", "weight"],
            "ui_config": {
                "title": "Dự đoán nguy cơ tăng huyết áp",
                "description": "Nhập thông tin để dự đoán nguy cơ mắc bệnh tăng huyết áp",
                "theme_color": "#e74c3c",
                "result_title": "Kết quả dự đoán",
                "submit_button_text": "Dự đoán",
                "show_progress_indicator": True,
                "enable_auto_calculation": True,
                "layout": "grouped",
            },
            "metadata": {
                "model_name": "Hypertension Prediction Model",
                "version": "1.0.0",
                "description": "Dự đoán nguy cơ tăng huyết áp dựa trên các chỉ số sinh học và lối sống",
                "accuracy": "87%",
                "last_updated": "2025-07-30",
                "recommended_refresh": "6 months",
                "author": "CTU ML Team",
            },
            "success": True,
            "message": "Success",
        }

    def _prepare_input_data(
        self, patient_data: Dict[str, Any]
    ) -> Optional[pd.DataFrame]:
        """
        Chuẩn hóa dữ liệu đầu vào: chỉ lấy đúng các feature model cần, tính BMI nếu cần.
        """
        try:
            # BMI
            bmi = patient_data.get("bmi")
            if bmi is None:
                height = patient_data.get("height")
                weight = patient_data.get("weight")
                if height and weight:
                    bmi = float(weight) / ((float(height) / 100) ** 2)
                else:
                    bmi = 25.0

            # Salt_Intake: map từ salt_intake_level sang số gam/ngày
            salt_level = patient_data.get("salt_intake_level", "moderate")
            if salt_level == "low":
                salt_intake = 5.0
            elif salt_level == "high":
                salt_intake = 12.0
            else:
                salt_intake = 8.0  # moderate

            row = {
                "Age": float(patient_data.get("age", 45)),
                "Salt_Intake": float(salt_intake),
                "Stress_Score": float(patient_data.get("stress_score", 5)),
                "Sleep_Duration": float(patient_data.get("sleep_duration", 7)),
                "BMI": float(bmi),
                "BP_History": int(patient_data.get("bp_history", 0)),
                "Medication": int(patient_data.get("medication", 0)),
                "Family_History": int(patient_data.get("family_history", 0)),
                "Exercise_Level": int(patient_data.get("exercise_level", 1)),
                "Smoking_Status": int(patient_data.get("smoking_status", 0)),
            }

            columns = [
                "Age",
                "Salt_Intake",
                "Stress_Score",
                "Sleep_Duration",
                "BMI",
                "BP_History",
                "Medication",
                "Family_History",
                "Exercise_Level",
                "Smoking_Status",
            ]
            return pd.DataFrame([row], columns=columns)
        except Exception as e:
            print(f"❌ Error preparing input data: {str(e)}")
            return None

    def _classify_risk(self, probability: float) -> str:
        """Phân loại mức độ nguy cơ"""
        if probability >= 0.8:
            return "Rất cao"
        elif probability >= 0.6:
            return "Cao"
        elif probability >= 0.4:
            return "Trung bình"
        else:
            return "Thấp"

    def _get_model_confidence(self, prediction_proba) -> float:
        """Tính độ tin cậy của model"""
        return float(max(prediction_proba) - 0.5)

    def _get_confidence_level(self, confidence: float) -> str:
        """Chuyển đổi confidence thành level"""
        if confidence >= 0.4:
            return "Cao"
        elif confidence >= 0.2:
            return "Trung bình"
        else:
            return "Thấp"

    def _get_recommendations(self, prediction: int, probability: float) -> List[str]:
        """Tạo khuyến nghị dựa trên kết quả dự đoán"""
        recommendations = []

        if prediction == 1:  # High risk
            if probability >= 0.8:
                recommendations.extend(
                    [
                        "🚨 Nguy cơ tăng huyết áp rất cao - cần khám ngay",
                        "💊 Tham khảo ý kiến bác sĩ về điều trị dự phòng",
                        "📊 Theo dõi huyết áp hàng ngày",
                    ]
                )
            else:
                recommendations.extend(
                    [
                        "⚠️ Có nguy cơ tăng huyết áp - cần chú ý",
                        "🥗 Giảm natri trong chế độ ăn",
                        "🏃‍♂️ Tăng cường hoạt động thể chất",
                    ]
                )
        else:  # Low risk
            recommendations.extend(
                [
                    "✅ Nguy cơ tăng huyết áp thấp",
                    "🥗 Duy trì chế độ ăn lành mạnh",
                    "💪 Tiếp tục lối sống tích cực",
                ]
            )

        # Thêm khuyến nghị chung
        recommendations.extend(
            [
                "🚭 Tránh hút thuốc và uống rượu",
                "😴 Đảm bảo giấc ngủ đầy đủ",
                "📅 Kiểm tra sức khỏe định kỳ",
            ]
        )

        return recommendations

    def _fallback_prediction(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Không còn sử dụng fallback, chỉ trả về lỗi nếu model không khả dụng.
        """
        return {
            "success": False,
            "error": "ML model không khả dụng. Không thể dự đoán tăng huyết áp.",
            "prediction": None,
            "probability": None,
            "probability_percentage": None,
            "prediction_label": "Không thể dự đoán",
            "risk_level": None,
            "model_type": "Unavailable",
            "model_confidence": "Không xác định",
            "note": "Vui lòng kiểm tra lại model hoặc liên hệ quản trị hệ thống.",
        }


hypertension_predictor = HypertensionPredictor()
