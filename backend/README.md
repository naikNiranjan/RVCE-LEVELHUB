# Backend API

## Setup Instructions

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
- Copy `.env.example` to `.env`
- Update the Supabase URL and API key with your actual values

5. Run the application:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Supabase Setup

Create a table called `users` in your Supabase database with the following schema:

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/users/{user_id}` - Get user by ID
- `PUT /api/users/{user_id}` - Update user
- `DELETE /api/users/{user_id}` - Delete user

## Documentation

Once the server is running, visit:
- API Documentation: http://localhost:8000/docs
- ReDoc Documentation: http://localhost:8000/redoc
