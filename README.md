# MIT Connect

Stack: React (Vite), FastAPI, MongoDB

![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=FFD62E) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)

MIT Connect is a full-stack college portal with a React (Vite) frontend and a FastAPI backend. It models a campus management system for Movi Institute of Technology, with role-based dashboards for students, admin, faculty, and finance teams.

## Key Features

- Multi-role login interface for Student, Admin, Faculty, and Finance
- Role-based dashboards with role-specific navigation
- Responsive UI built with React and Vite
- FastAPI backend with MongoDB integration
- Fee assignment and invoice generation pipeline
- Real-time UI synchronization via CustomEvent

## Demo Login Credentials

| Role | User ID | Password |
|------|---------|----------|
| Student | STU-2024-1547 | student123 |
| Admin | ADM-0001 | admin123 |
| Faculty | FAC-204 | faculty123 |
| Finance | FIN-880 | finance123 |

## Project Structure

```text
target_cms/
├── backend/                 # FastAPI app
├── frontend/                # Vite React app
├── render.yaml              # Render deploy definition
└── README.md
```

## Setup (Local)

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB connection string

### Backend (FastAPI)

1. Go to the backend folder:

```bash
cd backend
```

2. Create a virtual environment and install dependencies:

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
```

3. Set the environment variable:

```bash
set MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
```

4. Start the API server:

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend (Vite)

1. Go to the frontend folder:

```bash
cd frontend
```

2. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

3. Open the local Vite URL printed in the terminal.

## Configuration

Environment variables required by the backend:

- MONGODB_URI: MongoDB connection string

## Deploy on Render

Deployment is defined in [render.yaml](render.yaml).

- Backend service uses backend/ with pip install -r requirements.txt and uvicorn start command.
- Frontend is a static site built from frontend/ using npm run build.

Set MONGODB_URI in Render for the backend service.

## Architecture and Flow

### High-Level

```
[React UI] -> [FastAPI] -> [MongoDB]
```

### Invoice and Fee Pipeline (Core Flow)

1. Admin assigns fees to approved students.
2. Admin generates invoice for a fee assignment.
3. Student pays the fee (90 percent success simulation in UI).
4. Fee assignment status updates to paid.
5. Matching invoice updates to Paid.
6. Admin dashboard updates in real-time via custom events.

### Event Sync (Frontend)

- feeAssignmentUpdated keeps student fee list synchronized.
- invoiceUpdated refreshes invoice lists and dashboard stats.

## Invoice Pipeline Details

The detailed invoice pipeline implementation is documented in:

- [INVOICE_PIPELINE_IMPLEMENTATION.md](INVOICE_PIPELINE_IMPLEMENTATION.md)

## Technologies Used

- React
- Vite
- React Router
- CSS3
- JavaScript (ES Modules)
- Google Fonts (`Inter`)
- FastAPI
- MongoDB

## Notes

- Connect login to a real backend authentication system
- Add persistent user profiles and data storage
- Create separate pages for each sidebar module
- Add charts and detailed analytics widgets
- Replace demo data with API-driven content
