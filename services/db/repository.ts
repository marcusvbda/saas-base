import { database } from '@/services/db/connection';

export default class Repository {
	constructor(protected db: any = database) {
		//
	}
}
