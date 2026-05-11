const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// Injected into every chat call to enforce short, chat-like replies
const BREVITY_RULE = {
  role: "system",
  content:
    "STRICT RULE: Reply in 1–2 short sentences only. No paragraphs. No lists. No long explanations. Be conversational, like a text message. Never combine multiple questions or topics in one reply."
};

export const chatWithAssistant = async (messages) => {
  try {
    // Insert the brevity rule right before the last user message
    // so it overrides any verbose tendencies from the main system prompt
    const messagesWithBrevity = [...messages, BREVITY_RULE];

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messagesWithBrevity,
        temperature: 0.7,
        max_tokens: 80  // ~2 short sentences hard cap
      })
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error("Groq API HTTP error:", response.status, errBody);
      return "Something went wrong on my end. Could you try again?";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "I didn't catch that — could you say it again?";
  } catch (error) {
    console.error("Groq API Error:", error);
    return "I'm having trouble connecting right now. Please check your internet and try again.";
  }
};

export const extractLeadData = async (conversationHistory) => {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `Extract lead data from the following conversation. Return ONLY a JSON object with these keys: name, role, team_size, location, phone, pain_point, persona (HR | CRM | PM | Executive | Unknown). If a value is missing, use "".`
          },
          {
            role: "user",
            content: conversationHistory
          }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      console.error("Groq extraction HTTP error:", response.status);
      return null;
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Extraction Error:", error);
    return null;
  }
};
