import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { contractService, stateService } from '../services';
import { useWeb3 } from './useWeb3';
import { useBiometric } from './useBiometric';

export const useVoting = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [candidates, setCandidates] = useState([]);
    const [votingStats, setVotingStats] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    const { account, isConnected } = useWeb3();
    const { isVerificationComplete } = useBiometric();
    const toast = useToast();

    // Load candidates
    const loadCandidates = useCallback(async () => {
        try {
            setIsLoading(true);
            const candidatesList = await contractService.getCandidates();
            setCandidates(candidatesList);

            // Update state
            stateService.updateVotingState({
                candidates: candidatesList,
            });

            return candidatesList;
        } catch (error) {
            console.error('Error loading candidates:', error);
            toast({
                title: 'Error',
                description: 'Failed to load candidates',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    // Load voting statistics
    const loadVotingStats = useCallback(async () => {
        try {
            setIsLoading(true);
            const stats = await contractService.getVotingStatistics();
            setVotingStats(stats);

            // Update state
            stateService.updateVotingState({
                statistics: stats,
            });

            return stats;
        } catch (error) {
            console.error('Error loading voting statistics:', error);
            toast({
                title: 'Error',
                description: 'Failed to load voting statistics',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    // Check if user has voted
    const checkVoteStatus = useCallback(async () => {
        if (!account) return false;

        try {
            const voted = await contractService.hasVoted(account);
            setHasVoted(voted);

            // Update state
            stateService.updateVotingState({
                hasVoted: voted,
            });

            return voted;
        } catch (error) {
            console.error('Error checking vote status:', error);
            return false;
        }
    }, [account]);

    // Cast vote
    const castVote = useCallback(async (candidateId) => {
        if (!isConnected) {
            throw new Error('Please connect your wallet first');
        }

        if (!isVerificationComplete) {
            throw new Error('Please complete biometric verification first');
        }

        if (hasVoted) {
            throw new Error('You have already voted');
        }

        try {
            setIsLoading(true);
            const transaction = await contractService.castVote(candidateId);

            toast({
                title: 'Vote Cast Successfully',
                description: `Transaction hash: ${transaction.transactionHash}`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            // Update states
            setHasVoted(true);
            await loadCandidates();
            await loadVotingStats();

            stateService.updateVotingState({
                hasVoted: true,
            });

            return transaction;
        } catch (error) {
            console.error('Error casting vote:', error);
            toast({
                title: 'Voting Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            throw error;
        } finally {
            setIsLoading(false);
            setSelectedCandidate(null);
        }
    }, [isConnected, isVerificationComplete, hasVoted, loadCandidates, loadVotingStats, toast]);

    // Subscribe to voting events
    const subscribeToVotingEvents = useCallback(() => {
        const voteSubscription = contractService.subscribeToVotes((event) => {
            // Reload data when new vote is cast
            loadCandidates();
            loadVotingStats();
            if (account === event.returnValues.voter) {
                setHasVoted(true);
            }
        });

        const candidateSubscription = contractService.subscribeToCandidateAddition(() => {
            // Reload candidates when new candidate is added
            loadCandidates();
        });

        return () => {
            voteSubscription.unsubscribe();
            candidateSubscription.unsubscribe();
        };
    }, [account, loadCandidates, loadVotingStats]);

    // Initialize voting data
    useEffect(() => {
        if (isConnected) {
            loadCandidates();
            loadVotingStats();
            checkVoteStatus();
            const unsubscribe = subscribeToVotingEvents();
            return unsubscribe;
        }
    }, [isConnected, loadCandidates, loadVotingStats, checkVoteStatus, subscribeToVotingEvents]);

    // Calculate voting metrics
    const getVotingMetrics = useCallback(() => {
        if (!votingStats) return null;

        const totalVotes = votingStats.totalVotes;
        const participationRate = votingStats.participationRate;

        const candidateMetrics = candidates.map(candidate => ({
            ...candidate,
            percentage: totalVotes > 0 
                ? (parseInt(candidate.voteCount) / totalVotes) * 100 
                : 0,
        }));

        return {
            totalVotes,
            participationRate,
            candidates: candidateMetrics,
        };
    }, [candidates, votingStats]);

    return {
        isLoading,
        candidates,
        votingStats,
        hasVoted,
        selectedCandidate,
        setSelectedCandidate,
        castVote,
        loadCandidates,
        loadVotingStats,
        checkVoteStatus,
        getVotingMetrics,
        canVote: isConnected && isVerificationComplete && !hasVoted,
    };
};

export default useVoting;
