"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionModel = void 0;
const database_1 = __importDefault(require("../config/database"));
class ConnectionModel {
    static create(followerId, followingId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield database_1.default.query(`INSERT INTO relationships (follower_id, following_id)
       VALUES ($1, $2)
       RETURNING *`, [followerId, followingId]);
            return result.rows[0];
        });
    }
    static getConnections(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield database_1.default.query(`SELECT r.*, 
              u.id as "following.id",
              u.username as "following.username",
              u.email as "following.email",
              u.created_at as "following.created_at"
       FROM relationships r
       JOIN users u ON u.id = r.following_id
       WHERE r.follower_id = $1`, [userId]);
            return result.rows.map(this.mapConnectionWithUser);
        });
    }
    static getConnectionStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield database_1.default.query(`SELECT 
        (SELECT COUNT(*) FROM relationships WHERE follower_id = $1) as following_count,
        (SELECT COUNT(*) FROM relationships WHERE following_id = $1) as followers_count`, [userId]);
            return result.rows[0];
        });
    }
    static removeConnection(followerId, followingId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield database_1.default.query('DELETE FROM relationships WHERE follower_id = $1 AND following_id = $2', [followerId, followingId]);
        });
    }
    static getSuggestedConnections(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, limit = 5) {
            const result = yield database_1.default.query(`SELECT u.* FROM users u
       WHERE u.id != $1
       AND u.id NOT IN (
         SELECT following_id FROM relationships WHERE follower_id = $1
       )
       LIMIT $2`, [userId, limit]);
            return result.rows;
        });
    }
    static mapConnectionWithUser(row) {
        return {
            id: row.id,
            follower_id: row.follower_id,
            following_id: row.following_id,
            created_at: row.created_at,
            following: row['following.id'] ? {
                id: row['following.id'],
                username: row['following.username'],
                email: row['following.email'],
                created_at: row['following.created_at']
            } : undefined
        };
    }
}
exports.ConnectionModel = ConnectionModel;
