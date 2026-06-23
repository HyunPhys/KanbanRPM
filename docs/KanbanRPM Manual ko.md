# KanbanRPM Manual ko

KanbanRPM은 Obsidian에서 연구 프로젝트, 연구실 셋업, 장비 구매, 논문 작성, 강의, 행정 업무를 관리하기 위한 plugin입니다. 단순한 Kanban board가 아니라, 각 관리 단위를 살아있는 Markdown 문서로 유지하는 research project manager입니다.

이 문서에서는 plugin UI 용어는 영어로 유지합니다. 예: `Project`, `Subproject`, `Big Action`, `Board`, `Timeline`, `Gantt`.

## 설치법

### 현재 vault에서 사용하기

KanbanRPM은 이 vault의 plugin 폴더로 build됩니다.

```text
D:\Obsidian Vaults\Project_Manage_test\.obsidian\plugins\kanban-rpm
```

Obsidian에서 사용하려면:

1. Obsidian에서 이 vault를 엽니다.
2. `Settings` -> `Community plugins`로 이동합니다.
3. `KanbanRPM`을 enable합니다.
4. command palette에서 `KanbanRPM: Open board`를 실행하거나 ribbon icon을 클릭합니다.

기존 `Laminar`, 기존 `Kanban` plugin은 그대로 켜져 있어도 됩니다. KanbanRPM은 별도의 plugin id, view type, command, CSS class, workspace folder를 사용합니다.

### source에서 build하기

source project 위치:

```text
D:\Obsidian Vaults\Project_Manage_test\KanbanRPM
```

npm을 사용합니다.

```bash
npm install
npm run check
npm run smoke
npm run package
```

`npm run check`는 typecheck와 build를 함께 실행합니다. build 결과는 다음 위치에 생성됩니다.

```text
.obsidian/plugins/kanban-rpm/main.js
.obsidian/plugins/kanban-rpm/manifest.json
.obsidian/plugins/kanban-rpm/styles.css
```

`npm run package`는 release bundle을 만듭니다.

```text
KanbanRPM/dist/kanban-rpm-0.3.0
```

## 철학

KanbanRPM의 핵심 철학은 living docs first입니다.

```text
Project -> Subproject -> Big Action -> Checkbox task
```

- `Project`: 가장 상위 목표 또는 운영 영역입니다. 예: `TTT Manuscript`, `Lab Setup`, `Optical Contrast of h-BN`.
- `Subproject`: Project 안의 병렬 workstream입니다. 예: `TTT Experiment`, `TTT Analysis`, `Glove Box Setup`, `Furnace Purchase`.
- `Big Action`: status를 추적할 가치가 있는 의미 있는 작업 단위입니다. 예: `Stack sample 8`, `Process Kerr data`, `Send revised quotation request`.
- `Checkbox task`: 문서나 meeting note 안에 남겨두는 작은 실행 단위입니다. 필요할 때만 `Big Action`으로 승격합니다.

모든 checkbox를 card로 만들지 않는 것이 중요합니다. card는 단순 task가 아니라 문맥, 판단, 진행 상태, 기록을 담을 수 있는 workstream 또는 큰 실행 단위여야 합니다.

KanbanRPM은 Laminar에서 다음 철학을 가져옵니다.

- card는 UI에서 쓰고 버리는 물건이 아니라 file입니다.
- group/project 맥락이 중요합니다.
- arrow/flow 관계가 중요합니다.
- recurring routine이 중요합니다.
- timeline rhythm이 중요합니다.

하지만 KanbanRPM은 이 개념들을 Markdown 문서 중심으로 저장하고, `Board`, `Table`, `Timeline`, `Gantt`, `Archive`, panel view로 보여줍니다.

## Workspace 구조

KanbanRPM은 필요할 때 다음 workspace를 만듭니다.

```text
KanbanRPM Workspace/
  cards/
  communications/
  routines/
  timeline/
  attachments/
  Research Logs.md
  KanbanRPM Management Brief.md
```

living document는 `cards/` 아래에 저장됩니다.

```text
cards/Project.md
cards/Project/Subproject.md
cards/Project/Subproject/Big Action.md
```

archive된 문서는 owning Project 폴더 안에 저장됩니다.

```text
cards/Project/archive/Archived Big Action.md
```

