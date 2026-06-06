# 心情陪伴與食品安全 AI 助手

一個結合「情緒分析 × AI 對話 × 食品標示 OCR × 食品安全知識」的 Flask 網頁專案。

系統讓使用者可以透過聊天獲得情緒支持，也能上傳食品標示圖片，快速了解食品成分與營養風險。

## 專案特色

- 結合 Azure 情緒分析、Azure Vision OCR 與 Gemini 文字生成。
- 提供心情陪伴、食品標示分析、食品安全知識與心理健康內容頁。
- 後端統一回傳 API 格式，前端以 Flask Jinja template 搭配 page-specific JavaScript 實作。
- 支援本機 `config.ini` 與部署環境變數兩種 API key 設定方式。
- 已加入 Render 部署設定，可用 `gunicorn app:app` 啟動正式服務。

## 專案動機

現代人在飲食選擇與心理壓力上常常需要即時、簡單、可信的輔助工具。

本專案以 SDGs 中的健康與福祉概念為出發點，設計一個能同時處理「食品安全」與「情緒陪伴」的網頁系統。

- 對一般使用者而言，食品標示中的糖、鈉、脂肪與添加物不一定容易理解。
- 使用者情緒低落時，直接給出知識型回答不一定適合，因此系統會先判斷情緒狀態。
- 透過 AI 與雲端服務，可以把 OCR、自然語言分析與互動式網頁整合成完整應用。

## 核心功能

### AI 對話與情緒分析

- 使用者輸入文字訊息後，後端會先呼叫 Azure Language 進行情緒分析。
- 系統會依照情緒分數切換回覆模式：
  - 情緒偏低：偏向陪伴、支持與引導整理心情。
  - 情緒正常：補充食品安全、營養標示與健康飲食知識。
- Gemini 會根據後端判斷出的模式產生回覆。
- API 會同時回傳 AI 回覆、情緒分析結果與建議提問。

### 食品標示分析

- 支援上傳 JPG、JPEG、PNG 圖片。
- 單張圖片大小限制為 5MB 以下。
- 使用 Azure Vision OCR 擷取食品標示或成分表文字。
- 使用 Gemini 分析食品健康程度、風險原因與食用建議。
- 若 AI 回覆不穩定，後端仍會用本地規則輔助解析熱量、糖、鈉、脂肪、飽和脂肪、反式脂肪等欄位。

食品分析分級包含：

- 健康
- 可以偶爾吃
- 不健康
- 無法判斷

### 食品安全知識頁

- 提供食品安全主題整理。
- 使用獨立 template 與 JavaScript 管理互動內容。
- 適合用來補充食品標示分析以外的背景知識。

### 心理健康內容頁

- 提供情緒與壓力相關的基礎內容。
- 搭配心情量表與互動式前端腳本，讓使用者能快速檢視自身狀態。

## 技術架構

### Frontend

- HTML
- CSS
- JavaScript
- Flask Jinja templates

### Backend

- Python
- Flask
- Flask-CORS

### AI 與雲端服務

- Azure AI Language：情緒分析
- Azure AI Vision：食品標示 OCR
- Gemini API：對話生成與食品標示文字分析

### Deployment

- Render
- Gunicorn
- Environment Variables

## 專案結構

```text
web_SDGs_final_project/
├── app.py                         # Flask 入口、頁面路由與 API 路由
├── config.example.ini             # 本機設定檔範例
├── requirements.txt               # Python 套件清單
├── render.yaml                    # Render Blueprint 部署設定
├── SECURITY.md                    # API key 與安全注意事項
├── README_sample.md               # README 版型參考
├── functions/
│   ├── azure.py                   # Azure 情緒分析與 OCR
│   └── gemini.py                  # Gemini 對話與食品標示分析
├── templates/
│   ├── base.html                  # 共用頁面版型
│   ├── _icons.html                # 共用 SVG icon partial
│   ├── index.html                 # AI 對話首頁
│   ├── food_label.html            # 食品標示分析頁
│   ├── food_safety_knowledge.html # 食品安全知識頁
│   └── mental_wellness.html       # 心理健康頁
├── static/
│   ├── css/
│   │   └── style.css              # 全站樣式
│   └── js/
│       ├── site.js                # 全站互動
│       ├── chat.js                # AI 對話頁
│       ├── food_label.js          # 食品標示分析頁
│       ├── food_safety_knowledge.js
│       ├── mental_wellness.js
│       └── mood_scale.js
└── Ingredients_*.jpg              # 測試用食品標示圖片
```

