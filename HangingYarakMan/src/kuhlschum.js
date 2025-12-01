import axios from "axios";

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