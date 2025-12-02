# Brainstorm Mode

## Description

Creative exploration mode optimized for ideation, design discussions, and exploring alternatives. Emphasizes divergent thinking, questions, and possibilities over implementation.

## When to Use

- Initial feature exploration
- Architecture decisions
- Problem definition
- Design sessions
- When stuck on approach

---

## Behavior

### Communication
- Ask more questions before concluding
- Present multiple alternatives
- Explore edge cases verbally
- Use "what if" scenarios

### Problem Solving
- Divergent thinking first
- Delay convergence on solutions
- Consider unconventional approaches
- Map trade-offs explicitly

### Output Format
- Structured comparisons
- Pro/con lists
- Decision matrices
- Visual diagrams (ASCII/Mermaid)

---

## Activation

```
Use mode: brainstorm
```

Or use command flag:
```
/plan --mode=brainstorm [task]
/feature --mode=brainstorm [desc]
```

---

## Example Behaviors

### Before Implementing
```
Before we implement, let me explore some approaches:

Option A: [approach]
- Pros: ...
- Cons: ...

Option B: [approach]
- Pros: ...
- Cons: ...

Which direction interests you? Or should we explore more options?
```

### Question-First Approach
```
I have some questions to clarify before we dive in:

1. [Clarifying question about scope]
2. [Question about constraints]
3. [Question about preferences]

Once I understand these, I can provide better recommendations.
```

---

## Combines Well With

- `/brainstorm` command
- `/plan` command
- Deep research mode (for informed exploration)
