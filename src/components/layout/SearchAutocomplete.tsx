import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAllProducts } from "@/hooks/useAllProducts";
import { formatPrice } from "@/lib/currency";

interface Props {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  buttonLabel?: string;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { products } = useAllProducts();

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

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={submit} role="search">
        <div className="relative w-full flex">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            aria-label={placeholder}
            aria-autocomplete="list"
            aria-expanded={open && suggestions.length > 0}
            className={`pl-9 pr-24 h-10 rounded-full bg-secondary/60 border-border focus-visible:ring-primary ${inputClassName}`}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              className="absolute right-20 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              aria-label="Effacer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 rounded-full px-4"
          >
            {buttonLabel}
          </Button>
        </div>
      </form>

      {open && debounced.length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Aucun produit trouvé
            </div>
          ) : (
            <ul role="listbox" className="max-h-96 overflow-y-auto">
              {suggestions.map((p) => (
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
