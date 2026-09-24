# Investment Portfolio Web App — Requirements

## 1. Overview
A multi-tenant web app to track stocks and crypto purchases, calculate realized profit/loss on sales, and visualize portfolio composition per user. Any Google account can sign in; each user only ever sees their own transaction/holding data — with one deliberate exception: manually entered current prices (2.10) are shared globally across all users, since a stock's price isn't user-specific. Currency: **PKR only**. There is no automated live price feed this quarter — realized profit/loss is calculated when a holding is sold, based on the recorded sell price. Unrealized profit/loss on open positions is supported through the shared, manually entered current price (see 2.10) as an interim stopgap until an automated PSX scraper is built in a later phase (see 2.11).

**Scope note:** Because there is no automated live pricing, "current market value" is only as accurate and as current as whichever user last updated the price for that symbol — it is not fetched or verified automatically this quarter.

---

## 2. Functional Requirements

### 2.1 Authentication & Access Control
- **Login:** "Sign in with Google" only — no password gate, no email allowlist, no other auth provider. Any Google account can sign in and use the app.
- **Data isolation is the app's actual security boundary.** There is no gate on who gets in — the requirement is that no logged-in user can ever see another user's data. Every document a user creates is stamped with their `uid`. Firestore Security Rules must enforce `request.auth.uid == resource.data.userId` on every read and write to `transactions`, `holdings`, and `types` (if scoped per user). If this rule is wrong or missing, one user can read or write another user's portfolio. This must be correct and tested before launch — it is not optional hardening, it is the only thing standing between users' data.
- **Session persistence & expiry:** Store a `lastLoginAt` timestamp on the user document at sign-in. On each app load, compare it to the current date — if more than **14 days** have passed, force logout regardless of activity.
- **Protected routing:** All routes except the login page must be protected and redirect unauthenticated users back to login.
- **Onboarding:** fully self-serve. Anyone with the link clicks "Sign in with Google" and has a working account immediately — no approval step, no invite, no waiting.
- **Admin flag:** each user document carries an `isAdmin` boolean, defaulting to `false`. This is not set through any UI in the app — it's managed manually, directly in the Firebase console, by you. It exists solely to gate who can edit shared current prices (see 2.10); it has no other effect on the app.

### 2.2 Stock Management

**Add stock (buy transaction)**
Required fields:
- Symbol
- Name
- Shares bought
- Price per share at purchase
- **Buy date** — the date the purchase was made (not the date it was entered into the app; user-selectable, defaults to today)
- Type/category (controlled list — see 2.5, not free text)

**Cost basis method:** Average cost. If the same symbol is bought at multiple prices across multiple transactions, the app calculates a weighted average cost per share for that holding.

**Edit stock (buy transaction)**
- User can edit a previously entered buy transaction (fix typos in symbol, name, shares, price, type) — but only the **unsold portion**.
- **Locking behavior:** if 35 of 100 shares from a buy lot are sold, the 35 sold shares become a locked/immutable record. The remaining 75 unsold shares stay in a separate, fully editable and sellable record.
- **Locking is per-lot, not per-symbol.** A single holding can have multiple transaction records simultaneously — some locked, some active — as it's sold down in stages. Example: buy 100 shares → sell 35 → Record A (35 shares, locked) and Record B (75 shares, active) both now exist for that symbol. Selling more shares later is a new sell action performed against Record B (the active remainder) — it does not touch Record A. The "disabled" UI state must apply per-record, never to the whole symbol/holding — otherwise there's no way to sell a position down in multiple stages, which defeats the feature.
- **Enforcement happens at two layers, not one:**
  1. UI disables the edit/sell control on locked records so users don't attempt it.
  2. Firestore Security Rules deny any `update` on a `transactions` document where `locked == true`, regardless of what the client sends. The UI layer alone is not real enforcement — a direct write to Firestore would bypass a disabled button with no rule backing it.
- A full sell of a lot (100/100) locks the entire lot; there's no remaining editable record for it.

**Sell stock**
- User selects a held stock and enters the number of shares to sell (dynamic — not fixed to the full position), the sell price, and the **sell date** (user-selectable, defaults to today).
- Profit/loss on the sold portion is calculated as: `(sell price − average cost) × shares sold`.
- **Validation, enforced not just warned about:** cannot sell more shares than currently held for that symbol; shares and price must be greater than 0.
- Sold stock/shares are **never deleted**. They remain visible, tagged "Sold" inline or in a dedicated "Sold" tab/view.
- Partial sells: the unsold remainder stays in the active/held view at the same average cost basis (per the lot-splitting behavior above).

