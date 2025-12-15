<template>
  <div class="hangman">
    <h2>Hangman – Wort erraten</h2>

    <img
        :src="`/GolgenImages/${wrongGuesses}.png`"
        alt="Galgen"
        class="hangman-image"
    />

    <div class="word">
      <span v-for="(letter, index) in wordArray" :key="index">
        {{ guessedLetters.includes(letter) ? letter : '_' }}
      </span>
    </div>

    <div class="letters">
      <button
          v-for="letter in alphabet"
          :key="letter"
          :disabled="guessedLetters.includes(letter) || gameOver"
          @click="guess(letter)"
      >
        {{ letter }}
      </button>
    </div>

    <div class="status" v-if="gameOver">
      <p v-if="won" style="color: green; font-weight: bold;">✔ Du hast gewonnen!</p>
      <p v-else style="color: red; font-weight: bold;">
        ✖ Verloren! Das Wort war "{{ word }}"
      </p>
      <button @click="resetGame">Neu starten</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "Hangman",

  data() {
    return {
      socket: null,

      // game state (comes from server)
      word: "",
      guessedLetters: [],
      wrongGuesses: 0,
      maxGuesses: 8,

      alphabet: "abcdefghijklmnopqrstuvwxyz".split("")
    };
  },

  mounted() {
    this.connectWebSocket();
  },

  beforeUnmount() {
    if (this.socket) {
      this.socket.close();
    }
  },

  methods: {
    connectWebSocket() {
      this.socket = new WebSocket("ws://localhost:8080");

      this.socket.onopen = () => {
        console.log("WebSocket connected");
      };

      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === "state") {
          // Sync full game state from server
          this.word = message.payload.word;
          this.guessedLetters = message.payload.guessedLetters;
          this.wrongGuesses = message.payload.wrongGuesses;
          this.maxGuesses = message.payload.maxGuesses;
        }
      };

      this.socket.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      this.socket.onclose = () => {
        console.log("WebSocket disconnected");
      };
    },

    guess(letter) {
      if (this.gameOver || !this.socket) return;

      this.socket.send(
          JSON.stringify({
            type: "guess",
            payload: letter
          })
      );
    },

    resetGame() {
      if (!this.socket) return;

      this.socket.send(
          JSON.stringify({
            type: "reset"
          })
      );
    }
  },

  computed: {
    wordArray() {
      return this.word ? this.word.split("") : [];
    },

    won() {
      return (
          this.word &&
          this.wordArray.every(letter =>
              this.guessedLetters.includes(letter)
          )
      );
    },

    gameOver() {
      return this.won || this.wrongGuesses > this.maxGuesses;
    }
  }
};
</script>



<style scoped>
.hangman {
  text-align: center;
  font-family: sans-serif;
  padding: 20px;
}

.hangman-image {
  width: 200px;
  margin-bottom: 20px;
}

.word {
  font-size: 32px;
  letter-spacing: 10px;
  margin-bottom: 20px;
}

.letters button {
  margin: 5px;
  padding: 8px 12px;
  font-size: 16px;
}

.status {
  margin-top: 20px;
}
</style>
