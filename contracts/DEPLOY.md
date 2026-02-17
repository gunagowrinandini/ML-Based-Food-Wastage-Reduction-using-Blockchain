# Smart Contract Deployment Guide

## Prerequisites

1. **Node.js and npm** installed
2. **Hardhat** or **Remix IDE** for contract compilation and deployment
3. **MetaMask** browser extension
4. **Test ETH** (for testnet deployment) or **ETH** (for mainnet)

## Option 1: Deploy using Hardhat (Recommended for Development)

### Setup

```bash
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

### Configuration

Create or update `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.0",
  networks: {
    sepolia: {
      url: "YOUR_INFURA_OR_ALCHEMY_URL",
      accounts: ["YOUR_PRIVATE_KEY"]
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
```

### Deploy Script

Create `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const FoodDonation = await hre.ethers.getContractFactory("FoodDonation");
  const foodDonation = await FoodDonation.deploy();

  await foodDonation.deployed();

  console.log("FoodDonation deployed to:", foodDonation.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Deploy

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

Copy the deployed contract address and update `CONTRACT_ADDRESS` in `script.js`.

## Option 2: Deploy using Remix IDE (Easier for Beginners)

1. Go to https://remix.ethereum.org/
2. Create a new file `FoodDonation.sol` and paste the contract code
3. Compile the contract (Solidity version 0.8.0)
4. Go to "Deploy & Run Transactions"
5. Select your environment (Injected Web3 for MetaMask)
6. Make sure MetaMask is connected
7. Click "Deploy"
8. Copy the deployed contract address
9. Update `CONTRACT_ADDRESS` in `script.js`

## Update Contract Address

After deployment, update the contract address in `script.js`:

```javascript
const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE';
```

## Update NGO Addresses

Update the NGO addresses in `script.js` `initializeMockData()` function with valid Ethereum addresses.

## Testing

1. Open the application in a browser with MetaMask installed
2. Connect your wallet
3. Add items to cart
4. Select an NGO
5. Execute the donation transaction
6. Confirm the transaction in MetaMask
7. Wait for confirmation

## Networks

- **Sepolia Testnet**: Recommended for testing (free test ETH available)
- **Goerli Testnet**: Alternative testnet
- **Localhost**: For local development with Hardhat node
- **Mainnet**: For production (requires real ETH)

## Important Notes

- Never commit your private keys or seed phrases
- Always test on testnets before mainnet deployment
- Keep your contract address secure
- Verify your contract on Etherscan for transparency

