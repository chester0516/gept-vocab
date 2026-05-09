# 全民英檢單字（GEPT Vocabulary）

GEPT 初級＋中級單字學習網站，含字卡翻牌、測驗、進度追蹤。

## 功能

- **字卡學習**：3D 翻牌、發音、標記已學會、收藏
- **測驗模式**：英選中、中選英、聽音選詞，可選範圍（全部 / 排除已學會 / 收藏 / 錯題）
- **單字列表**：搜尋、依等級／狀態篩選
- **進度追蹤**：已學會、收藏、錯題清單、首頁儀表板與測驗紀錄（localStorage）
- **發音**：使用瀏覽器 Web Speech API（無需第三方）

## 開發

```bash
npm install
npm run dev
```

打開 Vite 提供的 `http://localhost:5173`。

## 建置

```bash
npm run build
npm run preview
```

## 資料

- `src/data/elementary.json`：初級約 1800 字
- `src/data/intermediate.json`：中級約 1800 字

格式：

```json
{ "word": "abandon", "pos": "v.", "zh": "放棄;遺棄" }
```

> 資料以常見 GEPT 等級單字編寫，與 LTTC 官方版本可能存在少量差異。如需擴充至 2000＋4500 完整字表，可自行追加詞條至對應 JSON。

## 鍵盤捷徑

- 字卡：`←` / `→` 切換、`Space` 翻面
- 測驗：`1`–`4` 選答、`Enter` 下一題

## 目錄結構

```
src/
├── components/   # UI 元件（依模組分組）
├── hooks/        # useProgress、useSpeech
├── lib/          # data.ts、quiz.ts、progress.ts
└── data/         # 單字 JSON
```
