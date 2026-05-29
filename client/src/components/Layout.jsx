import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Boxes, 
  ShoppingCart, 
  LogOut, 
  User, 
  Egg,
  ChevronRight
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      path: '/',
      name: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      path: '/inventory',
      name: 'Inventory Manager',
      icon: <Boxes size={20} />,
    },
    {
      path: '/shopping-list',
      name: 'Shopping List',
      icon: <ShoppingCart size={20} />,
    },
  ];

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Egg className="brand-icon" size={28} />
          <h2>SmartGrocery</h2>
        </div>
        
        <div className="user-profile-badge">
          <div className="avatar">
            <User size={18} />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'User'}</span>
            <span className="user-email">{user?.email || 'user@example.com'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                    {isActive && <ChevronRight size={16} className="active-indicator" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-title">
            <h1>{menuItems.find(item => item.path === location.pathname)?.name || 'Smart Grocery Manager'}</h1>
          </div>
          <div className="header-actions">
            <span className="date-indicator">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </header>
        <div className="content-inner">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
