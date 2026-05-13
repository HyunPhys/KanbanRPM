# KanbanRPM Manual ko

??臾몄꽌??KanbanRPM??泥섏쓬 ?곕뒗 ?щ엺???꾪븳 ?쒓뎅??manual?낅땲?? Plugin UI???쒖떆?섎뒗 ?⑹뼱???곸뼱濡??좎??⑸땲??

## Core Model

```text
Project -> Subproject -> Big Action -> Checkbox task
```

- `Project`: 理쒖긽??living document?낅땲?? ?? `TTT`, `Lab Setup`.
- `Subproject`: Project ?덉쓽 蹂묐젹 workstream?낅땲?? ?? `TTT Experiment`, `Glove Box Setup`.
- `Big Action`: board?먯꽌 ?곹깭 異붿쟻??媛移섍? ?덈뒗 ???ㅽ뻾 ?⑥쐞?낅땲??
- `Checkbox task`: meeting note, source note, living document 蹂몃Ц???④꺼?먮뒗 ?묒? ???쇱엯?덈떎.

?묒? checkbox瑜?紐⑤몢 card濡?留뚮뱾吏 ?딆뒿?덈떎. 以묒슂??寃껊쭔 `Promote`?댁꽌 `Big Action`?쇰줈 ?щ┰?덈떎.

## Open Board

1. Obsidian `Community plugins`?먯꽌 `KanbanRPM`??enable?⑸땲??
2. `KanbanRPM: Open board`瑜??ㅽ뻾?섍굅??ribbon icon???대┃?⑸땲??

KanbanRPM? ?꾩슂????workspace瑜?留뚮벊?덈떎.

```text
KanbanRPM Workspace/
  cards/
  arrows/
  routine/
  timeline/
  attachments/
  archive/
```

?ㅼ젣 Project/Subproject/Big Action 臾몄꽌??`cards/`????λ맗?덈떎. ??臾몄꽌??primary hierarchy folder瑜??ъ슜?⑸땲??

```text
cards/Project.md
cards/Project/Subproject.md
cards/Project/Subproject/Big Action.md
```

異붽? Project/Subproject link媛 ?덉뼱???뚯씪? ?앹꽦 ???좏깮??primary folder??洹몃?濡??〓땲?? 湲곗〈 flat file??怨꾩냽 ?쎌뒿?덈떎.

## Status Lanes

湲곕낯 lane? ?ㅼ쓬怨?媛숈뒿?덈떎.

```text
Inbox -> Active -> Waiting -> Blocked -> Someday -> Done
```

`status`???ㅽ뻾 ?곹깭?낅땲?? quotation, drawing, deposition, analysis, writing 媛숈? ?덉감 ?뺣낫??蹂꾨룄 `stage` field媛 ?꾨땲??Markdown body???곸뒿?덈떎.

`Statuses`??settings?먯꽌 ?꾩뿭?쇰줈 ?섏젙?????덉뒿?덈떎. ?????녿뒗 status??`Data warnings`???쒖떆?섍퀬 泥?踰덉㎏ status濡?fallback?⑸땲??

## New Document

`New document`瑜??꾨Ⅴ嫄곕굹 lane??`+` 踰꾪듉???꾨쫭?덈떎.

?꾩닔 field??鍮④컙??`*`濡??쒖떆?⑸땲??

- `Title`
- `Status`
- `Type`
- `Project`: `Type`??`Subproject` ?먮뒗 `Big Action`?????꾩닔
- `Subproject`: `Type`??`Big Action`?????꾩닔

`Project`? `Subproject`??吏곸젒 ?낅젰?섏? ?딄퀬 湲곗〈 document 紐⑸줉?먯꽌 ?좏깮?⑸땲?? `Big Action`? 癒쇱? `Project`瑜?怨좊Ⅸ ?ㅼ쓬, 洹?Project ?덉쓽 `Subproject`瑜?怨좊쫭?덈떎.

`Advanced metadata`?먮뒗 ?좏깮 field留??〓땲??

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

`Category`???대??곸쑝濡?`workstream_type`????λ맗?덈떎. KanbanRPM? ???댁긽 `area`, `project_kind`, `importance`, `stage`瑜??곗? ?딆뒿?덈떎.

