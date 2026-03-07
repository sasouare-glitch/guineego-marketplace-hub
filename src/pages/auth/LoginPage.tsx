import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court (min 6 caractères)')
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const { signIn, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const from = (location.state as { from?: Location })?.from?.pathname;

  const getRedirectByRole = async (uid: string): Promise<string> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      const role = userDoc.data()?.role;
      const roleRoutes: Record<string, string> = {
        ecommerce: '/seller',
        courier: '/courier',
        investor: '/investor',
        admin: '/admin',
      };
      return roleRoutes[role] || '/';
    } catch {
      return '/';
    }
  };
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      const cred = await signIn(data.email, data.password);
      const dest = from || await getRedirectByRole((cred as any)?.user?.uid || auth.currentUser?.uid);
      navigate(dest, { replace: true });
    } catch (err: any) {
      const errorMessages: Record<string, string> = {
        'auth/user-not-found': 'Aucun compte trouvé avec cet email',
        'auth/wrong-password': 'Mot de passe incorrect',
        'auth/invalid-email': 'Email invalide',
        'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
        'auth/user-disabled': 'Ce compte a été désactivé'
      };
      setError(errorMessages[err.code] || 'Erreur de connexion');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      setError('Erreur de connexion avec Google');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <Link to="/" className="inline-block mx-auto mb-2">
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-guinea-red via-guinea-yellow to-guinea-green rounded-xl flex items-center justify-center">
                  <span className="text-white font-black text-lg">G</span>
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-guinea-red to-guinea-green bg-clip-text text-transparent">
                  GuineeGo
                </span>
              </motion.div>
            </Link>
            <CardTitle className="text-2xl font-bold">{t.auth?.login || 'Connexion'}</CardTitle>
            <CardDescription>
              {t.auth?.loginDescription || 'Connectez-vous à votre compte GuineeGo'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t.auth?.password || 'Mot de passe'}</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    {t.auth?.forgotPassword || 'Mot de passe oublié ?'}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-guinea-red hover:bg-guinea-red/90"
                disabled={isSubmitting || loading}
              >
                {(isSubmitting || loading) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  t.auth?.login || 'Se connecter'
                )}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t.auth?.orContinueWith || 'Ou continuer avec'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant="outline" 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground text-center">
              {t.auth?.noAccount || "Pas encore de compte ?"}{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                {t.auth?.register || "S'inscrire"}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
      
      {/* Container pour reCAPTCHA invisible */}
      <div id="recaptcha-container" />
    </div>
  );
}
