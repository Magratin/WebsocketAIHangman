import { WebSocketServer } from "ws";
import getHangmanKeyword from "./kuhlschum.js";

const wss = new WebSocketServer({ port: 8080 });

const rooms = {};

function createRoom(room) {
    rooms[room] = {
        word: "",
        guessedLetters: [],
        wrongGuesses: 0,
        maxGuesses: 8,
        players: [],
        sockets: [],
        currentTurn: 0
    };
}

async function resetRoom(room) {
    const r = rooms[room];
    r.word = await getHangmanKeyword();
    r.guessedLetters = [];
    r.wrongGuesses = 0;
    r.currentTurn = 0;
}

function broadcast(room) {
    const r = rooms[room];
    const message = JSON.stringify({
        type: "state",
        payload: {
            word: r.word,
            guessedLetters: r.guessedLetters,
            wrongGuesses: r.wrongGuesses,
            maxGuesses: r.maxGuesses,
            players: r.players,
            currentTurn: r.currentTurn
        }
    });

    r.sockets.forEach(ws => {
        if (ws.readyState === ws.OPEN) ws.send(message);
    });
}

wss.on("connection", ws => {
    ws.on("message", async data => {
        const msg = JSON.parse(data);

        // JOIN ROOM
        if (msg.type === "join") {
            const { room, name } = msg;

            if (!rooms[room]) {
                createRoom(room);
                await resetRoom(room);
            }

            const r = rooms[room];

            ws.room = room;
            ws.name = name;

            r.players.push(name);
            r.sockets.push(ws);

            broadcast(room);
        }


        if (msg.type === "guess") {
            const r = rooms[ws.room];
            if (!r) return;

            const playerIndex = r.players.indexOf(ws.name);

            // not your turn
            if (playerIndex !== r.currentTurn) return;

            const letter = msg.letter;

            if (!r.guessedLetters.includes(letter)) {
                r.guessedLetters.push(letter);

                let correctGuess = false;

                if (r.word.includes(letter)) {
                    correctGuess = true;
                } else {
                    r.wrongGuesses++;
                    // Move to next player only on wrong guess
                    r.currentTurn = (r.currentTurn + 1) % r.players.length;
                }

                broadcast(ws.room);
            }
        }

        // RESET GAME
        if (msg.type === "reset") {
            await resetRoom(ws.room);
            broadcast(ws.room);
        }
    });

    ws.on("close", () => {
        const room = ws.room;
        if (!room || !rooms[room]) return;

        const r = rooms[room];
        const index = r.players.indexOf(ws.name);

        if (index !== -1) {
            r.players.splice(index, 1);
            r.sockets.splice(index, 1);
            // Adjust current turn if needed
            if (r.currentTurn >= r.players.length && r.players.length > 0) {
                r.currentTurn = 0;
            } else if (r.players.length === 0) {
                r.currentTurn = 0; // No players left
            }
            broadcast(room);
        }
    });
});

console.log("WebSocket server running on ws://localhost:8080");