# Shiftproof

A Chrome web app for maintenance crews handing over unfinished work in buildings with unreliable connectivity. It turns a private field note into editable facts and a portable brief for the incoming shift.

## Try it

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Without Firebase configuration, the app opens in example mode. Extract the saved example, review the four fields, and format or download the brief. You can also start blank, enter facts manually, and format them locally. Example mode makes zero AI calls.

## Set up live inference

1. Create a Firebase project and register a Web app. In Firebase AI Logic, enable the Gemini Developer API provider. Use a contest project with a free-tier model available to that project.
2. Set up Firebase App Check with a score-based reCAPTCHA Enterprise key for your HTTPS deployment domain. Register the Web app with that key and enforce App Check for Firebase AI Logic.
3. Copy `.env.example` to `.env.local`. Fill in the Firebase Web config and the public reCAPTCHA site key. Provider credentials stay in Firebase. Keep debug tokens private and out of version control.
4. Use desktop Chrome 139+ on supported hardware. Enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` if needed and restart Chrome. The first extraction may need to download Gemini Nano.
5. For a local live test, run Vite in development. Before clicking the first AI action, set `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` in the console and register the token printed by Firebase in your own project's App Check settings. Use production attestation for the deployed demo.
6. Build with `npm run build` and serve `dist/` over HTTPS. To preview the production bundle locally, use `npm run preview`.

[Firebase hybrid inference guide](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started) · [App Check for Web](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)

## Test with a synthetic note

Load the example. With Firebase configured, use **Switch to live** to run the same input through the SDK.

- Click **Extract on device** and wait for the on-device source label. Verify the facts against the private note and remove any identifying or access details.
- Review the four fields, check the consent box, then click **Generate brief**. Verify the reported inference source and compare the brief against the reviewed fields. Changing a field resets consent.
- Once Chrome has finished downloading Gemini Nano and the production service worker controls the page, disconnect the network. Run extraction again with the app open. Use **Format locally** to create a brief immediately from the reviewed fields and download it.
- If the device model is unavailable, the app reports the failure and supports manual entry. Once the user reviews and authorizes the facts, the brief can use the cloud model even on browsers without Gemini Nano.

## How inference is routed

| Action | Data passed to the SDK | SDK mode |
| --- | --- | --- |
| Extract | The original field note | `ONLY_ON_DEVICE` |
| Generate brief | Four explicitly reviewed fields | `PREFER_IN_CLOUD` |
| Format locally | No SDK request | Plain-text template |

The extraction checks that Firebase reports `ON_DEVICE`. The brief displays the source reported by the SDK. The review stage is necessary because model filtering can miss sensitive details. Shiftproof holds the original note in page memory. Reloading the page clears it. Copy and download are user-initiated exports of the resulting brief.

## Work during #BuildHybridAI 2026

The application, workflow, synthetic example, SDK routing, offline app shell and submission materials were started during the contest period. Development used an AI coding assistant. Third-party packages are listed in `package.json` and identified in the lockfile.

Licensed under Apache 2.0.
