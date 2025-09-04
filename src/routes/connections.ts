import express from 'express';
import { ConnectionController } from '../controllers/connection';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get user's connections
router.get('/', ConnectionController.getConnections);

// Get connection statistics
router.get('/stats', ConnectionController.getConnectionStats);

// Get suggested connections
router.get('/suggestions', ConnectionController.getSuggestedConnections);

// Get connection requests
router.get('/requests', ConnectionController.getConnectionRequests);

// Send connection request
router.post('/requests/:userId', ConnectionController.sendConnectionRequest);

// Accept connection request
router.post('/requests/:requestId/accept', ConnectionController.acceptConnectionRequest);

// Reject connection request
router.post('/requests/:requestId/reject', ConnectionController.rejectConnectionRequest);

// Create a new connection
router.post('/:followingId', ConnectionController.createConnection);

// Remove a connection
router.delete('/:followingId', ConnectionController.removeConnection);

export default router;
