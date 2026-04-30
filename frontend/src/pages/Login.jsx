import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Member' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const { data } = await API.post('/auth/login', { email: formData.email, password: formData.password });
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/dashboard'; // Force reload to trigger auth state
      } else {
        await API.post('/auth/register', formData);
        alert('Registration successful! Please log in.');
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-slate-900 text-white">
      {/* Dynamic blurred background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-60 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute top-[20%] left-[30%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-60 animate-blob animation-delay-4000"></div>

      <div className="relative w-full max-w-md p-8 bg-slate-800/40 backdrop-blur-2xl border border-slate-600/50 rounded-2xl shadow-2xl z-10">
        
        {/* Logo Element */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <h2 className="mb-2 text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="mb-8 text-center text-slate-400 text-sm">
          {isLogin ? 'Enter your credentials to access your workspace' : 'Join your team and start managing tasks'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-4">
              <input type="text" placeholder="Full Name" required 
                className="w-full p-3 text-white placeholder-slate-400 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-light"
                onChange={e => setFormData({...formData, name: e.target.value})} />
              <select 
                className="w-full p-3 text-white bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-light appearance-none"
                onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="Member" className="bg-slate-800 text-white">Student / Team Member</option>
                <option value="Admin" className="bg-slate-800 text-white">Admin</option>
              </select>
            </div>
          )}
          <input type="email" placeholder="Email Address" required 
            className="w-full p-3 text-white placeholder-slate-400 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-light"
            onChange={e => setFormData({...formData, email: e.target.value})} />
          <input type="password" placeholder="Password" required 
            className="w-full p-3 text-white placeholder-slate-400 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-light"
            onChange={e => setFormData({...formData, password: e.target.value})} />
          
          <button type="submit" className="w-full py-3 mt-4 text-white font-bold bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:from-indigo-400 hover:to-purple-500 transition-all duration-300 transform hover:-translate-y-0.5">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            {isLogin ? 'Create one now' : 'Log in instead'}
          </button>
        </p>
      </div>
    </div>
  );
}