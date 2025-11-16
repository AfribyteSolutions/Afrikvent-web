// lib/agora/tokenGenerator.ts
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE!;

export function generateRtcToken(
  channelName: string,
  uid: string,
  role: number,
  expirationTimeInSeconds: number = 3600
): string {
  if (!APP_ID || !APP_CERTIFICATE) {
    throw new Error('Agora credentials are not configured');
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // Convert string uid to number - Agora needs a numeric UID
  const numericUid = parseInt(uid.replace(/\D/g, '').slice(-9)) || 0;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    numericUid, // Pass as number, not parseInt(uid)
    role,
    privilegeExpiredTs
  );

  return token;
}

export function generateChannelName(eventId: number): string {
  return `event_${eventId}_${Date.now()}`;
}