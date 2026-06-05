import configparser
import os
from pathlib import Path

import requests
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential


config = configparser.ConfigParser()
config_path = Path("config.ini")
if config_path.exists():
    with config_path.open("r", encoding="utf-8") as f:
        config.read_file(f)


def get_config_value(section, option, env_name):
    value = os.environ.get(env_name)
    if value:
        return value
    return config.get(section, option, fallback="")


AZURE_LANGUAGE_KEY = get_config_value(
    "AzureLanguage",
    "LANGUAGE_KEY",
    "AZURE_LANGUAGE_KEY",
)
AZURE_LANGUAGE_ENDPOINT = get_config_value(
    "AzureLanguage",
    "END_POINT",
    "AZURE_LANGUAGE_ENDPOINT",
)
AZURE_VISION_KEY = get_config_value("AzureVision", "KEY", "AZURE_VISION_KEY")
AZURE_VISION_ENDPOINT = get_config_value(
    "AzureVision",
    "END_POINT",
    "AZURE_VISION_ENDPOINT",
)


def azure_sentiment(user_input):
    """Analyze sentiment with Azure Text Analytics."""
    if not AZURE_LANGUAGE_KEY or not AZURE_LANGUAGE_ENDPOINT:
        raise RuntimeError("Azure Language credentials are not configured.")

    text_analytics_client = TextAnalyticsClient(
        endpoint=AZURE_LANGUAGE_ENDPOINT,
        credential=AzureKeyCredential(AZURE_LANGUAGE_KEY),
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
    if not AZURE_VISION_KEY or not AZURE_VISION_ENDPOINT:
        raise RuntimeError("Azure Vision credentials are not configured.")

    endpoint = AZURE_VISION_ENDPOINT
    subscription_key = AZURE_VISION_KEY
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
