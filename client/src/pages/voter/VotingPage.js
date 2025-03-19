import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    VStack,
    Heading,
    Text,
    Button,
    SimpleGrid,
    useToast,
    Badge,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Progress,
    Alert,
    AlertIcon,
    Card,
    CardBody,
    CardHeader,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
} from '@chakra-ui/react';
import { useWeb3 } from '../../context/Web3Context';
import { useBiometric } from '../../context/BiometricContext';
import { useNavigate } from 'react-router-dom';

const VotingPage = () => {
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isVoting, setIsVoting] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();
    const navigate = useNavigate();

    const { 
        account, 
        votingContract, 
        castVote, 
        getCandidates,
        hasVoted: checkVoteStatus 
    } = useWeb3();

    const { verificationState } = useBiometric();

    useEffect(() => {
        loadCandidates();
        checkPreviousVote();
    }, [account]);

    const loadCandidates = async () => {
        try {
            const candidatesList = await getCandidates();
            setCandidates(candidatesList);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load candidates',
                status: 'error',
                duration: 5000,
            });
        }
    };

    const checkPreviousVote = async () => {
        if (account) {
            try {
                const voted = await checkVoteStatus(account);
                setHasVoted(voted);
            } catch (error) {
                console.error('Error checking vote status:', error);
            }
        }
    };

    const handleVote = async () => {
        if (!selectedCandidate) {
            toast({
                title: 'Selection Required',
                description: 'Please select a candidate to vote',
                status: 'warning',
                duration: 3000,
            });
            return;
        }

        if (!verificationState.verificationId) {
            toast({
                title: 'Verification Required',
                description: 'Please complete biometric verification first',
                status: 'warning',
                duration: 3000,
            });
            navigate('/voter/verify');
            return;
        }

        try {
            setIsVoting(true);
            onOpen();

            const result = await castVote(selectedCandidate.id);
            
            if (result) {
                setHasVoted(true);
                toast({
                    title: 'Success',
                    description: 'Your vote has been recorded successfully',
                    status: 'success',
                    duration: 5000,
                });
                
                // Refresh candidates list
                await loadCandidates();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to cast vote',
                status: 'error',
                duration: 5000,
            });
        } finally {
            setIsVoting(false);
            onClose();
        }
    };

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                <Box>
                    <Heading size="lg" mb={2}>Cast Your Vote</Heading>
                    <Text color="gray.600">
                        Select your preferred candidate and confirm your vote
                    </Text>
                </Box>

                {hasVoted ? (
                    <Alert status="info">
                        <AlertIcon />
                        You have already cast your vote in this election.
                    </Alert>
                ) : (
                    <>
                        {/* Voting Status */}
                        <Card>
                            <CardHeader>
                                <Heading size="md">Voting Status</Heading>
                            </CardHeader>
                            <CardBody>
                                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                    <Stat>
                                        <StatLabel>Verification Status</StatLabel>
                                        <StatNumber>
                                            <Badge colorScheme={verificationState.verificationId ? "green" : "red"}>
                                                {verificationState.verificationId ? "Verified" : "Not Verified"}
                                            </Badge>
                                        </StatNumber>
                                    </Stat>
                                    <Stat>
                                        <StatLabel>Connected Wallet</StatLabel>
                                        <StatNumber fontSize="md">
                                            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not Connected'}
                                        </StatNumber>
                                    </Stat>
                                    <Stat>
                                        <StatLabel>Network</StatLabel>
                                        <StatNumber fontSize="md">Sepolia</StatNumber>
                                        <StatHelpText>Ethereum Testnet</StatHelpText>
                                    </Stat>
                                </SimpleGrid>
                            </CardBody>
                        </Card>

                        {/* Candidates Grid */}
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                            {candidates.map((candidate) => (
                                <Card
                                    key={candidate.id}
                                    cursor="pointer"
                                    onClick={() => setSelectedCandidate(candidate)}
                                    bg={selectedCandidate?.id === candidate.id ? 'blue.50' : 'white'}
                                    borderWidth={2}
                                    borderColor={selectedCandidate?.id === candidate.id ? 'blue.500' : 'gray.200'}
                                    _hover={{ borderColor: 'blue.500' }}
                                    transition="all 0.2s"
                                >
                                    <CardBody>
                                        <VStack spacing={4} align="stretch">
                                            <Heading size="md">{candidate.name}</Heading>
                                            <Text color="gray.600">Votes: {candidate.voteCount}</Text>
                                            <Progress 
                                                value={(candidate.voteCount / candidates.reduce((acc, curr) => acc + parseInt(curr.voteCount), 0)) * 100} 
                                                colorScheme="blue" 
                                                size="sm" 
                                            />
                                        </VStack>
                                    </CardBody>
                                </Card>
                            ))}
                        </SimpleGrid>

                        {/* Vote Button */}
                        <Box textAlign="center" pt={4}>
                            <Button
                                colorScheme="blue"
                                size="lg"
                                onClick={handleVote}
                                isDisabled={!selectedCandidate || !verificationState.verificationId || hasVoted}
                                isLoading={isVoting}
                            >
                                Cast Vote
                            </Button>
                        </Box>
                    </>
                )}
            </VStack>

            {/* Voting Confirmation Modal */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Confirming Vote</ModalHeader>
                    <ModalBody>
                        <VStack spacing={4}>
                            <Text>Processing your vote for:</Text>
                            <Heading size="md">{selectedCandidate?.name}</Heading>
                            <Progress size="xs" isIndeterminate w="100%" />
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Text fontSize="sm" color="gray.500">
                            Please confirm the transaction in MetaMask
                        </Text>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Container>
    );
};

export default VotingPage;
