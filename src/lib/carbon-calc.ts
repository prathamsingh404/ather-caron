import { Category } from "@prisma/client";

// Simple emission factors for demonstration purposes
// In a real app, these would come from the database (EmissionFactor table) and be regularly updated
const EMISSION_FACTORS: Record<string, Record<string, number>> = {
  [Category.TRANSPORT]: {
    "car_petrol": 0.192, // kg CO2e per km
    "car_diesel": 0.171, // kg CO2e per km
    "car_electric": 0.053, // kg CO2e per km (varies by grid)
    "bus": 0.105, // kg CO2e per passenger km
    "train": 0.041, // kg CO2e per passenger km
    "flight_short": 0.255, // kg CO2e per pax km
    "flight_long": 0.150, // kg CO2e per pax km
  },
  [Category.ENERGY]: {
    "electricity": 0.233, // kg CO2e per kWh (grid average)
    "natural_gas": 0.202, // kg CO2e per kWh
    "heating_oil": 0.267, // kg CO2e per kWh
  },
  [Category.FOOD]: {
    "beef": 27.0, // kg CO2e per kg
    "chicken": 6.9, // kg CO2e per kg
    "fish": 6.1, // kg CO2e per kg
    "vegan_meal": 0.5, // kg CO2e per meal
    "vegetarian_meal": 1.2, // kg CO2e per meal
    "meat_meal": 3.0, // kg CO2e per meal
  },
  [Category.WASTE]: {
    "landfill": 0.58, // kg CO2e per kg
    "recycling": 0.02, // kg CO2e per kg
    "compost": 0.17, // kg CO2e per kg
  },
};

export type CalculationResult = {
  carbonKg: number;
  emissionFactor: number;
  factorSource: string;
};

/**
 * Calculate carbon emissions based on category, subcategory, and value.
 * @param category Activity category (e.g., TRANSPORT)
 * @param subcategory Specific activity (e.g., car_petrol)
 * @param value Quantity (e.g., km travelled or kWh consumed)
 * @returns Object with calculated carbon, the factor used, and its source
 */
export function calculateEmissions(
  category: Category,
  subcategory: string,
  value: number
): CalculationResult {
  const factors = EMISSION_FACTORS[category];
  
  if (!factors || factors[subcategory] === undefined) {
    // Fallback if not found - in production this might throw or use a generic average
    return {
      carbonKg: value * 0.5,
      emissionFactor: 0.5,
      factorSource: "Fallback Average Estimate",
    };
  }

  const factor = factors[subcategory];
  return {
    carbonKg: value * factor,
    emissionFactor: factor,
    factorSource: "System Default Estimates 2024",
  };
}

/**
 * Gets available subcategories for a given category to populate UI forms
 */
export function getAvailableSubcategories(category: Category): { id: string; label: string }[] {
  const factors = EMISSION_FACTORS[category] || {};
  return Object.keys(factors).map(key => ({
    id: key,
    // Format "car_petrol" to "Car Petrol"
    label: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  }));
}
