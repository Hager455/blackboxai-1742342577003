import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Stack,
    Text,
    useToast,
    VStack,
    HStack,
    Divider,
    useColorModeValue,
    Alert,
    AlertIcon,
    InputGroup,
    InputRightElement,
    IconButton,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaWallet } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useWeb3 } from '../../context/Web3Context';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');

    const { login } = useAuth();
    const { connectWallet, account } = useWeb3();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();

    const bgColor = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleWalletConnect = async () => {
        try {
            await connectWallet();
            toast({
                title: 'Wallet Connected',
                description: 'Successfully connected to MetaMask',
                status: 'success',
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: 'Connection Failed',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!account) {
            setError('Please connect your wallet first');
            setIsLoading(false);
            return;
        }

        try {
            const success = await login({
                ...formData,
                walletAddress: account
            });

            if (success) {
                const from = location.state?.from?.pathname || '/voter/dashboard';
                navigate(from, { replace: true });
            }
        } catch (error) {
            setError(error.message || 'Failed to login');
            toast({
                title: 'Login Failed',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
            <Stack spacing="8">
                <Stack spacing="6" textAlign="center">
                    <Heading size={{ base: 'xl', md: '2xl' }}>
                        Welcome to Web3 Voting
                    </Heading>
                    <Text color="gray.500">
                        Sign in to access your voting dashboard
                    </Text>
                </Stack>
                <Box
                    py={{ base: '0', sm: '8' }}
                    px={{ base: '4', sm: '10' }}
                    bg={bgColor}
                    boxShadow={{ base: 'none', sm: 'md' }}
                    borderRadius={{ base: 'none', sm: 'xl' }}
                    borderWidth={{ base: '0', sm: '1px' }}
                    borderColor={borderColor}
                >
                    <form onSubmit={handleSubmit}>
                        <Stack spacing="6">
                            {error && (
                                <Alert status="error" borderRadius="md">
                                    <AlertIcon />
                                    {error}
                                </Alert>
                            )}

                            <Button
                                variant="outline"
                                colorScheme="blue"
                                leftIcon={<FaWallet />}
                                onClick={handleWalletConnect}
                                isDisabled={!!account}
                            >
                                {account ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
                            </Button>

                            <VStack spacing="5">
                                <FormControl isRequired>
                                    <FormLabel>Email</FormLabel>
                                    <Input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        autoComplete="email"
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel>Password</FormLabel>
                                    <InputGroup>
                                        <Input
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={handleChange}
                                            autoComplete="current-password"
                                        />
                                        <InputRightElement>
                                            <IconButton
                                                variant="ghost"
                                                icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            />
                                        </InputRightElement>
                                    </InputGroup>
                                </FormControl>
                            </VStack>

                            <Button
                                type="submit"
                                colorScheme="blue"
                                size="lg"
                                fontSize="md"
                                isLoading={isLoading}
                                isDisabled={!account}
                            >
                                Sign in
                            </Button>

                            <HStack spacing="1" justify="center">
                                <Text color="gray.500">Don't have an account?</Text>
                                <Button
                                    as={RouterLink}
                                    to="/register"
                                    variant="link"
                                    colorScheme="blue"
                                >
                                    Register
                                </Button>
                            </HStack>
                        </Stack>
                    </form>
                </Box>
            </Stack>
        </Container>
    );
};

export default Login;
