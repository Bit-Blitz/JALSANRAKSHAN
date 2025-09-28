// src/Chatbot.jsx

import React, { useState, useRef, useEffect } from 'react';

// --- SVG Icons (Self-Contained) ---
const ChatbotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.85 0 3.58-.5 5.09-1.36l-1.5-1.5A8.003 8.003 0 0 1 12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8v1c0 .55.45 1 1 1s1-.45 1-1v-1c0-5.52-4.48-10-10-10z" />
    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
);

const SummarizeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 000 1.5h11.5a.75.75 0 000-1.5H4.25zM4.25 9.5a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5h-7.5zM4.25 13.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" clipRule="evenodd" />
    </svg>  
);


// --- Hard-coded Knowledge Base for Rainwater Harvesting ---
const rainwaterKnowledgeBase = {
  "benefits": "Benefits of rainwater harvesting include reducing water bills, lessening demand on groundwater, preventing soil erosion and flooding, and providing a source of clean, soft water for plants and laundry.",
  "methods": "Common methods include rooftop harvesting using gutters and downspouts connected to storage tanks (like barrels or cisterns), and surface runoff harvesting using swales or ponds to capture water in a landscape.",
  "start": "To start, assess your roof area and average local rainfall to estimate potential collection. Then, install gutters and a filtration system (like a leaf screen) leading to a food-grade storage container. Ensure the tank has an overflow pipe.",
  "uses": "Harvested rainwater is excellent for watering gardens, washing cars, and flushing toilets. With proper purification, it can also be made potable for drinking and cooking.",
  "cost": "The cost varies widely. A simple rain barrel setup can be under $100. A more extensive system with large cisterns and pumps can cost several thousand dollars. Government rebates or incentives may be available in your area.",
};

const findAnswerInKB = (query) => {
    const lowerQuery = query.toLowerCase();
    for (const keyword in rainwaterKnowledgeBase) {
        if (lowerQuery.includes(keyword)) {
            return rainwaterKnowledgeBase[keyword];
        }
    }
    return null;
};

