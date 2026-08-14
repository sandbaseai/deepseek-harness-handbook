---
title: DeepSeek Harness MCP Server Not Connecting
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-14
---

# MCP server not connecting or tools missing

Separate process/transport failure, discovery failure, registration conflict, and post-connect outage. They can all look like “the MCP tools are missing” in the model picker.

## Fast diagnosis

| Evidence | Likely cause |
|---|---|
| profile boots, no server tools | initial failure with `failOnStartupError: false` |
| stdio child never starts | command, args, cwd, package install, or environment |
| HTTP request cannot connect | URL, service availability, TLS, proxy, or authentication |
| discovery returns but nothing registers | duplicate `serverName`, duplicate raw tool, or namespace conflict |
| tools existed and calls now fail | transport outage during reconnect |
| tools disappear after repeated failures | reconnect attempt budget exhausted |

## Debug in order

1. Set `failOnStartupError: true` temporarily so initial connection or synchronization failure stops profile activation visibly.
2. Run the stdio command outside Harness with the same working directory—but do not print secrets.
3. For HTTP, test the exact URL from the same network environment.
4. Confirm `serverName` is unique and matches `[A-Za-z0-9_-]{1,32}`.
5. Inspect logs for reconnect attempt count, recovery, or final disablement.
6. Reload the plugin or restart the Host after fixing an exhausted outage.

## Configuration trap: missing environment

The child only receives ambient variables plus explicit `config.env` according to the active plugin behavior. Put required secrets in `config.env` via environment resolution:

```yaml
env:
  SERVICE_TOKEN: !!js process.env.SERVICE_TOKEN
```

Never replace this with a literal production token in YAML.

## Official sources

- [MCP client configuration and behavior](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/mcp/mcp-client/README.md)
- [MCP integration guide](../integrations/mcp.md)
