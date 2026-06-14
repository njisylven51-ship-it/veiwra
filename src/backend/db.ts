import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const usePrisma = !!process.env.DATABASE_URL;

let prisma: PrismaClient | null = null;
if (usePrisma) {
  try {
    prisma = new PrismaClient();
    console.log('Database strategy: Prisma Client initialized.');
  } catch (err) {
    console.warn('Failed to initialize Prisma Client, falling back to local storage:', err);
    prisma = null;
  }
} else {
  console.log('Database strategy: Local file-based JSON storage (No DATABASE_URL supplied).');
}

const LOCAL_DB_PATH = path.join(process.cwd(), 'local_db.json');

interface LocalDB {
  users: any[];
  streams: any[];
  messages: any[];
}

function readLocalDB(): LocalDB {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const initial = { users: [], streams: [], messages: [] };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const content = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return { users: [], streams: [], messages: [] };
  }
}

function writeLocalDB(data: LocalDB) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to write local JSON DB:', err);
  }
}

export const db = {
  async findUserById(id: string) {
    if (prisma) {
      try {
        return await prisma.user.findUnique({ where: { id } });
      } catch (err) {
        console.error('Prisma query error (findUserById):', err);
      }
    }
    const data = readLocalDB();
    return data.users.find(u => u.id === id) || null;
  },

  async findUserByUsername(username: string) {
    if (prisma) {
      try {
        return await prisma.user.findUnique({ where: { username } });
      } catch (err) {
        console.error('Prisma query error (findUserByUsername):', err);
      }
    }
    const data = readLocalDB();
    return data.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  },

  async findUserByEmail(email: string) {
    if (prisma) {
      try {
        return await prisma.user.findUnique({ where: { email } });
      } catch (err) {
        console.error('Prisma query error (findUserByEmail):', err);
      }
    }
    const data = readLocalDB();
    return data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async createUser(dataInput: { username: string; email: string; passwordHash: string }) {
    if (prisma) {
      try {
        return await prisma.user.create({
          data: {
            username: dataInput.username,
            email: dataInput.email,
            password: dataInput.passwordHash,
          }
        });
      } catch (err) {
        console.error('Prisma query error (createUser), falling back to local:', err);
      }
    }
    const data = readLocalDB();
    const newUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 11),
      username: dataInput.username,
      email: dataInput.email,
      password: dataInput.passwordHash,
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    writeLocalDB(data);
    return newUser;
  },

  async createStream(dataInput: { title: string; description?: string; streamerId: string }) {
    if (prisma) {
      try {
        await prisma.stream.updateMany({
          where: { streamerId: dataInput.streamerId, status: { in: ['IDLE', 'LIVE'] } },
          data: { status: 'ENDED' }
        });
        return await prisma.stream.create({
          data: {
            title: dataInput.title,
            description: dataInput.description,
            streamerId: dataInput.streamerId,
            status: 'IDLE',
          }
        });
      } catch (err) {
        console.error('Prisma query error (createStream), falling back to local:', err);
      }
    }
    const data = readLocalDB();
    data.streams = data.streams.map(s => {
      if (s.streamerId === dataInput.streamerId && (s.status === 'LIVE' || s.status === 'IDLE')) {
        return { ...s, status: 'ENDED', updatedAt: new Date().toISOString() };
      }
      return s;
    });

    const newStream = {
      id: 'stream_' + Math.random().toString(36).substring(2, 11),
      title: dataInput.title,
      description: dataInput.description || '',
      streamerId: dataInput.streamerId,
      status: 'IDLE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.streams.push(newStream);
    writeLocalDB(data);
    return newStream;
  },

  async getAllLiveStreams() {
    if (prisma) {
      try {
        const streams = await prisma.stream.findMany({
          where: { status: 'LIVE' },
          include: { streamer: true },
          orderBy: { createdAt: 'desc' }
        });
        return streams.map(s => ({
          id: s.id,
          title: s.title,
          description: s.description || '',
          streamerId: s.streamerId,
          streamerName: s.streamer.username,
          status: s.status,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }));
      } catch (err) {
        console.error('Prisma query error (getAllLiveStreams), falling back to local:', err);
      }
    }
    const data = readLocalDB();
    const liveStreams = data.streams.filter(s => s.status === 'LIVE');
    return liveStreams.map(s => {
      const u = data.users.find(user => user.id === s.streamerId);
      return {
        id: s.id,
        title: s.title,
        description: s.description || '',
        streamerId: s.streamerId,
        streamerName: u ? u.username : 'Unknown Streamer',
        status: s.status,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    });
  },

  async getStreamById(id: string) {
    if (prisma) {
      try {
        const s = await prisma.stream.findUnique({
          where: { id },
          include: { streamer: true }
        });
        if (!s) return null;
        return {
          id: s.id,
          title: s.title,
          description: s.description || '',
          streamerId: s.streamerId,
          streamerName: s.streamer.username,
          status: s.status,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        };
      } catch (err) {
        console.error('Prisma query error (getStreamById), falling back to local:', err);
      }
    }
    const data = readLocalDB();
    const s = data.streams.find(stream => stream.id === id);
    if (!s) return null;
    const u = data.users.find(user => user.id === s.streamerId);
    return {
      id: s.id,
      title: s.title,
      description: s.description || '',
      streamerId: s.streamerId,
      streamerName: u ? u.username : 'Unknown Streamer',
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  },

  async startStream(id: string, streamerId: string) {
    if (prisma) {
      try {
        const existing = await prisma.stream.findUnique({ where: { id } });
        if (!existing || existing.streamerId !== streamerId) {
          throw new Error('Not authorized or stream not found');
        }
        return await prisma.stream.update({
          where: { id },
          data: { status: 'LIVE', updatedAt: new Date() }
        });
      } catch (err) {
        console.error('Prisma query error (startStream), falling back to local:', err);
      }
    }
    const data = readLocalDB();
    const idx = data.streams.findIndex(s => s.id === id);
    if (idx === -1 || data.streams[idx].streamerId !== streamerId) {
      throw new Error('Not authorized or stream not found');
    }
    data.streams[idx].status = 'LIVE';
    data.streams[idx].updatedAt = new Date().toISOString();
    writeLocalDB(data);
    return data.streams[idx];
  },

  async endStream(id: string, streamerId: string) {
    if (prisma) {
      try {
        const existing = await prisma.stream.findUnique({ where: { id } });
        if (!existing || existing.streamerId !== streamerId) {
          throw new Error('Not authorized or stream not found');
        }
        return await prisma.stream.update({
          where: { id },
          data: { status: 'ENDED', updatedAt: new Date() }
        });
      } catch (err) {
        console.error('Prisma query error (endStream), falling back to local:', err);
      }
    }
    const data = readLocalDB();
    const idx = data.streams.findIndex(s => s.id === id);
    if (idx === -1 || data.streams[idx].streamerId !== streamerId) {
      throw new Error('Not authorized or stream not found');
    }
    data.streams[idx].status = 'ENDED';
    data.streams[idx].updatedAt = new Date().toISOString();
    writeLocalDB(data);
    return data.streams[idx];
  },

  async getStreamMessages(streamId: string) {
    if (prisma) {
      try {
        const msgs = await prisma.message.findMany({
          where: { streamId },
          include: { user: true },
          orderBy: { createdAt: 'asc' }
        });
        return msgs.map(m => ({
          id: m.id,
          streamId: m.streamId,
          userId: m.userId,
          username: m.user.username,
          content: m.content,
          createdAt: m.createdAt,
        }));
      } catch (err) {
        console.error('Prisma query error (getStreamMessages), falling back to local:', err);
      }
    }
    const data = readLocalDB();
    const msgs = data.messages.filter(m => m.streamId === streamId);
    return msgs.map(m => {
      const u = data.users.find(user => user.id === m.userId);
      return {
        id: m.id,
        streamId: m.streamId,
        userId: m.userId,
        username: u ? u.username : 'Guest',
        content: m.content,
        createdAt: m.createdAt,
      };
    });
  },

  async addMessage(streamId: string, userId: string, content: string) {
    if (prisma) {
      try {
        const m = await prisma.message.create({
          data: {
            streamId,
            userId,
            content
          },
          include: { user: true }
        });
        return {
          id: m.id,
          streamId: m.streamId,
          userId: m.userId,
          username: m.user.username,
          content: m.content,
          createdAt: m.createdAt,
        };
      } catch (err) {
        console.error('Prisma query error (addMessage), falling back to local:', err);
      }
    }
    const data = readLocalDB();
    const u = data.users.find(user => user.id === userId);
    const newMsg = {
      id: 'msg_' + Math.random().toString(36).substring(2, 11),
      streamId,
      userId,
      content,
      createdAt: new Date().toISOString()
    };
    data.messages.push(newMsg);
    writeLocalDB(data);
    return {
      id: newMsg.id,
      streamId: newMsg.streamId,
      userId: newMsg.userId,
      username: u ? u.username : 'Guest',
      content: newMsg.content,
      createdAt: newMsg.createdAt,
    };
  }
};
