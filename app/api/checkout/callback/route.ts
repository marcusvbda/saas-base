import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const sessinId = searchParams.get('session_id');

	return NextResponse.json({ sessinId });
}
