import SettingsService from "@/domain/settings/settings.service";
import { requireServerAuth } from "@/lib/better-auth/server";
import { NextResponse } from "next/server";

export async function GET() {
    return requireServerAuth(async ({ session }) => {
        try {
            const settingsService = new SettingsService();
            const userSettings = await settingsService.getSettingsByUserId(session.user.id);
            return NextResponse.json({ data: { ...userSettings } }, { status: 200 });
        } catch (error: any) {
            return NextResponse.json({ error: { message: error.message } }, { status: 400 });
        }
    })
}
