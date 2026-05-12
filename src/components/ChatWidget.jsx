import React, { useState, useEffect, useRef } from 'react';
import './ChatWidget.css';
import { chatWithAssistant, extractLeadData } from '../services/groq';
import { saveLead, getUser } from '../services/api';

// ── helpers ───────────────────────────────────────────────────────────────────

const isEmailValid = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());

const SESSION_KEY = 'unifyspace_current_user';
const getSession  = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } };

// ── system prompt ─────────────────────────────────────────────────────────────

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
Once they express interest or after you've made your pitch, ask for their email address to set up their personalized dashboard. 
End that message with exactly: "What's your email address so I can set up your dashboard? 📧"

TONE & STYLE: 
${config.responseStyle}

RESPONSE LENGTH — CRITICAL:
- Maximum 1–2 sentences per reply. Always.
- Never write paragraphs or combine multiple ideas.
- Ask only ONE question per message.
- Think "text message", not "email".
`;

// ── chat phases ────────────────────────────────────────────────────────────────
// 'chatting'  — normal AI conversation
// 'ask_email' — bot manually asks for email
// 'done'      — conversation complete, handing off

// ── component ─────────────────────────────────────────────────────────────────

const ChatWidget = ({ config, onLeadDataUpdate, onReadyForDashboard, autoOpen = false }) => {
  const [isOpen, setIsOpen]               = useState(autoOpen);
  const [showLabel, setShowLabel]         = useState(false);
  const [isTyping, setIsTyping]           = useState(false);
  const [messages, setMessages]           = useState([]);
  const [history, setHistory]             = useState([{ role: 'system', content: buildSystemPrompt(config) }]);
  const [inputValue, setInputValue]       = useState('');
  const [currentPersona, setCurrentPersona] = useState('Online');
  const [phase, setPhase]                 = useState('chatting'); // 'chatting' | 'ask_email' | 'done'
  const [msgCount, setMsgCount]           = useState(0);         // user message count
  const [extractedName, setExtractedName] = useState('');
  const messagesEndRef = useRef(null);
  const startedRef     = useRef(false);

  // If user already logged in, greet differently
  const loggedInUser = getSession();

  // Update system prompt when config changes
  useEffect(() => {
    setHistory(prev => {
      const next = [...prev];
      if (next[0]?.role === 'system') next[0].content = buildSystemPrompt(config);
      else next.unshift({ role: 'system', content: buildSystemPrompt(config) });
      return next;
    });
  }, [config]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
  useEffect(() => { 
    const t = setTimeout(() => setShowLabel(true), 3000); 
    if (autoOpen) startConversation();
    return () => clearTimeout(t); 
  }, []);

  const addMessage = (text, sender = 'ai', reaction = null, empathy = false) =>
    setMessages(prev => [...prev, { text, sender, reaction, empathy }]);

  // ── start conversation ──────────────────────────────────────────────────────
  const startConversation = async () => {
    if (startedRef.current || messages.length > 0) return;
    startedRef.current = true;
    setIsTyping(true);
    let firstMsg;
    if (loggedInUser) {
      firstMsg = `Hey ${loggedInUser.name}! 👋 Welcome back. How can I help you with UnifySpace today?`;
    } else {
      firstMsg = "Hey! 👋 Glad you stopped by. I'm curious — what kind of team are you managing these days?";
    }
    setTimeout(() => {
      setIsTyping(false);
      addMessage(firstMsg);
      setHistory(prev => [...prev, { role: 'assistant', content: firstMsg }]);
    }, 1000);
  };

  const handleToggle = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) startConversation();
  };

  // ── email phase: validate & hand off ───────────────────────────────────────
  const handleEmailSubmit = async (rawInput) => {
    const trimmed = rawInput.trim();
    if (!isEmailValid(trimmed)) {
      addMessage("That doesn't look like a valid email address. Could you double-check it? 🙏", 'ai');
      return;
    }

    // Perfect — wrap up
    setPhase('done');
    setIsTyping(true);
    const closingMsg = `Awesome! 🎉 I've got everything I need. Let me take you to your personalised dashboard right now!`;
    setTimeout(() => {
      setIsTyping(false);
      addMessage(closingMsg, 'ai');
      // Short delay, then hand off
      setTimeout(() => {
        if (onReadyForDashboard) {
          onReadyForDashboard({ email: trimmed, name: extractedName });
        }
      }, 1800);
    }, 1000);
  };

  // ── main send handler ───────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!inputValue.trim() || isTyping || phase === 'done') return;
    const userText = inputValue.trim();

    // ── If in email phase OR user types an email proactively ────────────────
    if (phase === 'ask_email' || (phase === 'chatting' && isEmailValid(userText))) {
      addMessage(userText, 'user');
      setInputValue('');
      await handleEmailSubmit(userText);
      return;
    }

    // Normal AI conversation
    addMessage(userText, 'user');
    setInputValue('');
    setIsTyping(true);

    const newCount = msgCount + 1;
    setMsgCount(newCount);

    const updatedHistory = [...history, { role: 'user', content: userText }];
    setHistory(updatedHistory);
    const response = await chatWithAssistant(updatedHistory);
    setIsTyping(false);

    // ── Dynamic Phase Switch ──
    // If the AI actually asked for the email (detected by emoji or specific phrase), switch phase
    if (phase === 'chatting' && (response.includes('📧') || response.toLowerCase().includes('email address'))) {
      setPhase('ask_email');
    }

    const isEmpathetic = /understand|hear you|frustrating/i.test(response);

    // Persona detection
    if (/hr|recruit|people/i.test(userText))          setCurrentPersona('HR Specialist Mode');
    if (/sales|crm|marketing/i.test(userText))        setCurrentPersona('CRM Assistant Mode');
    if (/pm|project|manager|ops/i.test(userText))     setCurrentPersona('PM Specialist Mode');
    if (/ceo|founder|executive/i.test(userText))      setCurrentPersona('Executive Mode');

    addMessage(response, 'ai', /name/i.test(userText) ? '👋' : null, isEmpathetic);
    setHistory(prev => [...prev, { role: 'assistant', content: response }]);

    // Extract lead data periodically and save to DB
    if (newCount > 3) {
      const leadData = await extractLeadData(
        updatedHistory.map(h => `${h.role}: ${h.content}`).join('\n')
      );
      if (leadData) {
        if (leadData.name) setExtractedName(leadData.name);
        const currentUser = getUser();
        try {
          await saveLead({ ...leadData, userId: currentUser?._id });
        } catch { /* fall back silently */ }
        if (onLeadDataUpdate) onLeadDataUpdate(leadData);
      }
    }
  };

  const inputPlaceholder =
    phase === 'ask_email' ? 'Enter your email address…' :
    phase === 'done'      ? 'Taking you to the dashboard…' :
    'Type a message…';

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`chat-widget-container ${isOpen ? 'open' : ''}`}>
      <button className="widget-button" onClick={handleToggle}>
        <div className="pulse-ring" />
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
              <span className="online-dot" />
              <div className="header-text">
                <h3>UnifySpace Assistant</h3>
                <p className="subtitle">{currentPersona}</p>
              </div>
            </div>
            <button className="close-button" onClick={() => setIsOpen(false)}>×</button>
          </div>

          {/* Email phase progress bar */}
          {phase === 'ask_email' && (
            <div className="email-phase-banner">
              <span className="phase-icon">📧</span>
              <span>Almost there — just need your email!</span>
            </div>
          )}
          {phase === 'done' && (
            <div className="email-phase-banner done">
              <span className="phase-icon">🚀</span>
              <span>Setting up your dashboard…</span>
            </div>
          )}

          <div className="messages-container">
            {messages.map((msg, i) => (
              <div key={i} className={`message-bubble ${msg.sender} ${msg.empathy ? 'empathy-border' : ''}`}>
                {msg.text}
                {msg.reaction && <span className="reaction">{msg.reaction}</span>}
              </div>
            ))}
            {isTyping && (
              <div className="message-bubble ai typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              type={phase === 'ask_email' ? 'email' : 'text'}
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isTyping || phase === 'done'}
            />
            <button
              className="send-button"
              onClick={handleSend}
              disabled={isTyping || phase === 'done'}
            >
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
