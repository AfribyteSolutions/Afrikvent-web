// lib/agora/types.ts
export interface AgoraTokenResponse {
    token: string;
    channel: string;
    uid: string;
    expiresAt: number;
  }
  
  export interface StreamTokenRequest {
    eventId: number;
    ticketCode?: string;
    role: 'publisher' | 'subscriber';
  }
  
  export interface StartStreamRequest {
    eventId: number;
  }
  
  export interface EndStreamRequest {
    eventId: number;
    streamId: number;
  }
  
  export interface LiveStream {
    id: number;
    event_id: number;
    channel_name: string;
    status: 'scheduled' | 'live' | 'ended';
    started_at: string | null;
    ended_at: string | null;
    organizer_id: string;
    viewer_count: number;
    created_at: string;
    updated_at: string;
  }
  
  export type RtcRole = 1 | 2; // 1 = Publisher (host), 2 = Subscriber (audience)
  
  export const RTC_ROLE = {
    PUBLISHER: 1 as RtcRole,
    SUBSCRIBER: 2 as RtcRole,
  };