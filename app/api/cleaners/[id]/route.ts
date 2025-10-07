import { db } from "@/db";
import { cleaners } from "@/db/schemas";
import { updateCleanerCoordinates } from "@/lib/services/google-maps/geocoding";
import { createClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";


export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
      const { data } = await supabase.auth.getClaims();
      const user = data?.claims;
      const userRole = user?.user_metadata?.role;
  
      if (userRole !== 'admin' || userRole !== 'super_admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

  const { id } = await params;
  const body = await req.json();
  
  await db.update(cleaners).set(body).where(eq(cleaners.id, id));
  
  if (body.address) {
    await updateCleanerCoordinates(id);
  }
  
  return NextResponse.json({ success: true });
}