---
title: DeepSeek Harness Agent 턴과 부모-자식 수명 주기
locale: ko
source: docs/en/architecture/agent-lifecycle.md
source_revision: 4
status: reviewed
verified_at: 2026-08-28
verified_upstream: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# 하나의 Agent 턴과 부모-자식 수명 주기

**step**은 모델 요청 한 번과 그 요청이 만든 도구 호출을 뜻합니다. **turn**은 여러 step을 포함할 수 있으며 런타임에 남은 작업이 없을 때 끝납니다. `turn/*`, `step/*`, `user/message`, `assistant/*`, `tool/*`은 durable log이고, `agent/*`은 실행 중인 Agent를 제어하는 이벤트입니다.

```text
입력 → inbox → driver → pre-step/컨텍스트 → 모델
    → pre-execute/execute/post-execute → tool 결과
    → step/end → 다음 step 또는 turn/end
```

## 마지막 durable event부터 분기하기

| 마지막 이벤트 | 우선 확인할 경계 |
|---|---|
| `turn/start` 없음 | inbox wakeup 또는 Agent 생성 |
| `turn/start`는 있으나 `step/start` 없음 | pre-step 결정 또는 시작 실패 |
| `step/start` 뒤 assistant 출력 없음 | Provider / 요청 경로 |
| `tool/call` 뒤 결과 없음 | 승인, 정책, Provider, 실행 |
| `step/end` 뒤 `turn/end` 없음 | queued input, continuation, stop hook |

프로세스가 살아 있다는 사실만으로 진행을 증명하지 말고 마지막 durable event, 버전, Session ID, 첫 오류를 보존합니다.

## 부모 dispose는 별도의 계약이다

상류 보고 [#4909](https://github.com/deepseek-ai/deepseek-harness/discussions/4909)는 부모 Agent가 dispose된 뒤에도 continuable child가 service/factory scope에 남을 수 있음을 보여 줍니다. 명시적인 `drainChildren()`, 영원히 `whenIdle()`을 기다리는 child, 부모가 사라진 뒤 조용히 반환하는 settlement callback은 소유권, cascade cleanup, hung-child 회수, settlement 전달이라는 네 가지 공백을 만듭니다.

```text
부모 dispose
  → child 정책 (cascade | handoff | reject)
  → 제한된 drain / 강제 회수
  → durable settlement disposition
```

최소 회귀 fixture는 아직 끝나지 않은 child를 시작하고 부모를 먼저 dispose한 뒤, child의 정상 종료와 timeout을 모두 검증해야 합니다. orphan activation이 남지 않고 settlement가 조용히 사라지지 않으며 부모 Session에 handoff·cancel·reclaim 결과가 기록되는지 확인합니다. 커뮤니티 reference patch는 main 브랜치가 이 계약을 이미 제공한다는 증거가 아닙니다.

## frontier search를 선형 driver에 넣지 않기

beam search, 가지치기, 비용 예산은 외부 controller가 후보 Session lineage, score, 폭/깊이/토큰/시간 예산과 최종 disposition을 관리하도록 합니다. 변경 가능한 Agent 객체를 제3자 scorer에 넘기지 말고 후보 ID, state digest, score 버전, 안정적인 tie-break, selected/pruned/failed/cancelled 결과를 기록합니다. 부작용이 있는 도구를 사용하는 후보는 read-only 또는 시뮬레이션으로 제한합니다.

## 검증 체크리스트

- 부모 dispose가 cascade, handoff 또는 명시적 reject가 된다.
- hung child에 timeout/force-reclaim이 있고 `whenIdle()`을 무한히 기다리지 않는다.
- settlement의 delivered, handoff, cancelled, dropped 상태를 추적할 수 있다.
- Session replay는 durable event를 읽으며 live Agent 상태를 역사로 취급하지 않는다.
- 도구 호출은 policy, approval, sandbox, telemetry 경계를 통과한다.
- 부모 선행 dispose, child 정상 완료, timeout, 중복 dispose를 테스트한다.

## 출처

- [영어 canonical 가이드](../../en/architecture/agent-lifecycle.md)
- [공식 Agent lifecycle (rc.2)](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/agent-lifecycle.md)
- [수명 주기 handoff와 orphan child 보고 #4909](https://github.com/deepseek-ai/deepseek-harness/discussions/4909)
