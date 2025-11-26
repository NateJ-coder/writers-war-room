import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header>
        <h1>✍️ Writer's War-Room</h1>
        <p>Your Strategic Command Center for Crafting Epic Tales</p>
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
        <Link to="/chatbot" className={isActive('/chatbot') ? 'active' : ''}>
          🤖 AI Assistant
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
