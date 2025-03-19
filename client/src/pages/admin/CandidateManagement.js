import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    VStack,
    Heading,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    useDisclosure,
    Badge,
    IconButton,
    HStack,
    Text,
    Alert,
    AlertIcon,
    Spinner,
} from '@chakra-ui/react';
import { FaEdit, FaTrash, FaUserPlus } from 'react-icons/fa';
import { useWeb3 } from '../../context/Web3Context';

const CandidateManagement = () => {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        party: '',
        description: ''
    });
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();
    const { account, votingContract } = useWeb3();

    useEffect(() => {
        loadCandidates();
    }, []);

    const loadCandidates = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/candidates', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                setCandidates(data.candidates);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load candidates',
                status: 'error',
                duration: 5000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddCandidate = async () => {
        try {
            if (!formData.name || !formData.party) {
                throw new Error('Please fill in all required fields');
            }

            const response = await fetch('/api/admin/candidates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                // Add candidate to blockchain
                await votingContract.methods.addCandidate(formData.name)
                    .send({ from: account });

                toast({
                    title: 'Success',
                    description: 'Candidate added successfully',
                    status: 'success',
                    duration: 3000
                });

                loadCandidates();
                onClose();
                setFormData({ name: '', party: '', description: '' });
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

    const handleEditCandidate = async (candidate) => {
        setSelectedCandidate(candidate);
        setFormData({
            name: candidate.name,
            party: candidate.party,
            description: candidate.description || ''
        });
        onOpen();
    };

    const handleUpdateCandidate = async () => {
        try {
            const response = await fetch(`/api/admin/candidates/${selectedCandidate.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Success',
                    description: 'Candidate updated successfully',
                    status: 'success',
                    duration: 3000
                });

                loadCandidates();
                onClose();
                setSelectedCandidate(null);
                setFormData({ name: '', party: '', description: '' });
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

    const handleDeleteCandidate = async (candidateId) => {
        if (window.confirm('Are you sure you want to delete this candidate?')) {
            try {
                const response = await fetch(`/api/admin/candidates/${candidateId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const data = await response.json();

                if (data.success) {
                    toast({
                        title: 'Success',
                        description: 'Candidate deleted successfully',
                        status: 'success',
                        duration: 3000
                    });

                    loadCandidates();
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
        }
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
                        <Heading size="lg">Candidate Management</Heading>
                        <Text color="gray.600">Manage election candidates</Text>
                    </Box>
                    <Button
                        leftIcon={<FaUserPlus />}
                        colorScheme="blue"
                        onClick={() => {
                            setSelectedCandidate(null);
                            setFormData({ name: '', party: '', description: '' });
                            onOpen();
                        }}
                    >
                        Add Candidate
                    </Button>
                </HStack>

                {candidates.length === 0 ? (
                    <Alert status="info">
                        <AlertIcon />
                        No candidates have been added yet.
                    </Alert>
                ) : (
                    <Box overflowX="auto">
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
                                        <Td>{candidate.voteCount}</Td>
                                        <Td>
                                            <Badge colorScheme={candidate.isActive ? "green" : "red"}>
                                                {candidate.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            <HStack spacing={2}>
                                                <IconButton
                                                    icon={<FaEdit />}
                                                    aria-label="Edit candidate"
                                                    size="sm"
                                                    onClick={() => handleEditCandidate(candidate)}
                                                />
                                                <IconButton
                                                    icon={<FaTrash />}
                                                    aria-label="Delete candidate"
                                                    size="sm"
                                                    colorScheme="red"
                                                    onClick={() => handleDeleteCandidate(candidate.id)}
                                                />
                                            </HStack>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </Box>
                )}
            </VStack>

            {/* Add/Edit Candidate Modal */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {selectedCandidate ? 'Edit Candidate' : 'Add New Candidate'}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Name</FormLabel>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter candidate name"
                                />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>Party</FormLabel>
                                <Input
                                    value={formData.party}
                                    onChange={(e) => setFormData({ ...formData, party: e.target.value })}
                                    placeholder="Enter party name"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Description</FormLabel>
                                <Input
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Enter candidate description"
                                />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={selectedCandidate ? handleUpdateCandidate : handleAddCandidate}
                        >
                            {selectedCandidate ? 'Update' : 'Add'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Container>
    );
};

export default CandidateManagement;
