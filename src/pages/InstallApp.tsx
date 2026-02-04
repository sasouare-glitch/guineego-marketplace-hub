/**
 * Install App Page
 * Provides installation instructions and prompt for PWA
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Download, 
  Smartphone, 
  Zap, 
  Bell, 
  WifiOff, 
  MapPin, 
  Shield,
  ChevronRight,
  CheckCircle2,
  Share
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePWA, useInstallInstructions } from '@/hooks/usePWA';
import { useCapacitorPlatform } from '@/hooks/useCapacitor';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const features = [
  {
    icon: Zap,
    title: 'Ultra rapide',
    description: 'Chargement instantané, même sur réseau lent'
  },
  {
    icon: WifiOff,
    title: 'Fonctionne hors-ligne',
    description: 'Consultez vos commandes sans internet'
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Recevez les alertes de suivi en temps réel'
  },
  {
    icon: MapPin,
    title: 'Géolocalisation',
    description: 'Suivez votre livreur sur la carte'
  },
  {
    icon: Shield,
    title: 'Sécurisé',
    description: 'Connexion sécurisée et données protégées'
  }
];

export default function InstallApp() {
  const navigate = useNavigate();
  const { isInstalled, canInstall, install } = usePWA();
  const { platform, instructions } = useInstallInstructions();
  const { isNative } = useCapacitorPlatform();

  // If already installed as native app, redirect
  useEffect(() => {
    if (isNative) {
      navigate('/', { replace: true });
    }
  }, [isNative, navigate]);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      navigate('/');
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 text-green-600 mb-6"
          >
            <CheckCircle2 className="w-12 h-12" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-4">Application installée !</h1>
          <p className="text-muted-foreground mb-8">
            GuineeGo LAT est maintenant sur votre écran d'accueil
          </p>
          <Button onClick={() => navigate('/')}>
            Continuer vers l'accueil
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 text-primary mb-6"
          >
            <Smartphone className="w-10 h-10" />
          </motion.div>
          
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Installez GuineeGo LAT
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-md mx-auto mb-8"
          >
            Accédez à la marketplace directement depuis votre écran d'accueil
          </motion.p>

          {canInstall && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                size="lg" 
                onClick={handleInstall}
                className="gap-2 text-lg px-8"
              >
                <Download className="w-5 h-5" />
                Installer maintenant
              </Button>
            </motion.div>
          )}
        </section>

        {/* Features Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">
            Pourquoi installer l'app ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary">
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Installation Instructions */}
        {!canInstall && (
          <section className="max-w-lg mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{instructions.icon}</span>
                  <h2 className="text-xl font-bold">{instructions.title}</h2>
                </div>

                <div className="space-y-4">
                  {instructions.steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start gap-4"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-muted-foreground pt-1">{step}</p>
                    </motion.div>
                  ))}
                </div>

                {platform === 'ios' && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Share className="w-4 h-4" />
                      <span>
                        Utilisez Safari pour une meilleure expérience
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* CTA Section */}
        <section className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Ou continuez sur le navigateur
          </p>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Continuer sans installer
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
