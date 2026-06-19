# Clinic Management System

A full-stack clinic management system for handling patient records, appointments, examinations, prescriptions, medical services, reports, and diagnosis support with machine learning.

## Demo

- Frontend: `https://clinic-diagnosis-system.vercel.app`
- Backend API: `https://clinic-diagnosis-system-production.up.railway.app/api`
- Repository: `https://github.com/W1ND-VS/Clinic-diagnosis-system`

## Test Accounts

Available by default in source code:

- Admin
    - Username: `manager`
    - Password: `11111111`
    - Notes: Hard-coded in `backend_for_CMS/app/Services/auth_service.py`

Accounts that depend on your database data:

- Doctor
    - Login field: `BS000001`
    - Password: `11111111`
    - Notes: Standard doctor account
- Clinical Doctor
    - Login field: `BS000005`
    - Password: `11111111`
    - Notes: Doctor account with department code `CK13`
- Receptionist
    - Login field: `TT000001`
    - Password: `11111111`
    - Notes: Receptionist account
- Patient
    - Login field: `0772115795`
    - Password: `111`
    - Notes: Logs in with phone number

> Use sample or seeded data for doctor, receptionist, clinical doctor, and patient accounts when testing locally.

## Technologies

### Frontend

- React 19
- Vite 6
- Tailwind CSS
- Axios
- React Router
- FullCalendar
- Recharts
- jsPDF

### Backend

- Python
- Flask
- Flask-SQLAlchemy
- Flask-Migrate
- Flask-JWT-Extended
- Flask-Cors
- REST-style API

### Database

- MySQL

### Machine Learning

- Scikit-learn
- Pandas
- NumPy
- Joblib

## Project Structure

```text
Clinic_Management_System/
|-- backend_for_CMS/
|   |-- app/
|   |-- migrations/
|   |-- requirements.txt
|   `-- run.py
|-- frontend_for_CMS/
|   |-- src/
|   |-- public/
|   `-- package.json
`-- README.md
```

## Main Features

- Role-based authentication for admin, doctor, clinical doctor, receptionist, and patient
- Patient registration and profile management
- Appointment booking, scheduling, and cancellation
- Medical examination record management
- Prescription creation and printing
- Medical service request and result handling
- Doctor work shift registration by date and shift
- Work schedule arrangement by reviewing and accepting registered shifts
- Room-based weekly work schedule management for doctors
- Revenue, disease, doctor, patient, and specialty reporting
- AI-assisted diagnosis support for selected chronic diseases

## User Roles

### Admin

The admin manages doctors, receptionists, medicines, healthcare services, schedules, and reporting dashboards. The admin can also review doctor shift registrations, accept a registration, and convert it into an official work schedule assigned to a specific room and shift.

### Doctor

The doctor reviews appointments, performs examinations, records symptoms and vital signs, creates service requests, issues prescriptions, and registers preferred working shifts by date and shift.

### Clinical Doctor

The clinical doctor receives requested services, enters service results, and updates completion status.

### Receptionist

The receptionist manages patient intake, patient records, appointments, and examination check-in workflows.

### Patient

The patient can register an account, update personal information, book appointments, and review medical history.

## Local Setup

### 1. Backend

```bash
cd backend_for_CMS
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python run.py
```

Default backend settings:

- App URL: `http://localhost:5000`
- Default database URL in `.env.example`: `mysql+pymysql://root:@localhost:3307/db_clinic`

Example `.env` values:

```env
SECRET_KEY=change-me
JWT_SECRET_KEY=change-me
DATABASE_URL=mysql+pymysql://root:@localhost:3307/db_clinic
ASSITS_DIR=app/assits
CORS_ORIGINS=http://localhost:5173,https://clinic-diagnosis-system.vercel.app
```

### 2. Frontend

```bash
cd frontend_for_CMS
npm install
npm run dev
```

Default frontend URL:

- Vite dev server: `http://localhost:5173`

Frontend API environment files:

- `frontend_for_CMS/.env.development` -> `http://localhost:5000/api`
- `frontend_for_CMS/.env.production` -> `https://clinic-diagnosis-system-production.up.railway.app/api`
- `frontend_for_CMS/.env.example` -> sample key for custom setup

If you want a different API URL on your machine, create `frontend_for_CMS/.env.local` with:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

`VITE_API_BASE_URL` can be either the backend root URL such as `https://your-backend.onrender.com`
or the full API URL such as `https://your-backend.onrender.com/api`. The frontend now normalizes
it to `/api` automatically.

## Basic Usage Flow

### 1. Login

1. Open the frontend application.
2. Enter credentials based on your role.
3. After successful login, the system redirects to the role-specific interface.

### 2. Reception and Appointment Flow

1. Register or look up a patient.
2. Create an appointment with doctor, date, and time slot.
3. Confirm the patient visit and create an examination record.

### 3. Examination Flow

1. The doctor opens the assigned appointment or examination record.
2. Symptoms and vital signs are recorded.
3. The doctor may request additional medical services.
4. Service results are reviewed.
5. A prescription is created and the examination is completed.

### 4. Working Schedule Registration and Approval Flow

1. The doctor opens the personal working schedule page.
2. The doctor registers a preferred shift for a selected date.
3. The admin opens the work schedule management page and filters by specialty, room, date, and shift.
4. The admin views doctors who registered for that slot.
5. The admin accepts a selected registration to assign the doctor to the room and convert the registration into an official work schedule.
6. The confirmed schedule is then displayed in the weekly schedule board.

### 5. Reporting Flow

1. Admin opens the reporting pages.
2. Select a time range.
3. Review revenue, disease, doctor, patient, and specialty statistics.

## Diagnosis Support

The project includes machine learning assets and prediction services for selected chronic disease support, including:

- Diabetes
- Hypertension
- Heart disease
- Stroke

> The prediction module is designed to support clinical decision-making and should not replace professional medical judgment.

## Reports

The reporting module includes:

- Revenue statistics
- Disease statistics
- Doctor performance summaries
- Patient volume summaries
- Specialty-based reports

## Project Purpose

This project was built to digitize clinic operations, reduce manual paperwork, improve data tracking, and support healthcare staff during examination and treatment workflows.

## Author

Clinic Management System project  
Can Tho University
