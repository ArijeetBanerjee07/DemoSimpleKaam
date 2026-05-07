import React, { useState, useEffect, useRef } from 'react';
import './ChatWidget.css';
import { chatWithAssistant, extractLeadData } from '../services/groq';

const buildSystemPrompt = (config) => `
You are an ${config.aiPersona || "intelligent onboarding assistant"} for "UnifySpace" — a unified workspace platform designed for teams of all kinds (HR, CRM, PM, Ops, etc.).

MISSION: Have a warm, natural conversation. You are NOT a form or a scripted bot.

MAIN GOAL / PROBLEM TO SOLVE: 
${config.mainProblem}

CRITICAL INSTRUCTION - OFF-TOPIC QUERIES:
If the user asks ANY question not related to UnifySpace, team management, workflows, professional roles, or the platform (e.g., "How to make a tea?", "What is the capital of France?", "Write me a poem"), you MUST politely decline and redirect them.
Example response: "I'm sorry, but this isn't the platform for that. I'm here to help you with UnifySpace and your work processes. How can I assist you with your team's workflow?"

PHASE 1 — DISCOVERY:
Gather naturally: Name, Role/Job Title, Team size, Location/Country, Phone number (for a free demo), and biggest workflow pain point.
Rules: 
- NEVER ask more than ONE thing at a time.
- If they answer something you didn't ask, acknowledge and move forward.
- Be warm, curious, and empathetic.
- Use their name once you know it.
- Reaction: If the user mentions a pain point, make sure your tone is very empathetic.

PHASE 2 — PERSONA SWITCH:
Silently adapt your pitch based on their role:
- HR: AI resume screening, onboarding automation, leave management.
- CRM/Sales: lead pipeline, follow-up automation, deal tracking.
- PM/Ops: task assignment, bottleneck detection, dashboards.
- Executive: unified visibility, AI reports, productivity insights.

PHASE 3 — PITCH:
First, make them feel UNDERSTOOD ("That's a common problem for..."). 
Then transition into how UnifySpace solves it. Ask "Does that sound like something that would help you?"

TONE & STYLE: 
${config.responseStyle}
`;

const ChatWidget = ({ config, onLeadDataUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]); // { text, sender, reaction, empathy }
  const [history, setHistory] = useState([{ role: "system", content: buildSystemPrompt(config) }]);
  const [inputValue, setInputValue] = useState('');
  const [currentPersona, setCurrentPersona] = useState('Online');
  const messagesEndRef = useRef(null);

  // Update system prompt when config changes
  useEffect(() => {
    setHistory((prev) => {
      const newHistory = [...prev];
      if (newHistory.length > 0 && newHistory[0].role === "system") {
        newHistory[0].content = buildSystemPrompt(config);
      } else {
        newHistory.unshift({ role: "system", content: buildSystemPrompt(config) });
      }
      return newHistory;
    });
  }, [config]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const timer = setTimeout(() => setShowLabel(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const addMessage = (text, sender = 'ai', reaction = null, empathy = false) => {
    setMessages(prev => [...prev, { text, sender, reaction, empathy }]);
  };

  const startConversation = async () => {
    if (messages.length === 0) {
      setIsTyping(true);
      const firstMsg = "Hey! 👋 Glad you stopped by. I'm curious — what kind of team are you managing these days?";
      setTimeout(() => {
        setIsTyping(false);
        addMessage(firstMsg);
        setHistory(prev => [...prev, { role: "assistant", content: firstMsg }]);
      }, 1000);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) startConversation();
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue.trim();
    addMessage(userText, 'user');
    setInputValue('');
    setIsTyping(true);

    const updatedHistory = [...history, { role: "user", content: userText }];
    setHistory(updatedHistory);

    // Call Groq
    const response = await chatWithAssistant(updatedHistory);
    
    setIsTyping(false);
    
    // Simple empathy detection for UI border
    const isEmpathetic = response.toLowerCase().includes("understand") || 
                        response.toLowerCase().includes("hear you") || 
                        response.toLowerCase().includes("frustrating");

    // Simple persona detection for Header UI
    if (userText.toLowerCase().match(/hr|recruit|people/)) setCurrentPersona('HR Specialist Mode');
    if (userText.toLowerCase().match(/sales|crm|marketing/)) setCurrentPersona('CRM Assistant Mode');
    if (userText.toLowerCase().match(/pm|project|manager|ops/)) setCurrentPersona('PM Specialist Mode');
    if (userText.toLowerCase().match(/ceo|founder|executive/)) setCurrentPersona('Executive Mode');

    addMessage(response, 'ai', userText.toLowerCase().includes("name") ? "👋" : null, isEmpathetic);
    setHistory(prev => [...prev, { role: "assistant", content: response }]);

    // Periodically extract lead data in background
    if (updatedHistory.length > 4) {
      const leadData = await extractLeadData(updatedHistory.map(h => `${h.role}: ${h.content}`).join("\n"));
      if (leadData) {
        if (onLeadDataUpdate) onLeadDataUpdate(leadData);
        else localStorage.setItem('unifyspace_leads', JSON.stringify(leadData));
        console.log("LEAD DATA UPDATED:", leadData);
      }
    }
  };

  return (
    <div className={`chat-widget-container ${isOpen ? 'open' : ''}`}>
      <button className="widget-button" onClick={handleToggle}>
        <div className="pulse-ring"></div>
        <div className="button-content">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {showLabel && !isOpen && <span className="button-label">Chat with us</span>}
        </div>
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="header-info">
              <span className="online-dot"></span>
              <div className="header-text">
                <h3>UnifySpace Assistant</h3>
                <p className="subtitle">{currentPersona}</p>
              </div>
            </div>
            <button className="close-button" onClick={() => setIsOpen(false)}>&times;</button>
          </div>

          <div className="messages-container">
            {messages.map((msg, i) => (
              <div key={i} className={`message-bubble ${msg.sender} ${msg.empathy ? 'empathy-border' : ''}`}>
                {msg.text}
                {msg.reaction && <span className="reaction">{msg.reaction}</span>}
              </div>
            ))}
            {isTyping && (
              <div className="message-bubble ai typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input 
              type="text" 
              placeholder="Type a message..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={isTyping}
            />
            <button className="send-button" onClick={handleSend} disabled={isTyping}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
