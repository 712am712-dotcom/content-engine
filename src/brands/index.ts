import { mfdBrand } from "./mfd";
import { aeBrand } from "./ae";

export const brands = {
  mfd: mfdBrand,
  ae: aeBrand,
} as const;

export type BrandId = keyof typeof brands;

export function getBrand(id: string) {
  const brand = brands[id as BrandId];
  if (!brand) throw new Error(`Unknown brand: ${id}`);
  return brand;
}
