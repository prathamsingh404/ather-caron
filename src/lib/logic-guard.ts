import { Category, calculateEmission } from "@/lib/carbon-engine";
import { geocode, getRoutingDistanceKm } from "@/lib/geo-utils";

export interface OptimizationResult {
  current_carbon_kg: number;
  optimized_carbon_kg: number;
  carbon_saved_kg: number;
  recommendation: string;
}

function buildOptimization(category: Category, subcategory: string, value: number) {
  const current = calculateEmission(category, subcategory, value);
  let optimized = current;
  let recommendation = "You are already using one of the lower-impact options in this category.";

  if (category === Category.FOOD && subcategory === "beef") {
    optimized = calculateEmission(category, "vegetarian_meal", value);
    recommendation = "Swap beef-heavy meals for vegetarian dishes this week to cut a large chunk of food emissions.";
  } else if (category === Category.FOOD && subcategory === "meat_meal") {
    optimized = calculateEmission(category, "vegan_meal", value);
    recommendation = "Replacing a few meat meals with vegan meals will materially lower your weekly food footprint.";
  } else if (category === Category.TRANSPORT && subcategory === "car_petrol") {
    optimized = calculateEmission(category, "train", value);
    recommendation = "Shift longer commutes to train or bus where possible to reduce transport emissions quickly.";
  } else if (category === Category.TRANSPORT && subcategory === "flight_short") {
    optimized = calculateEmission(category, "train", value);
    recommendation = "For short-haul travel, rail usually offers the biggest carbon savings without major disruption.";
  } else if (category === Category.ENERGY && subcategory === "diesel_generator") {
    optimized = calculateEmission(Category.ENERGY, "electricity", value);
    recommendation = "Reducing generator runtime and moving demand back to the grid will improve your energy profile.";
  } else if (category === Category.WATER && subcategory === "bottled_water") {
    optimized = calculateEmission(Category.WATER, "tap_water", value);
    recommendation = "Using filtered tap water instead of bottled water cuts both water and packaging emissions.";
  }

  return {
    current_carbon_kg: current.carbon_kg,
    optimized_carbon_kg: optimized.carbon_kg,
    carbon_saved_kg: +(current.carbon_kg - optimized.carbon_kg).toFixed(2),
    recommendation,
  };
}

export class LogicGuard {
  static async getOptimization(category: Category, subcategory: string, value: number): Promise<OptimizationResult | null> {
    if (value <= 0) {
      return null;
    }

    return buildOptimization(category, subcategory, value);
  }

  static async DEI_TransportSummary(startAddr: string, endAddr: string, mode: string) {
    const startCoords = await geocode(startAddr);
    const endCoords = await geocode(endAddr);

    if (!startCoords || !endCoords) {
      return null;
    }

    const distance = await getRoutingDistanceKm(startCoords, endCoords);
    if (!distance) {
      return null;
    }

    return {
      distance_km: distance,
      carbon_kg: calculateEmission(Category.TRANSPORT, mode, distance).carbon_kg,
      optimization: await this.getOptimization(Category.TRANSPORT, mode, distance),
    };
  }
}
