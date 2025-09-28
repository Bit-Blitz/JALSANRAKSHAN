// src/App.jsx

import React from 'react';
import Chatbot from './Chatbot'; // Import the chatbot component

function App() {
  return (
    // Set a white background for the whole page
    <div className="bg-white min-h-screen font-sans">
      
      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-10">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-800 mb-2">
            Rainwater Harvesting Potential
          </h1>
          <p className="text-xl text-gray-500">
            Assess your rooftop's potential and discover sustainable water solutions.
          </p>
        </header>

        <div className="max-w-3xl mx-auto bg-gray-50 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Welcome!</h2>
          <p className="text-gray-600 leading-relaxed">
            This is a demonstration page for a React overlay chatbot. The main content of the website goes here.
            You can interact with the chatbot in the bottom-right corner. It has built-in knowledge about rainwater harvesting and can answer general questions using the Google Gemini API.
          </p>
          <p className="text-gray-600 leading-relaxed mt-4">
            Try asking it:
          </p>
          <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
            <li>What are the benefits of rainwater harvesting?</li>
            <li>How can I start collecting rainwater?</li>
            <li>What is the capital of France? (To test the Gemini API)</li>
          </ul>
        </div>
      </main>

      {/* The Chatbot Component */}
      <Chatbot />

    </div>
  );
}

export default App;