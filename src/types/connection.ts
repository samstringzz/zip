export interface Connection {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: Date;
  following?: {
    id: string;
    username: string;
    email: string;
    created_at: Date;
  };
}

export interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: Date;
  sender?: {
    id: string;
    username: string;
    email: string;
    created_at: Date;
  };
}
