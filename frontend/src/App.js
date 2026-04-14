import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import TaskBoard from './pages/TaskBoard';
import Templates from './pages/Templates';
import OnboardingDetail from './pages/OnboardingDetail';
import Chatbot from './pages/Chatbot';
import KnowledgeBase from './pages/KnowledgeBase';
import ProfileSelector from './pages/ProfileSelector';
import './App.css';

function AppContent() {
  const { user } = useUser();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    try { return localStorage.getItem('sidebar_collapsed') === 'true'; } catch { return false; }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      localStorage.setItem('sidebar_collapsed', String(!prev));
      return !prev;
    });
  };

  if (!user) return <ProfileSelector />;

  const role = user.role;

  return (
    <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <TopBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskBoard />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />

          {(role === 'hr' || role === 'manager' || role === 'mentor') && (
            <Route path="/onboardings/:id" element={<OnboardingDetail />} />
          )}

          {(role === 'hr' || role === 'manager') && (
            <Route path="/templates" element={<Templates />} />
          )}

          {(role === 'hr' || role === 'newcomer') && (
            <Route path="/chat" element={<Chatbot />} />
          )}

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Router>
          <AppContent />
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
