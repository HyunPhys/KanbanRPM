# KanbanRPM Manual 한국어판

이 문서는 Obsidian vault에서 KanbanRPM을 처음 쓰는 사람을 위한 안내서입니다. plugin 안에 표시되는 UI 용어는 영어 그대로 씁니다.

KanbanRPM은 작은 task 하나하나가 아니라 `workstream card`를 중심으로 연구와 운영 프로젝트를 관리합니다. 예를 들어 `TTT Experiment`, `TTT Analysis`, `Glove Box Setup`, `Furnace Purchase`, `Teaching Admin`처럼 일정 기간 계속 추적해야 하는 흐름 하나를 card 하나로 둡니다.

## 1. Plugin 활성화

1. Obsidian `Settings`를 엽니다.
2. `Community plugins`로 이동합니다.
3. `KanbanRPM`을 활성화합니다.
4. Command palette에서 `KanbanRPM: Open board`를 실행합니다.

왼쪽 sidebar의 KanbanRPM ribbon icon으로도 board를 열 수 있습니다.

## 2. Workspace folders

KanbanRPM은 project data를 vault 안의 Markdown file로 저장합니다.

```text
KanbanRPM Workspace/cards/
KanbanRPM Workspace/groups/
KanbanRPM Workspace/arrows/
KanbanRPM Workspace/perpetual/
KanbanRPM Workspace/attachments/
KanbanRPM Workspace/archive/
```

active workstream card는 `cards/`에 들어갑니다. archived card는 `archive/`로 이동합니다. group note는 `groups/`에 들어갑니다. `arrows/`, `perpetual/`, `attachments/`는 Laminar-style dependency, routine, supporting-file workflow를 위해 준비된 folder입니다.

## 3. Board lanes

KanbanRPM board는 다음 lane을 사용합니다.

```text
Inbox -> Active -> Waiting -> Blocked -> Someday -> Done
```

- `Inbox`: 아직 정리하거나 판단하지 않은 workstream입니다.
- `Active`: 지금 실제로 진행 중인 workstream입니다.
- `Waiting`: 사람, 답변, 배송, 승인, 외부 조건을 기다리는 상태입니다.
- `Blocked`: 구체적인 blocker 때문에 진행할 수 없는 상태입니다.
- `Someday`: 실제로 존재하지만 지금은 의도적으로 보류한 상태입니다.
- `Done`: 완료되었거나 닫힌 상태입니다.

`status`는 실행 상태입니다. `stage`는 절차상 위치입니다. 예를 들어 `quotation`, `drawing`, `purchase`, `installation`, `writing` 같은 값이 들어갈 수 있습니다.

## 4. Card 만들기

1. KanbanRPM board를 엽니다.
2. `New card`를 클릭합니다.
3. 최소한 `Title`을 입력합니다.
4. `Status`와 `Priority`를 선택합니다.
5. 필요하면 `Group`, `Workstream type`, `Project kind`, `Stage`, `Next action`을 입력합니다.
6. `Create card`를 클릭합니다.

각 lane의 `+` button을 쓰면 해당 lane에 바로 card를 만들 수 있습니다.

## 5. Living Document Schema

KanbanRPM v0.2는 card를 실제 living document로 쓰기 위해 짧은 frontmatter를 사용합니다.

```yaml
kanban_rpm: true
type: project
id: example-workstream
status: active
parent:
order:
```

PM context는 `Current Focus`, `Subprojects`, `Big Actions`, `Dependencies`, `Perpetual`, `PM Metadata`, `Notes`, `Decisions`, `Timeline`, `References` 같은 읽을 수 있는 section에 둡니다.

허용되는 `type`은 `project`, `subproject`, `big_action`입니다. `parent`는 Subproject 또는 Big Action을 상위 Project/Subproject와 연결합니다.

기존 v0.1 heavy frontmatter card도 계속 읽습니다. `KanbanRPM: Compact card metadata` command 또는 card의 `Compact` action을 쓰면 non-empty legacy metadata를 `PM Metadata`로 옮기고 빈 frontmatter field를 제거합니다.

## 6. Groups and filters

`Group`은 큰 project 또는 운영 영역에 사용합니다. `KanbanRPM: New group note` 또는 board의 `New group`을 사용하면 `KanbanRPM Workspace/groups/`에 group note가 만들어집니다.

filter bar에서는 `Group`, `Project kind`, `Workstream type` 기준으로 board를 좁힐 수 있습니다. `Search cards`는 card title과 metadata를 검색합니다.

## 7. Import legacy project notes

기존 `💼` project note나 project tag note를 KanbanRPM card로 연결하려면 `KanbanRPM: Import legacy project notes` command를 실행하거나 board toolbar의 `Import legacy`를 클릭합니다.