하나의 문서가 여러 Project 또는 Subproject에 연결될 수도 있습니다. 이 경우 file 위치는 생성 시 선택한 primary hierarchy를 따르고, 나머지 연결은 metadata로 index됩니다.

## 처음 사용하는 흐름

1. `KanbanRPM: Open board`를 실행합니다.
2. `New document`를 클릭합니다.
3. `Project`를 만듭니다.
4. 해당 Project 아래에 `Subproject`를 만듭니다.
5. Project/Subproject 아래에 `Big Action`을 만듭니다.
6. `Board` lane에서 status를 관리합니다.
7. Markdown 본문에는 context, note, decision, log, small checkbox task를 작성합니다.

연구 논문 예시:

```text
Project: TTT Manuscript
Subprojects:
- TTT Background Research
- TTT Experiment
- TTT Data Processing
- TTT Analysis
- TTT Discussion / Writing
Big Actions:
- Stack sample 8
- Process sample 8 Kerr data
- Draft figure 2 discussion
```

연구실 셋업 예시:

```text
Project: Lab Setup
Subprojects:
- Glove Box Setup
- Furnace Setup
- Probe Station Setup
Big Actions:
- Request glove box revised quotation
- Finish gas line drawing
- Submit equipment purchase review
```

## Views

상단 view switcher에서 다음 view를 바꿀 수 있습니다.

- `Board`: status lane 기반 실행 view.
- `Table`: sortable, resizable overview.
- `Timeline`: Laminar-style horizontal date view. `Memo`와 `Routine`을 함께 봅니다.
- `Gantt`: date-proportional bar와 flow connector를 이용한 중장기 planning view.
- `Archive`: archive된 card를 모아 보고 `Unarchive`하는 view.

filter row에는 다음이 있습니다.

- `Project`
- `Subproject`
- `Category`
- `Show closed projects`
- `Panels`

`Panels`를 열면 다음 panel을 켜고 끌 수 있습니다.

- `Data warnings`
- `Command center`
- `Action index`
- `Research index`

## Mobile

KanbanRPM은 desktop과 mobile에서 같은 plugin과 같은 `KanbanRPM Workspace/`를 사용합니다.

- Phone layout은 review/check workflow에 맞춰져 있고 기본 진입 view는 `Timeline`입니다.
- Phone `Board`는 lane tab을 사용하며 한 번에 하나의 status lane만 보여줍니다.
- Phone `Timeline`은 `Routine`, `Memo`, scheduled/review card, small action, recurring item을 세로 agenda로 보여줍니다.
- Phone `Gantt`는 full bar/connector surface 대신 compact planning list로 표시됩니다.
- Phone `Table`은 compact card-like list로 표시됩니다. column resize는 desktop/tablet 전용입니다.
- Tablet landscape에서는 더 큰 touch target과 overflow 보정이 적용된 desktop-like Board/Gantt/Timeline을 유지합니다.

desktop에서 테스트할 때는 Obsidian developer console에서 `this.app.emulateMobile(true)`를 실행하고 pane width를 phone 크기로 줄이면 됩니다. 되돌릴 때는 `this.app.emulateMobile(false)`를 실행합니다.

## Board

`Board`는 기본 실행 화면입니다. 기본 status lane은 다음과 같습니다.

```text
Inbox -> Active -> Waiting -> Blocked -> Someday -> Done
```

status는 plugin settings에서 수정할 수 있습니다. `Statuses` checkbox filter로 board에 표시할 lane을 고를 수 있습니다.
작은 lane arrow button으로 현재 보이는 Board lane의 순서를 바꿀 수 있습니다. KanbanRPM은 사용자가 지정한 lane 순서를 기억합니다.
KanbanRPM은 `Project`, `Subproject`, `Category` filter를 view별로 따로 기억합니다. 예를 들어 `Board`는 TTT만 보이게 두고, `Timeline`은 모든 Project가 보이게 둘 수 있습니다.
`Arrows`로 Board flow arrow를 보이거나 숨길 수 있습니다. `Subprojects`와 `Big actions`로 Board에서 해당 card type을 보이거나 숨길 수 있습니다.
zoom control로 전체 Board surface를 확대/축소할 수 있습니다. zoom level은 저장됩니다.

`Project` 문서는 status lane에 들어가지 않고, board 위쪽의 `Project notes` strip에 표시됩니다. lane에는 주로 `Subproject`와 `Big Action`이 표시됩니다.

card 사용법:

