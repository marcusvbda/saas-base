import { database } from "@/lib/db/connection";

export default class UserRepository {
    constructor(private db: any = database) {
        // 
    }

    async findById(id: string) {
        const [rows] = await this.db.execute("SELECT * FROM `user` WHERE id = :id", { id });
        return rows[0] || null;
    }

    async findByEmail(email: string) {
        const [rows] = await this.db.execute("SELECT * FROM `user` WHERE email = :email", { email });
        return rows[0] || null;
    }

    async updatePassword(userId: string, hashedPassword: string) {
        await this.db.execute(
            "UPDATE `account` SET `password` = :password, `updatedAt` = CURRENT_TIMESTAMP(3) WHERE `userId` = :userId AND `providerId` = 'credential'",
            { password: hashedPassword, userId }
        );
    }

    async createUserVerification(userId: string, token: string) {
        await this.db.execute(
            "INSERT INTO `verification` (`id`, `identifier`, `value`, `expiresAt`) VALUES (UUID(), :identifier, :value, DATE_ADD(NOW(), INTERVAL 1 HOUR))",
            {
                identifier: `reset-password:${userId}`,
                value: token,
            }
        );
    }

    async findPasswordVerificationToken(token: string) {
        const [rows] = await this.db.execute("SELECT * FROM `verification` WHERE `value` = :token AND `expiresAt` > NOW()", { token });
        return rows[0] || null;
    }

    async deletePasswordVerificationToken(token: string) {
        await this.db.execute("DELETE FROM `verification` WHERE `value` = :token", { token });
    }

    async verifyUserById(userId: string) {
        await this.db.execute("UPDATE `user` SET `emailVerified` = TRUE WHERE `id` = :userId", { userId });
    }

    async updateUserData(userId: string, data: any) {
        await this.db.execute("UPDATE `user` SET `name` = :name WHERE `id` = :userId", { ...data, userId });
    }
}