plugin settings??`Category set`?먯꽌 Category 紐⑸줉???섏젙?????덉뒿?덈떎. Category dropdown, Category filter, card display, validation? 紐⑤몢 ???ㅼ젙媛믪쓣 ?ъ슜?⑸땲??

## Living Document Template

??臾몄꽌??frontmatter??吏㏐쾶 ?좎??⑸땲??

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

Hierarchy??multi-link array濡???ν빀?덈떎. `projects`, `subprojects`?먮뒗 ?щ윭 linked document瑜??ｌ쓣 ???덉뒿?덈떎. `primary_project`, `primary_subproject`??湲곕낯 breadcrumb? ?ν썑 folder placement 湲곗??낅땲?? 湲곗〈 `project`, `subproject` field??fallback?쇰줈留??쎌뒿?덈떎.

??臾몄꽌??plugin???쎈뒗 control ?곸뿭怨??ъ슜?먭? ?먯쑀濡?쾶 ?곕뒗 working ?곸뿭???섎닏?덈떎.

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

`PM Control`? KanbanRPM??board???ъ쁺?섍린 ?꾪빐 ?쎈뒗 ?곸뿭?낅땲?? `Working Notes`??寃곗젙, 誘명똿 ?붿빟, sample context, 遺꾩꽍 硫붾え, communication history瑜??먯쑀濡?쾶 ?곕뒗 ?곸뿭?낅땲?? Project, Subproject, Big Action? 媛??깃꺽??留욌뒗 ?ㅻⅨ `Working Notes` section???ъ슜?⑸땲??

## Board

`Data warnings`, `Command center`, `Action index`??filter ??panel button?쇰줈 ?닿퀬 ?レ뒿?덈떎. ?ロ엺 panel? board?먯꽌 ?꾩삁 ?쒖떆?섏? ?딆뒿?덈떎. `Project notes` pane? `Collapse` / `Expand`濡??묎퀬 ?쇱튌 ???덉뒿?덈떎.

card ?됱긽? Project ?뚯냽留??섑??낅땲?? `Project`, `Subproject`, `Big Action` ??븷? ?쒕줈 ?ㅻⅨ stripe ?먭퍡濡?援щ텇?⑸땲?? stripe gutter ??? 怨좎젙?섏뼱 ?덉뼱??type???щ씪??card text ?쒖옉 ?꾩튂??媛숈뒿?덈떎.

`Subproject` card??breadcrumb?먮뒗 ?랁븳 `Project`留??쒖떆?⑸땲?? `Big Action` card??primary hierarchy瑜???以꾨줈 ?쒖떆?⑸땲?? `Project`, 洹??꾨옒 `> Subproject`.

Project document??status lane ?덉뿉 ?쒖떆?섏? ?딆뒿?덈떎. ???board 諛붾줈 ?꾩쓽 `Project notes` strip???곕줈 ?쒖떆?⑸땲?? Project ?대쫫???대┃?섎㈃ ?대떦 living Project document瑜??쎈땲??

`Project` filter媛 `All`?대㈃ 紐⑤뱺 Project note瑜?蹂댁뿬二쇨퀬, ?뱀젙 Project瑜??좏깮?섎㈃ ?대떦 Project note留?蹂댁뿬以띾땲??

?곷떒 toolbar??primary action:

- `Board`, `Table`, `List`, `Timeline`
- `New document`
- `Group by Project`, `Group by Subproject`, `Flat board`
- `Refresh`
- `More`

`More` ?덉쓽 secondary action:

- `Weekly review`
- `Export arrows`
- `Normalize order`

湲곕낯 grouped board??Project filter???곕씪 ?먮룞?쇰줈 grouping 湲곗???諛붽퓠?덈떎.

- `Project: All`: lane ?덉뿉??Project蹂꾨줈 group?⑸땲??
- ?뱀젙 Project ?좏깮: lane ?덉뿉??Subproject蹂꾨줈 group?⑸땲??

`Search cards`, `Project`, `Subproject`, `Category` filter濡?board瑜?醫곹옄 ???덉뒿?덈떎.

?щ윭 Project/Subproject???곌껐??card??媛?filter 寃곌낵???섑??????덉뒿?덈떎. ?붾㈃??湲곕낯 breadcrumb??primary hierarchy瑜??ъ슜?⑸땲??

