from h11 import Data
import pandas as pd
from typing import Dict, Any, Optional
from ..utils.model_loader import model_loader

# Định nghĩa lại các dict mã hóa
Gender_encode = {"Male": 0, "Female": 1}
ever_married_encode = {"Yes": 0, "No": 1}
work_type_encode = {
    "Private": 0,
    "Self-employed": 1,
    "children": 2,
    "Govt_job": 3,
    "Never_worked": 4,
}
Resident_encode = {"Urban": 0, "Rural": 1}
smoking_encode = {"never smoked": 0, "formerly smoked": 1, "smokes": 2, "Unknown": 3}


class StrokePredictor:
    def __init__(self):
        self.model = None
        self.scaler = None
        self._load_model()

    def _load_model(self):  
        """Load stroke prediction model và scaler"""
        try:
            self.model = model_loader.load_model("random_forest_stroke_model_v4.pkl")
            self.scaler = model_loader.load_model("stroke_scaler.pkl")
            if self.model and self.scaler:
                print("✅ Stroke prediction model & scaler loaded successfully")
            else:
                print("⚠️ Failed to load stroke prediction model hoặc scaler")
        except Exception as e:
            print(f"❌ Error loading stroke model or scaler: {str(e)}")

    def _preprocess_input(self, form_data: dict) -> Optional[pd.DataFrame]:
        """
        Tiền xử lý dữ liệu đầu vào: mã hóa & chuẩn hóa đúng như pipeline train.
        """
        try:
            Gender_encode = {'Male':0, 'Female':1}
            ever_married_encode = {'Yes':0, 'No':1}
            work_type_encode = {'Private':0, 'Self-employed':1, 'children':2, 'Govt_job':3, 'Never_worked':4}
            Resident_encode = {'Urban':0, 'Rural':1}
            smoking_encode = {'never smoked':0, 'formerly smoked':1, 'smokes':2, 'Unknown':3}

            # Chuyển dict thành DataFrame 1 dòng
            df = pd.DataFrame([form_data])

            # Mã hóa các biến phân loại
            df["gender"] = df["gender"].map(Gender_encode)
            df["ever_married"] = df["ever_married"].map(ever_married_encode)
            df["work_type"] = df["work_type"].map(work_type_encode)
            df["Residence_type"] = df["Residence_type"].map(Resident_encode)
            df["smoking_status"] = df["smoking_status"].map(smoking_encode)

            # Chuẩn hóa các biến liên tục
            if self.scaler:
                df[["age", "avg_glucose_level", "bmi"]] = self.scaler.transform(
                    df[["age", "avg_glucose_level", "bmi"]]
                )
            else:
                print("⚠️ Scaler not loaded, skip normalization.")

            # Đảm bảo đúng thứ tự cột
            columns = [
                "gender",
                "age",
                "hypertension",
                "heart_disease",
                "ever_married",
                "work_type",
                "Residence_type",
                "avg_glucose_level",
                "bmi",
                "smoking_status",
            ]
            return df[columns]
        except Exception as e:
            print(f"❌ Error preprocessing input for stroke: {str(e)}")
            return None

    def predict_stroke(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dự đoán nguy cơ đột quỵ từ dữ liệu gốc (chưa mã hóa, chưa chuẩn hóa).
        Args:
            patient_data: Dict chứa thông tin bệnh nhân gốc.
        Returns:
            Dict chứa xác suất và nhãn dự đoán.
        """
        try:
            if not self.model:
                return {
                    "success": False,
                    "error": "ML model không khả dụng. Không thể dự đoán đột quỵ.",
                }

            input_data = self._preprocess_input(patient_data)
            if input_data is None:
                return {
                    "success": False,
                    "error": "Dữ liệu đầu vào không hợp lệ hoặc thiếu trường.",
                }

            prob = self.model.predict_proba(input_data)[0, 1]
            label = self.model.predict(input_data)[0]

            return {
                "success": True,
                "probability": float(prob),
                "probability_percentage": round(float(prob) * 100, 2),
                "prediction": int(label),
                "prediction_label": "Có đột quỵ" if label == 1 else "Không đột quỵ",
                "input_data_used": input_data.to_dict("records")[0],
            }
        except Exception as e:
            print(f"❌ Error in stroke prediction: {str(e)}")
            return {
                "success": False,
                "error": f"Lỗi khi dự đoán đột quỵ: {str(e)}",
            }

    def get_input_requirements(self) -> Dict[str, Any]:
        """
        Trả về thông tin về các trường dữ liệu cần thiết cho dự đoán đột quỵ.
        """
        return {
            "fields": [
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
                    "id": "age",
                    "name": "Tuổi",
                    "type": "number",
                    "required": True,
                    "min": 1,
                    "max": 120,
                    "default": 50,
                    "step": 1,
                    "description": "Tuổi của bệnh nhân",
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
                    "id": "ever_married",
                    "name": "Tình trạng hôn nhân",
                    "type": "select",
                    "required": True,
                    "options": [
                        {"value": "Yes", "label": "Đã kết hôn"},
                        {"value": "No", "label": "Chưa kết hôn"},
                    ],
                    "default": "No",
                    "description": "Bệnh nhân đã từng kết hôn chưa?",
                },
                {
                    "id": "work_type",
                    "name": "Nghề nghiệp",
                    "type": "select",
                    "required": True,
                    "options": [
                        {"value": "Private", "label": "Làm tư nhân"},
                        {"value": "Self-employed", "label": "Tự kinh doanh"},
                        {"value": "children", "label": "Trẻ em"},
                        {"value": "Govt_job", "label": "Công chức"},
                        {"value": "Never_worked", "label": "Chưa từng làm việc"},
                    ],
                    "default": "Private",
                    "description": "Nghề nghiệp của bệnh nhân",
                },
                {
                    "id": "Residence_type",
                    "name": "Nơi ở",
                    "type": "select",
                    "required": True,
                    "options": [
                        {"value": "Urban", "label": "Thành thị"},
                        {"value": "Rural", "label": "Nông thôn"},
                    ],
                    "default": "Urban",
                    "description": "Nơi ở hiện tại của bệnh nhân",
                },
                {
                    "id": "avg_glucose_level",
                    "name": "Đường huyết trung bình",
                    "type": "number",
                    "required": True,
                    "min": 50,
                    "max": 300,
                    "step": 0.1,
                    "default": 100.0,
                    "description": "Chỉ số đường huyết trung bình",
                },
                {
                    "id": "bmi",
                    "name": "Chỉ số BMI",
                    "type": "number",
                    "required": True,
                    "min": 10,
                    "max": 50,
                    "step": 0.1,
                    "default": 22.0,
                    "description": "Chỉ số khối cơ thể (BMI)",
                },
                {
                    "id": "smoking_status",
                    "name": "Tình trạng hút thuốc",
                    "type": "select",
                    "required": True,
                    "options": [
                        {"value": "never smoked", "label": "Không bao giờ hút"},
                        {"value": "formerly smoked", "label": "Đã từng hút"},
                        {"value": "smokes", "label": "Đang hút"},
                        {"value": "Unknown", "label": "Không rõ"},
                    ],
                    "default": "never smoked",
                    "description": "Tình trạng hút thuốc của bệnh nhân",
                },
            ],
            "required_fields": [
                "gender",
                "age",
                "hypertension",
                "heart_disease",
                "ever_married",
                "work_type",
                "Residence_type",
                "avg_glucose_level",
                "bmi",
                "smoking_status",
            ],
            "ui_config": {
                "title": "Dự đoán nguy cơ đột quỵ",
                "description": "Nhập thông tin để dự đoán nguy cơ đột quỵ",
                "theme_color": "#e67e22",
                "result_title": "Kết quả dự đoán",
                "submit_button_text": "Dự đoán",
                "show_progress_indicator": True,
                "enable_auto_calculation": True,
                "layout": "grouped",
            },
            "metadata": {
                "model_name": "Stroke Prediction Model",
                "version": "1.0.0",
                "description": "Dự đoán nguy cơ đột quỵ dựa trên các chỉ số sinh học và lối sống",
                "accuracy": "Chưa xác định",
                "last_updated": "2025-08-19",
                "author": "CTU ML Team",
            },
            "success": True,
            "message": "Success",
        }


# Singleton instance
stroke_predictor = StrokePredictor()
