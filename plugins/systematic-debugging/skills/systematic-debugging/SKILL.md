---
name: systematic-debugging
description: Root-cause debugging workflow for bugs, test failures, build failures, unexpected behavior, performance problems, and integration issues. Use before proposing or implementing fixes, especially after failed fix attempts or when a failure spans multiple components.
---

# Systematic Debugging

## Core Principle

Always find the root cause before attempting fixes. Symptom fixes are failure.

## The Iron Law

```text
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

## Workflow

Use this process for any bug, test failure, unexpected behavior, performance problem, build failure, or integration issue, especially under time pressure or after a previous fix failed.

### Phase 1: Root Cause Investigation

1. Read error messages and stack traces completely. Note line numbers, file paths, and error codes.
2. Reproduce consistently. Record the exact steps. If the issue is not reproducible, gather more data instead of guessing.
3. Check recent changes: git diff, new dependencies, config changes, env changes, or generated files.
4. For multi-component systems, add logging at each boundary and run once to find where it breaks. Then investigate that layer only.
5. Trace data flow backward from the error to its origin. Fix at the source, not at the symptom.

### Phase 2: Pattern Analysis

1. Find working examples of similar code in the same codebase.
2. Compare against the reference implementation completely. Do not skim.
3. List every difference, however small.
4. Understand dependencies: required config, environment variables, data shape, ordering assumptions, and runtime assumptions.

### Phase 3: Hypothesis and Testing

1. State the hypothesis clearly: "I think X is the root cause because Y."
2. Test the smallest possible change, one variable at a time.
3. If the hypothesis works, move to implementation. If it does not work, form a new hypothesis instead of stacking fixes.
4. If something is unclear, say "I don't understand X" and investigate it. Do not pretend to know.

### Phase 4: Implementation

1. Create the simplest failing reproduction first when feasible: a test, one-off script, command, or minimal UI/API path.
2. Implement one fix that addresses the root cause. Do not bundle unrelated refactoring.
3. Verify that the reproduction passes, existing checks still pass, and the original issue is actually resolved.
4. If the fix fails, count attempts. For fewer than three attempts, return to Phase 1. At three or more failed attempts, stop, question the architecture, and discuss before trying another fix.

## Red Flags

Stop and return to Phase 1 when any of these appear:

- "Quick fix for now, investigate later"
- "Just try changing X and see"
- "It's probably X, let me fix that"
- Proposing a fix before tracing data flow
- Each fix reveals a new problem elsewhere

## Common Rationalizations

| Excuse | Reality |
| --- | --- |
| "Issue is simple" | Simple issues have root causes too |
| "Emergency, no time" | Systematic is faster than guess-and-check thrashing |
| "Multiple fixes at once saves time" | This prevents isolating what worked and can cause new bugs |
| "I see the problem, let me fix it" | Seeing symptoms is not the same as understanding root cause |

## When There Seems To Be No Root Cause

If the issue is truly environmental, timing-related, or external, document what was investigated, implement appropriate handling such as retry, timeout, or clearer error messaging, and add monitoring where useful.

Most "no root cause" conclusions come from incomplete investigation. Double-check before settling there.
