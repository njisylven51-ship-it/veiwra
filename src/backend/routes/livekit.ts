import express, { Response } from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

router.post('/token', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { streamId } = req.body;
    if (!streamId) {
      res.status(400).json({ error: 'streamId is required' });
      return;
    }

    const username = req.user!.username;
    const userId = req.user!.userId;

    // Fetch the stream to determine publish permissions
    const stream = await db.getStreamById(streamId);
    if (!stream) {
      res.status(404).json({ error: 'Stream not found' });
      return;
    }

    const isStreamer = stream.streamerId === userId;

    // Check if LiveKit credentials exist
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      console.warn('LiveKit cloud credentials missing. Running in simulated fallback mode.');
      res.json({
        token: 'mock_token_' + Math.random().toString(36).substring(2, 11),
        serverUrl: 'ws://mock-livekit-url',
        isMock: true,
        isStreamer,
        username,
        streamId
      });
      return;
    }

    // Generate real LiveKit token
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: username,
      name: username,
      ttl: '10m', // Token expires in 10 minutes
    });

    token.addGrant({
      roomJoin: true,
      room: streamId,
      canPublish: isStreamer,
      canPublishData: true,
      canSubscribe: true,
    });

    const jwtToken = await token.toJwt();

    res.json({
      token: jwtToken,
      serverUrl: LIVEKIT_URL,
      isMock: false,
      isStreamer,
      username,
      streamId
    });
  } catch (err: any) {
    console.error('Error generating LiveKit token:', err);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

export default router;
