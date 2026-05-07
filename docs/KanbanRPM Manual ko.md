# KanbanRPM Manual ko

이 문서는 KanbanRPM을 처음 쓰는 사람을 위한 한국어 manual입니다. Plugin UI에 표시되는 용어는 영어로 유지합니다.

## 1. 기본 개념

KanbanRPM의 기본 구조는 다음입니다.

```text
Project -> Subproject -> Big Action -> Checkbox task
```

- `Project`: 최상위 living document입니다. 예: `TTT`, `Lab Setup`.
- `Subproject`: Project 아래의 workstream입니다. 예: `TTT Experiment`, `Glove Box Setup`.
- `Big Action`: board에서 추적할 만한 큰 실행 단위입니다.
- `Checkbox task`: 문서나 meeting note 안에 남는 세부 할 일입니다.

작은 checkbox를 모두 card로 만들지 않습니다. 중요한 것만 `Promote`해서 `Big Action`으로 올립니다.

## 2. Board

기본 status lane은 다음입니다.

```text
Inbox -> Active -> Waiting -> Blocked -> Someday -> Done
```

`status`는 실행 상태입니다. 실험 절차, 구매 단계, writing 단계 같은 설명은 별도 `stage` field가 아니라 Markdown body에 적습니다.

## 3. New document

1. board에서 `New document`를 클릭합니다.
2. required field는 빨간색 `*`로 표시됩니다.
3. `Title`, `Status`, `Type`을 입력합니다.
4. `Type`이 `Subproject` 또는 `Big Action`이면 `Parent`를 기존 Project/Subproject 목록에서 선택합니다.
5. 필요한 경우 `Advanced metadata`를 열어 `Priority`, `Category`, `Legacy group` 등을 입력합니다.

`Parent`는 직접 타이핑하지 않습니다. 기존 문서 중에서 고릅니다.

## 4. Living document template

새 문서는 frontmatter를 짧게 유지합니다.

```yaml
kanban_rpm: true
type: project
id: example-project
status: active
parent:
order:
```

읽어야 하는 정보는 body section에 둡니다.

```markdown
## Current Focus

## Subprojects

## Big Actions

## Waiting

## Blockers

## Dependencies

## Perpetual

## Notes

## Decisions

## Timeline

## References

## PM Metadata
```

`Current Focus`, `Waiting`, `Blockers`, `Timeline` 같은 줄글 정보는 metadata보다 본문에 두는 것을 원칙으로 합니다.

## 5. Category

`area`, `Project kind`, `Workstream type`은 개념이 겹치므로 UI에서는 `Category` 하나만 사용합니다.

내부 호환 field는 `workstream_type`입니다.

추천값:

```text
research | experiment | analysis | writing | setup | purchase | admin | communication
```

`importance`는 `priority`와 중복되므로 사용하지 않습니다. `stage`도 `status`와 혼동되므로 사용하지 않습니다.

## 6. Board toolbar

상단에는 primary action만 보입니다.

- `New document`
- `Group by Project` / `Flat board`
- `Refresh`
- `More`

`More` 안에는 보조 기능이 들어갑니다.

- `Pull Daily`
- `Weekly review`
- `Import legacy`
- `Export arrows`
- `Normalize order`

## 7. Card controls

card 안의 status button은 제거했습니다. 상태 변경은 drag/drop으로 합니다.

남아 있는 card action:

- `Open`
- `Edit`
- `Compact`
- `Duplicate`
- `Send to Daily`
- `Archive`
- `Delete`

## 8. Data warnings

`Data warnings`는 collapse/expand할 수 있습니다.

주요 warning:

- 알 수 없는 `status`
- 잘못된 `priority`
- legacy frontmatter의 잘못된 날짜
- 알 수 없는 `Category`
- 깨진 wikilink
- circular dependency

## 9. Action index

`Action index`는 linked note의 unchecked checkbox와 `#todo`를 읽습니다. 원본 문서는 수정하지 않습니다.

- `Open source`: 원본 note 열기
- `Set next`: 해당 action을 card의 next action으로 사용
- `Promote`: checkbox/action을 새 `Big Action` 문서로 승격

## 10. Daily / Weekly

`Send to Daily`는 오늘 Daily note가 이미 있을 때만 task line을 추가합니다.

```markdown
- [ ] [[Card Title]]: next action
```

`Weekly review` / `Weekly Review`는 KanbanRPM workspace 안에 review note를 생성하거나 엽니다.

## 11. Developer note

User-facing behavior가 바뀌면 `docs/KanbanRPM Manual.md`와 이 한국어 manual을 함께 업데이트합니다.
