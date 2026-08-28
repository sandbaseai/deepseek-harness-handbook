---
title: 능력별 Awesome DeepSeek Harness 생태계 리소스
locale: ko
source: docs/en/ecosystem/awesome-resources.md
source_revision: 11
status: reviewed
verified_at: 2026-08-28
---

# 능력별로 고르는 DeepSeek Harness 리소스

[Awesome DeepSeek Harness](https://github.com/0xsline/awesome-deepseek-harness)는 DSH 플러그인, 도구, 운영 리소스를 모은 공개 카탈로그입니다. 이 문서는 전체 목록을 복사하지 않고 Agent 설계와 검증에 유용한 대표 항목을 문제별로 정리합니다.

## Agent 워크플로에 유용한 대표 항목

| 분야 | 리소스 | 먼저 확인할 것 |
|---|---|---|
| Agent 비교 | [dsh-agent-arena](https://github.com/LeemanCheung/dsh-agent-arena) | worktree 격리와 결정적 검증. |
| 멀티 Agent | [dsh-collaboration](https://github.com/Socialist-Sister/dsh-collaboration) | dispatch protocol, 모델 roster, 권한. |
| 백그라운드 Agent | [dsh-background-agents](https://github.com/PerryLink/dsh-background-agents) | 자식 Session 수명, scope, 중단. |
| 컨텍스트 | [dsh-context](https://github.com/bowenliang123/dsh-context) | token 측정과 압축 이벤트 증거. |
| MCP 검색 | [dsh-mcp-lens](https://github.com/labmimors/dsh-mcp-lens) | 지연 연결, schema, 캐시 한도. |
| 메모리 거버넌스 | [dsh-memory-gate](https://github.com/GIT121995/dsh-memory-gate) | claim 권한, scope 격리, 주입 한도. |
| 웹 검색 | [dsh-free-web-search](https://github.com/delef/dsh-free-web-search) | fallback 순서, 외부 전송, 캐시. |
| 운영 거버넌스 | [dsh-security-audit](https://github.com/dsh-external/dsh-security-audit) | provenance, network, redaction, rollback. |
| Codex 스타일 Web UI | [dsh-codex-ui](https://github.com/MichengAI/dsh-codex-ui) | 공개 extension point 기반 workspace, Session tree, 검색과 turn 탐색. |
| 중첩 follow-up | [dsh-nested-followups](https://github.com/sluminositys/dsh-nested-followups) | 격리된 자식 Session; ancestry, tool scope와 브랜치 간 쓰기를 확인. |

## 추가 에이전트 리소스

상위 카탈로그에서 모델 비교용 [dsh-dual-model-eval](https://github.com/huangdaxianer/dsh-dual-model-eval), 계획용 [dsh-plans](https://github.com/Optim-Agent/dsh-plans), 팀 실행용 [dsh-agent-team-gui](https://github.com/toolclub/dsh-agent-team-gui), 컨텍스트 압축용 [dsh-context-compressor](https://github.com/qwert702/dsh-context-compressor), 웹 검색용 [dsh-web-search-pro](https://github.com/anweat/dsh-web-search-pro), 체크포인트 공유용 [task-passport](https://github.com/dongsheng123132/task-passport), 지속 개선용 [dsh-continual-evolve](https://github.com/ZK-Andy/dsh-continual-evolve), 지식 패키지용 [dsh-kb-sieve](https://github.com/omdsh-dev/dsh-kb-sieve), 중영 커뮤니티 디렉터리 [fendouai/awesome-deepseek-harness](https://github.com/fendouai/awesome-deepseek-harness)를 추가했습니다. 설치 전 권한, 호환성, 롤백 절차를 확인하세요.

## 네 가지 안전한 시작 경로

비교는 `dsh-agent-arena`, 감독형 팀은 `dsh-collaboration`, 연구·기억은 `dsh-deep-research` + `dsh-memory-gate`, 운영 통제는 `dsh-security-audit`부터 시작합니다. 전체 카탈로그를 한꺼번에 활성화하지 말고 manifest, 로드된 module, network, token/cost, 제거 결과를 기록하세요.

목록에 있다는 사실은 안전성·호환성·유지보수를 보장하지 않습니다. 실제 profile에 넣기 전에 README, license, manifest, install script와 최근 변경을 확인하고 복사한 profile에서 무해한 probe와 rollback을 실행합니다.

## 주목도 높은 커뮤니티 프로젝트

아래는 공개되어 있고 현재 커뮤니티 발견 신호가 강한 프로젝트입니다. 인기는 안전성이나 호환성 보장이 아니므로 권한, 설치 계약, 릴리스 이력을 직접 확인하세요.

| 분야 | 리소스 | 먼저 확인할 것 |
|---|---|---|
| 플러그인 목록 | [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) | 각 항목의 공개 상태와 DSH 버전. |
| 컨텍스트 관측 | [dsh-context](https://github.com/bowenliang123/dsh-context) | token 측정, 압축 이벤트, 세션 외 데이터. |
| 비전 브리지 | [modlens](https://github.com/liustack/modlens) | 이미지 경로, 외부 전송, 구조화 출력. |
| Agent 팀 | [dsh-agent-teams](https://github.com/NanmiCoder/dsh-agent-teams) | 하위 Agent 권한, 공유 workspace, 중단 처리. |
| 모바일 접근 | [dsh-pocket](https://github.com/shaobeichen/dsh-pocket) | LAN/공개 접근과 인증 경계. |
| 실전 가이드 | [DeepSeek Harness Orange Book](https://github.com/alchaincyf/deepseek-harness-orange-book) | 고정 버전 실측과 일반 조언의 구분. |

## 출처

- [Awesome DeepSeek Harness README](https://github.com/0xsline/awesome-deepseek-harness/blob/main/README.md)
- [Awesome DeepSeek Harness catalog](https://github.com/0xsline/awesome-deepseek-harness/blob/main/CATALOG.md)
- [Community plugin audit guide](../../en/security/community-plugin-audit.md)
