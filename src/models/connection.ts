import pool from '../config/database';
import { Connection, ConnectionRequest } from '../types/connection';

export class ConnectionModel {
  static async create(followerId: string, followingId: string): Promise<Connection> {
    const result = await pool.query(
      `INSERT INTO relationships (follower_id, following_id)
       VALUES ($1, $2)
       RETURNING *`,
      [followerId, followingId]
    );
    return result.rows[0];
  }

  static async getConnections(userId: string): Promise<Connection[]> {
    const result = await pool.query(
      `SELECT r.*, 
              u.id as "following.id",
              u.username as "following.username",
              u.email as "following.email",
              u.created_at as "following.created_at"
       FROM relationships r
       JOIN users u ON u.id = r.following_id
       WHERE r.follower_id = $1`,
      [userId]
    );
    return result.rows.map(this.mapConnectionWithUser);
  }

  static async getConnectionStats(userId: string) {
    const result = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM relationships WHERE follower_id = $1) as following_count,
        (SELECT COUNT(*) FROM relationships WHERE following_id = $1) as followers_count`,
      [userId]
    );
    return result.rows[0];
  }

  static async removeConnection(followerId: string, followingId: string): Promise<void> {
    await pool.query(
      'DELETE FROM relationships WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );
  }

  static async getSuggestedConnections(userId: string, limit = 5) {
    const result = await pool.query(
      `SELECT u.* FROM users u
       WHERE u.id != $1
       AND u.id NOT IN (
         SELECT following_id FROM relationships WHERE follower_id = $1
       )
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  private static mapConnectionWithUser(row: any): Connection {
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

  static async getConnectionRequests(userId: string): Promise<ConnectionRequest[]> {
    const result = await pool.query(
      `SELECT cr.*, 
              u.id as "sender.id",
              u.username as "sender.username",
              u.email as "sender.email",
              u.created_at as "sender.created_at"
       FROM connection_requests cr
       JOIN users u ON u.id = cr.sender_id
       WHERE cr.receiver_id = $1 AND cr.status = 'pending'`,
      [userId]
    );
    return result.rows.map(this.mapConnectionRequest);
  }

  static async createConnectionRequest(senderId: string, receiverId: string): Promise<ConnectionRequest> {
    const result = await pool.query(
      `INSERT INTO connection_requests (sender_id, receiver_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [senderId, receiverId]
    );
    return result.rows[0];
  }

  static async acceptConnectionRequest(requestId: string, userId: string): Promise<Connection> {
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update request status
      const requestResult = await client.query(
        `UPDATE connection_requests 
         SET status = 'accepted'
         WHERE id = $1 AND receiver_id = $2 AND status = 'pending'
         RETURNING *`,
        [requestId, userId]
      );

      if (requestResult.rows.length === 0) {
        throw new Error('Connection request not found or already processed');
      }

      const request = requestResult.rows[0];

      // Create the connection
      const connectionResult = await client.query(
        `INSERT INTO relationships (follower_id, following_id)
         VALUES ($1, $2)
         RETURNING *`,
        [request.sender_id, request.receiver_id]
      );

      await client.query('COMMIT');
      return connectionResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async rejectConnectionRequest(requestId: string, userId: string): Promise<void> {
    const result = await pool.query(
      `UPDATE connection_requests 
       SET status = 'rejected'
       WHERE id = $1 AND receiver_id = $2 AND status = 'pending'`,
      [requestId, userId]
    );

    if (result.rowCount === 0) {
      throw new Error('Connection request not found or already processed');
    }
  }

  private static mapConnectionRequest(row: any): ConnectionRequest {
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
