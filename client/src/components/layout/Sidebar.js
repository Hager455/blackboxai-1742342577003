import React from 'react';
import {
    Box,
    Flex,
    Icon,
    Text,
    Stack,
    VStack,
    useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
    FaHome,
    FaVoteYea,
    FaUserCircle,
    FaUsers,
    FaChartBar,
    FaCog,
    FaUserShield,
} from 'react-icons/fa';

const Sidebar = ({ role }) => {
    const location = useLocation();
    const activeBg = useColorModeValue('blue.50', 'blue.900');
    const inactiveBg = useColorModeValue('white', 'gray.800');
    const activeColor = useColorModeValue('blue.600', 'white');
    const inactiveColor = useColorModeValue('gray.600', 'gray.400');

    const voterMenuItems = [
        { name: 'Dashboard', icon: FaHome, path: '/voter/dashboard' },
        { name: 'Vote', icon: FaVoteYea, path: '/voter/vote' },
        { name: 'Profile', icon: FaUserCircle, path: '/voter/profile' },
    ];

    const adminMenuItems = [
        { name: 'Dashboard', icon: FaHome, path: '/admin/dashboard' },
        { name: 'Candidates', icon: FaUsers, path: '/admin/candidates' },
        { name: 'Voters', icon: FaUserShield, path: '/admin/voters' },
        { name: 'Statistics', icon: FaChartBar, path: '/admin/statistics' },
        { name: 'Settings', icon: FaCog, path: '/admin/settings' },
    ];

    const menuItems = role === 'admin' ? adminMenuItems : voterMenuItems;

    const NavItem = ({ icon, children, path }) => {
        const isActive = location.pathname === path;

        return (
            <Box
                as={RouterLink}
                to={path}
                w="full"
                borderRadius="lg"
                bg={isActive ? activeBg : inactiveBg}
                color={isActive ? activeColor : inactiveColor}
                _hover={{
                    bg: activeBg,
                    color: activeColor,
                    transform: 'translateX(2px)',
                }}
                transition="all 0.2s"
            >
                <Flex
                    align="center"
                    p="4"
                    mx="4"
                    role="group"
                    cursor="pointer"
                >
                    {icon && (
                        <Icon
                            mr="4"
                            fontSize="16"
                            as={icon}
                            _groupHover={{
                                color: activeColor,
                            }}
                        />
                    )}
                    {children}
                </Flex>
            </Box>
        );
    };

    return (
        <Box
            bg={useColorModeValue('white', 'gray.800')}
            borderRight="1px"
            borderRightColor={useColorModeValue('gray.200', 'gray.700')}
            w={{ base: 'full', md: 60 }}
            pos="fixed"
            h="full"
            pt="20"
        >
            <VStack spacing={1} align="stretch" p={4}>
                {menuItems.map((item) => (
                    <NavItem key={item.name} icon={item.icon} path={item.path}>
                        <Text fontSize="sm" fontWeight="medium">
                            {item.name}
                        </Text>
                    </NavItem>
                ))}
            </VStack>

            {/* User Info Section */}
            <Box
                position="absolute"
                bottom="0"
                w="full"
                p={4}
                borderTop="1px"
                borderTopColor={useColorModeValue('gray.200', 'gray.700')}
            >
                <Stack spacing={3}>
                    <Text fontSize="xs" color="gray.500" textAlign="center">
                        {role === 'admin' ? 'Admin Panel' : 'Voter Portal'}
                    </Text>
                    <Text fontSize="xs" color="gray.500" textAlign="center">
                        © 2023 Web3 Voting
                    </Text>
                </Stack>
            </Box>
        </Box>
    );
};

export default Sidebar;
