import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { contractService, stateService } from '../services';
import { switchToSepolia } from '../utils/web3Utils';
import { config } from '../config/appConfig';

export const useWeb3 = () => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const toast = useToast();

    // Initialize Web3
    const initialize = useCallback(async () => {
        try {
            setIsConnecting(true);
            await contractService.initialize();
            setIsInitialized(true);

            // Update network state
            stateService.updateNetworkState({
                isConnected: true,
                chainId: await contractService.web3.eth.getChainId(),
                account: contractService.account,
            });

            return true;
        } catch (error) {
            console.error('Web3 initialization error:', error);
            toast({
                title: 'Connection Error',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return false;
        } finally {
            setIsConnecting(false);
        }
    }, [toast]);

    // Connect wallet
    const connectWallet = useCallback(async () => {
        try {
            setIsConnecting(true);

            if (!window.ethereum) {
                throw new Error('Please install MetaMask to use this application');
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });

            // Switch to Sepolia network
            await switchToSepolia();

            // Update state
            stateService.updateNetworkState({
                isConnected: true,
                account: accounts[0],
            });

            toast({
                title: 'Wallet Connected',
                description: 'Successfully connected to MetaMask',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            return accounts[0];
        } catch (error) {
            console.error('Wallet connection error:', error);
            toast({
                title: 'Connection Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            throw error;
        } finally {
            setIsConnecting(false);
        }
    }, [toast]);

    // Disconnect wallet
    const disconnectWallet = useCallback(() => {
        stateService.updateNetworkState({
            isConnected: false,
            account: null,
        });
    }, []);

    // Setup event listeners
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    disconnectWallet();
                } else {
                    stateService.updateNetworkState({
                        account: accounts[0],
                    });
                }
            });

            window.ethereum.on('chainChanged', (chainId) => {
                window.location.reload();
            });

            window.ethereum.on('disconnect', () => {
                disconnectWallet();
            });
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeAllListeners();
            }
        };
    }, [disconnectWallet]);

    // Get network info
    const getNetworkInfo = useCallback(async () => {
        if (!contractService.web3) return null;

        try {
            const chainId = await contractService.web3.eth.getChainId();
            const networkName = config.BLOCKCHAIN.NETWORK_NAME;
            const blockNumber = await contractService.web3.eth.getBlockNumber();

            return {
                chainId,
                networkName,
                blockNumber,
                isCorrectNetwork: chainId === config.BLOCKCHAIN.NETWORK_ID,
            };
        } catch (error) {
            console.error('Error getting network info:', error);
            return null;
        }
    }, []);

    // Get account balance
    const getBalance = useCallback(async (address) => {
        if (!contractService.web3 || !address) return '0';

        try {
            const balance = await contractService.web3.eth.getBalance(address);
            return contractService.web3.utils.fromWei(balance, 'ether');
        } catch (error) {
            console.error('Error getting balance:', error);
            return '0';
        }
    }, []);

    return {
        isConnecting,
        isInitialized,
        web3: contractService.web3,
        account: stateService.getState().network.account,
        isConnected: stateService.isWalletConnected(),
        initialize,
        connectWallet,
        disconnectWallet,
        getNetworkInfo,
        getBalance,
    };
};

export default useWeb3;
