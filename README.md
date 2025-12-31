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

