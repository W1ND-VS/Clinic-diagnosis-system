import pandas as pd
import numpy as np
import warnings
import traceback
from typing import Dict, Any, Optional

# Tắt warning về version incompatibility


class HeartDiseasePredictor:
    def __init__(self):
        self.model = None
        self.use_fallback = False  # ✅ THÊM DÒNG NÀY
        self.model_info = {
            "status": "not_loaded",
            "model_file": ".pkl",
        }
        self._model_loaded = False
        self._load_model()  # ✅ THÊM DÒNG NÀY

    def _load_model(self):
        """Load heart disease prediction model"""
        if self._model_loaded:
            return self.model is not None

        try:
            # Import model_loader locally để tránh circular import
            from ..utils.model_loader import model_loader

            # Suppress sklearn version warnings
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", category=UserWarning)
                self.model = model_loader.load_model(
                    "enhanced_pipeline_v3_sklearn_1_6_1_20250804_191923.pkl"
                )

            if self.model:
                print("✅ Heart disease model loaded successfully")
                self.use_fallback = False  # ✅ SET ĐÚNG
                self.model_info = {
                    "status": "loaded",
                    "model_file": "enhanced_pipeline_v3_sklearn_1_6_1_20250804_191923.pkl",
                    "sklearn_version": self._get_sklearn_version(),
                }
                self._model_loaded = True
                return True
            else:
                print("❌ Failed to load heart disease model")
                self.use_fallback = True  # ✅ THÊM DÒNG NÀY
                self.model_info["status"] = "failed_to_load"
                self._model_loaded = True
                return False

        except Exception as e:
            print(f"❌ Error loading heart disease model: {str(e)}")
            self.use_fallback = True  # ✅ THÊM DÒNG NÀY
            self.model_info = {
                "status": "error",
                "error": str(e),
                "model_file": "enhanced_pipeline_v3_sklearn_1_6_1_20250804_191923.pkl",
            }
            self._model_loaded = True
            return False

    def _get_sklearn_version(self):
        """Lấy sklearn version"""
        try:
            import sklearn

            return sklearn.__version__
        except:
            return "unknown"

    def predict_heart_disease(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dự đoán nguy cơ bệnh tim

        Args:
            patient_data: Dictionary chứa thông tin bệnh nhân

        Returns:
            Dictionary chứa kết quả dự đoán
        """
        try:
            if self.use_fallback or not self.model:
                print("🔄 Heart disease using fallback rule-based prediction")
                return self._fallback_prediction(patient_data)

            # ML model prediction
            input_data = self._prepare_input_data(patient_data)
            if input_data is None:
                print("🔄 Heart disease input failed, using fallback")
                return self._fallback_prediction(patient_data)

            # Thực hiện dự đoán
            prediction = self.model.predict(input_data)[0]
            prediction_proba = self.model.predict_proba(input_data)[0]
            print(f"✅ Heart disease ML prediction successful: {prediction}")

            # Xử lý kết quả
            heart_disease_probability = (
                prediction_proba[1]
                if len(prediction_proba) > 1
                else prediction_proba[0]
            )
            risk_level = self._classify_risk(heart_disease_probability)
            confidence = abs(heart_disease_probability - 0.5)

            return {
                "success": True,
                "prediction": int(prediction),
                "prediction_label": (
                    "Có nguy cơ bệnh tim"
                    if prediction == 1
                    else "Không có nguy cơ bệnh tim"
                ),
                "probability": float(heart_disease_probability),
                "probability_percentage": round(
                    float(heart_disease_probability) * 100, 2
                ),
                "risk_level": risk_level,
                "confidence": float(confidence),
                "model_confidence": self._get_model_confidence(prediction_proba),
                "diagnosis": "Heart Disease" if prediction == 1 else "Healthy",
                "recommendations": self._get_recommendations(
                    prediction, heart_disease_probability
                ),
                "input_data_used": input_data.to_dict("records")[0],
                "model_info": self.model_info,
            }

        except Exception as e:
            print(f"❌ Heart disease ML error, falling back: {str(e)}")
            return self._fallback_prediction(patient_data)

    def _prepare_input_data(
        self, patient_data: Dict[str, Any]
    ) -> Optional[pd.DataFrame]:
        """Chuẩn bị dữ liệu đầu vào"""
        try:
            # Kiểm tra tuổi (bắt buộc)
            age = patient_data.get("age") or patient_data.get("tuoi")
            if not age:
                print("❌ Thiếu thông tin tuổi")
                return None

            try:
                age = int(age)
                if age < 18 or age > 120:
                    print(f"❌ Tuổi không hợp lệ: {age}")
                    return None
            except (ValueError, TypeError):
                print(f"❌ Tuổi không phải số: {age}")
                return None

            # Xử lý giới tính
            sex = patient_data.get("sex") or patient_data.get("gioitinh")
            if isinstance(sex, str):
                sex = 1 if sex.lower() in ["nam", "male", "m", "1"] else 0
            elif sex is None:
                sex = 1  # Default male
            else:
                sex = 1 if int(sex) == 1 else 0

            # Helper functions
            def safe_int(value, default, min_val=None, max_val=None):
                try:
                    if value is None:
                        return default
                    val = int(float(value))
                    if min_val is not None and val < min_val:
                        return default
                    if max_val is not None and val > max_val:
                        return default
                    return val
                except:
                    return default

            def safe_float(value, default, min_val=None, max_val=None):
                try:
                    if value is None:
                        return default
                    val = float(value)
                    if min_val is not None and val < min_val:
                        return default
                    if max_val is not None and val > max_val:
                        return default
                    return val
                except:
                    return default

            # Chuẩn bị tất cả features
            input_df = pd.DataFrame(
                {
                    "age": [age],
                    "sex": [sex],
                    "chest_pain_type": [
                        safe_int(patient_data.get("chest_pain_type"), 3, 0, 3)
                    ],
                    "resting_blood_pressure": [
                        safe_int(
                            patient_data.get("resting_blood_pressure")
                            or patient_data.get("pk_huyetap_tamthu"),
                            120,
                            80,
                            200,
                        )
                    ],
                    "cholesterol": [
                        safe_int(patient_data.get("cholesterol"), 200, 100, 600)
                    ],
                    "fasting_blood_sugar": [
                        safe_int(patient_data.get("fasting_blood_sugar"), 0, 0, 1)
                    ],
                    "Restecg": [safe_int(patient_data.get("Restecg"), 0, 0, 2)],
                    "max_heart_rate_achieved": [
                        safe_int(
                            patient_data.get("max_heart_rate_achieved")
                            or patient_data.get("pk_nhiptim"),
                            150,
                            60,
                            220,
                        )
                    ],
                    "exercise_induced_angina": [
                        safe_int(patient_data.get("exercise_induced_angina"), 0, 0, 1)
                    ],
                    "st_depression": [
                        safe_float(patient_data.get("st_depression"), 0.0, 0.0, 6.0)
                    ],
                    "st_slope_type": [
                        safe_int(patient_data.get("st_slope_type"), 1, 1, 3)
                    ],
                    "num_major_vessels": [
                        safe_int(patient_data.get("num_major_vessels"), 0, 0, 4)
                    ],
                    "thalassemia_type": [
                        safe_int(patient_data.get("thalassemia_type"), 1, 1, 3)
                    ],
                }
            )

            print(f"✅ Prepared input: {input_df.to_dict('records')[0]}")
            return input_df

        except Exception as e:
            print(f"❌ Error preparing input: {str(e)}")
            return None

    def _classify_risk(self, probability: float) -> str:
        """Phân loại mức độ rủi ro"""
        if probability < 0.2:
            return "Very Low Risk"
        elif probability < 0.4:
            return "Low Risk"
        elif probability < 0.6:
            return "Medium Risk"
        elif probability < 0.8:
            return "High Risk"
        else:
            return "Very High Risk"

    def _get_model_confidence(self, prediction_proba):
        """Tính độ tin cậy của model"""
        max_proba = max(prediction_proba)
        if max_proba > 0.8:
            return "Cao"
        elif max_proba > 0.6:
            return "Trung bình"
        else:
            return "Thấp"

    def _get_recommendations(self, prediction: int, probability: float) -> list:
        """Tạo khuyến nghị"""
        recommendations = []

        try:
            if prediction == 1:  # Có nguy cơ
                if probability > 0.8:
                    recommendations = [
                        "🚨 Nguy cơ cao - Cần thăm khám tim mạch NGAY",
                        "📋 Thực hiện đầy đủ xét nghiệm tim mạch",
                        "💊 Tuân thủ điều trị theo chỉ định bác sĩ",
                    ]
                elif probability > 0.6:
                    recommendations = [
                        "⚠️ Nguy cơ trung bình - Nên khám tim mạch trong tuần",
                        "🏃‍♂️ Tăng cường vận động nhẹ nhàng",
                        "🍎 Điều chỉnh chế độ ăn lành mạnh",
                    ]
                else:
                    recommendations = [
                        "📅 Theo dõi định kỳ các chỉ số tim mạch",
                        "🚭 Tránh hút thuốc và rượu bia",
                        "😴 Duy trì giấc ngủ đầy đủ",
                    ]
            else:  # Không có nguy cơ
                recommendations = [
                    "✅ Duy trì lối sống lành mạnh",
                    "🏃‍♂️ Tập thể dục đều đặn",
                    "📅 Kiểm tra sức khỏe định kỳ",
                ]
        except:
            recommendations = ["Không thể tạo khuyến nghị"]

        return recommendations

    def get_input_requirements(self) -> Dict[str, Any]:
        """Lấy yêu cầu đầu vào với tất cả các trường cần thiết"""
        return {
            "metadata": {
                "model_name": "Heart Disease Prediction Model",
                "version": "20250804_161101",
                "description": "Dự đoán nguy cơ bệnh tim dựa trên 13 đặc trưng lâm sàng",
                "accuracy": "85%",
                "author": "CTU ML Team",
                "total_features": 13,
            },
            "required_fields": ["age", "sex"],
            "recommended_fields": [
                "chest_pain_type",
                "resting_blood_pressure",
                "cholesterol",
                "max_heart_rate_achieved",
                "exercise_induced_angina",
            ],
            "fields": [
                {
                    "id": "age",
                    "name": "Tuổi",
                    "type": "number",
                    "required": True,
                    "min": 18,
                    "max": 100,
                    "unit": "năm",
                    "description": "Tuổi của bệnh nhân (tính bằng năm)",
                    "clinical_note": "Nam >45 tuổi, Nữ >55 tuổi có nguy cơ cao hơn",
                    "impact": "Tuổi tác là yếu tố nguy cơ quan trọng. Nguy cơ bệnh tim tăng theo tuổi",
                },
                {
                    "id": "sex",
                    "name": "Giới tính",
                    "type": "select",
                    "required": True,
                    "options": [
                        {"value": 0, "label": "Nữ"},
                        {"value": 1, "label": "Nam"},
                    ],
                    "description": "Giới tính của bệnh nhân",
                    "clinical_note": "Nữ được bảo vệ bởi estrogen trước mãn kinh",
                    "impact": "Nam giới có nguy cơ bệnh tim cao hơn ở tuổi trẻ",
                },
                {
                    "id": "chest_pain_type",
                    "name": "Loại đau ngực",
                    "type": "select",
                    "required": False,
                    "options": [
                        {
                            "value": 0,
                            "label": "Typical Angina (Đau thắt ngực điển hình)",
                        },
                        {
                            "value": 1,
                            "label": "Atypical Angina (Đau thắt ngực không điển hình)",
                        },
                        {
                            "value": 2,
                            "label": "Non-Anginal Pain (Đau không liên quan đến tim)",
                        },
                        {"value": 3, "label": "Asymptomatic (Không triệu chứng)"},
                    ],
                    "default": 3,
                    "description": "Loại triệu chứng đau ngực",
                    "clinical_note": "Đau thắt ngực điển hình: đau/khó chịu ở ngực khi gắng sức",
                    "impact": "Typical angina có mối liên hệ mạnh với bệnh tim",
                },
                {
                    "id": "resting_blood_pressure",
                    "name": "Huyết áp tâm thu lúc nghỉ",
                    "type": "number",
                    "required": False,
                    "min": 80,
                    "max": 200,
                    "unit": "mmHg",
                    "default": 120,
                    "description": "Huyết áp tâm thu khi nghỉ ngơi",
                    "normal_range": "90-120 mmHg",
                    "high_risk": ">140 mmHg (tăng huyết áp)",
                    "clinical_note": "Huyết áp cao làm tăng gánh nặng cho tim",
                    "impact": "Tăng huyết áp là yếu tố nguy cơ chính của bệnh tim",
                },
                {
                    "id": "cholesterol",
                    "name": "Cholesterol máu",
                    "type": "number",
                    "required": False,
                    "min": 100,
                    "max": 600,
                    "unit": "mg/dl",
                    "default": 200,
                    "description": "Nồng độ cholesterol trong máu",
                    "normal_range": "<200 mg/dl",
                    "borderline": "200-239 mg/dl",
                    "high_risk": "≥240 mg/dl",
                    "clinical_note": "LDL cao và HDL thấp tăng nguy cơ bệnh tim",
                    "impact": "Cholesterol cao tạo mảng bám trong động mạch",
                },
                {
                    "id": "fasting_blood_sugar",
                    "name": "Đường huyết lúc đói",
                    "type": "select",
                    "required": False,
                    "options": [
                        {"value": 0, "label": "≤120 mg/dl (Bình thường)"},
                        {"value": 1, "label": ">120 mg/dl (Cao)"},
                    ],
                    "default": 0,
                    "description": "Đường huyết sau nhịn ăn >12h",
                    "normal": "≤100 mg/dl",
                    "clinical_note": "Đường huyết cao làm tổn thương thành mạch máu",
                    "impact": "Tiểu đường làm tăng nguy cơ bệnh tim mạch",
                },
                {
                    "id": "Restecg",
                    "name": "Điện tim lúc nghỉ",
                    "type": "select",
                    "required": False,
                    "options": [
                        {"value": 0, "label": "Normal (Bình thường)"},
                        {
                            "value": 1,
                            "label": "ST-T abnormality (Bất thường sóng ST-T)",
                        },
                        {"value": 2, "label": "LV hypertrophy (Phì đại thất trái)"},
                    ],
                    "default": 0,
                    "description": "Kết quả điện tim khi nghỉ ngơi",
                    "clinical_note": "Phì đại thất trái thường do tăng huyết áp lâu dài",
                    "impact": "Bất thường điện tim chỉ ra vấn đề về tim",
                },
                {
                    "id": "max_heart_rate_achieved",
                    "name": "Nhịp tim tối đa",
                    "type": "number",
                    "required": False,
                    "min": 60,
                    "max": 220,
                    "unit": "bpm",
                    "default": 150,
                    "description": "Nhịp tim cao nhất đạt được trong test gắng sức",
                    "normal_formula": "220 - tuổi",
                    "low_risk": "Đạt >85% nhịp tim tối đa dự đoán",
                    "clinical_note": "Khả năng tăng nhịp tim phản ánh sức khỏe tim mạch",
                    "impact": "Nhịp tim tối đa thấp có thể chỉ ra suy giảm chức năng tim",
                },
                {
                    "id": "exercise_induced_angina",
                    "name": "Đau thắt ngực khi gắng sức",
                    "type": "select",
                    "required": False,
                    "options": [
                        {"value": 0, "label": "Không"},
                        {"value": 1, "label": "Có"},
                    ],
                    "default": 0,
                    "description": "Có xuất hiện đau thắt ngực khi vận động không",
                    "clinical_note": "Thiếu máu cơ tim khi tim cần oxy nhiều hơn",
                    "impact": "Đau ngực khi gắng sức là dấu hiệu cảnh báo quan trọng",
                },
                {
                    "id": "st_depression",
                    "name": "Độ suy giảm ST",
                    "type": "number",
                    "required": False,
                    "min": 0.0,
                    "max": 6.0,
                    "step": 0.1,
                    "unit": "mV",
                    "default": 0.0,
                    "description": "Mức độ suy giảm đoạn ST trên điện tim khi gắng sức",
                    "normal": "<1.0 mV",
                    "significant": "≥1.0 mV",
                    "clinical_note": "Càng suy giảm nhiều, nguy cơ bệnh tim càng cao",
                    "impact": "ST depression chỉ ra thiếu máu cơ tim",
                },
                {
                    "id": "st_slope_type",
                    "name": "Dạng đường ST",
                    "type": "select",
                    "required": False,
                    "options": [
                        {"value": 1, "label": "Upsloping (Dốc lên) - Tốt"},
                        {"value": 2, "label": "Flat (Phẳng) - Bình thường"},
                        {"value": 3, "label": "Downsloping (Dốc xuống) - Bất thường"},
                    ],
                    "default": 1,
                    "description": "Hướng của đoạn ST trên điện tim khi gắng sức",
                    "clinical_note": "Phản ánh phản ứng của tim với stress",
                    "impact": "Downsloping ST có liên quan mạnh với bệnh mạch vành",
                },
                {
                    "id": "num_major_vessels",
                    "name": "Số mạch vành chính bị ảnh hưởng",
                    "type": "number",
                    "required": False,
                    "min": 0,
                    "max": 4,
                    "default": 0,
                    "description": "Số lượng mạch vành chính có hẹp ≥50%",
                    "clinical_note": "Hẹp nhiều mạch vành làm tăng nguy cơ bệnh tim",
                    "impact": "Nhiều mạch vành bị hẹp có nghĩa là nguy cơ cao hơn",
                },
                {
                    "id": "thalassemia_type",
                    "name": "Loại thalassemia",
                    "type": "select",
                    "required": False,
                    "options": [
                        {"value": 1, "label": "Không"},
                        {"value": 2, "label": "Thalassemia nhẹ"},
                        {"value": 3, "label": "Thalassemia trung bình"},
                        {"value": 4, "label": "Thalassemia nặng"},
                    ],
                    "default": 1,
                    "description": "Loại thalassemia của bệnh nhân",
                    "clinical_note": "Thalassemia nặng có thể gây biến dạng xương và nguy cơ tim mạch",
                    "impact": "Thalassemia nặng làm tăng nguy cơ bệnh tim mạch",
                },
            ],
        }

    def is_model_ready(self) -> bool:
        """Kiểm tra model có sẵn sàng không"""
        return self._load_model()

    # ✅ THÊM METHOD _fallback_prediction()
    def _fallback_prediction(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fallback prediction logic sử dụng rule-based approach cho heart disease
        """
        try:
            print("🔄 Heart disease using fallback rule-based prediction")

            # Lấy các chỉ số quan trọng
            age = float(patient_data.get("age", 50))
            sex = int(patient_data.get("sex", 1))
            chest_pain = int(patient_data.get("chest_pain_type", 3))
            bp = float(patient_data.get("resting_blood_pressure", 120))
            cholesterol = float(patient_data.get("cholesterol", 200))
            max_hr = float(patient_data.get("max_heart_rate_achieved", 150))
            exercise_angina = int(patient_data.get("exercise_induced_angina", 0))

            # Tính risk score dựa trên cardiology guidelines
            risk_score = 0

            # Age factor (major risk factor)
            if sex == 1:  # Male
                if age >= 45:
                    risk_score += 2
                elif age >= 35:
                    risk_score += 1
            else:  # Female
                if age >= 55:
                    risk_score += 2
                elif age >= 45:
                    risk_score += 1

            # Chest pain type (most important symptom)
            if chest_pain == 0:  # Typical angina
                risk_score += 4
            elif chest_pain == 1:  # Atypical angina
                risk_score += 2
            elif chest_pain == 2:  # Non-anginal pain
                risk_score += 1

            # Blood pressure (hypertension)
            if bp >= 140:
                risk_score += 2
            elif bp >= 130:
                risk_score += 1

            # Cholesterol (dyslipidemia)
            if cholesterol >= 240:
                risk_score += 2
            elif cholesterol >= 200:
                risk_score += 1

            # Exercise capacity
            expected_max_hr = 220 - age
            hr_reserve = max_hr / expected_max_hr
            if hr_reserve < 0.6:  # Poor exercise capacity
                risk_score += 3
            elif hr_reserve < 0.8:  # Moderate exercise capacity
                risk_score += 1

            # Exercise-induced angina
            if exercise_angina == 1:
                risk_score += 3

            # Gender factor
            if sex == 1:  # Male higher risk
                risk_score += 1

            # Tính probability từ risk score
            max_score = 16.0
            probability = min(risk_score / max_score, 1.0)

            # Apply sigmoid transformation
            probability = 1 / (1 + np.exp(-5 * (probability - 0.5)))

            # Prediction threshold
            prediction = 1 if probability >= 0.5 else 0

            # Risk level
            risk_level = self._classify_risk(probability)

            result = {
                "success": True,
                "prediction": prediction,
                "prediction_label": (
                    "Có nguy cơ bệnh tim" if prediction == 1 else "Không có nguy cơ bệnh tim"
                ),
                "probability": float(probability),
                "probability_percentage": round(float(probability) * 100, 2),
                "risk_level": risk_level,
                "confidence": abs(probability - 0.5),
                "model_confidence": "Trung bình",
                "diagnosis": "Heart Disease Risk" if prediction == 1 else "Low Risk",
                "recommendations": self._get_recommendations(prediction, probability),
                "input_data_used": {
                    "age": age,
                    "sex": sex,
                    "chest_pain_type": chest_pain,
                    "resting_blood_pressure": bp,
                    "cholesterol": cholesterol,
                    "max_heart_rate_achieved": max_hr,
                    "exercise_induced_angina": exercise_angina,
                },
                "model_info": {
                    "status": "fallback",
                    "model_type": "Rule-based Fallback",  # ✅ QUAN TRỌNG
                },
                "risk_score": round(risk_score, 2),
                "note": "Sử dụng logic rule-based do ML model không khả dụng",
            }

            print(
                f"✅ Heart disease fallback prediction completed: {result['prediction_label']} ({result['probability_percentage']}%)"
            )
            return result

        except Exception as e:
            print(f"❌ Error in heart disease fallback prediction: {str(e)}")
            return {
                "success": False,
                "error": f"Lỗi trong fallback prediction: {str(e)}",
                "prediction": 0,
                "probability": 0.3,
                "probability_percentage": 30.0,
                "prediction_label": "Không thể dự đoán chính xác",
                "risk_level": "Trung bình",
                "model_type": "Error Fallback",
                "model_confidence": "Thấp",
                "note": "Có lỗi xảy ra trong quá trình dự đoán",
            }


# Singleton instance - GIỐNG NHƯ diabetes_predictor
heart_disease_predictor = HeartDiseasePredictor()
