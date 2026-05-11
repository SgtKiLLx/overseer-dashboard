import { db } from "@/lib/db";
import { guildConfigTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      guildId,
      staffLogChannelId,
      welcomeChannelId,
      recruitmentChannelId,
      supportChannelId,
      rulesChannelId,
      infoChannelId,
      tribeCategoryId,
      adminRoleIds
    } = body;

    if (!guildId) {
      return NextResponse.json({ success: false, error: "Missing guildId" }, { status: 400 });
    }

    await db.insert(guildConfigTable).values({
      guildId,
      staffLogChannelId,
      welcomeChannelId,
      recruitmentChannelId,
      supportChannelId,
      rulesChannelId,
      infoChannelId,
      tribeCategoryId,
      adminRoleIds,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: guildConfigTable.guildId,
      set: {
        staffLogChannelId,
        welcomeChannelId,
        recruitmentChannelId,
        supportChannelId,
        rulesChannelId,
        infoChannelId,
        tribeCategoryId,
        adminRoleIds,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: "Configuration synced successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to update config" }, { status: 500 });
  }
}
