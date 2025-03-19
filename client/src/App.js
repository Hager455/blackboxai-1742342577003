import React from 'react';
import { ChakraProvider, CSSReset } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

// Theme
import theme from './theme';

// Contexts
import { AuthProvider } from './context/AuthContext';
import { Web3Provider as CustomWeb3Provider } from './context/Web3Context';
import { BiometricProvider } from './context/BiometricContext';

// Layout Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/shared/ProtectedRoute';
import ErrorBoundary from './components/shared/ErrorBoundary';

// Voter Pages
import VoterDashboard from './pages/voter/Dashboard';
import VotingPage from './pages/voter/VotingPage';
import VoterProfile from './pages/voter/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import CandidateManagement from './pages/admin/CandidateManagement';
import VoterManagement from './pages/admin/VoterManagement';
import Statistics from './pages/admin/Statistics';
import Settings from './pages/admin/Settings';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Other Pages
import NotFound from './pages/NotFound';

function getLibrary(provider) {
    const library = new Web3Provider(provider);
    library.pollingInterval = 12000;
    return library;
}

const App = () => {
    return (
        <ErrorBoundary>
            <ChakraProvider theme={theme}>
                <CSSReset />
                <Web3ReactProvider getLibrary={getLibrary}>
                    <CustomWeb3Provider>
                        <Router>
                            <AuthProvider>
                                <BiometricProvider>
                                    <Layout>
                                        <Routes>
                                            {/* Public Routes */}
                                            <Route path="/" element={<Navigate to="/login" />} />
                                            <Route path="/login" element={<Login />} />
                                            <Route path="/register" element={<Register />} />

                                            {/* Voter Routes */}
                                            <Route
                                                path="/voter/*"
                                                element={
                                                    <ProtectedRoute role="voter">
                                                        <Routes>
                                                            <Route path="dashboard" element={<VoterDashboard />} />
                                                            <Route path="vote" element={<VotingPage />} />
                                                            <Route path="profile" element={<VoterProfile />} />
                                                            <Route path="*" element={<NotFound />} />
                                                        </Routes>
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* Admin Routes */}
                                            <Route
                                                path="/admin/*"
                                                element={
                                                    <ProtectedRoute role="admin">
                                                        <Routes>
                                                            <Route path="dashboard" element={<AdminDashboard />} />
                                                            <Route path="candidates" element={<CandidateManagement />} />
                                                            <Route path="voters" element={<VoterManagement />} />
                                                            <Route path="statistics" element={<Statistics />} />
                                                            <Route path="settings" element={<Settings />} />
                                                            <Route path="*" element={<NotFound />} />
                                                        </Routes>
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* 404 Route */}
                                            <Route path="*" element={<NotFound />} />
                                        </Routes>
                                    </Layout>
                                </BiometricProvider>
                            </AuthProvider>
                        </Router>
                    </CustomWeb3Provider>
                </Web3ReactProvider>
            </ChakraProvider>
        </ErrorBoundary>
    );
};

export default App;
