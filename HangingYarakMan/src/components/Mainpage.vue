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
      word: getHangmanKeyWord(),
      guessedLetters: [],
      wrongGuesses: 0,
      maxGuesses: 8,
      alphabet: "abcdefghijklmnopqrstuvwxyz".split("")
    };
  },
  computed: {
    wordArray() {
      return this.word.split("");
    },
    won() {
      return this.wordArray.every((l) => this.guessedLetters.includes(l));
    },
    gameOver() {
      return this.won || this.wrongGuesses > this.maxGuesses;
    }
  },
  methods: {
    guess(letter) {
      if (this.guessedLetters.includes(letter) || this.gameOver) return;

      this.guessedLetters.push(letter);

      if (!this.word.includes(letter)) {
        this.wrongGuesses++;
      }
    },
    resetGame() {
      this.guessedLetters = [];
      this.wrongGuesses = 0;
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
