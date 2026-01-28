import JobsService from '@/domain/jobs/jobs.service';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
	const queue = request.headers.get('x-queue') || 'default';
	const auth = request.headers.get('authorization');
	if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response('Unauthorized', { status: 401 });
	}

	const jobsService = new JobsService();
	const jobs = await jobsService.findPendingJobs(queue);
	for (const job of jobs || []) {
		// action should by like 'settings/settings.service|testAction'
		// payload should be a JSON string like {"userId": "123"}
		await jobsService.processJob(job);
	}

	return NextResponse.json({ message: 'OK' }, { status: 200 });
}
