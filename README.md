# DOLCE AGENT — Mobile PPC Picker

A separate version based on `dolceagent-ppc-header-totals-05sep2026`. Previous repositories and links remain unchanged.

## Menu layout

When the menu is open, PPC follows this order:

1. Main brand header.
2. Main workspace category slider.
3. Fixed filter picker: CAMPAIGNS, ASINS, KEYWORDS, AUTO, CATEGORY, SP, SB, SD.
4. Centered search field.
5. Date buttons: 7D, 30D, 60D, 90D, 365D, ALL.

All menu controls use slight 3px corners, centered labels, matching outlines and a white selected state. The main navigation uses the same shape instead of pill corners. Its arrows and swipe/keyboard navigation remain available. Only the main category navigation slides horizontally; the picker uses a fixed grid and the six date buttons stay on one row. Below 600px, the eight picker buttons form two rows of four. Desktop uses one row of eight.

The previous View and Status sections, extra ALL target button, Targets/Portfolios shortcuts, and custom date/range controls are removed from this PPC menu. Selecting PPC from another workspace opens the same new inline picker rather than the old PPC menu. The other workspaces retain their established controls, with matching slight corners on category navigation and menu choices.

PPC starts with the menu closed. Closing it hides all four menu sections and puts the table immediately below the brand header. Opening it pushes the table down. Short-screen menus scroll independently, with a maximum height of 52% of the workspace so the table remains reachable. The table, chosen column width, filters and scroll state survive menu toggles. Escape, Info dialogs, native Accounting settings, Login and chat retain their behavior.

## Filtering and periods

CAMPAIGNS switches to independent campaign records. ASINS, KEYWORDS, AUTO and CATEGORY select the respective target records. Selecting an active entity button again clears that selection and returns to all targets. SP/SB/SD are a separate ad-type selection, which combines with the entity picker and search. Selecting an active ad-type button again clears it.

The current fictional fixture contains SP records. SB and SD therefore show a clear empty-state message, zero additive totals and unavailable ratios; they do not relabel SP data. Search matches names, campaign, portfolio, SKU, match type and ad type, using the underlying matching search terms.

The six date buttons select one period at a time. ALL means all available history, not multiple period blocks. The fixture has been extended to 365 daily records per search term (6 September 2025–5 September 2026), so 90D and 365D include their full requested history. ALL currently equals 365D because that is all available example history. Every existing 7D, 30D and 60D row metric remains exactly unchanged. Full example date coverage is available in the Info dialog.

## Table and retained behavior

The first header row contains centered column names such as `30D_CLICKS`; the second contains one centered, filter-aware TOTAL row. Both stay visible during vertical scrolling. There are no extra header bands, grouping rows or nested records. Totals count matching source evidence once and calculate ratios from summed values.

The default combined Targets view contains 29 independent targets: 18 keywords, 6 ASINs, 4 automatic targets and 1 category. Campaigns contains 4 independent campaigns. Existing direct links remain supported: `?workspace=targets`, `?workspace=asins`, `?workspace=campaigns`, and `?workspace=portfolios`. The preserved Portfolios direct view contains 3 portfolios; its shortcut is absent from the explicitly requested eight-button picker.

The first frozen column defaults to 20% of the table viewport on mobile and 300px on desktop. Its edge supports drag and keyboard resizing. Type-colored circular Info buttons retain full names, context, matching search terms and metrics. Existing positive and negative metric fills remain `rgb(183, 223, 207)` and `rgb(241, 198, 198)`.

The original Accounting report, all 215 action cells, 50-character action summaries, full details, circular action assets and product images are retained. No live advertising account is connected or changed. All PPC performance and ASIN records are fictional. TACoS remains unavailable because total product sales are not attributed to targets.

The read-only historical structure reference is [MAIN_KEYWORD](https://docs.google.com/spreadsheets/d/15GDQmpzYvHnZvdnSwH6NNLYuSGUCZmigYev3gntKoSQ/edit#gid=1233007547). Its performance records are not copied into this example.

## Verification

90 unit/model checks and 58 DOM integration checks passed (148 total). Coverage includes complete 90D/365D history, ALL aggregation, preserved prior period values, independent entity/ad filters, toggle-to-clear, search, empty results, exact control order and labels, menu navigation, totals, Info, resizing, and the existing Accounting/actions/chat behavior.

Run `npm test` and `DOLCE_QA_JSDOM=/path/to/jsdom node --max-old-space-size=4096 --test tests/*.integration.mjs`.

Browser verification covered 320×640 and 390×700 phones, 844×390 landscape and 1440×900 desktop: centered labels, consistent 3px corners, no filter/date horizontal overflow, menu-only slider visibility, proper page switching, independent short-screen menu scrolling and updated totals. No browser errors were logged. Physical phone testing was not available.
