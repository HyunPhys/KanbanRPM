# KanbanRPM Manual ko

KanbanRPM? Obsidian ?덉뿉???곌뎄/?낅Т ?꾨줈?앺듃瑜?愿由ы븯湲??꾪븳 plugin?낅땲?? ?듭떖 ?먯튃? card瑜??쇳쉶????ぉ?쇰줈 ?곕뒗 寃껋씠 ?꾨땲?? `Project`, `Subproject`, `Big Action`??紐⑤몢 ?쎄퀬 ?????덈뒗 living document濡??좎??섎뒗 寃껋엯?덈떎.

## Core Model

```text
Project -> Subproject -> Big Action -> Checkbox task
```

- `Project`: 媛????紐⑺몴? 留λ씫???대뒗 臾몄꽌?낅땲?? ?? `TTT`, `Lab Setup`.
- `Subproject`: Project ?덉쓽 workstream?낅땲?? ?? `TTT Experiment`, `TTT Analysis`.
- `Big Action`: status 異붿쟻???꾩슂?????ㅽ뻾 ?⑥쐞?낅땲??
- `Checkbox task`: 臾몄꽌 蹂몃Ц?대굹 meeting note ?덉뿉 ?⑤뒗 ?묒? ???쇱엯?덈떎.

## Workspace

KanbanRPM? ?꾩슂?????꾨옒 援ъ“瑜?留뚮벊?덈떎.

```text
KanbanRPM Workspace/
  cards/
  routines/
  timeline/
  attachments/
```

??臾몄꽌??primary hierarchy???곕씪 ??λ맗?덈떎.

```text
cards/Project.md
cards/Project/Subproject.md
cards/Project/Subproject/Big Action.md
```

Archive??臾몄꽌??媛?Project ?대뜑 ?덉뿉 ??λ맗?덈떎.

```text
cards/Project/archive/Archived Big Action.md
```

## Create A Document

`New document`瑜??꾨Ⅴ硫???living document瑜?留뚮뱾 ???덉뒿?덈떎. ?꾩닔 field??鍮④컙??`*`濡??쒖떆?⑸땲??

- `Title`
- `Status`
- `Type`
- `Project`: `Subproject`, `Big Action`?먯꽌 ?꾩슂
- `Subproject`: `Big Action`?먯꽌 ?꾩슂

`Project`? `Subproject`??吏곸젒 ?낅젰?섏? ?딄퀬 湲곗〈 document 紐⑸줉?먯꽌 ?좏깮?⑸땲?? `Big Action`? 癒쇱? `Project`瑜?怨좊Ⅸ ?? ?대떦 Project ?덉쓽 `Subproject`瑜?怨좊쫭?덈떎.

`Advanced metadata`?먮뒗 `Priority`, `Category`, `Current Focus`, `Waiting for`, `Blocker`, `Start date`, `Next review`, `Due date`, `Source notes`, `Preceded by`, `Followed by`媛 ?덉뒿?덈떎.

臾몄꽌 frontmatter??吏㏐쾶 ?좎??⑸땲?? hierarchy??`primary_project`, `primary_subproject`, `projects`, `subprojects`濡???λ맗?덈떎.

## Views

?곷떒 view switcher???ㅼ쓬 view瑜??쒓났?⑸땲??

- `Board`: status lane 湲곕컲 ?ㅽ뻾 view.
- `Table`: sortable table view.
- `Timeline`: Laminar-style date column view? `Routine` sidebar.
- `Gantt`: `Start date + Due date` 湲곕컲 以묒옣湲?吏꾪뻾 view.
- `Archive`: archive??card留?紐⑥븘 蹂대뒗 view.

`Project`, `Subproject`, `Category` filter濡?踰붿쐞瑜?醫곹옄 ???덉뒿?덈떎. filter ?놁쓽 panel button?쇰줈 `Data warnings`, `Command center`, `Action index`, `Research index`瑜??닿퀬 ?レ뒿?덈떎.

## Board And Flow