- `New document`는 현재 Board filter를 반영합니다. `Project` filter가 없으면 `Project`, `Project`만 선택되어 있으면 해당 Project에 속한 `Subproject`, `Project`와 `Subproject`가 모두 선택되어 있으면 해당 부모가 미리 선택된 `Big Action`을 만듭니다.
- title을 클릭하면 원본 Markdown 문서가 열립니다.
- pencil icon을 클릭하면 metadata를 수정합니다.
- `...` menu에서 `Duplicate`, `Archive`, `Delete`를 실행합니다.
- lane 사이로 drag하면 `status`가 변경됩니다.
- lane 내부에서 drag하면 `order`가 변경됩니다.
- `Details`는 덜 중요한 metadata를 접어둡니다.
- `Small actions`는 문서 안 checkbox task를 접었다 펼칩니다.

## Table

`Table`은 여러 항목을 한눈에 비교하기 위한 view입니다.

사용법:

- column header를 클릭하면 sort됩니다.
- 검정 삼각형은 sort 방향을 나타냅니다.
- column 경계를 drag하면 width를 조정할 수 있습니다.
- title을 클릭하면 living document가 열립니다.
- status와 priority는 badge로 표시됩니다.

## Timeline

`Timeline`은 Laminar에서 영감을 받은 날짜 중심 horizontal view입니다.

표시 항목:

- scheduled card marker
- review marker
- scheduled/due small action
- recurring `Routine`
- date `Memo`

Card marker는 글자 prefix 대신 compact icon을 사용합니다. Small-action과 recurring marker는 가벼운 chip으로 표시하고, scheduled/review card marker만 더 많은 card context를 보여줍니다. Timeline card marker에서는 card breadcrumb를 생략해 날짜 column을 더 쉽게 훑어볼 수 있게 합니다. Timeline marker의 status badge를 클릭하면 status를 변경할 수 있습니다.
small action의 날짜가 parent card의 `Scheduled date`와 같으면 Timeline은 중복을 피하기 위해 card marker만 표시합니다.
단독 small-action chip의 pencil icon을 클릭하면 source document를 열지 않고 해당 small action의 `@scheduled YYYY-MM-DD`, `@due YYYY-MM-DD`, `@priority ...` 값을 수정할 수 있습니다.
card marker 내부의 small action은 `Open`과 `Done` section으로 나뉩니다. `Open`은 기본으로 펼쳐지고, `Done`은 기본으로 접힙니다.

기본 range는 오늘 기준 7일 전부터 7일 후입니다. base date를 바꾸거나 직접 date range를 적용할 수 있습니다.
Timeline date field는 Obsidian/Electron에서 지원되는 경우 native calendar picker를 사용합니다.
zoom control로 전체 Timeline date grid를 확대/축소할 수 있습니다. zoom level은 저장됩니다.

### Memo

`Memo`는 별도의 living document로 만들 필요가 없는 가벼운 daily note입니다.

memo를 수정하고 저장할 때만 날짜별 memo file이 생성됩니다.

```text
KanbanRPM Workspace/timeline/YYYY-MM-DD.md
```

memo 내용은 Markdown preview로 렌더링됩니다. preview mode에서 checkbox를 체크/해제할 수 있습니다.

### Routine

`Routine`은 반복되는 review 또는 maintenance 작업입니다.

```markdown
### Routine

- [ ] Weekly TTT Review @weekly @start 2026-05-13
- [ ] TEM Data Backup @monthly @start 2026-05-01
- [ ] Lab cleanup @every 2w @start 2026-05-15
```

지원 schedule:

- `@daily`
- `@weekly`
- `@monthly`
- `@every 2d`
- `@every 2w`
- `@every 2m`

Routine 완료 기록은 `### Routine Log`에 Markdown table로 저장됩니다. 현재 recurrence period 안에서 완료된 routine은 다음 occurrence 전까지 sidebar에서 숨겨집니다.

### Timeline Log

각 living document는 `### Timeline Log` table을 가질 수 있습니다.

```markdown
| Date | Type | Change |
| --- | --- | --- |
```

KanbanRPM은 status 변경, 완료된 small action, 자동 `Next review` reminder event를 이 table에 기록합니다. 새 row는 위쪽에 추가됩니다.

## Gantt

