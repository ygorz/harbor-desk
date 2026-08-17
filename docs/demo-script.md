# Demo script

About a minute. The UI is the hook. Ontology-as-code and functions are the point.

`pnpm run dev`, CASE-2041 open, acting as Maya Chen. Stage directions in brackets — do not read them.

---

[Desk on screen. Do not tour it.]

“Here’s a small project I made in Palantir Foundry SuperRepo. It’s still in beta, but I wanted to learn ontology-as-code and TypeScript functions — putting the data model and the rules in the same repo as the app.”

[Gesture at the queue and the case. One breath.]

“The front end is just a little case desk so I had something to click. Blueprint, Palantir’s own kit. One file, a company, some wallets, a couple of findings. That’s enough to see it working.”

[Request Close. Wait for the toast.]

“This is the part I wanted to get right. Close is a function, not a check in the UI. The server says no because findings are still open. Anything else that called the same function would get the same answer.”

[Resolve the open findings — one-line why each. Request Close again.]

“Now it goes pending. I requested it, so I can’t approve it — that’s in the function too.”

[Approve Close as Maya — toast. Switch to Jordan Hale. Approve Close, confirm.]

“Second person, it closes. The ontology is in code, and both the functions and this app use the same generated client. Local preview has no real login, so the chip is how I play both analysts.”

“SuperRepo isn’t able to do pipelines yet, and that part isn’t the most interesting to me anyway. I wanted the ontology and the functions. If I had types coming off pipelines later, I’d import them.”

---

If they want more, open `ontology.mts` or `requestClose.ts`. Do not start a second walkthrough.

## If they ask

| They ask | You say |
|---|---|
| Why a desk at all? | “I needed a client. The learning was the ontology and the functions.” |
| Why not Workshop? | “Workshop is the right tool for a lot of ops UI. I wanted the pro-code packaging — SuperRepo.” |
| Where is the rule? | “`requestClose` in the functions package. Skip the UI and you still fail.” |
| What’s missing? | “Pipelines, Data Connection, a real user. The public docs say some of that is still coming. I treated this as a way to learn the pieces that *are* there.” |
