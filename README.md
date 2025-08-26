# 🎓 RVCE LevelHub - Placement Management System

A comprehensive placement management platform built for RVCE College's placement department to streamline the entire placement process from job postings to final selections.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Key Components](#key-components)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

RVCE LevelHub is a modern, full-stack placement management system designed to revolutionize how placement activities are conducted at RVCE College. The platform provides a seamless experience for students, administrators, and placement coordinators with real-time updates, automated workflows, and comprehensive analytics.

**Built for Hackathon 2024** - This project demonstrates advanced web development skills, real-time data synchronization, file processing, and scalable architecture.

## ✨ Features

### 👨‍🎓 For Students
- **Smart Job Matching**: Automatic eligibility checking based on CGPA, branch, and backlog criteria
- **One-Click Applications**: Simple application process with resume and cover letter upload
- **Real-time Updates**: Live notifications on application status changes
- **Dashboard Analytics**: Track applied jobs and application history
- **Resume Management**: Secure upload and storage of resumes

### 👨‍💼 For Administrators
- **Bulk Shortlisting**: CSV/Excel upload for efficient shortlisting process
- **Application Management**: Comprehensive view of all student applications
- **Real-time Status Updates**: Live updates on application statuses
- **Advanced Filtering**: Filter applications by job, status, and criteria
- **Export Functionality**: Export application data for external processing
- **Analytics Dashboard**: Placement statistics and insights

### 🔧 Technical Features
- **Real-time Synchronization**: Supabase-powered live updates
- **File Processing**: Automated CSV/Excel processing with pandas
- **Secure Authentication**: Supabase authentication system
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Performance Optimized**: Efficient data loading and caching

## 🛠 Technology Stack

### Backend
- **FastAPI**: Modern Python web framework for high performance
- **Supabase**: PostgreSQL database with real-time capabilities
- **Pandas**: Data processing and analysis
- **OpenPyXL**: Excel file processing
- **Python-multipart**: File upload handling
- **Uvicorn**: ASGI server

### Frontend
- **React 18**: Modern JavaScript library with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Beautiful UI components
- **React Router**: Client-side routing
- **Lucide React**: Modern icon library

### Infrastructure
- **Supabase**: Database, authentication, and real-time subscriptions
- **Vercel/Netlify**: Frontend deployment (recommended)
- **Railway/Render**: Backend deployment (recommended)

## 📁 Project Structure