card瑜??ㅻⅨ lane?쇰줈 drag?섎㈃ `status`媛 諛붾앸땲?? 媛숈? lane ?덉뿉??drag?섎㈃ `order`媛 諛붾앸땲?? card ?덉쓽 button click? drag濡??ㅼ옉?숉븯吏 ?딅룄濡?遺꾨━?섏뼱 ?덉뒿?덈떎.

`Table` view???꾩옱 filter??嫄몃┛ card?ㅼ쓣 sortable row濡?蹂댁뿬以띾땲?? column header瑜??대┃?섎㈃ title, project, type, status, priority, date, dependency count, action count 湲곗??쇰줈 ?뺣젹?????덉뒿?덈떎. row ?덉쓽 `Status` dropdown?쇰줈 board濡??뚯븘媛吏 ?딄퀬 status瑜?蹂寃쏀븷 ???덉뒿?덈떎.

`List` view??`Project -> Subproject -> Big Action` tree瑜?collapsible?섍쾶 蹂댁뿬以띾땲?? Project/Subproject ?대쫫???꾨Ⅴ硫?living document瑜??닿퀬, Big Action row?먮뒗 status, date, task count媛 ?쒖떆?⑸땲??

Board card에는 왼쪽/오른쪽 flow dot이 표시됩니다. 왼쪽 dot은 incoming `Preceded by`, 오른쪽 dot은 outgoing `Followed by`를 뜻합니다. 오른쪽 dot을 다른 card의 왼쪽 connector 영역으로 drag하면 flow arrow가 생성됩니다. Drop target은 보이는 dot보다 넓게 잡혀 있고, drag 중에는 target card가 highlight됩니다. 이때 KanbanRPM은 target card의 `Preceded by` list에 source card link를 저장합니다. 기존 `Flow` 관계는 Board 위에 곡선 arrow로 표시됩니다. Arrow를 클릭하면 확인 후 해당 flow link를 제거할 수 있습니다. 선행 card가 `Done`, `Completed`, `완료` 같은 completion status이면 muted arrow, 아직 끝나지 않았으면 warning-colored arrow로 표시됩니다. Custom status set에 completion status가 없으면 모든 flow arrow가 warning 상태로 남습니다.

`Timeline` view??Laminar-style kanban-like layout?낅땲?? ?쇱そ `Routine` sidebar, ?곷떒 range/search/display controls, horizontal date columns瑜??ъ슜?⑸땲?? 湲곕낯媛믪? base date 湲곗? 7???꾨???7???꾧퉴吏?대ŉ, base date??泥섏쓬?먮뒗 today?낅땲?? `Today`, `-7`, `+7`, base date field, ?먮뒗 紐낆떆?곸씤 `YYYY.MM.DD` to `YYYY.MM.DD` range field濡?議고쉶 援ш컙??諛붽? ???덉뒿?덈떎. 媛?date column ?덉뿉??toggle 媛?ν븳 `Memo` section怨?project/subproject marker section???ㅼ뼱媛묐땲?? `Due date`, `Next review`, ?좎쭨媛 ?덈뒗 unchecked small action, `Routine` routine marker瑜??쒖떆?⑸땲??

Timeline? ?묓? ?덈뒗 Timeline `Statuses` filter?먯꽌 耳쒖쭊 status??card留?蹂댁뿬以띾땲?? default??`Active`?낅땲?? Timeline marker date媛 ?녿뒗 card??date column???섑??섏? ?딆뒿?덈떎. Timeline marker?먮뒗 card breadcrumb, status, priority, status dropdown, compact small-action list媛 ?쒖떆?⑸땲?? marker title???꾨Ⅴ硫??대떦 living document瑜??쎈땲??

Timeline??`Show` dropdown? card-level field媛 ?꾨땲??marker kind瑜?怨좊Ⅴ??display filter?낅땲?? `Show: Review`??review marker留? `Show: Due`??due marker留? `Show: Tasks`???좎쭨媛 ?덈뒗 small action留? `Show: Recurring`? routine留?蹂댁뿬以띾땲??

