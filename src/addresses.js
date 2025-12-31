// Contract addresses configuration
// Update these addresses after deploying your contracts

export const addresses = {
  // Mainnet addresses (update after deployment)
  mainnet: {
    salaryReceiptToken: "0xcfbaf55da879f89a2ccbfcbf66d4b5d0eb227590",
    streamRewarder: "0x63a044a10137973f89474f8bf91414718cc23638",
    usdt: "0x7db021efa5a5e96cc97b093b7e874fa82019dcfe",
  },
  // Sepolia testnet addresses (update after deployment)
  sepolia: {
    salaryReceiptToken: "0xcfbaf55da879f89a2ccbfcbf66d4b5d0eb227590",
    streamRewarder: "0x63a044a10137973f89474f8bf91414718cc23638",
    usdt: "0x7db021efa5a5e96cc97b093b7e874fa82019dcfe",
  },
  // Local development addresses (update after deployment)
  localhost: {
    salaryReceiptToken: "0xcfbaf55da879f89a2ccbfcbf66d4b5d0eb227590",
    streamRewarder: "0x63a044a10137973f89474f8bf91414718cc23638",
    usdt: "0x7db021efa5a5e96cc97b093b7e874fa82019dcfe",
  },
};

// Get the address based on the current network
export const getSalaryReceiptAddress = (chainId) => {
  // Mainnet
  if (chainId === 42161) {
    return addresses.mainnet.salaryReceiptToken;
  }
  // Sepolia
  if (chainId === 11155111) {
    return addresses.sepolia.salaryReceiptToken;
  }
  // Localhost/Hardhat
  if (chainId === 31337 || chainId === 1337) {
    return addresses.localhost.salaryReceiptToken;
  }
  // Default to localhost
  return addresses.localhost.salaryReceiptToken;
};

export const getStreamRewarderAddress = (chainId) => {
  if (chainId === 42161) {
    return addresses.mainnet.streamRewarder;
  }
  if (chainId === 11155111) {
    return addresses.sepolia.streamRewarder;
  }
  if (chainId === 31337 || chainId === 1337) {
    return addresses.localhost.streamRewarder;
  }
  return addresses.localhost.streamRewarder;
};

export const getUSDTAddress = (chainId) => {
  if (chainId === 42161) {
    return addresses.mainnet.usdt;
  }
  if (chainId === 11155111) {
    return addresses.sepolia.usdt;
  }
  if (chainId === 31337 || chainId === 1337) {
    return addresses.localhost.usdt;
  }
  return addresses.localhost.usdt;
};

