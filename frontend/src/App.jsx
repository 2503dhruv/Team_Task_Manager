import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const isAuthenticated = !!sessionStorage.getItem('token');

  return (
    <Router>
      <div className="min-h-screen font-sans text-slate-800 bg-slate-50 selection:bg-indigo-200">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;