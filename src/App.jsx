import React, { useState, useEffect } from 'react';
import ChatWidget from './components/ChatWidget';
import AdminDashboard from './components/AdminDashboard';
import './App.css'; // Assuming there is an App.css

function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [chatbotConfig, setChatbotConfig] = useState({
    mainProblem: "We need to onboard users, gather their information, and explain UnifySpace features tailored to their role.",
    aiPersona: "intelligent onboarding assistant",
    responseStyle: "Friendly, professional, curious. Short messages (max 3 sentences). Light punctuation. Feel human."
  });
  const [leadData, setLeadData] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('unifyspace_leads');
    if (stored) {
      try {
        setLeadData(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored lead data", e);
      }
    }
  }, []);

  const handleLeadDataUpdate = (newData) => {
    setLeadData(newData);
    localStorage.setItem('unifyspace_leads', JSON.stringify(newData));
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-brand">UnifySpace</div>
        <div className="nav-links">
          <button 
            className={`nav-btn ${currentTab === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentTab('home')}
          >
            Home
          </button>
          <button 
            className={`nav-btn ${currentTab === 'admin' ? 'active' : ''}`}
            onClick={() => setCurrentTab('admin')}
          >
            Admin Dashboard
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentTab === 'home' ? (
          <div className="landing-container">
            <h1 className="hero-title">UnifySpace</h1>
            <p className="hero-subtitle">
              The ultimate unified workspace for high-performing teams. 
              Streamline your HR, CRM, and Projects in one beautiful place.
            </p>
            {/* The intelligent onboarding assistant */}
            <ChatWidget config={chatbotConfig} onLeadDataUpdate={handleLeadDataUpdate} />
          </div>
        ) : (
          <AdminDashboard 
            config={chatbotConfig} 
            setConfig={setChatbotConfig} 
            leadData={leadData} 
            onLeadDataUpdate={handleLeadDataUpdate} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
