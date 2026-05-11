import { db } from "@/lib/db";
import { tribeRegistrationsTable, alphaClaimsTable, guildConfigTable } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get("guildId");

  if (!guildId) {
    return NextResponse.json({ error: "Missing guildId" }, { status: 400 });
  }

  try {
    const registrations = await db
      .select()
      .from(tribeRegistrationsTable)
      .where(eq(tribeRegistrationsTable.guildId, guildId))
      .orderBy(desc(tribeRegistrationsTable.createdAt));

    const alphaClaims = await db
      .select()
      .from(alphaClaimsTable)
      .where(eq(alphaClaimsTable.guildId, guildId));

    const configs = await db
      .select()
      .from(guildConfigTable)
      .where(eq(guildConfigTable.guildId, guildId));

    const tribeCount = new Set(
      registrations
        .filter((r) => r.status === "verified")
        .map((r) => r.tribeName)
    ).size;

    return NextResponse.json({
      registrations,
      alphaClaims,
      config: configs[0] || null,
      tribeCount,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