KanbanRPM은 기존 Markdown note를 scan해서 project note 후보를 찾습니다. 현재 candidate signal은 다음과 같습니다.

- path 또는 title에 `💼`가 있음
- `type: project`
- `category: project`
- `project` 또는 `project/...` tag
- project-like file 또는 folder name

import modal은 preview-only입니다. 각 candidate가 왜 감지되었는지, 이미 seeded 되었는지, 어떤 card가 이미 연결하고 있는지를 보여줍니다.

원하는 note만 선택하고 `Seed selected cards`를 클릭하면 새 card가 `KanbanRPM Workspace/cards/`에 만들어집니다. 생성된 card는 감지된 title, normalize된 `status`, `priority`, 가능한 group metadata, 그리고 원본 note로 돌아가는 `legacy_links`를 가집니다.

중요한 원칙: 원본 legacy note는 수정하지 않습니다. 같은 note를 다시 import하려고 하면 기존 card의 `legacy_links`를 기준으로 already seeded 상태로 표시하고, 기본 선택에서 제외합니다.

## 8. Data warnings

KanbanRPM은 card metadata에서 고칠 만한 문제를 찾으면 board 위에 `Data warnings` panel을 보여줍니다.

현재 확인하는 항목:

- 잘못되었거나 비어 있는 `status`
- `1`부터 `5` 사이가 아닌 `priority`
- `YYYY-MM-DD` 형식이 아닌 `next_review` 또는 `due_date`
- 권장 vocabulary에 없는 `workstream_type` 또는 `project_kind`
- `source_notes`, `legacy_links`, `related_notes` 안의 broken wikilink

warning row를 클릭하면 해당 card를 엽니다. KanbanRPM은 imperfect card를 숨기지 않고 가능한 한 board에 보여주되, 고칠 지점을 알려줍니다.

`KanbanRPM: Open schema reference` command를 실행하면 vault 안에 다음 schema reference note를 만들거나 엽니다.

```text
KanbanRPM Workspace/KanbanRPM Card Schema.md
```

source project에는 developer-facing schema 문서인 `docs/Card Schema.md`도 있습니다.

## 9. Command center

board 위의 `Command center`는 네 가지 compact queue를 보여줍니다.

- `Review queue`: `next_review` 또는 `due_date`가 지났거나 가까운 card입니다.
- `Waiting`: `Waiting` lane에 있거나 `waiting_for`가 있는 card입니다.
- `Blocked`: `Blocked` lane에 있거나 `blocker`가 있는 card입니다.
- `Dependencies`: `depends_on` 또는 `blocks`가 있는 card입니다.

row를 클릭하면 해당 card를 엽니다. `Collapse` / `Expand`로 panel을 숨기거나 다시 펼 수 있습니다. `Daily review`는 `Review queue`의 card 중 `next_action`이 있는 것들을 오늘 Daily note로 한 번에 보냅니다.

board toolbar의 `Pull Daily` 또는 `KanbanRPM: Pull cards to Daily` command를 사용하면 Daily로 보낼 card 묶음을 직접 고를 수 있습니다. modal은 `Review due`, `Active`, `Waiting`, `Blocked`, `All visible` mode를 지원합니다. `next_action`이 있는 card만 Daily로 보낼 수 있고, duplicate line은 건너뜁니다.

## 10. Action index

`Action index`는 현재 보이는 card의 `source_notes`, `legacy_links`, `related_notes`에서 unchecked checkbox action과 `#todo` line을 모아 보여줍니다. action은 card별로 group됩니다.

사용 가능한 control:

- action row 또는 `Open source`를 클릭하면 source note를 엽니다.
- `Set next`를 클릭하면 해당 action을 card의 `next_action`으로 복사합니다.

원본 note는 수정하지 않습니다. `Collapse` / `Expand`로 `Action index`를 숨기거나 다시 펼 수 있습니다.

## 11. Edit, move, sort

`Edit`은 card metadata를 수정합니다. `Open`은 Markdown body를 엽니다.

card를 다른 lane으로 drag하면 `status`가 바뀝니다. card 안의 `Active`, `Waiting`, `Blocked`, `Done` button으로도 빠르게 `status`를 바꿀 수 있습니다.

같은 lane 안에서 card를 drag하면 manual order가 `rpm_order`에 기록됩니다. board toolbar의 `Normalize order` 또는 `KanbanRPM: Normalize card order` command를 실행하면 각 lane의 `rpm_order`를 `1000`, `2000`, `3000`처럼 다시 정리합니다.

card에 dependency/context 정보가 있으면 compact relation row를 표시합니다.

- `Depends`: `depends_on`의 upstream dependency입니다.
- `Blocks`: `blocks`의 downstream item입니다.
- `Sources`: `source_notes`의 source note입니다.

relation row 안의 wikilink는 클릭해서 linked note를 열 수 있습니다.

