import { describe, it, expect, vi } from "vitest";
import { startRound, confirmRole, submitClue, maybeReveal } from "./phases.js";

describe("Phases Logic", () => {
  const mockNotify = vi.fn();

  const createMockRoom = () => ({
    code: "TEST",
    category: "General",
    customTopics: [],
    usedTopics: [],
    settings: {
      clueTime: 30,
      discussionTime: 60,
      votingTime: 45,
    },
    players: [
      { id: "p1", name: "Alice", eliminated: false },
      { id: "p2", name: "Bob", eliminated: false },
      { id: "p3", name: "Charlie", eliminated: false },
      { id: "p4", name: "Dave", eliminated: false },
    ],
    imposterId: null,
    phase: "lobby",
    confirmed: new Set(),
    clues: [],
    votes: {},
    history: []
  });

  it("should initialize a round correctly", () => {
    const room = createMockRoom();
    const updated = startRound(room, mockNotify);
    
    expect(updated.phase).toBe("role");
    expect(updated.imposterId).toBeDefined();
    expect(updated.topic).toBeDefined();
    expect(updated.clues).toEqual([]);
    expect(updated.votes).toEqual({});
  });

  it("should transition to clue phase after all roles confirmed", () => {
    let room = createMockRoom();
    room = startRound(room, mockNotify);
    
    room = confirmRole(room, "p1", mockNotify);
    room = confirmRole(room, "p2", mockNotify);
    room = confirmRole(room, "p3", mockNotify);
    
    expect(room.phase).toBe("role"); // Not everyone confirmed
    
    room = confirmRole(room, "p4", mockNotify);
    expect(room.phase).toBe("clue"); // Everyone confirmed
    expect(room.currentTurnId).toBeDefined();
  });

  it("should advance turn when clue is submitted", () => {
    let room = createMockRoom();
    room = startRound(room, mockNotify);
    ["p1", "p2", "p3", "p4"].forEach(id => confirmRole(room, id, mockNotify));
    
    const currentPlayer = room.currentTurnId;
    submitClue(room, currentPlayer, "Apple", mockNotify);
    
    expect(room.clues).toHaveLength(1);
    expect(room.clues[0].clue).toBe("Apple");
    expect(room.currentTurnId).not.toBe(currentPlayer); // Turn advanced
  });

  it("should transition to discussion phase after last clue", () => {
    let room = createMockRoom();
    room = startRound(room, mockNotify);
    ["p1", "p2", "p3", "p4"].forEach(id => confirmRole(room, id, mockNotify));
    
    // 4 players, 4 clues
    for (let i = 0; i < 4; i++) {
      submitClue(room, room.currentTurnId, `Word${i}`, mockNotify);
    }
    
    expect(room.phase).toBe("discussion");
    expect(room.currentTurnId).toBeNull();
  });
});