// --- Main Chatbot Component ---
const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [suggestedTopics, setSuggestedTopics] = useState([]);
    
    const messagesEndRef = useRef(null);
    const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // IMPORTANT: Replace with your actual key

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const toggleChat = () => setIsOpen(!isOpen);

    const callGeminiAPI = async (prompt, isJsonMode = false, retries = 3, delay = 1000) => {
        setIsLoading(true);
        setError(null);
        try {
            const model = 'gemini-2.5-flash-preview-05-20';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
            
            const headers = { 'Content-Type': 'application/json' };
            const body = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: isJsonMode ? { response_mime_type: "application/json" } : {},
            };

            const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const botResponse = data.candidates[0].content.parts[0].text;
            
            setIsLoading(false);
            return botResponse;

        } catch (err) {
            if (retries > 0) {
                await new Promise(res => setTimeout(res, delay));
                return callGeminiAPI(prompt, isJsonMode, retries - 1, delay * 2); // Exponential backoff
            } else {
                console.error("API call failed after multiple retries:", err);
                setError("Sorry, I'm having trouble connecting. Please try again later.");
                setIsLoading(false);
                return null;
            }
        }
    };

    const handleSendMessage = async (messageText) => {
        const text = (messageText || inputValue).trim();
        if (!text) return;

        const newUserMessage = { text, sender: 'user', id: Date.now() };
        setMessages(prev => [...prev, newUserMessage]);
        if (!messageText) setInputValue('');
        setSuggestedTopics([]); // Clear suggestions after first message
        setIsLoading(true);

        // 1. Check local knowledge base first
        const kbAnswer = findAnswerInKB(text);
        if (kbAnswer) {
            setTimeout(() => { // Simulate thinking
                const newBotMessage = { text: kbAnswer, sender: 'bot', id: Date.now() + 1 };
                setMessages(prev => [...prev, newBotMessage]);
                setIsLoading(false);
            }, 500);
            return;
        }

        // 2. If not in KB, call Gemini API
        const botResponse = await callGeminiAPI(`User query: "${text}". Please provide a helpful and concise response.`);
        if (botResponse) {
            const newBotMessage = { text: botResponse, sender: 'bot', id: Date.now() + 1 };
            setMessages(prev => [...prev, newBotMessage]);
        }
    };
    
    const handleSummarize = async () => {
        const conversation = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
        const prompt = `Please summarize the following conversation concisely:\n\n${conversation}`;
        const summary = await callGeminiAPI(prompt);
        if (summary) {
            const summaryMessage = { text: `Conversation Summary:\n${summary}`, sender: 'bot', id: Date.now() };
            setMessages(prev => [...prev, summaryMessage]);
        }
    };

    const handleSuggestTopics = async () => {
        const prompt = 'Suggest three brief, engaging questions a user might have about rainwater harvesting. Respond ONLY with a valid JSON array of strings, like ["question 1", "question 2", "question 3"].';
        const suggestionsJson = await callGeminiAPI(prompt, true);
        if (suggestionsJson) {
            try {
                const topics = JSON.parse(suggestionsJson);
                setSuggestedTopics(topics);
            } catch (e) {
                console.error("Failed to parse suggested topics JSON:", e);
                setError("Couldn't fetch suggestions right now.");
            }
        }
    };

    useEffect(() => {
        if (isOpen) {
            setMessages([{
                id: 'initial',
                sender: 'bot',
                text: "Hello! I can answer questions about rainwater harvesting or help with general queries. How can I assist you today?"
            }]);
            setSuggestedTopics([]); // Reset on open
        }
    }, [isOpen]);

    return (
        <div className="fixed bottom-5 right-5 z-50">
            {/* Chat Window */}
            <div className={`
                w-80 sm:w-96 h-[500px] bg-white rounded-xl shadow-2xl flex flex-col
                transition-all duration-300 ease-in-out
                ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
                origin-bottom-right
            `}>
                {/* Header */}
                <div className="bg-blue-600 text-white p-3 rounded-t-xl flex justify-between items-center">
                    <h3 className="font-bold text-lg">AquaBot Assistant</h3>
                    <div className="flex items-center space-x-2">
                        {messages.filter(m => m.sender === 'user').length >= 2 && (
                             <button onClick={handleSummarize} className="hover:bg-blue-700 p-1 rounded-full" title="Summarize Conversation">
                                <SummarizeIcon />
                            </button>
                        )}
                        <button onClick={toggleChat} className="hover:bg-blue-700 p-1 rounded-full" title="Close Chat">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    <div className="flex flex-col space-y-3">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <p className={`max-w-xs lg:max-w-sm p-3 rounded-2xl text-sm ${
                                    msg.sender === 'user' 
                                    ? 'bg-blue-500 text-white rounded-br-none' 
                                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                                }`}>
                                    {msg.text.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}
                                </p>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-200 text-gray-800 rounded-2xl p-3 rounded-bl-none">
                                    <div className="flex items-center space-x-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                        <div ref={messagesEndRef} />
                    </div>
                     {messages.length === 1 && !isLoading && (
                        <div className="text-center mt-4">
                            {suggestedTopics.length > 0 ? (
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {suggestedTopics.map((topic, i) => (
                                        <button key={i} onClick={() => handleSendMessage(topic)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors">
                                            {topic}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <button onClick={handleSuggestTopics} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                                    Suggest Topics
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-3 border-t bg-white rounded-b-xl">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors">
                            <SendIcon />
                        </button>
                    </form>
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={toggleChat}
                className={`
                    bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'rotate-[360deg]' : '-rotate-[360deg]'}
                `}
                aria-label={isOpen ? "Close Chat" : "Open Chat"}
            >
                {isOpen ? <CloseIcon /> : <ChatbotIcon />}
            </button>
        </div>
    );
};

export default Chatbot;