import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import { NotificationProvider } from "@/hooks/useNotifications";
import React from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerFinances from "./pages/seller/SellerFinances";
import CourierDashboard from "./pages/courier/CourierDashboard";
import CourierMissions from "./pages/courier/CourierMissions";
import CourierMissionDetail from "./pages/courier/CourierMissionDetail";
import CourierEarnings from "./pages/courier/CourierEarnings";
import Marketplace from "./pages/Marketplace";
import SearchPage from "./pages/SearchPage";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
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
import ProfilePage from "./pages/ProfilePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <WishlistProvider>
          <NotificationProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* Client Marketplace Routes */}
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order/:id" element={<OrderTrackingPage />} />
              <Route path="/order" element={<OrderTrackingPage />} />
              <Route path="/orders" element={<MyOrdersPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            {/* Academy Routes */}
            <Route path="/academy" element={<Academy />} />
            <Route path="/academy/course/:id" element={<CourseDetail />} />
            {/* Investor Routes */}
            <Route path="/investor/dashboard" element={<InvestorDashboard />} />
            <Route path="/investor/opportunities" element={<InvestorOpportunities />} />
            <Route path="/investor/investments" element={<InvestorInvestments />} />
            <Route path="/investor/opportunity/:id" element={<OpportunityDetail />} />
            <Route path="/investor/investment/:id" element={<InvestmentDetail />} />
            {/* Transit Routes */}
            <Route path="/transit/dashboard" element={<TransitDashboard />} />
            <Route path="/transit/quote" element={<TransitQuote />} />
            <Route path="/transit/tracking" element={<TransitTracking />} />
            <Route path="/transit/shipments" element={<TransitShipments />} />
            {/* Seller Dashboard Routes */}
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
            <Route path="/seller/products" element={<SellerProducts />} />
            <Route path="/seller/orders" element={<SellerOrders />} />
            <Route path="/seller/finances" element={<SellerFinances />} />
            {/* Courier Routes */}
            <Route path="/courier/dashboard" element={<CourierDashboard />} />
            <Route path="/courier/missions" element={<CourierMissions />} />
            <Route path="/courier/mission/:id" element={<CourierMissionDetail />} />
            <Route path="/courier/earnings" element={<CourierEarnings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </NotificationProvider>
        </WishlistProvider>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
