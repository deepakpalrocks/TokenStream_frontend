import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { getSalaryReceiptAddress } from './addresses'
import SalaryReceiptTokenABI from './SalaryReceiptTokenABI.json'
import LandingPage from './LandingPage'
import './App.css'

function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [account, setAccount] = useState(null)
  const [balance, setBalance] = useState(null)
  const [tokenName, setTokenName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [decimals, setDecimals] = useState(18)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [provider, setProvider] = useState(null)
  const [chainId, setChainId] = useState(null)

  // Check if wallet is connected on component mount
  useEffect(() => {
    checkWalletConnection()
    setupEventListeners()
  }, [])

  // Fetch balance when account or chainId changes
  useEffect(() => {
    if (account && provider && chainId) {
      fetchBalance()
    }
  }, [account, provider, chainId])

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
          setBalance(null)
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

  const fetchBalance = async () => {
    if (!account || !provider || !chainId) return

    try {
      setLoading(true)
      setError(null)

      const salaryReceiptAddress = getSalaryReceiptAddress(chainId)
      
      if (!salaryReceiptAddress || salaryReceiptAddress === '0x0000000000000000000000000000000000000000') {
        setError('Salary Receipt Token address not configured for this network. Please update addresses.js')
        setLoading(false)
        return
      }

      const contract = new ethers.Contract(
        salaryReceiptAddress,
        SalaryReceiptTokenABI,
        provider
      )

      // Fetch token info
      const [name, symbol, decimalsValue, balanceValue] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.balanceOf(account)
      ])

      setTokenName(name)
      setTokenSymbol(symbol)
      setDecimals(Number(decimalsValue))
      setBalance(balanceValue)
    } catch (error) {
      console.error('Error fetching balance:', error)
      setError('Failed to fetch balance. Make sure the contract is deployed on this network.')
    } finally {
      setLoading(false)
    }
  }

  const formatBalance = (balance) => {
    if (!balance) return '0'
    try {
      const formatted = ethers.formatUnits(balance, decimals)
      return parseFloat(formatted).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
      })
    } catch (error) {
      return balance.toString()
    }
  }

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (showLanding) {
    return <LandingPage onLaunchApp={() => setShowLanding(false)} />
  }

  return (
    <div className="App">
      <div className="app-header">
        <button className="back-to-landing" onClick={() => setShowLanding(true)}>
          ← Back to Home
        </button>
        <h1>TokenStream - Salary Receipt Balance</h1>
      </div>
      
      {!account ? (
        <div className="card">
          <p>Connect your wallet to view your Salary Receipt Token balance</p>
          <button onClick={connectWallet} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="address-display">
            Connected: {formatAddress(account)}
          </div>
          
          {error && <div className="error">{error}</div>}
          
          {loading && <p>Loading...</p>}
          
          {!loading && balance !== null && (
            <>
              <div className="balance-display">
                {formatBalance(balance)} {tokenSymbol}
              </div>
              {tokenName && (
                <p>Token: {tokenName} ({tokenSymbol})</p>
              )}
              <button onClick={fetchBalance} style={{ marginTop: '1rem' }}>
                Refresh Balance
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default App

