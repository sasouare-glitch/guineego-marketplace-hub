import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Review } from '@/hooks/useProductReviews';

interface ReviewListProps {
  reviews: Review[];
  loading?: boolean;
}

export function ReviewList({ reviews, loading }: ReviewListProps) {
  if (loading) return <p className="text-muted-foreground">Chargement des avis...</p>;
  if (reviews.length === 0) return <p className="text-muted-foreground">Aucun avis pour le moment.</p>;

  const formatDate = (ts: any) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-border pb-6 last:border-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {review.userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-medium">{review.userName}</span>
            </div>
            <span className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={cn(
                  'w-4 h-4',
                  i <= review.rating ? 'fill-guinea-yellow text-guinea-yellow' : 'text-muted'
                )}
              />
            ))}
          </div>
          <p className="text-muted-foreground">{review.comment}</p>
        </div>
      ))}
    </div>
  );
}
