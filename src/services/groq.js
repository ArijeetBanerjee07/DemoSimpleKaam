const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export const chatWithAssistant = async (messages) => {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Powerful and fast
        messages: messages,
        temperature: 0.7,
        max_tokens: 150
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Groq API Error:", error);
    return "I'm having a little trouble connecting right now, but I'm still here! What were we talking about?";
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
        model: "llama-3.1-8b-instant", // Faster for extraction
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

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Extraction Error:", error);
    return null;
  }
};
