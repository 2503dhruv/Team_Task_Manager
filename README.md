# Team Task Manager

A full-stack web application for managing team tasks, projects, and meetings. Built with React, Express.js, and MongoDB, this application enables teams to collaborate effectively by organizing tasks, scheduling meetings, and tracking project progress.

## 🌟 Features

- **User Authentication**: Secure login and registration with JWT-based authentication
- **Task Management**: Create, update, and manage tasks with status tracking
- **Project Management**: Organize tasks into projects and monitor project progress
- **Meeting Scheduling**: Schedule and manage team meetings
- **Real-time Updates**: Dynamic dashboard with project and task statistics
- **Responsive Design**: Modern UI built with React and Tailwind CSS
- **Data Visualization**: Charts and visualizations using Recharts

## 🛠️ Tech Stack

### Backend
- **Node.js** & **Express.js** - Server framework
- **MongoDB** & **Mongoose** - Database and ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-Origin Resource Sharing

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router v7** - Client-side routing
- **Axios** - HTTP client
- **Framer Motion** - Animations
- **React Big Calendar** - Calendar component
- **Recharts** - Data visualization
- **Lucide React** - Icon library

## 📁 Project Structure

```
Team_Task_Manager/
├── backend/
│   ├── index.js                 # Express server entry point
│   ├── package.json             # Backend dependencies
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Task.js              # Task schema
│   │   ├── Project.js           # Project schema
│   │   └── Meeting.js           # Meeting schema
│   └── routes/
│       ├── auth.js              # Authentication endpoints
│       ├── tasks.js             # Task management endpoints
│       ├── projects.js          # Project management endpoints
│       └── meetings.js          # Meeting endpoints
│
├── frontend/
│   ├── index.html               # HTML entry point
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.js           # Vite configuration
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── eslint.config.js         # ESLint configuration
│   ├── src/
│   │   ├── main.jsx             # React entry point
│   │   ├── App.jsx              # Main app component
│   │   ├── App.css              # App styles
│   │   ├── index.css            # Global styles
│   │   ├── api.js               # Axios API configuration
│   │   ├── pages/
│   │   │   ├── Landing.jsx      # Landing page
│   │   │   ├── Login.jsx        # Login page
│   │   │   └── Dashboard.jsx    # Main dashboard
│   │   └── assets/              # Static assets
│   └── public/                  # Public assets
│
└── README.md                    # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Team_Task_Manager
```

2. **Backend Setup**
```bash
cd backend
npm install
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install
```

### Configuration

1. **Backend Environment Variables**
   - Create a `.env` file in the `backend` directory
   - Add your MongoDB connection string and JWT secret:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

2. **Frontend Configuration**
   - Update the API base URL in `src/api.js` if needed (default: `http://localhost:5000`)

## ▶️ Running the Application

### Development Mode

**Terminal 1 - Start Backend**
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5000`

**Terminal 2 - Start Frontend**
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

### Production Mode

**Backend**
```bash
cd backend
npm start
```

**Frontend**
```bash
cd frontend
npm run build
npm run preview
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Meetings
- `GET /api/meetings` - Get all meetings
- `POST /api/meetings` - Create a new meeting
- `GET /api/meetings/:id` - Get meeting by ID
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting

## 🔒 Authentication

The application uses JWT (JSON Web Tokens) for authentication. Protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## 🧹 Code Quality

### Linting
```bash
cd frontend
npm run lint
```

## 📝 License

This project is licensed under the ISC License.

## 👥 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

For support and questions, please create an issue in the repository.