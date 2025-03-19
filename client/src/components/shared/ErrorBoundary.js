import React from 'react';
import {
    Box,
    Container,
    Heading,
    Text,
    Button,
    VStack,
    useColorModeValue,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Code,
} from '@chakra-ui/react';
import { FaHome, FaRedo } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log error to error reporting service
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            return <ErrorFallback 
                error={this.state.error}
                errorInfo={this.state.errorInfo}
                onReset={this.handleReset}
            />;
        }

        return this.props.children;
    }
}

const ErrorFallback = ({ error, errorInfo, onReset }) => {
    const bgColor = useColorModeValue('gray.50', 'gray.900');
    const cardBgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    return (
        <Box bg={bgColor} minH="100vh" py={10}>
            <Container maxW="container.lg">
                <VStack
                    spacing={8}
                    bg={cardBgColor}
                    p={8}
                    borderRadius="lg"
                    boxShadow="md"
                    border="1px"
                    borderColor={borderColor}
                >
                    <Alert
                        status="error"
                        variant="subtle"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        textAlign="center"
                        borderRadius="lg"
                        py={6}
                    >
                        <AlertIcon boxSize="40px" mr={0} />
                        <AlertTitle mt={4} mb={1} fontSize="lg">
                            Something went wrong
                        </AlertTitle>
                        <AlertDescription maxWidth="sm">
                            We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.
                        </AlertDescription>
                    </Alert>

                    {process.env.NODE_ENV === 'development' && error && (
                        <Box w="100%">
                            <Heading size="sm" mb={2}>Error Details:</Heading>
                            <Code
                                p={4}
                                w="100%"
                                bg="gray.900"
                                color="white"
                                borderRadius="md"
                                whiteSpace="pre-wrap"
                            >
                                {error.toString()}
                                {errorInfo && errorInfo.componentStack}
                            </Code>
                        </Box>
                    )}

                    <VStack spacing={4}>
                        <Button
                            leftIcon={<FaRedo />}
                            colorScheme="blue"
                            onClick={onReset}
                        >
                            Try Again
                        </Button>
                        <Button
                            as={RouterLink}
                            to="/"
                            leftIcon={<FaHome />}
                            variant="outline"
                        >
                            Return Home
                        </Button>
                    </VStack>
                </VStack>
            </Container>
        </Box>
    );
};

export default ErrorBoundary;
