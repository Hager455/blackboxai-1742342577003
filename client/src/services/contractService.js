import Web3 from 'web3';
import { config } from '../config/appConfig';
import { 
    waitForTransaction, 
    estimateGas, 
    switchToSepolia 
} from '../utils/web3Utils';
import VotingContractABI from '../contracts/VotingContract.json';

class ContractService {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
    }

    // Initialize Web3 and contract
    async initialize() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                // Create Web3 instance
                this.web3 = new Web3(window.ethereum);

                // Request account access
                await window.ethereum.request({ method: 'eth_requestAccounts' });

                // Get current account
                const accounts = await this.web3.eth.getAccounts();
                this.account = accounts[0];

                // Check and switch to correct network
                await switchToSepolia();

                // Initialize contract
                this.contract = new this.web3.eth.Contract(
                    VotingContractABI,
                    config.BLOCKCHAIN.CONTRACTS.VOTING.ADDRESS
                );

                // Set up event listeners
                this.setupEventListeners();

                return true;
            } else {
                throw new Error('Please install MetaMask to use this application');
            }
        } catch (error) {
            console.error('Contract initialization error:', error);
            throw error;
        }
    }

    // Set up blockchain event listeners
    setupEventListeners() {
        const events = config.BLOCKCHAIN.CONTRACTS.VOTING.EVENTS;

        // Vote cast event
        this.contract.events[events.VOTE_CAST]()
            .on('data', (event) => {
                console.log('Vote cast:', event.returnValues);
            })
            .on('error', console.error);

        // Voter registered event
        this.contract.events[events.VOTER_REGISTERED]()
            .on('data', (event) => {
                console.log('Voter registered:', event.returnValues);
            })
            .on('error', console.error);

        // Candidate added event
        this.contract.events[events.CANDIDATE_ADDED]()
            .on('data', (event) => {
                console.log('Candidate added:', event.returnValues);
            })
            .on('error', console.error);
    }

    // Voter-related methods
    async registerVoter(voterAddress, biometricHash) {
        try {
            const gas = await estimateGas(this.web3, {
                from: this.account,
                to: this.contract.options.address,
                data: this.contract.methods.registerVoter(voterAddress, biometricHash).encodeABI()
            });

            const transaction = await this.contract.methods
                .registerVoter(voterAddress, biometricHash)
                .send({
                    from: this.account,
                    gas
                });

            await waitForTransaction(
                this.web3,
                transaction.transactionHash,
                config.BLOCKCHAIN.CONFIRMATIONS.REQUIRED
            );

            return transaction;
        } catch (error) {
            console.error('Error registering voter:', error);
            throw error;
        }
    }

    async castVote(candidateId) {
        try {
            const gas = await estimateGas(this.web3, {
                from: this.account,
                to: this.contract.options.address,
                data: this.contract.methods.castVote(candidateId).encodeABI()
            });

            const transaction = await this.contract.methods
                .castVote(candidateId)
                .send({
                    from: this.account,
                    gas
                });

            await waitForTransaction(
                this.web3,
                transaction.transactionHash,
                config.BLOCKCHAIN.CONFIRMATIONS.REQUIRED
            );

            return transaction;
        } catch (error) {
            console.error('Error casting vote:', error);
            throw error;
        }
    }

    async hasVoted(voterAddress) {
        try {
            return await this.contract.methods.hasVoted(voterAddress).call();
        } catch (error) {
            console.error('Error checking voter status:', error);
            throw error;
        }
    }

    // Candidate-related methods
    async addCandidate(name, party) {
        try {
            const gas = await estimateGas(this.web3, {
                from: this.account,
                to: this.contract.options.address,
                data: this.contract.methods.addCandidate(name, party).encodeABI()
            });

            const transaction = await this.contract.methods
                .addCandidate(name, party)
                .send({
                    from: this.account,
                    gas
                });

            await waitForTransaction(
                this.web3,
                transaction.transactionHash,
                config.BLOCKCHAIN.CONFIRMATIONS.REQUIRED
            );

            return transaction;
        } catch (error) {
            console.error('Error adding candidate:', error);
            throw error;
        }
    }

    async getCandidates() {
        try {
            const count = await this.contract.methods.getCandidateCount().call();
            const candidates = [];

            for (let i = 0; i < count; i++) {
                const candidate = await this.contract.methods.getCandidate(i).call();
                candidates.push({
                    id: i,
                    name: candidate.name,
                    party: candidate.party,
                    voteCount: candidate.voteCount
                });
            }

            return candidates;
        } catch (error) {
            console.error('Error getting candidates:', error);
            throw error;
        }
    }

    // Voting statistics methods
    async getVotingStatistics() {
        try {
            const totalVoters = await this.contract.methods.getTotalVoters().call();
            const totalVotes = await this.contract.methods.getTotalVotes().call();
            const candidates = await this.getCandidates();

            return {
                totalVoters: parseInt(totalVoters),
                totalVotes: parseInt(totalVotes),
                candidates,
                participationRate: totalVoters > 0 
                    ? (totalVotes / totalVoters) * 100 
                    : 0
            };
        } catch (error) {
            console.error('Error getting voting statistics:', error);
            throw error;
        }
    }

    // Admin methods
    async isAdmin(address) {
        try {
            return await this.contract.methods.isAdmin(address).call();
        } catch (error) {
            console.error('Error checking admin status:', error);
            throw error;
        }
    }

    async addAdmin(address) {
        try {
            const gas = await estimateGas(this.web3, {
                from: this.account,
                to: this.contract.options.address,
                data: this.contract.methods.addAdmin(address).encodeABI()
            });

            const transaction = await this.contract.methods
                .addAdmin(address)
                .send({
                    from: this.account,
                    gas
                });

            await waitForTransaction(
                this.web3,
                transaction.transactionHash,
                config.BLOCKCHAIN.CONFIRMATIONS.REQUIRED
            );

            return transaction;
        } catch (error) {
            console.error('Error adding admin:', error);
            throw error;
        }
    }

    // Utility methods
    async getContractBalance() {
        try {
            const balance = await this.web3.eth.getBalance(this.contract.options.address);
            return this.web3.utils.fromWei(balance, 'ether');
        } catch (error) {
            console.error('Error getting contract balance:', error);
            throw error;
        }
    }

    // Event subscription methods
    subscribeToVotes(callback) {
        return this.contract.events[config.BLOCKCHAIN.CONTRACTS.VOTING.EVENTS.VOTE_CAST]()
            .on('data', callback)
            .on('error', console.error);
    }

    subscribeToVoterRegistration(callback) {
        return this.contract.events[config.BLOCKCHAIN.CONTRACTS.VOTING.EVENTS.VOTER_REGISTERED]()
            .on('data', callback)
            .on('error', console.error);
    }

    subscribeToCandidateAddition(callback) {
        return this.contract.events[config.BLOCKCHAIN.CONTRACTS.VOTING.EVENTS.CANDIDATE_ADDED]()
            .on('data', callback)
            .on('error', console.error);
    }
}

export const contractService = new ContractService();
export default contractService;
