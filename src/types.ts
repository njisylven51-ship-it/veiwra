export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface Stream {
  id: string;
  title: string;
  description?: string;
  streamerId: string;
  streamerName: string;
  status: 'IDLE' | 'LIVE' | 'ENDED';
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}
