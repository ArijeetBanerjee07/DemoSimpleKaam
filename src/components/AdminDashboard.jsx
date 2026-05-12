import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './AdminDashboard.css';

const AdminDashboard = ({ config, setConfig, leadData, onLeadDataUpdate, currentUser, setCurrentUser, showGoogleModal, setShowGoogleModal }) => {
  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLeadDataChange = (e) => {
    if (!leadData) return;
    const { name, value } = e.target;
    onLeadDataUpdate({
      ...leadData,
      [name]: value
    });
  };

  const handleGoogleSuccess = (credentialResponse) => {
    console.log('Google Auth Success:', credentialResponse);
    // In a real app, you would send credentialResponse.credential to your backend to verify
    if (currentUser) {
      setCurrentUser(prev => ({ ...prev, isUnverified: false }));
    }
    setShowGoogleModal(false);
  };

  const handleGoogleError = () => {
    console.error('Google Auth Failed');
    alert('Google authentication failed. Please try again.');
  };

  return (
    <div className="admin-dashboard">
      {/* ── Google Verification Modal ── */}
      {showGoogleModal && (
        <div className="google-modal-overlay">
          <div className="google-modal">
            <div className="google-icon-wrapper">
              <svg viewBox="0 0 24 24" width="40" height="40">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <h2>Verify Your Account</h2>
            <p>To access the dashboard features, please verify your Google account for <strong>{currentUser?.email}</strong>.</p>
            <div className="google-btn-container">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="filled_blue"
                shape="pill"
                width="100%"
              />
            </div>
            <p className="modal-footer">This ensures your workspace remains secure and private.</p>
          </div>
        </div>
      )}

      {currentUser && (
        <div className="welcome-banner">
          <span className="welcome-avatar">{(currentUser.name || currentUser.email)?.[0]?.toUpperCase() || '?'}</span>
          <div>
            <h3 className="welcome-name">Welcome, {currentUser.name || 'User'}! 👋</h3>
            <p className="welcome-meta">
              {currentUser.isUnverified && <span className="unverified-badge">Verification Pending</span>}
              {currentUser.role && <span>{currentUser.role}</span>}
              {currentUser.company && <span> · {currentUser.company}</span>}
              <span> · {currentUser.email}</span>
            </p>
          </div>
        </div>
      )}
      <h2>Admin Dashboard - Chatbot Persona Configuration</h2>
      <div className="form-group">
        <label>Main Goal / Problem:</label>
        <textarea 
          name="mainProblem" 
          value={config.mainProblem} 
          onChange={handleConfigChange}
          rows="3"
        />
      </div>
      <div className="form-group">
        <label>AI Persona:</label>
        <input 
          type="text" 
          name="aiPersona" 
          value={config.aiPersona} 
          onChange={handleConfigChange}
        />
      </div>
      <div className="form-group">
        <label>Response Style:</label>
        <textarea 
          name="responseStyle" 
          value={config.responseStyle} 
          onChange={handleConfigChange}
          rows="3"
        />
      </div>

      <div className="preview-section">
        <h3>Extracted Lead Data (Editable)</h3>
        {leadData ? (
          <div className="lead-data-grid">
            <div className="data-item">
              <strong>Name:</strong> 
              <input type="text" name="name" value={leadData.name || ''} onChange={handleLeadDataChange} placeholder="N/A" />
            </div>
            <div className="data-item">
              <strong>Role:</strong> 
              <input type="text" name="role" value={leadData.role || ''} onChange={handleLeadDataChange} placeholder="N/A" />
            </div>
            <div className="data-item">
              <strong>Team Size:</strong> 
              <input type="text" name="team_size" value={leadData.team_size || ''} onChange={handleLeadDataChange} placeholder="N/A" />
            </div>
            <div className="data-item">
              <strong>Location:</strong> 
              <input type="text" name="location" value={leadData.location || ''} onChange={handleLeadDataChange} placeholder="N/A" />
            </div>
            <div className="data-item">
              <strong>Phone:</strong> 
              <input type="text" name="phone" value={leadData.phone || ''} onChange={handleLeadDataChange} placeholder="N/A" />
            </div>
            <div className="data-item">
              <strong>Persona:</strong> 
              <input type="text" name="persona" value={leadData.persona || ''} onChange={handleLeadDataChange} placeholder="N/A" />
            </div>
            <div className="data-item full-width">
              <strong>Pain Point:</strong> 
              <input type="text" name="pain_point" value={leadData.pain_point || ''} onChange={handleLeadDataChange} placeholder="N/A" />
            </div>
          </div>
        ) : (
          <p className="no-data">No lead data extracted yet. Have a conversation with the chatbot first!</p>
        )}
      </div>

      <div className="preview-section">
        <h3>Current Persona Configuration</h3>
        <pre>{JSON.stringify(config, null, 2)}</pre>
      </div>
    </div>
  );
};

export default AdminDashboard;
