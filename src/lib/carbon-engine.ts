import { Category } from "@prisma/client";
export { Category };

export type EmissionFactorData = {
  subcategory: string;
  factor: number;
  unit: string;
};

export const EMISSION_FACTORS: Record<Category, EmissionFactorData[]> = {
  [Category.TRANSPORT]: [
    { subcategory: "car_petrol", factor: 0.192, unit: "km" },
    { subcategory: "car_diesel", factor: 0.171, unit: "km" },
    { subcategory: "car_electric", factor: 0.053, unit: "km" },
    { subcategory: "bus", factor: 0.105, unit: "pax-km" },
    { subcategory: "train", factor: 0.041, unit: "pax-km" },
    { subcategory: "flight_short", factor: 0.255, unit: "pax-km" },
    { subcategory: "flight_long", factor: 0.150, unit: "pax-km" },
  ],
  [Category.ENERGY]: [
    { subcategory: "electricity", factor: 0.233, unit: "kWh" },
    { subcategory: "natural_gas", factor: 0.202, unit: "kWh" },
    { subcategory: "heating_oil", factor: 0.267, unit: "kWh" },
  ],
  [Category.FOOD]: [
    { subcategory: "beef", factor: 27.0, unit: "kg" },
    { subcategory: "chicken", factor: 6.9, unit: "kg" },
    { subcategory: "fish", factor: 6.1, unit: "kg" },
    { subcategory: "vegan_meal", factor: 0.5, unit: "meals" },
    { subcategory: "vegetarian_meal", factor: 1.2, unit: "meals" },
    { subcategory: "meat_meal", factor: 3.0, unit: "meals" },
  ],
  [Category.WASTE]: [
    { subcategory: "landfill", factor: 0.58, unit: "kg" },
    { subcategory: "recycling", factor: 0.02, unit: "kg" },
    { subcategory: "compost", factor: 0.17, unit: "kg" },
  ],
  [Category.SHOPPING]: [
    { subcategory: "clothing", factor: 15.0, unit: "items" },
    { subcategory: "electronics", factor: 50.0, unit: "items" },
  ],
  [Category.WATER]: [
    { subcategory: "tap_water", factor: 0.0003, unit: "liters" },
    { subcategory: "bottled_water", factor: 0.2, unit: "liters" },
  ]
};

export type CalculationResult = {
  carbon_kg: number;
  source: string;
  uncertainty_range: {
    low: number;
    high: number;
  };
};

export function calculateEmission(
  category: Category,
  subcategory: string,
  value: number
): CalculationResult {
  const factors = EMISSION_FACTORS[category] || [];
  const factorData = factors.find(f => f.subcategory === subcategory);

  if (!factorData) {
    return {
      carbon_kg: +(value * 0.5).toFixed(2),
      source: "Fallback Average",
      uncertainty_range: { low: value * 0.3, high: value * 0.7 }
    };
  }

  const result = value * factorData.factor;
  return {
    carbon_kg: +result.toFixed(2),
    source: "System Default 2024",
    uncertainty_range: {
      low: +(result * 0.9).toFixed(2),
      high: +(result * 1.1).toFixed(2)
    }
  };
}
