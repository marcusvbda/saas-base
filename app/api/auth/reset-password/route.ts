import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getValidatedParams } from "@/helpers/common";
import UserService from "@/domain/user/user.service";

const validatorSchema = z.object({
    token: z.string().min(1, "Token is required"),
    newPassword: z.string().min(1, "New password is required"),
})

export async function POST(request: NextRequest) {
    const body = await request.json();
    const result = await getValidatedParams(body, validatorSchema);
    if (!result.success) {
        return NextResponse.json({ error: result.data }, { status: 400 });
    }

    const { token, newPassword } = result.data;

    if (!token || !newPassword) {
        return NextResponse.json(
            { error: { message: "Token and new password are required" } },
            { status: 400 }
        );
    }
    const userService = new UserService();
    const success = await userService.updatePasswordByToken(token, newPassword);
    if (!success) {
        return NextResponse.json(
            { error: { message: "Failed to update password" } },
            { status: 400 }
        );
    }

    return NextResponse.json({ data: { success: true } }, { status: 200 });
}
