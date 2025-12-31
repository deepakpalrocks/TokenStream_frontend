# TokenStream Frontend

React frontend application for displaying Salary Receipt Token balances.

## Features

- Connect Web3 wallet (MetaMask, etc.)
- Display connected user's Salary Receipt Token balance
- Automatic balance refresh on account/network changes
- Support for multiple networks (Mainnet, Sepolia, Localhost)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update contract addresses in `src/addresses.js`:
   - Replace the placeholder addresses with your deployed contract addresses
   - Update addresses for each network you plan to use

3. Start development server:
```bash
npm run dev
```

## Configuration

### Etherscan API Key (Optional but Recommended)

For transfer history to work properly, you'll need an Etherscan API key:

1. Get a free API key from:
   - **Mainnet/Sepolia**: https://etherscan.io/apis
   - **Arbitrum**: https://arbiscan.io/apis

2. Create a `.env` file in the root directory:
   ```bash
   VITE_ETHERSCAN_API_KEY=your_api_key_here
   ```

3. The app will use Etherscan API V2 automatically when an API key is provided.

**Note**: Without an API key, the app will fall back to reading transfer events directly from the contract (limited to recent blocks).

### Contract Addresses

Edit `src/addresses.js` to add your deployed contract addresses:

```javascript
export const addresses = {
  mainnet: {
    salaryReceiptToken: "0xYourDeployedAddress",
  },
  sepolia: {
    salaryReceiptToken: "0xYourDeployedAddress",
  },
  localhost: {
    salaryReceiptToken: "0xYourDeployedAddress",
  },
};
```

## Build

To build for production:

```bash
npm run build
```

The built files will be in the `dist` folder.

## Requirements

- Node.js 18+ 
- A Web3 wallet (MetaMask recommended)
- Deployed SalaryReceiptToken contract