`Write arrows` 또는 `KanbanRPM: Write dependency arrows`는 `depends_on`과 `blocks` metadata를 Laminar-style arrow note로 내보냅니다.

```text
KanbanRPM Workspace/arrows/
```

이 기능은 card metadata를 바꾸지 않습니다. 없는 arrow note만 생성하고 이미 있는 arrow note는 건너뜁니다.

## 12. Duplicate, Archive, Delete

`Duplicate`은 기존 card를 복사해서 `cards/` 안에 새 file을 만들고 title에 `Copy`를 붙입니다.

`Archive`는 card를 `KanbanRPM Workspace/archive/`로 이동합니다.

`Delete`는 confirmation modal을 보여준 뒤 file을 system trash로 이동합니다.

## 13. Send to Daily

`Send to Daily`는 오늘 Daily note에 다음 task line을 추가합니다.

```markdown
- [ ] [[Card Title]]: next_action
```

기본 Daily folder:

```text
100. 개인/110. 다이어리/111. Daily/
```

예상 filename 형식:

```text
YYYY-MM-DD (요일).md
```

예시:

```text
2026-05-06 (수).md
```

KanbanRPM은 Daily note를 새로 만들지 않습니다. 오늘 Daily note가 없으면 예상 경로를 notice로 보여주고 작업을 멈춥니다. 같은 line이 이미 있으면 중복 추가하지 않습니다.

`Daily section` setting이 있으면 KanbanRPM은 해당 heading 아래에 action을 추가합니다. heading이 Daily note에 없으면 새로 추가합니다. `Daily section`을 비워두면 file 끝에 append합니다.

## 14. Weekly Review

board toolbar의 `Weekly review` 또는 `KanbanRPM: Open weekly review` command를 실행하면 이번 주 weekly review note를 만들거나 엽니다.

기본 위치:

```text
KanbanRPM Workspace/perpetual/
```

filename 형식:

```text
YYYY-Www Weekly Review.md
```

생성된 note에는 `Review Queue`, `Active`, `Waiting`, `Blocked`, `Decisions`, `Next Week Focus` section이 들어갑니다. Weekly review note는 KanbanRPM-owned routine note이므로 없으면 생성합니다. Daily note는 기존 원칙대로 이미 존재해야만 append합니다.

## 15. Example structures

TTT research group:

```text
Group: TTT
Cards:
- TTT Background Research
- TTT Experiment
- TTT Data Processing
- TTT Analysis
- TTT Discussion / Writing
- TTT Manuscript
```

Lab setup group:

```text
Group: Lab Setup
Cards:
- Glove Box Setup
- Furnace Setup
- Probe Station Setup
- Gas Line Installation
- Safety Review
```

sample 중심 흐름은 `related_samples`에 연결합니다. 현상 중심 analysis는 `related_phenomena`에 둡니다. meeting이나 communication에서 나온 action을 수집하려면 해당 note를 `source_notes`에 연결합니다.

## 16. Settings

Obsidian `Settings`에서 `KanbanRPM` 설정을 찾을 수 있습니다.

- `Workspace folder`: KanbanRPM card와 support file을 저장하는 위치입니다.
- `Daily folder`: `Send to Daily`가 오늘 Daily note를 찾는 위치입니다.
- `Daily section`: Daily action을 넣을 heading입니다.
- `Weekly review folder`: weekly review note를 생성할 위치입니다.

## 17. Troubleshooting

board가 비어 있다면 `cards/` 위치, `kanban_rpm: true`, search/filter, archive 여부를 확인합니다.

`Import legacy`가 note를 찾지 못하면 해당 note에 `project` tag 또는 `type: project`를 추가하거나 project-like path에 있는지 확인한 뒤 import modal에서 `Rescan`을 클릭합니다.

`Data warnings`가 보이면 warning row를 클릭해 card를 열고 `status`, `priority`, `next_review`, `due_date`, broken wikilink를 확인합니다. 수정 후 board의 `Refresh`를 클릭합니다.

`Action index`가 비어 있다면 `source_notes`, `legacy_links`, `related_notes`가 있는지, linked note가 resolve되는지, source note에 unchecked checkbox 또는 `#todo`가 있는지 확인합니다.

`Send to Daily`가 동작하지 않으면 오늘 Daily note가 존재하는지, `Daily folder` setting이 맞는지, 같은 line이 이미 있는지 확인합니다.

`Pull Daily`에서 card가 선택되지 않으면 해당 card에 `next_action`이 있는지 확인합니다.

`Weekly review`가 예상과 다른 위치에 만들어지면 `Weekly review folder` setting을 확인합니다.

## 18. Developer note

KanbanRPM의 user-facing behavior가 바뀌면 이 한국어 manual과 `docs/KanbanRPM Manual.md`를 같은 change에서 함께 업데이트합니다.
