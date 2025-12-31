import { useState } from 'react'
import './WalletModal.css'

function WalletModal({ isOpen, onClose, onConnect, onDisconnect, account, provider }) {
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using MetaMask browser extension',
      available: typeof window.ethereum !== 'undefined' && !window.ethereum.isCoinbaseWallet && !window.ethereum.isBraveWallet,
      connector: async () => {
        if (typeof window.ethereum === 'undefined') {
          throw new Error('MetaMask not installed. Please install MetaMask extension.')
        }
        if (window.ethereum.isCoinbaseWallet || window.ethereum.isBraveWallet) {
          throw new Error('Please use the specific wallet option')
        }
        
        // Request permissions explicitly - this will show account selection dialog
        // MetaMask will show the account picker if you have multiple accounts
        try {
          await window.ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }]
          })
        } catch (err) {
          // If user rejects or if permissions already exist, try direct request
          // This will still show account selection if MetaMask is configured to do so
          await window.ethereum.request({ method: 'eth_requestAccounts' })
          return
        }
        
        // After permissions granted, request accounts
        await window.ethereum.request({ method: 'eth_requestAccounts' })
      }
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔵',
      description: 'Connect using Coinbase Wallet extension',
      available: window.ethereum?.isCoinbaseWallet || typeof window.coinbaseWalletExtension !== 'undefined',
      connector: async () => {
        if (window.ethereum?.isCoinbaseWallet) {
          // Request permissions to show account selection
          try {
            await window.ethereum.request({
              method: 'wallet_requestPermissions',
              params: [{ eth_accounts: {} }]
            })
          } catch (err) {
            // Continue if permissions already exist
          }
          await window.ethereum.request({ method: 'eth_requestAccounts' })
        } else if (window.coinbaseWalletExtension) {
          await window.coinbaseWalletExtension.request({ method: 'eth_requestAccounts' })
        } else {
          throw new Error('Coinbase Wallet not installed')
        }
      }
    },
    {
      id: 'brave',
      name: 'Brave Wallet',
      icon: '🦁',
      description: 'Connect using Brave browser wallet',
      available: window.ethereum?.isBraveWallet === true,
      connector: async () => {
        if (window.ethereum?.isBraveWallet) {
          // Request permissions to show account selection
          try {
            await window.ethereum.request({
              method: 'wallet_requestPermissions',
              params: [{ eth_accounts: {} }]
            })
          } catch (err) {
            // Continue if permissions already exist
          }
          await window.ethereum.request({ method: 'eth_requestAccounts' })
        } else {
          throw new Error('Brave Wallet not available')
        }
      }
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Scan QR code with your mobile wallet',
      available: false, // Placeholder for future implementation
      connector: async () => {
        throw new Error('WalletConnect integration coming soon')
      }
    }
  ]

  const handleConnect = async (wallet) => {
    try {
      setConnecting(true)
      setError(null)
      // The connector already requests accounts, so we just need to trigger the connection
      await wallet.connector()
      // Small delay to ensure wallet is ready
      await new Promise(resolve => setTimeout(resolve, 100))
      // onConnect will read the accounts from the provider
      await onConnect()
      onClose()
    } catch (err) {
      console.error('Connection error:', err)
      setError(err.message || 'Failed to connect wallet')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = () => {
    onDisconnect()
    onClose()
  }

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{account ? 'Wallet Connected' : 'Connect Wallet'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {account ? (
            <div className="wallet-connected-view">
              <div className="connected-info">
                <div className="wallet-status">
                  <span className="status-indicator">●</span>
                  <span>Connected</span>
                </div>
                <div className="wallet-address-display">
                  <span className="address-label">Address:</span>
                  <span className="address-value">{account}</span>
                  <button 
                    className="copy-button"
                    onClick={() => {
                      navigator.clipboard.writeText(account)
                      alert('Address copied to clipboard!')
                    }}
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="wallet-actions">
                <button 
                  className="switch-account-button" 
                  onClick={async () => {
                    try {
                      // Request permissions again to show account selection
                      if (window.ethereum) {
                        await window.ethereum.request({
                          method: 'wallet_requestPermissions',
                          params: [{ eth_accounts: {} }]
                        })
                        // Refresh connection
                        await onConnect()
                      }
                    } catch (err) {
                      console.error('Error switching account:', err)
                    }
                  }}
                >
                  🔄 Switch Account
                </button>
                <button className="disconnect-button" onClick={handleDisconnect}>
                  Disconnect Wallet
                </button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <div className="wallet-list">
                {wallets
                  .filter(wallet => wallet.available !== false)
                  .map((wallet) => (
                    <button
                      key={wallet.id}
                      className="wallet-option"
                      onClick={() => handleConnect(wallet)}
                      disabled={connecting || !wallet.available}
                    >
                      <div className="wallet-icon">{wallet.icon}</div>
                      <div className="wallet-info">
                        <div className="wallet-name">
                          {wallet.name}
                          {!wallet.available && <span className="unavailable-badge">Not Available</span>}
                        </div>
                        <div className="wallet-description">{wallet.description}</div>
                      </div>
                      {connecting && <div className="wallet-spinner"></div>}
                    </button>
                  ))}
              </div>

              <div className="modal-footer">
                <p className="footer-text">
                  New to Ethereum wallets?{' '}
                  <a 
                    href="https://ethereum.org/en/wallets/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Learn more
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default WalletModal

