import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PublicLayout } from './components/common/PublicLayout';
import { RoleProtectedRoute } from './components/common/RoleProtectedRoute';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { RoleSelectPage } from './pages/public/RoleSelectPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { VerifyCertificatePage } from './pages/public/VerifyCertificatePage';
import { NotFoundPage } from './pages/public/NotFoundPage';
import { OnboardingPage } from './pages/public/OnboardingPage';

// Farmer Pages
import { FarmerDashboardPage } from './pages/farmer/FarmerDashboardPage';
import { BatchListPage } from './pages/farmer/BatchListPage';
import { BatchCreatePage } from './pages/farmer/BatchCreatePage';
import { BatchDetailPage } from './pages/farmer/BatchDetailPage';
import { AiAnalysisPage } from './pages/farmer/AiAnalysisPage';
import { PricePredictionPage } from './pages/farmer/PricePredictionPage';
import { MarketRecommendationsPage } from './pages/farmer/MarketRecommendationsPage';
import { FarmerCertificatesPage } from './pages/farmer/FarmerCertificatesPage';
import { FarmerReportsPage } from './pages/farmer/FarmerReportsPage';
import { FarmerProfilePage } from './pages/farmer/FarmerProfilePage';
import { QualityGradingGuidePage } from './pages/farmer/QualityGradingGuidePage';

// Buyer Pages
import { MarketplacePage } from './pages/buyer/MarketplacePage';
import { ListingDetailPage } from './pages/buyer/ListingDetailPage';
import { BuyerRequestsPage } from './pages/buyer/BuyerRequestsPage';
import { BuyerOrdersPage } from './pages/buyer/BuyerOrdersPage';
import { BuyerProfilePage } from './pages/buyer/BuyerProfilePage';

// Chat Workspace
import { ChatPage } from './pages/chat/ChatPage';

// Admin Console (Protected)
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminListingsPage } from './pages/admin/AdminListingsPage';
import { AdminTaxonomyPage } from './pages/admin/AdminTaxonomyPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <NotificationProvider>
              <ChatProvider>
                <BrowserRouter>
                  <Routes>
                    {/* Public Routes with Clean Role-Neutral PublicLayout */}
                    <Route
                      path="/"
                      element={
                        <PublicLayout>
                          <LandingPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/login"
                      element={
                        <PublicLayout>
                          <LoginPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/signin"
                      element={
                        <PublicLayout>
                          <LoginPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/register"
                      element={
                        <PublicLayout>
                          <RegisterPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/signup"
                      element={
                        <PublicLayout>
                          <RegisterPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/select-role"
                      element={
                        <PublicLayout>
                          <RoleSelectPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/forgot-password"
                      element={
                        <PublicLayout>
                          <ForgotPasswordPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/verify-certificate/:certificateId"
                      element={
                        <PublicLayout>
                          <VerifyCertificatePage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/verify-certificate"
                      element={
                        <PublicLayout>
                          <VerifyCertificatePage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/onboarding/profile"
                      element={
                        <PublicLayout>
                          <OnboardingPage />
                        </PublicLayout>
                      }
                    />

                    {/* Farmer Workspace Routes */}
                    <Route
                      path="/farmer/dashboard"
                      element={<RoleProtectedRoute allowedRole="FARMER" element={<FarmerDashboardPage />} />}
                    />
                    <Route
                      path="/farmer/batches"
                      element={<RoleProtectedRoute allowedRole="FARMER" element={<BatchListPage />} />}
                    />
                    <Route
                      path="/farmer/batches/create"
                      element={<RoleProtectedRoute allowedRole="FARMER" element={<BatchCreatePage />} />}
                    />
                    <Route
                      path="/farmer/batches/:batchId"
                      element={<RoleProtectedRoute allowedRole="FARMER" element={<BatchDetailPage />} />}
                    />
                    <Route
                      path="/farmer/batches/:batchId/ai-analysis"
                      element={<RoleProtectedRoute allowedRole="FARMER" element={<AiAnalysisPage />} />}
                    />
                    <Route
                      path="/farmer/disease-detection"
                      element={<Navigate to="/farmer/dashboard" replace />}
                    />
                    <Route
                      path="/farmer/price-prediction"
                      element={<RoleProtectedRoute allowedRole="FARMER" element={<PricePredictionPage />} />}
                    />
                    <Route
                      path="/farmer/market-recommendations"
                      element={<RoleProtectedRoute allowedRole="FARMER" element={<MarketRecommendationsPage />} />}
                    />
                    <Route
                      path="/farmer/certificates"
                      element={<RoleProtectedRoute allowedRole="FARMER" element={<FarmerCertificatesPage />} />}
                    />
                    <Route
                      path="/farmer/reports"
                      element={<RoleProtectedRoute allowedRole="FARMER" element={<FarmerReportsPage />} />}
                    />
                    <Route
                      path="/farmer/messages"
                      element={<RoleProtectedRoute allowedRole="FARMER" element={<ChatPage />} />}
                    />
                    <Route
                      path="/farmer/profile"
                      element={<RoleProtectedRoute allowedRole="FARMER" element={<FarmerProfilePage />} />}
                    />
                    <Route
                      path="/farmer/quality-grading-guide"
                      element={<RoleProtectedRoute allowedRole="FARMER" element={<QualityGradingGuidePage />} />}
                    />
                    <Route
                      path="/farmer/grading-guide"
                      element={<RoleProtectedRoute allowedRole="FARMER" element={<QualityGradingGuidePage />} />}
                    />

                    {/* Buyer Workspace Routes (Marketplace accessible to both Buyers and Farmers) */}
                    <Route
                      path="/buyer/marketplace"
                      element={<RoleProtectedRoute allowedRole={['BUYER', 'FARMER']} element={<MarketplacePage />} />}
                    />
                    <Route
                      path="/buyer/listings/:listingId"
                      element={<RoleProtectedRoute allowedRole={['BUYER', 'FARMER']} element={<ListingDetailPage />} />}
                    />
                    <Route
                      path="/buyer/requests"
                      element={<RoleProtectedRoute allowedRole="BUYER" element={<BuyerRequestsPage />} />}
                    />
                    <Route
                      path="/buyer/orders"
                      element={<RoleProtectedRoute allowedRole="BUYER" element={<BuyerOrdersPage />} />}
                    />
                    <Route
                      path="/buyer/messages"
                      element={<RoleProtectedRoute allowedRole="BUYER" element={<ChatPage />} />}
                    />
                    <Route
                      path="/buyer/profile"
                      element={<RoleProtectedRoute allowedRole="BUYER" element={<BuyerProfilePage />} />}
                    />

                    {/* Admin Workspace Routes */}
                    <Route
                      path="/admin"
                      element={<RoleProtectedRoute allowedRole="ADMIN" element={<AdminLayout />} />}
                    >
                      <Route index element={<AdminDashboardPage />} />
                      <Route path="dashboard" element={<AdminDashboardPage />} />
                      <Route path="users" element={<AdminUsersPage />} />
                      <Route path="listings" element={<AdminListingsPage />} />
                      <Route path="taxonomy" element={<AdminTaxonomyPage />} />
                      <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                    </Route>

                    {/* 404 Route */}
                    <Route
                      path="/404"
                      element={
                        <PublicLayout>
                          <NotFoundPage />
                        </PublicLayout>
                      }
                    />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </BrowserRouter>
              </ChatProvider>
            </NotificationProvider>
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
