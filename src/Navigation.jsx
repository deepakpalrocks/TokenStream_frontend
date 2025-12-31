import './Navigation.css'
import { DashboardIcon, TransferIcon, AdminIcon, ContactIcon } from './Icons'

function Navigation({ currentPage, onNavigate, account, onConnectWallet, loading }) {
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
    { path: '/transfer', label: 'Transfer', Icon: TransferIcon },
    { path: '/admin', label: 'Admin', Icon: AdminIcon },
    { path: '/contact', label: 'Contact', Icon: ContactIcon },
  ]

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <button className="nav-logo" onClick={() => onNavigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <div className="nav-logo-icon"></div>
          <span>SALARY STREAMERZ</span>
        </button>
        <div className="nav-links">
          {navItems.map((item) => {
            const Icon = item.Icon
            return (
              <button
                key={item.path}
                className={`nav-link ${currentPage === item.path ? 'active' : ''}`}
                onClick={() => onNavigate(item.path)}
              >
                <Icon size={16} className="nav-icon" />
                <span>{item.label}</span>
              </button>
            )
          })}
          {account ? (
            <button
              className="wallet-connected"
              onClick={onConnectWallet}
              title="Click to view wallet or disconnect"
            >
              <span className="wallet-indicator">●</span>
              <span className="wallet-address">{account.slice(0, 6)}...{account.slice(-4)}</span>
            </button>
          ) : (
            <button
              className="connect-wallet-nav"
              onClick={onConnectWallet}
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navigation

