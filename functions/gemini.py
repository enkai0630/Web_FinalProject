import configparser
import json
import re

import requests


config = configparser.ConfigParser()
with open("config.ini", "r", encoding="utf-8") as f:
    config.read_file(f)

API_KEY = config["Gemini"]["API_KEY"]
API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"gemini-2.5-flash:generateContent?key={API_KEY}"
)

FOOD_LABEL_GRADES = {"健康", "可以偶爾吃", "不健康", "無法判斷"}

NORMAL_ROLE = """
你是「心情與食品安全 AI 助手」。使用者心情正常時，請用溫和、清楚的繁體中文回答，
並主動補充 1 到 2 個食品安全或營養標示相關提醒。回答要短而有用，避免過度醫療化。
"""

NEGATIVE_ROLE = """
你是「心情與食品安全 AI 助手」。使用者心情偏低時，請優先給予情緒支持與陪伴，
不要急著教育食品安全知識。回答要溫柔、簡短，先讓使用者覺得被理解。
"""


def gemini_generate(user_input, situation):
    """Generate a chat response with Gemini REST API."""
    role = NEGATIVE_ROLE if situation == "negative" else NORMAL_ROLE

    payload = {
        "contents": [{
            "parts": [{
                "text": (
                    f"{role}\n\n"
                    f"目前模式：{situation}\n"
                    f"使用者訊息：{user_input}"
                )
            }]
        }],
        "generationConfig": {
            "temperature": 0.8,
            "maxOutputTokens": 4096,
        },
    }
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(API_URL, headers=headers, data=json.dumps(payload), timeout=30)
        result = response.json()

        if response.status_code == 200:
            return result["candidates"][0]["content"]["parts"][0]["text"]

        return f"AI 回覆暫時失敗，請稍後再試。Error: {response.status_code}"
    except Exception:
        return "AI 服務暫時無法連線，請稍後再試。"


def default_food_label_analysis(ocr_text, summary="無法從圖片中取得足夠的營養標示文字。"):
    return {
        "grade": "無法判斷",
        "score": None,
        "summary": summary,
        "reasons": ["請重新拍攝較清楚、完整的營養標示與成分表。"],
        "detected_risks": [],
        "advice": "這個結果只能作為食品標示輔助解讀，不能取代醫療或營養師建議。",
        "ocr_text": ocr_text or "",
    }


def first_number(text):
    match = re.search(r"(\d+(?:\.\d+)?)", text or "")
    return float(match.group(1)) if match else None


def parse_value_from_lines(lines, label):
    for index, line in enumerate(lines):
        if not line.startswith(label):
            continue

        if label == "脂肪" and line.startswith(("飽和脂肪", "反式脂肪")):
            continue

        value = first_number(line[len(label):])
        if value is not None:
            return value

        for offset in range(1, 3):
            if index + offset >= len(lines):
                break
            value = first_number(lines[index + offset])
            if value is not None:
                return value
    return None


def parse_nutrition_facts(ocr_text):
    lines = [line.strip() for line in (ocr_text or "").splitlines() if line.strip()]
    compact_text = " ".join(lines)
    serving_match = re.search(r"每一份量\s*(\d+(?:\.\d+)?)\s*公克", compact_text)

    return {
        "serving_grams": float(serving_match.group(1)) if serving_match else None,
        "calories": parse_value_from_lines(lines, "熱量"),
        "protein": parse_value_from_lines(lines, "蛋白質"),
        "fat": parse_value_from_lines(lines, "脂肪"),
        "saturated_fat": parse_value_from_lines(lines, "飽和脂肪"),
        "trans_fat": parse_value_from_lines(lines, "反式脂肪"),
        "carbs": parse_value_from_lines(lines, "碳水化合物"),
        "sugar": parse_value_from_lines(lines, "糖"),
        "sodium": parse_value_from_lines(lines, "鈉"),
    }


