export const getValidatedParams = async (
	params: any,
	validator: any,
): Promise<{ success: boolean; data: any }> => {
	const result = validator.safeParse(params);
	if (!result.success) {
		return {
			success: false,
			data: result.error.flatten().fieldErrors,
		};
	}
	return {
		success: true,
		data: result.data,
	};
};
