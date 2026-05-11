import { useCallback, useEffect, useMemo, useState } from "react";
import { useSocket } from "./useSocket";

function ack(socket, event, payload = {}) {
  return new Promise((resolve) => {
    socket.emit(event, payload, (response) => resolve(response || { ok: false, error: "No server response." }));
  });
}

export function useGame() {
  const socket = useSocket();
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [lastReveal, setLastReveal] = useState(null);

  const resetLocal = useCallback(() => {
    setRoom(null);
    setMyRole(null);
    setLastReveal(null);
  }, []);

  const addToast = useCallback((message) => {
    const id = crypto.randomUUID();
    setToasts((items) => [...items, { id, message }].slice(-3));
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    const onRoomState = (nextRoom) => setRoom(nextRoom);
    const onRole = (role) => setMyRole(role);
    const onToast = ({ message }) => addToast(message);
    const onError = (message) => addToast(message);
    const onReveal = (results) => setLastReveal(results);
    const onGameEnded = () => {
      addToast("Game ended.");
      resetLocal();
    };
    const onPhaseChange = ({ phase }) => {
      if (phase === "role") {
        setMyRole(null);
      }
    };

    socket.on("room-state", onRoomState);
    socket.on("role-assigned", onRole);
    socket.on("toast", onToast);
    socket.on("error-message", onError);
    socket.on("reveal-results", onReveal);
    socket.on("game-ended", onGameEnded);
    socket.on("phase-change", onPhaseChange);
    socket.on("player-joined", ({ playerName }) => addToast(`${playerName || "A player"} joined.`));
    socket.on("player-disconnected", ({ playerName }) => addToast(`${playerName || "A player"} left.`));
    socket.on("vote-received", ({ voteTotal }) => addToast(`${voteTotal} vote${voteTotal === 1 ? "" : "s"} locked.`));
    socket.on("clue-received", ({ playerName, clue }) => addToast(`${playerName}: ${clue}`));

    return () => {
      socket.off("room-state", onRoomState);
      socket.off("role-assigned", onRole);
      socket.off("toast", onToast);
      socket.off("error-message", onError);
      socket.off("reveal-results", onReveal);
      socket.off("game-ended", onGameEnded);
      socket.off("phase-change", onPhaseChange);
      socket.off("player-joined");
      socket.off("player-disconnected");
      socket.off("vote-received");
      socket.off("clue-received");
    };
  }, [addToast, resetLocal, socket]);

  const send = useCallback(
    async (event, payload) => {
      const response = await ack(socket, event, payload);
      if (!response.ok) {
        addToast(response.error || "Something went wrong.");
        return response;
      }
      if (response.room) {
        setRoom(response.room);
      }
      if (response.playerId) {
        setPlayerId(response.playerId);
      }
      return response;
    },
    [addToast, socket]
  );

  const actions = useMemo(
    () => ({
      createRoom: (playerName) => send("create-room", { playerName }),
      joinRoom: (roomCode, playerName) => send("join-room", { roomCode, playerName }),
      setCategory: (category) => send("set-category", { roomCode: room?.code, category }),
      startGame: () => send("start-game", { roomCode: room?.code }),
      confirmRole: () => send("confirm-role", { roomCode: room?.code }),
      submitClue: (clue) => send("submit-clue", { roomCode: room?.code, clue }),
      submitVote: (targetId) => send("submit-vote", { roomCode: room?.code, targetId }),
      submitTopicGuess: (guess) => send("submit-topic-guess", { roomCode: room?.code, guess }),
      playAgain: () => send("play-again", { roomCode: room?.code }),
      newGame: () => send("new-game", { roomCode: room?.code }),
      endGame: () => send("end-game", { roomCode: room?.code }),
      leaveRoom: async () => {
        if (room?.code) {
          await send("leave-room", { roomCode: room.code });
        }
        resetLocal();
      }
    }),
    [resetLocal, room?.code, send]
  );

  return {
    socket,
    connected: socket.connected,
    room,
    playerId,
    myRole,
    toasts,
    lastReveal,
    actions,
    addToast,
    resetLocal
  };
}
