# HMS — Modern Hospital Management System

A production-ready, full-stack Hospital Management System (HMS) designed with a focus on modern aesthetics, security, and real-time communication. This platform provides specialized interfaces for Administrators, Doctors, and Patients, facilitating seamless healthcare management.

---

## 🚀 Key Features

### 🔐 Role-Based Access Control (RBAC)
- **Admin Dashboard**: Verification of doctors, user management, and system-wide overview.
- **Doctor Dashboard**: Manage consultations, view patient medical history, and handle appointments.
- **Patient Dashboard**: Profile management, medical records storage, and appointment booking.

### 💬 Real-time Communication
- Instant messaging between doctors and patients powered by **Socket.io**.
- Persistent chat history stored in MongoDB.

### 📅 Appointment Management
- Integrated scheduling system for consultations.
- Status tracking (Pending, Approved, Rejected).

### ☁️ Profile & Cloud Storage
- Seamless image and document uploads using **Multer**.
- Secure cloud storage for all assets via **Cloudinary**.

### 📧 Automated Notifications
- Email verification and notifications using **Brevo (Sendinblue)**.
- Secure OTP-based registration and password recovery.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: Node.js & Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: Socket.io
- **Security**: JWT (Authentication) & BcryptJS (Hashing)
- **Storage**: Cloudinary API
- **Communications**: Brevo API

### Frontend
- **Structure**: Semantic HTML5 (Multi-page Application)
- **Styling**: Vanilla CSS3 with Modern Design Systems (Flexbox, Grid, Animations)
- **Logic**: Modular Vanilla JavaScript (ES6+)

---

## 📂 Project Structure

```bash
HMS/
├── backend/
│   ├── config/      # Database & Environment configuration
│   ├── controllers/ # Business logic handlers
│   ├── middleware/  # Auth guards & Upload handlers
│   ├── models/      # Mongoose Schemas (User, Profile, Message, etc.)
│   ├── routes/      # API Endpoint definitions
│   ├── socket/      # WebSocket event logic
│   └── server.js    # Entry point
├── frontend/
│   ├── css/         # Design system & Enhanced styles
│   ├── js/          # Modular client-side scripts (api.js, auth.js, etc.)
│   ├── img/         # Static assets
│   └── *.html       # Dedicated pages (Admin, Doctor, Patient dashboards)
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account or local MongoDB instance
- Cloudinary account
- Brevo (Sendinblue) API Key

### Installation
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd HMS
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend` directory and add the following:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_name
   CLOUDINARY_API_KEY=your_key
   CLOUDINARY_API_SECRET=your_secret
   BREVO_API_KEY=your_brevo_key
   EMAIL_FROM=your_email
   ```

4. **Run the Application**:
   ```bash
   # From the backend directory
   npm run dev
   ```
   The server will start at `http://localhost:5000` and serve the frontend statically.

---

## 🎨 Design Philosophy
The system utilizes a **Premium Design System** with:
- **HSL-tailored colors**: Sophisticated teal and slate palettes.
- **Micro-animations**: Smooth transitions and hover effects for a tactile feel.
- **Responsive Layouts**: Optimized for both desktop and mobile accessibility.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

