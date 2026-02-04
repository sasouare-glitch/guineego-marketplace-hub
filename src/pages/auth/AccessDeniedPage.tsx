import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-2xl text-center">
          <CardContent className="pt-10 pb-8 space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto"
            >
              <ShieldX className="w-10 h-10 text-destructive" />
            </motion.div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Accès refusé</h1>
              <p className="text-muted-foreground">
                Vous n'avez pas les permissions nécessaires pour accéder à cette page.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button asChild variant="outline">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Accueil
                </Link>
              </Button>
              <Button asChild className="bg-guinea-green hover:bg-guinea-green/90">
                <Link to="/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Se connecter
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
