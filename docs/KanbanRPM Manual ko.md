# KanbanRPM Manual ko

이 문서는 KanbanRPM을 처음 쓰는 사람을 위한 한국어 manual입니다. Plugin UI에 표시되는 용어는 영어를 유지합니다.

## Core Model

```text
Project -> Subproject -> Big Action -> Checkbox task
```

- `Project`: 최상위 living document입니다. 예: `TTT`, `Lab Setup`.
- `Subproject`: Project 안의 workstream입니다. 예: `TTT Experiment`, `Glove Box Setup`.
- `Big Action`: Project/Subproject 아래에서 상태를 추적할 가치가 있는 큰 실행 단위입니다.
- `Checkbox task`: meeting note, source note, living document 본문 안에 남겨두는 작은 할 일입니다.

작은 checkbox를 전부 card로 만들지 않습니다. 중요한 것만 `Promote`해서 `Big Action`으로 올립니다.

## Open The Board

1. Obsidian `Community plugins`에서 `KanbanRPM`을 enable합니다.
2. `KanbanRPM: Open board`를 실행하거나 ribbon icon을 클릭합니다.

KanbanRPM은 필요할 때 workspace를 만듭니다.

```text
KanbanRPM Workspace/
  cards/
  arrows/
  routines/
  timeline/
  attachments/
  archive/
```

활성 living document는 `cards/` 아래에 저장됩니다. 새 문서는 primary hierarchy folder를 사용합니다.

```text
cards/Project.md
cards/Project/Subproject.md
cards/Project/Subproject/Big Action.md
```

추가 Project/Subproject link가 있어도 파일은 생성 시 선택한 primary folder에 남습니다. 기존 flat file도 계속 읽습니다.

## Status Lanes

기본 lane은 다음과 같습니다.

```text
Inbox -> Active -> Waiting -> Blocked -> Someday -> Done
```

`status`는 실행 상태입니다. quotation, drawing, deposition, analysis, writing 같은 절차 정보는 별도 `stage` field가 아니라 Markdown body에 적습니다.

`Statuses`는 plugin settings에서 전역으로 수정할 수 있습니다. 알 수 없는 status는 `Data warnings`에 표시되고, 화면에서는 첫 번째 status로 fallback됩니다.

## Create A Document

`New document`를 누르거나 lane의 `+` button을 누릅니다.

필수 field는 빨간색 `*`로 표시됩니다.

- `Title`
- `Status`
- `Type`
- `Project`: `Type`이 `Subproject` 또는 `Big Action`일 때 필수
- `Subproject`: `Type`이 `Big Action`일 때 필수

`Project`와 `Subproject`는 기존 document 목록에서 고릅니다. link를 직접 입력할 필요가 없습니다. `Big Action`은 먼저 `Project`를 고른 뒤, 해당 Project 안의 `Subproject`를 고릅니다.

선택 field는 `Advanced metadata` 아래에 있습니다.

- `Priority`
- `Category`
- `Current Focus`
- `Waiting for`
- `Blocker`
- `Next review`
- `Due date`
- `Source notes`
- `Preceded by`
- `Followed by`

`Category`는 내부적으로 `workstream_type`에 저장됩니다. KanbanRPM은 더 이상 `area`, `project_kind`, `importance`, `stage`를 주 classification field로 쓰지 않습니다.

plugin settings의 `Category set`에서 Category 목록을 수정할 수 있습니다. Category dropdown, Category filter, card display, validation은 모두 이 설정값을 사용합니다.

## Living Document Template

새 문서의 frontmatter는 짧게 유지합니다.

```yaml
kanban_rpm: true
type: big_action
id: example-big-action
status: active
primary_project: "[[TTT]]"
primary_subproject: "[[TTT Experiment]]"
projects:
  - "[[TTT]]"
subprojects:
  - "[[TTT Experiment]]"
order:
```

Hierarchy는 multi-link array로 저장합니다. `projects`, `subprojects`에는 여러 linked document를 넣을 수 있습니다. `primary_project`, `primary_subproject`는 기본 breadcrumb와 folder placement 기준입니다. 기존 `project`, `subproject` field는 fallback으로만 읽습니다.

새 문서는 plugin이 읽는 control 영역과 사용자가 자유롭게 쓰는 working 영역을 분리합니다.

```markdown
# Project Title

> [!kanban-rpm]
> type: Project
> status: active
> project: [[TTT]]
> subproject: [[TTT Experiment]]

## PM Control

### Current Focus

### Waiting

### Blockers

### Flow

### Timeline

### Routine

### References

### PM Metadata

---

## Working Notes

### Project Brief

### Desired Outcomes

### Decisions
```