Board?먮뒗 `Project` 臾몄꽌媛 lane ?덉뿉 ?⑥? ?딄퀬, ?꾩そ `Project notes` strip???곕줈 ?쒖떆?⑸땲?? lane ?덉뿉??二쇰줈 `Subproject`? `Big Action`???쒖떆?⑸땲??

Board `Statuses` checkbox filter로 status lane을 보이거나 숨길 수 있습니다. 선택값은 plugin settings에 저장됩니다.

card???ㅻⅨ履?dot???ㅻⅨ card???쇱そ connector area濡?drag?섎㈃ flow arrow媛 留뚮뱾?댁쭛?덈떎. ??愿怨꾨뒗 ???card??`### Flow` ?덉뿉 `Preceded by`濡???λ맗?덈떎.

```markdown
### Flow

Preceded by:
- [[TTT Data Processing]]

Followed by:
- [[TTT Manuscript]]
```

## Timeline And Routine

`Timeline`? ?좎쭨 column??媛濡쒕줈 ?ㅽ겕濡ㅽ븯??view?낅땲?? 湲곕낯 踰붿쐞???ㅻ뒛 湲곗? 7???꾨???7???꾧퉴吏?낅땲?? `Memo`???좎쭨蹂꾨줈 ??λ릺硫? ?ㅼ젣濡?memo瑜???ν븷 ?뚮쭔 `KanbanRPM Workspace/timeline/YYYY-MM-DD.md` ?뚯씪???앷퉩?덈떎.

`Timeline`의 `Statuses` filter 선택은 plugin settings에 저장되므로, Obsidian을 다시 열어도 마지막 선택이 유지됩니다.

`Routine`? 諛섎났 愿由???ぉ?낅땲??

```markdown
### Routine

- [ ] Weekly TTT Review @weekly @start 2026-05-13
- [ ] TEM Data Backup @monthly @start 2026-05-13
- [ ] Safety form audit @every 2w @start 2026-05-13
```

`Done`???꾨Ⅴ硫?`### Routine Log`??Markdown table row媛 湲곕줉?섍퀬, ?대떦 recurrence period ?숈븞 sidebar?먯꽌 ?④꺼吏묐땲??

## Gantt

`Gantt` view는 sticky left hierarchy pane과 horizontal time grid를 가진 planning surface입니다. `Project -> Subproject -> Big Action` 구조로 row를 보여주며, Project와 Subproject는 summary bar, Big Action은 execution bar로 표시합니다. bar 위치는 실제 날짜에 비례하므로, 5월 15일에 시작하는 작업은 5월 column의 중간쯤에서 시작합니다.

- scale toggle: `Month+Week` / `Quarter+Month`
- 기본 range: 현재 filter에 보이는 card 날짜를 기준으로 앞뒤 1개월 padding
- `Next review`: 별도 marker
- today: vertical marker
- status: pill badge로 표시
- Gantt bar color: status color family 사용
- `Preceded by / Followed by`: dependency badge와 blocked warning으로 먼저 표시
- visible bar 사이에는 connector line을 표시. 선행 card가 complete 상태가 아니면 warning-colored line으로 표시
- `Connectors: On/Off`: visible connector line 표시 여부 전환
- Gantt bar 오른쪽 dot을 다른 bar의 왼쪽 connector area로 drag하면 Board flow와 같은 `Preceded by` link 생성
- row title click: living document 열기
- Gantt bar click: `Start date`, `Due date`, `Next review` 수정
- 정렬: 같은 hierarchy level 안에서만 `Start date`가 빠른 순으로 정렬. `Start date`가 없으면 `Due date`, `Next review`, title/order 순으로 fallback

날짜는 `### Timeline`에서 읽습니다.

```markdown
### Timeline

- Start date: 2026-05-01
- Next review: 2026-05-10
- Due date: 2026-05-31
```
## Archive

card menu?먯꽌 `Archive`瑜??꾨Ⅴ硫?card媛 owning Project??`archive/` ?대뜑濡??대룞?⑸땲?? Archive view?먯꽌??archive??card留?蹂????덇퀬, `Unarchive`濡??먮옒 ?꾩튂 ?먮뒗 ?꾩옱 hierarchy folder濡?蹂듭썝?????덉뒿?덈떎.

