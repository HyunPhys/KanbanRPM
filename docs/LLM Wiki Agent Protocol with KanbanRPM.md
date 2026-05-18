# LLM Wiki Agent Protocol

This vault is a Karpathy-style LLM Wiki for a research-oriented personal knowledge system.

The agent's job is not just to answer questions. The agent maintains a persistent, compounding wiki layer that sits between immutable raw sources and high-quality research outputs.

This vault may also contain KanbanRPM project-management data. The LLM Wiki is the knowledge layer; KanbanRPM is the project-management and execution layer. Do not confuse project-management notes with verified knowledge notes.

## Core Architecture

Always preserve the 3-layer architecture:

```text
raw/      immutable source layer
wiki/     LLM-compiled knowledge layer
output/   manuscript, figure, slide, proposal, rebuttal layer
archive/  legacy backup and deprecated material
```

KanbanRPM, if present, is outside this knowledge architecture:

```text
KanbanRPM Workspace/   project-management and execution layer
```

KanbanRPM may link to `wiki/` notes, and `wiki/` notes may inform KanbanRPM planning, but KanbanRPM documents are not primary knowledge sources.

## Hard Rules

1. Never modify `raw/`.
2. When creating, deleting, or renaming a `wiki/` page, update `wiki/index.md`.
3. Append every meaningful operation to `wiki/log.md`.
4. Use Obsidian wikilinks for internal references.
5. Every `wiki/` page must have YAML frontmatter.
6. If contradictions are found, cite both sides.
7. Source summaries must stay factual; synthesis belongs in concept/project pages.
8. For queries, read `wiki/index.md` first; use `raw/` only when needed.
9. Prefer updating existing pages over creating new pages.
10. Keep each `wiki/index.md` entry to one line, under 120 characters.
11. Do not ingest `KanbanRPM Workspace/` by default.
12. Do not treat KanbanRPM operational notes as verified knowledge claims.
13. If a KanbanRPM note contains reusable knowledge, extract the knowledge into an appropriate `wiki/` page instead of ingesting the KanbanRPM note directly.

## User Research Context

The user is a PhD researcher in Materials Science and Engineering at Seoul National University.

Core research:

- 2D materials, especially TMDs and multilayer graphene
- moire structures and atomic reconstruction
- stacking domains, dislocation networks, and moire reconstruction
- in-situ TEM, DF-TEM, 4D-STEM, SAED
- GSFE, energy landscape, multislice and kinematical simulations
- electronic ferroelectricity, moire-engineered quantum systems
- neuromorphic device applications

The wiki should support physical reasoning across:

```text
Material -> Structure -> Physics -> Evidence -> Simulation -> Device / Output
```

## KanbanRPM Boundary Rules

KanbanRPM is allowed in the same vault, but it must remain conceptually separate from the LLM Wiki.

Treat these as knowledge sources:

- `wiki/`
- `raw/`
- source/literature notes routed for ingest
- concept, method, project, MOC, paper, experiment, code, and output pages inside `wiki/`

Treat these as project-management or operations data:

- `KanbanRPM Workspace/`
- `KanbanRPM Workspace/cards/`
- `KanbanRPM Workspace/timeline/`
- `KanbanRPM Workspace/routines/`
- `KanbanRPM Workspace/Research Logs.md`
- `KanbanRPM Workspace/KanbanRPM Management Brief.md`
- meeting notes
- daily notes
- timeline memos
- routine logs
- unchecked checkbox tasks

When ingesting or maintaining the LLM Wiki, exclude by default:

- `KanbanRPM Workspace/`
- `.obsidian/`
- `attachments/`
- generated management briefs
- timeline memo files
- routine logs
- any file with `kanban_rpm: true` in YAML frontmatter

KanbanRPM files may contain useful links to knowledge notes, but KanbanRPM files themselves are operational context unless the user explicitly says otherwise.

Never treat the following KanbanRPM sections as factual scientific claims without verification:

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
- meeting-derived action items

These are operational signals, not knowledge claims.

## KanbanRPM Query Mode

Use KanbanRPM only when the user explicitly asks about project management, task planning, execution state, next actions, blockers, waiting states, routines, timelines, Gantt planning, research logs, or management advice.

For project-management synthesis, read:

1. `KanbanRPM Workspace/KanbanRPM Management Brief.md`
2. Relevant `Project`, `Subproject`, and `Big Action` notes
3. Linked `wiki/` notes only when background knowledge is needed

When answering with both LLM Wiki and KanbanRPM context, clearly separate:

```markdown
# Knowledge Context

# Current Project Status

# Risks / Blockers

# Recommended Next Actions

# Notes To Update
```

The LLM Wiki remains the knowledge source of truth. KanbanRPM remains the project-management source of truth.

## Cross-Linking Rules

It is good for KanbanRPM notes to link to LLM Wiki notes.

Good links:

- `Project` -> relevant concept notes
- `Subproject` -> relevant method or project notes
- `Big Action` -> experimental method, analysis method, sample, or literature notes
- writing cards -> source/literature notes
- analysis cards -> simulation or data-processing notes

Avoid copying large knowledge content into KanbanRPM notes. Prefer linking to stable `wiki/` notes.

