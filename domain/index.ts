const services: Record<string, () => Promise<{ new (): unknown }>> = {
	IntegrationsService: async () =>
		(await import('@/domain/integrations/integrations.service')).default,
};

export const executeServiceAction = async (
	service: string,
	action: string,
	payload: unknown,
): Promise<unknown> => {
	const loader = services[service];
	if (!loader) return null;

	const ServiceClass = await loader();
	const serviceInstance = new ServiceClass();

	if (
		typeof (serviceInstance as Record<string, unknown>)[action] !== 'function'
	) {
		return null;
	}

	const result = await (
		serviceInstance as Record<string, (p: unknown) => Promise<unknown>>
	)[action](payload);
	return result;
};
