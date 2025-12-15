import axios from "axios";

export default async function getHangmanKeyword() {
    try {
        const prompt = "Generiere mir ein hochdeutsches nomen nur das Wort ausgeben";

        // Generate random temperature between 0.0 and 3.0
        const temperature = (Math.random() * 3).toFixed(1); // e.g. "1.74"

        const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?temperature=${temperature}`;

        const response = await axios.get(url);
        const word = response.data.trim().toLowerCase();

        console.log("Temperature used:", temperature);
        console.log("Fetched word:", word);

        return word;

    } catch (error) {
        console.error("Error fetching hangman word:", error);
        return "error";
    }
}
