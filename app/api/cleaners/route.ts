import { getCleaners } from "@/lib/queries/cleaners";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 15; // Set a fixed limit for API calls

  try {
    const data = await getCleaners({ page, limit });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch cleaners:", error);
    return NextResponse.json(
      { error: "Failed to fetch cleaners" },
      { status: 500 }
    );
  }
}