Timeline Memo entry???대떦 ?좎쭨 memo瑜???ν븳 ?ㅼ뿉留?`KanbanRPM Workspace/timeline/YYYY-MM-DD.md`????λ맗?덈떎. Timeline? range瑜?蹂닿린留??쒕떎怨??좎쭨 memo file???앹꽦?섏? ?딆뒿?덈떎. `+ todo`, `+ text`, ?먮뒗 pencil icon???꾨Ⅴ硫??좎쭨 Memo modal???대┰?덈떎. Modal? ?대떦 ?좎쭨 file??`## Memo` section???쇰컲 multi-line Markdown?쇰줈 ?몄쭛?⑸땲?? Preview??媛꾨떒??Markdown heading, bullet list, paragraph, checkbox瑜??뚮뜑留곹빀?덈떎. Checked checkbox line? 痍⑥냼?좎쑝濡??쒖떆?섎ŉ preview mode?먯꽌 吏곸젒 check/uncheck?????덉뒿?덈떎.

`Routine`은 card의 `### Routine` 또는 `## Routine` section에 있는 checkbox line을 읽습니다. 기존 문서의 `### Perpetual`과 `### Perpetual Log`도 legacy alias로 계속 읽지만, 새 문서는 `### Routine`과 `### Routine Log`를 사용합니다.

`Routine` sidebar는 routine을 frequency별로 묶고, 현재 Timeline range 안에서 다음에 보이는 날짜를 표시합니다. Routine은 Timeline에 표시되려면 `@start YYYY-MM-DD`가 필요하며, 현재 range 안에 occurrence가 없는 routine은 sidebar에서 숨깁니다. 날짜 column에서 recurring marker만 보고 싶을 때는 Timeline의 `Show: Recurring` filter를 사용합니다. Recurring routine은 Timeline main view에서 full card가 아니라 compact chip으로 표시되며, 완료 처리는 `Routine` sidebar의 `Done`에서 합니다. Recurring routine은 `Action index`에도 recurring item으로 표시되며, card를 열거나 `Current Focus`로 복사할 수 있지만 새 `Big Action`으로 promote하지는 않습니다.

Routine은 `@daily`, `@weekly`, `@monthly` 또는 `@every 3d/2w/1m` 형식으로 설정합니다. 모든 routine에는 `@start YYYY-MM-DD`를 붙여야 하며, start date가 없으면 `Data warnings`에 표시되고 Timeline에는 표시되지 않습니다. Timeline의 Routine sidebar는 접어도 Board view로 이동하지 않고 sidebar만 collapse합니다. `Done`을 누르면 반복 항목 자체를 영구적으로 check하지 않고 해당 card의 `### Routine Log`에 완료 기록을 남깁니다.

`daily` routine은 Timeline range 안의 모든 날짜가 아니라 오늘 것만 Timeline과 Routine sidebar에 표시됩니다. 오늘 `Done` 처리하면 오늘의 daily routine은 숨겨집니다.

settings??`Card display fields`?먯꽌 board card???쒖떆???뺣낫瑜?怨좊? ???덉뒿?덈떎.

## Small Actions

Small action? living document ?덉뿉 ?덈뒗 checkbox task?낅땲?? 蹂꾨룄 card濡?留뚮뱾吏 ?딄퀬 Markdown body ?덉뿉 ?〓땲??

KanbanRPM? Tasks-style emoji metadata瑜??쎌뒿?덈떎.

```markdown
- [ ] Stack TTT sample ??2026-05-10 ?뱟 2026-05-14 ?뵾
- [x] Confirm mask design ??2026-05-07
```

吏?먰븯??metadata:

- `scheduled`: `??YYYY-MM-DD`
- `due`: `?뱟 YYYY-MM-DD`
- `done`: `??YYYY-MM-DD`
- priority: `??, `?뵾`, `?뵿`, `??

board card?먮뒗 small action row媛 ?묓엺 ?곹깭濡??쒖떆?⑸땲?? `??Small actions`瑜??꾨Ⅴ硫??쇱퀜吏怨? `??Small actions`瑜??꾨Ⅴ硫??ㅼ떆 ?묓옓?덈떎. ?쇱퀜吏?small action? ?먮옒 臾몄꽌??heading蹂꾨줈 臾띠뿬 ?쒖떆?⑸땲??

card?먯꽌 small action??吏곸젒 check/uncheck?????덉뒿?덈떎. check?섎㈃ ?먮낯 Markdown line??`[ ]`?먯꽌 `[x]`濡?諛붾뚭퀬 ?ㅻ뒛 ?좎쭨??`??YYYY-MM-DD` done date媛 異붽??섎ŉ, `### Timeline Log`??card document濡??뚯븘媛??Obsidian link媛 ?ы븿??理쒖떊??list item??異붽??⑸땲?? uncheck?섎㈃ `[x]`媛 `[ ]`濡??뚯븘媛怨?done date媛 ?쒓굅?섏?留?Timeline Log entry???쒓굅?섏? ?딆뒿?덈떎.

