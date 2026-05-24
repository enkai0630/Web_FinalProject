# API Key 與安全注意事項

本專案需要 Azure Language、Azure Vision 與 Gemini API key 才能完整執行。

## 不要上傳真正的 API key

請不要把本機的 `config.ini` 上傳到 GitHub，因為裡面會放真正的 API key。

目前 `.gitignore` 已經排除：

```text
config.ini
.env
.env.*
```

## 組員如何設定

1. 複製 `config.example.ini`。
2. 改名為 `config.ini`。
3. 在 `config.ini` 裡填入自己的 API key 與 endpoint。

```powershell
Copy-Item config.example.ini config.ini
```

## 如果 key 不小心上傳了

如果真正的 API key 曾經被 commit 或推上 GitHub，即使是 private repo，也建議到 Azure 或 Google 平台重新產生 key。

原因是 Git 歷史紀錄可能仍然保留舊 key，不是刪掉檔案就一定安全。
