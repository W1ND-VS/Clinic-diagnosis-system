"""
ML Prediction Services
Contains diabetes and heart disease predictors with fallback mechanisms
"""

import warnings

warnings.filterwarnings("ignore", category=UserWarning)

print("🔬 Initializing ML Services...")

try:
    # Import prediction services
    from .diabetes_predictor import DiabetesPredictor, diabetes_predictor
    from .predict_heart_disease import HeartDiseasePredictor, heart_disease_predictor
    from .hypertension_predictor import HypertensionPredictor, hypertension_predictor

    print("✅ Prediction services loaded")

    # Verify services are working
    services_status = {}

    # Test diabetes predictor
    try:
        test_result = diabetes_predictor.predict_diabetes({"age": 50, "gender": "Male"})
        services_status["diabetes"] = {
            "available": True,
            "model_type": test_result.get("model_type", "unknown"),
            "working": test_result.get("prediction") is not None,
        }
    except Exception as e:
        services_status["diabetes"] = {
            "available": False,
            "error": str(e),
            "working": False,
        }

    # Test heart disease predictor
    try:
        test_result = heart_disease_predictor.predict_heart_disease(
            {"age": 50, "sex": 1}
        )
        services_status["heart_disease"] = {
            "available": True,
            "model_type": test_result.get("model_info", {}).get(
                "model_type", "unknown"
            ),
            "working": test_result.get("prediction") is not None,
        }
    except Exception as e:
        services_status["heart_disease"] = {
            "available": False,
            "error": str(e),
            "working": False,
        }

    # Test hypertension predictor
    try:
        test_result = hypertension_predictor.predict_hypertension({"age": 50, "systolic_bp": 140})
        services_status["hypertension"] = {
            "available": True,
            "model_type": test_result.get("model_info", {}).get("model_type", "unknown"),
            "working": test_result.get("prediction") is not None
        }
    except Exception as e:
        services_status["hypertension"] = {
            "available": False,
            "error": str(e),
            "working": False
        }

    print(f"📊 Services status: {services_status}")

except ImportError as e:
    print(f"⚠️ Error importing prediction services: {str(e)}")

    # Create fallback dummy services
    class DummyService:
        def __init__(self, name):
            self.name = name

        def predict(self, *args, **kwargs):
            return {"error": f"{self.name} not available", "success": False}

    diabetes_predictor = DummyService("Diabetes Service")
    heart_disease_predictor = DummyService("Heart Disease Service")
    HypertensionPredictor = DummyService
    DiabetesPredictor = DummyService
    HeartDiseasePredictor = DummyService

# Export all services
__all__ = [
    "DiabetesPredictor",
    "diabetes_predictor",
    "HeartDiseasePredictor",
    "heart_disease_predictor",
    "HypertensionPredictor",
    "hypertension_predictor"
]


def get_available_services():
    """Get list of available prediction services"""
    return {
        "diabetes_prediction": {
            "class": "DiabetesPredictor",
            "instance": "diabetes_predictor",
            "description": "Predicts diabetes risk based on patient data",
            "required_fields": ["age", "gender"],
            "optional_fields": ["bmi", "blood_glucose_level", "HbA1c_level"]
        },
        "heart_disease_prediction": {
            "class": "HeartDiseasePredictor", 
            "instance": "heart_disease_predictor",
            "description": "Predicts heart disease risk based on clinical data",
            "required_fields": ["age", "sex"],
            "optional_fields": ["chest_pain_type", "blood_pressure", "cholesterol"]
        },
        "hypertension_prediction": {
            "class": "HypertensionPredictor",
            "instance": "hypertension_predictor", 
            "description": "Predicts hypertension risk based on blood pressure and lifestyle factors",
            "required_fields": ["age", "systolic_bp"],
            "optional_fields": ["diastolic_bp", "bmi", "smoking_history", "family_history"]
        }
    }


def create_comprehensive_predictor():
    """Create a comprehensive predictor using both services"""

    class ComprehensivePredictor:
        def __init__(self):
            self.diabetes_service = diabetes_predictor
            self.heart_service = heart_disease_predictor

        def predict_all(self, patient_data):
            """Predict both diabetes and heart disease risk"""
            results = {
                "patient_data": patient_data,
                "predictions": {},
                "overall_assessment": {},
            }

            try:
                # Diabetes prediction
                diabetes_result = self.diabetes_service.predict_diabetes(patient_data)
                results["predictions"]["diabetes"] = diabetes_result
            except Exception as e:
                results["predictions"]["diabetes"] = {"error": str(e)}

            try:
                # Heart disease prediction
                heart_result = self.heart_service.predict_heart_disease(patient_data)
                results["predictions"]["heart_disease"] = heart_result
            except Exception as e:
                results["predictions"]["heart_disease"] = {"error": str(e)}

            # Overall risk assessment
            diabetes_risk = (
                results["predictions"].get("diabetes", {}).get("probability", 0)
            )
            heart_risk = (
                results["predictions"].get("heart_disease", {}).get("probability", 0)
            )

            overall_risk = max(diabetes_risk, heart_risk)
            results["overall_assessment"] = {
                "highest_risk": overall_risk,
                "primary_concern": (
                    "diabetes" if diabetes_risk > heart_risk else "heart_disease"
                ),
                "requires_attention": overall_risk > 0.6,
                "recommendation": (
                    "Consult physician" if overall_risk > 0.6 else "Monitor regularly"
                ),
            }

            return results

    return ComprehensivePredictor()


# Create comprehensive predictor instance
comprehensive_predictor = create_comprehensive_predictor()

# Add to exports
__all__.append("comprehensive_predictor")
__all__.append("get_available_services")
__all__.append("create_comprehensive_predictor")

print("🎯 ML Services package initialized successfully")
