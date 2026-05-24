import configparser

import requests
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential


config = configparser.ConfigParser()
with open("config.ini", "r", encoding="utf-8") as f:
    config.read_file(f)

analytics_credential = AzureKeyCredential(config["AzureLanguage"]["LANGUAGE_KEY"])


def azure_sentiment(user_input):
    """Analyze sentiment with Azure Text Analytics."""
    text_analytics_client = TextAnalyticsClient(
        endpoint=config["AzureLanguage"]["END_POINT"],
        credential=analytics_credential,
    )
    response = text_analytics_client.analyze_sentiment(
        [user_input],
        show_opinion_mining=True,
        language="zh-tw",
    )
    docs = [doc for doc in response if not doc.is_error]

    if not docs:
        return "無法判斷", 0

    positive_score = docs[0].confidence_scores.positive

    if positive_score > 0.85:
        sentiment_text = "非常正向"
    elif positive_score > 0.7:
        sentiment_text = "偏正向"
    elif positive_score > 0.5:
        sentiment_text = "中性偏正向"
    else:
        sentiment_text = "可能偏負面"

    return sentiment_text, positive_score


def azure_computer_vision(image_data):
    """Extract image captions and OCR text with Azure Computer Vision."""
    endpoint = config["AzureVision"]["END_POINT"]
    subscription_key = config["AzureVision"]["KEY"]
    uri_base = endpoint + "computervision/imageanalysis:analyze"

    params = {
        "api-version": "2024-02-01",
        "language": "en",
        "features": "read",
    }

    headers = {
        "Content-Type": "application/octet-stream",
        "Ocp-Apim-Subscription-Key": subscription_key,
    }
    response = requests.post(
        uri_base,
        headers=headers,
        params=params,
        data=image_data,
        timeout=30,
    )
    response.raise_for_status()
    analysis = response.json()

    dense_captions = [
        item["text"]
        for item in analysis.get("denseCaptionsResult", {}).get("values", [])
    ]

    read_blocks = []
    for block in analysis.get("readResult", {}).get("blocks", []):
        for line in block.get("lines", []):
            if line.get("text"):
                read_blocks.append(line["text"])

    return "\n".join(read_blocks + dense_captions)