If project work reveals reusable knowledge, create or update a `wiki/` page and link back to it from KanbanRPM.

## Operating Mode

When asked to ingest a source:

1. Read `wiki/index.md`.
2. Read the selected source from `raw/`.
3. Confirm the source is not inside `KanbanRPM Workspace/` unless explicitly instructed.
4. Identify affected pages.
5. Update existing pages first.
6. Create source summary pages only when useful.
7. Update project/concept/MOC pages.
8. Update `wiki/index.md`.
9. Append to `wiki/log.md`.

When asked a research question:

1. Read `wiki/index.md`.
2. Read relevant wiki pages.
3. Use raw sources only for verification or missing details.
4. Do not use KanbanRPM unless the question asks about project state, task planning, blockers, timelines, or management.
5. Answer with links to wiki pages where possible.
6. If the answer is reusable, file it back into `wiki/`.
7. Append to `wiki/log.md` if it changes the wiki.

When asked for project management advice:

1. Read `KanbanRPM Workspace/KanbanRPM Management Brief.md` if it exists.
2. Read relevant KanbanRPM `Project`, `Subproject`, and `Big Action` notes.
3. Follow links into `wiki/` only when knowledge context is needed.
4. Separate source-grounded knowledge from project status and recommendations.
5. Suggest updates to KanbanRPM notes, but do not rewrite them unless explicitly asked.

When maintaining the wiki:

1. Look for orphan pages.
2. Look for stale or contradictory claims.
3. Look for concepts mentioned repeatedly but missing pages.
4. Suggest source ingest targets.
5. Keep `wiki/index.md` and `wiki/log.md` current.
6. Do not count KanbanRPM operational notes as orphaned wiki pages.

## Page Types

Use these primary page types:

- `concept`
- `paper`
- `experiment`
- `code`
- `project`
- `moc`
- `output`
- `index`
- `log`

Detailed schema lives in [[wiki/Operations/Migration/04. Schema and Workflow]].

Narrative and depth standards live in [[wiki/Operations/Wiki Writing Style Guide]]. When compiling `wiki/` pages, follow the user's raw-note reasoning style:

```text
question -> gap -> mechanism -> evidence -> critique -> my interpretation -> next action
```

Do not create shallow encyclopedia-style pages. A useful wiki page must preserve mechanism, evidence, limitations, and research relevance whenever the source allows it.

Compiled pages should separate source-grounded knowledge from research interpretation:

```markdown
# Knowledge Base

# Research Synthesis
```

`Knowledge Base` is the Wikipedia-like layer: neutral, structured, and source-grounded. Put definitions, background, mechanisms, equations, evidence, and established examples there.

`Research Synthesis` is the user's working-research layer. Put interpretations, project relevance, caveats, claim-evidence logic, open questions, next actions, and output use there.

Do not mix speculative interpretation into `Knowledge Base`. If a statement is a source fact, cite it; if it is a working claim or inference, place it under `Research Synthesis`.

Reference convention:

- Use a `# References` heading instead of `# Sources` in compiled wiki pages.
- Split references into `## Wiki Notes` and `## Raw Notes`.
- Cite raw notes as Obsidian wikilinks by note name, e.g. `[[TTT Analysis]]`, not as backticked raw paths.
- Add footnotes for important claims, numbers, or literature-dependent mechanisms. Footnotes may cite wiki notes, raw notes, or external literature.

Math and figure convention:

- Write equations in Obsidian/MathJax-compatible LaTeX.
- Use inline math as `$...$` and display math as `$$...$$`.
- Do not leave equations as plain ASCII when a real mathematical expression is intended.
- If a raw note includes an image that is useful for reasoning, evidence, or future output, embed it in `wiki/` with Obsidian syntax such as `![[filename.png]]`.
- Embedded images should support the argument; avoid decorative image embeds.
- When embedding a raw image, keep the source relationship clear through nearby text, a footnote, or the `# References` section.

## Migration Policy

Do not directly move legacy notes into `wiki/` as-is.

Use this pipeline:

```text
legacy note -> source layer -> LLM ingest -> compiled wiki page
```

Legacy content has been physically migrated into `raw/legacy-vault/`.

Current legacy source routing lives in [[wiki/Operations/Legacy Source Map]].

## First Pilot

The first recommended pilot project is:

```text
raw/legacy-vault/research-and-work/310. 연구/(TTT) Twisted Trilayer TMD/
```

Expected compiled wiki outputs:

- `wiki/Projects/Twisted Trilayer TMD.md`
- `wiki/MOCs/Moire Ferroelectricity MOC.md`
- `wiki/Knowledge/Materials/WSe2.md`
- `wiki/Knowledge/Structures/Stacking Domain.md`
- `wiki/Knowledge/Structures/Moire Reconstruction.md`
- `wiki/Knowledge/Physics/Electronic Ferroelectricity.md`
- `wiki/Knowledge/Methods/DF-TEM.md`
- `wiki/Knowledge/Methods/4D-STEM.md`
- `wiki/Knowledge/Simulation/GSFE.md`

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:

- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure.
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files.
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep. These traverse the graph's EXTRACTED + INFERRED edges instead of scanning files.
- After modifying code files in this session, run `graphify update .` to keep the graph current. AST-only, no API cost.
