import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { getStreamRewarderAddress, getUSDTAddress } from './addresses'
import StreamRewarderABI from './StreamRewarderABI.json'
import './DashboardPage.css'

function DashboardPage({ account, provider, chainId }) {
  const [earnedAmount, setEarnedAmount] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [claiming, setClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(null)

  useEffect(() => {
    if (account && provider && chainId) {
      fetchRewards()
    }
  }, [account, provider, chainId])

  const fetchRewards = async () => {
    if (!account || !provider || !chainId) return

    try {
      setLoading(true)
      setError(null)

      const rewarderAddress = getStreamRewarderAddress(chainId)
      const usdtAddress = getUSDTAddress(chainId)

      if (!rewarderAddress || rewarderAddress === '0x0000000000000000000000000000000000000000') {
        setError('StreamRewarder address not configured for this network')
        setLoading(false)
        return
      }

      const contract = new ethers.Contract(
        rewarderAddress,
        StreamRewarderABI,
        provider
      )

      // USDT has 6 decimals typically, but we'll use 18 for calculation
      const earned = await contract.earned(account, usdtAddress)
      setEarnedAmount(earned)
    } catch (error) {
      console.error('Error fetching rewards:', error)
      setError('Failed to fetch rewards. Make sure the contract is deployed on this network.')
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async () => {
    if (!account || !provider || !chainId) {
      setError('Please connect your wallet first')
      return
    }

    try {
      setClaiming(true)
      setError(null)
      setClaimSuccess(null)

      const rewarderAddress = getStreamRewarderAddress(chainId)
      const usdtAddress = getUSDTAddress(chainId)

      if (!rewarderAddress || rewarderAddress === '0x0000000000000000000000000000000000000000') {
        setError('StreamRewarder address not configured for this network')
        setClaiming(false)
        return
      }

      const signer = await provider.getSigner()
      const contract = new ethers.Contract(
        rewarderAddress,
        StreamRewarderABI,
        signer
      )

      const tx = await contract.getReward(usdtAddress)
      setClaimSuccess(`Transaction submitted! Hash: ${tx.hash}`)
      
      await tx.wait()
      setClaimSuccess(`Rewards claimed successfully!`)
      
      // Refresh rewards
      await fetchRewards()
    } catch (error) {
      console.error('Claim error:', error)
      if (error.reason) {
        setError(error.reason)
      } else if (error.message) {
        setError(error.message)
      } else {
        setError('Claim failed. Please try again.')
      }
    } finally {
      setClaiming(false)
    }
  }

  const formatRewards = (amount) => {
    if (!amount) return '0.00'
    try {
      // USDT typically has 6 decimals, but we'll use 18 for display
      const formatted = ethers.formatUnits(amount, 18)
      return parseFloat(formatted).toFixed(2)
    } catch (error) {
      return '0.00'
    }
  }

  const getRewardsInUSD = (amount) => {
    if (!amount) return '0.00'
    try {
      const formatted = ethers.formatUnits(amount, 18)
      // USDT price is $1
      return parseFloat(formatted).toFixed(2)
    } catch (error) {
      return '0.00'
    }
  }

  if (!account) {
    return (
      <div className="dashboard-page">
        <div className="page-container">
          <div className="connect-wallet-prompt">
            <div className="prompt-icon">🔐</div>
            <h2>Connect Your Wallet</h2>
            <p>Please connect your wallet to view your rewards</p>
          </div>
        </div>
      </div>
    )
  }

  const rewardsUSD = getRewardsInUSD(earnedAmount)
  const hasRewards = earnedAmount && earnedAmount > 0n

  return (
    <div className="dashboard-page">
      <div className="page-container">
        <div className="page-header">
          <h1>📊 Dashboard</h1>
          <p className="page-subtitle">View and claim your accumulated rewards</p>
        </div>

        <div className="dashboard-content">
          <div className="rewards-card">
            <div className="card-glow"></div>
            <div className="rewards-header">
              <div className="rewards-icon">💰</div>
              <h2>Accumulated Rewards</h2>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner-large"></div>
                <p>Loading rewards...</p>
              </div>
            ) : (
              <>
                <div className="rewards-display">
                  <div className="rewards-amount">
                    <div className="amount-label">USDT Rewards</div>
                    <div className="amount-value">
                      {formatRewards(earnedAmount)} USDT
                    </div>
                    <div className="amount-usd">
                      ≈ ${rewardsUSD}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {error}
                  </div>
                )}

                {claimSuccess && (
                  <div className="success-message">
                    <span className="success-icon">✅</span>
                    {claimSuccess}
                  </div>
                )}

                <button
                  className="claim-button"
                  onClick={handleClaim}
                  disabled={claiming || !hasRewards}
                >
                  {claiming ? (
                    <>
                      <span className="spinner"></span>
                      Claiming...
                    </>
                  ) : (
                    <>
                      <span>🎁</span>
                      Claim Rewards
                    </>
                  )}
                </button>

                {!hasRewards && !loading && (
                  <div className="no-rewards-message">
                    <div className="no-rewards-icon">📭</div>
                    <p>No rewards available to claim</p>
                    <p className="no-rewards-subtitle">Keep earning rewards by holding salary receipt tokens</p>
                  </div>
                )}

                <button
                  className="refresh-button"
                  onClick={fetchRewards}
                  disabled={loading}
                >
                  {loading ? '🔄' : '↻'} Refresh
                </button>
              </>
            )}
          </div>

          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon">💡</div>
              <h3>How Rewards Work</h3>
              <p>Earn USDT rewards by holding salary receipt tokens. Rewards accumulate over time and can be claimed at any time.</p>
            </div>

            <div className="info-card">
              <div className="info-icon">⚡</div>
              <h3>Instant Claims</h3>
              <p>Claim your rewards instantly to your wallet. No waiting periods or restrictions.</p>
            </div>

            <div className="info-card">
              <div className="info-icon">🔒</div>
              <h3>Secure & Transparent</h3>
              <p>All rewards are stored on-chain and can be verified at any time through the blockchain.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

