# Git 자동 동기화 설정 가이드

**설정 일시**: 2026-02-07  
**상태**: ✅ 활성화됨

---

## 📋 설정 개요

mni-acv 프로젝트는 **Git hooks를 통한 자동 동기화**가 설정되어 있습니다.

### 동기화 구조

```
로컬 개발
    ↓
git commit (또는 webdev_save_checkpoint)
    ↓
post-commit hook 실행
    ↓
자동으로 GitHub에 푸시
    ↓
https://github.com/ulysseschoi-mni/mni-acv 업데이트
```

---

## 🔧 활성화된 Hooks

### 1. post-commit hook
**파일**: `.git/hooks/post-commit`  
**동작**: 커밋 후 자동으로 현재 브랜치를 GitHub에 푸시  
**실행 시점**: `git commit` 완료 후

```bash
#!/bin/bash
GITHUB_REMOTE="github"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push $GITHUB_REMOTE $CURRENT_BRANCH 2>/dev/null &
exit 0
```

**특징**:
- 백그라운드에서 실행 (커밋 프로세스 블로킹 없음)
- 푸시 실패해도 커밋은 완료됨
- 모든 브랜치에 적용

### 2. post-push hook
**파일**: `.git/hooks/post-push`  
**동작**: 푸시 후 모든 브랜치를 GitHub에 동기화  
**실행 시점**: `git push` 완료 후

```bash
#!/bin/bash
GITHUB_REMOTE="github"
git push $GITHUB_REMOTE --all 2>/dev/null &
exit 0
```

**특징**:
- Manus checkpoint 저장 시 자동 동기화
- 모든 브랜치 동기화
- 백그라운드 실행

---

## ✅ 사용 방법

### 일반 개발 워크플로우

```bash
# 1. 코드 수정
# 2. 변경 사항 스테이징
git add .

# 3. 커밋 (자동으로 GitHub에 푸시됨)
git commit -m "feat: Add new feature"
# ↑ 이 시점에 post-commit hook이 실행되어 자동으로 GitHub에 푸시됨

# 4. GitHub에서 확인
# https://github.com/ulysseschoi-mni/mni-acv
```

### Manus Checkpoint 워크플로우

```bash
# 1. Manus UI에서 webdev_save_checkpoint 실행
# 2. Manus가 내부적으로 git commit 실행
# 3. post-commit hook이 자동으로 GitHub에 푸시
# 4. GitHub 저장소가 자동으로 업데이트됨
```

---

## 🔍 동기화 상태 확인

### GitHub 저장소 확인
```bash
# 최신 커밋이 GitHub에 반영되었는지 확인
git log --oneline -5
# 또는 https://github.com/ulysseschoi-mni/mni-acv 방문
```

### Git remote 확인
```bash
git remote -v
# 출력:
# github  https://github.com/ulysseschoi-mni/mni-acv.git (fetch)
# github  https://github.com/ulysseschoi-mni/mni-acv.git (push)
# origin  s3://vida-prod-gitrepo/... (fetch)
# origin  s3://vida-prod-gitrepo/... (push)
```

### Hook 상태 확인
```bash
ls -la .git/hooks/post-commit .git/hooks/post-push
# 출력: -rwxrwxr-x (실행 권한 있음)
```

---

## ⚠️ 주의사항

### 1. 네트워크 연결 필수
- GitHub에 푸시하려면 **인터넷 연결 필수**
- 오프라인 상태에서는 로컬 커밋만 가능

### 2. GitHub 인증
- GitHub CLI (`gh`)가 미리 설정되어 있어야 함
- SSH 키 또는 Personal Access Token 필요

### 3. 푸시 실패 시
- Hook이 실패해도 **로컬 커밋은 완료됨**
- 수동으로 `git push github main` 실행 가능

### 4. 대용량 파일
- 미디어 파일은 S3에 업로드 후 URL 참조
- 대용량 파일을 git에 커밋하면 푸시 시간 증가

---

## 🔄 Hook 비활성화 방법

### 임시 비활성화
```bash
# Hook 실행 권한 제거
chmod -x .git/hooks/post-commit .git/hooks/post-push

# 다시 활성화
chmod +x .git/hooks/post-commit .git/hooks/post-push
```

### 완전 제거
```bash
# Hook 파일 삭제
rm .git/hooks/post-commit .git/hooks/post-push
```

---

## 📊 동기화 로그 확인

### GitHub 커밋 히스토리
```bash
# 로컬에서 최신 커밋 확인
git log --oneline -10

# GitHub에서 확인
# https://github.com/ulysseschoi-mni/mni-acv/commits/main
```

### 푸시 실패 로그
```bash
# 수동으로 푸시 시도 (에러 메시지 확인)
git push github main -v
```

---

## 🎯 권장 사항

### 1. 정기적인 GitHub 확인
- 주 1회 GitHub 저장소에서 최신 커밋 확인
- 동기화 누락 여부 검증

### 2. 주요 변경 사항 체크포인트
```bash
# 중요한 기능 완성 후
webdev_save_checkpoint
# ↓ 자동으로 GitHub에 푸시됨
```

### 3. 브랜치 관리
```bash
# 새 브랜치 생성 시
git checkout -b feature/new-feature
git commit -m "feat: New feature"
# ↓ 자동으로 GitHub에 푸시됨
```

---

## 📞 문제 해결

### Hook이 실행되지 않는 경우

**확인 사항:**
```bash
# 1. Hook 파일 존재 확인
ls -la .git/hooks/post-commit

# 2. 실행 권한 확인
test -x .git/hooks/post-commit && echo "실행 권한 있음" || echo "실행 권한 없음"

# 3. Hook 내용 확인
cat .git/hooks/post-commit
```

**해결:**
```bash
# 실행 권한 추가
chmod +x .git/hooks/post-commit .git/hooks/post-push

# Hook 재생성
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
git push github $(git rev-parse --abbrev-ref HEAD) 2>/dev/null &
exit 0
EOF
chmod +x .git/hooks/post-commit
```

### GitHub 푸시 실패

**확인:**
```bash
# 수동 푸시 시도
git push github main -v

# 에러 메시지 확인
# - 인증 오류: GitHub 인증 재설정
# - 네트워크 오류: 인터넷 연결 확인
# - 권한 오류: GitHub 저장소 접근 권한 확인
```

---

## 📝 설정 이력

| 날짜 | 작업 | 상태 |
|------|------|------|
| 2026-02-07 | post-commit hook 생성 | ✅ 완료 |
| 2026-02-07 | post-push hook 생성 | ✅ 완료 |
| 2026-02-07 | 자동 동기화 활성화 | ✅ 활성화 |

---

## 🚀 다음 단계

이제 다음과 같이 개발을 진행하면 됩니다:

1. **로컬에서 코드 수정**
2. **`git commit` 실행** (또는 Manus에서 checkpoint 저장)
3. **자동으로 GitHub에 푸시됨** ✨
4. **GitHub에서 최신 코드 확인 가능**

더 이상 수동으로 GitHub에 푸시할 필요가 없습니다!
