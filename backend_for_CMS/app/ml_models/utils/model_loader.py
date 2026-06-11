import joblib
import os
from typing import Any, Optional

class ModelLoader:
    def __init__(self):
        self.models = {}
        # Sử dụng đường dẫn tuyệt đối để đảm bảo chính xác
        self.model_path = os.path.abspath(os.path.join(
            os.path.dirname(__file__), 
            '..', 
            'models'
        ))
        # In đường dẫn để debug
        print(f"Model path: {self.model_path}")
    
    def load_model(self, model_name: str) -> Optional[Any]:
        """Load ML model"""
        try:
            if model_name in self.models:
                return self.models[model_name]
            
            model_file = os.path.join(self.model_path, model_name)
            print(f"Loading model from: {model_file}")
            
            if not os.path.exists(model_file):
                print(f"⚠️ Model file không tồn tại: {model_file}")
                return None
            
            # Load model using joblib
            model = joblib.load(model_file)
            
            self.models[model_name] = model
            print(f"✅ Đã load model thành công: {model_name}")
            return model
            
        except Exception as e:
            print(f"⚠️ Model '{model_name}' unavailable, using fallback: {e}")
            return None

# Singleton instance
model_loader = ModelLoader()
print(f"ModelLoader initialized with path: {model_loader.model_path}")