`PM Control`은 KanbanRPM이 board field로 읽는 projection layer입니다. `Working Notes`는 결정, meeting summary, analysis note, quote, sample context, communication history를 자유롭게 쓰는 영역입니다. Project, Subproject, Big Action은 각 역할에 맞는 다른 `Working Notes` section을 사용합니다.

## Board Use

card 색상은 Project 소속만 나타냅니다. Project/Subproject/Big Action 역할은 fixed-width stripe gutter 안의 stripe 두께로 구분하므로, type이 달라도 card text 시작 위치가 같습니다.

`Subproject` card의 breadcrumb에는 소속 `Project`만 표시됩니다. `Big Action` card는 primary hierarchy를 두 줄로 표시합니다.

```text
Project
> Subproject
```

Project document는 status lane 안에 표시되지 않습니다. board 바로 위의 `Project notes` strip에 따로 표시됩니다. Project 이름을 클릭하면 해당 living Project document를 엽니다. `Project` filter가 `All`이면 모든 Project note를 보여주고, 특정 Project를 고르면 해당 Project note만 보여줍니다. 공간이 필요하면 `Collapse`를 누릅니다.

Toolbar의 primary action:

- `Board`, `Table`, `List`, `Timeline`
- `New document`
- `Group by Project`, `Group by Subproject`, `Flat board`
- `Refresh`
- `More`

`More` 안의 secondary action:

- `Weekly review`
- `Management brief`
- `Export arrows`
- `Normalize order`

`Search cards`, `Project`, `Subproject`, `Category` filter로 board를 좁힐 수 있습니다.

filter 옆 panel button으로 `Data warnings`, `Command center`, `Action index`를 열고 닫습니다. 닫힌 panel은 board area에서 완전히 사라집니다.

기본 grouped board는 Project filter에 따라 grouping 기준이 바뀝니다.

- `Project: All`: lane 안에서 Project별로 group합니다.
- 특정 Project 선택: lane 안에서 Subproject별로 group합니다.

여러 Project/Subproject에 연결된 card는 각 filter 결과에 나타날 수 있습니다. 화면 breadcrumb는 primary hierarchy를 사용합니다.

card를 다른 lane으로 drag하면 `status`가 바뀝니다. 같은 lane 안에서 drag하면 `order`가 바뀝니다. card 안의 button click은 drag로 시작되지 않도록 분리되어 있습니다.

`Table` view는 현재 filter에 걸린 card를 sortable row로 보여줍니다. column header를 누르면 title, project, type, status, priority, date, flow count, action count 기준으로 정렬할 수 있습니다. row 안의 `Status` dropdown으로 board로 돌아가지 않고 status를 바꿀 수 있습니다.

`List` view는 `Project -> Subproject -> Big Action` tree를 collapsible하게 보여줍니다. Project/Subproject 이름을 누르면 living document를 열고, Big Action row에는 status, date, task count가 표시됩니다.

Board card에는 왼쪽/오른쪽 flow dot이 표시됩니다. 왼쪽 dot은 incoming `Preceded by`, 오른쪽 dot은 outgoing `Followed by`입니다. 오른쪽 dot을 다른 card의 왼쪽 connector area로 drag하면 flow arrow가 생성됩니다. drop target은 보이는 dot보다 넓고, drag 중 target card가 highlight됩니다. KanbanRPM은 target card의 `Preceded by` list에 source card link를 저장합니다. 기존 `Flow` 관계는 board 위에 curved arrow로 표시됩니다. arrow를 클릭하면 확인 후 해당 flow link를 제거합니다. 선행 card가 `Done`, `Completed`, `Complete`, `완료` 같은 completion status이면 muted arrow, 아직 끝나지 않았으면 warning-colored arrow로 표시됩니다. custom status set에 completion status가 없으면 모든 flow arrow가 warning 상태로 남습니다.

## Timeline And Routine

`Timeline` view는 Laminar-style kanban-like layout입니다. 왼쪽에는 `Routine` sidebar가 있고, 위에는 range/search/display controls, 오른쪽에는 horizontal date columns가 있습니다. 기본 범위는 base date 기준 7일 전부터 7일 후까지이며, base date는 처음에는 today입니다. `Today`, `-7`, `+7`, base date field, 또는 `YYYY.MM.DD` to `YYYY.MM.DD` range field로 표시 구간을 바꿀 수 있습니다.

