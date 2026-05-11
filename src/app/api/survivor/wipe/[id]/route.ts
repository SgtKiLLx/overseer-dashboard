import { db } from "@/lib/db";
import { tribeRegistrationsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await db
      .delete(tribeRegistrationsTable)
      .where(eq(tribeRegistrationsTable.id, id));

    return NextResponse.json({ success: true, message: "Survivor signature purged" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to wipe survivor" }, { status: 500 });
  }
}
