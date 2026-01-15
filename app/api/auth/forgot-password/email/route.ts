import { NextRequest, NextResponse } from "next/server";
import UserService from "@/domain/user/user.service";
import { getValidatedParams } from "@/helpers/common";
import { z } from "zod";

const validatorSchema = z.object({
    email: z.string().email("Email inválido"),
})

export async function POST(request: NextRequest) {
    const body = await request.json();
    const result = await getValidatedParams(body, validatorSchema);
    if (!result.success) {
        return NextResponse.json({ error: result.data }, { status: 400 });
    }

    const { email } = result.data;
    const userService = new UserService();
    await userService.sendPasswordResetEmail(email);
    return NextResponse.json({ data: { success: true } });
}
