export class GameError extends Error {
  constructor(message, code = "GAME_ERROR", statusCode = 400) {
    super(message);
    this.name = "GameError";
    this.code = code;
    this.statusCode = statusCode;
  }
}
