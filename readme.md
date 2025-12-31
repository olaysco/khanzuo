# Khanzuo

**Khanzuo** is an AI agent that reproduces user-reported issues by navigating your application like a real user and translating what breaks into fix-ready developer context.

> If a human can experience the bug, Khanzuo can too.

## Why Khanzuo exists

Modern coding agents are excellent at understanding codebases, but bugs don’t start in code — they start in **user experience**.

Today, developers still:

* manually try to reproduce vague tickets
* guess what users clicked or expected
* act as translators between support, QA, and code

Khanzuo removes that translation step.

It debugs **from the user’s point of view**, then hands developers everything they need to fix the issue without losing context.

## What Khanzuo does (v0)

Khanzuo is a **web-first, user-journey debugging agent**.

It:

* Controls a real browser
* Navigates your app like a human user
* Observes UI state, errors, and broken flows
* Captures reproducible steps and technical signals
* Hands developers a structured, fix-ready context

No production access.
No log scraping.
No magic.

## Core use cases

* “User can’t log in”
* “2FA code doesn’t work”
* “Signup spinner never finishes”
* “Works locally but users report failure”
* “QA says it’s broken but can’t explain how”

Khanzuo turns these into **executable reproductions**.

## How it works (high level)

1. **Start a session**

   * Open Khanzuo
   * Provide a URL (e.g. `/login`, `/signup`)
   * Khanzuo launches a controlled browser

2. **Describe the issue**

   * “User reports OTP verification fails”
   * “Login works without 2FA but fails with it enabled”

3. **Khanzuo navigates the app**

   * Clicks buttons
   * Fills forms
   * Submits flows
   * Waits, retries, and observes

4. **Failure detected**

   * UI errors
   * Stalled states
   * Failed network requests

5. **Developer handoff**

   * Repro steps
   * Screenshots
   * Network failures
   * Suspected entry points

## Feature checklist

### ✅ Khanzuo v0 (Web-first MVP)

#### Browser & UI

* [x] Launch controlled Chrome session
* [x] Live screenshot stream (“user view”)
* [x] Click, type, navigate, submit forms
* [x] DOM-aware actions (by text, label, placeholder)
* [x] Detect visible UI errors and stalled states

#### Interaction

* [x] Chat-driven control (“try login”, “submit OTP”)
* [x] Agent narration of actions and observations
* [x] Minimal clarifying questions when blocked

#### Debug context capture

* [x] Step-by-step reproduction transcript
* [x] Screenshots at failure points
* [x] Network request capture (status codes + responses)
* [x] Tie failures to specific user actions

#### Developer handoff

* [x] Generate structured “repro bundle”
* [x] Export context for coding agents or humans
* [x] Zero context loss between UI debugging and code fixing


### ⏭ Planned (post-v0)

* [ ] OS-level “select any window”
* [ ] Mobile emulator support
* [ ] Replayable user journeys
* [ ] CI regression flow checks
* [ ] Automated fix suggestions
* [ ] Optional observability integration
* [ ] Multi-service reasoning

## Security & safety (by design)

* Runs locally on the user’s machine
* No production log access
* No credential persistence
* Explicit user control over actions
* No autonomous deployment or merges

## Who Khanzuo is for

* Developers debugging UX-breaking bugs
* QA engineers reproducing flaky issues
* Support engineers escalating tickets with evidence
* Teams tired of “can’t reproduce”
