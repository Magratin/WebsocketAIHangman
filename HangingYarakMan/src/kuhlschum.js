import axios from "axios";

<<<<<<< HEAD
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
=======
const prompt = "Generiere%20mir%20ein%20sechs%20Zeichen%20langes%20deutsches%20zuffälliges%20Wort%20nur%20das%20Wort%20ausgeben."
const url = "https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&temperature=1.0";
let result = "";

export default function getHangmanKeyword() {
    axios.post(url)
        .then(response => result = response)
        .then(response => console.log('Word:', response))
        .catch(error => console.error('Error:', error));
    return result;
}
>>>>>>> 9cba2b6b7c8447361c1949ecb617d6df11456e5b
