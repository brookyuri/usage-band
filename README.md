# usage-band

Shows a band above the chat input with: tokens spent on the last prompt (input, output, cache), the percentage used of the 5-hour rate-limit window, and the percentage used of the weekly window. When either window reaches 80% it turns red and bold and shows the reset time. Limits appear after the first response of a session on a subscription plan.

## Install

At the prompt of a Claude Code session:

```
/plugin install usage-band --marketplace brookyuri/usage-band
```

Answer `y` to add the marketplace, then pick a scope. From a shell:

```
claude plugin install usage-band --marketplace brookyuri/usage-band
```
