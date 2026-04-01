import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Car, Droplets, Leaf, Loader2, ShoppingBag, Trash2, X, Zap } from "lucide-react";
import { Category } from "@/lib/carbon-engine";

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    category: Category;
    subcategory: string;
    value: number;
    unit: string;
    facility: string;
    date: string;
    source: "MANUAL" | "OCR" | "API";
  }) => Promise<void>;
}

type CategoryConfig = {
  label: string;
  icon: React.ReactNode;
  contextLabel: string;
  contexts: string[];
  subcategoryLabel: string;
  options: Array<{ value: string; label: string; unit: string }>;
};

const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  [Category.ENERGY]: {
    label: "Energy",
    icon: <Zap className="h-4 w-4" />,
    contextLabel: "Facility",
    contexts: ["Academic Area", "Hostels", "Health Centre", "Schools", "Residential Areas"],
    subcategoryLabel: "Energy source",
    options: [
      { value: "electricity", label: "Grid electricity", unit: "kWh" },
      { value: "natural_gas", label: "Natural gas", unit: "kWh" },
      { value: "heating_oil", label: "Heating oil", unit: "kWh" },
      { value: "diesel_generator", label: "Diesel generator", unit: "L" },
    ],
  },
  [Category.TRANSPORT]: {
    label: "Transport",
    icon: <Car className="h-4 w-4" />,
    contextLabel: "Trip context",
    contexts: ["Campus commute", "Intercity travel", "Shuttle service", "Field visit", "Airport transfer"],
    subcategoryLabel: "Transport mode",
    options: [
      { value: "car_petrol", label: "Car (petrol)", unit: "km" },
      { value: "car_diesel", label: "Car (diesel)", unit: "km" },
      { value: "car_electric", label: "Car (electric)", unit: "km" },
      { value: "bus", label: "Bus", unit: "km" },
      { value: "train", label: "Train", unit: "km" },
      { value: "flight_short", label: "Flight (short haul)", unit: "km" },
      { value: "flight_long", label: "Flight (long haul)", unit: "km" },
    ],
  },
  [Category.WATER]: {
    label: "Water",
    icon: <Droplets className="h-4 w-4" />,
    contextLabel: "Usage zone",
    contexts: ["Academic Area", "Residential Areas", "Health Centre", "Hostels", "Visitor's Hostel"],
    subcategoryLabel: "Water source",
    options: [
      { value: "tap_water", label: "Tap water", unit: "liters" },
      { value: "bottled_water", label: "Bottled water", unit: "liters" },
    ],
  },
  [Category.WASTE]: {
    label: "Waste",
    icon: <Trash2 className="h-4 w-4" />,
    contextLabel: "Waste zone",
    contexts: ["Mess area", "Academic Area", "Residential Areas", "Event venue", "Outdoor spaces"],
    subcategoryLabel: "Waste stream",
    options: [
      { value: "landfill", label: "Landfill waste", unit: "kg" },
      { value: "recycling", label: "Recycling", unit: "kg" },
      { value: "compost", label: "Compost", unit: "kg" },
    ],
  },
  [Category.FOOD]: {
    label: "Food",
    icon: <Leaf className="h-4 w-4" />,
    contextLabel: "Meal context",
    contexts: ["Hostel mess", "Cafeteria", "Faculty dining", "Food delivery", "Event catering"],
    subcategoryLabel: "Food type",
    options: [
      { value: "beef", label: "Beef", unit: "kg" },
      { value: "chicken", label: "Chicken", unit: "kg" },
      { value: "fish", label: "Fish", unit: "kg" },
      { value: "vegan_meal", label: "Vegan meal", unit: "meals" },
      { value: "vegetarian_meal", label: "Vegetarian meal", unit: "meals" },
      { value: "meat_meal", label: "Meat meal", unit: "meals" },
    ],
  },
  [Category.SHOPPING]: {
    label: "Shopping",
    icon: <ShoppingBag className="h-4 w-4" />,
    contextLabel: "Purchase context",
    contexts: ["Office supplies", "Personal essentials", "Electronics purchase", "Apparel", "Lab equipment"],
    subcategoryLabel: "Purchase type",
    options: [
      { value: "clothing", label: "Clothing", unit: "items" },
      { value: "electronics", label: "Electronics", unit: "items" },
    ],
  },
};

const CATEGORY_ORDER = [
  Category.ENERGY,
  Category.TRANSPORT,
  Category.WATER,
  Category.WASTE,
  Category.FOOD,
  Category.SHOPPING,
];

export default function ManualEntryModal({ isOpen, onClose, onSave }: ManualEntryModalProps) {
  const [activeCategory, setActiveCategory] = useState<Category>(Category.ENERGY);
  const [contextValue, setContextValue] = useState(CATEGORY_CONFIG[Category.ENERGY].contexts[0]);
  const [subcategory, setSubcategory] = useState(CATEGORY_CONFIG[Category.ENERGY].options[0].value);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = useMemo(() => CATEGORY_CONFIG[activeCategory], [activeCategory]);
  const activeOption = useMemo(
    () => config.options.find((option) => option.value === subcategory) || config.options[0],
    [config, subcategory],
  );

  const switchCategory = (category: Category) => {
    const next = CATEGORY_CONFIG[category];
    setActiveCategory(category);
    setContextValue(next.contexts[0]);
    setSubcategory(next.options[0].value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!value || Number(value) <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        category: activeCategory,
        subcategory,
        value: Number(value),
        unit: activeOption.unit,
        facility: contextValue,
        date: new Date(date).toISOString(),
        source: "MANUAL",
      });
      setValue("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/55 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          className="glass-panel relative z-10 w-full max-w-3xl rounded-[32px] border border-white/50 p-6 dark:border-white/10"
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/30 pb-5 dark:border-white/10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Quick input</p>
              <h2 className="mt-2 text-2xl font-semibold">Add a carbon activity</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Each category now has its own context dropdown and source dropdown instead of sharing the same menu.
              </p>
            </div>
            <button onClick={onClose} className="rounded-2xl bg-white/70 p-2 text-slate-600 dark:bg-white/10 dark:text-slate-200">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ORDER.map((category) => {
                const item = CATEGORY_CONFIG[category];
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => switchCategory(category)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeCategory === category
                        ? "bg-slate-950 text-white dark:bg-emerald-500 dark:text-slate-950"
                        : "glass-panel text-slate-700 hover:-translate-y-0.5 dark:text-slate-100"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  {config.contextLabel}
                </span>
                <select
                  value={contextValue}
                  onChange={(event) => setContextValue(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white/75 px-4 py-3 text-sm font-medium outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-slate-900/50"
                >
                  {config.contexts.map((context) => (
                    <option key={context} value={context}>
                      {context}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  {config.subcategoryLabel}
                </span>
                <select
                  value={subcategory}
                  onChange={(event) => setSubcategory(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white/75 px-4 py-3 text-sm font-medium outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-slate-900/50"
                >
                  {config.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Amount</span>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-slate-200 bg-white/75 px-4 py-3 pr-20 text-sm font-medium outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-slate-900/50"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                    {activeOption.unit}
                  </span>
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white/75 px-4 py-3 text-sm font-medium outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-slate-900/50"
                />
              </label>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <Building2 className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Current selection</p>
                  <p className="mt-1 text-lg font-semibold">
                    {config.label} / {activeOption.label}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !value}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Saving..." : "Add to ledger"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
