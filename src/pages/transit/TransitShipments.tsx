import { useState } from "react";
import { motion } from "framer-motion";
import { TransitLayout } from "@/components/transit/TransitLayout";
import { ShipmentCard } from "@/components/transit/ShipmentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Download, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const allShipments = [
  {
    id: "1",
    trackingNumber: "GGT-2024-08956",
    origin: "Guangzhou",
    destination: "Conakry",
    status: "in_transit" as const,
    method: "sea" as const,
    weight: "150 kg",
    createdAt: "10 Jan 2024",
    estimatedArrival: "15 Fév 2024",
    items: "Électronique, Textile"
  },
  {
    id: "2",
    trackingNumber: "GGT-2024-08847",
    origin: "Yiwu",
    destination: "Conakry",
    status: "customs" as const,
    method: "sea" as const,
    weight: "320 kg",
    createdAt: "25 Déc 2023",
    estimatedArrival: "5 Fév 2024",
    items: "Cosmétiques, Accessoires"
  },
  {
    id: "3",
    trackingNumber: "GGT-2024-08723",
    origin: "Shenzhen",
    destination: "Conakry",
    status: "pending" as const,
    method: "air" as const,
    weight: "25 kg",
    createdAt: "28 Jan 2024",
    estimatedArrival: "8 Fév 2024",
    items: "Téléphones, Accessoires"
  },
  {
    id: "4",
    trackingNumber: "GGT-2024-08512",
    origin: "Guangzhou",
    destination: "Conakry",
    status: "delivered" as const,
    method: "sea" as const,
    weight: "500 kg",
    createdAt: "15 Nov 2023",
    estimatedArrival: "20 Déc 2023",
    items: "Machines à coudre"
  },
  {
    id: "5",
    trackingNumber: "GGT-2024-08341",
    origin: "Shanghai",
    destination: "Conakry",
    status: "delivered" as const,
    method: "air" as const,
    weight: "15 kg",
    createdAt: "10 Déc 2023",
    estimatedArrival: "20 Déc 2023",
    items: "Échantillons textiles"
  },
  {
    id: "6",
    trackingNumber: "GGT-2024-08198",
    origin: "Yiwu",
    destination: "Conakry",
    status: "delivered" as const,
    method: "sea" as const,
    weight: "800 kg",
    createdAt: "1 Oct 2023",
    estimatedArrival: "15 Nov 2023",
    items: "Jouets, Décoration"
  },
];

export default function TransitShipments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filterShipments = (status?: string) => {
    let filtered = allShipments;
    
    if (status && status !== "all") {
      filtered = filtered.filter(s => s.status === status);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.items.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const inTransit = allShipments.filter(s => s.status === "in_transit" || s.status === "customs" || s.status === "pending");
  const delivered = allShipments.filter(s => s.status === "delivered");

  return (
    <TransitLayout 
      title="Mes expéditions" 
      subtitle="Historique de toutes vos expéditions"
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro ou contenu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button className="bg-guinea-red hover:bg-guinea-red/90" asChild>
              <Link to="/transit/quote">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle expédition
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              Toutes ({allShipments.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              En cours ({inTransit.length})
            </TabsTrigger>
            <TabsTrigger value="delivered">
              Livrées ({delivered.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterShipments().map((shipment, index) => (
                <motion.div
                  key={shipment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ShipmentCard {...shipment} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inTransit.map((shipment, index) => (
                <motion.div
                  key={shipment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ShipmentCard {...shipment} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="delivered" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {delivered.map((shipment, index) => (
                <motion.div
                  key={shipment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ShipmentCard {...shipment} />
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TransitLayout>
  );
}
