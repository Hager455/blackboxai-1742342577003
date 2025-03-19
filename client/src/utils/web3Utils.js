import Web3 from 'web3';
import { InjectedConnector } from '@web3-react/injected-connector';

// Network configurations
export const NETWORKS = {
    SEPOLIA: {
        chainId: '0xaa36a7',
        chainName: 'Sepolia Test Network',
        nativeCurrency: {
            name: 'Sepolia Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: ['https://sepolia.infura.io/v3/'],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
    },
};

// Connector configuration
export const injected = new InjectedConnector({
    supportedChainIds: [11155111], // Sepolia chainId
});

// Utility functions
export const getWeb3 = () => {
    return new Promise(async (resolve, reject) => {
        // Modern browsers
        if (window.ethereum) {
            const web3 = new Web3(window.ethereum);
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                resolve(web3);
            } catch (error) {
                reject(error);
            }
        }
        // Legacy dapp browsers
        else if (window.web3) {
            resolve(new Web3(window.web3.currentProvider));
        }
        // No web3 provider
        else {
            reject(new Error('No Web3 provider detected. Please install MetaMask.'));
        }
    });
};

// Switch network if not on Sepolia
export const switchToSepolia = async () => {
    if (!window.ethereum) throw new Error('No Web3 provider detected');

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: NETWORKS.SEPOLIA.chainId }],
        });
    } catch (switchError) {
        // Chain hasn't been added to MetaMask
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [NETWORKS.SEPOLIA],
                });
            } catch (addError) {
                throw new Error('Failed to add Sepolia network to MetaMask');
            }
        } else {
            throw switchError;
        }
    }
};

// Format wallet address for display
export const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Convert Wei to ETH
export const weiToEth = (wei) => {
    return Web3.utils.fromWei(wei.toString(), 'ether');
};

// Convert ETH to Wei
export const ethToWei = (eth) => {
    return Web3.utils.toWei(eth.toString(), 'ether');
};

// Validate Ethereum address
export const isValidAddress = (address) => {
    return Web3.utils.isAddress(address);
};

// Get transaction receipt and wait for confirmation
export const waitForTransaction = async (web3, txHash, confirmations = 1) => {
    let receipt = null;
    while (!receipt) {
        receipt = await web3.eth.getTransactionReceipt(txHash);
        if (!receipt) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }
    }

    const currentBlock = await web3.eth.getBlockNumber();
    while (currentBlock - receipt.blockNumber < confirmations) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return receipt;
};

// Estimate gas for transaction
export const estimateGas = async (web3, txParams) => {
    try {
        const gas = await web3.eth.estimateGas(txParams);
        return Math.floor(gas * 1.2); // Add 20% buffer
    } catch (error) {
        throw new Error(`Failed to estimate gas: ${error.message}`);
    }
};

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
};

// Check if connected to correct network
export const isCorrectNetwork = async (web3) => {
    try {
        const chainId = await web3.eth.getChainId();
        return chainId === 11155111; // Sepolia chainId
    } catch (error) {
        console.error('Error checking network:', error);
        return false;
    }
};

// Get network name from chainId
export const getNetworkName = (chainId) => {
    const networks = {
        1: 'Ethereum Mainnet',
        11155111: 'Sepolia Testnet',
        5: 'Goerli Testnet',
        137: 'Polygon Mainnet',
        80001: 'Mumbai Testnet',
    };
    return networks[chainId] || 'Unknown Network';
};

// Event listeners for account and network changes
export const setupWeb3Listeners = (callback) => {
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
            callback({ type: 'ACCOUNT_CHANGED', accounts });
        });

        window.ethereum.on('chainChanged', (chainId) => {
            callback({ type: 'CHAIN_CHANGED', chainId });
        });

        window.ethereum.on('disconnect', () => {
            callback({ type: 'DISCONNECTED' });
        });
    }
};

// Remove Web3 listeners
export const removeWeb3Listeners = (callback) => {
    if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', callback);
        window.ethereum.removeListener('chainChanged', callback);
        window.ethereum.removeListener('disconnect', callback);
    }
};
