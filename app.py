from pathlib import Path

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

from functions.azure import azure_computer_vision, azure_sentiment
from functions.gemini import gemini_foodStringAnalyze, gemini_generate


app = Flask(__name__)
CORS(app)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


def api_success(data=None, message=None):
    return jsonify({
        "success": True,
        "data": data or {},
        "error": None,
        "message": message,
    })


def api_error(message, status_code=500, details=None):
    return jsonify({
        "success": False,
        "data": {},
        "error": {
            "message": message,
            "details": details,
        },
        "message": None,
    }), status_code


def is_allowed_image(filename):
    return Path(filename).suffix.lower() in ALLOWED_IMAGE_EXTENSIONS


def build_suggestions(mode):
    if mode == "negative":
        return [
            "先用一句話說說你現在最困擾的事情",
            "如果今天不想談食物，我可以先陪你整理情緒",
            "等心情穩定後，再一起看食品標示也可以",
        ]

    return [
        "上傳食品成分表，讓我幫你判斷健康程度",
        "問我如何看營養標示中的糖、鈉與脂肪",
        "想知道食品添加物或保存期限要注意什麼嗎？",
    ]


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/food-label")
def food_label_page():
    return render_template("food_label.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(silent=True) or {}
        user_msg = (data.get("message") or "").strip()

        if not user_msg:
            return api_error("請輸入想詢問的內容。", status_code=400)

        sentiment_text, score = azure_sentiment(user_msg)
        mode = "negative" if score < 0.4 else "normal"
        ai_response = gemini_generate(user_msg, mode)

        return api_success({
            "reply": ai_response,
            "analysis": {
                "sentiment": sentiment_text,
                "score": score,
                "mode": mode,
            },
            "suggestions": build_suggestions(mode),
        })
    except Exception as exc:
        app.logger.exception("Chat API failed")
        return api_error("聊天服務暫時發生問題，請稍後再試。", details=str(exc))


@app.route("/api/analyze-food-label", methods=["POST"])
def analyze_food_label():
    try:
        image_file = request.files.get("image")

        if image_file is None or not image_file.filename:
            return api_error("請先選擇一張食品成分表圖片。", status_code=400)

        if not is_allowed_image(image_file.filename):
            return api_error("只支援 JPG、JPEG 或 PNG 圖片。", status_code=400)

        image_data = image_file.read()
        if not image_data:
            return api_error("圖片檔案是空的，請重新選擇。", status_code=400)

        if len(image_data) > MAX_IMAGE_BYTES:
            return api_error("圖片太大，請上傳 5MB 以下的圖片。", status_code=400)

        ocr_text = azure_computer_vision(image_data)
        analysis = gemini_foodStringAnalyze(ocr_text)

        return api_success({
            "filename": image_file.filename,
            "analysis": analysis,
        })
    except Exception as exc:
        app.logger.exception("Food label analysis failed")
        return api_error("食品成分表分析失敗，請稍後再試。", details=str(exc))


@app.route("/api/translate", methods=["POST"])
def translate_content():
    return api_error("翻譯功能尚未實作。", status_code=501)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
