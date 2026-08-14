# Harbor Desk — ~90s script

Read at a normal pace. About 220 words. Optional clicks in brackets if you record over the app.

---

Harbor Desk is a casework desk I built on Palantir Foundry — specifically SuperRepo, which just went beta. It’s a way to version the data model, the server-side rules, and the React app as one product. There aren’t many public examples yet, so I wanted to see how far you can take it before it gets fancy.

This is not a chain indexer. I used to work in crypto; here that just becomes the subject matter. Case 2041 is Northwind Holdings: a new Delaware LLC whose ETH treasury was funded within two days of incorporation.

[land on the case — risk 65, two open findings]

Analysts open cases, attach findings to people, companies, and wallets, and they only close when the rules say they can. Those rules don’t live in the UI. They live in TypeScript functions. The app just calls them.

[Request close as Maya]

Request close with findings still open — refused. Risk isn’t zero.

[resolve the open findings, request close again]

Resolve them, request again — now it’s waiting for a second person. That’s four-eyes. I cannot approve my own close.

[stay Maya, Approve close — error. Switch acting-as to Jordan, approve]

Switch analyst, approve, closed.

What SuperRepo cannot do yet: no pipelines, no calling out to Alchemy from functions, no ingest. The wallets on this case were typed in, not synced off-chain. And seed data never deploys — after install you hit Load demo or the ontology is empty.

That’s the interesting part to me. Early beta, real limits, and you can still ship something that behaves like a desk: one repo, one deploy, and policy that every caller has to obey.
