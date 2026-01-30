const services: Record<string, () => Promise<{ new (): any }>> = {
	IntegrationsService: async () =>
		(await import('@/domain/integrations/integrations.service')).default,
};

export const executeServiceAction = async (
	service: string,
	action: string,
	payload: any,
) => {
	const serviceLoader = services[service];
	if (!serviceLoader) return null;

	const ServiceClass = await serviceLoader();
	const serviceInstance = new ServiceClass();

	if (typeof serviceInstance[action] !== 'function') {
		return null;
	}

	const result = await serviceInstance[action](payload);
	return result;
};