각 date column에는 toggle 가능한 `Memo` section과 project/subproject marker section이 들어갑니다. `Due date`, `Next review`, 날짜가 있는 unchecked small action, `Routine` item marker를 표시합니다.

Timeline은 collapsed `Statuses` filter에서 켜진 status의 card만 보여줍니다. default는 `Active`입니다. marker date가 없는 card는 date column에 표시되지 않습니다. marker title이나 recurring chip을 누르면 living document를 엽니다.

Timeline의 `Show` dropdown은 card-level field가 아니라 marker kind display filter입니다.

- `Show: Review`: review marker만 표시
- `Show: Due`: due marker만 표시
- `Show: Tasks`: 날짜가 있는 small action만 표시
- `Show: Recurring`: routine marker만 표시

Timeline Memo entry는 해당 날짜 memo를 저장한 뒤에만 `KanbanRPM Workspace/timeline/YYYY-MM-DD.md`에 저장됩니다. Timeline range를 보기만 해서는 날짜 memo file을 만들지 않습니다. `+ todo`, `+ text`, pencil icon을 누르면 date Memo modal이 열립니다. modal은 해당 date file의 `## Memo` section을 normal multi-line Markdown으로 편집합니다. preview는 간단한 Markdown heading, bullet list, paragraph, checkbox를 렌더링합니다. checked checkbox line은 취소선으로 표시되며 preview mode에서 직접 check/uncheck할 수 있습니다.

`Routine`은 card의 `### Routine` 또는 `## Routine` section에 있는 checkbox line을 읽습니다. 모든 routine에는 start date를 붙이는 것이 좋습니다.

```markdown
- [ ] Daily Lab Note Check @daily @start 2026-05-13
- [ ] Weekly TTT Review @weekly @start 2026-05-13
- [ ] TEM Data Backup @monthly @start 2026-05-13
- [ ] Change glovebox purifier @every 10d @start 2026-05-13
- [ ] Safety form audit @every 2w @start 2026-05-13
```

기존 문서의 `### Perpetual`과 `### Perpetual Log`는 legacy alias로 계속 읽습니다. 새 문서는 `### Routine`과 `### Routine Log`를 사용합니다.

`daily` routine은 Timeline range 안의 모든 날짜가 아니라 오늘 것만 Timeline과 Routine sidebar에 표시됩니다. 오늘 `Done` 처리하면 오늘의 daily routine은 숨겨집니다. `weekly` routine은 start date와 같은 요일마다 반복되고, `monthly` routine은 start date와 같은 날짜마다 반복됩니다. custom `@every` routine은 `d`, `w`, `m` unit을 지원합니다.

`Routine` sidebar는 routine을 frequency별로 묶고, 현재 Timeline range 안에서 다음에 보이는 날짜를 표시합니다. custom interval은 `Every 2D`, `Every 2W`처럼 각각 따로 묶입니다. group은 triangle toggle로 접고 펼 수 있습니다. Routine은 Timeline에 표시되려면 `@start YYYY-MM-DD`가 필요하며, 현재 range 안에 occurrence가 없는 routine은 sidebar에서 숨깁니다. `Done`을 누르면 반복 항목 자체를 영구적으로 check하지 않고 해당 card의 `### Routine Log`에 완료 기록을 Markdown table row로 남깁니다. 완료된 routine은 해당 recurrence period 동안 숨겨집니다.

Routine log format:

```markdown
### Routine Log

| Date | Routine |
| --- | --- |
| 2026-05-13 | Weekly TTT Review |
```

## Card Display Fields

settings의 `Card display fields`에서 board card에 표시할 정보를 고를 수 있습니다. frontmatter field인 `Type`, `Status`, `Priority`, `Category`뿐 아니라 body-backed field인 `Current Focus`, `Waiting`, `Blockers`, `Flow`, dates, sources, small-action summary도 켜고 끌 수 있습니다.

## Small Actions

Small action은 living document 안의 checkbox task입니다. 별도 card로 만들지 않고 Markdown body 안에 둡니다.

KanbanRPM은 Tasks-style metadata subset을 읽습니다.

```markdown
- [ ] Stack TTT sample scheduled 2026-05-10 due 2026-05-14 priority high
- [x] Confirm mask design done 2026-05-07
```

지원하는 metadata:

- `scheduled`: Tasks-style scheduled date marker 뒤의 `YYYY-MM-DD`
- `due`: Tasks-style due date marker 뒤의 `YYYY-MM-DD`
- `done`: Tasks-style done date marker 뒤의 `YYYY-MM-DD`
- `priority`: Tasks-style priority marker

