import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    VStack,
    Heading,
    Text,
    Card,
    CardBody,
    CardHeader,
    FormControl,
    FormLabel,
    Input,
    Switch,
    Button,
    useToast,
    Divider,
    SimpleGrid,
    Select,
    Textarea,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    HStack,
    Badge,
    IconButton,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
} from '@chakra-ui/react';
import { FaSave, FaKey, FaCog, FaShieldAlt, FaDatabase, FaExclamationTriangle } from 'react-icons/fa';
import { useWeb3 } from '../../context/Web3Context';

const Settings = () => {
    const [settings, setSettings] = useState({
        votingEnabled: false,
        registrationEnabled: false,
        verificationThreshold: 85,
        minimumVoterAge: 18,
        contractAddress: '',
        apiEndpoints: {
            faceAuth: '',
            faceRecognition: '',
            irisDetection: '',
            irisAnalysis: '',
        },
        securitySettings: {
            maxLoginAttempts: 3,
            sessionTimeout: 30,
            requireTwoFactor: false,
        },
        emailSettings: {
            smtpServer: '',
            smtpPort: '',
            smtpUsername: '',
            smtpPassword: '',
            senderEmail: '',
        }
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();
    const { account } = useWeb3();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await fetch('/api/admin/settings', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setSettings(data.settings);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load settings',
                status: 'error',
                duration: 5000
            });
        }
    };

    const handleChange = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: typeof field === 'string' 
                ? value 
                : { ...prev[section], [field]: value }
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            setIsSubmitting(true);
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(settings)
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Success',
                    description: 'Settings updated successfully',
                    status: 'success',
                    duration: 3000
                });
                setHasChanges(false);
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
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetSystem = async () => {
        try {
            const response = await fetch('/api/admin/settings/reset', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Success',
                    description: 'System reset successfully',
                    status: 'success',
                    duration: 3000
                });
                onClose();
                loadSettings();
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

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                <Box>
                    <Heading size="lg">System Settings</Heading>
                    <Text color="gray.600">Configure system parameters and integrations</Text>
                </Box>

                {hasChanges && (
                    <Alert status="warning">
                        <AlertIcon />
                        <AlertTitle>Unsaved Changes</AlertTitle>
                        <AlertDescription>
                            You have unsaved changes. Please save or discard them.
                        </AlertDescription>
                    </Alert>
                )}

                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    {/* Voting Settings */}
                    <Card>
                        <CardHeader>
                            <HStack>
                                <FaCog />
                                <Heading size="md">Voting Configuration</Heading>
                            </HStack>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={4} align="stretch">
                                <FormControl display="flex" alignItems="center">
                                    <FormLabel mb="0">Enable Voting</FormLabel>
                                    <Switch
                                        isChecked={settings.votingEnabled}
                                        onChange={(e) => handleChange('votingEnabled', null, e.target.checked)}
                                    />
                                </FormControl>
                                <FormControl display="flex" alignItems="center">
                                    <FormLabel mb="0">Enable Registration</FormLabel>
                                    <Switch
                                        isChecked={settings.registrationEnabled}
                                        onChange={(e) => handleChange('registrationEnabled', null, e.target.checked)}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Verification Threshold (%)</FormLabel>
                                    <Input
                                        type="number"
                                        value={settings.verificationThreshold}
                                        onChange={(e) => handleChange('verificationThreshold', null, parseInt(e.target.value))}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Minimum Voter Age</FormLabel>
                                    <Input
                                        type="number"
                                        value={settings.minimumVoterAge}
                                        onChange={(e) => handleChange('minimumVoterAge', null, parseInt(e.target.value))}
                                    />
                                </FormControl>
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* Blockchain Settings */}
                    <Card>
                        <CardHeader>
                            <HStack>
                                <FaKey />
                                <Heading size="md">Blockchain Configuration</Heading>
                            </HStack>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={4} align="stretch">
                                <FormControl>
                                    <FormLabel>Contract Address</FormLabel>
                                    <Input
                                        value={settings.contractAddress}
                                        onChange={(e) => handleChange('contractAddress', null, e.target.value)}
                                        placeholder="0x..."
                                    />
                                </FormControl>
                                <Alert status="info" size="sm">
                                    <AlertIcon />
                                    Connected to Sepolia Network
                                </Alert>
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* API Endpoints */}
                    <Card>
                        <CardHeader>
                            <HStack>
                                <FaDatabase />
                                <Heading size="md">API Endpoints</Heading>
                            </HStack>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={4} align="stretch">
                                <FormControl>
                                    <FormLabel>Face Authentication API</FormLabel>
                                    <Input
                                        value={settings.apiEndpoints.faceAuth}
                                        onChange={(e) => handleChange('apiEndpoints', 'faceAuth', e.target.value)}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Face Recognition API</FormLabel>
                                    <Input
                                        value={settings.apiEndpoints.faceRecognition}
                                        onChange={(e) => handleChange('apiEndpoints', 'faceRecognition', e.target.value)}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Iris Detection API</FormLabel>
                                    <Input
                                        value={settings.apiEndpoints.irisDetection}
                                        onChange={(e) => handleChange('apiEndpoints', 'irisDetection', e.target.value)}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Iris Analysis API</FormLabel>
                                    <Input
                                        value={settings.apiEndpoints.irisAnalysis}
                                        onChange={(e) => handleChange('apiEndpoints', 'irisAnalysis', e.target.value)}
                                    />
                                </FormControl>
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* Security Settings */}
                    <Card>
                        <CardHeader>
                            <HStack>
                                <FaShieldAlt />
                                <Heading size="md">Security Settings</Heading>
                            </HStack>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={4} align="stretch">
                                <FormControl>
                                    <FormLabel>Maximum Login Attempts</FormLabel>
                                    <Input
                                        type="number"
                                        value={settings.securitySettings.maxLoginAttempts}
                                        onChange={(e) => handleChange('securitySettings', 'maxLoginAttempts', parseInt(e.target.value))}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Session Timeout (minutes)</FormLabel>
                                    <Input
                                        type="number"
                                        value={settings.securitySettings.sessionTimeout}
                                        onChange={(e) => handleChange('securitySettings', 'sessionTimeout', parseInt(e.target.value))}
                                    />
                                </FormControl>
                                <FormControl display="flex" alignItems="center">
                                    <FormLabel mb="0">Require Two-Factor Authentication</FormLabel>
                                    <Switch
                                        isChecked={settings.securitySettings.requireTwoFactor}
                                        onChange={(e) => handleChange('securitySettings', 'requireTwoFactor', e.target.checked)}
                                    />
                                </FormControl>
                            </VStack>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                <Divider />

                {/* Action Buttons */}
                <HStack spacing={4} justify="space-between">
                    <Button
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<FaExclamationTriangle />}
                        onClick={onOpen}
                    >
                        Reset System
                    </Button>
                    <HStack spacing={4}>
                        <Button
                            variant="outline"
                            onClick={loadSettings}
                            isDisabled={!hasChanges}
                        >
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            leftIcon={<FaSave />}
                            onClick={handleSave}
                            isLoading={isSubmitting}
                            isDisabled={!hasChanges}
                        >
                            Save Changes
                        </Button>
                    </HStack>
                </HStack>

                {/* Reset Confirmation Modal */}
                <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Confirm System Reset</ModalHeader>
                        <ModalBody>
                            <Alert status="error">
                                <AlertIcon />
                                <VStack align="start" spacing={2}>
                                    <AlertTitle>Warning: This action cannot be undone!</AlertTitle>
                                    <AlertDescription>
                                        Resetting the system will:
                                        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                                            <li>Clear all votes</li>
                                            <li>Remove all registered voters</li>
                                            <li>Reset all settings to default</li>
                                        </ul>
                                    </AlertDescription>
                                </VStack>
                            </Alert>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={onClose}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={handleResetSystem}>
                                Reset System
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </VStack>
        </Container>
    );
};

export default Settings;
