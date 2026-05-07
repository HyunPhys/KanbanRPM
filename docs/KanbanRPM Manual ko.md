# KanbanRPM Manual ko

이 문서는 KanbanRPM을 처음 쓰는 사람을 위한 한국어 manual입니다. Plugin UI에 표시되는 용어는 영어로 유지합니다.

## Core Model

```text
Project -> Subproject -> Big Action -> Checkbox task
```

- `Project`: 최상위 living document입니다. 예: `TTT`, `Lab Setup`.
- `Subproject`: Project 안의 병렬 workstream입니다. 예: `TTT Experiment`, `Glove Box Setup`.
- `Big Action`: board에서 상태 추적할 가치가 있는 큰 실행 단위입니다.
- `Checkbox task`: meeting note, source note, living document 본문에 남겨두는 작은 할 일입니다.

작은 checkbox를 모두 card로 만들지 않습니다. 중요한 것만 `Promote`해서 `Big Action`으로 올립니다.

## Open Board

1. Obsidian `Community plugins`에서 `KanbanRPM`을 enable합니다.
2. `KanbanRPM: Open board`를 실행하거나 ribbon icon을 클릭합니다.

KanbanRPM은 필요할 때 workspace를 만듭니다.

```text
KanbanRPM Workspace/
  cards/
  arrows/
  perpetual/
  attachments/
  archive/
```

실제 Project/Subproject/Big Action 문서는 `cards/`에 저장됩니다.

## Status Lanes

기본 lane은 다음과 같습니다.

```text
Inbox -> Active -> Waiting -> Blocked -> Someday -> Done
```

`status`는 실행 상태입니다. quotation, drawing, deposition, analysis, writing 같은 절차 정보는 별도 `stage` field가 아니라 Markdown body에 적습니다.

`Statuses`는 settings에서 전역으로 수정할 수 있습니다. 알 수 없는 status는 `Data warnings`에 표시되고 첫 번째 status로 fallback됩니다.

## New Document

`New document`를 누르거나 lane의 `+` 버튼을 누릅니다.

필수 field는 빨간색 `*`로 표시됩니다.

- `Title`
- `Status`
- `Type`
- `Project`: `Type`이 `Subproject` 또는 `Big Action`일 때 필수
- `Subproject`: `Type`이 `Big Action`일 때 필수

`Project`와 `Subproject`는 직접 입력하지 않고 기존 document 목록에서 선택합니다. `Big Action`은 먼저 `Project`를 고른 다음, 그 Project 안의 `Subproject`를 고릅니다.

`Advanced metadata`에는 선택 field만 둡니다.

- `Priority`
- `Category`
- `Current Focus`
- `Waiting for`
- `Blocker`
- `Next review`
- `Due date`
- `Source notes`
- `Depends on`
- `Blocks`

`Category`는 내부적으로 `workstream_type`에 저장됩니다. KanbanRPM은 더 이상 `area`, `project_kind`, `importance`, `stage`를 쓰지 않습니다.

plugin settings의 `Category set`에서 Category 목록을 수정할 수 있습니다. Category dropdown, Category filter, card display, validation은 모두 이 설정값을 사용합니다.

## Living Document Template

새 문서의 frontmatter는 짧게 유지합니다.

```yaml
kanban_rpm: true
type: big_action
id: example-big-action
status: active
project: "[[TTT]]"
subproject: "[[TTT Experiment]]"
order:
```

Hierarchy는 명시적으로 저장합니다. `Subproject`는 `project`를 저장하고, `Big Action`은 `project`와 `subproject`를 모두 저장합니다. 나중에 `pro_project`, `sub_subproject` 같은 level이 필요하면 generic `parent`에 넣지 않고 explicit level field를 추가합니다.

새 문서는 plugin이 읽는 control 영역과 사용자가 자유롭게 쓰는 working 영역을 나눕니다.

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

### Dependencies

### Timeline

### Perpetual

### References

### PM Metadata

---

## Working Notes

### Project Brief

### Desired Outcomes

