import { db } from "@/db";
import { cleaners } from "@/db/schemas";
import { updateCleanerCoordinates } from "@/lib/services/google-maps/geocoding";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";


export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  
  // Update cleaner
  await db.update(cleaners).set(body).where(eq(cleaners.id, id));
  
  // If address changed, re-geocode
  if (body.address) {
    await updateCleanerCoordinates(id);
  }
  
  return NextResponse.json({ success: true });
}