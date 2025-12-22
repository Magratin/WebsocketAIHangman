<template>
  <div class="hangman">
    <div class="header">
      <h2>Hangman</h2>
      <p class="subtitle">Wort erraten</p>
    </div>

    <div v-if="!joined" class="lobby">
      <div class="lobby-card">
        <h3>Join Game</h3>
        <input v-model="name" placeholder="Your name" class="input-field" />
        <input v-model="room" placeholder="Room name" class="input-field" />
        <button @click="joinGame" class="btn-primary">Join Game</button>
      </div>
    </div>

    <div v-else class="game-container">
      <div class="players-section">
        <h3>Players</h3>
        <div class="players-list">
          <span
              v-for="(p, i) in players"
              :key="p"
              :class="['player-badge', { active: i === currentTurn }]"
          >
            {{ p }}
            <span v-if="i === currentTurn" class="turn-indicator">●</span>
          </span>
        </div>
      </div>

      <div class="turn-status">
        <p v-if="myTurn" class="my-turn">Your turn to guess!</p>
        <p v-else class="waiting">Waiting for {{ players[currentTurn] }}...</p>
      </div>

      <div class="hangman-visual">
        <img
            :src="`/GolgenImages/${wrongGuesses}.png`"
            alt="Galgen"
            class="hangman-image"
        />
        <div class="lives-counter">
          <span class="lives-label">Lives:</span>
          <div class="lives-dots">
            <span
                v-for="n in (maxGuesses - wrongGuesses)"
                :key="n"
                class="life-dot active"
            >❤️</span>
            <span
                v-for="n in wrongGuesses"
                :key="'lost-' + n"
                class="life-dot lost"
            >💔</span>
          </div>
        </div>
      </div>

      <div class="word-display">
        <span v-for="(letter, index) in wordArray" :key="index" class="letter-slot">
          <span class="letter" :class="{ revealed: guessedLetters.includes(letter) }">
            {{ guessedLetters.includes(letter) ? letter : '_' }}
          </span>
        </span>
      </div>

      <div class="keyboard">
        <button
            v-for="letter in alphabet"
            :key="letter"
            :disabled="guessedLetters.includes(letter) || gameOver"
            :class="['key', {
              used: guessedLetters.includes(letter),
              correct: guessedLetters.includes(letter) && wordArray.includes(letter),
              wrong: guessedLetters.includes(letter) && !wordArray.includes(letter)
            }]"
            @click="guess(letter)"
        >
          {{ letter.toUpperCase() }}
        </button>
      </div>

      <div class="status-modal" v-if="gameOver">
        <div class="modal-content" :class="{ won: won, lost: !won }">
          <div v-if="won" class="result">
            <h3>Congratulations!</h3>
            <p>You won the game!</p>
          </div>
          <div v-else class="result">

            <h3>Game Over!</h3>
            <p>The word was <strong>"{{ word }}"</strong></p>
          </div>
          <button @click="resetGame" class="btn-reset">Play Again</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Hangman",

  data() {
    return {
      socket: null,

      // lobby
      name: "",
      room: "",
      joined: false,

      // game state
      word: "",
      guessedLetters: [],
      wrongGuesses: 0,
      maxGuesses: 8,
      players: [],
      currentTurn: 0,

      alphabet: "abcdefghijklmnopqrstuvwxyz".split("")
    };
  },

  computed: {
    wordArray() {
      return this.word ? this.word.split("") : [];
    },

    won() {
      return this.word &&
          this.wordArray.every(l => this.guessedLetters.includes(l));
    },

    gameOver() {
      return this.won || this.wrongGuesses >= this.maxGuesses;
    },

    myTurn() {
      return this.players[this.currentTurn] === this.name;
    }
  },

  methods: {
    joinGame() {
      this.socket = new WebSocket("ws://localhost:8080");

      this.socket.onopen = () => {
        this.socket.send(JSON.stringify({
          type: "join",
          room: this.room,
          name: this.name
        }));
        this.joined = true;
      };

      this.socket.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "state") {
          Object.assign(this, msg.payload);
        }
      };
    },

    guess(letter) {
      if (!this.myTurn || this.gameOver) return;

      this.socket.send(JSON.stringify({
        type: "guess",
        letter
      }));
    },

    resetGame() {
      this.socket.send(JSON.stringify({ type: "reset" }));
    }
  }
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.hangman {
  min-height: 100vh;
  background: black;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
  animation: fadeInDown 0.6s ease;
}