### Decisions
```

`PM Control`은 KanbanRPM이 board에 투영하기 위해 읽는 영역입니다. `Working Notes`는 결정, 미팅 요약, sample context, 분석 메모, communication history를 자유롭게 쓰는 영역입니다. Project, Subproject, Big Action은 각 성격에 맞는 다른 `Working Notes` section을 사용합니다.

## Board

`Data warnings`, `Command center`, `Action index`는 filter 옆 panel button으로 열고 닫습니다. 닫힌 panel은 board에서 아예 표시하지 않습니다. `Project notes` pane은 `Collapse` / `Expand`로 접고 펼칠 수 있습니다.

Project document는 status lane 안에 표시하지 않습니다. 대신 board 바로 위의 `Project notes` strip에 따로 표시합니다. Project 이름을 클릭하면 해당 living Project document를 엽니다.

`Project` filter가 `All`이면 모든 Project note를 보여주고, 특정 Project를 선택하면 해당 Project note만 보여줍니다.

상단 toolbar의 primary action:

- `Board`, `Table`, `List`, `Timeline`
- `New document`
- `Group by Project`, `Group by Subproject`, `Flat board`
- `Refresh`
- `More`

`More` 안의 secondary action:

- `Pull Daily`
- `Weekly review`
- `Export arrows`
- `Normalize order`

기본 grouped board는 Project filter에 따라 자동으로 grouping 기준을 바꿉니다.

- `Project: All`: lane 안에서 Project별로 group합니다.
- 특정 Project 선택: lane 안에서 Subproject별로 group합니다.

`Search cards`, `Project`, `Category` filter로 board를 좁힐 수 있습니다.

card를 다른 lane으로 drag하면 `status`가 바뀝니다. 같은 lane 안에서 drag하면 `order`가 바뀝니다. card 안의 button click은 drag로 오작동하지 않도록 분리되어 있습니다.

`Table` view는 현재 filter에 걸린 card들을 sortable row로 보여줍니다. column header를 클릭하면 title, project, type, status, priority, date, dependency count, action count 기준으로 정렬할 수 있습니다. row 안의 `Status` dropdown으로 board로 돌아가지 않고 status를 변경할 수 있습니다.

`List` view는 `Project -> Subproject -> Big Action` tree를 collapsible하게 보여줍니다. Project/Subproject 이름을 누르면 living document를 열고, Big Action row에는 status, date, task count가 표시됩니다.

`Timeline` view는 1주 전부터 5주 뒤까지의 horizontal strip입니다. `Due date`, `Next review`, 날짜가 있는 unchecked small action, `Perpetual` routine marker를 표시합니다. marker를 누르면 해당 living document를 엽니다.

settings의 `Card display fields`에서 board card에 표시할 정보를 고를 수 있습니다.

## Small Actions

Small action은 living document 안에 있는 checkbox task입니다. 별도 card로 만들지 않고 Markdown body 안에 둡니다.

KanbanRPM은 Tasks-style emoji metadata를 읽습니다.

```markdown
- [ ] Stack TTT sample ⏳ 2026-05-10 📅 2026-05-14 🔼
- [x] Confirm mask design ✅ 2026-05-07
```

지원하는 metadata:

- `scheduled`: `⏳ YYYY-MM-DD`
- `due`: `📅 YYYY-MM-DD`
- `done`: `✅ YYYY-MM-DD`
- priority: `⏫`, `🔼`, `🔽`, `⏬`

board card에는 small action row가 접힌 상태로 표시됩니다. `▶ Small actions`를 누르면 펼쳐지고, `▼ Small actions`를 누르면 다시 접힙니다. 펼쳐진 small action은 원래 문서의 heading별로 묶여 표시됩니다.

card에서 small action을 직접 check/uncheck할 수 있습니다. check하면 원본 Markdown line이 `[ ]`에서 `[x]`로 바뀌고 오늘 날짜의 `✅ YYYY-MM-DD` done date가 추가됩니다. uncheck하면 `[x]`가 `[ ]`로 돌아가고 done date가 제거됩니다.

Small-action settings:

- `Small actions collapsed by default`
- `Small action source`: `Due or scheduled only`, `Done only`, `All small actions`
- `Small action date window`: `Any date`, `Overdue only`, `Today only`, `Through tomorrow`, `Through one week`, `Through one month`

default는 `Due or scheduled only`, `Through one week`입니다.

## Action Index

`Action index`는 card의 `### References`에 적힌 source note에서 unchecked checkbox와 `#todo` line을 읽습니다. 원본 note는 수정하지 않습니다.

- `Open source`: source note를 엽니다.
- `Set next`: 해당 action을 card의 `### Current Focus`로 복사합니다.
- `Promote`: 해당 action으로 새 `Big Action` document를 만듭니다.

## Dependencies

dependency는 body에 적습니다.

```markdown
### Dependencies

Depends on:
- [[TTT Data Processing]]

Blocks:
- [[TTT Manuscript]]
```

`Export arrows`는 `KanbanRPM Workspace/arrows/`에 Laminar-style arrow note를 만듭니다.

## Daily / Weekly

`Send to Daily`는 오늘 Daily note가 이미 있을 때만 아래 line을 추가합니다.

```markdown
- [ ] [[Card Title]]: Current Focus
```

KanbanRPM은 Daily note를 자동 생성하지 않습니다. Daily note가 없으면 예상 경로를 notice로 알려줍니다.

`Weekly review`는 `KanbanRPM Workspace/perpetual/` 아래에 KanbanRPM-owned weekly review note를 생성하거나 엽니다.

## Data Warnings

`Data warnings`는 filter 옆 panel button으로 열고 닫습니다. 닫으면 board에서 아예 보이지 않습니다.

주요 warning:

- 알 수 없는 `status`
- 잘못된 `priority`
- 알 수 없는 `Category`
- 누락된 `project` 또는 `subproject`
- 숫자가 아닌 `order`
- `### References` 또는 `### Dependencies`의 broken wikilink
- circular dependency

## Settings

사용 가능한 settings:

- `Workspace folder`
- `Daily folder`
- `Daily section`
- `Weekly review folder`
- `Statuses`
- `Category set`
- `Card display fields`
- `Small actions`

## Developer Note

User-facing behavior가 바뀌면 `docs/KanbanRPM Manual.md`와 이 한국어 manual을 함께 업데이트합니다.