Small-action settings:

- `Small actions collapsed by default`
- `Small action source`: `Due or scheduled only`, `Done only`, `All small actions`
- `Small action date window`: `Any date`, `Overdue only`, `Today only`, `Through tomorrow`, `Through one week`, `Through one month`

default??`Due or scheduled only`, `Through one week`?낅땲??

## Action Index

`Action index`??card??`### References`???곹엺 source note?먯꽌 unchecked checkbox? `#todo` line???쎌뒿?덈떎. ?먮낯 note???섏젙?섏? ?딆뒿?덈떎.

- `Open source`: source note瑜??쎈땲??
- `Set next`: ?대떦 action??card??`### Current Focus`濡?蹂듭궗?⑸땲??
- `Promote`: ?대떦 action?쇰줈 ??`Big Action` document瑜?留뚮벊?덈떎.

## Flow

flow link는 document body에 씁니다.

```markdown
### Flow

Preceded by:
- [[TTT Data Processing]]

Followed by:
- [[TTT Manuscript]]
```

KanbanRPM은 flow를 별도 panel보다 Board 위 connector dot과 arrow로 직접 보여줍니다. 오른쪽 dot에서 다른 card의 왼쪽 connector 영역으로 drag하면 flow link가 생성되고, arrow를 클릭하면 확인 후 제거됩니다.

KanbanRPM은 Board/Table/List surface에도 flow count와 waiting badge를 표시합니다. Broken flow link와 circular flow는 `Data warnings`에 표시됩니다. `Export arrows`는 optional 기능이며, compatibility/reference 용도로 `KanbanRPM Workspace/arrows/`에 Laminar-style arrow note를 만듭니다.

## Timeline Memo / Weekly

KanbanRPM? ???댁긽 ?몃? Daily note??planning line???곗? ?딆뒿?덈떎. 媛踰쇱슫 day note, 鍮좊Ⅸ checkbox task, 蹂꾨룄 living document源뚯????꾩슂 ?녿뒗 reminder??`Timeline` view??toggle 媛?ν븳 `Memo` section???곸뒿?덈떎.

媛?memo cell? ?꾨옒 ?뚯씪????λ맗?덈떎.

```text
KanbanRPM Workspace/timeline/YYYY-MM-DD.md
```

`Weekly review`??`KanbanRPM Workspace/routines/` ?꾨옒??KanbanRPM-owned weekly review note瑜??앹꽦?섍굅???쎈땲??

`Management brief`는 `KanbanRPM Workspace/KanbanRPM Management Brief.md`를 생성하거나 갱신한 뒤 엽니다. 이 파일은 사람과 LLM이 전체 프로젝트 상태를 빠르게 읽기 위한 generated snapshot입니다. Status counts, Project sections, upcoming due/review dates, Waiting, Blocked, Flow risks, Routines, Data warnings를 포함합니다. 원천 데이터는 living document이므로 brief 자체를 source data처럼 편집하기보다는 필요할 때 다시 생성합니다.

## Data Warnings

`Data warnings`??filter ??panel button?쇰줈 ?닿퀬 ?レ뒿?덈떎. ?レ쑝硫?board?먯꽌 ?꾩삁 蹂댁씠吏 ?딆뒿?덈떎.

二쇱슂 warning:

- ?????녿뒗 `status`
- ?섎せ??`priority`
- ?????녿뒗 `Category`
- ?꾨씫??`project` ?먮뒗 `subproject`
- ?レ옄媛 ?꾨땶 `order`
- `### References` 또는 `### Flow`의 broken wikilink
- circular flow

## Settings

?ъ슜 媛?ν븳 settings:

- `Workspace folder`
- `Weekly review folder`
- `Statuses`
- `Category set`
- `Card display fields`
- `Small actions`

## Developer Note

User-facing behavior媛 諛붾뚮㈃ `docs/KanbanRPM Manual.md`? ???쒓뎅??manual???④퍡 ?낅뜲?댄듃?⑸땲??
