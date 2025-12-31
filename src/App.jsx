import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import LandingPage from './LandingPage'
import Navigation from './Navigation'
import DashboardPage from './DashboardPage'
import TransferPage from './TransferPage'
import AdminPage from './AdminPage'
import ContactPage from './ContactPage'
import WalletModal from './WalletModal'
import AccountSelectionModal from './AccountSelectionModal'
import './App.css'

const SAMPLE_ACCOUNT = '0xc615033c54E41CDb1D3b85F945DBe0c2FE9EAbd7'

function App() {
  const [currentPage, setCurrentPage] = useState('/')
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [provider, setProvider] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [isSampleMode, setIsSampleMode] = useState(false)
  const [accountSelectionModalOpen, setAccountSelectionModalOpen] = useState(false)

  // Check if wallet is connected on component mount
  useEffect(() => {
    checkWalletConnection()
    setupEventListeners()
  }, [])

  // Update provider and chainId when account changes
  useEffect(() => {
    if (account && typeof window.ethereum !== 'undefined') {
      const updateProvider = async () => {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const network = await provider.getNetwork()
          setProvider(provider)
          setChainId(Number(network.chainId))
        } catch (error) {
          console.error('Error updating provider:', error)
        }
      }
      updateProvider()
    }
  }, [account])

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()
        const network = await provider.getNetwork()
        
        if (accounts.length > 0) {
          setAccount(accounts[0].address)
          setProvider(provider)
          setChainId(Number(network.chainId))
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
      }
    }
  }

  const setupEventListeners = () => {
    if (typeof window.ethereum !== 'undefined') {
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          setError(null)
        } else {
          setAccount(null)
        }
      })

      // Listen for chain changes
      window.ethereum.on('chainChanged', async () => {
        window.location.reload()
      })
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('Please install MetaMask or another Web3 wallet')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      
      const accounts = await provider.listAccounts()
      const network = await provider.getNetwork()
      
      // Exit sample mode when connecting a real wallet
      setIsSampleMode(false)
      setAccount(accounts[0].address)
      setProvider(provider)
      setChainId(Number(network.chainId))
    } catch (error) {
      console.error('Error connecting wallet:', error)
      setError('Failed to connect wallet. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setProvider(null)
    setChainId(null)
    setError(null)
    setIsSampleMode(false)
  }

  const openWalletModal = () => {
    setWalletModalOpen(true)
  }

  const closeWalletModal = () => {
    setWalletModalOpen(false)
  }


  const handleNavigate = (path) => {
    setCurrentPage(path)
  }

  const handleLaunchApp = () => {
    setAccountSelectionModalOpen(true)
  }

  const handleTrySample = async () => {
    setAccountSelectionModalOpen(false)
    setIsSampleMode(true)
    setAccount(SAMPLE_ACCOUNT)
    
    // For sample mode, use a public RPC provider for read-only access
    // Try to detect chain from wallet, otherwise default to mainnet
    let detectedChainId = 1
    if (typeof window.ethereum !== 'undefined') {
      try {
        const tempProvider = new ethers.BrowserProvider(window.ethereum)
        const network = await tempProvider.getNetwork()
        detectedChainId = Number(network.chainId)
      } catch (error) {
        console.log('Could not detect chain, defaulting to mainnet')
      }
    }
    
    // Use public RPC endpoints for read-only access
    const rpcUrls = {
      1: 'https://eth.llamarpc.com', // Mainnet
      11155111: 'https://rpc.sepolia.org', // Sepolia
      42161: 'https://arb1.arbitrum.io/rpc', // Arbitrum
    }
    
    const rpcUrl = rpcUrls[detectedChainId] || rpcUrls[1]
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    
    setChainId(detectedChainId)
    setProvider(provider)
    setCurrentPage('/dashboard')
  }

  const handleUseRealAccount = () => {
    setAccountSelectionModalOpen(false)
    setIsSampleMode(false)
    setCurrentPage('/dashboard')
  }

  // Show landing page on root
  if (currentPage === '/') {
    return (
      <>
        <LandingPage onLaunchApp={handleLaunchApp} />
        <AccountSelectionModal
          isOpen={accountSelectionModalOpen}
          onClose={() => setAccountSelectionModalOpen(false)}
          onTrySample={handleTrySample}
          onUseRealAccount={handleUseRealAccount}
        />
      </>
    )
  }

  // Render pages with navigation
  return (
    <div className="App">
      <Navigation 
        currentPage={currentPage} 
        onNavigate={handleNavigate}
        account={account}
        onConnectWallet={openWalletModal}
        loading={loading}
        isSampleMode={isSampleMode}
      />
      
      <WalletModal
        isOpen={walletModalOpen}
        onClose={closeWalletModal}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        account={account}
        provider={provider}
      />
      
      <AccountSelectionModal
        isOpen={accountSelectionModalOpen}
        onClose={() => setAccountSelectionModalOpen(false)}
        onTrySample={handleTrySample}
        onUseRealAccount={handleUseRealAccount}
      />
      
      {currentPage === '/dashboard' && (
        <DashboardPage 
          account={account}
          provider={provider}
          chainId={chainId}
          onConnectWallet={openWalletModal}
          isSampleMode={isSampleMode}
        />
      )}
      
      {currentPage === '/transfer' && (
        <TransferPage 
          account={account}
          provider={provider}
          chainId={chainId}
          onConnectWallet={openWalletModal}
          isSampleMode={isSampleMode}
        />
      )}
      
      {currentPage === '/admin' && (
        <AdminPage 
          account={account}
          provider={provider}
        />
      )}
      
      {currentPage === '/contact' && (
        <ContactPage />
      )}
    </div>
  )
}

export default App

