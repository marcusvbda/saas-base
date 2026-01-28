import dotenv from 'dotenv';
dotenv.config();

async function run() {
	const secret = process.env.CRON_SECRET;
	await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/queue-jobs`, {
		headers: {
			Authorization: `Bearer ${secret}`,
		},
	});
}

run();
setInterval(() => {
	run();
}, 10000);