**General validation (applies to all buy/sell entries)**
- Shares and price fields must be positive numbers.
- Symbol/name required, non-empty.
- A duplicate symbol entry on a new "buy" is treated as an additional lot for the same holding, contributing to the average cost — not a separate independent holding.

### 2.3 Crypto Management
- Same functional structure as stocks: add (buy), edit, sell, with the same field set (symbol, name, amount bought, price bought at, buy/sell date, type) and the same average-cost, locking, and validation rules.
- Crypto lives in its own separate tab from stocks, with its own dataset and its own graphs (not merged with stock data).

### 2.4 Dashboard / Summary
A top-level summary view, at minimum showing:
- Total amount invested (cost basis) across current open holdings — separated by stocks and crypto.
- Total realized profit/loss from all sold positions.
- Count of active holdings vs. sold holdings.
- Total unrealized profit/loss, pulled from `currentPrices` (see 2.10) where available — shown separately from realized P/L, not summed together, since one is based on actual completed sales and the other on a manually entered, unverified price.
- Total dividends earned (see 2.11), shown as its own figure — not folded into realized or unrealized P/L.

**Additional graphs, now that current prices exist (2.10) — recommended:**
- **Invested vs. Current Value** (grouped bar chart): total cost basis vs. total current value (shares × current price) per symbol, or aggregated across the whole portfolio. Makes over/under-performing positions visible at a glance, something the original cost-basis-only dashboard couldn't show.
- **Top movers** (horizontal bar, gainers and losers): the symbols with the largest unrealized P/L, positive and negative, ranked. Only meaningful once a handful of symbols have a manually entered current price — show nothing or an empty state until then.
- **Realized vs. Unrealized P/L** (simple two-bar or donut comparison): total realized profit/loss (from actual sales) next to total unrealized profit/loss (from `currentPrices`), so it's visually obvious which number is "locked in" and which is still an estimate.
- **Portfolio allocation by current value** (pie/donut): same idea as the existing allocation-by-type chart in 2.6, but weighted by current value instead of cost basis, for symbols with a current price set. Diverges from the cost-basis version when some positions have gained or lost more than others — both are worth keeping since they answer different questions ("where did I put my money" vs. "where is my money now").
- These all degrade gracefully for symbols without a manually entered current price — exclude them from current-value-based charts rather than treating missing price as zero, which would silently understate the numbers.

This is in addition to the allocation/type graphs — it's the single "how am I doing" glance view.

### 2.5 Categorization ("Type")
- Type/category is a **controlled list** (dropdown) — e.g., Oil & Gas, IT, Banking, FMCG, Other — not free text.
- Users may add new categories to the list, but each transaction must select from existing values, not type freely.
- Reason: the allocation-by-type graph groups on this field. Free text produces inconsistent duplicate categories (e.g., "IT" vs. "IT Company" vs. "Tech") and breaks the chart over time.
- Starting categories: Oil, IT, Banks, plus an "Add new type" option in the dropdown.

### 2.6 Graphs & Visualization
- Stocks tab: allocation by type/category (pie/donut), total invested vs. total realized profit/loss, share/position count breakdown.
- Crypto tab: same graph set, computed independently from stock data.
- No historical portfolio-value-over-time chart — not feasible without live pricing, confirmed out of scope.

### 2.7 Holdings View
A dedicated view of the user's holdings, **separate from Transaction History (2.8)** — this shows current position state, not a chronological log of actions.
- **Two tabs: Active and Sold.** Active shows unsold/partially-unsold lots; Sold shows fully or partially sold lots.
- **Follows the same per-lot behavior as 2.2.** Because a partial sell splits a holding into a locked sold record and a separate active record (see 2.2), the *same symbol* can appear in both tabs at once — e.g., after selling 35 of 100 shares, that symbol shows a 35-share row under Sold and a 75-share row under Active. This view does not merge them back into one row; it reflects the underlying per-lot data as-is.
- **Search:** a search field to filter holdings by symbol or name, scoped to whichever tab (Active/Sold) is currently open.
- Applies to both the Stocks and Crypto tabs independently (2.2/2.3).

