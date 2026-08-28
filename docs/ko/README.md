---
title: DeepSeek Harness 핸드북
locale: ko
source: docs/en/README.md
source_revision: 2
status: draft
verified_at: 2026-08-14
---

# 한국어 핸드북

Agent 관점에서 DeepSeek Harness를 이해하고 실행하며 디버깅하고 확장하기 위한 독립 커뮤니티 가이드입니다. [SandBase](https://sandbase.ai/)가 관리하지만 DeepSeek AI의 공식 프로젝트는 아닙니다.

Web UI, 모델 설정, 워크스페이스와 안전한 검증부터 시작한 뒤 Agent Loop, Tools, Session Events, Permissions, Sandbox가 하나의 Agent Runtime에서 어떻게 협력하는지 설명합니다.

- [Agent 턴과 부모-자식 수명 주기](architecture/agent-lifecycle.md): durable event와 live Agent를 구분하고 부모 dispose 시 child handoff, hung-child 회수, settlement를 검증합니다.
- [Awesome 생태계 리소스 지도](ecosystem/awesome-resources.md): Agent 비교, 협업, 컨텍스트, MCP, 메모리, 검색, 거버넌스의 시작점을 정리합니다.

이 가이드가 도움이 되었다면 [deepseek-harness-handbook에 Star](https://github.com/sandbaseai/deepseek-harness-handbook)를 눌러 주세요. 검증된 Agent 운영 지식이 더 많은 개발자에게 전달되는 데 도움이 됩니다.

영어 문서가 기준입니다. 이 한국어 문서는 현재 검토가 필요한 초안이며 명령어, 식별자, 이벤트 이름은 번역하지 않습니다.
