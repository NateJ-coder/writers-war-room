import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/Layout';
import Pinboard from './pages/Pinboard';
import Contents from './pages/Contents';
import Outline from './pages/Outline';
import Writing from './pages/Writing';
import { ChatbotWidget } from './components/chatbot/ChatbotWidget';
import { ChatbotToggle } from './components/chatbot/ChatbotToggle';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Pinboard />} />
          <Route path="/contents" element={<Contents />} />
          <Route path="/outline" element={<Outline />} />
          <Route path="/writing" element={<Writing />} />
        </Routes>
      </Layout>
      
      {/* Floating Chatbot Widget */}
      <ChatbotToggle 
        onClick={() => setIsChatOpen(!isChatOpen)} 
        isOpen={isChatOpen}
      />
      <ChatbotWidget 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
      />
    </Router>
  );
}

export default App;