def heuristic_food_label_analysis(ocr_text):
    text = ocr_text or ""
    facts = parse_nutrition_facts(text)
    risks = []
    reasons = []
    score = 85

    has_core_values = any(
        facts[key] is not None
        for key in ["calories", "fat", "saturated_fat", "trans_fat", "sugar", "sodium"]
    )
    if not has_core_values:
        return default_food_label_analysis(
            text,
            summary="OCR 沒有讀到足夠的營養標示數值，因此無法判斷健康程度。",
        )

    calories = facts["calories"]
    saturated_fat = facts["saturated_fat"]
    trans_fat = facts["trans_fat"]
    sugar = facts["sugar"]
    sodium = facts["sodium"]

    if calories is not None:
        if calories >= 250:
            score -= 14
            risks.append("每份熱量偏高")
            reasons.append(f"每份熱量約 {calories:g} 大卡，作為點心需要留意份量。")
        else:
            reasons.append(f"每份熱量約 {calories:g} 大卡，熱量本身不是最主要風險。")

    if sugar is not None:
        if sugar >= 15:
            score -= 24
            risks.append("高糖")
            reasons.append(f"每份糖約 {sugar:g} 公克，糖含量偏高。")
        elif sugar >= 7:
            score -= 14
            risks.append("糖含量需要注意")
            reasons.append(f"每份糖約 {sugar:g} 公克，對點心來說需要控制食用頻率。")
        else:
            reasons.append(f"每份糖約 {sugar:g} 公克，未達高糖風險，但仍需看食用頻率。")

    if saturated_fat is not None:
        if saturated_fat >= 5:
            score -= 22
            risks.append("飽和脂肪偏高")
            reasons.append(f"每份飽和脂肪約 {saturated_fat:g} 公克，偏高。")
        elif saturated_fat >= 3:
            score -= 14
            risks.append("飽和脂肪需要注意")
            reasons.append(f"每份飽和脂肪約 {saturated_fat:g} 公克，需要留意。")

    if trans_fat is not None:
        if trans_fat > 0:
            score -= 30
            risks.append("含反式脂肪")
            reasons.append(f"標示每份反式脂肪約 {trans_fat:g} 公克，屬於明顯風險。")
        else:
            reasons.append("營養標示中的反式脂肪為 0 公克，這一項是正面的。")

    if sodium is not None:
        if sodium >= 600:
            score -= 18
            risks.append("高鈉")
            reasons.append(f"每份鈉約 {sodium:g} 毫克，偏高。")
        elif sodium >= 300:
            score -= 10
            risks.append("鈉含量需要注意")
            reasons.append(f"每份鈉約 {sodium:g} 毫克，需要留意。")
        else:
            reasons.append(f"每份鈉約 {sodium:g} 毫克，鈉含量不是主要風險。")

    if any(term in text for term in ["完全氫化", "氫化"]):
        score -= 8
        risks.append("成分含氫化油脂")
        reasons.append("成分表出現氫化油脂，即使反式脂肪標示為 0，也建議降低食用頻率。")

    if any(term in text for term in ["棕櫚油", "酥油"]):
        score -= 5
        risks.append("成分含棕櫚油或酥油")
        reasons.append("成分中有棕櫚油或酥油，通常代表飽和脂肪來源需要注意。")

    score = max(0, min(100, round(score)))
    if score >= 75 and not risks:
        grade = "健康"
        summary = "營養標示沒有明顯高風險項目，但仍需依份量食用。"
    elif score >= 55:
        grade = "可以偶爾吃"
        summary = "這項食品有糖或飽和脂肪等需要注意的地方，適合偶爾吃，不建議高頻率食用。"
    else:
        grade = "不健康"
        summary = "這項食品有多個需要注意的營養或成分風險，不建議經常食用。"

    return {
        "grade": grade,
        "score": score,
        "summary": summary,
        "reasons": reasons,
        "detected_risks": list(dict.fromkeys(risks)),
        "advice": "建議把它當作點心而不是正餐，控制份量與頻率，並留意同一天其他高糖或高油食品的攝取。",
        "ocr_text": text,
    }


def extract_json_object(text):
    match = re.search(r"\{.*\}", text or "", re.DOTALL)
    if not match:
        raise ValueError("Gemini response did not contain a JSON object.")
    return json.loads(match.group(0))


def normalize_food_label_analysis(data, ocr_text):
    grade = data.get("grade") if isinstance(data, dict) else None
    if grade not in FOOD_LABEL_GRADES:
        grade = "無法判斷"

    score = data.get("score") if isinstance(data, dict) else None
    if not isinstance(score, (int, float)):
        score = None
    else:
        score = max(0, min(100, score))

    def as_text_list(value):
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str) and value.strip():
            return [value.strip()]
        return []

    normalized = {
        "grade": grade,
        "score": score,
        "summary": str(data.get("summary") or "未提供摘要。").strip(),
        "reasons": as_text_list(data.get("reasons")),
        "detected_risks": as_text_list(data.get("detected_risks")),
        "advice": str(data.get("advice") or "建議搭配份量、頻率與個人健康狀況一起判斷。").strip(),
        "ocr_text": str(data.get("ocr_text") or ocr_text or "").strip(),
    }

    if normalized["grade"] == "無法判斷" and parse_nutrition_facts(ocr_text)["calories"] is not None:
        return heuristic_food_label_analysis(ocr_text)

    return normalized


def gemini_foodStringAnalyze(user_input):
    """Analyze OCR text from a food nutrition label."""
    ocr_text = (user_input or "").strip()
    if len(ocr_text) < 12:
        return default_food_label_analysis(ocr_text)

    prompt = f"""
你是一位食品營養標示輔助分析 AI。請根據 OCR 文字判斷食品健康程度。

分級只能使用以下四種之一：
- 健康
- 可以偶爾吃
- 不健康
- 無法判斷

判斷時請考慮：糖、鈉、飽和脂肪、反式脂肪、熱量、添加物、成分排序、份量資訊。
如果 OCR 文字不足、沒有營養標示或看不出關鍵數值，才回傳「無法判斷」。
如果 OCR 已經有熱量、脂肪、飽和脂肪、反式脂肪、糖、鈉等數值，請一定要給出健康分級，不要回「無法判斷」。

請只回傳 JSON，不要加 Markdown，不要加說明文字。格式如下：
{{
  "grade": "健康|可以偶爾吃|不健康|無法判斷",
  "score": 0到100的數字或null,
  "summary": "一句話總結",
  "reasons": ["判斷理由1", "判斷理由2"],
  "detected_risks": ["例如：高糖", "例如：含反式脂肪"],
  "advice": "給使用者的食用建議",
  "ocr_text": "整理後的 OCR 文字"
}}

OCR 文字：
{ocr_text}
"""

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json",
        },
    }
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(API_URL, headers=headers, data=json.dumps(payload), timeout=45)
        result = response.json()

        if response.status_code != 200:
            return heuristic_food_label_analysis(ocr_text)

        text = result["candidates"][0]["content"]["parts"][0]["text"]
        return normalize_food_label_analysis(extract_json_object(text), ocr_text)
    except Exception:
        return heuristic_food_label_analysis(ocr_text)
