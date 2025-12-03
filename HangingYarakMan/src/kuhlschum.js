import axios from "axios";

const prompt = "6 zeichen langes wort nur wort immer neues wort.";
const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;

export default async function getHangmanKeyword() {
    try {
        const response = await axios.get(url);
        console.log("Word:", response.data);
        return response.data.trim().toLowerCase();
    } catch (error) {
        console.error("Error:", error);
        return "";
    }
}