.header h2 {
  font-size: 48px;
  margin: 0;
  font-weight: 800;
  text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin: 5px 0 0;
}

/* Lobby Styles */
.lobby {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.lobby-card {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: scaleIn 0.5s ease;
  min-width: 350px;
}

.lobby-card h3 {
  margin-top: 0;
  color: #667eea;
  font-size: 28px;
  text-align: center;
}

.input-field {
  width: 100%;
  padding: 15px;
  margin: 12px 0;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.input-field:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-primary {
  width: 100%;
  padding: 15px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}



/* Game Container */
.game-container {
  max-width: 900px;
  margin: 0 auto;
  animation: fadeIn 0.6s ease;
}

.players-section {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.players-section h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.players-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.player-badge {
  padding: 8px 16px;
  background: lightgrey;
  border-radius: 20px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-badge.active {
  background: #667eea;
  color: white;
  animation: pulse 1.5s ease infinite;
}

.turn-indicator {
  animation: blink 1s ease infinite;
}

.turn-status {
  text-align: center;
  margin-bottom: 20px;
}

.my-turn {
  color: white;
  font-size: 24px;
  font-weight: 700;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
  animation: bounce 1s ease infinite;
}

.waiting {
  color: white;
  font-size: 20px;
  opacity: 0.9;
}

.hangman-visual {
  background: white;
  padding: 30px;
  border-radius: 15px;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.hangman-image {
  width: 250px;
  height: auto;
  margin: 0 auto 20px;
  display: block;
  filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.1));
}

.lives-counter {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
}

.lives-label {
  font-weight: 700;
  color: #333;
  font-size: 18px;
}

.lives-dots {
  display: flex;
  gap: 5px;
}

.life-dot {
  font-size: 24px;
  animation: heartbeat 1.5s ease infinite;
}

.life-dot.lost {
  opacity: 0.4;
  animation: none;
}

.word-display {
  background: white;
  padding: 40px 20px;
  border-radius: 15px;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 15px;
}

.letter-slot {
  display: inline-block;
}

.letter {
  font-size: 48px;
  font-weight: 700;
  color: #667eea;
  width: 50px;
  display: inline-block;
  text-align: center;
  transition: all 0.3s ease;
}

.letter.revealed {
  animation: revealLetter 0.5s ease;
}

.keyboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
  gap: 10px;
  max-width: 700px;
  margin: 0 auto;
}

.key {
  padding: 15px;
  background: white;
  color: #333;
  border: 2px solid transparent;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}



.key:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.key.used {
  background: #e0e0e0;
}

.key.correct {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
  animation: correctGuess 0.5s ease;
}

.key.wrong {
  background: #f44336;
  color: white;
  border-color: #f44336;
  animation: wrongGuess 0.5s ease;
}

.status-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s ease;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 50px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: scaleIn 0.4s ease;
  max-width: 400px;
}

.modal-content.won {
  border: 5px solid #4caf50;
}

.modal-content.lost {
  border: 5px solid #f44336;
}

.result .emoji {
  font-size: 80px;
  margin-bottom: 20px;
  animation: bounce 1s ease infinite;
}

.result h3 {
  font-size: 32px;
  margin: 0 0 10px 0;
}

.result p {
  font-size: 18px;
  color: #666;
  margin: 10px 0 30px 0;
}

.btn-reset {
  padding: 15px 40px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

</style>