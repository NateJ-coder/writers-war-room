import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1>✍️ Writer's War-Room</h1>
            <p>Your Strategic Command Center for Crafting Epic Tales</p>
          </div>
          <button 
            onClick={toggleTheme}
            className="theme-toggle"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{
              background: 'var(--surface-medium)',
              border: '2px solid var(--neon-yellow)',
              color: 'var(--neon-yellow)',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              fontSize: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <nav>
        <Link to="/" className={isActive('/') ? 'active' : ''}>
          📌 Pinboard
        </Link>
        <Link to="/contents" className={isActive('/contents') ? 'active' : ''}>
          📚 Contents
        </Link>
        <Link to="/outline" className={isActive('/outline') ? 'active' : ''}>
          📝 Outline
        </Link>
        <Link to="/writing" className={isActive('/writing') ? 'active' : ''}>
          ✏️ Writing
        </Link>
        <Link to="/editor" className={isActive('/editor') ? 'active' : ''}>
          🤖 AI Editor
        </Link>
        <Link to="/resources" className={isActive('/resources') ? 'active' : ''}>
          📚 Resources
        </Link>
      </nav>

      <main>{children}</main>

      <footer>
        <p>&copy; 2024 Writer's War-Room | Empowering Authors, One Draft at a Time</p>
      </footer>
    </>
  );
};

export default Layout;
