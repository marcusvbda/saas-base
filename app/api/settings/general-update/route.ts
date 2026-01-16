import SettingsService from "@/domain/settings/settings.service";
import { requireServerAuth } from "@/lib/better-auth/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    return requireServerAuth(async ({ session }) => {
        try {
            const body = await request.json();
            const { timezone } = body
            if (!timezone) {
                return NextResponse.json({ error: { message: "Timezone is required" } }, { status: 400 });
            }

            const settingsService = new SettingsService();
            await settingsService.upsertSettings(session.user.id, { timezone });
            return NextResponse.json({ data: { success: true } }, { status: 200 });
        } catch (error: any) {
            return NextResponse.json({ error: { message: error.message } }, { status: 400 });
        }
    })
}
