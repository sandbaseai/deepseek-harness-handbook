---
title: Fix Dollar Sign Corruption in DeepSeek Harness tapIndex Plugins
locale: en
content_revision: 1
status: canonical
verified_at: 2026-08-19
---

# Fix dollar sign corruption in `tapIndex` plugins

Use this guide when a plugin-injected script contains `return '$' + value`, but the served HTML contains an unexpected `</html>` fragment and the browser reports `SyntaxError: Invalid or unexpected token`.

## The correction

DeepSeek Harness rc.7 does not implement a dollar-sign replacement in its HTML pipeline. `WebServer.applyIndexTaps()` passes the current HTML string to each registered transform and assigns the returned string.

The corruption can occur inside a plugin transform like this:

```js
html.replace('</html>', `${injectedScript}</html>`)
```

The second argument is a JavaScript replacement string. In replacement strings, `$'` means “insert the portion of the input after the matched substring.” A script fragment containing a single-quoted dollar value creates that exact `$'` sequence.

## Safe insertion shapes

Prefer a replacement callback:

```js
html.replace('</html>', () => `${script}</html>`)
```

The callback return value is inserted literally and does not interpret replacement tokens.

An explicit slice is also safe and makes a missing anchor visible:

```js
const at = html.lastIndexOf('</html>')
if (at === -1) throw new Error('index HTML has no closing html tag')
return `${html.slice(0, at)}${script}${html.slice(at)}`
```

Avoid fixing only the observed currency string with double quotes or `String.fromCharCode(36)`. That hides one payload while leaving the transform unsafe for future plugin content.

## Diagnostic order

1. Save the original plugin payload and the served index response.
2. Locate the first transform where their bytes diverge.
3. Search plugin `tapIndex` callbacks for `String.replace` with a dynamic string second argument.
4. Replace it with a callback or slice-based insertion.
5. Restart the Host so the Node-side plugin transform reloads.
6. Fetch the served HTML and run a browser syntax check.

## Regression matrix

The transform must preserve `'$'`, `$&`, prefix tokens, `$1`, and `$$` literally. Also verify that a page without `</html>` fails loudly or uses an intentional fallback, and that multiple index taps preserve registration order.

## Source boundary

Verified against DeepSeek Harness `0.1.0-rc.7` commit `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`.

- [Upstream Discussion #3393](https://github.com/deepseek-ai/deepseek-harness/discussions/3393)
- [`WebServer.tapIndex` and `applyIndexTaps`](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/host/webserver/src/index.ts)
- [Official webserver contract](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/host/webserver/README.md)
- [Safe boot-manifest insertion by slicing](https://github.com/deepseek-ai/deepseek-harness/blob/99f6f02fecdb7dff40c3fbc9470f5907c29f74ca/packages/client/modules/src/index.ts)
- [MDN replacement string patterns](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement)
