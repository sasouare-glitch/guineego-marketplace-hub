import { useState } from "react";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  WEEK_DAYS,
  type RentalAvailability,
  type WeekDay,
} from "@/types/rental";

interface Props {
  value: RentalAvailability;
  onChange: (next: RentalAvailability) => void;
}

const HOURS = Array.from({ length: 25 }, (_, i) => i); // 0..24

export function AvailabilityEditor({ value, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const updateDay = (day: WeekDay, patch: Partial<RentalAvailability["weekly"][WeekDay]>) => {
    onChange({
      ...value,
      weekly: { ...value.weekly, [day]: { ...value.weekly[day], ...patch } },
    });
  };

  const addBlockedDate = (date?: Date) => {
    if (!date) return;
    const key = format(date, "yyyy-MM-dd");
    if (value.blockedDates.includes(key)) return;
    onChange({ ...value, blockedDates: [...value.blockedDates, key].sort() });
    setPickerOpen(false);
  };

  const removeBlockedDate = (key: string) => {
    onChange({ ...value, blockedDates: value.blockedDates.filter((d) => d !== key) });
  };

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div>
        <Label className="text-sm font-semibold">Disponibilité hebdomadaire</Label>
        <p className="text-xs text-muted-foreground">
          Définissez vos jours et plages horaires habituels.
        </p>
      </div>

      <div className="space-y-2">
        {WEEK_DAYS.map(({ id, label }) => {
          const day = value.weekly[id];
          const closed = !!day.closed;
          return (
            <div
              key={id}
              className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2"
            >
              <div className="w-20 text-sm font-medium">{label}</div>
              <Switch
                checked={!closed}
                onCheckedChange={(open) => updateDay(id, { closed: !open })}
                aria-label={`${label} ouvert`}
              />
              <div className="flex-1 flex items-center gap-2">
                {closed ? (
                  <span className="text-xs text-muted-foreground">Fermé</span>
                ) : (
                  <>
                    <select
                      value={day.startHour}
                      onChange={(e) =>
                        updateDay(id, { startHour: Number(e.target.value) })
                      }
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {HOURS.slice(0, 24).map((h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-muted-foreground">à</span>
                    <select
                      value={day.endHour}
                      onChange={(e) =>
                        updateDay(id, { endHour: Number(e.target.value) })
                      }
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {HOURS.slice(1).map((h) => (
                        <option
                          key={h}
                          value={h}
                          disabled={h <= day.startHour}
                        >
                          {String(h).padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">Dates bloquées</Label>
            <p className="text-xs text-muted-foreground">
              Jours indisponibles (congés, maintenance ponctuelle…)
            </p>
          </div>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <CalendarIcon className="w-4 h-4 mr-2" /> Bloquer une date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                onSelect={addBlockedDate}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        {value.blockedDates.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucune date bloquée.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value.blockedDates.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => removeBlockedDate(key)}
                className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs"
              >
                {format(parse(key, "yyyy-MM-dd", new Date()), "d MMM yyyy", { locale: fr })}
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1 pt-2 border-t border-border/60">
        <Label htmlFor="noticeHours" className="text-sm font-semibold">
          Préavis minimum (heures)
        </Label>
        <Input
          id="noticeHours"
          type="number"
          min={0}
          max={168}
          value={value.noticeHours ?? 0}
          onChange={(e) =>
            onChange({ ...value, noticeHours: Math.max(0, Number(e.target.value) || 0) })
          }
          className="w-32"
        />
        <p className="text-xs text-muted-foreground">
          Délai entre la réservation et le début de la location.
        </p>
      </div>
    </div>
  );
}
