import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import { NotificationProvider } from "@/hooks/useNotifications";
import { PreferencesProvider } from "@/hooks/usePreferences";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import React from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SellStartPage from "./pages/SellStartPage";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerFinances from "./pages/seller/SellerFinances";
import SellerAnalytics from "./pages/seller/SellerAnalytics";
import SellerCustomers from "./pages/seller/SellerCustomers";
import SellerProfilePage from "./pages/seller/SellerProfilePage";
import SellerSettingsPage from "./pages/seller/SellerSettingsPage";
import SellerNotificationsPage from "./pages/seller/SellerNotificationsPage";
import SellerMessagesPage from "./pages/seller/SellerMessagesPage";
import CourierDashboard from "./pages/courier/CourierDashboard";
import CourierMissions from "./pages/courier/CourierMissions";
import CourierMissionDetail from "./pages/courier/CourierMissionDetail";
import CourierEarnings from "./pages/courier/CourierEarnings";
import CourierMobileHome from "./pages/courier/CourierMobileHome";
import CourierActiveMissions from "./pages/courier/CourierActiveMissions";
import CourierStatsPage from "./pages/courier/CourierStatsPage";
import CourierProfilePage from "./pages/courier/CourierProfilePage";
import Marketplace from "./pages/Marketplace";
import SearchPage from "./pages/SearchPage";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import PublicOrderTrackingPage from "./pages/PublicOrderTrackingPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import WishlistPage from "./pages/WishlistPage";
import Academy from "./pages/Academy";
import CourseDetail from "./pages/CourseDetail";
import InvestorDashboard from "./pages/investor/InvestorDashboard";
import InvestorOpportunities from "./pages/investor/InvestorOpportunities";
import InvestorInvestments from "./pages/investor/InvestorInvestments";
import OpportunityDetail from "./pages/investor/OpportunityDetail";
import InvestmentDetail from "./pages/investor/InvestmentDetail";
import TransitDashboard from "./pages/transit/TransitDashboard";
import TransitQuote from "./pages/transit/TransitQuote";
import TransitTracking from "./pages/transit/TransitTracking";
import TransitShipments from "./pages/transit/TransitShipments";
import TransitInvoices from "./pages/transit/TransitInvoices";
import TransitSettings from "./pages/transit/TransitSettings";
import ProfilePage from "./pages/ProfilePage";
import SecuritySettings from "./pages/settings/SecuritySettings";
import NotificationSettings from "./pages/settings/NotificationSettings";
import PreferencesSettings from "./pages/settings/PreferencesSettings";
import InstallApp from "./pages/InstallApp";
// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import AccessDeniedPage from "./pages/auth/AccessDeniedPage";
// Admin Pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminSellersPage from "./pages/admin/AdminSellersPage";
import AdminDeliveriesPage from "./pages/admin/AdminDeliveriesPage";
import AdminTransitPage from "./pages/admin/AdminTransitPage";
import AdminAcademyPage from "./pages/admin/AdminAcademyPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminFinancesPage from "./pages/admin/AdminFinancesPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import AdminSecurityPage from "./pages/admin/AdminSecurityPage";
import AdminEmailsPage from "./pages/admin/AdminEmailsPage";
// Mobile Components
import MobileBottomNav, { MobileFAB } from "./components/mobile/MobileBottomNav";
import InstallPrompt, { UpdateBanner } from "./components/mobile/InstallPrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PreferencesProvider>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <NotificationProvider>
                  <Toaster />
                  <Sonner />
                  {/* PWA Update Banner */}
                  <UpdateBanner />
                  
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/access-denied" element={<AccessDeniedPage />} />
                    <Route path="/install" element={<InstallApp />} />
                    
                    {/* Auth redirects to avoid duplicate routes */}
                    <Route path="/auth/login" element={<Navigate to="/login" replace />} />
                    <Route path="/auth/register" element={<Navigate to="/register" replace />} />
                    <Route path="/auth/forgot-password" element={<Navigate to="/forgot-password" replace />} />
                    
                    {/* Client Marketplace Routes (Public) */}
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/academy" element={<Academy />} />
                    <Route path="/academy/course/:id" element={<CourseDetail />} />
                    <Route path="/sell/start" element={<SellStartPage />} />
                    <Route path="/track/:id" element={<PublicOrderTrackingPage />} />
                    
                    {/* Protected Client Routes */}
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={
                      <ProtectedRoute>
                        <CheckoutPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/order/:id" element={
                      <ProtectedRoute>
                        <OrderTrackingPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/order" element={
                      <ProtectedRoute>
                        <OrderTrackingPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/orders" element={
                      <ProtectedRoute>
                        <MyOrdersPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    } />
                    
                    {/* Settings Routes (Protected) */}
                    <Route path="/settings/security" element={
                      <ProtectedRoute>
                        <SecuritySettings />
                      </ProtectedRoute>
                    } />
                    <Route path="/settings/notifications" element={
                      <ProtectedRoute>
                        <NotificationSettings />
                      </ProtectedRoute>
                    } />
                    <Route path="/settings/preferences" element={
                      <ProtectedRoute>
                        <PreferencesSettings />
                      </ProtectedRoute>
                    } />
                    
                    {/* Investor Routes (Protected - investor role) */}
                    <Route path="/investor/dashboard" element={
                      <ProtectedRoute requiredRoles={['investor', 'admin']}>
                        <InvestorDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/investor/opportunities" element={
                      <ProtectedRoute requiredRoles={['investor', 'admin']}>
                        <InvestorOpportunities />
                      </ProtectedRoute>
                    } />
                    <Route path="/investor/investments" element={
                      <ProtectedRoute requiredRoles={['investor', 'admin']}>
                        <InvestorInvestments />
                      </ProtectedRoute>
                    } />
                    <Route path="/investor/opportunity/:id" element={
                      <ProtectedRoute requiredRoles={['investor', 'admin']}>
                        <OpportunityDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="/investor/investment/:id" element={
                      <ProtectedRoute requiredRoles={['investor', 'admin']}>
                        <InvestmentDetail />
                      </ProtectedRoute>
                    } />
                    
                    {/* Transit Routes (Protected) */}
                    <Route path="/transit/dashboard" element={
                      <ProtectedRoute>
                        <TransitDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/transit/quote" element={
                      <ProtectedRoute>
                        <TransitQuote />
                      </ProtectedRoute>
                    } />
                    <Route path="/transit/tracking" element={
                      <ProtectedRoute>
                        <TransitTracking />
                      </ProtectedRoute>
                    } />
                    <Route path="/transit/shipments" element={
                      <ProtectedRoute>
                        <TransitShipments />
                      </ProtectedRoute>
                    } />
                    <Route path="/transit/invoices" element={
                      <ProtectedRoute>
                        <TransitInvoices />
                      </ProtectedRoute>
                    } />
                    <Route path="/transit/settings" element={
                      <ProtectedRoute>
                        <TransitSettings />
                      </ProtectedRoute>
                    } />
                    
                    {/* Seller Dashboard Routes (Protected - ecommerce role) */}
                    <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
                    <Route path="/seller/dashboard" element={
                      <ProtectedRoute requiredRoles={['ecommerce', 'admin']}>
                        <SellerDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller/products" element={
                      <ProtectedRoute requiredRoles={['ecommerce', 'admin']}>
                        <SellerProducts />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller/orders" element={
                      <ProtectedRoute requiredRoles={['ecommerce', 'admin']}>
                        <SellerOrders />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller/finances" element={
                      <ProtectedRoute requiredRoles={['ecommerce', 'admin']}>
                        <SellerFinances />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller/analytics" element={
                      <ProtectedRoute requiredRoles={['ecommerce', 'admin']}>
                        <SellerAnalytics />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller/customers" element={
                      <ProtectedRoute requiredRoles={['ecommerce', 'admin']}>
                        <SellerCustomers />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller/profile" element={
                      <ProtectedRoute requiredRoles={['ecommerce', 'admin']}>
                        <SellerProfilePage />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller/notifications" element={
                      <ProtectedRoute requiredRoles={['ecommerce', 'admin']}>
                        <SellerNotificationsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller/messages" element={
                      <ProtectedRoute requiredRoles={['ecommerce', 'admin']}>
                        <SellerMessagesPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller/settings" element={
                      <ProtectedRoute requiredRoles={['ecommerce', 'admin']}>
                        <SellerSettingsPage />
                      </ProtectedRoute>
                    } />
                    
                    {/* Courier Routes (Protected - courier role) */}
                    {/* Mobile-first courier interface */}
                    <Route path="/courier" element={
                      <ProtectedRoute requiredRoles={['courier', 'admin']}>
                        <CourierMobileHome />
                      </ProtectedRoute>
                    } />
                    <Route path="/courier/dashboard" element={
                      <ProtectedRoute requiredRoles={['courier', 'admin']}>
                        <CourierDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/courier/missions" element={
                      <ProtectedRoute requiredRoles={['courier', 'admin']}>
                        <CourierMissions />
                      </ProtectedRoute>
                    } />
                    <Route path="/courier/mission/:id" element={
                      <ProtectedRoute requiredRoles={['courier', 'admin']}>
                        <CourierMissionDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="/courier/active" element={
                      <ProtectedRoute requiredRoles={['courier', 'admin']}>
                        <CourierActiveMissions />
                      </ProtectedRoute>
                    } />
                    <Route path="/courier/earnings" element={
                      <ProtectedRoute requiredRoles={['courier', 'admin']}>
                        <CourierEarnings />
                      </ProtectedRoute>
                    } />
                    <Route path="/courier/stats" element={
                      <ProtectedRoute requiredRoles={['courier', 'admin']}>
                        <CourierStatsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/courier/profile" element={
                      <ProtectedRoute requiredRoles={['courier', 'admin']}>
                        <CourierProfilePage />
                      </ProtectedRoute>
                    } />
                    
                    {/* Admin Routes (Protected - admin role only) */}
                    <Route path="/admin/dashboard" element={
                      <ProtectedRoute requiredRoles={['admin']}>
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/users" element={
                      <ProtectedRoute requiredRoles={['admin']}>
                        <AdminUsersPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/orders" element={
                      <ProtectedRoute requiredRoles={['admin']}>
                        <AdminOrdersPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/settings" element={
                      <ProtectedRoute requiredRoles={['admin']}>
                        <AdminSettingsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/products" element={
                      <ProtectedRoute requiredRoles={['admin']}>
                        <AdminProductsPage />
                      </ProtectedRoute>
                    } />
                     <Route path="/admin/sellers" element={
                       <ProtectedRoute requiredRoles={['admin']}>
                         <AdminSellersPage />
                       </ProtectedRoute>
                     } />
                     <Route path="/admin/deliveries" element={
                       <ProtectedRoute requiredRoles={['admin']}>
                         <AdminDeliveriesPage />
                       </ProtectedRoute>
                     } />
                     <Route path="/admin/transit" element={
                       <ProtectedRoute requiredRoles={['admin']}>
                         <AdminTransitPage />
                       </ProtectedRoute>
                     } />
                     <Route path="/admin/academy" element={
                       <ProtectedRoute requiredRoles={['admin']}>
                         <AdminAcademyPage />
                       </ProtectedRoute>
                     } />
                     <Route path="/admin/analytics" element={
                       <ProtectedRoute requiredRoles={['admin']}>
                         <AdminAnalyticsPage />
                       </ProtectedRoute>
                     } />
                     <Route path="/admin/finances" element={
                       <ProtectedRoute requiredRoles={['admin']}>
                         <AdminFinancesPage />
                       </ProtectedRoute>
                     } />
                     <Route path="/admin/reports" element={
                       <ProtectedRoute requiredRoles={['admin']}>
                         <AdminReportsPage />
                       </ProtectedRoute>
                     } />
                     <Route path="/admin/notifications" element={
                       <ProtectedRoute requiredRoles={['admin']}>
                         <AdminNotificationsPage />
                       </ProtectedRoute>
                     } />
                     <Route path="/admin/security" element={
                       <ProtectedRoute requiredRoles={['admin']}>
                         <AdminSecurityPage />
                       </ProtectedRoute>
                     } />
                     <Route path="/admin/emails" element={
                       <ProtectedRoute requiredRoles={['admin']}>
                         <AdminEmailsPage />
                       </ProtectedRoute>
                     } />
                     
                     {/* Catch-all Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  
                  {/* Mobile Navigation Components */}
                  <MobileBottomNav />
                  <MobileFAB />
                  <InstallPrompt />
                </NotificationProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </PreferencesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