`Gantt`는 중장기 흐름을 보는 planning view입니다. `Start date`, `Due date`, `Next review`를 사용합니다.
기본 Gantt range는 현재 보이는 project/card들의 가장 이른 날짜부터 가장 늦은 날짜까지입니다. 사용자가 custom date range를 적용하거나 `Auto range`로 되돌릴 수 있습니다.

scale:

- `Month+Week`
- `Quarter+Month`

동작:

- `Project`, `Subproject`, `Big Action` hierarchy를 유지합니다.
- 같은 hierarchy level 안에서는 start date가 빠른 순서로 정렬됩니다.
- `Project`와 `Subproject` row는 collapse할 수 있습니다.
- `Subprojects`와 `Big actions` toggle로 해당 row type을 보이거나 숨길 수 있습니다.
- Gantt bar는 status color를 사용합니다.
- bar를 클릭하면 `Start date`, `Due date`, `Next review`를 수정할 수 있습니다.
- Gantt date field는 Obsidian/Electron에서 지원되는 경우 native calendar picker를 사용합니다.
- zoom control로 전체 Gantt planning surface를 확대/축소할 수 있습니다. zoom level은 저장됩니다.
- 짧은 Gantt range는 남는 빈 공간이 없도록 가능한 범위에서 가로로 늘어나며, 긴 range는 week/month 최소 너비를 유지하고 가로 scroll을 사용합니다.
- bar가 너무 짧아 title이 안 보이면 bar 아래에 별도 title label이 표시됩니다.
- flow badge와 connector가 card 간 관계를 보여줍니다.
- 오른쪽 flow dot을 다른 row의 왼쪽 flow dot으로 drag하면 `Preceded by` 관계가 만들어집니다.
- connector arrow를 클릭하면 확인 후 관계를 삭제할 수 있습니다.

## Archive

`Archive`는 active work에서는 숨기고 싶지만 기록으로 남겨둘 card를 보관하는 기능입니다.

동작:

- card의 `...` menu에서 `Archive`를 실행합니다.
- archive된 file은 owning Project의 `archive/` folder로 이동합니다.
- `Archive` view에는 archive된 card만 표시됩니다.
- `Unarchive`로 원래 경로 또는 현재 hierarchy folder로 복원할 수 있습니다.

## Project Lifecycle

Project lifecycle은 card `status`와 별개입니다.

Project 전체가 더 이상 active하지 않으면 `Project notes` strip에서 `Close project`를 사용합니다. closed Project와 그 Project에만 속한 card는 기본 view에서 숨겨집니다. 다른 active Project에도 연결된 card는 계속 표시됩니다.

`Show closed projects`를 켜면 closed Project를 다시 볼 수 있고, `Reopen project`로 active 상태로 되돌릴 수 있습니다.

Project를 close해도 child card의 status는 자동 변경되지 않습니다.

## Action Index

`Action index`는 원본 문서를 수정하지 않고 small task를 모아 보여주는 panel입니다.

읽는 항목:

- living document 안의 unchecked checkbox
- `### References`에 링크된 note의 unchecked checkbox
- `#todo` line
- recurring `Routine`

small action은 자동으로 card가 되지 않습니다. 대신 다음 선택지가 있습니다.

- checkbox로 그대로 둡니다.
- card UI에서 check/uncheck합니다.
- 중요한 항목은 `Current Focus`로 올립니다.
- 일이 커지면 별도의 `Big Action`을 만듭니다.

Tasks-style metadata도 일부 읽습니다.

```markdown
- [ ] Process data ⏳ 2026-05-18 📅 2026-05-20 🔼
```

읽는 항목:

- due date: `📅 YYYY-MM-DD` 또는 `@due YYYY-MM-DD`
- scheduled date: `⏳ YYYY-MM-DD` 또는 `@scheduled YYYY-MM-DD`
- done date: `✅ YYYY-MM-DD` 또는 `@done YYYY-MM-DD`
- priority: `⏫`, `🔼`, `🔽`, `⏬` 또는 `@priority highest|high|normal|low|lowest`

Timeline에서 small action을 수정하면 KanbanRPM은 emoji metadata로 저장합니다. KanbanRPM card 안에서 small action을 체크하면 오늘 done date가 `✅ YYYY-MM-DD` 형식으로 자동 추가됩니다. 호환성을 위해 ASCII 형식도 계속 읽을 수 있습니다.

## Flow

`Flow`는 KanbanRPM의 dependency model입니다.

문서 내부 형식:

