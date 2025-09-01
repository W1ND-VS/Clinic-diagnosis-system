"""
ML Models Package for Clinic Management System
Provides diabetes and heart disease prediction services with fallback logic
"""

import warnings
import os
import sys

# Suppress sklearn version warnings globally
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", module="sklearn")
warnings.filterwarnings("ignore", message=".*sklearn.*")

# Package metadata
__version__ = "1.0.0"
__author__ = "CTU ML Team"
__description__ = "Medical prediction models for diabetes and heart disease"
__email__ = "ml-team@ctu.edu.vn"

# Initialize package
print("🤖 Initializing ML Models package...")

# Check if required dependencies are available
REQUIRED_PACKAGES = {
    "pandas": "pandas",
    "numpy": "numpy",
    "sklearn": "scikit-learn",
    "joblib": "joblib",
}

missing_packages = []
for package, pip_name in REQUIRED_PACKAGES.items():
    try:
        __import__(package)
    except ImportError:
        missing_packages.append(pip_name)

if missing_packages:
    print(f"⚠️ Missing required packages: {', '.join(missing_packages)}")
    print(f"💡 Install with: pip install {' '.join(missing_packages)}")

try:
    # Import main components with graceful error handling
    from .services.diabetes_predictor import diabetes_predictor
    from .services.predict_heart_disease import heart_disease_predictor
    from .utils.model_loader import model_loader

    print("✅ ML Models loaded successfully")

    # Verify model availability
    models_status = {
        "diabetes_predictor": {
            "available": hasattr(diabetes_predictor, "model")
            and diabetes_predictor.model is not None,
            "fallback": getattr(diabetes_predictor, "use_fallback", True),
        },
        "heart_disease_predictor": {
            "available": hasattr(heart_disease_predictor, "model")
            and heart_disease_predictor.model is not None,
            "fallback": getattr(heart_disease_predictor, "use_fallback", True),
        },
    }

    print(f"📊 Models status: {models_status}")

except ImportError as e:
    print(f"⚠️ Error importing ML models: {str(e)}")
    print("🔄 Models will use fallback predictions")

    # Create dummy objects for graceful degradation
    class DummyPredictor:
        def __init__(self, name):
            self.name = name
            self.use_fallback = True

        def predict(self, *args, **kwargs):
            return {
                "error": f"{self.name} not available",
                "success": False,
                "model_type": "Error Fallback",
            }

    diabetes_predictor = DummyPredictor("Diabetes Predictor")
    heart_disease_predictor = DummyPredictor("Heart Disease Predictor")
    model_loader = None

except Exception as e:
    print(f"❌ Unexpected error in ML Models package: {str(e)}")
    import traceback

    print(traceback.format_exc())

# Export main components
__all__ = [
    "diabetes_predictor",
    "heart_disease_predictor",
    "model_loader",
    "__version__",
    "__author__",
    "__description__",
]


# Package information
def get_package_info():
    """Get comprehensive package information"""
    return {
        "package": "ml_models",
        "version": __version__,
        "author": __author__,
        "description": __description__,
        "models_available": {
            "diabetes": hasattr(diabetes_predictor, "model"),
            "heart_disease": hasattr(heart_disease_predictor, "model"),
        },
        "fallback_enabled": True,
        "python_version": sys.version,
        "dependencies_status": {
            pkg: True for pkg in REQUIRED_PACKAGES.keys() if pkg not in missing_packages
        },
    }


def health_check():
    """Perform health check on ML models"""
    results = {"package_status": "healthy", "models": {}, "recommendations": []}

    try:
        # Test diabetes predictor
        test_data = {"age": 50, "gender": "Male", "bmi": 25}
        diabetes_result = diabetes_predictor.predict_diabetes(test_data)
        results["models"]["diabetes"] = {
            "status": (
                "working" if diabetes_result.get("prediction") is not None else "error"
            ),
            "model_type": diabetes_result.get("model_type", "unknown"),
            "test_successful": True,
        }
    except Exception as e:
        results["models"]["diabetes"] = {
            "status": "error",
            "error": str(e),
            "test_successful": False,
        }

    try:
        # Test heart disease predictor
        test_data = {"age": 50, "sex": 1, "chest_pain_type": 0}
        heart_result = heart_disease_predictor.predict_heart_disease(test_data)
        results["models"]["heart_disease"] = {
            "status": (
                "working" if heart_result.get("prediction") is not None else "error"
            ),
            "model_type": heart_result.get("model_info", {}).get(
                "model_type", "unknown"
            ),
            "test_successful": True,
        }
    except Exception as e:
        results["models"]["heart_disease"] = {
            "status": "error",
            "error": str(e),
            "test_successful": False,
        }

    # Generate recommendations
    if any(model["status"] == "error" for model in results["models"].values()):
        results["recommendations"].append(
            "Some models have errors - check model files and dependencies"
        )

    if missing_packages:
        results["recommendations"].append(
            f"Install missing packages: {', '.join(missing_packages)}"
        )

    return results


print(f"🎯 ML Models package v{__version__} initialized")
