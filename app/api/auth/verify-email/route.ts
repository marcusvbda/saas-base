import UserService from "@/domain/user/user.service";
import { getValidatedParams } from "@/helpers/common";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const validatorSchema = z.object({
    token: z.string().min(1, "Token is required"),
})

export async function GET(request: NextRequest) {
    const tokenParam = request.nextUrl.searchParams.get("token") || "";
    const result: any = await getValidatedParams({ token: tokenParam }, validatorSchema);
    if (!result.success) {
        throw new Error(result.error.message);
    }
    const { token } = result.data;
    const userService = new UserService();
    await userService.verifyEmailByToken(token);
    return NextResponse.redirect(new URL("/sign-in", request.url));
}
