import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/hooks/useCart";
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
import Academy from "./pages/Academy";
import CourseDetail from "./pages/CourseDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
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
            {/* Academy Routes */}
            <Route path="/academy" element={<Academy />} />
            <Route path="/academy/course/:id" element={<CourseDetail />} />
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
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
