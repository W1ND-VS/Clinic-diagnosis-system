/**
 * Danh mục các mô hình dự đoán chẩn đoán bệnh
 */

const predictionModels = [
  {
    id: 'diabetes',
    name: 'Đái tháo đường type 2',
    code: 'E11',
    description: 'Dự đoán nguy cơ mắc bệnh đái tháo đường dựa trên chỉ số sinh học và tiền sử',
    icon: 'tint',
    accuracy: 0.85,
    parameters: ['age', 'gender', 'bmi', 'HbA1c_level', 'blood_glucose_level', 'hypertension', 'heart_disease', 'smoking_history']
  },
  {
    id: 'hypertension',
    name: 'Tăng huyết áp',
    code: 'I10',
    description: 'Đánh giá nguy cơ tăng huyết áp dựa trên các chỉ số sinh hiệu',
    icon: 'heartbeat',
    accuracy: 0.82,
    parameters: ['age', 'gender', 'bmi', 'systolic_bp', 'diastolic_bp', 'heart_rate']
  },
  {
    id: 'heart',
    name: 'Bệnh tim mạch',
    code: 'I25',
    description: 'Đánh giá nguy cơ mắc bệnh tim mạch vành dựa trên các yếu tố nguy cơ',
    icon: 'heart',
    accuracy: 0.88,
    parameters: ['age', 'gender', 'smoking', 'blood_glucose', 'cholesterol', 'blood_pressure']
  },
  {
    id: 'stroke',
    name: 'Đột quỵ',
    code: 'I64',
    description: 'Dự đoán nguy cơ đột quỵ dựa trên các yếu tố nguy cơ',
    icon: 'brain',
    accuracy: 0.79,
    parameters: ['age', 'gender', 'bmi', 'blood_pressure', 'heart_disease_history', 'stroke_history']
  }
];

export default predictionModels;