import { PriceDetails, SignupFormData } from "@/lib/validations/bookng-modal";

const BASE_PRICE_GRID: { [beds: number]: { [baths: number]: number } } = {
  1: { 1: 105, 2: 125, 3: 145, 4: 165, 5: 185 },
  2: { 1: 135, 2: 155, 3: 175, 4: 195, 5: 215 },
  3: { 1: 165, 2: 185, 3: 205, 4: 225, 5: 245 },
  4: { 1: 195, 2: 215, 3: 235, 4: 255, 5: 275 },
  5: { 1: 225, 2: 245, 3: 265, 4: 285, 5: 305 },
};

const SQFT_SURCHARGES = [
  { range: [0, 999], charge: 0 },
  { range: [1000, 1499], charge: 25 },
  { range: [1500, 1999], charge: 50 },
  { range: [2000, 2499], charge: 75 },
  { range: [2500, 2999], charge: 100 },
];

const LAUNDRY_IN_UNIT_PER_LOAD = 9;
const LAUNDRY_OFF_SITE_BASE = 20;
const LAUNDRY_OFF_SITE_PER_LOAD = 9;

const HOT_TUB_BASIC_FEE = 20;
const HOT_TUB_FULL_DRAIN_FEE = 50;

// Define the type for periodic charges
type PeriodicCharge = {
  description: string;
  amount: number;
  cadence?: string;
};

// Subscription tier type
type SubscriptionTier = 'one-month' | 'two-month' | 'three-month' | 'four-month' | 'five-month' | 'six-month';

// Selected products type
export type SelectedProducts = {
  subscriptionTier: SubscriptionTier;
  laundry: 'on-site' | 'off-site' | 'none';
  hotTub: 'basic' | 'none';
};

export class PricingService {
  public calculatePrice(formData: SignupFormData): PriceDetails {
    const { bedrooms = 0, bathrooms = 0, sqft = 0 } = formData;

    const basePrice = this._calculateBasePrice(bedrooms, bathrooms);
    const sqftSurcharge = this._calculateSqftSurcharge(sqft);
    const laundryCost = this._calculateLaundryCost(formData);
    const hotTubCost = this._calculateHotTubCost(formData);
    const isCustomQuote = sqft >= 3000;
    const totalPerClean = basePrice + sqftSurcharge + laundryCost.total + hotTubCost.total;

    return {
      basePrice,
      sqftSurcharge,
      laundryCost: laundryCost.total,
      hotTubCost: hotTubCost.total,
      totalPerClean,
      isCustomQuote,
      periodicCharges: hotTubCost.periodic,
    };
  }

  /**
   * Gets the selected products based on form data
   * Maps form data to the product selection format
   */
  public getSelectedProducts(
    formData: SignupFormData,
    subscriptionTier: SubscriptionTier
  ): SelectedProducts {
    return {
      subscriptionTier,
      laundry: this._mapLaundrySelection(formData.laundryService),
      hotTub: this._mapHotTubSelection(formData.hasHotTub, formData.hotTubService),
    };
  }

  private _mapLaundrySelection(laundryService?: string): 'on-site' | 'off-site' | 'none' {
    if (laundryService === 'in_unit') return 'on-site';
    if (laundryService === 'off_site') return 'off-site';
    return 'none';
  }

  // ✅ UPDATED: Changed parameter type from string to boolean
  private _mapHotTubSelection(hasHotTub?: boolean, hotTubService?: boolean): 'basic' | 'none' {
    if (!hasHotTub) return 'none';
    if (hotTubService === true) return 'basic';  // ✅ Boolean check
    return 'none';
  }

  private _calculateBasePrice(beds: number, baths: number): number {
    if (beds > 0 && beds <= 5 && baths > 0 && baths <= 5) {
      return BASE_PRICE_GRID[beds]?.[baths] ?? 0;
    }
    return 0;
  }

  private _calculateSqftSurcharge(sqft: number): number {
    const surcharge = SQFT_SURCHARGES.find(s => sqft >= s.range[0] && sqft <= s.range[1]);
    return surcharge ? surcharge.charge : 0;
  }

  private _calculateLaundryCost(formData: SignupFormData): { total: number } {
    const { laundryService, laundryLoads = 0 } = formData;
    const loads = Number(laundryLoads) || 0;

    if (laundryService === 'in_unit') {
      return { total: loads * LAUNDRY_IN_UNIT_PER_LOAD };
    }
    if (laundryService === 'off_site' && loads > 0) {
      return { total: LAUNDRY_OFF_SITE_BASE + (loads * LAUNDRY_OFF_SITE_PER_LOAD) };
    }
    return { total: 0 };
  }

  // ✅ UPDATED: Changed to check boolean instead of string
  private _calculateHotTubCost(formData: SignupFormData): { total: number; periodic: PeriodicCharge[] } {
    const { hasHotTub, hotTubService, hotTubDrainCadence, hotTubDrain } = formData;
    if (!hasHotTub) return { total: 0, periodic: [] };

    let total = 0;
    const periodic: PeriodicCharge[] = [];

    if (hotTubService === true) {  // ✅ Boolean check
      total = HOT_TUB_BASIC_FEE;
    }
    if (hotTubDrain === true) {  // ✅ Explicit boolean check for consistency
      periodic.push({
        description: "Hot Tub Full Drain & Refill",
        amount: HOT_TUB_FULL_DRAIN_FEE,
        cadence: hotTubDrainCadence,
      });
    }
    return { total, periodic };
  }
  
}


// import { PriceDetails, SignupFormData } from "@/lib/validations/bookng-modal";

