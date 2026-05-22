import { describe, it, expect, vi } from "vitest";
import { startRound, confirmRole, submitClue, maybeReveal, revealResults } from "./phases.js";

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
      { id: "p1", name: "Alice", score: 0, eliminated: false },
      { id: "p2", name: "Bob", score: 0, eliminated: false },
      { id: "p3", name: "Charlie", score: 0, eliminated: false },
      { id: "p4", name: "Dave", score: 0, eliminated: false },
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

  it("does not award points for a non-final tied elimination round", () => {
    const room = createMockRoom();
    room.phase = "voting";
    room.round = 1;
    room.topic = "Pizza";
    room.imposterId = "p1";
    room.votes = {
      p1: "p2",
      p2: "p1",
      p3: "p4",
      p4: "p3",
    };

    revealResults(room, mockNotify);

    expect(room.phase).toBe("results");
    expect(room.results.gameOver).toBe(false);
    expect(room.players.map((player) => player.score)).toEqual([0, 0, 0, 0]);
  });

  it("awards crew points only when the imposter is eliminated and the game ends", () => {
    const room = createMockRoom();
    room.phase = "voting";
    room.round = 1;
    room.topic = "Pizza";
    room.imposterId = "p1";
    room.votes = {
      p1: "p2",
      p2: "p1",
      p3: "p1",
      p4: "p1",
    };

    revealResults(room, mockNotify);

    expect(room.phase).toBe("final");
    expect(room.final.winner).toBe("players");
    expect(room.players.map((player) => player.score)).toEqual([0, 3, 3, 3]);
  });

  it("awards only the imposter when two players remain after elimination", () => {
    const room = createMockRoom();
    room.phase = "voting";
    room.round = 2;
    room.topic = "Pizza";
    room.imposterId = "p1";
    room.players.find((player) => player.id === "p4").eliminated = true;
    room.votes = {
      p1: "p2",
      p2: "p3",
      p3: "p2",
    };

    revealResults(room, mockNotify);

    expect(room.phase).toBe("final");
    expect(room.final.winner).toBe("imposter");
    expect(room.players.map((player) => player.score)).toEqual([3, 0, 0, 0]);
  });
});
