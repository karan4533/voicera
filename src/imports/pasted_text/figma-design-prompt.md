Here's a detailed Figma prompt you can use:

---

## 🎨 Figma Design Prompt — Vocera AI Voice Platform

---

### **General Setup**
Create a Figma file named **"Vocera – AI Voice Agent Platform"** with **2 separate pages**:
- Page 1: `Login Screen`
- Page 2: `Dashboard`

Use a **1440 × 900** frame for both pages.

---

### **Design Tokens (Styles to define first)**

**Colors:**
- `cream/base` → `#F5F0E8`
- `amber/primary` → `#C8872A`
- `amber/hover` → `#B57622`
- `amber/light` → `#FDF3E3`
- `gray/900` → `#1E1A14`
- `gray/700` → `#4A453E`
- `gray/500` → `#7A746C`
- `gray/400` → `#9E9890`
- `gray/200` → `#E2DDD5`
- `gray/100` → `#F0EDE8`
- `white` → `#FFFFFF`
- `status/active-bg` → `#DCFCE7` | text `#15803D`
- `status/ringing-bg` → `#FFEDD5` | text `#C2410C`
- `status/hold-bg` → `#DBEAFE` | text `#1D4ED8`

**Typography:**
- Display / Brand → `Georgia`, Italic, Bold — used for "Vocera" wordmark
- Heading → `Inter`, 700, 22–26px
- Body → `Inter`, 400, 13–14px
- Label → `Inter`, 500, 12–13px
- Mono / Data → `Roboto Mono`, 400, 12px — used for phone numbers and durations

---

### **PAGE 1 — Login Screen**

**Frame:** 1440×900, background `#FFFFFF`

**Left Panel** (width: 580px, full height):
- Background fill: `#F5F0E8`
- Top-left: Logo group — square icon (28×28, fill `#1E1A14`, rounded rect with white line marks inside) + text "Heuristic Labs" in Inter 600, 15px, `#1E1A14`
- Center-left body text (vertically centered, nudged bottom):
  - Small label: "Welcome to" — Inter 500, 13px, uppercase, `#7A746C`, letter spacing 0.08em
  - Large wordmark: **"Vocera"** — Georgia Italic Bold, 56px, `#C8872A`, letter-spacing -1px
  - Subtitle: "AI Voice Platform for Smarter Conversations" — Inter 400, 16px, `#4A453E`, max-width 220px, line-height 1.5
- Bottom decoration: Layered wave SVG shape in `#C8872A` at 20–40% opacity, pinned to bottom of panel, full width

**Right Panel** (remaining width, centered content, max-width 360px):
- Heading: "Login to your account" — Georgia Bold, 26px, `#1E1A14`
- Subtext: "Enter your credentials to access the platform" — Inter 400, 13px, `#7A746C`
- **Email field** — label "Email" Inter 500 13px + input box (height 40px, border 1.5px `#E2DDD5`, radius 8px, placeholder `you@company.com`)
- **Password field** — same style + eye icon on right (Feather/Tabler `eye` icon, 18px, `#9E9890`)
- **Row:** Checkbox + "Remember me" (Inter 13px) left | "Forgot password?" (Inter 500 13px, `#C8872A`) right
- **Login button** — full width, height 44px, fill `#C8872A`, radius 8px, text "Login" Inter 600 15px white, hover fill `#B57622`
- **Footer note** — shield icon (14px) + "Secure login with JWT authentication" Inter 12px `#9E9890`, center-aligned

---

### **PAGE 2 — Dashboard**

**Frame:** 1440×900, background `#F9F9F7`

---

**Sidebar** (width: 200px, full height):
- Background: `#FFFFFF`, right border 1px `#E2DDD5`
- Top: Logo icon (30×30) + "Vocera" Georgia Italic Bold 18px `#C8872A`
- Nav items (height 40px each, padding 0 18px):
  - Icons: Tabler outline icons — Phone, Chart-bar, Book, Send, Settings
  - Labels: Inter 13px
  - **Active state** (Live Calls): left border 3px `#C8872A`, background `#FDF3E3`, text+icon `#C8872A`, weight 600
  - **Inactive state**: no border, text `#7A746C`, weight 400
- Bottom section (pinned to bottom, border-top 1px `#E2DDD5`):
  - "Help & Support" row — help-circle icon + Inter 12px `#7A746C`
  - User row — circular avatar 30px (`#E2DDD5` bg) + name "Admin User" Inter 600 12px + email Inter 11px `#9E9890` + chevron-down icon

---

**Top Bar** (height 56px, full remaining width):
- Background: `#FFFFFF`, bottom border 1px `#E2DDD5`
- Left: "Agent:" label Inter 500 13px + dropdown pill ("Restaurant Ordering" + chevron, bg `#F9F9F7`, border `#E2DDD5`, radius 6px, padding 5 10px)
- Right cluster (gap 24px between each):
  - **System Health** — label 10px muted + green dot (7px, `#22C55E`) + "Healthy" Inter 600 13px
  - **Active Calls** — label 10px muted + "12" Inter 700 18px
  - **Avg Latency** — label 10px muted + "420 ms" Inter 700 18px
  - Bell icon button — 36×36, border `#E2DDD5`, radius 8px

---

**Main Content Area** (padding 28px):

**Page title block:**
- "Live Calls" — Inter 700 22px `#1E1A14`
- "Real-time monitoring of all active calls" — Inter 400 13px `#7A746C`

**Metric Cards Row** (4 cards, equal width, gap 14px, height 80px):
- Each card: white bg, border 1px `#E2DDD5`, radius 10px, padding 14 16px
- Label: Inter 500 11px `#7A746C`
- Value: Inter 700 26px `#1E1A14`, letter-spacing -0.5px
- Values: `12` / `450` / `420 ms` / `92%`

**Active Calls Table Card:**
- White bg, border `#E2DDD5`, radius 12px
- Card header: "Active Calls" Inter 600 15px, padding 16 20px, bottom border
- Table columns: `Caller ID` | `Customer Name` | `Duration` | `Agent` | `Language` | `Status` | `Actions`
- Header row: bg `#F9F9F7`, text Inter 600 10px uppercase `#7A746C`, letter-spacing 0.06em
- Data rows (height 44px, hover bg `#F9F9F7`, bottom border `#F0EDE8`):

| Caller ID | Name | Duration | Agent | Language | Status |
|---|---|---|---|---|---|
| +91 98765 43210 | Ramesh Kumar | 02:15 | Restaurant | Tamil | 🟢 Active |
| +91 91234 56789 | Priya Sharma | 01:48 | Restaurant | Hindi | 🟢 Active |
| +91 99887 76655 | Arun Dev | 00:32 | Restaurant | English | 🟠 Ringing |
| +91 87654 32109 | Meena R | 05:10 | Restaurant | Tamil | 🔵 Hold |

- Caller ID + Duration: `Roboto Mono` 400 11px
- Status badges: pill shape, radius 20px, 11px bold — use status colors above
- Actions column: two icon buttons — `eye` (view) and `phone-off` (red tint) each 28×28 border radius 5px

---

### **Components to create as reusable Figma components:**
- `Button/Primary` (amber fill, full width variant + fixed width)
- `Input/Default` (with label slot, placeholder, optional icon)
- `Badge/Status` (Active / Ringing / Hold variants)
- `Nav/Item` (active + inactive states)
- `Card/Metric`
- `Table/Row`

---

Paste this into Figma AI, a designer handoff doc, or use it to build manually — every measurement, color, and font decision is fully specified.