```markdown
### Flow

Preceded by:
- [[Sample fabrication]]

Followed by:
- [[Figure 2 analysis]]
```

의미:

- `Preceded by`: 이 card보다 먼저 되어야 하는 card.
- `Followed by`: 이 card 다음에 이어지는 card.

UI에서는 주로 `Preceded by`를 저장합니다. 예를 들어 A card의 오른쪽 dot을 B card의 왼쪽 dot으로 drag하면, B 문서의 `Preceded by`에 A가 추가됩니다.

Flow는 다음 위치에 표시됩니다.

- Board arrow
- Gantt connector
- `Preceded`, `Followed`, `Blocked` badge
- broken/circular flow에 대한 `Data warnings`

## Communication Source Notes

미팅, 전화, chat, email source note는 `KanbanRPM: New communication source note` 또는 `More -> New communication note`로 만들 수 있습니다.

modal에서 입력하는 항목:

- `Title`
- `Type`: `Meeting (Internal)`, `Meeting (External)`, `Call`, `Chat`, `Email`
- `Date`
- `Participants`
- `Note`

`Participants`는 comma/newline으로 직접 입력할 수 있습니다. KanbanRPM은 이전 communication source note에 나온 participant를 빈도순으로 추천합니다. 추천 participant를 클릭하면 `Participants` field에 추가되고, 이미 들어간 이름은 중복 추가하지 않습니다.

source note는 연도와 type별 폴더에 저장됩니다.

```text
KanbanRPM Workspace/communications/YYYY/Meeting (Internal)/
KanbanRPM Workspace/communications/YYYY/Meeting (External)/
KanbanRPM Workspace/communications/YYYY/Call/
KanbanRPM Workspace/communications/YYYY/Chat/
KanbanRPM Workspace/communications/YYYY/Email/
```

KanbanRPM은 연도별 log도 갱신합니다.

```text
KanbanRPM Workspace/communications/Communication Log (YYYY).md
```

log는 communication type별 heading과 Markdown table로 구성됩니다.

```markdown
| Date | Source Note | Participants | Note |
| --- | --- | --- | --- |
| 2026-06-23 | [[Weekly lab meeting]] | Prof. Kim, collaborator | Discussed next experiment |
```

Communication source note는 Project/Subproject/Big Action 문서를 자동 수정하지 않습니다. 필요한 프로젝트 문서에는 사용자가 직접 링크하거나 요약하면 됩니다.

## Research Logs

KanbanRPM은 별도의 `record` card type을 만들지 않고 Experiment/Analysis log를 지원합니다.

특정 `Category`를 가진 `Big Action`을 completion status로 옮기면 log prompt가 뜰 수 있습니다. 저장된 row는 다음 문서에 기록됩니다.

```text
KanbanRPM Workspace/Research Logs.md
```

기본 mapping:

- `experiment` Category -> `Experiment Log`
- `analysis` Category -> `Analysis Log`

`Prompt for log when moving matching Big Action to Done` setting으로 prompt를 켜거나 끌 수 있습니다.

예시:

```markdown
### Experiment Log

#### Stacking

| Date | Sample | Conditions | Result | Link |
| --- | --- | --- | --- | --- |
| 2026-05-14 | [[TTT Sample 8]] | PC, 8 wt%, 100C 7m | partial success | [[Stack sample 8]] |
```

`Research index` panel은 이 log를 읽어 보여줍니다.

## Metadata 상세 설명

KanbanRPM은 frontmatter를 짧게 유지합니다. 긴 설명은 Markdown 본문에 씁니다.

기본 frontmatter:

```yaml
kanban_rpm: true
type: project | subproject | big_action
id: stable-id
status: inbox
order:
```

hierarchy:

```yaml
primary_project: "[[TTT Manuscript]]"
primary_subproject: "[[TTT Experiment]]"
projects:
  - "[[TTT Manuscript]]"
subprojects:
  - "[[TTT Experiment]]"
```

lifecycle/archive:

```yaml
project_state: active | closed
archived: true
archived_at: 2026-05-15
archive_original_path:
archive_owner_project:
```

classification:

```yaml
workstream_type: experiment
priority: 3
```

각 field의 의미:

