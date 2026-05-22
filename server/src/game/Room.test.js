import { describe, it, expect, beforeEach, vi } from "vitest";
import { createGame } from "./Room.js";
import { MemoryStore } from "../store/MemoryStore.js";

describe("Room Logic", () => {
  let store;
  let game;

  beforeEach(() => {
    store = new MemoryStore();
    game = createGame(store);
  });

  it("should create a room successfully", () => {
    const { room, player } = game.createRoom("socket-1", "Alice");
    
    expect(room).toBeDefined();
    expect(room.code).toHaveLength(4);
    expect(room.hostId).toBe(player.id);
    expect(room.players).toHaveLength(1);
    expect(room.players[0].name).toBe("Alice");
    expect(room.phase).toBe("lobby");
  });

  it("should allow players to join an existing room", () => {
    const { room: createdRoom } = game.createRoom("socket-1", "Alice");
    const { room, player } = game.joinRoom(createdRoom.code, "socket-2", "Bob");
    
    expect(room.players).toHaveLength(2);
    expect(player.name).toBe("Bob");
    expect(room.players[1].id).toBe(player.id);
  });

  it("should prevent duplicate names in the same room", () => {
    const { room } = game.createRoom("socket-1", "Alice");
    
    expect(() => {
      game.joinRoom(room.code, "socket-2", "alice");
    }).toThrow("That name is already taken in this room.");
  });

  it("should prevent non-hosts from starting the game", () => {
    const { room } = game.createRoom("socket-1", "Alice");
    const { player } = game.joinRoom(room.code, "socket-2", "Bob");
    
    expect(() => {
      game.startGame(room.code, player.id);
    }).toThrow("Only the host can start the game.");
  });

  it("should require minimum players to start", () => {
    const { room, player } = game.createRoom("socket-1", "Alice");
    game.joinRoom(room.code, "socket-2", "Bob");
    
    // Default MIN_PLAYERS is 4
    expect(() => {
      game.startGame(room.code, player.id);
    }).toThrow(/You need at least 4 players/);
  });

  it("should allow host to update settings", () => {
    const { room, player } = game.createRoom("socket-1", "Alice");
    
    const updated = game.updateSettings(room.code, player.id, { clueTime: 45 });
    expect(updated.settings.clueTime).toBe(45);
  });

  it("should mark a player as disconnected and start a grace period", () => {
    // Mock setTimeout
    vi.useFakeTimers();
    
    const { room, player } = game.createRoom("socket-1", "Alice");
    game.joinRoom(room.code, "socket-2", "Bob");
    
    game.markPlayerDisconnected(player.id);
    
    const updatedRoom = game.getRoom(room.code);
    const updatedPlayer = updatedRoom.players.find(p => p.id === player.id);
    
    expect(updatedPlayer.connected).toBe(false);
    expect(updatedPlayer.disconnectTimerId).toBeDefined();
    
    vi.useRealTimers();
  });

  it("allows players to vote for themselves", () => {
    const { room, player } = game.createRoom("socket-1", "Alice");
    game.joinRoom(room.code, "socket-2", "Bob");
    game.joinRoom(room.code, "socket-3", "Charlie");
    game.joinRoom(room.code, "socket-4", "Dave");
    room.phase = "voting";

    game.submitVote(room.code, player.id, player.id);

    expect(room.votes[player.id]).toBe(player.id);
  });
});
