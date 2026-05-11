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
    await db
      .update(alphaClaimsTable)
      .set({ status: "approved" })
      .where(eq(alphaClaimsTable.id, id));

    return NextResponse.json({ success: true, message: "Alpha status approved" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to verify alpha" }, { status: 500 });
  }
}
