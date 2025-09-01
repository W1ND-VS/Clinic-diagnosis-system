"""
ML Utilities Package
Contains model loader and helper functions for ML operations
"""

import os
import warnings

warnings.filterwarnings("ignore", category=UserWarning)

print("🛠️ Initializing ML Utils...")

try:
    # Import model loader
    from .model_loader import ModelLoader, model_loader

    print("✅ Model loader initialized")
    print(f"📁 Model path: {model_loader.model_path}")

    # Check if models directory exists
    if os.path.exists(model_loader.model_path):
        model_files = [
            f for f in os.listdir(model_loader.model_path) if f.endswith(".pkl")
        ]
        print(f"📦 Available model files: {len(model_files)}")
        for file in model_files:
            print(f"   - {file}")
    else:
        print(f"⚠️ Models directory not found: {model_loader.model_path}")

except ImportError as e:
    print(f"⚠️ Error importing model loader: {str(e)}")

    # Create dummy model loader
    class DummyModelLoader:
        def __init__(self):
            self.models = {}
            self.model_path = "models_not_available"

        def load_model(self, model_name):
            print(f"❌ Cannot load model {model_name} - ModelLoader not available")
            return None

    model_loader = DummyModelLoader()
    ModelLoader = DummyModelLoader

# Export utilities
__all__ = ["ModelLoader", "model_loader"]


def get_model_info():
    """Get information about available models"""
    try:
        model_path = getattr(model_loader, "model_path", "")

        if not os.path.exists(model_path):
            return {
                "status": "error",
                "message": "Models directory not found",
                "path": model_path,
                "models": [],
            }

        model_files = []
        for file in os.listdir(model_path):
            if file.endswith(".pkl"):
                file_path = os.path.join(model_path, file)
                file_size = os.path.getsize(file_path)
                model_files.append(
                    {
                        "filename": file,
                        "size_mb": round(file_size / (1024 * 1024), 2),
                        "path": file_path,
                        "loaded": file in getattr(model_loader, "models", {}),
                    }
                )

        return {
            "status": "success",
            "path": model_path,
            "total_models": len(model_files),
            "models": model_files,
            "loaded_models": len(getattr(model_loader, "models", {})),
        }

    except Exception as e:
        return {"status": "error", "message": str(e), "models": []}


def clear_model_cache():
    """Clear loaded models from memory"""
    try:
        if hasattr(model_loader, "models"):
            cleared_count = len(model_loader.models)
            model_loader.models.clear()
            return {
                "success": True,
                "cleared_models": cleared_count,
                "message": f"Cleared {cleared_count} models from cache",
            }
        else:
            return {"success": False, "message": "No model cache found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def preload_models():
    """Preload all available models"""
    results = {"success": True, "loaded": [], "failed": [], "total": 0}

    try:
        model_info = get_model_info()
        if model_info["status"] != "success":
            return {
                "success": False,
                "error": model_info.get("message", "Cannot get model info"),
            }

        for model in model_info["models"]:
            filename = model["filename"]
            results["total"] += 1

            try:
                loaded_model = model_loader.load_model(filename)
                if loaded_model:
                    results["loaded"].append(filename)
                else:
                    results["failed"].append(
                        {"filename": filename, "error": "Load returned None"}
                    )
            except Exception as e:
                results["failed"].append({"filename": filename, "error": str(e)})

        results["success"] = len(results["failed"]) == 0
        return results

    except Exception as e:
        return {"success": False, "error": str(e), "loaded": [], "failed": []}


# Add utility functions to exports
__all__.extend(["get_model_info", "clear_model_cache", "preload_models"])

print("🔧 ML Utils package initialized successfully")
