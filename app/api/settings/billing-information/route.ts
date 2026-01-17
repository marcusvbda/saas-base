import BillingService from '@/domain/billing/billing.service';
import { requireServerAuth } from '@/lib/better-auth/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
	return requireServerAuth(async ({ session }) => {
		try {
			const billingService = new BillingService();
			const billing = await billingService.getBillingByUserId(session.user.id);
			return NextResponse.json({ data: billing || null }, { status: 200 });
		} catch (error: any) {
			return NextResponse.json(
				{ error: { message: error.message } },
				{ status: 400 },
			);
		}
	});
}

export async function PUT(request: NextRequest) {
	return requireServerAuth(async ({ session }) => {
		try {
			const body = await request.json();
			const {
				cardNumber,
				cardHolderName,
				cardExpiryMonth,
				cardExpiryYear,
				cardCvv,
			} = body;

			if (
				!cardNumber &&
				!cardHolderName &&
				!cardExpiryMonth &&
				!cardExpiryYear &&
				!cardCvv
			) {
				return NextResponse.json(
					{ error: { message: 'At least one field is required' } },
					{ status: 400 },
				);
			}

			const updateData: any = {};
			if (
				cardNumber !== undefined &&
				cardNumber !== null &&
				cardNumber !== ''
			) {
				updateData.card_number = cardNumber;
			}
			if (
				cardHolderName !== undefined &&
				cardHolderName !== null &&
				cardHolderName !== ''
			) {
				updateData.card_holder_name = cardHolderName;
			}
			if (
				cardExpiryMonth !== undefined &&
				cardExpiryMonth !== null &&
				cardExpiryMonth !== ''
			) {
				updateData.card_expiry_month = cardExpiryMonth;
			}
			if (
				cardExpiryYear !== undefined &&
				cardExpiryYear !== null &&
				cardExpiryYear !== ''
			) {
				updateData.card_expiry_year = cardExpiryYear;
			}
			if (cardCvv !== undefined && cardCvv !== null && cardCvv !== '') {
				updateData.card_cvv = cardCvv;
			}

			if (Object.keys(updateData).length === 0) {
				return NextResponse.json(
					{ error: { message: 'At least one valid field is required' } },
					{ status: 400 },
				);
			}

			const billingService = new BillingService();
			await billingService.upsertBilling(session.user.id, updateData);
			return NextResponse.json(
				{ data: { success: true, ...updateData } },
				{ status: 200 },
			);
		} catch (error: any) {
			return NextResponse.json(
				{ error: { message: error.message } },
				{ status: 400 },
			);
		}
	});
}
