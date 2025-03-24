const axios = require('axios');
const fs = require('fs');
const Fuse = require('fuse.js');
const { getTranslations } = require('./translations');

const trainingData = JSON.parse(fs.readFileSync("training_data.json", "utf8"));
const fuse = new Fuse(trainingData, { keys: ["instruction"], threshold: 0.4 });

const system_role = "You are a helpful customer support assistant called klikBot for <Your organization name>. " + 
                    "Assist users with product inquiries, troubleshooting, and general questions. Redirect to human " + 
                    "support if needed via your-name@your-domain.com or WhatsApp wa.me/6<your-other-number>. Reply in Malay if detected. " + 
                    "Avoid Indonesian language. Focus on inquired product only.";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const detectLanguageLocal = (text) => {
    if (/\b(saya|anda|boleh|tidak|terima kasih)\b/i.test(text)) return "Malay";
    return "English";
};

const getWaitMessage = (language) => {
    const translations = getTranslations();
    return translations[language] || translations["English"];
};

const findBestAnswer = (query) => {
    const result = fuse.search(query);
    return result.length > 0 ? result[0].item.output : null;
};

const callDeepSeekAPI = async (prompt) => {
    try {
        const response = await axios.post(
            DEEPSEEK_API_URL,
            {
                model: "deepseek-chat",
                messages: [{ role: "system", content: system_role }, { role: "user", content: prompt }],
                temperature: 0.5
            },
            {
                headers: {
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('❌ DeepSeek API Error:', error.message);
        throw new Error('DeepSeek failed');
    }
};

const callOpenAIAPI = async (prompt) => {
    try {
        const response = await axios.post(
            OPENAI_API_URL,
            {
                model: "gpt-4",
                messages: [{ role: "system", content: system_role }, { role: "user", content: prompt }],
                temperature: 0.5
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('❌ OpenAI API Error:', error.message);
        return "Sorry, I couldn't process your request. Contact support at your-name@your-domain.com.";
    }
};

const generateAIReply = async (userMessage, history) => {
    const faqAnswer = findBestAnswer(userMessage);
    const prompt = faqAnswer 
        ? faqAnswer 
        : `Business context:\n${fs.readFileSync("training_data.json", "utf8")}\n\nUser: ${userMessage}`;

    const fullPrompt = `${prompt}\n\nPrevious Conversations:\n${history}\nUser: ${userMessage}\nBot:`;

    try {
        return await callDeepSeekAPI(fullPrompt);
    } catch {
        return await callOpenAIAPI(fullPrompt);
    }
};

module.exports = { detectLanguageLocal, getWaitMessage, generateAIReply };
