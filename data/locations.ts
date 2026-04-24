import type { Commodity, Position } from "@/engine/types";

export interface LocationDefinition {
  id: string;
  name: string;
  unlocked: boolean;
  travelTime: number;
  priceMod: number;
  demandTags: string[];
  special?: "heat_reduction";
}

export interface CourierService {
  id: "ghost_runner" | "shadow_haul" | "armored_conduit";
  name: string;
  cost: number;
  lossChance: number;
}

export interface TransitShipment {
  id: string;
  ticker: string;
  quantity: number;
  avgEntry: number;
  destinationId: string;
  arrivalTime: number;
  courierUsed: CourierService["id"];
  status: "transit" | "arrived" | "lost" | "claimed";
}

export type LocationInventoryMap = Record<string, Position[]>;

export const DEFAULT_LOCATION_ID = "neon_plaza";

export const LOCATIONS: LocationDefinition[] = [
  { id: "neon_plaza", name: "Neon Plaza", unlocked: true, travelTime: 0, priceMod: 1.0, demandTags: [] },
  { id: "tech_valley", name: "Tech Valley", unlocked: true, travelTime: 5, priceMod: 1.05, demandTags: ["tech", "data"] },
  { id: "the_port", name: "The Port", unlocked: true, travelTime: 8, priceMod: 0.95, demandTags: ["gas", "supply"] },
  { id: "the_slums", name: "The Slums", unlocked: false, travelTime: 15, priceMod: 0.85, demandTags: ["cheap"] },
  { id: "the_lab", name: "The Lab", unlocked: false, travelTime: 12, priceMod: 1.2, demandTags: ["research", "premium"] },
  { id: "the_greenhouse", name: "The Greenhouse", unlocked: false, travelTime: 10, priceMod: 1.0, demandTags: ["bio"] },
  { id: "crypto_exchange", name: "Crypto Exchange", unlocked: false, travelTime: 3, priceMod: 1.15, demandTags: ["digital"] },
  { id: "black_market", name: "Black Market", unlocked: true, travelTime: 6, priceMod: 0.9, demandTags: ["contraband"], special: "heat_reduction" },
  { id: "the_rooftop", name: "The Rooftop", unlocked: false, travelTime: 20, priceMod: 1.3, demandTags: ["luxury"] },
  { id: "undercity", name: "Undercity", unlocked: false, travelTime: 18, priceMod: 0.75, demandTags: ["scrap"] },
];

export const COURIER_SERVICES: CourierService[] = [
  { id: "ghost_runner", name: "Ghost Runner", cost: 500, lossChance: 0.4 },
  { id: "shadow_haul", name: "Shadow Haul", cost: 2000, lossChance: 0.15 },
  { id: "armored_conduit", name: "Armored Conduit", cost: 10000, lossChance: 0.02 },
];

export function getLocation(id: string | null | undefined): LocationDefinition {
  return LOCATIONS.find((location) => location.id === id) ?? LOCATIONS[0]!;
}

export function getUnlockedLocations(): LocationDefinition[] {
  return LOCATIONS.filter((location) => location.unlocked);
}

export function getCourierService(id: CourierService["id"]): CourierService {
  return COURIER_SERVICES.find((service) => service.id === id) ?? COURIER_SERVICES[0]!;
}

export function commodityMatchesLocationDemand(
  commodity: Commodity,
  location: LocationDefinition,
): boolean {
  const searchable = `${commodity.ticker} ${commodity.name} ${commodity.eventTags.join(" ")}`.toLowerCase();
  return location.demandTags.some((tag) =>
    searchable.includes(tag.toLowerCase()),
  );
}