// const BASE_PRICE_GRID: { [beds: number]: { [baths: number]: number } } = {
//   1: { 1: 105, 2: 125, 3: 145, 4: 165, 5: 185 },
//   2: { 1: 135, 2: 155, 3: 175, 4: 195, 5: 215 },
//   3: { 1: 165, 2: 185, 3: 205, 4: 225, 5: 245 },
//   4: { 1: 195, 2: 215, 3: 235, 4: 255, 5: 275 },
//   5: { 1: 225, 2: 245, 3: 265, 4: 285, 5: 305 },
// };

// const SQFT_SURCHARGES = [
//   { range: [0, 999], charge: 0 },
//   { range: [1000, 1499], charge: 25 },
//   { range: [1500, 1999], charge: 50 },
//   { range: [2000, 2499], charge: 75 },
//   { range: [2500, 2999], charge: 100 },
// ];

// const LAUNDRY_IN_UNIT_PER_LOAD = 9;
// const LAUNDRY_OFF_SITE_BASE = 20;
// const LAUNDRY_OFF_SITE_PER_LOAD = 9;

// const HOT_TUB_BASIC_FEE = 20;
// const HOT_TUB_FULL_DRAIN_FEE = 50;

// // Define the type for periodic charges
// type PeriodicCharge = {
//   description: string;
//   amount: number;
//   cadence?: string;
// };

// // Subscription tier type
// type SubscriptionTier = 'one-month' | 'two-month' | 'three-month' | 'four-month' | 'five-month' | 'six-month';

// // Selected products type
// export type SelectedProducts = {
//   subscriptionTier: SubscriptionTier;
//   laundry: 'on-site' | 'off-site' | 'none';
//   hotTub: 'basic' | 'none';
// };

// export class PricingService {
//   public calculatePrice(formData: SignupFormData): PriceDetails {
//     const { bedrooms = 0, bathrooms = 0, sqft = 0 } = formData;

//     const basePrice = this._calculateBasePrice(bedrooms, bathrooms);
//     const sqftSurcharge = this._calculateSqftSurcharge(sqft);
//     const laundryCost = this._calculateLaundryCost(formData);
//     const hotTubCost = this._calculateHotTubCost(formData);
//     // const hottubDrain = this._
//     const isCustomQuote = sqft >= 3000;
//     const totalPerClean = basePrice + sqftSurcharge + laundryCost.total + hotTubCost.total;

//     return {
//       basePrice,
//       sqftSurcharge,
//       laundryCost: laundryCost.total,
//       hotTubCost: hotTubCost.total,
//       totalPerClean,
//       isCustomQuote,
//       periodicCharges: hotTubCost.periodic,
//     };
//   }

//   /**
//    * Gets the selected products based on form data
//    * Maps form data to the product selection format
//    */
//   public getSelectedProducts(
//     formData: SignupFormData,
//     subscriptionTier: SubscriptionTier
//   ): SelectedProducts {
//     return {
//       subscriptionTier,
//       laundry: this._mapLaundrySelection(formData.laundryService),
//       hotTub: this._mapHotTubSelection(formData.hasHotTub, formData.hotTubService),
//     };
//   }

//   private _mapLaundrySelection(laundryService?: string): 'on-site' | 'off-site' | 'none' {
//     if (laundryService === 'in_unit') return 'on-site';
//     if (laundryService === 'off_site') return 'off-site';
//     return 'none';
//   }

//   private _mapHotTubSelection(hasHotTub?: boolean, hotTubService?: string): 'basic' | 'none' {
//     if (!hasHotTub) return 'none';
//     if (hotTubService === 'basic') return 'basic';
//     return 'none';
//   }

//   private _calculateBasePrice(beds: number, baths: number): number {
//     if (beds > 0 && beds <= 5 && baths > 0 && baths <= 5) {
//       return BASE_PRICE_GRID[beds]?.[baths] ?? 0;
//     }
//     return 0;
//   }

//   private _calculateSqftSurcharge(sqft: number): number {
//     const surcharge = SQFT_SURCHARGES.find(s => sqft >= s.range[0] && sqft <= s.range[1]);
//     return surcharge ? surcharge.charge : 0;
//   }

//   private _calculateLaundryCost(formData: SignupFormData): { total: number } {
//     const { laundryService, laundryLoads = 0 } = formData;
//     const loads = Number(laundryLoads) || 0;

//     if (laundryService === 'in_unit') {
//       return { total: loads * LAUNDRY_IN_UNIT_PER_LOAD };
//     }
//     if (laundryService === 'off_site' && loads > 0) {
//       return { total: LAUNDRY_OFF_SITE_BASE + (loads * LAUNDRY_OFF_SITE_PER_LOAD) };
//     }
//     return { total: 0 };
//   }

//   private _calculateHotTubCost(formData: SignupFormData): { total: number; periodic: PeriodicCharge[] } {
//     const { hasHotTub, hotTubService, hotTubDrainCadence, hotTubDrain } = formData;
//     if (!hasHotTub) return { total: 0, periodic: [] };

//     let total = 0;
//     const periodic: PeriodicCharge[] = [];

//     if (hotTubService === 'basic') {
//       total = HOT_TUB_BASIC_FEE;
//     }
//     if (hotTubDrain) {
//       periodic.push({
//         description: "Hot Tub Full Drain & Refill",
//         amount: HOT_TUB_FULL_DRAIN_FEE,
//         cadence: hotTubDrainCadence,
//       });
//     }
//     return { total, periodic };
//   }
  
// }