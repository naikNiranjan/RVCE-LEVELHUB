# Auixa Hackathon - Full Stack Application

A full-stack web application built with FastAPI backend, Supabase database, and React TypeScript frontend.

## Architecture

- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **Frontend**: React with TypeScript
- **API**: RESTful API with CRUD operations

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- Supabase account and project

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment:
```bash
copy .env.example .env
# Edit .env with your Supabase credentials
```

5. Create the users table in Supabase:
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

6. Run the backend:
```bash
python run.py
```

Backend will be available at http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

Frontend will be available at http://localhost:3000

## API Documentation

Once the backend is running, visit:
- Interactive API docs: http://localhost:8000/docs
- ReDoc documentation: http://localhost:8000/redoc

## Features

### Backend Features
- FastAPI with automatic API documentation
- Supabase integration for database operations
- CORS configuration for frontend communication
- RESTful API endpoints for user management
- Error handling and validation

### Frontend Features
- React with TypeScript for type safety
- Responsive user interface
- User creation and management
- Real-time error handling
- Clean and modern design

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/users/{user_id}` - Get user by ID
- `PUT /api/users/{user_id}` - Update user
- `DELETE /api/users/{user_id}` - Delete user

## Environment Variables

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Project Structure

```
Auixa-Hackthon/
├── backend/
│   ├── app/
│   │   ├── config/
│   │   │   ├── database.py
│   │   │   └── settings.py
│   │   ├── models/
│   │   │   └── user.py
│   │   ├── routes/
│   │   │   └── users.py
│   │   └── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── run.py
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   ├── package.json
│   └── README.md
└── README.md
```

## Development Notes

1. Make sure to start the backend before the frontend
2. Update CORS origins if deploying to different domains
3. Use environment variables for all sensitive configuration
4. The password field is stored as plain text for demonstration - implement proper hashing in production

## Next Steps

- Implement authentication and authorization
- Add password hashing
- Add form validation
- Implement user editing functionality
- Add pagination for user lists
- Deploy to production environment
