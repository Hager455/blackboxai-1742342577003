import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    VStack,
    Heading,
    Text,
    Grid,
    GridItem,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    useDisclosure,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    SimpleGrid
} from '@chakra-ui/react';

const AdminDashboard = () => {
    const [candidates, setCandidates] = useState([]);
    const [voters, setVoters] = useState([]);
    const [stats, setStats] = useState({
        totalVoters: 0,
        verifiedVoters: 0,
        totalVotes: 0,
        votingProgress: 0
    });
    const [newCandidate, setNewCandidate] = useState({ name: '', party: '' });
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch candidates
            const candidatesResponse = await fetch('/api/admin/candidates', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            const candidatesData = await candidatesResponse.json();
            setCandidates(candidatesData.candidates);

            // Fetch voters
            const votersResponse = await fetch('/api/admin/voters', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            const votersData = await votersResponse.json();
            setVoters(votersData.voters);

            // Calculate statistics
            const totalVoters = votersData.voters.length;
            const verifiedVoters = votersData.voters.filter(v => v.isVerified).length;
            const totalVotes = votersData.voters.filter(v => v.hasVoted).length;

            setStats({
                totalVoters,
                verifiedVoters,
                totalVotes,
                votingProgress: totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0
            });

        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch dashboard data',
                status: 'error',
                duration: 5000
            });
        }
    };

    const handleAddCandidate = async () => {
        try {
            const response = await fetch('/api/admin/candidates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(newCandidate)
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Candidate added successfully',
                    status: 'success',
                    duration: 5000
                });
                fetchDashboardData();
                onClose();
                setNewCandidate({ name: '', party: '' });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to add candidate',
                status: 'error',
                duration: 5000
            });
        }
    };

    return (
        <Container maxW="container.xl" py={8}>
            {/* Statistics Cards */}
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
                <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="lg">
                    <StatLabel>Total Voters</StatLabel>
                    <StatNumber>{stats.totalVoters}</StatNumber>
                    <StatHelpText>
                        <StatArrow type="increase" />
                        {((stats.totalVoters / 1000) * 100).toFixed(1)}% from last month
                    </StatHelpText>
                </Stat>

                <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="lg">
                    <StatLabel>Verified Voters</StatLabel>
                    <StatNumber>{stats.verifiedVoters}</StatNumber>
                    <StatHelpText>
                        {((stats.verifiedVoters / stats.totalVoters) * 100).toFixed(1)}% of total
                    </StatHelpText>
                </Stat>

                <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="lg">
                    <StatLabel>Total Votes Cast</StatLabel>
                    <StatNumber>{stats.totalVotes}</StatNumber>
                    <StatHelpText>
                        {stats.votingProgress.toFixed(1)}% participation
                    </StatHelpText>
                </Stat>

                <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="lg">
                    <StatLabel>Active Candidates</StatLabel>
                    <StatNumber>{candidates.length}</StatNumber>
                    <StatHelpText>
                        <Button size="sm" colorScheme="blue" onClick={onOpen}>
                            Add Candidate
                        </Button>
                    </StatHelpText>
                </Stat>
            </SimpleGrid>

            {/* Candidates Table */}
            <Box borderWidth={1} borderRadius="lg" p={6} mb={8}>
                <Heading size="md" mb={4}>Candidates</Heading>
                <Table variant="simple">
                    <Thead>
                        <Tr>
                            <Th>Name</Th>
                            <Th>Party</Th>
                            <Th>Votes</Th>
                            <Th>Status</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {candidates.map((candidate) => (
                            <Tr key={candidate.id}>
                                <Td>{candidate.name}</Td>
                                <Td>{candidate.party}</Td>
                                <Td>{candidate.votes}</Td>
                                <Td>
                                    <Badge colorScheme={candidate.isActive ? "green" : "red"}>
                                        {candidate.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </Td>
                                <Td>
                                    <Button size="sm" colorScheme="red" variant="outline">
                                        Remove
                                    </Button>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>

            {/* Recent Voters */}
            <Box borderWidth={1} borderRadius="lg" p={6}>
                <Heading size="md" mb={4}>Recent Voters</Heading>
                <Table variant="simple">
                    <Thead>
                        <Tr>
                            <Th>Voter ID</Th>
                            <Th>Status</Th>
                            <Th>Verification Date</Th>
                            <Th>Vote Status</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {voters.slice(0, 5).map((voter) => (
                            <Tr key={voter.id}>
                                <Td>{voter.id}</Td>
                                <Td>
                                    <Badge colorScheme={voter.isVerified ? "green" : "yellow"}>
                                        {voter.isVerified ? "Verified" : "Pending"}
                                    </Badge>
                                </Td>
                                <Td>{voter.verificationDate || "Not verified"}</Td>
                                <Td>
                                    <Badge colorScheme={voter.hasVoted ? "blue" : "gray"}>
                                        {voter.hasVoted ? "Voted" : "Not Voted"}
                                    </Badge>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>

            {/* Add Candidate Modal */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Add New Candidate</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>Candidate Name</FormLabel>
                                <Input 
                                    value={newCandidate.name}
                                    onChange={(e) => setNewCandidate({
                                        ...newCandidate,
                                        name: e.target.value
                                    })}
                                    placeholder="Enter candidate name"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Party</FormLabel>
                                <Input 
                                    value={newCandidate.party}
                                    onChange={(e) => setNewCandidate({
                                        ...newCandidate,
                                        party: e.target.value
                                    })}
                                    placeholder="Enter party name"
                                />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="blue" onClick={handleAddCandidate}>
                            Add Candidate
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Container>
    );
};

export default AdminDashboard;