- `kanban_rpm`: KanbanRPM이 관리하는 문서임을 표시합니다.
- `type`: 문서 역할입니다. `Project`, `Subproject`, `Big Action`.
- `id`: 내부 추적을 위한 stable id입니다.
- `status`: Board/Table/Timeline/Gantt에 표시되는 실행 상태입니다.
- `order`: lane 내부 수동 정렬 순서입니다.
- `primary_project`: breadcrumb와 folder placement의 기본 Project입니다.
- `primary_subproject`: Big Action의 기본 Subproject입니다.
- `projects`: 연결된 모든 Project입니다.
- `subprojects`: 연결된 모든 Subproject입니다.
- `project_state`: Project lifecycle입니다. `closed`면 기본 view에서 숨겨집니다.
- `workstream_type`: UI에서는 `Category`로 표시됩니다. 저장값은 Category id이고, UI에는 Category label이 표시됩니다.
- `priority`: priority badge로 표시됩니다.
- `archived`: archive 여부입니다.

본문 section:

- `# PM Control`: plugin이 읽는 planning 영역.
- `## Current Focus`: 지금 가장 중요한 다음 focus.
- `## Waiting`: 기다리는 사람, 업체, 승인, 데이터.
- `## Blockers`: 진행을 막는 요소.
- `## Flow`: `Preceded by` / `Followed by` 관계.
- `## Timeline`: `Start date`, `Scheduled date`, `Next review`, `Due date`.
- `## Timeline Log`: 완료/리마인더 기록.
- `## Routine`: 반복 routine.
- `## Routine Log`: routine 완료 기록.
- `## References`: `Action index`가 scan할 source note.
- `## PM Metadata`: 사람이 읽기 좋은 추가 metadata.
- `# Working Notes`: 공통 Research PM heading spine을 가진 자유 작성 영역.

새 `Working Notes`는 다음 구조를 사용합니다.

```markdown
## Overview
%% Write what this note is responsible for and what success roughly means. %%

## Current Thinking
%% Capture the current interpretation, open questions, assumptions, or strategy. %%

## Work Log
%% Add dated progress notes, meeting outcomes, attempts, observations, and follow-up context. %%

## Decisions
%% Record decisions with enough context to understand why they were made. %%

## Notes
%% Put miscellaneous context, links, rough ideas, and material that does not yet fit elsewhere. %%
```

`Big Action` 문서에만 기본적으로 `## Small Actions`가 포함됩니다. `Project`와 `Subproject`에는 기본으로 `## Small Actions`를 만들지 않습니다. `%% ... %%` 줄은 Obsidian comment로, 편집 중 작성 가이드로 쓰이고 preview에서는 숨겨집니다.

## Settings

주요 settings:

- `Workspace folder`: KanbanRPM data root.
- `Statuses`: 모든 view가 사용하는 global status set.
- `Categories`: `Category`의 `id | Label` vocabulary.
- View filters: `Project`, `Subproject`, `Category` 선택값은 Board, Table, Timeline, Gantt, Archive별로 따로 저장됩니다.
- `Board status filter`: Board에 표시할 status lane.
- `Timeline status filter`: Timeline에 표시할 status.
- `Card display fields`: Board card에 표시할 정보.
- `Open Advanced metadata by default in new card modal`: 새 document 생성 창에서 Advanced metadata를 기본적으로 펼칠지 정합니다.
- `Small action display`: 어떤 small action을 card에서 보여줄지.
- `Experiment log categories`: Experiment Log prompt를 띄울 Category.
- `Analysis log categories`: Analysis Log prompt를 띄울 Category.
- `Prompt for log when moving matching Big Action to Done`: assisted capture on/off.
- `Next review reminder status`: `Next review`가 due 되었을 때 이동할 status.
- `Show closed projects`: closed Project 표시 여부.

## LLM을 이용한 management

KanbanRPM은 LLM이 UI를 해석하지 않아도 Markdown만 읽고 project 상태를 이해할 수 있도록 설계되어 있습니다.

### Layered LLM Context 생성

다음 메뉴를 사용합니다.

```text
More -> Generate LLM context
```

또는 command:

```text
KanbanRPM: Generate LLM context
```

KanbanRPM은 아래 폴더에 generated read model을 작성합니다.

```text
KanbanRPM Workspace/LLM/
```

생성되는 context:

