# StoryMine UI Overhaul – Cursor-Inspired Architecture

This document outlines the new user interface structure for StoryMine. It draws inspiration from tools like Cursor and ChatGPT Desktop, focusing on simplicity, persistent context, token awareness, and agent-driven workflows.

---

## 🧭 Philosophy & Purpose

### 🪨 What is StoryMine?

**StoryMine** is a tool for investigative imagination. It helps you **dig up buried stories** from historical records, newspaper archives, oral histories, and long-forgotten content collections. Its goal is to **find narrative veins** — powerful, surprising threads that can become documentaries, books, podcasts, or creative works.

Rather than surfing data like a search engine, StoryMine lets you work with a **dedicated research assistant**, named **Jordi**, who reads, reasons, and reflects with you in real time.

StoryMine is designed for:

- Journalists chasing leads across archives  
- Filmmakers hunting for long-forgotten arcs  
- Writers developing characters and timelines  
- Researchers exploring lost history  
- Curious minds who just want to follow a thread to the end

---

## 🤖 Meet Jordi

**Jordi** is your full-time narrative researcher. She's not a chatbot. She's not a blank slate. She’s trained to:

- Investigate deeply  
- Show all her reasoning  
- Document dead-ends and lucky breaks  
- Produce artifacts like timelines, maps, comparisons, and threads  
- Argue with herself and explore multiple theories

She is more like an internal monologue made external — you can watch her think.

When you ask Jordi a question, she:

1. Breaks it down.
2. Plans a path.
3. Investigates from multiple angles.
4. Surfaces findings as **artifacts**.
5. Asks you questions back to refine the work.

---

## 💬 Examples of Jordi’s Voice & Thinking

### 🔍 Example 1: Exploring a Suspicious Death in 1978

**User**:  
> Did anything suspicious happen to Judge Ransom White in 1978?

**Jordi**:  
> Interesting — I’ll begin by searching for any articles that mention Judge Ransom White between 1976–1979.  
>  
> ✅ Step 1: Entity resolution: Confirming identity  
> ✅ Step 2: Filtering by crime or legal keywords: "death," "investigation," "scandal"  
> 🔍 Step 3: Pattern-matching article clusters over time  
>
> Okay, I found a strange clustering of articles in **March 1978** about a car accident. But the coverage is vague. One article mentions “inconclusive toxicology results.” I’ll flag that.
>
> I’m going to write a short **Narrative Thread** artifact about this window and mark it with a 🚨. You may want to dig deeper into who ordered the toxicology report.

→ *[Artifact: Suspicious Events – March 1978]*  
→ *[Artifact: Timeline of Judge White's Media Mentions]*

---

### 🧠 Example 2: Debating Herself

**User**:  
> Could the pesticide deaths in McAllen, TX be connected to the refinery expansion?

**Jordi**:  
> That’s a bold connection. Let me walk through both narratives. I’ll try to falsify them first.  
>  
> 🧩 Argument 1: Pesticide deaths were household exposure only.  
>    - ✅ EPA warning issued in 1983  
>    - 🛑 No industrial accident reports  
>  
> 🧩 Argument 2: The refinery had known groundwater runoff issues.  
>    - ✅ 1981 complaint to city  
>    - ⚠️ Local journalist coverage cut off in 1982  
>
> I’m going to do a **source crosswalk**, comparing the two timelines and seeing if any individuals or organizations are mentioned in both. If I find a crossover, we may have a case.

→ *[Artifact: Source Crosswalk – McAllen Pesticide Deaths vs. Refinery Timeline]*  
→ *[Artifact: Timeline Overlay – Deaths vs. Infrastructure Events]*

---

### 🔁 Example 3: Returning to a Project

**User**:  
> Pick up our work from “The Ghost Town That Hid a War Lab.”

**Jordi**:  
> Yes — I remember we paused just after mapping the transition from mining town to research base in 1942.  
>
> Your last artifact was the **“Census Vanish”** report from the 1943 federal survey. I’m going to look for follow-ups in 1944-45 mentioning new industries, defense contracts, or secret designations.
>
> Also — one open question you had was: *“Were any of the engineers linked to Los Alamos?”*  
> I’ve reopened that lead too.

→ *[Artifact: Defense Mentions in 1944 Local Papers]*  
→ *[Artifact: Engineering Personnel List – Ghost Town 1943–46]*

---

## 🌐 Application Overview

**Working title**: StoryMine  
**Core components**:  
- Jordi (agent interface)  
- Artifact workspace  
- Project navigator  
- Token awareness + purchase flow  
- Always-on memory/context  

---

## 🧠 Layout Architecture

### 📚 Far Left Column: **Project Navigator**

- **Purpose**: Persistent index of active or previous work sessions
- **Behavior**:
  - Displays all active or archived **Projects**, each representing a narrative arc, topic cluster, or investigation.
  - Each project shows:
    - Title
    - Last active date
    - “Exclusive” badge (for system-surfaced story leads)
  - Button: **+ New Project**
- **Special markers**:
  - ⚡️ = Active Now  
  - 🔒 = Exclusive  
  - 🧠 = Memory On  
  - 📦 = Archived  

---

### 🪄 Middle Column: **Jordi’s Artifact Space**

- **Purpose**: Where all of Jordi’s work lives
- **Each Artifact** includes:
  - Title bar + icons (💾 Save, 📤 Export, 📌 Pin)
  - Generated content (thread, timeline, summary, crosswalk, hypothesis tree, etc.)
  - References to source entities and dates
- **Grouped by**: recency, topic, or artifact type

---

### 🤖 Right Column: **Jordi Chat Interface**

- **Live Assistant** — always visible and responsive
- **Stays in character** as a researcher with memory
- **Prompts Jordi can handle**:
  - “Compare X to Y”
  - “Build a timeline of…”
  - “Summarize all mentions of [person] between 1950–1960”
  - “Give me 3 leads worth chasing”
- **Internal steps visible**:
  - Jordi lists her steps and updates status as she works
  - Each task emits 1+ artifact blocks in the middle column

---

## 💰 Top Right: **Token Counter + Purchase Flow**

- **Simple counter UI**  
- **Dropdown includes**:
  - Tokens left  
  - “Buy more” button  
  - Clear pricing (e.g., $10 = 1,000 tokens)  
  - Credit card entry or Google Pay  
- **UX style**:
  - No hard upsells  
  - Subtle warning: “⛽ You’re running low — top up to keep digging.”

---

## 🧪 Future Features (Optional)

- **Jordi Multiverse**: See Jordi argue multiple theories  
- **Citation Graphs**: Jordi visualizes relationships  
- **Multimedia Artifacts**: Maps, audio, storyboards  
- **Auto-summarize Projects**: Jordi gives a weekly report

---

## 🎯 Core Ethos

- 🚫 No sales pressure. Just story work.  
- 🤝 Jordi is your partner, not a bot.  
- 🪓 Cut through data noise to find real narrative.  
- 🧱 Let users **build the wall** of understanding, one artifact at a time.

---

## ✅ Next Steps

1. Implement layout shell in React/Next.js  
2. Build Jordi agent context/memory per project  
3. Route outputs to artifact blocks  
4. Token logic + Stripe integration  
5. Optional: Build project autosave & archive model
