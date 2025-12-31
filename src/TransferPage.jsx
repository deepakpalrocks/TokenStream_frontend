import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { getSalaryReceiptAddress } from './addresses'
import SalaryReceiptTokenABI from './SalaryReceiptTokenABI.json'
import { TransferIcon, WalletIcon, AddressIcon, AmountIcon, SendIcon, HistoryIcon, EmptyIcon, CheckIcon, WarningIcon, RefreshIcon } from './Icons'
import './TransferPage.css'

function TransferPage({ account, provider, chainId, onConnectWallet }) {
  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [transferHistory, setTransferHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [tokenBalance, setTokenBalance] = useState(null)
  const [decimals, setDecimals] = useState(18)

  useEffect(() => {
    if (account && provider && chainId) {
      fetchBalance()
      fetchTransferHistory()
    }
  }, [account, provider, chainId])

  const fetchBalance = async () => {
    try {
      const salaryReceiptAddress = getSalaryReceiptAddress(chainId)
      if (!salaryReceiptAddress || salaryReceiptAddress === '0x0000000000000000000000000000000000000000') {
        return
      }

      const contract = new ethers.Contract(
        salaryReceiptAddress,
        SalaryReceiptTokenABI,
        provider
      )

      const [balanceValue, decimalsValue] = await Promise.all([
        contract.balanceOf(account),
        contract.decimals()
      ])

      setTokenBalance(balanceValue)
      setDecimals(Number(decimalsValue))
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const fetchTransferHistory = async () => {
    if (!account || !chainId) return

    setLoadingHistory(true)
    try {
      // Get network name for Etherscan API
      const networkMap = {
        1: 'api.etherscan.io',
        11155111: 'api-sepolia.etherscan.io',
        42161: 'api.arbiscan.io',
      }

      const apiUrl = networkMap[chainId] || 'api.etherscan.io'
      const salaryReceiptAddress = getSalaryReceiptAddress(chainId)

      // Fetch transfer events from Etherscan API
      const response = await fetch(
        `https://${apiUrl}/api?module=account&action=tokentx&contractaddress=${salaryReceiptAddress}&address=${account}&startblock=0&endblock=99999999&sort=desc&apikey=YourApiKeyToken`
      )

      const data = await response.json()
      
      if (data.status === '1' && data.result) {
        // Filter transfers where user is the sender
        const sentTransfers = data.result
          .filter(tx => tx.from.toLowerCase() === account.toLowerCase())
          .map(tx => ({
            to: tx.to,
            amount: ethers.formatUnits(tx.value, tx.tokenDecimal),
            timestamp: new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString(),
            txHash: tx.hash,
          }))
          .slice(0, 20) // Limit to 20 most recent

        // Get unique addresses
        const uniqueAddresses = [...new Set(sentTransfers.map(t => t.to.toLowerCase()))]
        setTransferHistory(uniqueAddresses.map(addr => {
          const transfers = sentTransfers.filter(t => t.to.toLowerCase() === addr)
          return {
            address: addr,
            count: transfers.length,
            lastTransfer: transfers[0].timestamp,
            totalAmount: transfers.reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2),
          }
        }))
      } else {
        // Fallback: Try to get from contract events directly
        try {
          const contract = new ethers.Contract(
            salaryReceiptAddress,
            SalaryReceiptTokenABI,
            provider
          )

          // Get Transfer events where from is the user
          const filter = contract.filters.Transfer(account)
          const events = await contract.queryFilter(filter, -1000) // Last 1000 blocks

          const uniqueAddresses = [...new Set(events.map(e => e.args.to.toLowerCase()))]
          setTransferHistory(uniqueAddresses.map(addr => ({
            address: addr,
            count: events.filter(e => e.args.to.toLowerCase() === addr).length,
            lastTransfer: 'Recent',
            totalAmount: 'N/A',
          })))
        } catch (err) {
          console.error('Error fetching from contract:', err)
        }
      }
    } catch (error) {
      console.error('Error fetching transfer history:', error)
      // Continue without history if API fails
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleTransfer = async () => {
    if (!account || !provider) {
      setError('Please connect your wallet first')
      return
    }

    if (!toAddress || !ethers.isAddress(toAddress)) {
      setError('Please enter a valid recipient address')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const salaryReceiptAddress = getSalaryReceiptAddress(chainId)
      if (!salaryReceiptAddress || salaryReceiptAddress === '0x0000000000000000000000000000000000000000') {
        setError('Salary Receipt Token address not configured for this network')
        setLoading(false)
        return
      }

      const signer = await provider.getSigner()
      const contract = new ethers.Contract(
        salaryReceiptAddress,
        SalaryReceiptTokenABI,
        signer
      )

      const amountWei = ethers.parseUnits(amount, decimals)
      
      // Check balance
      const balance = await contract.balanceOf(account)
      if (balance < amountWei) {
        setError('Insufficient balance')
        setLoading(false)
        return
      }

      const tx = await contract.transfer(toAddress, amountWei)
      setSuccess(`Transaction submitted! Hash: ${tx.hash}`)
      
      await tx.wait()
      setSuccess(`Transfer successful! Transaction confirmed.`)
      
      // Reset form
      setToAddress('')
      setAmount('')
      
      // Refresh balance and history
      await fetchBalance()
      await fetchTransferHistory()
    } catch (error) {
      console.error('Transfer error:', error)
      if (error.reason) {
        setError(error.reason)
      } else if (error.message) {
        setError(error.message)
      } else {
        setError('Transfer failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatBalance = (balance) => {
    if (!account) return '--'
    if (!balance) return '0'
    try {
      return ethers.formatUnits(balance, decimals)
    } catch (error) {
      return '0'
    }
  }

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="transfer-page">
      <div className="page-container">
        <div className="page-header">
          <div className="header-title">
            <TransferIcon size={24} className="header-icon" />
            <h1>Transfer</h1>
          </div>
          <p className="page-subtitle">Send salary receipt tokens to any address</p>
        </div>

        <div className="transfer-content">
          <div className="transfer-card">
            <div className="balance-display-section">
              <div className="balance-label">Your Balance</div>
              <div className={`balance-amount ${!account ? 'placeholder' : ''}`}>
                {account ? (
                  tokenBalance ? parseFloat(formatBalance(tokenBalance)).toLocaleString() : '0'
                ) : (
                  '--'
                )} {account ? 'Tokens' : ''}
              </div>
            </div>

            <div className="transfer-form">
              <div className="form-group">
                <label htmlFor="toAddress">
                  <AddressIcon size={16} className="label-icon" />
                  Recipient Address
                </label>
                <input
                  id="toAddress"
                  type="text"
                  placeholder={account ? "0x..." : "Connect wallet to transfer"}
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  className="address-input"
                  disabled={!account}
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">
                  <AmountIcon size={16} className="label-icon" />
                  Amount
                </label>
                <input
                  id="amount"
                  type="number"
                  placeholder={account ? "0.00" : "--"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="amount-input"
                  step="any"
                  min="0"
                  disabled={!account}
                />
                <button 
                  className="max-button"
                  onClick={() => {
                    if (tokenBalance) {
                      setAmount(formatBalance(tokenBalance))
                    }
                  }}
                  disabled={!account}
                >
                  MAX
                </button>
              </div>

              {error && (
                <div className="error-message">
                  <WarningIcon size={16} className="error-icon" />
                  {error}
                </div>
              )}
              {success && (
                <div className="success-message">
                  <CheckIcon size={16} className="success-icon" />
                  {success}
                </div>
              )}

              <button
                className="transfer-button"
                onClick={account ? handleTransfer : onConnectWallet}
                disabled={!account || loading || !toAddress || !amount}
              >
                {!account ? (
                  <>
                    <WalletIcon size={18} />
                    Connect Wallet
                  </>
                ) : loading ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <SendIcon size={18} />
                    Transfer Tokens
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="history-card">
            <div className="card-header">
              <div className="card-header-title">
                <HistoryIcon size={18} className="header-icon" />
                <h2>Transfer History</h2>
              </div>
              <button 
                className="refresh-button"
                onClick={account ? fetchTransferHistory : onConnectWallet}
                disabled={!account || loadingHistory}
              >
                {!account ? (
                  <>
                    <WalletIcon size={14} />
                    Connect Wallet
                  </>
                ) : (
                  <>
                    <RefreshIcon size={14} />
                    Refresh
                  </>
                )}
              </button>
            </div>

            {loadingHistory ? (
              <div className="loading-state">Loading transfer history...</div>
            ) : transferHistory.length > 0 ? (
              <div className="history-list">
                {transferHistory.map((item, index) => (
                  <div key={index} className="history-item">
                    <div className="history-address">
                      <AddressIcon size={16} className="address-icon" />
                      <span className="address-text">{formatAddress(item.address)}</span>
                      <span className="full-address" title={item.address}>{item.address}</span>
                    </div>
                    <div className="history-details">
                      <div className="detail-item">
                        <span className="detail-label">Transfers:</span>
                        <span className="detail-value">{item.count}</span>
                      </div>
                      {item.totalAmount !== 'N/A' && (
                        <div className="detail-item">
                          <span className="detail-label">Total:</span>
                          <span className="detail-value">{item.totalAmount} Tokens</span>
                        </div>
                      )}
                      <div className="detail-item">
                        <span className="detail-label">Last:</span>
                        <span className="detail-value">{item.lastTransfer}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <EmptyIcon size={32} className="empty-icon" />
                <p>No transfer history found</p>
                <p className="empty-subtitle">Start transferring tokens to see history here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransferPage

