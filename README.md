# 心情與食品安全 AI 助手

這是一個以 Flask 製作的網頁程式設計期末專案。系統結合 AI 對話、Azure 情緒分析、Azure Vision OCR 與 Gemini，提供兩個主要功能：

- **AI 對話**：根據使用者輸入進行情緒分析，並用 Gemini 回覆食品安全或情緒支持相關內容。
- **食品標示分析**：使用者上傳食品成分表或營養標示圖片後，系統會讀取圖片文字，分析食品健康程度與原因。

## 專案功能

### AI 對話

- 使用 Azure Language 進行情緒分析。
- 依照情緒分數切換回覆模式。
- 情緒偏低時偏向陪伴與支持。
- 情緒正常時補充食品安全與營養標示知識。

### 食品標示分析

- 支援 JPG、JPEG、PNG 圖片上傳。
- 圖片大小限制為 5MB 以下。
- 使用 Azure Vision OCR 讀取食品標示文字。
- 使用 Gemini 分析健康程度。
- 若 Gemini 回覆不穩定，後端會用本地規則解析熱量、糖、鈉、脂肪、飽和脂肪、反式脂肪等欄位，避免明明有營養標示卻回覆「無法判斷」。
- 分級包含：
  - 健康
  - 可以偶爾吃
  - 不健康
  - 無法判斷

## 專案結構

```text
web_SDGs_final_project/
├── app.py
├── config.example.ini
├── config.ini                  # 本機 API key 設定，不上傳 GitHub
├── requirements.txt
├── functions/
│   ├── azure.py                # Azure 情緒分析與 OCR
│   └── gemini.py               # Gemini 對話與食品標示分析
├── templates/
│   ├── index.html              # AI 對話頁
│   └── food_label.html         # 食品標示分析頁
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── chat.js             # AI 對話頁 JS
│       └── food_label.js       # 食品標示分析頁 JS
└── Ingredients_*.jpg           # 測試用食品標示圖片
```

## 安裝與執行

### 1. 建立虛擬環境

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. 安裝套件

```powershell
pip install -r requirements.txt
```

### 3. 建立本機設定檔

複製 `config.example.ini`，改名為 `config.ini`，並填入自己的 Azure 與 Gemini API key。

```powershell
Copy-Item config.example.ini config.ini
```

`config.ini` 內需要設定：

- Azure Language key 與 endpoint
- Azure Vision key 與 endpoint
- Gemini API key

注意：`config.ini` 內含 API key，已被 `.gitignore` 排除，不應上傳到 GitHub。

### 4. 啟動 Flask

```powershell
python app.py
```

開啟瀏覽器：

```text
http://127.0.0.1:5000/
```

食品標示分析頁：

```text
http://127.0.0.1:5000/food-label
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

### `POST /api/analyze-food-label`

用途：分析食品標示圖片。

Request：

- `multipart/form-data`
- 欄位名稱：`image`
- 支援格式：JPG、JPEG、PNG
- 大小限制：5MB 以下

Response 會包含：

- `grade`：健康分級
- `score`：健康分數
- `summary`：摘要
- `reasons`：判斷理由
- `detected_risks`：偵測到的風險
- `advice`：食用建議
- `ocr_text`：OCR 讀到的文字

## GitHub 注意事項

- 不要上傳 `config.ini`，因為裡面有 API key。
- 不要上傳 `venv/`，組員可以用 `requirements.txt` 重新安裝環境。
- 不要上傳 `__pycache__/`、`*.pyc`、log 檔等自動產生檔案。
- 如果 API key 曾經被推上 GitHub，建議到 Azure 或 Google 平台重新產生 key。

## 目前限制

- 食品健康分級是營養標示輔助判斷，不是醫療建議。
- OCR 結果會受到圖片清晰度、角度、光線影響。
- 若圖片只有成分表、沒有營養標示數值，系統可能會回「無法判斷」或只提供風險提示。
