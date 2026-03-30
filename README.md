# 🏥 MediConnect — Hospital Management System

A production-ready full-stack Hospital Management System built with Node.js, Express, MongoDB, Socket.IO, and Vanilla JS.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (or MongoDB Atlas URI)
- Gmail account (for OTP emails, or any SMTP provider)

### 1. Install Dependencies
```bash
npm install
```
sword: `Admin@123`

### 2. Run Development Server
```bash
npm run dev
```

Open: **http://localhost:5000**

---

## 🗂️ Project Structure

```
hospital-management/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Signup, Login, OTP
│   │   ├── doctorController.js   # Doctor CRUD + requests
│   │   ├── patientController.js  # Patient appointments + ratings
│   │   ├── adminController.js    # Admin management
│   │   └── chatController.js     # Chat + file upload
│   ├── middleware/
│   │   ├── auth.js               # JWT + RBAC middleware
│   │   └── upload.js             # Multer file handling
│   ├── models/
│   │   ├── User.js               # User model
│   │   ├── Doctor.js             # Doctor profile model
│   │   ├── Patient.js            # Patient profile model
│   │   ├── Appointment.js        # Consultation/request model
│   │   └── Chat.js               # Chat + messages model
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── patientRoutes.js
│   │   ├── adminRoutes.js
│   │   └── chatRoutes.js
│   ├── utils/
│   │   ├── email.js              # Nodemailer OTP emails
│   │   ├── jwt.js                # JWT generate/verify
│   │   └── seedAdmin.js          # Admin seeder script
│   └── server.js                 # Express + Socket.IO server
├── frontend/
│   ├── css/
│   │   ├── style.css             # Global design system
│   │   └── chat.css              # Chat UI styles
│   ├── js/
│   │   └── api.js                # API client + utilities
│   ├── pages/
│   │   ├── signup.html           # Registration + OTP
│   │   ├── login.html            # Login page
│   │   ├── dashboard.html        # Doctor/Patient dashboard
│   │   ├── doctor-profile-setup.html
│   │   ├── chat.html             # Real-time chat
│   │   └── admin.html            # Admin panel
│   └── index.html                # Landing page
├── uploads/                      # Auto-created for file storage
│   ├── profiles/
│   └── chat/
├── .env
└── package.json
```

---

## 👥 User Flows

### Patient Flow
1. Sign up → Email OTP verification
2. Browse doctors by specialization/problem
3. Send consultation request
4. Chat after doctor accepts
5. Rate consultation after closure

### Doctor Flow
1. Sign up → OTP verification
2. Create profile (specialization, experience, photo, fee)
3. Wait for admin approval
4. Accept/reject patient requests
5. Chat with patients
6. Close consultations

### Admin Flow
1. Login with seeded credentials
2. Review and approve/reject doctor profiles
3. View all users and doctors
4. Monitor system statistics

---

## ⚡ Key Features

| Feature | Details |
|---------|---------|
| **Auth** | JWT + Email OTP via Nodemailer |
| **RBAC** | Admin / Doctor / Patient roles |
| **Real-time Chat** | Socket.IO with typing indicators |
| **File Sharing** | Multer, stored in /uploads |
| **Doctor Search** | Filter by specialization, fee, rating |
| **Rating System** | 1-5 stars after consultation close |
| **Online Status** | Live via Socket.IO events |
| **Notifications** | In-app + email notifications |
| **Admin Panel** | Stats, approvals, user management |
| **Rate Limiting** | express-rate-limit (200 req/15min) |

---

## 🔌 API Endpoints

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/verify-otp`
- `POST /api/auth/resend-otp`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET  /api/auth/me`

### Doctors
- `GET  /api/doctors` (public, filterable)
- `GET  /api/doctors/:id`
- `POST /api/doctors/profile` (create)
- `PUT  /api/doctors/profile` (update)
- `GET  /api/doctors/requests/all`
- `POST /api/doctors/requests/respond`
- `POST /api/doctors/consultation/close`

### Patients
- `GET  /api/patient/profile`
- `PUT  /api/patient/profile`
- `POST /api/patient/request`
- `GET  /api/patient/appointments`
- `POST /api/patient/rate`

### Admin
- `GET  /api/admin/stats`
- `GET  /api/admin/doctors`
- `POST /api/admin/doctors/action`
- `GET  /api/admin/users`
- `DELETE /api/admin/users/:id`

### Chat
- `GET  /api/chat/:appointmentId`
- `POST /api/chat/upload`

---

## 🛡️ Security
- bcryptjs password hashing (salt rounds: 12)
- JWT authentication on all protected routes
- Role-based access middleware
- Rate limiting on all API routes
- File type validation for uploads
- Input validation on all endpoints