- `00 LLM Entry.md`: LLM이 읽을 순서와 규칙.
- `01 Next Work Candidates.md`: active가 아닌 card 중 다음에 activate할 후보.
- `02 Project Map.md`: compact hierarchy map.
- `03 Recent Changes.md`: 최근 card `Timeline Log` 변경.
- `04 Open Loops.md`: waiting, blocked, blocked-by, Current Focus 누락 항목.
- `Project Briefs/*.md`: Project별 briefing 문서.

Layered context는 두 가지 workflow에 사용합니다.

1. Next work recommendation: active가 아닌 card 중 다음에 무엇을 active로 올릴지 논의합니다.
2. PM briefing: 특정 Project의 현재 상태, risk, open loop를 요약받습니다.

Research/content planning에서는 generated brief만 의존하지 않습니다. 사용자가 논의하려는 원본 living document와 관련 reference/wiki page를 직접 읽게 합니다. Generated context는 orientation 용도입니다.

Prompt template은 `docs/KanbanRPM LLM Skills.md`에 정리되어 있습니다.

- `/kanbanrpm-next`: active가 아닌 card 중 다음에 activate할 후보를 고릅니다.
- `/kanbanrpm-brief`: Project/Subproject/Big Action briefing을 받습니다.
- `/kanbanrpm-plan`: 원본 living document 기반으로 research/content 방향을 논의합니다.

### Management Brief 생성

다음 메뉴를 사용합니다.

```text
More -> Management brief
```

또는 command:

```text
KanbanRPM: Write management brief
```

생성 문서:

```text
KanbanRPM Workspace/KanbanRPM Management Brief.md
```

brief에 포함되는 내용:

- snapshot
- executive attention
- project health
- project sections
- upcoming dates
- Current Focus items
- open small actions
- waiting/blocking state
- flow risks
- routines
- recent research logs
- data warnings

### 추천 LLM prompt

```text
Read KanbanRPM Workspace/KanbanRPM Management Brief.md and the linked Project/Subproject/Big Action notes.
Give me:
1. What needs attention this week.
2. Which Projects are blocked or stale.
3. Which Big Actions should be converted, split, archived, or closed.
4. Which Current Focus items should be pulled into today.
5. Any missing metadata or unclear hierarchy.
Do not rewrite my notes unless I explicitly ask.
```

### 추천 workflow

1. `Management brief`를 생성합니다.
2. LLM에게 brief를 읽히고 review를 요청합니다.
3. LLM이 지적한 Project/Subproject/Big Action 문서를 직접 엽니다.
4. 필요한 경우 `Current Focus`, `Timeline`, `Flow`, `status`를 수정합니다.
5. KanbanRPM view에서 전체 상태가 의도대로 반영되었는지 확인합니다.

중요한 원칙은 KanbanRPM 문서들이 source of truth이고, LLM은 reviewer, summarizer, planning assistant라는 점입니다.

## 실전 사용 팁

- 장기 목표는 `Project`로 만듭니다.
- 병렬 workstream은 `Subproject`로 만듭니다.
- status 추적이 필요한 작업은 `Big Action`으로 만듭니다.
- 작은 일은 checkbox로 둡니다.
- 긴 설명은 frontmatter가 아니라 `Working Notes`에 씁니다.
- 다음 focus는 `Current Focus`에 씁니다.
- 사람, 업체, 승인, 데이터 대기는 `Waiting`에 씁니다.
- 실제 장애물은 `Blockers`에 씁니다.
- 순서가 중요한 일은 `Flow`로 연결합니다.
- 반복 review/maintenance는 `Routine`으로 관리합니다.
- 실험/분석 완료 요약은 `Research Logs.md`에 남깁니다.
- 끝난 Project는 `Close project`로 숨깁니다.
- 더 이상 active하지 않지만 기록은 필요한 card는 `Archive`합니다.

## 문제 해결

- card가 보이지 않으면 `KanbanRPM Workspace/cards/` 아래에 있는지, `kanban_rpm: true`가 있는지 확인합니다.
- status가 이상하면 `Settings` -> `Statuses`를 확인합니다.
- Category warning이 뜨면 settings에 Category를 추가하거나 `workstream_type`을 수정합니다.
- flow arrow가 깨졌다면 `### Flow`의 wikilink를 확인합니다.
- Timeline이 비어 있으면 `Scheduled date`, `Next review`, scheduled small action, visible status filter를 확인합니다.
- Gantt가 비어 있으면 `### Timeline`에 `Start date`와 `Due date`를 추가합니다.
- closed Project가 안 보이면 `Show closed projects`를 켭니다.

