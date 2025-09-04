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
    static getConnectionRequests(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield database_1.default.query(`SELECT cr.*, 
              u.id as "sender.id",
              u.username as "sender.username",
              u.email as "sender.email",
              u.created_at as "sender.created_at"
       FROM connection_requests cr
       JOIN users u ON u.id = cr.sender_id
       WHERE cr.receiver_id = $1 AND cr.status = 'pending'`, [userId]);
            return result.rows.map(this.mapConnectionRequest);
        });
    }
    static createConnectionRequest(senderId, receiverId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield database_1.default.query(`INSERT INTO connection_requests (sender_id, receiver_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`, [senderId, receiverId]);
            return result.rows[0];
        });
    }
    static acceptConnectionRequest(requestId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Start a transaction
            const client = yield database_1.default.connect();
            try {
                yield client.query('BEGIN');
                // Update request status
                const requestResult = yield client.query(`UPDATE connection_requests 
         SET status = 'accepted'
         WHERE id = $1 AND receiver_id = $2 AND status = 'pending'
         RETURNING *`, [requestId, userId]);
                if (requestResult.rows.length === 0) {
                    throw new Error('Connection request not found or already processed');
                }
                const request = requestResult.rows[0];
                // Create the connection
                const connectionResult = yield client.query(`INSERT INTO relationships (follower_id, following_id)
         VALUES ($1, $2)
         RETURNING *`, [request.sender_id, request.receiver_id]);
                yield client.query('COMMIT');
                return connectionResult.rows[0];
            }
            catch (error) {
                yield client.query('ROLLBACK');
                throw error;
            }
            finally {
                client.release();
            }
        });
    }
    static rejectConnectionRequest(requestId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield database_1.default.query(`UPDATE connection_requests 
       SET status = 'rejected'
       WHERE id = $1 AND receiver_id = $2 AND status = 'pending'`, [requestId, userId]);
            if (result.rowCount === 0) {
                throw new Error('Connection request not found or already processed');
            }
        });
    }
    static mapConnectionRequest(row) {
        return {
            id: row.id,
            sender_id: row.sender_id,
            receiver_id: row.receiver_id,
            status: row.status,
            created_at: row.created_at,
            sender: row['sender.id'] ? {
                id: row['sender.id'],
                username: row['sender.username'],
                email: row['sender.email'],
                created_at: row['sender.created_at']
            } : undefined
        };
    }
}
exports.ConnectionModel = ConnectionModel;
