import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    VStack,
    Heading,
    SimpleGrid,
    Card,
    CardBody,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Text,
    Select,
    HStack,
    Progress,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Spinner,
    useColorModeValue,
} from '@chakra-ui/react';
import { useWeb3 } from '../../context/Web3Context';

const Statistics = () => {
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('24h');
    const [stats, setStats] = useState({
        totalVoters: 0,
        activeVoters: 0,
        totalVotes: 0,
        verificationRate: 0,
        participationRate: 0,
        recentActivity: [],
        candidateStats: [],
        hourlyVotes: [],
    });

    const bgColor = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    useEffect(() => {
        loadStatistics();
    }, [timeRange]);

    const loadStatistics = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/statistics?timeRange=${timeRange}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setStats(data.statistics);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        } finally {
            setLoading(false);
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
                        <Heading size="lg">Voting Statistics</Heading>
                        <Text color="gray.600">Analytics and voting trends</Text>
                    </Box>
                    <Select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        width="200px"
                    >
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="all">All Time</option>
                    </Select>
                </HStack>

                {/* Key Metrics */}
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>Total Voters</StatLabel>
                                <StatNumber>{stats.totalVoters}</StatNumber>
                                <StatHelpText>
                                    <StatArrow type="increase" />
                                    {stats.voterGrowth}% from last period
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>Active Voters</StatLabel>
                                <StatNumber>{stats.activeVoters}</StatNumber>
                                <StatHelpText>
                                    {((stats.activeVoters / stats.totalVoters) * 100).toFixed(1)}% participation
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>Total Votes Cast</StatLabel>
                                <StatNumber>{stats.totalVotes}</StatNumber>
                                <StatHelpText>
                                    <StatArrow type="increase" />
                                    {stats.voteGrowth}% from last period
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>Verification Rate</StatLabel>
                                <StatNumber>{stats.verificationRate}%</StatNumber>
                                <StatHelpText>
                                    Of registered voters
                                </StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                {/* Candidate Performance */}
                <Card>
                    <CardBody>
                        <Heading size="md" mb={4}>Candidate Performance</Heading>
                        <VStack spacing={4} align="stretch">
                            {stats.candidateStats.map((candidate) => (
                                <Box key={candidate.id}>
                                    <HStack justify="space-between" mb={2}>
                                        <Text fontWeight="medium">{candidate.name}</Text>
                                        <Text>{candidate.votePercentage}%</Text>
                                    </HStack>
                                    <Progress
                                        value={candidate.votePercentage}
                                        colorScheme="blue"
                                        size="sm"
                                        borderRadius="full"
                                    />
                                </Box>
                            ))}
                        </VStack>
                    </CardBody>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardBody>
                        <Heading size="md" mb={4}>Recent Activity</Heading>
                        <Table variant="simple">
                            <Thead>
                                <Tr>
                                    <Th>Time</Th>
                                    <Th>Activity</Th>
                                    <Th>Status</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {stats.recentActivity.map((activity, index) => (
                                    <Tr key={index}>
                                        <Td>{new Date(activity.timestamp).toLocaleString()}</Td>
                                        <Td>{activity.description}</Td>
                                        <Td>
                                            <Badge colorScheme={activity.status === 'success' ? 'green' : 'red'}>
                                                {activity.status}
                                            </Badge>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </CardBody>
                </Card>

                {/* Hourly Vote Distribution */}
                <Card>
                    <CardBody>
                        <Heading size="md" mb={4}>Hourly Vote Distribution</Heading>
                        <SimpleGrid columns={24} spacing={1}>
                            {stats.hourlyVotes.map((hour, index) => (
                                <Box
                                    key={index}
                                    h="100px"
                                    bg={bgColor}
                                    border="1px"
                                    borderColor={borderColor}
                                    position="relative"
                                >
                                    <Box
                                        position="absolute"
                                        bottom="0"
                                        left="0"
                                        right="0"
                                        bg="blue.500"
                                        h={`${(hour.votes / Math.max(...stats.hourlyVotes.map(h => h.votes))) * 100}%`}
                                    />
                                    <Text
                                        position="absolute"
                                        bottom="-25px"
                                        left="50%"
                                        transform="translateX(-50%)"
                                        fontSize="xs"
                                    >
                                        {hour.hour}
                                    </Text>
                                </Box>
                            ))}
                        </SimpleGrid>
                    </CardBody>
                </Card>
            </VStack>
        </Container>
    );
};

export default Statistics;
