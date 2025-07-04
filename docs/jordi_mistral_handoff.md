# Handoff Document for Jordi – Phase 1: Mistral Small 3.1 Integration

## ✅ Overview

This document outlines the rationale for using **Mistral Small 3.1** as the foundational model behind **Jordi**, the narrative research agent for the StoryMine platform. It also includes guidance for the implementation plan and initial architecture to hand off to Claude or any collaborating engineer.

---

## 🎯 Purpose of Jordi

**Jordi** is the always-on, memory-aware assistant inside StoryMine. She is not just a chatbot — she is an investigative research agent that:
- Accepts complex narrative prompts from the user
- Performs internal reasoning and hypothesis formation
- Surfaces research as structured **artifacts** (timelines, threads, crosswalks, etc.)
- Displays her thinking and decision-making transparently

Jordi’s primary use case is to **excavate lost stories** from historical archives and help users trace surprising narrative arcs.

---

## 🧠 Why Mistral Small 3.1?

We chose **Mistral Small 3.1** for its balance of performance, licensing freedom, and architectural fit for a multi-step reasoning agent.

### Key Advantages:

- ✅ **Open weight** under Apache 2.0 — ideal for customization and commercialization
- ✅ **128k context window** — essential for deep narrative research
- ✅ **Strong chain-of-thought performance** — handles breakdowns, substeps, and reflection
- ✅ **Efficient inference** — lightweight enough to deploy on a single GPU
- ✅ **Great community + ecosystem** — tooling available for LangChain, vLLM, Ollama, etc.

### Why Not Llama or GPT-4?
- **Llama 3 70B** has license constraints and higher infra requirements.
- **GPT-4** is proprietary and limits transparency for internal reasoning logs, which we consider core to Jordi’s value.

---

## 🧱 Implementation Architecture (Phase 1)

### 1. Model Backend
- Use **Ollama** or **vLLM** to serve Mistral Small 3.1
- Docker container with GPU acceleration preferred
- Enable streaming token outputs

### 2. Agent Framework
- Use **LangChain** or **CrewAI** (if multi-agent logic is needed later)
- Create a structured **Jordi Agent** with:
  - Memory component (LangChain’s `ConversationBufferMemory`)
  - Artifact generator tools (timeline builder, comparison tool)
  - Intermediate reasoning chain (see next section)

### 3. Reasoning Style (Mimicking Cursor)
Jordi shows her thought process like this:

```markdown
> Prompt: What happened to Judge Ransom White in 1978?

Jordi:
✅ Step 1: Entity resolution  
✅ Step 2: Search all 1976–1979 articles mentioning "Ransom White"  
🔍 Step 3: Filter by terms: ["death", "scandal", "resignation"]  
🧠 Observations: There's a spike in coverage in March 1978.

[Artifact: Timeline – Judge Ransom White Mentions]
[Artifact: Narrative Thread – The March 1978 Anomaly]
```

Artifacts are streamed into the middle column as separate, saveable items.

### 4. Frontend Hooks (StoryMine UI)
- Jordi lives in the right-side chat panel
- Her generated content ("artifacts") lives in the center column
- Her memory, active project, and previous context are tied to the far-left project list

---

## 🔧 Phase 1 Deliverables

- [ ] Run Mistral Small 3.1 with Ollama or vLLM
- [ ] Create LangChain-based agent (`Jordi`)
- [ ] Implement reasoning chain template + display logs
- [ ] Build artifact output format (JSON or Markdown blocks)
- [ ] Integrate token usage count (for future token economy)

---

## 📦 Folder Structure Proposal

```
/storymine-backend
  /models
    - mistral_server.py
  /agents
    - jordi_agent.py
  /tools
    - artifact_builder.py
  /api
    - routes.py
  /memory
    - memory_manager.py
```

---

## 🔄 Future Phases

- Phase 2: Add tool use (timeline visualizer, entity linker, doc retriever)
- Phase 3: Add retrieval augmentation from StoryDredge JSON index
- Phase 4: Enable multi-agent reasoning (Jordi debates herself)

---

Let me know if you need an Ollama config, model loader script, or token pricing logic.

