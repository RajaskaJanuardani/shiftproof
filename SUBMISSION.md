# Shiftproof

## Devpost description

**Elevator pitch**

Shiftproof turns private field notes into reviewable maintenance handovers. Capture the details even when the building has no signal, then share what the next crew needs.

**Inspiration**

Maintenance crews often move through basements and plant rooms with unreliable coverage. A note about an unfinished repair can mix relevant facts with contact numbers and access instructions. The incoming crew needs a concise record of what changed and what still needs attention.

**What it does**

Shiftproof extracts four editable facts from a private field note: the location and asset, observations, completed work, and follow-up. Each fact can link back to an exact excerpt in the original note. When an excerpt cannot be located uniquely or a fact is edited, the app marks that field for review. Common contact and access-code patterns block cloud generation until the technician removes them. The brief can also be formatted locally, copied, or downloaded.

**How we built it**

The Chrome web app uses Firebase AI Logic in `ONLY_ON_DEVICE` mode for raw notes. After review and explicit consent, Firebase AI Logic receives only the reviewed fields in `PREFER_IN_CLOUD` mode. The app displays the actual inference source returned by the SDK. Firebase App Check protects the cloud integration. A service worker caches the production shell, and manual entry plus a local export template keep the core handover workflow available during an outage.

**What we built during the event**

We built the app, added the on-device extraction and reviewed cloud workflow, implemented the offline shell and export, and produced the synthetic maintenance scenario during the submission period. We used an AI coding assistant during development.

## Demo shot list

Use only footage from the live-configured app for claims about the models. Record at 1080p with English narration or subtitles. Target length 1:45–2:10.

| Time | Screen action | Narration |
| --- | --- | --- |
| 0:00–0:14 | Show Shiftproof and the synthetic note. Highlight its contact and access details. | “At the end of a maintenance shift, the next crew needs to know what changed and what needs another look. Field notes often mix those facts with contact details and access instructions.” |
| 0:14–0:39 | Switch to live if necessary. Disconnect network, click Extract on device, and show the SDK source label. | “This example comes from a basement air-handling unit. With the connection offline, Shiftproof uses Gemini Nano through Firebase AI Logic to pull four fields out of the private note.” |
| 0:39–0:57 | Click View source. Copy the synthetic lockbox detail into a reviewed field to show the block, then remove it. | “I can jump to the original excerpt and check what the model pulled out. If a lockbox code lands in a shareable field, Shiftproof flags it before I can generate the brief.” |
| 0:57–1:18 | Use Format locally, expand the output, and show the download. | “The crew can already leave with a formatted handover while the connection is down.” |
| 1:18–1:42 | Reconnect, check consent, generate, and show the live cloud source label and output. | “Back online, the technician can send the reviewed fields to Gemini through Firebase AI Logic for a written brief. The original field note stays on the device.” |
| 1:42–1:52 | Show the final brief and the Next shift section. | “The incoming crew knows what was observed, what was done, and what still needs checking.” |

Before submitting, insert the public source, working project, and public YouTube links into Devpost. Confirm the deployed app passes both live inference paths and that judges can open it without signing in.
