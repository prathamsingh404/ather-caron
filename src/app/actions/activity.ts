"use server";

import { Category } from "@/lib/carbon-engine";
import { activityInputSchema } from "@/lib/activity-input";
import { prisma } from "@/lib/prisma";
import { LogicGuard } from "@/lib/logic-guard";
import { requireUserId } from "@/lib/auth";

export async function saveActivity(data: {
  category: Category;
  subcategory: string;
  value: number;
  unit: string;
  date: string;
  facility?: string;
  note?: string;
  source?: "MANUAL" | "OCR" | "API";
}) {
  try {
    const payload = activityInputSchema.parse(data);
    const userId = await requireUserId();
    
    // Call the Aether-Carbon Logic Guard for DEI and Optimization
    const optimization = await LogicGuard.getOptimization(payload.category, payload.subcategory, payload.value);
    const carbon_equivalent = optimization?.current_carbon_kg || 0;

    const activityDate = payload.date ? new Date(payload.date) : new Date();

    // The Aether-Carbon Ledger Write
    const result = await prisma.activity.create({
      data: {
        userId,
        category: payload.category,
        subcategory: payload.subcategory,
        raw_value: payload.value,
        unit: payload.unit,
        facility: payload.facility,
        carbon_equivalent,
        optimization_recommendation: optimization?.recommendation,
        potential_savings_kg: optimization?.carbon_saved_kg,
        source: payload.source || "MANUAL",
        date: activityDate,
      }
    });

    return { success: true, message: "Activity successfully logged to Ledger!", result };
  } catch (error) {
    console.error("Aether-Carbon Ledger Error:", error);
    throw new Error("Failed to save activity");
  }
}
