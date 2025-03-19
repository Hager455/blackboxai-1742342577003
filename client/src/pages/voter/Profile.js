import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    VStack,
    Heading,
    Text,
    Button,
    FormControl,
    FormLabel,
    Input,
    useToast,
    Card,
    CardHeader,
    CardBody,
    Stack,
    Badge,
    Divider,
    Avatar,
    HStack,
    useColorModeValue,
} from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';
import { useWeb3 } from '../../context/Web3Context';

const Profile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
    });
    const [loading, setLoading] = useState(false);

    const { user, updateProfile } = useAuth();
    const { account } = useWeb3();
    const toast = useToast();

    const bgColor = useColorModeValue('white', 'gray.700');

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const success = await updateProfile(formData);
            if (success) {
                toast({
                    title: 'Profile Updated',
                    description: 'Your profile has been successfully updated',
                    status: 'success',
                    duration: 3000,
                });
                setIsEditing(false);
            }
        } catch (error) {
            toast({
                title: 'Update Failed',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxW="container.lg" py={8}>
            <VStack spacing={8} align="stretch">
                <Box>
                    <Heading size="lg">My Profile</Heading>
                    <Text color="gray.600">Manage your account information</Text>
                </Box>

                <Card bg={bgColor}>
                    <CardHeader>
                        <HStack spacing={4}>
                            <Avatar 
                                size="xl" 
                                name={`${formData.firstName} ${formData.lastName}`}
                            />
                            <Box>
                                <Heading size="md">
                                    {`${formData.firstName} ${formData.lastName}`}
                                </Heading>
                                <Text color="gray.500">{formData.email}</Text>
                                <Badge colorScheme="green" mt={2}>Verified Voter</Badge>
                            </Box>
                        </HStack>
                    </CardHeader>
                    <CardBody>
                        <Stack spacing={6}>
                            <Box>
                                <Heading size="sm" mb={4}>Wallet Information</Heading>
                                <Text>
                                    <strong>Address: </strong>
                                    {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected'}
                                </Text>
                            </Box>

                            <Divider />

                            <Box>
                                <HStack justify="space-between" mb={4}>
                                    <Heading size="sm">Personal Information</Heading>
                                    <Button
                                        size="sm"
                                        onClick={() => setIsEditing(!isEditing)}
                                        variant="outline"
                                    >
                                        {isEditing ? 'Cancel' : 'Edit'}
                                    </Button>
                                </HStack>

                                {isEditing ? (
                                    <form onSubmit={handleSubmit}>
                                        <Stack spacing={4}>
                                            <FormControl>
                                                <FormLabel>First Name</FormLabel>
                                                <Input
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                />
                                            </FormControl>
                                            <FormControl>
                                                <FormLabel>Last Name</FormLabel>
                                                <Input
                                                    name="lastName"
                                                    value={formData.lastName}
                                                    onChange={handleChange}
                                                />
                                            </FormControl>
                                            <FormControl>
                                                <FormLabel>Email</FormLabel>
                                                <Input
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    type="email"
                                                />
                                            </FormControl>
                                            <FormControl>
                                                <FormLabel>Phone Number</FormLabel>
                                                <Input
                                                    name="phoneNumber"
                                                    value={formData.phoneNumber}
                                                    onChange={handleChange}
                                                    type="tel"
                                                />
                                            </FormControl>
                                            <Button
                                                type="submit"
                                                colorScheme="blue"
                                                isLoading={loading}
                                            >
                                                Save Changes
                                            </Button>
                                        </Stack>
                                    </form>
                                ) : (
                                    <Stack spacing={4}>
                                        <Box>
                                            <Text color="gray.500">First Name</Text>
                                            <Text>{formData.firstName}</Text>
                                        </Box>
                                        <Box>
                                            <Text color="gray.500">Last Name</Text>
                                            <Text>{formData.lastName}</Text>
                                        </Box>
                                        <Box>
                                            <Text color="gray.500">Email</Text>
                                            <Text>{formData.email}</Text>
                                        </Box>
                                        <Box>
                                            <Text color="gray.500">Phone Number</Text>
                                            <Text>{formData.phoneNumber || 'Not provided'}</Text>
                                        </Box>
                                    </Stack>
                                )}
                            </Box>

                            <Divider />

                            <Box>
                                <Heading size="sm" mb={4}>Voting History</Heading>
                                <Text color="gray.500">
                                    Your voting activity will appear here after you participate in an election.
                                </Text>
                            </Box>
                        </Stack>
                    </CardBody>
                </Card>
            </VStack>
        </Container>
    );
};

export default Profile;