### 2.8 Transaction History
A separate, chronological log of every buy and sell action ever recorded — distinct from the Holdings View above. Where Holdings View shows current position state grouped by lot, Transaction History is a flat, dated list of individual actions (every buy, every sell, including sold-and-locked records), primarily useful for audit/review rather than "what do I currently hold."
- Each row shows: date, symbol, action (buy/sell), shares, price, and — for sell rows — realized P/L.
- Not paginated by tab (Active/Sold) since every action is already dated and final; sortable/filterable by date.

### 2.9 PDF Export
- **Transaction History PDF:** downloadable with an optional date filter that limits the export to transactions up to (and including) the selected date. This is a straightforward date-filtered query against `transactions` (the source of truth already has a `date` field per record, per 3.2).
- **Holdings PDF:** exports the full current Holdings View (Active + Sold, per 2.7) as-is — **no date filter**. Since the `holdings`/per-lot data only reflects present state, "holdings as of a past date" was considered and dropped for now; the export always reflects what's currently in the app.
- PDF generation should run client-side or via a lightweight Cloud Function — no new backend infrastructure required, but confirm which before implementation since it affects whether large exports block the UI thread.


### 2.10 Manual Current Market Value (Interim Feature)
An interim, manual substitute for live pricing — a stopgap until the PSX scraper (see note in 2.11) is built, not a permanent feature.
- **Admin-only page.** Only users with `isAdmin: true` on their user document (see 2.1) can see the navigation entry for this page and edit prices on it. Non-admin users don't see the page at all — it's not a disabled/read-only view for them, it's absent from their navigation entirely. Everyone (admin or not) still benefits from the resulting current-price data elsewhere in the app (Dashboard, allocation-by-current-value graphs), since prices themselves are shared/global (see below) — only the *editing* is restricted.
- **Separate page** from Holdings View (2.7), listing every **distinct symbol** currently held across all users, deduplicated — one row per symbol, aggregated across all its active lots (a symbol can have multiple active lots from repeat buys or partial sells, per 2.2; this page sums them into a single row, unlike Holdings View which shows per-lot rows).
- Each row shows: symbol, total active shares held, average buy price (already computed), and an editable **Current Price** field the admin types in and saves manually. No automatic fetch.
- Computed per symbol: `unrealized P/L = (current price − average buy price) × total active shares`. Also shown: a portfolio-wide total unrealized P/L, summed across all symbols with a manually entered price.
- **This is explicitly not robust and the user has acknowledged that** — there's no "as of" timestamp guarantee, no freshness check, and figures are only as accurate as the last manual update. Symbols with no manually entered price simply show no unrealized P/L (not an error state, just blank/omitted).
- **Data scoping — resolved: global, not per-user.** Current prices are shared across all users — one price per symbol, visible to everyone logged in but writable only by admins. This is more efficient than everyone re-entering the same PSX price, and now that only admins can write, it also avoids the earlier concern about any random user's typo corrupting shared data. The security rule needs to check the `isAdmin` field on the requesting user's own document, not just whether they're authenticated — Firestore rules support this via a `get()` lookup on the `users` collection inside the rule (`get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true`), which costs an extra read per write but is the standard way to do role-based rules in Firestore. Reads remain open to any authenticated user.
- **Forward-compatible schema:** shape this collection (`symbol`, `price`, `updatedAt`, `updatedBy` for accountability) so that when the PSX scraper is eventually built, it can either replace this collection outright or run alongside it without a rewrite of the P/L calculation logic that reads from it.


### 2.11 Dividends
A separate, standalone page — distinct from Holdings View, Transaction History, and the Manual Current Market Value page.
- **Scope — confirmed: stocks only, not crypto.** Crypto doesn't have traditional dividends; if staking/reward income tracking is wanted later, that's a separate feature, not folded into this one.
- **Add dividend:** user selects a symbol from a dropdown listing **any stock they have ever bought** — active holdings and fully-sold positions alike, not just currently active ones. This resolves the earlier record-date edge case: a dividend received while holding a position that's since been fully sold can still be logged. Also requires: amount received (PKR) and date received.
- **Editing/deleting — confirmed: locked, same as sold-stock records.** Once created, a dividend record is permanent — no edit, no delete. Enforced at the same two layers as the sold-lot locking in 2.2: the UI has no edit/delete control on a dividend row, and Firestore Security Rules deny any `update` or `delete` on a `dividends` document outright (only `create` is allowed). This keeps dividend history as reliable a record as your realized-sale history.
- **Kept separate from P/L, not merged in:** dividend income is not folded into realized or unrealized profit/loss calculations (2.2/2.10) — it's tracked and shown as its own number. This keeps the existing P/L formulas untouched rather than retroactively redefining what "profit" means. If you later want a combined "total return" figure (realized P/L + unrealized P/L + dividends), that's an additive dashboard card, not a change to the underlying calculations.
- **Dashboard integration (2.4):** a total dividends earned figure, and at least one graph — dividends by symbol (bar chart, which symbol has paid the most) is the most directly useful. A dividends-over-time chart is also viable here (unlike a portfolio-value timeline, which is out of scope) since dividend records already carry a date and don't depend on live pricing — worth adding if you want to see dividend income trend by month/quarter/year.


