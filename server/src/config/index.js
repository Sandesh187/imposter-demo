export const PORT = process.env.PORT || 3001;
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";
export const ROOM_TTL_SECONDS = 2 * 60 * 60; // 2 hours

export const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export const CLUE_SECONDS = 30;
export const DISCUSSION_SECONDS = 60;
export const VOTING_SECONDS = 45;
export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 8;
export const MAX_NAME_LENGTH = 18;
export const MAX_CLUE_LENGTH = 18;
export const ROOM_CODE_LENGTH = 4;
export const AVATAR_COLORS = [
  "#F5A623",
  "#9B59B6",
  "#FF6B6B",
  "#14B8A6",
  "#EC4899",
  "#22C55E"
];
