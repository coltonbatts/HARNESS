# Pinned local Codex protocol evidence

Generated with installed codex-cli 0.160.0 on October 7, 2026 before Stage 09 implementation:

```
codex app-server generate-json-schema --out /tmp/harness-codex-schema
codex app-server generate-ts --out /tmp/harness-codex-ts
```

These are relevant generated excerpts and self-contained schema files, plus extracted exact request/notification method lists and source binding hashes in methods.json. TypeScript excerpts are documentary, not a compiled SDK; imports refer to the full generated bundle in /tmp. HARNESS is Node stdlib JavaScript. Every unallowlisted method is refused by code and Demo tests, including unknown future names. GetAccountTokenUsageResponse has daily account tokens; estimatedUsageUsdMicros is only in ThreadUsage, which HARNESS does not request. No actual account payloads, identifiers or credentials stored here.