## Research Index

`Research index`???꾩뿭 臾몄꽌 `KanbanRPM Workspace/Research Logs.md`??`### Experiment Log`? `### Analysis Log` Markdown table???쎌뒿?덈떎. Dataview???꾩슂?섏? ?딆쑝硫? log row??媛쒕퀎 Big Action 臾몄꽌 ?덉뿉 ?곗? ?딆뒿?덈떎.

Experiment Log ?덉떆:

```markdown
### Experiment Log

#### Stacking

| Date | Sample | Conditions | Result | Link |
| --- | --- | --- | --- | --- |
| 2026-05-14 | [[TTT Sample 8]] | PC, 8 wt%, 100C 7m | partial success | [[2026-05-14 Stacking - TTT Sample 8]] |
```

Analysis Log ?덉떆:

```markdown
### Analysis Log

#### DF analysis

| Date | Dataset / Sample | Method | Result | Link |
| --- | --- | --- | --- | --- |
```

`Category`媛 log mapping???ы븿??`Big Action`??completion status濡???린硫?log modal???밸땲?? 湲곕낯 mapping? `experiment` -> Experiment Log, `analysis` -> Analysis Log?낅땲?? ??prompt??settings?먯꽌 ?????덉뒿?덈떎. ??λ맂 row??`KanbanRPM Workspace/Research Logs.md`??湲곕줉?섍퀬, `Link` ?댁? ?꾨즺??Big Action card瑜?媛由ы궢?덈떎.

## Next Review Reminder

`Next review`??reminder layer濡쒕룄 ?ъ슜?⑸땲?? Board瑜??닿굅??Refresh????`Next review`媛 ?ㅻ뒛 ?먮뒗 怨쇨굅?대㈃, completion status媛 ?꾨땶 card瑜?settings??`Next review reminder status`濡??대룞?섍퀬 `### Timeline Log`??湲곕줉?⑸땲?? 蹂꾨룄 `Reminders` table? ?ъ슜?섏? ?딆뒿?덈떎.

## Project lifecycle

Project lifecycle은 card `status`와 별개입니다. `Project notes` strip에서 `Close project`를 누르면 Project 문서에 `project_state: closed`가 저장됩니다. closed Project와 해당 Project에만 속한 Subproject/Big Action은 기본 Project filter, Project notes, Board, Table, Timeline, Gantt에서 숨겨집니다. 다른 active Project에도 연결된 card는 계속 표시됩니다. `Show closed projects`를 켜면 closed Project를 다시 볼 수 있고, `Reopen project`로 active 상태로 되돌릴 수 있습니다. Project를 close해도 child card의 status는 변경하지 않습니다.

## Management brief

`Management brief`는 `KanbanRPM Workspace/KanbanRPM Management Brief.md`를 생성하거나 업데이트하고 엽니다. 이 문서는 사람의 review와 LLM-assisted planning을 위한 generated PM snapshot입니다. 포함 항목은 LLM prompt, Snapshot, Executive Attention, Project Health, Projects, Upcoming Dates, Next Actions, Open Small Actions, Waiting, Blocked, Flow Risks, Routines, Recent Research Logs, Data Warnings입니다. 이 문서는 regenerate해도 되며, source of truth는 각 living document입니다.

## Settings

二쇱슂 settings:

- Settings는 `Workspace`, `Taxonomy`, `Research Logs And Reminders`, `Card Display`, `Small Actions` 섹션으로 접고 펼 수 있게 정리되어 있습니다.
- `Workspace folder`
- `Global status set`
- `Category set`
- `Experiment log categories`
- `Analysis log categories`
- `Prompt for log when moving matching Big Action to Done`
- `Next review reminder status`
- `Card display fields`
- `Small actions`

## Developer Note

?ъ슜??facing behavior媛 諛붾뚮㈃ `docs/KanbanRPM Manual.md`? ???쒓뎅??manual???④퍡 ?낅뜲?댄듃?⑸땲??
