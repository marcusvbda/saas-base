import Repository from '@/services/db/repository';

export default class UserRepository extends Repository {
	async findById(id: string) {
		return await this.findOne('SELECT * FROM `user` WHERE id = :id', { id });
	}

	async findByEmail(email: string) {
		return await this.findOne('SELECT * FROM `user` WHERE email = :email', {
			email,
		});
	}

	async updatePassword(userId: string, hashedPassword: string) {
		await this.execute(
			"UPDATE `account` SET `password` = :password, `updatedAt` = CURRENT_TIMESTAMP(3) WHERE `userId` = :userId AND `providerId` = 'credential'",
			{ password: hashedPassword, userId },
		);
	}

	async createUserVerification(userId: string, token: string) {
		await this.execute(
			'INSERT INTO `verification` (`id`, `identifier`, `value`, `expiresAt`) VALUES (UUID(), :identifier, :value, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
			{
				identifier: `reset-password:${userId}`,
				value: token,
			},
		);
	}

	async findPasswordVerificationToken(token: string) {
		return await this.findOne(
			'SELECT * FROM `verification` WHERE `value` = :token AND `expiresAt` > NOW()',
			{ token },
		);
	}

	async deletePasswordVerificationToken(token: string) {
		await this.execute('DELETE FROM `verification` WHERE `value` = :token', {
			token,
		});
	}

	async verifyUserById(userId: string) {
		await this.execute(
			'UPDATE `user` SET `emailVerified` = TRUE WHERE `id` = :userId',
			{ userId },
		);
	}

	async updateUserData(userId: string, data: { name?: string }) {
		if (!data.name) {
			return;
		}
		await this.execute(
			'UPDATE `user` SET `name` = :name WHERE `id` = :userId',
			{ name: data.name, userId },
		);
	}
}
