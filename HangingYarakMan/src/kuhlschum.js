import axios from "axios";

const FALLBACK_WORDS = [
    "baum", "auto", "haus", "buch", "stuhl", "tisch", "katze", "hund",
    "blume", "sonne", "mond", "wasser", "feuer", "erde", "luft", "zeit",
    "licht", "weg", "platz", "dorf", "stadt", "fluss", "berg", "wald"
];

export default async function getHangmanKeyword() {
    try {
        const prompt = "Generiere mir ein hochdeutsches Nomen nur das Wort ausgeben";

        const temperature = (Math.random() * 3).toFixed(1);

        const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?temperature=${temperature}`;

        const response = await axios.get(url, {
            timeout: 10000
        });

        let word = response.data.trim().toLowerCase();

        if (!word || word.length < 2 || word.length > 20 || /[^a-zäöüß\s]/.test(word)) {
            word = FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)];
        }

        console.log("Temperature used:", temperature);
        console.log("Fetched word:", word);

        return word;

    } catch (error) {
        console.error("Error fetching hangman word:", error.message);

        const fallbackWord = FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)];
        console.log("Using fallback word:", fallbackWord);

        return fallbackWord;
    }
}