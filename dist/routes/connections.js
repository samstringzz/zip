"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const connection_1 = require("../controllers/connection");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_1.authenticateToken);
// Get user's connections
router.get('/', connection_1.ConnectionController.getConnections);
// Get connection statistics
router.get('/stats', connection_1.ConnectionController.getConnectionStats);
// Get suggested connections
router.get('/suggestions', connection_1.ConnectionController.getSuggestedConnections);
// Create a new connection
router.post('/:followingId', connection_1.ConnectionController.createConnection);
// Remove a connection
router.delete('/:followingId', connection_1.ConnectionController.removeConnection);
exports.default = router;
