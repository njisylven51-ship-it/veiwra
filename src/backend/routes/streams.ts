import express, { Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

const createStreamSchema = z.object({
  title: z.string()
    .min(3, { message: 'Title must be at least 3 characters' })
    .max(100, { message: 'Title cannot exceed 100 characters' }),
  description: z.string()
    .max(500, { message: 'Description cannot exceed 500 characters' })
    .optional()
});

// GET /api/streams - list all LIVE streams
router.get('/', async (req, res: Response) => {
  try {
    const liveStreams = await db.getAllLiveStreams();
    res.json(liveStreams);
  } catch (err) {
    console.error('Error fetching live streams:', err);
    res.status(500).json({ error: 'Failed to retrieve live streams' });
  }
});

// POST /api/streams - create a brand new stream
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = createStreamSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const { title, description } = parseResult.data;
    const streamerId = req.user!.userId;

    const stream = await db.createStream({
      title,
      description,
      streamerId
    });

    res.status(201).json({
      message: 'Stream created successfully',
      stream
    });
  } catch (err: any) {
    console.error('Error creating stream:', err);
    res.status(500).json({ error: 'Failed to create stream' });
  }
});

// GET /api/streams/:id - fetch specific stream
router.get('/:id', async (req, res: Response) => {
  try {
    const stream = await db.getStreamById(req.params.id);
    if (!stream) {
      res.status(404).json({ error: 'Stream not found' });
      return;
    }
    res.json(stream);
  } catch (err) {
    console.error('Error fetching stream details:', err);
    res.status(500).json({ error: 'Failed to fetch stream details' });
  }
});

// PATCH /api/streams/:id/start - set stream status to LIVE
router.patch('/:id/start', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const streamId = req.params.id;
    const streamerId = req.user!.userId;

    // Verify stream exists and belongs to streamer
    const stream = await db.getStreamById(streamId);
    if (!stream) {
      res.status(404).json({ error: 'Stream not found' });
      return;
    }
    if (stream.streamerId !== streamerId) {
      res.status(403).json({ error: 'You are not authorized to start this stream' });
      return;
    }

    const updatedStream = await db.startStream(streamId, streamerId);
    res.json({
      message: 'Stream is now LIVE',
      stream: updatedStream
    });
  } catch (err: any) {
    console.error('Error starting stream:', err);
    res.status(500).json({ error: err.message || 'Failed to start stream' });
  }
});

// PATCH /api/streams/:id/end - set stream status to ENDED
router.patch('/:id/end', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const streamId = req.params.id;
    const streamerId = req.user!.userId;

    // Verify stream exists and belongs to streamer
    const stream = await db.getStreamById(streamId);
    if (!stream) {
      res.status(404).json({ error: 'Stream not found' });
      return;
    }
    if (stream.streamerId !== streamerId) {
      res.status(403).json({ error: 'You are not authorized to end this stream' });
      return;
    }

    const updatedStream = await db.endStream(streamId, streamerId);
    res.json({
      message: 'Stream has been ENDED',
      stream: updatedStream
    });
  } catch (err: any) {
    console.error('Error ending stream:', err);
    res.status(500).json({ error: err.message || 'Failed to end stream' });
  }
});

export default router;
