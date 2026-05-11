# 開發與合併流程

`main` 分支受保護，所有變更必須走 Pull Request。本文整理日常會用到的指令。

## Branch protection 規則

- ❌ 直接 push 到 `main` — 一律拒絕（包含 admin）
- ❌ Force push、刪除 `main`
- ✅ 必須開 PR
- ✅ Linear history（只能 squash 或 rebase merge，不留 merge commit）
- 不要求 reviewer approve（自己 merge 即可）

## 我（Claude）每次的流程

```bash
# 從乾淨的 main 開始
git checkout main && git pull origin main

# 開新 branch（命名規則：feat/、fix/、data/、docs/、chore/）
git checkout -b feat/xxx

# 改 → commit（多個邏輯單位就分多次 commit）
git add <具體檔案>
git commit -m "..."

# 推到遠端 + 開 PR
git push -u origin feat/xxx
gh pr create --title "..." --body "..."
```

完成後我會把 PR 連結貼給你。

## 你 review / 合併常用指令

### 看 PR

```bash
# 列出開啟中的 PR
gh pr list -R chester0516/gept-vocab

# PR #N 摘要
gh pr view N

# PR #N 程式碼差異
gh pr diff N

# CI / Pages workflow 狀態
gh pr checks N

# 用瀏覽器打開
gh pr view N --web
```

### 合併

```bash
# Squash + 刪除遠端 branch（推薦）
gh pr merge N --squash --delete-branch

# 只是 squash 但暫時保留 branch
gh pr merge N --squash
```

合併後同步本地：

```bash
git checkout main
git pull origin main
# 如果有 local 對應的 branch，順手刪
git branch -d feat/xxx
```

### 不滿意 PR

```bash
# 留意見
gh pr comment N --body "請改 X 與 Y"

# 直接關閉 PR（不合併）
gh pr close N --delete-branch
```

或者直接在這個 chat 裡告訴我「PR #N 改 X」，我會推新 commit 到同一個 branch（PR 會自動更新）。

## 緊急 hotfix（要繞過保護規則時）

Admin 也被擋，所以要先暫停規則：

```bash
# 1. 暫時關閉保護
gh api -X DELETE repos/chester0516/gept-vocab/branches/main/protection

# 2. 直接 commit & push 到 main
git push origin main

# 3. 重新啟用保護
gh api -X PUT repos/chester0516/gept-vocab/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true
}
JSON
```

## 網頁路徑

- 所有 PR：[github.com/chester0516/gept-vocab/pulls](https://github.com/chester0516/gept-vocab/pulls)
- Actions（部署狀態）：[github.com/chester0516/gept-vocab/actions](https://github.com/chester0516/gept-vocab/actions)
- 保護規則設定：[github.com/chester0516/gept-vocab/settings/branches](https://github.com/chester0516/gept-vocab/settings/branches)