```
RVCE-LEVELHUB/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI application
│   │   ├── config/
│   │   │   ├── database.py         # Supabase configuration
│   │   │   └── settings.py         # Environment settings
│   │   └── routes/
│   │       ├── applications.py     # Application endpoints
│   │       ├── auth.py            # Authentication routes
│   │       └── jobs.py            # Job management routes
│   ├── uploads/                   # Resume storage directory
│   ├── requirements.txt           # Python dependencies
│   └── .env                       # Environment variables
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── ShortlistUpload.tsx
│   │   │   └── ui/               # Shadcn/ui components
│   │   ├── pages/                # Page components
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── Applications.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   └── Login.tsx
│   │   ├── integrations/         # External service integrations
│   │   │   └── supabase/
│   │   └── hooks/                # Custom React hooks
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- Supabase account
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/rvce-levelhub.git
   cd rvce-levelhub/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

5. **Run the backend**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Add your Supabase URL and anon key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

### Database Setup

1. **Create Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key

2. **Run database migrations**
   ```sql
   -- Create tables in Supabase SQL editor
   CREATE TABLE profiles (
     id UUID PRIMARY KEY,
     full_name TEXT,
     usn TEXT UNIQUE,
     branch TEXT,
     cgpa DECIMAL,
     email TEXT UNIQUE,
     tenth DECIMAL,
     twelfth DECIMAL,
     date_of_birth DATE,
     graduation_year INTEGER,
     active_backlog INTEGER DEFAULT 0,
     aadhar_card TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE jobs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     company_name TEXT NOT NULL,
     role TEXT NOT NULL,
     location TEXT,
     ctc DECIMAL,
     deadline DATE,
     job_type TEXT,
     min_cgpa DECIMAL,
     max_active_backlogs INTEGER DEFAULT 0,
     eligible_branches TEXT[],
     job_description TEXT,
     process_details TEXT,
     status TEXT DEFAULT 'active',
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE applications (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     job_id UUID NOT NULL,
     student_id UUID NOT NULL,
     cover_letter TEXT,
     resume_url TEXT,
     status TEXT DEFAULT 'applied',
     applied_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

## 📡 API Documentation

### Core Endpoints

#### Applications API
- `GET /api/all` - Get all applications with student/job details
- `POST /api/applications` - Create new application
- `GET /api/applications/{student_id}` - Get student's applications
- `PUT /api/applications/{id}/status` - Update application status
- `GET /api/applications/export` - Export applications to CSV

#### Jobs API
- `GET /api/jobs/eligible/{student_id}` - Get eligible jobs for student
- `GET /api/jobs/{job_id}/applications` - Get applications for a job

#### Shortlist API
- `POST /api/shortlist/upload` - Upload CSV/Excel shortlist

### Authentication
- Uses Supabase authentication
- JWT tokens handled automatically
- Row Level Security (RLS) policies implemented

## 🗄 Database Schema

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  usn TEXT UNIQUE,
  branch TEXT,
  cgpa DECIMAL,
  email TEXT UNIQUE,
  tenth DECIMAL,
  twelfth DECIMAL,
  date_of_birth DATE,
  graduation_year INTEGER,
  active_backlog INTEGER DEFAULT 0,
  aadhar_card TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Jobs Table
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT,
  ctc DECIMAL,
  deadline DATE,
  job_type TEXT,
  min_cgpa DECIMAL,
  max_active_backlogs INTEGER DEFAULT 0,
  eligible_branches TEXT[],
  job_description TEXT,
  process_details TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Applications Table
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  student_id UUID NOT NULL,
  cover_letter TEXT,
  resume_url TEXT,
  status TEXT DEFAULT 'applied',
  applied_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎨 Key Components

### Frontend Components
- **ShortlistUpload**: CSV/Excel file upload with progress tracking
- **Applications**: Comprehensive application management interface
- **AdminDashboard**: Administrative control panel
- **StudentDashboard**: Student application portal

### Backend Services
- **File Processing**: Automated CSV/Excel parsing with pandas
- **Real-time Updates**: Supabase channels for live data sync
- **Authentication**: Secure user management
- **File Storage**: Resume upload and serving

## 📖 Usage

### For Students
1. **Login** with your credentials
2. **View Eligible Jobs** on the dashboard
3. **Apply** by uploading resume and cover letter
4. **Track** application status in real-time

### For Administrators
1. **Login** to admin dashboard
2. **Post Jobs** with eligibility criteria
3. **Manage Applications** with bulk operations
4. **Upload Shortlists** via CSV/Excel
5. **Export Data** for reporting

## 📸 Screenshots

### Student Dashboard
- Clean, intuitive interface for job browsing
- Real-time application status updates
- Easy resume and cover letter upload

### Admin Dashboard
- Comprehensive application management
- Bulk status update functionality
- CSV/Excel shortlist upload interface

### Application Management
- Detailed application cards with student info
- Real-time status updates
- Bulk operations and filtering

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon Highlights

### Technical Achievements
- **Full-Stack Development**: Modern React + FastAPI architecture
- **Real-time Features**: Live data synchronization with Supabase
- **File Processing**: Automated CSV/Excel handling with pandas
- **Scalable Design**: Modular, maintainable codebase
- **Performance**: Optimized queries and efficient data loading

### Innovation Features
- **Smart Job Matching**: Automated eligibility verification
- **Bulk Operations**: Efficient shortlisting process
- **Real-time Updates**: Live application status notifications
- **File Management**: Secure resume upload and download
- **Export Functionality**: Data export for external processing

### User Experience
- **Responsive Design**: Mobile-first approach
- **Intuitive Interface**: Clean, modern UI with Shadcn/ui
- **Error Handling**: Comprehensive error boundaries
- **Loading States**: Smooth user experience with loading indicators

## 👥 Team

- **Developer**: RVCE oa-coders Team
- **Institution**: RVCE College
- **Project**: Hackathon 2025 Entry



---

**Built with ❤️ for RVCE College Placement Department**
