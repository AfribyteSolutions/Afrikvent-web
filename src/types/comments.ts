// types/comments.ts
export interface Comment {
    id: string;
    event_id: string;
    user_id: string;
    parent_id: string | null;
    content: string;
    created_at: string;
    user?: {
      email?: string;
    };
    profiles?: { username: string } | null; // 👈 single object
    replies?: Comment[];
  }
  