board card에는 collapsible small-action row가 표시됩니다. `Small actions` row를 누르면 펼치거나 접을 수 있습니다. 펼친 small action은 원래 문서의 heading별로 묶여 표시됩니다.

card에서 small action을 직접 check/uncheck할 수 있습니다. check하면 원본 Markdown line이 `[ ]`에서 `[x]`로 바뀌고 오늘 done date가 추가되며, `### Timeline Log`에 card document로 돌아가는 Obsidian link가 포함된 최신 list item이 추가됩니다. uncheck하면 `[x]`가 `[ ]`로 돌아가고 done date는 제거되지만, Timeline Log entry는 삭제하지 않습니다.

Small-action settings:

- `Small actions collapsed by default`
- `Small action source`: `Due or scheduled only`, `Done only`, `All small actions`
- `Small action date window`: `Any date`, `Overdue only`, `Today only`, `Through tomorrow`, `Through one week`, `Through one month`

default는 `Due or scheduled only`, `Through one week`입니다. relative window는 overdue action, today, future period를 포함합니다. `Today only`와 `Overdue only`는 exact filter입니다.

## Action Index

`Action index`는 card의 `### References`에 연결된 source note에서 unchecked checkbox와 `#todo` line을 읽습니다. 원본 note는 수정하지 않습니다.

- `Open source`: source note를 엽니다.
- `Set next`: 해당 action을 card의 `### Current Focus`로 복사합니다.
- `Promote`: 해당 action으로 새 `Big Action` document를 만듭니다.

## Flow

flow link는 document body에 적습니다.

```markdown
### Flow

Preceded by:
- [[TTT Data Processing]]

Followed by:
- [[TTT Manuscript]]
```

KanbanRPM은 flow를 별도 panel보다 Board 위 connector dot과 arrow로 직접 보여줍니다. 오른쪽 dot에서 다른 card의 왼쪽 connector area로 drag하면 flow link가 생성되고, arrow를 클릭하면 확인 후 제거됩니다.

Board/Table/List surface에도 flow count와 waiting badge가 표시됩니다. broken flow link와 circular flow는 `Data warnings`에 표시됩니다. `Export arrows`는 optional 기능이며, compatibility/reference 용도로 `KanbanRPM Workspace/arrows/`에 Laminar-style arrow note를 만듭니다.

## Timeline Memo And Weekly

KanbanRPM은 더 이상 외부 Daily note에 planning line을 쓰지 않습니다. 가벼운 day note, 빠른 checkbox task, 별도 living document까지 필요 없는 reminder는 `Timeline` view의 toggle 가능한 `Memo` section에 적습니다.

각 memo cell은 아래 file에 저장됩니다.

```text
KanbanRPM Workspace/timeline/YYYY-MM-DD.md
```

`Weekly review`는 `KanbanRPM Workspace/routines/` 아래에 KanbanRPM-owned weekly review note를 생성하거나 엽니다.

`Management brief`는 `KanbanRPM Workspace/KanbanRPM Management Brief.md`를 생성하거나 갱신한 뒤 엽니다. 이 파일은 사람과 LLM이 전체 프로젝트 상태를 빠르게 읽기 위한 generated snapshot입니다. Status counts, Project sections, upcoming due/review dates, Waiting, Blocked, Flow risks, Routines, Data warnings를 포함합니다. 원천 데이터는 living document이므로 brief 자체를 source data처럼 편집하기보다는 필요할 때 다시 생성합니다.

## Data Warnings

`Data warnings`는 filter 옆 panel button으로 열고 닫습니다. 닫으면 board에서 보이지 않습니다.

주요 warning:

- 알 수 없는 `status`
- 잘못된 `priority`
- 알 수 없는 `Category`
- 빠진 `project` 또는 `subproject`
- 잘못된 `order`
- `### References` 또는 `### Flow`의 broken wikilink
- circular flow

warning row를 클릭하면 영향을 받은 document를 엽니다.

## Settings

사용 가능한 settings:

- `Workspace folder`
- `Weekly review folder`
- `Statuses`
- `Category set`
- `Card display fields`
- `Small actions`

## Troubleshooting

board가 비어 있으면 document가 `KanbanRPM Workspace/cards/` 아래에 있는지, `kanban_rpm: true`가 있는지, archived 상태가 아닌지 확인합니다.

`Action index`가 비어 있으면 `### References`에 unchecked checkbox 또는 `#todo` line이 있는 note의 wikilink가 들어 있는지 확인합니다.

## Developer Note

User-facing behavior가 바뀌면 `docs/KanbanRPM Manual.md`와 이 한국어 manual을 함께 업데이트합니다.
