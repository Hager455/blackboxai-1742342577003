import React, { createContext, useContext, useState, useEffect } from 'react';
import Web3 from 'web3';
import { useToast } from '@chakra-ui/react';
import VotingContractABI from '../contracts/VotingContract.json';

const Web3Context = createContext(null);

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useWeb3 must be used within a Web3Provider');
    }
    return context;
};

export const Web3Provider = ({ children }) => {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [networkId, setNetworkId] = useState(null);
    const [votingContract, setVotingContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

    // Initialize Web3
    const initWeb3 = async () => {
        try {
            if (window.ethereum) {
                const web3Instance = new Web3(window.ethereum);
                setWeb3(web3Instance);

                // Get network ID
                const network = await web3Instance.eth.net.getId();
                setNetworkId(network);

                // Initialize contract
                if (CONTRACT_ADDRESS) {
                    const contract = new web3Instance.eth.Contract(
                        VotingContractABI,
                        CONTRACT_ADDRESS
                    );
                    setVotingContract(contract);
                }

                // Check if already connected
                const accounts = await web3Instance.eth.getAccounts();
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                }
            } else {
                toast({
                    title: 'Web3 Not Found',
                    description: 'Please install MetaMask to use this application',
                    status: 'warning',
                    duration: 5000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error('Web3 initialization error:', error);
            toast({
                title: 'Error',
                description: 'Failed to initialize Web3',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // Connect wallet
    const connectWallet = async () => {
        try {
            if (!web3) {
                throw new Error('Web3 not initialized');
            }

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });
            setAccount(accounts[0]);

            toast({
                title: 'Wallet Connected',
                description: 'Successfully connected to MetaMask',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            return accounts[0];
        } catch (error) {
            console.error('Connection error:', error);
            toast({
                title: 'Connection Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            throw error;
        }
    };

    // Cast vote
    const castVote = async (candidateId) => {
        try {
            if (!votingContract || !account) {
                throw new Error('Contract or account not initialized');
            }

            const gasEstimate = await votingContract.methods
                .castVote(candidateId)
                .estimateGas({ from: account });

            const result = await votingContract.methods
                .castVote(candidateId)
                .send({
                    from: account,
                    gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
                });

            toast({
                title: 'Vote Cast Successfully',
                description: `Transaction hash: ${result.transactionHash}`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            return result;
        } catch (error) {
            console.error('Voting error:', error);
            toast({
                title: 'Voting Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            throw error;
        }
    };

    // Get candidates
    const getCandidates = async () => {
        try {
            if (!votingContract) {
                throw new Error('Contract not initialized');
            }

            const count = await votingContract.methods.getCandidateCount().call();
            const candidates = [];

            for (let i = 0; i < count; i++) {
                const candidate = await votingContract.methods.getCandidate(i).call();
                candidates.push({
                    id: i,
                    name: candidate.name,
                    voteCount: candidate.voteCount,
                });
            }

            return candidates;
        } catch (error) {
            console.error('Error fetching candidates:', error);
            throw error;
        }
    };

    // Check if voter has already voted
    const hasVoted = async (address) => {
        try {
            if (!votingContract) {
                throw new Error('Contract not initialized');
            }

            const voter = await votingContract.methods.voters(address).call();
            return voter.hasVoted;
        } catch (error) {
            console.error('Error checking voter status:', error);
            throw error;
        }
    };

    // Listen for account changes
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                setAccount(accounts[0] || null);
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }

        initWeb3();

        return () => {
            if (window.ethereum) {
                window.ethereum.removeAllListeners();
            }
        };
    }, []);

    const value = {
        web3,
        account,
        networkId,
        votingContract,
        loading,
        connectWallet,
        castVote,
        getCandidates,
        hasVoted,
    };

    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export default Web3Context;
