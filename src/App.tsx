import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/layout/Layout';
import Pinboard from './pages/Pinboard';
import Contents from './pages/Contents';
import Outline from './pages/Outline';
import Writing from './pages/Writing';
import Resources from './pages/Resources';
import { ChatbotWidget } from './components/chatbot/ChatbotWidget';
import { ChatbotToggle } from './components/chatbot/ChatbotToggle';
import { ThemeProvider } from './contexts/ThemeContext';
import { WritingPreferencesProvider } from './contexts/WritingPreferencesContext';

// Component to handle scroll position preservation
function ScrollPreserver({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    // Restore scroll position for this route
    const savedPosition = sessionStorage.getItem(`scroll-${location.pathname}`);
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition));
    }

    // Save scroll position when leaving
    const handleScroll = () => {
      sessionStorage.setItem(`scroll-${location.pathname}`, window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  return <>{children}</>;
}

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <ThemeProvider>
      <WritingPreferencesProvider>
        <Router>
          <ScrollPreserver>
            <Layout>
              <Routes>
                <Route path="/" element={<Pinboard />} />
                <Route path="/contents" element={<Contents />} />
                <Route path="/outline" element={<Outline />} />
                <Route path="/writing" element={<Writing />} />
                <Route path="/resources" element={<Resources />} />
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
          </ScrollPreserver>
        </Router>
      </WritingPreferencesProvider>
    </ThemeProvider>
  );
}

export default App;