### 2.12 Out of Scope (explicitly excluded)
- **Automated** live/current market price integration (the PSX scraper) — deliberately deferred, not part of this quarter's build. A manual interim substitute exists instead (see 2.10).
- Brokerage/transaction fee tracking.
- Multi-currency support (PKR only).
- CSV import/export.
- Historical portfolio value timeline.

---

## 3. Technical Requirements

### 3.1 Frontend
- **Framework:** Next.js
- **Language:** TypeScript — avoid `any` unless strictly necessary.
- **UI Library:** shadcn/ui
- **Icons:** lucide-react
- **Layout:** Minimalist, uncluttered. Single sidebar for navigation/logout; all page content renders to the right of the sidebar.
- **Design direction:** Dark theme by default — deliberately not pure black. Use a deep charcoal/navy base (e.g., a near-black with a slight blue tint, not `#000000`) for the page background, with a distinct, slightly lighter tone for cards/surfaces so content has visible depth against the background — this is the actual difference between "dark theme" and "just inverted colors," and it's what makes Binance-style and similar fintech dark UIs feel designed rather than default. Aesthetic reference: Binance.com and openstocky.com, for general dark-fintech feel only — not copied layouts or components.
- **Accent color — kept separate from profit/loss colors, and this distinction matters:** pick one accent color for primary actions, links, and branding (e.g., an electric blue, cyan, or amber — something that isn't green or red). Don't let the brand accent double as a semantic color. If your primary "Add Stock" button or active nav item is green, it visually competes with "green = profit" everywhere else on the page and undermines the one signal that's supposed to mean something specific. Keep green and red reserved *only* for the financial semantics below.
- **Semantic color coding, applied consistently everywhere these appear:**
  - Profit / realized or unrealized gain → green.
  - Loss → red (a red with enough presence to read clearly on a dark background, not a muddy or desaturated tone that disappears against the charcoal base).
  - Buy actions/buttons → green.
  - Sell actions/buttons → red.
  - This applies uniformly across the Dashboard figures, Holdings View, Transaction History, the graphs (2.6, 2.4's new charts), and the Manual Current Market Value page (2.10) — same two colors, same meaning, everywhere in the app.
- **Centralized theming, not per-component colors:** all of the above — background, surface, accent, profit-green, loss-red, typography — must be defined once as a shared token system (e.g., CSS variables or a Tailwind theme config) and referenced by every component, never redefined or hardcoded locally. This is what actually guarantees the consistency required above (the same green everywhere, the same accent everywhere), and it means a future theme tweak is a single-file edit instead of a hunt through every component that happens to use a color.
- **Icon-first buttons and labels, throughout:** every primary action button (Buy, Sell, Add Dividend, Add Type, Download PDF, Logout, etc.) leads with a lucide-react icon before its text label, not text alone. Suggested pairings to keep consistent: Buy → `TrendingUp` or `ArrowUpRight`; Sell → `TrendingDown` or `ArrowDownRight`; Add/Create → `Plus` or `PlusCircle`; Edit → `Pencil`; Delete/Lock → `Lock` or `Trash2`; Download → `Download`; Search → `Search`. Pick one icon per action and reuse it everywhere that action appears — a "Sell" button should use the same icon on the Holdings page as it does in Transaction History, so the icon itself becomes a learned signal, not decoration that changes per screen.
- **Mobile responsiveness applies to all of the above**, not just layout — icon-and-text buttons need to remain legible (not just icon-only) at small breakpoints, and dark-theme contrast (accent vs. background, green/red vs. background) needs to hold up on smaller, often lower-brightness phone screens, not just look right on a desktop monitor. The app is fully mobile-responsive end to end, not just on these specific elements.
- **State management:** Redux Toolkit.
- **Data fetching/caching:** RTK Query for all Firebase/Firestore read/write operations (or a compatible custom base query wrapping Firebase calls).
- **UI states:** every data-driven view must explicitly handle loading (skeleton loaders, not blank screens or spinner-only), error, and empty states (e.g., no holdings yet).
- **Toast notifications:** used wherever applicable — success confirmation on add/edit/sell, error toasts on failed writes, and validation-failure toasts (e.g., attempting to sell more shares than held).
- **Component structure:** each UI element broken into its own component; no monolithic page files.
- **Routing:** protected routes — unauthenticated access redirects to the login page.

### 3.2 Backend / Data
- **Platform:** Firebase (Firestore for data, Firebase Auth for identity).
- **Auth flow:** Google Sign-In (Firebase Auth) → session persisted with a stored `lastLoginAt`, checked against the 14-day expiry on load (see 2.1).
- **Firebase logic isolation:** all Firebase calls/config isolated into their own service/module layer — not inlined across components or Redux logic. This layer is the only part of the codebase that talks to Firebase directly.
- **Multi-tenant isolation:** every document is stamped with `userId`. Firestore Security Rules enforcing `request.auth.uid == resource.data.userId` are the app's actual data-isolation boundary (see 2.1) and must be correct and tested — there is no other access restriction.

**Collections:**
- **`transactions`** — source of truth. One document per buy or sell action: `userId`, `holdingSymbol`, `assetClass` (`stock`/`crypto`), `type` (`buy`/`sell`), `shares`, `price`, `date`, `locked` (bool), `realizedPL` (sell records only). This is where the per-lot locking from 2.2 actually lives and is enforced.
- **`holdings`** — a denormalized summary document per symbol per user, rebuilt from `transactions` whenever one changes: `userId`, `symbol`, `type/category`, `totalShares`, `avgBuyPrice`, `status` (`active`/`partially_sold`/`sold`). Exists purely so dashboard/graph reads don't have to sum every transaction on every page load.
- **`types`** — a list/collection of category values, **assumed per-user** for the rules below (each user maintains their own dropdown) — confirm if you'd rather this be global/shared like `currentPrices`, the same trade-off discussed in 2.10.
- **`currentPrices`** — manually entered current price per symbol (see 2.10), **global, not user-scoped**: `symbol`, `price`, `updatedAt`, `updatedBy`. One document per symbol, shared across all users. Security rule: readable by any authenticated user; writable only by users whose `users/{uid}.isAdmin == true` (checked via a `get()` lookup in the rule, since Firestore rules can't read custom claims set outside Firebase Auth directly from a plain boolean field without one).
- **`users`** — `uid`, `email`, `lastLoginAt` (drives the 14-day expiry check), `isAdmin` (boolean, defaults `false`, set manually via the Firebase console — gates write access to `currentPrices`, see 2.10).
- **`dividends`** — `userId`, `symbol` (any stock symbol the user has ever bought, active or fully sold, per 2.11), `amount`, `date`. Permanently locked once created: Firestore Security Rules allow `create` but deny `update` and `delete` outright — no per-lot partial-locking logic needed here (unlike `transactions`), since the whole record is immutable from the moment it's written.

**Why this shape, specifically:**
- `transactions` is separate from `holdings` because the per-lot lock needs to deny writes to one *specific* sold lot at the Security Rules level, and Firestore rules cannot restrict updates to a single element inside an array field — only to whole documents. Separate documents let each lot be individually locked.
- `type` is a **field** on a holding, not a parent container — holdings are NOT nested as children of type documents. Type is a many-to-one categorical attribute; treating it as a parent node would mean re-categorizing a holding requires moving it between parent containers, and "all of a user's holdings" would require a cross-collection query instead of one filtered query. `type` as an indexed field avoids both problems.

### 3.2.1 Firestore Security Rules
This is the actual enforcement layer for everything described above — isolation between users (2.1), per-lot locking on sold shares (2.2), admin-only price edits (2.10), and permanent dividend records (2.11). UI restrictions (disabled buttons, hidden nav items) are a usability layer on top of this, never a substitute for it. Deploy this as `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    function ownerUnchanged() {
      return request.resource.data.userId == resource.data.userId;
    }

    // USERS — each user reads/writes only their own doc.
    // isAdmin can never be set or changed by the client; only via the
    // Firebase console (2.1), which uses the Admin SDK and bypasses these rules.
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isOwner(userId)
                    && request.resource.data.isAdmin == false;
      allow update: if isOwner(userId)
                    && request.resource.data.isAdmin == resource.data.isAdmin;
      allow delete: if false;
    }

    // TRANSACTIONS — source of truth for buys/sells (2.2).
    // A locked (sold) record can never be updated again, by anyone, for any reason.
    // No document in this collection is ever deleted.
    match /transactions/{transactionId} {
      allow read:   if isOwner(resource.data.userId);
      allow create: if isOwner(request.resource.data.userId);
      allow update: if isOwner(resource.data.userId)
                    && resource.data.locked != true
                    && ownerUnchanged();
      allow delete: if false;
    }

    // HOLDINGS — denormalized per-symbol summary, fully owned by the user (3.2).
    match /holdings/{holdingId} {
      allow read:   if isOwner(resource.data.userId);
      allow create: if isOwner(request.resource.data.userId);
      allow update: if isOwner(resource.data.userId) && ownerUnchanged();
      allow delete: if isOwner(resource.data.userId);
    }

    // TYPES — category dropdown values (2.5). Assumed per-user; change the
    // read rule to isSignedIn() if these should be global/shared instead.
    match /types/{typeId} {
      allow read:   if isOwner(resource.data.userId);
      allow create: if isOwner(request.resource.data.userId);
      allow update: if isOwner(resource.data.userId) && ownerUnchanged();
      allow delete: if isOwner(resource.data.userId);
    }

    // CURRENT PRICES — global, shared across all users (2.10).
    // Anyone signed in can read; only admins can write, in any form.
    match /currentPrices/{symbol} {
      allow read:  if isSignedIn();
      allow write: if isAdmin();
    }

    // DIVIDENDS — permanently immutable once created (2.11).
    match /dividends/{dividendId} {
      allow read:   if isOwner(resource.data.userId);
      allow create: if isOwner(request.resource.data.userId);
      allow update: if false;
      allow delete: if false;
    }
  }
}
```

**Notes on using this:**
- `get()` calls (used in `isAdmin()`) each count as an extra document read against your Firestore quota — negligible at your scale, but worth knowing it's not free.
- Test these directly in the Firebase Console's Rules Playground, or with the Firestore emulator, before relying on the app's UI to tell you they work — the UI will look correct even if a rule is wrong, since the UI is what decides what to *show*, not what Firestore will actually *allow*. This is exactly what the "if comfortable" direct-write tests in section 4 (4.1, 4.8, 4.10) are for.
- If you change `types` to global scoping, update both the rule's `read`/`create`/`update`/`delete` lines (drop the `isOwner` checks in favor of `isSignedIn()` for read and something like `isAdmin()` for write, mirroring the `currentPrices` pattern) and the schema note above it.



### 3.3 Code Standards
- Consistent, documented folder structure (e.g., `/components`, `/features` or `/store` for Redux slices, `/services/firebase`, `/lib`, `/types`).
- Shared TypeScript types/interfaces for holdings, transactions, and categories, used across Redux, components, and the Firebase layer.

---

## 4. Manual Testing Checklist
All testing is manual, performed by you before going live. No automated test suite is required. Each item below is a scenario to walk through by hand and confirm the actual result matches the expected behavior described elsewhere in this document.

### 4.1 Authentication & Access
- Sign in with Google succeeds and lands on the app, not the login page.
- Signing out clears the session and returns to the login page; attempting to navigate back doesn't restore access.
- Directly visiting a protected URL while logged out redirects to login instead of showing content.
- Two different Google accounts each see only their own stocks/crypto/dividends — add data on Account A, confirm none of it appears anywhere for Account B.
- A non-admin account does not see the Manual Current Market Value nav item or page at all (2.10).
- An admin account (`isAdmin: true`, set manually in Firebase console) does see and can use that page.
- Session force-logs-out after the 14-day window — test by manually editing `lastLoginAt` in Firestore to a date more than 14 days ago, then reloading the app.

### 4.2 Stock Buy / Sell / Edit (2.2)
- Add a buy transaction with all fields; confirm it appears in Holdings (Active tab) and Transaction History.
- Add a second buy for the same symbol at a different price; confirm the average cost recalculates correctly (weighted average, not a simple average).
- Try to sell more shares than currently held; confirm it's blocked, not just warned.
- Try entering 0 or a negative number for shares or price on a buy or sell; confirm it's blocked.
- Sell part of a position (e.g., 35 of 100 shares): confirm a 35-share row appears under Sold, a 75-share row remains under Active, and both belong to the same symbol.
- Confirm the 35-share Sold row has no edit control and cannot be modified.
- Confirm the 75-share Active row can still be edited and sold further.
- Sell the remaining 75 shares; confirm the symbol now shows fully under Sold with no remaining Active row.
- Edit a typo (shares, price, type) on a buy lot that has no sells against it; confirm the change saves and the average cost / dashboard totals update accordingly.
- Confirm buy date and sell date both save and display correctly, and aren't silently defaulted when a specific date is entered.

### 4.3 Crypto (2.3)
- Repeat every scenario in 4.2 under the Crypto tab.
- Confirm a crypto purchase never appears in the Stocks tab, its Holdings View, its graphs, or its Dashboard totals — and vice versa.

### 4.4 Categorization / Type (2.5)
- Add a new type via "Add new type" in the dropdown; confirm it saves and is selectable on the next buy transaction.
- Confirm the default starting types (Oil, IT, Banks) are present.
- Confirm there's no way to free-type a category — only dropdown selection.

### 4.5 Holdings View (2.7)
- Confirm Active and Sold tabs show correct, separate rows reflecting the per-lot locking behavior from 4.2.
- Search by symbol and by name within the Active tab; confirm only matches show.
- Search within the Sold tab; confirm it's scoped to Sold only, not pulling in Active results.
- After a partial sell, confirm the same symbol legitimately appears in both tabs at once as separate rows.

### 4.6 Transaction History (2.8)
- Confirm every buy and sell you've ever made appears as its own dated row.
- For a sell row, manually calculate `(sell price − average cost) × shares sold` and confirm it matches the displayed realized P/L exactly.
- Sort or filter by date and confirm results update correctly.

### 4.7 PDF Export (2.9)
- Export Transaction History with no date filter; confirm every transaction is included.
- Export Transaction History with a date filter set to a specific past date; confirm only transactions on or before that date appear, and nothing after.
- Export Holdings as PDF; confirm it matches the current on-screen Active + Sold state exactly, and confirm there's no date filter option on this export (by design, per 2.9).
- Open each exported PDF on both desktop and a phone; confirm it's readable and correctly formatted on both.

### 4.8 Manual Current Market Value (2.10)
- As an admin, confirm the page lists every distinct symbol currently held, one row per symbol — not one row per lot, even if you hold that symbol across multiple active lots.
- Enter a current price as admin; confirm it saves and immediately shows up for a different (non-admin) account too, confirming the global scoping is working.
- As a non-admin, confirm you cannot reach the page even by typing its URL directly, not just that it's hidden from navigation.
- If comfortable doing so, try writing directly to the `currentPrices` collection in the Firebase console or dev tools as a non-admin account and confirm Firestore rejects it.
- For a symbol with a current price set, manually calculate `(current price − average buy price) × total active shares` and confirm it matches the displayed unrealized P/L.
- For a symbol with no current price entered, confirm it shows no unrealized P/L figure (blank/omitted), not a zero.

### 4.9 Dashboard & Graphs (2.4, 2.6)
- Manually total your invested amount, realized P/L, unrealized P/L, and dividends from the raw data; confirm each dashboard figure matches.
- Confirm realized P/L and unrealized P/L are shown as two separate numbers, never added together into one.
- Confirm the Invested vs. Current Value, Top Movers, Realized vs. Unrealized P/L, and allocation-by-current-value graphs each render and reflect the correct underlying numbers.
- Confirm a symbol with no manually entered current price is excluded from current-value-based graphs, not counted as zero.
- Confirm the cost-basis allocation graph and the current-value allocation graph genuinely diverge once at least one holding has a meaningfully different current price from its cost.

### 4.10 Dividends (2.11)
- Add a dividend against a symbol you currently actively hold; confirm it appears on the Dividends page.
- Add a dividend against a symbol you've fully sold in the past; confirm the dropdown allows selecting it (per the "any stock ever bought" decision).
- Confirm a dividend record has no edit or delete control once saved.
- If comfortable, try a direct Firestore update or delete on a dividend document and confirm it's rejected.
- Confirm the total dividends figure on the Dashboard matches the sum of every dividend record.
- Confirm the dividends-by-symbol graph renders correctly against your actual entries.

### 4.11 Theme & UI (3.1)
- Confirm the dark background is not pure black, and cards/surfaces are visibly a different, lighter tone than the page background.
- Confirm the accent color used for primary buttons/branding is visually distinct from both the profit-green and loss-red.
- Confirm profit figures are green and loss figures are red, consistently, across the Dashboard, Holdings View, Transaction History, and every graph.
- Confirm Buy buttons are green and Sell buttons are red everywhere they appear.
- Confirm every primary action button (Buy, Sell, Add, Edit, Download, Search, Logout) shows its icon before its text label, and that the same action uses the same icon on every screen it appears on.
- Open the app on an actual phone (not just a resized desktop browser window) and check every page — Dashboard, Holdings, Transaction History, PDF export, Manual Current Market Value, Dividends — for legibility and usability at that size.

### 4.12 Toasts & Error States
- Confirm a success toast appears after adding, editing, or selling a stock/crypto position, and after adding a dividend.
- Confirm an error toast appears on a failed write (e.g., disconnect your network mid-save and try again) and on a validation failure (e.g., attempting to sell more shares than held).
- Confirm loading skeletons appear on initial page load for data-heavy views (Dashboard, Holdings, Transaction History) rather than a blank screen or an indefinite spinner.
- Confirm each view's empty state (no holdings yet, no transactions yet, no dividends yet) shows a clear message rather than a blank or broken-looking page.

---

## 5. Recommended Development Approach
**Build module by module, not all at once.** Each module below should be built, then walked through its matching section-4 checklist, bugs fixed, before starting the next one. This isn't just caution for its own sake — the spec has real dependencies (average cost feeds the dashboard, holdings feed PDF export, auth gates everything), and a bug caught right after the module that introduced it is far cheaper to fix than the same bug discovered three features later, buried under everything built on top of it since.

**Order, and why:**

1. **Foundation** — Next.js + Firebase project setup, Google Sign-In, protected routing, the `users` collection with `isAdmin`, the base security rules skeleton (3.2.1), and the global theme/design tokens (3.1) — dark background, surface tone, accent color, semantic green/red, sidebar layout. Establish the theme here, not at the end: retrofitting consistent colors across already-built pages is far more work than starting every subsequent module on top of tokens that already exist. Test against: 4.1, the rendering parts of 4.11.
2. **Types + Stock Management** — the category dropdown (2.5) has to exist before the Add Stock form does, so build it first, then Add/Edit/Sell Stock (2.2): average cost, per-lot locking, validation, security rules on `transactions`/`holdings`. This is the most logic-dense module in the whole app — get it right here, since Crypto, Dashboard, Holdings View, and PDF Export all build on top of it. Test against: 4.2, 4.4.
3. **Crypto** — mirrors Stock Management exactly (2.3); lower risk once the stock pattern is proven correct. Test against: 4.3.
4. **Holdings View + Transaction History** — 2.7 and 2.8, both reading from data the first three modules already produce. Test against: 4.5, 4.6.
5. **Dashboard + Graphs (cost-basis portion only)** — 2.4 and 2.6, but only the parts that don't depend on current prices yet: total invested, realized P/L, allocation by type. Test against the relevant parts of 4.9.
6. **PDF Export** — 2.9, depends on Holdings View and Transaction History already working correctly. Test against: 4.7.
7. **Manual Current Market Value + admin gating** — 2.10, including the `isAdmin` security rule. Once this exists, go back and add the unrealized-P/L pieces to Dashboard/Graphs that couldn't be built in step 5 (Top Movers, Invested vs. Current Value, allocation by current value). Test against: 4.8, the rest of 4.9.
8. **Dividends** — 2.11, plus the dividends total/graph on the Dashboard. Test against: 4.10.
9. **Final pass** — a full run through every section of the Manual Testing Checklist (section 4) end to end, not just the module you just built, since later modules can break earlier ones in ways a single module's test pass wouldn't catch (e.g., a Dashboard change that breaks a Holdings figure). Also the point to catch anything from 4.11/4.12 (toasts, loading/empty states, icon/color consistency) that wasn't fully nailed down per-module.

**One thing this order assumes:** toasts, loading states, error states, and empty states (3.1, 4.12) are built *within* each module as it's developed, not deferred to a separate "polish" pass at the end — bolting them on afterward across nine already-built modules is more work and easier to miss spots than including them from the start of each one.




