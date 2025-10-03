"use server";

import { db } from "@/db";
import { createClient } from "@/lib/supabase/server";
import {
  customers,
  properties,
  subscriptions,
  checklistFiles,
} from "@/db/schema";
import { SignupFormData, signupFormSchema } from "../validations/bookng-modal";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function completeOnboarding(
  formData: SignupFormData,
  paymentIntentId: string
) {
  try {
    
    const validatedData = signupFormSchema.parse(formData);

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const stripeCustomerId = typeof paymentIntent.customer === 'string' ? paymentIntent.customer : null;

    if (!stripeCustomerId) {
      throw new Error("Critical: Could not find a Stripe Customer ID associated with this payment.");
    }

    const {
      name,
      email,
      phoneNumber,
      address,
      sqft,
      bedrooms,
      bathrooms,
      hasHotTub,
      laundryService,
      laundryLoads,
      hotTubService,
      hotTubDrainCadence,
      subscriptionMonths,
      checklistFile,
      iCalUrl,
      firstCleanDate,
    } = validatedData;

    const result = await db.transaction(async (tx) => {
      
      const [customer] = await tx
        .insert(customers)
        .values({ 
          name, 
          email, 
          phone: phoneNumber,
          stripeCustomerId
        })
        .onConflictDoUpdate({
          target: customers.email,
          set: { 
            name, 
            phone: phoneNumber, 
            stripeCustomerId, 
            updatedAt: new Date() 
          },
        })
        .returning();

      const [property] = await tx
        .insert(properties)
        .values({
          customerId: customer.id,
          address,
          sqFt: sqft,
          bedCount: bedrooms,
          bathCount: String(bathrooms),
          hasHotTub,
          laundryType: laundryService,
          laundryLoads,
          hotTubServiceLevel: hotTubService,
          hotTubDrainCadence,
          iCalUrl,
        })
        .returning();

      if (checklistFile && checklistFile.length > 0) {
        for (const file of checklistFile) {
          const storagePath = `checklists/${property.id}/${file.name}`;
          const supabase = await createClient();
          const { error: uploadError } = await supabase.storage
            .from("checklists")
            .upload(storagePath, file);

          if (uploadError) {
            throw new Error(
              `Failed to upload checklist: ${uploadError.message}`
            );
          }

          await tx.insert(checklistFiles).values({
            propertyId: property.id,
            fileName: file.name,
            storagePath: storagePath,
            fileSize: file.size,
          });
        }
      }

      // TODO: For future recurring billing implementation, create a Stripe Subscription here
      // and populate stripeSubscriptionId. For now, we're handling payments manually.
      const [subscription] = await tx
        .insert(subscriptions)
        .values({
          customerId: customer.id,
          propertyId: property.id,
          stripeSubscriptionId: null, // TODO: Implement Stripe Subscriptions for automatic recurring billing
          durationMonths: subscriptionMonths,
          firstCleanPaymentId: paymentIntentId,
          isFirstCleanPrepaid: true,
          status: "active",
          startDate: firstCleanDate.toISOString(),
        })
        .returning();

      return { customer, property, subscription };
    });

    console.log("Successfully saved to database:", result);
    return { success: true, data: result };
  } catch (error) {
    console.error("CRITICAL: Onboarding failed after successful payment.", {
      paymentIntentId,
      error: (error as Error).message,
      formData,
    });

    return {
      success: false,
      error: "Failed to save subscription details. Please contact support.",
    };
  }
}