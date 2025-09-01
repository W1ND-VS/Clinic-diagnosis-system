"""
ML Model Files Storage
Contains .pkl model files and model metadata
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Optional

# Get model directory path
MODEL_DIR = os.path.dirname(__file__)

print(f"📦 Models directory: {MODEL_DIR}")

# Model registry with metadata
MODEL_REGISTRY = {
    "diabetes_high_recall_sklearn_1_6_1_20250806_021957.pkl": {
        "type": "diabetes_prediction",
        "name": "Diabetes High Recall Model",
        "version": "1.6.1",
        "created_date": "2025-08-06",
        "sklearn_version": "1.6.1",
        "description": "High recall diabetes prediction model",
        "features": [
            "age",
            "bmi",
            "HbA1c_level",
            "blood_glucose_level",
            "hypertension",
            "heart_disease",
            "gender",
            "smoking_history",
        ],
        "accuracy": 0.85,
        "precision": 0.82,
        "recall": 0.91,
        "f1_score": 0.86,
    },
    "diabetes_pipeline_compatible.pkl": {
        "type": "diabetes_prediction",
        "name": "Diabetes Pipeline Compatible",
        "version": "compatible",
        "description": "Version-compatible diabetes prediction pipeline",
        "features": [
            "age",
            "bmi",
            "HbA1c_level",
            "blood_glucose_level",
            "hypertension",
            "heart_disease",
            "gender",
            "smoking_history",
        ],
        "status": "backup",
    },
    "diabetes_pipeline.pkl": {
        "type": "diabetes_prediction",
        "name": "Diabetes Pipeline",
        "version": "1.0",
        "description": "Original diabetes prediction pipeline",
        "features": [
            "age",
            "bmi",
            "HbA1c_level",
            "blood_glucose_level",
            "hypertension",
            "heart_disease",
            "gender",
            "smoking_history",
        ],
        "status": "legacy",
    },
    "enhanced_pipeline_v3_sklearn_1_6_1_20250804_191923.pkl": {
        "type": "heart_disease_prediction",
        "name": "Enhanced Heart Disease Pipeline v3",
        "version": "3.0",
        "created_date": "2025-08-04",
        "sklearn_version": "1.6.1",
        "description": "Enhanced heart disease prediction with 13 clinical features",
        "features": [
            "age",
            "sex",
            "chest_pain_type",
            "resting_blood_pressure",
            "cholesterol",
            "fasting_blood_sugar",
            "Restecg",
            "max_heart_rate_achieved",
            "exercise_induced_angina",
            "st_depression",
            "st_slope_type",
            "num_major_vessels",
            "thalassemia_type",
        ],
        "accuracy": 0.87,
        "precision": 0.84,
        "recall": 0.89,
        "f1_score": 0.86,
    },
    "best_hypertension_model_enhanced.pkl": {
        "type": "hypertension_prediction",
        "name": "Enhanced Hypertension Prediction Model",
        "version": "1.0",
        "created_date": "2025-08-07",
        "sklearn_version": "1.6.1",
        "description": "Enhanced hypertension prediction model with comprehensive features",
        "features": [
            "age",
            "gender",
            "bmi",
            "systolic_bp",
            "diastolic_bp",
            "heart_rate",
            "smoking_history",
            "alcohol_consumption",
            "physical_activity",
            "family_history",
            "diabetes",
            "cholesterol_level",
        ],
        "accuracy": 0.89,
        "precision": 0.87,
        "recall": 0.91,
        "f1_score": 0.89,
        "target": "hypertension_risk",
    },
    "enhanced_preprocessing_pipeline.pkl": {
        "type": "preprocessing_pipeline",
        "name": "Enhanced Data Preprocessing Pipeline",
        "version": "1.0",
        "created_date": "2025-08-07",
        "sklearn_version": "1.6.1",
        "description": "Comprehensive data preprocessing pipeline for medical predictions",
        "features": "all_medical_features",
        "components": [
            "StandardScaler",
            "LabelEncoder",
            "FeatureEngineering",
            "ColumnTransformer",
        ],
        "purpose": "Data preprocessing for all medical models",
    },
}


def get_available_models() -> List[str]:
    """Return list of available .pkl model files"""
    try:
        if not os.path.exists(MODEL_DIR):
            return []
        return [f for f in os.listdir(MODEL_DIR) if f.endswith(".pkl")]
    except Exception as e:
        print(f"❌ Error listing models: {str(e)}")
        return []


def get_model_metadata(model_filename: str) -> Optional[Dict]:
    """Get metadata for a specific model"""
    return MODEL_REGISTRY.get(model_filename)


def get_models_by_type(model_type: str) -> List[Dict]:
    """Get all models of a specific type"""
    models = []
    for filename, metadata in MODEL_REGISTRY.items():
        if metadata.get("type") == model_type:
            models.append(
                {
                    "filename": filename,
                    "metadata": metadata,
                    "exists": filename in get_available_models(),
                }
            )
    return models


def get_latest_model(model_type: str) -> Optional[Dict]:
    """Get the latest model of a specific type"""
    models = get_models_by_type(model_type)
    if not models:
        return None

    # Sort by created_date if available, otherwise by filename
    models.sort(
        key=lambda x: x["metadata"].get("created_date", "1900-01-01"), reverse=True
    )
    return models[0] if models else None


def get_model_info() -> Dict:
    """Get comprehensive model information"""
    available_files = get_available_models()

    info = {
        "model_directory": MODEL_DIR,
        "total_files": len(available_files),
        "registered_models": len(MODEL_REGISTRY),
        "available_models": [],
        "missing_models": [],
        "model_types": {},
        "last_updated": datetime.now().isoformat(),
    }

    # Check each registered model
    for filename, metadata in MODEL_REGISTRY.items():
        model_info = {
            "filename": filename,
            "metadata": metadata,
            "exists": filename in available_files,
            "file_size": None,
        }

        if model_info["exists"]:
            try:
                file_path = os.path.join(MODEL_DIR, filename)
                model_info["file_size"] = os.path.getsize(file_path)
                info["available_models"].append(model_info)
            except Exception as e:
                model_info["error"] = str(e)
                info["missing_models"].append(model_info)
        else:
            info["missing_models"].append(model_info)

        # Group by type
        model_type = metadata.get("type", "unknown")
        if model_type not in info["model_types"]:
            info["model_types"][model_type] = []
        info["model_types"][model_type].append(filename)

    return info


def validate_models() -> Dict:
    """Validate all models and check for issues"""
    validation_results = {
        "status": "success",
        "total_models": 0,
        "valid_models": 0,
        "invalid_models": 0,
        "issues": [],
        "recommendations": [],
    }

    available_files = get_available_models()
    validation_results["total_models"] = len(available_files)

    for filename in available_files:
        try:
            file_path = os.path.join(MODEL_DIR, filename)
            file_size = os.path.getsize(file_path)

            # Check if file is too small (likely corrupted)
            if file_size < 1024:  # Less than 1KB
                validation_results["issues"].append(
                    f"Model {filename} is suspiciously small ({file_size} bytes)"
                )
                validation_results["invalid_models"] += 1
                continue

            # Check if model is registered
            if filename not in MODEL_REGISTRY:
                validation_results["issues"].append(
                    f"Model {filename} is not registered in MODEL_REGISTRY"
                )

            validation_results["valid_models"] += 1

        except Exception as e:
            validation_results["issues"].append(
                f"Error validating {filename}: {str(e)}"
            )
            validation_results["invalid_models"] += 1

    # Generate recommendations
    if validation_results["invalid_models"] > 0:
        validation_results["status"] = "warning"
        validation_results["recommendations"].append(
            "Some models have validation issues - check file integrity"
        )

    missing_models = [f for f in MODEL_REGISTRY.keys() if f not in available_files]
    if missing_models:
        validation_results["status"] = "warning"
        validation_results["recommendations"].append(
            f"Missing model files: {missing_models}"
        )

    return validation_results


# Export all functions and constants
__all__ = [
    "MODEL_DIR",
    "MODEL_REGISTRY",
    "get_available_models",
    "get_model_metadata",
    "get_models_by_type",
    "get_latest_model",
    "get_model_info",
    "validate_models",
]

# Initialize and validate on import
available_models = get_available_models()
print(f"📊 Found {len(available_models)} model files")

if available_models:
    for model in available_models:
        metadata = get_model_metadata(model)
        if metadata:
            print(f"   ✅ {model} - {metadata.get('name', 'Unknown')}")
        else:
            print(f"   ⚠️ {model} - No metadata")
else:
    print("   ⚠️ No model files found")

# Run validation
validation = validate_models()
if validation["status"] != "success":
    print(f"⚠️ Model validation: {validation['status']}")
    for issue in validation["issues"][:3]:  # Show first 3 issues
        print(f"   - {issue}")

print("📦 Models package initialized")
