import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    VStack,
    Heading,
    Text,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    useToast,
    Button,
    Grid,
    GridItem,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Badge,
    Divider
} from '@chakra-ui/react';
import FaceDetector from '../../components/biometrics/FaceDetector';
import FaceRecognition from '../../components/biometrics/FaceRecognition';
import IrisDetector from '../../components/biometrics/IrisDetector';
import IrisAnalyzer from '../../components/biometrics/IrisAnalyzer';

const VerificationStep = {
    FACE_DETECTION: 0,
    FACE_RECOGNITION: 1,
    IRIS_DETECTION: 2,
    IRIS_ANALYSIS: 3,
    COMPLETE: 4
};

const Dashboard = () => {
    const [currentStep, setCurrentStep] = useState(VerificationStep.FACE_DETECTION);
    const [verificationData, setVerificationData] = useState({
        faceImage: null,
        irisImage: null,
        verificationId: null
    });
    const [voterInfo, setVoterInfo] = useState(null);
    const [isVerified, setIsVerified] = useState(false);
    const toast = useToast();

    useEffect(() => {
        // Fetch voter information if already verified
        const fetchVoterInfo = async () => {
            try {
                const response = await fetch('/api/voter/info', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setVoterInfo(data.voter);
                    setIsVerified(data.isVerified);
                }
            } catch (error) {
                console.error('Error fetching voter info:', error);
            }
        };

        fetchVoterInfo();
    }, []);

    const handleFaceDetectionComplete = (faceImage) => {
        setVerificationData(prev => ({ ...prev, faceImage }));
        setCurrentStep(VerificationStep.FACE_RECOGNITION);
    };

    const handleFaceRecognitionComplete = (verificationId) => {
        setVerificationData(prev => ({ ...prev, verificationId }));
        setCurrentStep(VerificationStep.IRIS_DETECTION);
    };

    const handleIrisDetectionComplete = (irisImage) => {
        setVerificationData(prev => ({ ...prev, irisImage }));
        setCurrentStep(VerificationStep.IRIS_ANALYSIS);
    };

    const handleIrisAnalysisComplete = async (analysisId) => {
        try {
            // Final verification step
            const response = await fetch('/api/verify/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    verificationId: verificationData.verificationId,
                    analysisId
                })
            });

            const result = await response.json();
            
            if (result.success) {
                setIsVerified(true);
                setCurrentStep(VerificationStep.COMPLETE);
                toast({
                    title: 'Verification Complete',
                    description: 'You can now proceed to vote',
                    status: 'success',
                    duration: 5000
                });
            } else {
                toast({
                    title: 'Verification Failed',
                    description: result.error,
                    status: 'error',
                    duration: 5000
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to complete verification',
                status: 'error',
                duration: 5000
            });
        }
    };

    return (
        <Container maxW="container.xl" py={8}>
            <Grid templateColumns="repeat(12, 1fr)" gap={8}>
                {/* Voter Info Sidebar */}
                <GridItem colSpan={{ base: 12, md: 4 }}>
                    <Box borderWidth={1} borderRadius="lg" p={6}>
                        <VStack spacing={4} align="stretch">
                            <Heading size="md">Voter Information</Heading>
                            <Divider />
                            {voterInfo ? (
                                <>
                                    <Stat>
                                        <StatLabel>Voter ID</StatLabel>
                                        <StatNumber fontSize="md">
                                            {voterInfo.id}
                                        </StatNumber>
                                    </Stat>
                                    <Stat>
                                        <StatLabel>Status</StatLabel>
                                        <StatNumber fontSize="md">
                                            <Badge colorScheme={isVerified ? "green" : "yellow"}>
                                                {isVerified ? "Verified" : "Pending Verification"}
                                            </Badge>
                                        </StatNumber>
                                    </Stat>
                                    <Stat>
                                        <StatLabel>Registration Date</StatLabel>
                                        <StatHelpText>
                                            {new Date(voterInfo.registrationDate).toLocaleDateString()}
                                        </StatHelpText>
                                    </Stat>
                                </>
                            ) : (
                                <Text color="gray.500">Loading voter information...</Text>
                            )}
                        </VStack>
                    </Box>
                </GridItem>

                {/* Main Content */}
                <GridItem colSpan={{ base: 12, md: 8 }}>
                    <Box borderWidth={1} borderRadius="lg" p={6}>
                        <Heading size="md" mb={6}>Biometric Verification</Heading>
                        <Tabs index={currentStep} isLazy>
                            <TabList>
                                <Tab isDisabled={currentStep !== VerificationStep.FACE_DETECTION}>
                                    Face Detection
                                </Tab>
                                <Tab isDisabled={currentStep !== VerificationStep.FACE_RECOGNITION}>
                                    Face Recognition
                                </Tab>
                                <Tab isDisabled={currentStep !== VerificationStep.IRIS_DETECTION}>
                                    Iris Detection
                                </Tab>
                                <Tab isDisabled={currentStep !== VerificationStep.IRIS_ANALYSIS}>
                                    Iris Analysis
                                </Tab>
                            </TabList>

                            <TabPanels>
                                <TabPanel>
                                    <FaceDetector onDetectionComplete={handleFaceDetectionComplete} />
                                </TabPanel>
                                <TabPanel>
                                    <FaceRecognition 
                                        faceImage={verificationData.faceImage}
                                        onRecognitionComplete={handleFaceRecognitionComplete}
                                    />
                                </TabPanel>
                                <TabPanel>
                                    <IrisDetector onDetectionComplete={handleIrisDetectionComplete} />
                                </TabPanel>
                                <TabPanel>
                                    <IrisAnalyzer
                                        irisImage={verificationData.irisImage}
                                        onAnalysisComplete={handleIrisAnalysisComplete}
                                    />
                                </TabPanel>
                            </TabPanels>
                        </Tabs>

                        {currentStep === VerificationStep.COMPLETE && (
                            <VStack spacing={4} mt={8}>
                                <Badge colorScheme="green" p={2} fontSize="md">
                                    Verification Complete
                                </Badge>
                                <Button
                                    colorScheme="blue"
                                    size="lg"
                                    onClick={() => window.location.href = '/vote'}
                                >
                                    Proceed to Vote
                                </Button>
                            </VStack>
                        )}
                    </Box>
                </GridItem>
            </Grid>
        </Container>
    );
};

export default Dashboard;
