import './Navigation.css'

function Navigation({ currentPage, onNavigate }) {
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/transfer', label: 'Transfer', icon: '💸' },
    { path: '/admin', label: 'Admin', icon: '⚙️' },
    { path: '/contact', label: 'Contact Me', icon: '📧' },
  ]

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <div className="nav-logo" onClick={() => onNavigate('/')}>
          <div className="nav-logo-icon"></div>
          <span>SALARY STREAMERZ</span>
        </div>
        <div className="nav-links">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-link ${currentPage === item.path ? 'active' : ''}`}
              onClick={() => onNavigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navigation

