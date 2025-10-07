import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payouts, cleaners } from "@/db/schemas";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Secure this endpoint with a secret token
const CRON_SECRET = process.env.CRON_SECRET_TOKEN;

export async function POST(req: NextRequest) {
  try {
    // Verify cron job authentication
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all pending payouts with cleaner data
    const pendingPayouts = await db.query.payouts.findMany({
      where: eq(payouts.status, "pending"),
      with: {
        cleaner: true,
        job: true,
      },
    });

    if (pendingPayouts.length === 0) {
      return NextResponse.json({
        message: "No pending payouts to process",
        processed: 0,
      });
    }

    const results = {
      processed: 0,
      failed: 0,
      held: 0,
      errors: [] as any[],
    };

    for (const payout of pendingPayouts) {
      try {
        // Validate cleaner has Stripe account
        if (!payout.cleaner.stripeAccountId) {
          await db
            .update(payouts)
            .set({
              status: "held",
              updatedAt: new Date(),
            })
            .where(eq(payouts.id, payout.id));

          results.held++;
          results.errors.push({
            payoutId: payout.id,
            cleanerId: payout.cleanerId,
            error: "Cleaner missing Stripe account",
          });
          continue;
        }

        // Calculate total payout amount
        const baseAmount = parseFloat(payout.amount);
        const urgentBonus = parseFloat(payout.urgentBonusAmount || "0");
        const laundryBonus = parseFloat(payout.laundryBonusAmount || "0");
        const totalAmount = baseAmount + urgentBonus + laundryBonus;

        // Convert to cents for Stripe
        const amountInCents = Math.round(totalAmount * 100);

        // Create Stripe Transfer to connected account
        const transfer = await stripe.transfers.create({
          amount: amountInCents,
          currency: "usd",
          destination: payout.cleaner.stripeAccountId,
          description: `Payout for Job ${payout.jobId}`,
          metadata: {
            payoutId: payout.id,
            jobId: payout.jobId,
            cleanerId: payout.cleanerId,
            baseAmount: baseAmount.toFixed(2),
            urgentBonus: urgentBonus.toFixed(2),
            laundryBonus: laundryBonus.toFixed(2),
          },
        });

        // Update payout record with Stripe transfer ID
        await db
          .update(payouts)
          .set({
            stripePayoutId: transfer.id,
            status: "released",
            updatedAt: new Date(),
          })
          .where(eq(payouts.id, payout.id));

        results.processed++;
      } catch (error: any) {
        console.error(`Failed to process payout ${payout.id}:`, error);

        // Mark payout as held on error
        await db
          .update(payouts)
          .set({
            status: "held",
            updatedAt: new Date(),
          })
          .where(eq(payouts.id, payout.id));

        results.failed++;
        results.errors.push({
          payoutId: payout.id,
          cleanerId: payout.cleanerId,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payout processing complete",
      results,
    });
  } catch (error: any) {
    console.error("Payout processing failed:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}