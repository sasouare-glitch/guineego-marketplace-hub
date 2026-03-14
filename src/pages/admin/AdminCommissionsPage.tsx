/**
 * Admin Commissions Page
 * Configure commission rates per product category
 */

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { CATEGORIES } from '@/constants/categories';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';
import { Save, RotateCcw, Percent, TrendingUp, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const DEFAULT_RATE = 5; // 5% default

interface CommissionRates {
  [categoryId: string]: number;
}

export default function AdminCommissionsPage() {
  const [rates, setRates] = useState<CommissionRates>({});
  const [defaultRate, setDefaultRate] = useState(DEFAULT_RATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load commission config from Firestore
  useEffect(() => {
    const loadRates = async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'commissions'));
        if (snap.exists()) {
          const data = snap.data();
          setDefaultRate(data.defaultRate ?? DEFAULT_RATE);
          setRates(data.categoryRates ?? {});
        } else {
          // Initialize with default rates
          const initial: CommissionRates = {};
          CATEGORIES.forEach((c) => { initial[c.id] = DEFAULT_RATE; });
          setRates(initial);
        }
      } catch (err) {
        console.error('Error loading commissions:', err);
        toast.error('Erreur lors du chargement des commissions');
      } finally {
        setLoading(false);
      }
    };
    loadRates();
  }, []);

  const getRate = (categoryId: string) => rates[categoryId] ?? defaultRate;

  const updateRate = (categoryId: string, value: number) => {
    setRates((prev) => ({ ...prev, [categoryId]: value }));
    setHasChanges(true);
  };

  const updateDefaultRate = (value: number) => {
    setDefaultRate(value);
    setHasChanges(true);
  };

  const resetToDefault = () => {
    const reset: CommissionRates = {};
    CATEGORIES.forEach((c) => { reset[c.id] = defaultRate; });
    setRates(reset);
    setHasChanges(true);
  };

  const saveRates = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'commissions'), {
        defaultRate,
        categoryRates: rates,
        updatedAt: serverTimestamp(),
      });
      toast.success('Taux de commission sauvegardés');
      setHasChanges(false);
    } catch (err) {
      console.error('Error saving commissions:', err);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Weighted average (assuming equal distribution for display)
  const avgRate = CATEGORIES.length > 0
    ? CATEGORIES.reduce((sum, c) => sum + getRate(c.id), 0) / CATEGORIES.length
    : defaultRate;

  return (
    <AdminLayout title="Commissions" description="Taux de commission par catégorie de produit">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Percent className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taux par défaut</p>
                <p className="text-xl font-bold text-foreground">{defaultRate}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taux moyen</p>
                <p className="text-xl font-bold text-foreground">{avgRate.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Info className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Catégories</p>
                <p className="text-xl font-bold text-foreground">{CATEGORIES.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Default Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taux par défaut</CardTitle>
            <CardDescription>
              Appliqué aux catégories sans taux personnalisé et aux nouvelles catégories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Slider
                value={[defaultRate]}
                onValueChange={([v]) => updateDefaultRate(v)}
                min={0}
                max={20}
                step={0.5}
                className="flex-1"
              />
              <div className="flex items-center gap-2 min-w-[100px]">
                <Input
                  type="number"
                  value={defaultRate}
                  onChange={(e) => updateDefaultRate(Number(e.target.value))}
                  min={0}
                  max={50}
                  step={0.5}
                  className="w-20 text-center font-semibold"
                />
                <span className="text-muted-foreground font-medium">%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Per-Category Rates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Taux par catégorie</CardTitle>
              <CardDescription>
                Personnalisez la commission pour chaque catégorie de produit
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={resetToDefault} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {CATEGORIES.map((category, index) => {
              const rate = getRate(category.id);
              const Icon = category.icon;
              const isCustom = rate !== defaultRate;

              return (
                <div key={category.id}>
                  <div className="flex items-center gap-4 py-3">
                    {/* Category info */}
                    <div className="flex items-center gap-3 min-w-[180px]">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{category.label}</span>
                        {isCustom && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Personnalisé
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Slider */}
                    <Slider
                      value={[rate]}
                      onValueChange={([v]) => updateRate(category.id, v)}
                      min={0}
                      max={20}
                      step={0.5}
                      className="flex-1"
                    />

                    {/* Input */}
                    <div className="flex items-center gap-1 min-w-[80px]">
                      <Input
                        type="number"
                        value={rate}
                        onChange={(e) => updateRate(category.id, Number(e.target.value))}
                        min={0}
                        max={50}
                        step={0.5}
                        className="w-16 text-center text-sm font-semibold h-8"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>

                    {/* Revenue estimate */}
                    <Tooltip>
                      <TooltipTrigger>
                        <span className={`text-xs font-medium min-w-[60px] text-right ${
                          rate > defaultRate ? 'text-primary' : rate < defaultRate ? 'text-destructive' : 'text-muted-foreground'
                        }`}>
                          {rate > defaultRate ? '+' : ''}{(rate - defaultRate).toFixed(1)}%
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Différence par rapport au taux par défaut ({defaultRate}%)
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {index < CATEGORIES.length - 1 && <Separator />}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3 sticky bottom-4">
          {hasChanges && (
            <Badge variant="secondary" className="self-center">
              Modifications non sauvegardées
            </Badge>
          )}
          <Button
            onClick={saveRates}
            disabled={!hasChanges || saving}
            className="gap-2 shadow-lg"
            size="lg"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder les taux'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
