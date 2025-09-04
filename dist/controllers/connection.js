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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionController = void 0;
const connection_1 = require("../models/connection");
class ConnectionController {
    static getConnections(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const connections = yield connection_1.ConnectionModel.getConnections(userId);
                res.json(connections);
            }
            catch (error) {
                console.error('Get connections error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static getConnectionStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const stats = yield connection_1.ConnectionModel.getConnectionStats(userId);
                res.json(stats);
            }
            catch (error) {
                console.error('Get connection stats error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static createConnection(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const followerId = req.userId;
                const { followingId } = req.params;
                if (followerId === followingId) {
                    return res.status(400).json({ error: 'Cannot connect with yourself' });
                }
                const connection = yield connection_1.ConnectionModel.create(followerId, followingId);
                res.status(201).json(connection);
            }
            catch (error) {
                console.error('Create connection error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static removeConnection(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const followerId = req.userId;
                const { followingId } = req.params;
                yield connection_1.ConnectionModel.removeConnection(followerId, followingId);
                res.status(204).send();
            }
            catch (error) {
                console.error('Remove connection error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static getSuggestedConnections(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const suggestions = yield connection_1.ConnectionModel.getSuggestedConnections(userId);
                res.json(suggestions);
            }
            catch (error) {
                console.error('Get suggested connections error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static getConnectionRequests(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const requests = yield connection_1.ConnectionModel.getConnectionRequests(userId);
                res.json(requests);
            }
            catch (error) {
                console.error('Get connection requests error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static sendConnectionRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const senderId = req.userId;
                const { userId: receiverId } = req.params;
                if (senderId === receiverId) {
                    return res.status(400).json({ error: 'Cannot send connection request to yourself' });
                }
                const request = yield connection_1.ConnectionModel.createConnectionRequest(senderId, receiverId);
                res.status(201).json(request);
            }
            catch (error) {
                console.error('Send connection request error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static acceptConnectionRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const { requestId } = req.params;
                const connection = yield connection_1.ConnectionModel.acceptConnectionRequest(requestId, userId);
                res.json(connection);
            }
            catch (error) {
                console.error('Accept connection request error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static rejectConnectionRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const { requestId } = req.params;
                yield connection_1.ConnectionModel.rejectConnectionRequest(requestId, userId);
                res.status(204).send();
            }
            catch (error) {
                console.error('Reject connection request error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
}
exports.ConnectionController = ConnectionController;
