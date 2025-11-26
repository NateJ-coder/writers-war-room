import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Pinboard from './pages/Pinboard';
import Contents from './pages/Contents';
import Outline from './pages/Outline';
import Writing from './pages/Writing';
import Chatbot from './pages/Chatbot';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Pinboard />} />
          <Route path="/contents" element={<Contents />} />
          <Route path="/outline" element={<Outline />} />
          <Route path="/writing" element={<Writing />} />
          <Route path="/chatbot" element={<Chatbot />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
