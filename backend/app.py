from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, re

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def clean_text(text):
    text = re.sub(r'[*_#>`~\-]+', '', text)
    text = re.sub(r'\n+', '\n', text)
    return text.strip()

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message")

    url = "https://chatgpt-42.p.rapidapi.com/gpt4"
    payload = {
        "messages": [
            {
                "role": "system",
                "content": "Answer in the same language as the user input. If user writes in Hinglish (Hindi written in English letters), reply also in Hinglish — do not use any Hindi fonts."
            },
            {"role": "user", "content": user_message}
        ],
        "web_access": False
    }
    headers = {
        "x-rapidapi-key": "f2437b6a1cmsha767cfb70b4b1e5p1518b1jsn2ed772a1ab05",
        "x-rapidapi-host": "chatgpt-42.p.rapidapi.com",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        data = response.json()
        print("Raw API Response:", data)

        if "result" in data:
            bot_reply = data["result"]
        elif "message" in data:
            bot_reply = data["message"]
        else:
            bot_reply = "⚠️ Unexpected response format."

        clean_reply = clean_text(bot_reply)
        return jsonify({"reply": clean_reply})
    except Exception as e:
        return jsonify({"reply": f"Error: {str(e)}"}), 500


if __name__ == "__main__":
    from waitress import serve
    serve(app, host="0.0.0.0", port=10000)

