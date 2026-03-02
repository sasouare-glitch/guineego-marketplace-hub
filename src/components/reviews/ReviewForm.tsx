import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => Promise<void>;
  disabled?: boolean;
}

export function ReviewForm({ onSubmit, disabled }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Veuillez sélectionner une note'); return; }
    if (!comment.trim()) { toast.error('Veuillez écrire un commentaire'); return; }
    if (comment.trim().length > 1000) { toast.error('Commentaire trop long (max 1000 caractères)'); return; }

    setSubmitting(true);
    try {
      await onSubmit(rating, comment);
      toast.success('Avis envoyé ! Il sera visible après modération.');
      setRating(0);
      setComment('');
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  if (disabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Laisser un avis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Votre note</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHoveredRating(i)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(i)}
              >
                <Star
                  className={cn(
                    'w-7 h-7 transition-colors',
                    i <= (hoveredRating || rating)
                      ? 'fill-guinea-yellow text-guinea-yellow'
                      : 'text-muted'
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Textarea
            placeholder="Partagez votre expérience avec ce produit..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground mt-1">{comment.length}/1000</p>
        </div>

        <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
          {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Envoyer mon avis
        </Button>
      </CardContent>
    </Card>
  );
}
