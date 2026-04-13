import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import TaskBoard from './pages/TaskBoard';
import Templates from './pages/Templates';
import Onboardings from './pages/Onboardings';
import OnboardingDetail from './pages/OnboardingDetail';
import Chatbot from './pages/Chatbot';
import KnowledgeBase from './pages/KnowledgeBase';
import ProfileSelector from './pages/ProfileSelector';
import './App.css';

function AppContent() {
  const { user } = useUser();

  if (!user) return <ProfileSelector />;

  return (
    <div className="app">
      <Sidebar />
      <TopBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskBoard />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/onboardings" element={<Onboardings />} />
          <Route path="/onboardings/:id" element={<OnboardingDetail />} />
          <Route path="/chat" element={<Chatbot />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
}

export default App;
