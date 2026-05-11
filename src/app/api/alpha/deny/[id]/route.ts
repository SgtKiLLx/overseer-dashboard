import { db } from "@/lib/db";
import { alphaClaimsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await db.delete(alphaClaimsTable).where(eq(alphaClaimsTable.id, id));

    return NextResponse.json({ success: true, message: "Alpha claim denied and purged" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to deny alpha" }, { status: 500 });
  }
}