## 安裝與執行

### 1. Clone 專案

```bash
git clone https://github.com/enkai0630/Web_FinalProject.git
cd web_SDGs_final_project
```

### 2. 建立虛擬環境

PowerShell：

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. 安裝套件

```powershell
pip install -r requirements.txt
```

### 4. 建立本機設定檔

複製 `config.example.ini`，改名為 `config.ini`，並填入自己的 Azure 與 Gemini API key。

```powershell
Copy-Item config.example.ini config.ini
```

`config.ini` 需要設定：

- Azure Language key 與 endpoint
- Azure Vision key 與 endpoint
- Gemini API key

注意：`config.ini` 內含 API key，不應上傳到 GitHub。

### 5. 啟動專案

```powershell
python app.py
```

本機預設網址：

```text
http://127.0.0.1:5001/
```

主要頁面：

```text
http://127.0.0.1:5001/
http://127.0.0.1:5001/food-label
http://127.0.0.1:5001/food-safety-knowledge
http://127.0.0.1:5001/mental-wellness
```

## API 說明

### `POST /api/chat`

用途：AI 對話與情緒分析。

Request JSON：

```json
{
  "message": "反式脂肪為什麼不健康？"
}
```

Response 主要欄位：

- `reply`：Gemini 產生的回覆
- `analysis.sentiment`：Azure 判斷出的情緒文字
- `analysis.score`：情緒分數
- `analysis.mode`：後端切換出的回覆模式
- `suggestions`：下一步建議提問

### `POST /api/analyze-food-label`

用途：分析食品標示圖片。

Request：

- `multipart/form-data`
- 欄位名稱：`image`
- 支援格式：JPG、JPEG、PNG
- 大小限制：5MB 以下

Response 主要欄位：

- `filename`：上傳檔名
- `analysis.grade`：健康分級
- `analysis.score`：健康分數
- `analysis.summary`：分析摘要
- `analysis.reasons`：判斷理由
- `analysis.detected_risks`：偵測到的風險
- `analysis.advice`：食用建議
- `analysis.ocr_text`：OCR 擷取文字

### `POST /api/translate`

目前狀態：尚未實作，會回傳 `501`。

## Render 部署

本專案已提供 `render.yaml`，可作為 Render Blueprint 參考。

Render 主要設定：

```text
Build Command: pip install -r requirements.txt
Start Command: gunicorn app:app --bind 0.0.0.0:$PORT
```

需要在 Render Environment Variables 設定：

- `GEMINI_API_KEY`
- `AZURE_LANGUAGE_KEY`
- `AZURE_LANGUAGE_ENDPOINT`
- `AZURE_VISION_KEY`
- `AZURE_VISION_ENDPOINT`

本機開發可用 `config.ini`，正式部署建議使用環境變數，避免把 API key 寫進 GitHub。

## GitHub 注意事項

- 不要上傳 `config.ini`，因為裡面有 API key。
- 不要上傳 `venv/`，組員可以用 `requirements.txt` 重新安裝環境。
- 不要上傳 `__pycache__/`、`*.pyc`、log 檔等自動產生檔案。
- 如果 API key 曾經被推上 GitHub，建議到 Azure 或 Google 平台重新產生 key。

## 目前限制

- 食品健康分級是營養標示輔助判斷，不是醫療建議。
- OCR 結果會受到圖片清晰度、角度、光線與拍攝角度影響。
- 若圖片只有成分表、沒有營養標示數值，系統可能只能提供風險提示，無法精準分級。
- AI 回覆可能會受到模型狀態與 API 回應影響，因此後端保留本地規則作為基本防護。

## 學習重點

這個專案練習到的不只是網頁畫面，也包含資訊系統開發常見的整合能力：

- 前後端如何透過 HTTP API 傳遞資料。
- Flask 如何同時處理頁面路由與 JSON API。
- 檔案上傳時如何檢查副檔名、大小與空檔案。
- API key 為什麼要用設定檔或環境變數管理。
- 部署時為什麼需要 WSGI server，例如 Gunicorn，而不是直接使用 Flask debug server。
