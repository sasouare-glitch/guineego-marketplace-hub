import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllProducts } from "@/hooks/useAllProducts";
import { formatPrice } from "@/lib/currency";

interface Props {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  buttonLabel?: string;
}

const RECENT_KEY = "sarematy_recent_searches";
const MAX_RECENT = 6;

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(term: string): string[] {
  const t = term.trim();
  if (!t) return loadRecent();
  try {
    const current = loadRecent().filter((x) => x.toLowerCase() !== t.toLowerCase());
    const next = [t, ...current].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    return next;
  } catch {
    return loadRecent();
  }
}

export function SearchAutocomplete({
  placeholder = "Rechercher des produits...",
  className = "",
  inputClassName = "",
  buttonLabel = "OK",
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { products, loading } = useAllProducts();

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  // Debounce 150ms for smoother typing
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 150);
    return () => clearTimeout(id);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const suggestions = useMemo(() => {
    const q = debounced.toLowerCase();
    if (q.length < 2) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [debounced, products]);

  // Trending: top sponsored / best sellers / highest rated
  const trending = useMemo(() => {
    const scored = [...products]
      .map((p) => ({
        p,
        score:
          (p.isSponsored ? 100 : 0) +
          (p.isBestSeller ? 50 : 0) +
          (p.reviewCount || 0) * 0.5 +
          (p.rating || 0) * 5,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x) => x.p);
    return scored;
  }, [products]);

  const submit = (term?: string, e?: React.FormEvent) => {
    e?.preventDefault();
    const q = (term ?? query).trim();
    if (q) setRecent(saveRecent(q));
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    setOpen(false);
  };

  const clearRecent = () => {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* ignore */
    }
    setRecent([]);
  };

  const removeRecent = (term: string) => {
    try {
      const next = loadRecent().filter((x) => x !== term);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      setRecent(next);
    } catch {
      /* ignore */
    }
  };

  const showEmptyState = open && debounced.length < 2;
  const showResults = open && debounced.length >= 2;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={(e) => submit(undefined, e)} role="search">
        <div className="relative w-full flex">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            aria-label={placeholder}
            aria-autocomplete="list"
            aria-expanded={open}
            className={`pl-9 pr-10 md:pr-24 h-10 rounded-full bg-secondary/60 border-border focus-visible:ring-primary ${inputClassName}`}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(true);
              }}
              className="absolute right-2 md:right-20 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              aria-label="Effacer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Button
            type="submit"
            size="sm"
            className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 h-8 rounded-full px-4"
          >
            {buttonLabel}
          </Button>
        </div>
      </form>

      {showEmptyState && (recent.length > 0 || trending.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50 max-h-[28rem] overflow-y-auto">
          {recent.length > 0 && (
            <div className="py-2">
              <div className="flex items-center justify-between px-4 py-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <Clock className="w-3.5 h-3.5" />
                  Recherches récentes
                </div>
                <button
                  type="button"
                  onClick={clearRecent}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Effacer
                </button>
              </div>
              <ul role="listbox">
                {recent.map((term) => (
                  <li key={term} className="group flex items-center hover:bg-primary/5">
                    <button
                      type="button"
                      onClick={() => submit(term)}
                      className="flex-1 text-left flex items-center gap-3 px-4 py-2 text-sm text-foreground"
                    >
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{term}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRecent(term)}
                      className="p-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Retirer ${term}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recent.length > 0 && (trending.length > 0 || loading) && (
            <div className="border-t border-border" />
          )}

          <div className="py-2">
            <div className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <TrendingUp className="w-3.5 h-3.5" />
              Tendances
            </div>
            {loading ? (
              <div className="px-4 py-2 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : trending.length === 0 ? (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                Aucune tendance pour le moment
              </div>
            ) : (
              <ul role="listbox">
                {trending.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/product/${p.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-primary/5 transition-colors"
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        className="w-10 h-10 rounded object-cover bg-muted flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p.category}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-primary whitespace-nowrap">
                        {formatPrice(p.price, "GNF")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {showResults && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {loading ? (
            <div className="px-4 py-3 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Aucun produit trouvé
            </div>
          ) : (
            <ul role="listbox" className="max-h-96 overflow-y-auto">
              {suggestions.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/product/${p.id}`}
                    onClick={() => {
                      setRecent(saveRecent(debounced));
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-primary/5 transition-colors"
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="w-10 h-10 rounded object-cover bg-muted flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.category}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-primary whitespace-nowrap">
                      {formatPrice(p.price, "GNF")}
                    </span>
                  </Link>
                </li>
              ))}
              <li className="border-t border-border">
                <button
                  type="button"
                  onClick={() => submit()}
                  className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-primary/5"
                >
                  Voir tous les résultats pour « {debounced} »
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
