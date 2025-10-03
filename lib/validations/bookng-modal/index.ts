import { z } from "zod";

export const signupFormSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: z.email(),
    emailConfirm: z.email(),
    phoneNumber: z.string().min(10, "A valid phone number is required"),
    address: z.string().min(5, "Address is required"),
    isAddressInServiceArea: z.boolean().refine((val) => val === true, {
      message: "The selected address must be within our service area.",
    }),
    sqft: z.number().positive().optional(),
    bedrooms: z.number().min(1, "Must have at least 1 bedroom"),
    bathrooms: z.number().min(1, "Must have at least 1 bathroom"),
    checklistFile: z
      .array(z.instanceof(File), { message: "A checklist file is required." })
      .min(1, "A checklist file is required.")
      .optional(),
    laundryService: z.enum(["in_unit", "off_site", "none"]),
    laundryLoads: z.coerce.number().int().min(1).optional(),
    hasHotTub: z.boolean(),
    hotTubService: z.enum(["none", "basic", "premium"]).optional(),
    hotTubDrainCadence: z
      .enum(["4_weeks", "6_weeks", "2_months", "3_months", "4_months"])
      .optional(),
    subscriptionMonths: z.number().min(1).max(6),
    iCalUrl: z.string().url("Please enter a valid URL"),
    firstCleanDate: z.date({
      message: "Please select a valid start date for your first clean.",
    }),
  })
  .refine((data) => data.email === data.emailConfirm, {
    message: "Emails don't match",
    path: ["emailConfirm"],
  });

export type SignupFormData = Partial<z.infer<typeof signupFormSchema>>;

// TypeScript type for the pricing details object
export interface PriceDetails {
  basePrice: number;
  sqftSurcharge: number;
  laundryCost: number;
  hotTubCost: number;
  totalPerClean: number;
  isCustomQuote: boolean;
  periodicCharges: Array<{
    description: string;
    amount: number;
    cadence?: string;
  }>;
}

export interface StepsProps {
  formData: SignupFormData;
  setFormData: React.Dispatch<React.SetStateAction<SignupFormData>>;
  errors: Record<string, string[] | undefined>;
}
