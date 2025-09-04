import { Request, Response } from 'express';
import { ConnectionModel } from '../models/connection';

export class ConnectionController {
  static async getConnections(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const connections = await ConnectionModel.getConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error('Get connections error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getConnectionStats(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const stats = await ConnectionModel.getConnectionStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Get connection stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createConnection(req: Request, res: Response) {
    try {
      const followerId = req.userId!;
      const { followingId } = req.params;

      if (followerId === followingId) {
        return res.status(400).json({ error: 'Cannot connect with yourself' });
      }

      const connection = await ConnectionModel.create(followerId, followingId);
      res.status(201).json(connection);
    } catch (error) {
      console.error('Create connection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async removeConnection(req: Request, res: Response) {
    try {
      const followerId = req.userId!;
      const { followingId } = req.params;

      await ConnectionModel.removeConnection(followerId, followingId);
      res.status(204).send();
    } catch (error) {
      console.error('Remove connection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getSuggestedConnections(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const suggestions = await ConnectionModel.getSuggestedConnections(userId);
      res.json(suggestions);
    } catch (error) {
      console.error('Get suggested connections error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getConnectionRequests(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const requests = await ConnectionModel.getConnectionRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error('Get connection requests error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async sendConnectionRequest(req: Request, res: Response) {
    try {
      const senderId = req.userId!;
      const { userId: receiverId } = req.params;

      if (senderId === receiverId) {
        return res.status(400).json({ error: 'Cannot send connection request to yourself' });
      }

      const request = await ConnectionModel.createConnectionRequest(senderId, receiverId);
      res.status(201).json(request);
    } catch (error) {
      console.error('Send connection request error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async acceptConnectionRequest(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { requestId } = req.params;

      const connection = await ConnectionModel.acceptConnectionRequest(requestId, userId);
      res.json(connection);
    } catch (error) {
      console.error('Accept connection request error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async rejectConnectionRequest(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { requestId } = req.params;

      await ConnectionModel.rejectConnectionRequest(requestId, userId);
      res.status(204).send();
    } catch (error) {
      console.error('Reject connection request error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
