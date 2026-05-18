# LLM Wiki Agent Protocol

This vault is a Karpathy-style LLM Wiki for a research-oriented personal knowledge system.

## Core Principle

Maintain a persistent wiki layer between immutable sources and research outputs.

```text
raw/      immutable source layer
wiki/     compiled knowledge layer
output/   manuscript / figure / slide / proposal layer
archive/  legacy backup
```

KanbanRPM, if present, is the project-management layer, not the knowledge layer.

```text
KanbanRPM Workspace/   project-management and execution layer
```

## Hard Rules

1. Never modify `raw/`.
2. Read `wiki/index.md` first for research queries.
3. Update `wiki/index.md` when creating, deleting, or renaming `wiki/` pages.
4. Append meaningful operations to `wiki/log.md`.
5. Use Obsidian wikilinks.
6. Every `wiki/` page must have YAML frontmatter.
7. Prefer updating existing pages over creating new ones.
8. Keep `wiki/index.md` entries one line and under 120 characters.
9. Cite both sides when contradictions appear.
10. Do not ingest `KanbanRPM Workspace/` by default.

## Knowledge vs Project Management

Use `wiki/` and `raw/` for knowledge questions.

Use `KanbanRPM Workspace/` only when the user asks about:

- project status
- next actions
- blockers / waiting
- timeline / routine / Gantt
- management advice

Never treat KanbanRPM operational sections as verified knowledge:

- `Current Focus`
- `Waiting`
- `Blockers`
- `Flow`
- `Timeline`
- `Timeline Log`
- `Routine`
- `Routine Log`
- `Memo`
- `Management Brief`
- unchecked checkbox tasks

If KanbanRPM contains reusable knowledge, extract it into `wiki/`.

## User Research Context

The user is a PhD researcher in Materials Science and Engineering at Seoul National University.

Core topics:

- 2D materials, TMDs, multilayer graphene
- moire structures and atomic reconstruction
- stacking domains, dislocation networks, moire reconstruction
- in-situ TEM, DF-TEM, 4D-STEM, SAED
- GSFE, multislice and kinematical simulations
- electronic ferroelectricity and moire quantum systems
- neuromorphic device applications

Reason across:

```text
Material -> Structure -> Physics -> Evidence -> Simulation -> Device / Output
```

## Operating Modes

### Ingest

1. Read `wiki/index.md`.
2. Read selected source from `raw/`.
3. Exclude `KanbanRPM Workspace/` unless explicitly instructed.
4. Update existing `wiki/` pages first.
5. Create source summaries only when useful.
6. Update `wiki/index.md` and `wiki/log.md`.

### Research Query

1. Read `wiki/index.md`.
2. Read relevant `wiki/` pages.
3. Use `raw/` only for verification or missing details.
4. Answer with wiki links where possible.
5. File reusable answers back into `wiki/` when asked or clearly useful.

### Project Management Query

1. Read `KanbanRPM Workspace/KanbanRPM Management Brief.md` if it exists.
2. Read relevant Project/Subproject/Big Action notes.
3. Follow links into `wiki/` only for knowledge context.
4. Separate knowledge, project status, risks, and recommended actions.

## Writing Standards

Compiled `wiki/` pages should preserve:

```text
question -> gap -> mechanism -> evidence -> critique -> interpretation -> next action
```

Use:

```markdown
# Knowledge Base

# Research Synthesis

# References
```

- `Knowledge Base`: neutral, source-grounded facts.
- `Research Synthesis`: interpretation, relevance, caveats, open questions.
- `References`: split into `## Wiki Notes` and `## Raw Notes`.

Use Obsidian/MathJax LaTeX for equations. Embed useful raw images with `![[filename.png]]`.

## Detailed Protocols

Read these only when needed:

- [[wiki/Operations/Migration/04. Schema and Workflow]]
- [[wiki/Operations/Wiki Writing Style Guide]]
- [[wiki/Operations/Legacy Source Map]]
- [[wiki/Operations/KanbanRPM Boundary]]
- [[wiki/Operations/Wiki Protocol]]

## graphify

If graphify exists:

- Read `graphify-out/GRAPH_REPORT.md` before architecture/codebase questions.
- Prefer `graphify query`, `graphify path`, or `graphify explain` for relationship questions.
- After code changes, run `graphify update .`.
