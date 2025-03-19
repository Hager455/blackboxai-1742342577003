import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    VStack,
    Heading,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    useToast,
    Badge,
    Button,
    HStack,
    Text,
    Input,
    InputGroup,
    InputLeftElement,
    Stack,
    Stat,
    StatLabel,
    StatNumber,
    StatGroup,
    Card,
    CardBody,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    IconButton,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Spinner,
} from '@chakra-ui/react';
import { 
    FaSearch, 
    FaFilter, 
    FaUserPlus, 
    FaChevronDown,
    FaCheck,
    FaTimes,
    FaUserShield,
    FaUserClock
} from 'react-icons/fa';
import { useWeb3 } from '../../context/Web3Context';

const VoterManagement = () => {
    const [voters, setVoters] = useState([]);
    const [filteredVoters, setFilteredVoters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [stats, setStats] = useState({
        total: 0,
        verified: 0,
        pending: 0,
        voted: 0
    });
    const [selectedVoter, setSelectedVoter] = useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();
    const { account, votingContract } = useWeb3();

    useEffect(() => {
        loadVoters();
    }, []);

    useEffect(() => {
        filterVoters();
    }, [searchTerm, filter, voters]);

    const loadVoters = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/voters', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setVoters(data.voters);
                updateStats(data.voters);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load voters',
                status: 'error',
                duration: 5000
            });
        } finally {
            setLoading(false);
        }
    };

    const updateStats = (votersList) => {
        const stats = votersList.reduce((acc, voter) => ({
            total: acc.total + 1,
            verified: acc.verified + (voter.isVerified ? 1 : 0),
            pending: acc.pending + (!voter.isVerified ? 1 : 0),
            voted: acc.voted + (voter.hasVoted ? 1 : 0)
        }), { total: 0, verified: 0, pending: 0, voted: 0 });

        setStats(stats);
    };

    const filterVoters = () => {
        let filtered = [...voters];

        // Apply search
        if (searchTerm) {
            filtered = filtered.filter(voter => 
                voter.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                voter.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply filter
        switch (filter) {
            case 'verified':
                filtered = filtered.filter(voter => voter.isVerified);
                break;
            case 'pending':
                filtered = filtered.filter(voter => !voter.isVerified);
                break;
            case 'voted':
                filtered = filtered.filter(voter => voter.hasVoted);
                break;
            case 'not-voted':
                filtered = filtered.filter(voter => !voter.hasVoted);
                break;
            default:
                break;
        }

        setFilteredVoters(filtered);
    };

    const handleVerifyVoter = async (voterId) => {
        try {
            const response = await fetch(`/api/admin/voters/${voterId}/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                // Update voter status in blockchain
                await votingContract.methods.registerVoter(data.voter.walletAddress, data.voter.biometricHash)
                    .send({ from: account });

                toast({
                    title: 'Success',
                    description: 'Voter verified successfully',
                    status: 'success',
                    duration: 3000
                });

                loadVoters();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                status: 'error',
                duration: 5000
            });
        }
    };

    const handleViewDetails = (voter) => {
        setSelectedVoter(voter);
        onOpen();
    };

    if (loading) {
        return (
            <Container maxW="container.xl" centerContent py={8}>
                <Spinner size="xl" />
            </Container>
        );
    }

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                <HStack justify="space-between">
                    <Box>
                        <Heading size="lg">Voter Management</Heading>
                        <Text color="gray.600">Monitor and manage registered voters</Text>
                    </Box>
                </HStack>

                {/* Statistics Cards */}
                <StatGroup>
                    <Card flex="1">
                        <CardBody>
                            <Stat>
                                <StatLabel>Total Voters</StatLabel>
                                <StatNumber>{stats.total}</StatNumber>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card flex="1">
                        <CardBody>
                            <Stat>
                                <StatLabel>Verified Voters</StatLabel>
                                <StatNumber>{stats.verified}</StatNumber>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card flex="1">
                        <CardBody>
                            <Stat>
                                <StatLabel>Pending Verification</StatLabel>
                                <StatNumber>{stats.pending}</StatNumber>
                            </Stat>
                        </CardBody>
                    </Card>
                    <Card flex="1">
                        <CardBody>
                            <Stat>
                                <StatLabel>Votes Cast</StatLabel>
                                <StatNumber>{stats.voted}</StatNumber>
                            </Stat>
                        </CardBody>
                    </Card>
                </StatGroup>

                {/* Search and Filter */}
                <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                    <InputGroup maxW={{ base: 'full', md: '300px' }}>
                        <InputLeftElement pointerEvents="none">
                            <FaSearch color="gray.300" />
                        </InputLeftElement>
                        <Input
                            placeholder="Search voters..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                    <Menu>
                        <MenuButton as={Button} rightIcon={<FaChevronDown />} leftIcon={<FaFilter />}>
                            Filter: {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </MenuButton>
                        <MenuList>
                            <MenuItem onClick={() => setFilter('all')}>All Voters</MenuItem>
                            <MenuItem onClick={() => setFilter('verified')}>Verified</MenuItem>
                            <MenuItem onClick={() => setFilter('pending')}>Pending</MenuItem>
                            <MenuItem onClick={() => setFilter('voted')}>Voted</MenuItem>
                            <MenuItem onClick={() => setFilter('not-voted')}>Not Voted</MenuItem>
                        </MenuList>
                    </Menu>
                </Stack>

                {/* Voters Table */}
                <Box overflowX="auto">
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th>Voter ID</Th>
                                <Th>Wallet Address</Th>
                                <Th>Registration Date</Th>
                                <Th>Status</Th>
                                <Th>Vote Status</Th>
                                <Th>Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredVoters.map((voter) => (
                                <Tr key={voter.id}>
                                    <Td>{voter.id}</Td>
                                    <Td>{`${voter.walletAddress.slice(0, 6)}...${voter.walletAddress.slice(-4)}`}</Td>
                                    <Td>{new Date(voter.registrationDate).toLocaleDateString()}</Td>
                                    <Td>
                                        <Badge colorScheme={voter.isVerified ? "green" : "yellow"}>
                                            {voter.isVerified ? "Verified" : "Pending"}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <Badge colorScheme={voter.hasVoted ? "blue" : "gray"}>
                                            {voter.hasVoted ? "Voted" : "Not Voted"}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <HStack spacing={2}>
                                            <IconButton
                                                icon={<FaUserShield />}
                                                aria-label="View details"
                                                size="sm"
                                                onClick={() => handleViewDetails(voter)}
                                            />
                                            {!voter.isVerified && (
                                                <IconButton
                                                    icon={<FaCheck />}
                                                    aria-label="Verify voter"
                                                    size="sm"
                                                    colorScheme="green"
                                                    onClick={() => handleVerifyVoter(voter.id)}
                                                />
                                            )}
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            </VStack>

            {/* Voter Details Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Voter Details</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedVoter && (
                            <VStack spacing={4} align="stretch">
                                <FormControl>
                                    <FormLabel>Voter ID</FormLabel>
                                    <Text>{selectedVoter.id}</Text>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Wallet Address</FormLabel>
                                    <Text>{selectedVoter.walletAddress}</Text>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Registration Date</FormLabel>
                                    <Text>{new Date(selectedVoter.registrationDate).toLocaleString()}</Text>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Verification Status</FormLabel>
                                    <Badge colorScheme={selectedVoter.isVerified ? "green" : "yellow"}>
                                        {selectedVoter.isVerified ? "Verified" : "Pending"}
                                    </Badge>
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Vote Status</FormLabel>
                                    <Badge colorScheme={selectedVoter.hasVoted ? "blue" : "gray"}>
                                        {selectedVoter.hasVoted ? "Voted" : "Not Voted"}
                                    </Badge>
                                </FormControl>
                                {selectedVoter.hasVoted && (
                                    <FormControl>
                                        <FormLabel>Vote Timestamp</FormLabel>
                                        <Text>{new Date(selectedVoter.voteTimestamp).toLocaleString()}</Text>
                                    </FormControl>
                                )}
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Container>
    );
};

export default VoterManagement;
