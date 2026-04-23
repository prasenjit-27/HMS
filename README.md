# 🏥 Hospital Management System (HMS)

A full-stack **Hospital Management System (HMS)** built with a structured, real-world workflow to streamline hospital operations, enable secure communication, and manage users efficiently using **Role-Based Access Control (RBAC)**.

---

## 🚀 Features

### 🔐 Authentication & Security
- JWT-based authentication  
- Email verification for signup  
- Protected routes using middleware  

### 👥 Role-Based Access Control (RBAC)
- **Admin**
  - Verify doctors  
  - Approve/reject registrations  
  - Manage (delete) users  

- **Doctor**
  - Register and get verified by admin  
  - Manage patient interactions  
  - Accept/reject consultation requests  

- **Patient**
  - Signup/login with email verification  
  - Choose doctors  
  - Request consultations  

### 💬 Real-Time Communication
- 1:1 chat between doctor and patient using **Socket.IO**

### 📊 Core Functionalities
- Doctor registration & verification flow  
- Patient-doctor interaction system  
- Admin panel for centralized control  
- Clean and structured workflow  

---

## 🛠️ Tech Stack

### Frontend
- HTML  
- CSS  
- JavaScript  
*(Served as static files from the `frontend` folder)*

### Backend
- Node.js  
- Express.js  

### Additional Technologies
- **Database:** MongoDB  
- **Real-time:** Socket.IO  
- **Authentication:** JWT  
- **Media Storage:** Cloudinary  

---

## 📁 Project Structure
```
HMS/
│
├── backend/
│ ├── config/
│ ├── controllers/
│ ├── middleware/
│ ├── models/
│ ├── routes/
│ ├── socket/
│ ├── utils/
│ ├── server.js
│ └── cleanup.js
│
├── frontend/
│ ├── css/
│ ├── img/
│ ├── js/
│ ├── index.html
│ ├── login.html
│ ├── register.html
│ ├── admin-dashboard.html
│ ├── doctor-dashboard.html
│ ├── patient-dashboard.html
│ └── chat.html
│
├── .env
├── package.json
└── README.md
```


---

## 🔄 Workflow Overview

1. User signs up (Patient/Doctor) with email verification  
2. Doctor accounts go through **admin verification**  
3. Admin can **approve or reject** doctor registrations  
4. Patients can **choose doctors** and send requests  
5. Doctors can **accept requests**  
6. Once accepted → **1:1 chat enabled (Socket.IO)**  

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
cd backend
npm install
npm run dev

```

## 🌐 Live Deployed Link
👉 [Click Here](https://hms-apnh.onrender.com/)

---


## 🤝 Contributing
Contributions are welcome! Feel free to fork the repo and submit a pull request.

---

## ⭐ Support
If you like this project, consider giving it a ⭐ on GitHub!
