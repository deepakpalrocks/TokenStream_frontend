import { useState, useEffect } from 'react'
import { AdminIcon, LockIcon, ShieldIcon, KeyIcon, DashboardIcon } from './Icons'
import './AdminPage.css'

function AdminPage({ account, provider }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkAdminStatus()
  }, [account])

  const checkAdminStatus = async () => {
    // For now, we'll just check if wallet is connected
    // You can add actual admin address verification here
    setChecking(true)
    
    // Example: Check if connected address matches admin address
    // const ADMIN_ADDRESS = '0x...'
    // setIsAdmin(account && account.toLowerCase() === ADMIN_ADDRESS.toLowerCase())
    
    // For demo purposes, we'll show the message regardless
    setIsAdmin(false)
    setChecking(false)
  }

  if (checking) {
    return (
      <div className="admin-page">
        <div className="page-container">
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Checking admin status...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="page-container">
        <div className="admin-content">
          <div className="admin-card">
            <div className="admin-header">
              <AdminIcon size={32} className="admin-icon" />
              <h1>Admin Panel</h1>
            </div>
            <div className="admin-message">
              <LockIcon size={24} className="message-icon" />
              <p className="message-text">Sign in via Admin wallet to view this page</p>
            </div>
            
            {account && (
              <div className="wallet-info">
                <div className="info-label">Connected Wallet:</div>
                <div className="info-value">{account}</div>
                <div className="info-note">
                  This wallet is not authorized as an admin wallet.
                </div>
              </div>
            )}

            {!account && (
              <div className="connect-prompt">
                <p>Please connect your admin wallet to access this page.</p>
              </div>
            )}
          </div>

          <div className="admin-info-cards">
            <div className="info-card">
              <ShieldIcon size={24} className="card-icon" />
              <h3>Security</h3>
              <p>Only authorized admin wallets can access administrative functions.</p>
            </div>
            <div className="info-card">
              <KeyIcon size={24} className="card-icon" />
              <h3>Access Control</h3>
              <p>Admin privileges are granted to specific wallet addresses only.</p>
            </div>
            <div className="info-card">
              <DashboardIcon size={24} className="card-icon" />
              <h3>Management</h3>
              <p>Admin panel provides access to system configuration and management tools.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPage

