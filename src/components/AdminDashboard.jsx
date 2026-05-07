import React from 'react';
import './AdminDashboard.css';

const AdminDashboard = ({ config, setConfig, leadData, onLeadDataUpdate }) => {
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

  return (
    <div className="admin-dashboard">
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
