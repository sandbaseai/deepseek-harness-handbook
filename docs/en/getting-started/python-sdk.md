---
title: DeepSeek Harness Python SDK Quickstart
locale: en
content_revision: 2
status: canonical
verified_at: 2026-08-28
---

# DeepSeek Harness Python SDK quickstart

The rc.2 Python SDK is a programmatic alternative to the Web UI. It starts a bundled Harness runtime, runs a checked-in Agent composition, and returns a structured result to Python.

> [!IMPORTANT]
> This page is pinned to the rc.2 source snapshot. The current `0.1.2-alpha.1` source tree no longer includes `examples/jsonrpc-agent`; do not expect the commands below to work unchanged after cloning current `master`.

## Prerequisites

- Python 3.10 or newer;
- Git;
- Linux x64/arm64 or macOS 14+ on Apple silicon;
- a DeepSeek-compatible endpoint and credential;
- a disposable workspace the Agent may modify.

The published SDK bundles its runtime, so the installed package does not require system Node.js.

## Install in a virtual environment

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
python -m venv .venv
. .venv/bin/activate
python -m pip install deepseek-harness-sdk
```

## Configure the model route

```sh
export DEEPSEEK_API_KEY=sk-your-key-here
# export DEEPSEEK_BASE_URL=http://127.0.0.1:8000/v1
# export DSH_MODEL=deepseek-v4-flash
```

Keep real credentials out of shell history, repositories, screenshots, and issue reports. Use an isolated key with a spending limit.

## Run the checked-in example

```sh
python examples/jsonrpc-agent/minimal.py \
  --workspace /absolute/path/to/workspace \
  --session-root /absolute/path/to/sessions \
  --session-id example-001 \
  "Inspect the repository and explain the failing tests. Do not modify files."
```

The script prints the final assistant response. The session root receives a JSONL log containing assembled requests and tool activity.

## Call it from Python

```python
from pathlib import Path
from deepseek_harness import DeepSeekHarness

config = Path("examples/jsonrpc-agent/minimal.cordis.yml").resolve()
workspace = Path("/absolute/path/to/workspace").resolve()
sessions = Path("/absolute/path/to/sessions").resolve()

with DeepSeekHarness(
    provider="deepseek-official",
    model="deepseek-v4-flash",
    max_tokens=49_152,
    cwd=str(workspace),
    session_root=str(sessions),
    cordis=str(config),
) as harness:
    result = harness.run(
        "Inspect the repository and explain the failing tests. Do not modify files.",
        session_id="example-001",
    )

print(result.final_response)
```

The context manager starts the runtime lazily and reuses it until exit. Reusing the same `session_id` continues the durable conversation and its persistent Bash process; use a fresh ID for independent work.

## Understand the security boundary

The official minimal composition currently uses `danger-full-access`. Its persistent Bash and editor can modify any path the runtime process can access. A polite “do not modify files” prompt is useful intent, but it is not a security boundary.

For exploratory runs:

1. use a disposable checkout or container;
2. mount only required data;
3. use a fresh session ID;
4. inspect the JSONL session log;
5. delete the test workspace and rotate exposed credentials if needed.

The persistent PTY requires a POSIX terminal substrate; this example does not support Windows Agents.

## Success evidence

- the process exits normally;
- `result.final_response` contains the final text;
- the chosen session directory contains a JSONL log;
- the response refers to files inside the intended workspace;
- no unapproved mutation occurred outside the disposable environment.

## Official sources

- [Python SDK guide](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/python-sdk.md)
- [Python SDK reference](https://github.com/deepseek-ai/deepseek-harness/tree/master/python/sdk)
- [rc.2 JSON-RPC Agent example](https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/examples/jsonrpc-agent)
