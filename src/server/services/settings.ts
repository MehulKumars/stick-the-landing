import { redis } from '@devvit/web/server';
import type { Settings, SettingsRequest } from '../../shared/api.ts';
import { keys, ttlSeconds } from '../repo/keys.ts';

export const defaultSettings: Settings = { tutorialDone: false, muted: false };

export type Player = { settings: Settings; joined: boolean };

/** Reads the player's hash and renews its 30-day lifetime (it rolls while they keep playing). */
export async function getPlayer(userId: string): Promise<Player> {
  const key = keys.user(userId);
  const fields = await redis.hGetAll(key);
  if (Object.keys(fields).length > 0) await redis.expire(key, ttlSeconds.user);
  return {
    settings: {
      tutorialDone: fields.tutorialDone === '1',
      muted: fields.muted === '1',
    },
    joined: fields.joined === '1',
  };
}

export async function saveSettings(
  userId: string,
  request: SettingsRequest
): Promise<void> {
  const fields: Record<string, string> = {};
  if (request.tutorialDone !== undefined)
    fields.tutorialDone = request.tutorialDone ? '1' : '0';
  if (request.muted !== undefined) fields.muted = request.muted ? '1' : '0';
  if (Object.keys(fields).length === 0) return;
  const key = keys.user(userId);
  await redis.hSet(key, fields);
  await redis.expire(key, ttlSeconds.user);
}
