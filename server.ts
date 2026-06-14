import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRouter from './src/backend/routes/auth';
import streamsRouter from './src/backend/routes/streams';
import livekitRouter from './src/backend/routes/livekit';
import { db } from './src/backend/db';

async function bootstrap() {
  const app = express();
  const server = http.createServer(app);

  // Setup Socket.IO with CORS support
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  const PORT = 3000;

  // Use JSON & CORS middlewares
  app.use(cors());
  app.use(express.json());

  // Log requests in dev environment
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // REST API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/streams', streamsRouter);
  app.use('/api/livekit', livekitRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', env: process.env.NODE_ENV || 'development' });
  });

  // Socket.IO Connection and Room logic
  // roomViewers maps streamId -> Set of socket.id values
  const roomViewers = new Map<string, Set<string>>();

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Track user identity inside socket payload
    let currentStreamId: string | null = null;
    let currentUsername: string | null = null;
    let currentUserId: string | null = null;

    // Join room event
    socket.on('join_room', async ({ streamId, username, userId }) => {
      if (!streamId || !username || !userId) return;

      currentStreamId = streamId;
      currentUsername = username;
      currentUserId = userId;

      socket.join(streamId);
      console.log(`User ${username} (${userId}) joined room ${streamId}`);

      // Track inside active viewer mappings
      if (!roomViewers.has(streamId)) {
        roomViewers.set(streamId, new Set());
      }
      roomViewers.get(streamId)!.add(socket.id);

      const viewerCount = roomViewers.get(streamId)!.size;

      // Notify clients in the room of viewer count updates
      io.to(streamId).emit('viewer_count_update', { viewerCount });

      // Notify other clients about user joining
      io.to(streamId).emit('chat_message', {
        id: 'sys_' + Math.random().toString(36).substring(2, 11),
        streamId,
        userId: 'system',
        username: 'System',
        content: `${username} joined the stream chat`,
        createdAt: new Date().toISOString()
      });

      // Send chat history to the newly connected user
      try {
        const history = await db.getStreamMessages(streamId);
        socket.emit('chat_history', history);
      } catch (err) {
        console.error('Failed to grab chat history:', err);
      }
    });

    // Send message event
    socket.on('send_message', async ({ streamId, userId, content }) => {
      if (!streamId || !userId || !content) return;
      try {
        const savedMsg = await db.addMessage(streamId, userId, content.slice(0, 300));
        io.to(streamId).emit('chat_message', savedMsg);
      } catch (err) {
        console.error('Failed to post live chat:', err);
      }
    });

    // Stream status update event
    socket.on('stream_status_update', ({ streamId, status }) => {
      if (!streamId || !status) return;
      console.log(`Stream ${streamId} status update received state: ${status}`);
      io.to(streamId).emit('stream_status_broadcast', { status });
    });

    // Leave room event
    socket.on('leave_room', () => {
      if (currentStreamId && currentUsername) {
        const streamId = currentStreamId;
        const username = currentUsername;

        socket.leave(streamId);
        console.log(`User ${username} left room ${streamId}`);

        if (roomViewers.has(streamId)) {
          roomViewers.get(streamId)!.delete(socket.id);
          if (roomViewers.get(streamId)!.size === 0) {
            roomViewers.delete(streamId);
          }
        }

        const count = roomViewers.has(streamId) ? roomViewers.get(streamId)!.size : 0;
        io.to(streamId).emit('viewer_count_update', { viewerCount: count });

        io.to(streamId).emit('chat_message', {
          id: 'sys_' + Math.random().toString(36).substring(2, 11),
          streamId,
          userId: 'system',
          username: 'System',
          content: `${username} left the stream`,
          createdAt: new Date().toISOString()
        });

        currentStreamId = null;
        currentUsername = null;
        currentUserId = null;
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (currentStreamId && currentUsername) {
        const streamId = currentStreamId;
        const username = currentUsername;

        if (roomViewers.has(streamId)) {
          roomViewers.get(streamId)!.delete(socket.id);
          if (roomViewers.get(streamId)!.size === 0) {
            roomViewers.delete(streamId);
          }
        }

        const count = roomViewers.has(streamId) ? roomViewers.get(streamId)!.size : 0;
        io.to(streamId).emit('viewer_count_update', { viewerCount: count });

        io.to(streamId).emit('chat_message', {
          id: 'sys_' + Math.random().toString(36).substring(2, 11),
          streamId,
          userId: 'system',
          username: 'System',
          content: `${username} disconnected`,
          createdAt: new Date().toISOString()
        });
      }
    });
  });

  // Serve Frontend Assets with Vite integration in Development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Server strategy: Running with Vite Dev Middleware.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Server strategy: Static hosting of compiled dist folder.');
  }

  // Bind and listen explicitly on host 0.0.0.0
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Viewra full-stack platform listening on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrapping error:', err);
});
