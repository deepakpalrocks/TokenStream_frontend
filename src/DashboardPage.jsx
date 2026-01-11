import { useState, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import { getStreamRewarderAddress, getUSDTAddress, getSalaryReceiptAddress } from './addresses'
import StreamRewarderABI from './StreamRewarderABI.json'
import SalaryReceiptTokenABI from './SalaryReceiptTokenABI.json'
import { DashboardIcon, RewardsIcon, ClaimIcon, RefreshIcon, LockIcon, LightningIcon, InfoIcon, WalletIcon, EmptyIcon, CheckIcon, WarningIcon } from './Icons'
import './DashboardPage.css'

function DashboardPage({ account, provider, chainId, onConnectWallet, onSwitchNetwork, isSampleMode = false }) {
  const [earnedAmount, setEarnedAmount] = useState(null)
  const [displayEarnings, setDisplayEarnings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [claiming, setClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(null)
  const [rewardData, setRewardData] = useState(null)
  const [userTokenBalance, setUserTokenBalance] = useState(null)
  const [totalSupply, setTotalSupply] = useState(null)
  const [rewardPerSecond, setRewardPerSecond] = useState(null)
  const intervalRef = useRef(null)
  const lastUpdateTimeRef = useRef(null)
  
  // DENOMINATOR is 1e12 (10^12)
  const DENOMINATOR = ethers.parseUnits('1', 12)

  const fetchRewardData = async () => {
    if (!account || !provider || !chainId) return

    try {
      const rewarderAddress = getStreamRewarderAddress(chainId)
      const usdtAddress = getUSDTAddress(chainId)
      const salaryReceiptAddress = getSalaryReceiptAddress(chainId)

      if (!rewarderAddress || rewarderAddress === '0x0000000000000000000000000000000000000000') {
        return
      }

      const rewarderContract = new ethers.Contract(
        rewarderAddress,
        StreamRewarderABI,
        provider
      )

      const salaryReceiptContract = new ethers.Contract(
        salaryReceiptAddress,
        SalaryReceiptTokenABI,
        provider
      )

      // Fetch reward data, user balance, and total supply in parallel
      const [rewardInfo, balance, supply] = await Promise.all([
        rewarderContract.rewards(usdtAddress),
        salaryReceiptContract.balanceOf(account),
        salaryReceiptContract.totalSupply()
      ])


      setRewardData({
        periodFinish: rewardInfo.periodFinish,
        rewardRate: rewardInfo.rewardRate,
        lastUpdateTime: rewardInfo.lastUpdateTime,
        rewardPerTokenStored: rewardInfo.rewardPerTokenStored,
        queuedRewards: rewardInfo.queuedRewards
      })
      setUserTokenBalance(balance)
      setTotalSupply(supply)
      lastUpdateTimeRef.current = Date.now()
    } catch (error) {
      console.error('Error fetching reward data:', error)
    }
  }

  useEffect(() => {
    if (account && provider && chainId) {
      fetchRewards()
    } else {
      // Clean up interval when wallet disconnects
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setDisplayEarnings(null)
      setRewardData(null)
      setUserTokenBalance(null)
      setTotalSupply(null)
      setRewardPerSecond(null)
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [account, provider, chainId])

  // Periodic sync with contract (every 10 seconds) to keep earned amount accurate
  useEffect(() => {
    if (!account || !provider || !chainId) return

    const syncInterval = setInterval(async () => {
      try {
        const rewarderAddress = getStreamRewarderAddress(chainId)
        const usdtAddress = getUSDTAddress(chainId)
        
        if (!rewarderAddress || rewarderAddress === '0x0000000000000000000000000000000000000000') {
          return
        }

        const contract = new ethers.Contract(
          rewarderAddress,
          StreamRewarderABI,
          provider
        )

        const earned = await contract.earned(account, usdtAddress)
        setEarnedAmount(earned)
        // Reset display to sync with contract
        setDisplayEarnings(earned)
        // Also refresh reward data
        await fetchRewardData()
      } catch (error) {
        console.error('Error syncing earnings:', error)
      }
    }, 10000) // Sync every 10 seconds

    return () => clearInterval(syncInterval)
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

      // Fetch current earned amount
      const earned = await contract.earned(account, usdtAddress)
      setEarnedAmount(earned)
      setDisplayEarnings(earned)
      
      // Also fetch reward data for real-time calculation
      await fetchRewardData()
    } catch (error) {
      console.error('Error fetching rewards:', error)
      setError('Failed to fetch earnings. Make sure the contract is deployed on this network.')
    } finally {
      setLoading(false)
    }
  }

  // Real-time earnings update effect
  useEffect(() => {
    if (!account || !rewardData || !userTokenBalance || !totalSupply || !earnedAmount) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const currentTime = Math.floor(Date.now() / 1000)
    const periodFinish = Number(rewardData.periodFinish)

    // Only update if period hasn't finished
    if (periodFinish > currentTime && rewardData.rewardRate > 0n && totalSupply > 0n && userTokenBalance > 0n) {
      // Calculate reward per second for user
      // rewardRate is in (reward decimal + DENOMINATOR) format
      // So actual rewardRate per second = rewardRate / DENOMINATOR
      // rewardPerSecondPerToken = (rewardRate / DENOMINATOR) / totalSupply
      // userRewardPerSecond = rewardPerSecondPerToken * userBalance
      // Simplified: (rewardRate * userBalance) / (totalSupply * DENOMINATOR)
      
      const rewardRate = rewardData.rewardRate
      const userBalance = userTokenBalance
      
      // Calculate reward per second: (rewardRate * userBalance) / (totalSupply * DENOMINATOR)
      // This gives us reward per second in the reward token's native decimals (18 for USDT)
      const numerator = rewardRate * userBalance
      const denominator = totalSupply * DENOMINATOR
      
      const calculatedRewardPerSecond = numerator / denominator
      
      // Store reward per second for display
      setRewardPerSecond(calculatedRewardPerSecond)
      
      // For 0.1 second updates, we need: rewardPerSecond * 0.1 = rewardPerSecond / 10
      // But we need to handle BigInt division properly
      // rewardPerInterval = rewardPerSecond / 10
      const rewardPerInterval = calculatedRewardPerSecond / 10n
      
      // Initialize display earnings with current earned amount
      setDisplayEarnings(earnedAmount)
      lastUpdateTimeRef.current = Date.now()
      
      // Update every 0.1 seconds - LOCAL CALCULATION ONLY, NO RPC CALLS
      // Simply increases the display value by the calculated reward per interval
      intervalRef.current = setInterval(() => {
        setDisplayEarnings((prev) => {
          if (!prev) return prev
          // Add reward for 0.1 seconds (local calculation, no RPC call)
          return prev + rewardPerInterval
        })
      }, 100)
    } else {
      // Period finished or no rewards, stop updating and use earned amount
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setDisplayEarnings(earnedAmount)
      setRewardPerSecond(null)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [account, rewardData, userTokenBalance, totalSupply, earnedAmount])

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
      setClaimSuccess(`Earnings claimed successfully!`)
      
      // Refresh rewards and reset display
      await fetchRewards()
      // Reset display earnings to trigger recalculation
      setDisplayEarnings(null)
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
    if (!account) return '--'
    if (!amount) return '0.000'
    try {
      // USDT typically has 6 decimals, but we'll use 18 for display
      const formatted = ethers.formatUnits(amount, 18)
      const num = parseFloat(formatted)
      // Show 3 decimal digits
      return num.toFixed(3)
    } catch (error) {
      return '0.000'
    }
  }

  const getRewardsInUSD = (amount) => {
    if (!account) return '--'
    if (!amount) return '0.000'
    try {
      const formatted = ethers.formatUnits(amount, 18)
      const num = parseFloat(formatted)
      // USDT price is $1
      // Show 3 decimal digits
      return num.toFixed(3)
    } catch (error) {
      return '0.000'
    }
  }

  const formatRewardRate = (rewardPerSecondAmount) => {
    if (!account || !rewardPerSecondAmount) {
      return null
    }
    try {
      const formatted = ethers.formatUnits(rewardPerSecondAmount, 18)
      const num = parseFloat(formatted)
      const result = num.toFixed(3)
      // Show 3 decimal digits for reward rate
      return result
    } catch (error) {
      return null
    }
  }

  // Calculate monthly salary from reward per second
  const getMonthlySalary = () => {
    if (!rewardPerSecond || rewardPerSecond === 0n) return null
    try {
      // rewardPerSecond * 60 * 60 * 24 * 30 (seconds in a month)
      const secondsInMonth = 60 * 60 * 24 * 30
      const monthlyReward = rewardPerSecond * BigInt(secondsInMonth)
      const formatted = ethers.formatUnits(monthlyReward, 18)
      return parseFloat(formatted).toFixed(3)
    } catch (error) {
      return null
    }
  }

  // Calculate yearly salary from reward per second
  const getYearlySalary = () => {
    if (!rewardPerSecond || rewardPerSecond === 0n) return null
    try {
      // rewardPerSecond * 60 * 60 * 24 * 365 (seconds in a year)
      const secondsInYear = 60 * 60 * 24 * 365
      const yearlyReward = rewardPerSecond * BigInt(secondsInYear)
      const formatted = ethers.formatUnits(yearlyReward, 18)
      return parseFloat(formatted).toFixed(3)
    } catch (error) {
      return null
    }
  }

  // Format expiration date from periodFinish
  const getExpirationDate = () => {
    if (!rewardData || !rewardData.periodFinish) return null
    try {
      const periodFinish = Number(rewardData.periodFinish)
      const date = new Date(periodFinish * 1000) // Convert from seconds to milliseconds
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch (error) {
      return null
    }
  }

  // Use displayEarnings for UI, fallback to earnedAmount
  const currentEarnings = displayEarnings !== null ? displayEarnings : earnedAmount
  const rewardsUSD = getRewardsInUSD(currentEarnings)
  const hasRewards = account && currentEarnings && currentEarnings > 0n
  
  // Check if user is on the correct network (Arbitrum = 42161)
  const ARBITRUM_CHAIN_ID = 42161
  const isCorrectNetwork = chainId === ARBITRUM_CHAIN_ID
  const needsNetworkSwitch = account && !isSampleMode && chainId && !isCorrectNetwork

  return (
    <div className="dashboard-page">
      <div className="page-container">
        <div className="page-header">
          <div className="header-title">
            <DashboardIcon size={24} className="header-icon" />
            <h1>Dashboard</h1>
          </div>
          <p className="page-subtitle">View and claim your accumulated earnings</p>
        </div>

        <div className="dashboard-content">
          <div className="rewards-card">
            <div className="card-glow"></div>
            <div className="rewards-header">
              <RewardsIcon size={20} className="rewards-icon" />
              <h2>Accumulated Earnings</h2>
            </div>

            {loading && account ? (
              <div className="loading-state">
                <div className="spinner-large"></div>
                <p>Loading earnings...</p>
              </div>
            ) : (
              <div className="rewards-layout">
                {/* Left Side - User Info Table */}
                <div className="user-info-section">
                  <table className="user-info-table">
                    <tbody>
                      <tr>
                        <td className="info-label">User Address:</td>
                        <td className="info-value">{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '--'}</td>
                      </tr>
                      <tr>
                        <td className="info-label">Monthly Salary:</td>
                        <td className="info-value">
                          {account && getMonthlySalary() ? (
                            <>
                              {getMonthlySalary()} USDT ($ {getMonthlySalary()})
                            </>
                          ) : (
                            '--'
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="info-label">Yearly Salary:</td>
                        <td className="info-value">
                          {account && getYearlySalary() ? (
                            <>
                              {getYearlySalary()} USDT
                            </>
                          ) : (
                            '--'
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="info-label">Expiration Date:</td>
                        <td className="info-value">
                          {account && getExpirationDate() ? getExpirationDate() : '--'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Right Side - Earnings Display and Claim Button */}
                <div className="earnings-section">
                  <div className="rewards-display">
                    <div className="rewards-amount">
                      <div className="amount-label">USDT Earnings</div>
                      <div className={`amount-value ${!account ? 'placeholder' : ''}`}>
                        {formatRewards(currentEarnings)} {account ? 'USDT' : ''}
                        {account && rewardPerSecond && rewardPerSecond > 0n && (
                          <span className="reward-rate"> ({formatRewardRate(rewardPerSecond)})</span>
                        )}
                      </div>
                      <div className={`amount-usd ${!account ? 'placeholder' : ''}`}>
                        {account ? '≈' : ''} ${rewardsUSD}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="error-message">
                      <WarningIcon size={18} className="error-icon" />
                      {error}
                    </div>
                  )}

                  {needsNetworkSwitch && (
                    <div className="error-message" style={{ background: 'rgba(255, 193, 7, 0.1)', borderColor: 'rgba(255, 193, 7, 0.3)', color: '#ffc107' }}>
                      <WarningIcon size={18} className="error-icon" />
                      Please switch to Arbitrum One network to use this app
                    </div>
                  )}

                  {claimSuccess && (
                    <div className="success-message">
                      <CheckIcon size={18} className="success-icon" />
                      {claimSuccess}
                    </div>
                  )}

                  {needsNetworkSwitch ? (
                    <button
                      className="claim-button"
                      onClick={onSwitchNetwork}
                      disabled={loading}
                    >
                      <WalletIcon size={18} />
                      Switch to Arbitrum One
                    </button>
                  ) : (
                    <button
                      className="claim-button"
                      onClick={account && !isSampleMode ? handleClaim : (!account ? onConnectWallet : undefined)}
                      disabled={!account || claiming || (!hasRewards && account) || isSampleMode}
                    >
                      {!account ? (
                        <>
                          <WalletIcon size={18} />
                          Connect Wallet
                        </>
                      ) : isSampleMode ? (
                        <>
                          <ClaimIcon size={18} />
                          Not available in sample mode
                        </>
                      ) : claiming ? (
                        <>
                          <span className="spinner"></span>
                          Claiming...
                        </>
                      ) : (
                        <>
                          <ClaimIcon size={18} />
                          Claim Earnings
                        </>
                      )}
                    </button>
                  )}

                  {account && !hasRewards && !loading && (
                    <div className="no-rewards-message">
                      <EmptyIcon size={32} className="no-rewards-icon" />
                      <p>No earnings available to claim</p>
                      <p className="no-rewards-subtitle">Keep accumulating earnings by holding salary receipt tokens</p>
                    </div>
                  )}

                  {needsNetworkSwitch ? (
                    <button
                      className="refresh-button"
                      onClick={onSwitchNetwork}
                      disabled={loading}
                    >
                      <WalletIcon size={16} />
                      Switch to Arbitrum One
                    </button>
                  ) : (
                    <button
                      className="refresh-button"
                      onClick={account ? fetchRewards : onConnectWallet}
                      disabled={!account || loading}
                    >
                      {!account ? (
                        <>
                          <WalletIcon size={16} />
                          Connect Wallet
                        </>
                      ) : (
                        <>
                          <RefreshIcon size={16} />
                          Refresh
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="info-cards">
            <div className="info-card">
              <InfoIcon size={24} className="info-icon" />
              <h3>How Earnings Work</h3>
              <p>Earn USDT earnings by holding salary receipt tokens. Earnings accumulate over time and can be claimed at any time.</p>
            </div>

            <div className="info-card">
              <LightningIcon size={24} className="info-icon" />
              <h3>Instant Claims</h3>
              <p>Claim your earnings instantly to your wallet. No waiting periods or restrictions.</p>
            </div>

            <div className="info-card">
              <LockIcon size={24} className="info-icon" />
              <h3>Secure & Transparent</h3>
              <p>All earnings are stored on-chain and can be verified at any time through the blockchain.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

