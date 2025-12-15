import WebSocket, { WebSocketServer } from "ws";
import getHangmanKeyword from "./kuhlschum.js";

const wss = new WebSocketServer({ port: 8080 });

// Global game state (1 shared game)
let gameState = {
    word: "",
    guessedLetters: [],
    wrongGuesses: 0,
    maxGuesses: 8
};

async function resetGame() {
    gameState.word = await getHangmanKeyword();
    gameState.guessedLetters = [];
    gameState.wrongGuesses = 0;
}

await resetGame();

function broadcast() {
    const message = JSON.stringify({
        type: "state",
        payload: gameState
    });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

wss.on("connection", ws => {
    // Send current state on connect
    ws.send(JSON.stringify({
        type: "state",
        payload: gameState
    }));

    ws.on("message", async data => {
        const msg = JSON.parse(data);

        if (msg.type === "guess") {
            const letter = msg.payload;

            if (
                !gameState.guessedLetters.includes(letter) &&
                gameState.wrongGuesses <= gameState.maxGuesses
            ) {
                gameState.guessedLetters.push(letter);

                if (!gameState.word.includes(letter)) {
                    gameState.wrongGuesses++;
                }
            }

            broadcast();
        }

        if (msg.type === "reset") {
            await resetGame();
            broadcast();
        }
    });
});

console.log("WebSocket server running on ws://localhost:8080");
