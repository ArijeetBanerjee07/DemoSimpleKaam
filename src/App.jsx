import React, { useState, useEffect } from 'react';
import ChatWidget from './components/ChatWidget';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import { getUser, clearSession, fetchMe } from './services/api';
import './App.css';

function App() {
  const [currentTab, setCurrentTab]       = useState('home');
  const [chatbotConfig, setChatbotConfig] = useState({
    mainProblem:   "We need to onboard users, gather their information, and explain UnifySpace features tailored to their role.",
    aiPersona:     "intelligent onboarding assistant",
    responseStyle: "Friendly, professional, curious. Short messages (max 3 sentences). Light punctuation. Feel human.",
  });
  const [leadData, setLeadData]           = useState(null);
  const [currentUser, setCurrentUser]     = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAuth, setPendingAuth]     = useState(null);

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    const localUser = getUser();
    if (localUser) {
      setCurrentUser(localUser);
      // Silently validate token with server in background
      fetchMe().then(user => { if (user) setCurrentUser(user); }).catch(() => {});
    }
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLeadDataUpdate = (data) => setLeadData(data);

  const handleReadyForDashboard = ({ email, name }) => {
    setPendingAuth({ email, name });
    setCurrentTab('admin');
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    setShowAuthModal(false);
    setPendingAuth(null);
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setCurrentTab('home');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="nav-brand">UnifySpace</div>
        <div className="nav-links">
          <button id="nav-home"
            className={`nav-btn ${currentTab === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentTab('home')}>
            Home
          </button>
          <button id="nav-dashboard"
            className={`nav-btn ${currentTab === 'admin' ? 'active' : ''}`}
            onClick={() => { setCurrentTab('admin'); if (!currentUser) setShowAuthModal(true); }}>
            Dashboard
          </button>

          {currentUser ? (
            <div className="user-pill">
              <span className="user-avatar">{currentUser.name?.[0]?.toUpperCase() || '?'}</span>
              <span className="user-name">{currentUser.name}</span>
              <button id="nav-logout" className="nav-btn logout-btn" onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <button id="nav-login" className="nav-btn"
              onClick={() => { setCurrentTab('admin'); setShowAuthModal(true); }}>
              Log in
            </button>
          )}
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="main-content">
        {currentTab === 'home' ? (
          <div className="landing-container">
            <h1 className="hero-title">UnifySpace</h1>
            <p className="hero-subtitle">
              The ultimate unified workspace for high-performing teams.
              Streamline your HR, CRM, and Projects in one beautiful place.
            </p>
            <ChatWidget
              config={chatbotConfig}
              onLeadDataUpdate={handleLeadDataUpdate}
              onReadyForDashboard={handleReadyForDashboard}
            />
          </div>
        ) : (
          <AdminDashboard
            config={chatbotConfig}
            setConfig={setChatbotConfig}
            leadData={leadData}
            onLeadDataUpdate={handleLeadDataUpdate}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* ── Auth Modal ── */}
      {showAuthModal && (
        <AuthModal
          prefillEmail={pendingAuth?.email || ''}
          prefillName={pendingAuth?.name || ''}
          onAuthSuccess={handleAuthSuccess}
          onClose={() => { setShowAuthModal(false); if (!currentUser) setCurrentTab('home'); }}
        />
      )}
    </div>
  );
}

export default App;
