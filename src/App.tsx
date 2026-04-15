import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './pages/Dashboard';
import BrandProfiles from './pages/BrandProfiles';
import ContentGenerator from './pages/ContentGenerator';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Initialize theme
    const applyTheme = () => {
      const savedTheme = localStorage.getItem('theme') || 'light';
      const root = document.documentElement;
      if (savedTheme === 'dark') {
        root.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        root.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    };

    applyTheme();
    window.addEventListener('theme-change', applyTheme);

    return () => {
      unsubscribe();
      window.removeEventListener('theme-change', applyTheme);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={user ? <Layout /> : <Navigate to="/auth" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="brand-profiles" element={<BrandProfiles />} />
          <Route path="generator" element={<ContentGenerator />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
