# CV Banao — React Native mobile app

Android and iOS source project built with React Native, TypeScript and Expo SDK 57. The native screens follow the accepted CV Banao web app: Quicksand typography, the same brand, palettes, CV formats, fonts, import workflow and settings. React Native views render the app; a WebView renders only the printable CV document.

## Run the app

Use Node.js 22.13+ (Node 24 recommended).

```sh
cd cv-banao-mobile
npm ci
npx expo start
```

Open the QR code with an Expo Go version supporting SDK 57. Use `a` for an Android emulator or `i` for an iOS simulator on macOS. Phone and computer should be on the same Wi-Fi. `npm run web` provides a browser preview for development.

## Included functionality

- Native dashboard and bottom navigation; phone, landscape and tablet layouts.
- Create, rename, edit, duplicate and delete CV drafts; undo/redo and local autosave.
- Twenty templates: academic, research, PhD/higher study and industry; five layouts per purpose.
- Ten professional document fonts, bundled regular and bold. Quicksand throughout the interface.
- Light, Dark and System appearance; twelve workspace palettes independent of CV colors.
- Personal profile and settings; contact information, summary, editable and reorderable sections and entries.
- Document typography, custom hex accent, body text colors, margins, spacing, A4/Letter and live preview.
- Native PDF sharing; JSON and plain-text exports; workspace backups compatible with the web app.
- Import PDF, DOCX, JSON, TXT or pasted text. Review and edit parsed information before saving it separately. Select saved information when creating a CV, or explicitly apply selected fields to update a draft.
- English OCR for scanned CV PDFs using the included backend.
- Research PDF extraction and AI-assisted CV summaries with source quotes, page evidence, role/relationship controls and manual review before insertion.
- Device secure storage for the backend access code. No OpenAI key in the app or backups.

## PDF/DOCX/OCR and research backend

Editing, text/JSON/TXT import, saved profiles and exports work on the device. PDF/DOCX extraction and research AI require the included server. Originals are processed in memory and not retained; extracted information is saved on your device. Research summaries send the extracted text to the configured AI provider.

In a second terminal:

```sh
cd cv-banao-mobile/backend
npm ci
cp .env.example .env
```

Edit `.env`: set a long private `CV_AI_ACCESS_CODE`. For research AI also set `OPENAI_API_KEY`; `OPENAI_MODEL` defaults to `gpt-4.1-mini`. Then:

```sh
npm run dev
```

Open app **Settings → Import & research connection**. Enter your server URL and the matching access code, then select **Save & test connection**.

For development, use your computer's LAN address, for example `http://192.168.1.10:4000`, on the same Wi-Fi. On a physical phone, `localhost` means the phone, not your computer. Android emulator typically uses `http://10.0.2.2:4000`; an iOS simulator can use `http://localhost:4000`. For distributed builds, use an HTTPS backend; operating-system transport policies can block plain HTTP. Set `WEB_ORIGIN` for browser preview origins if needed. Never expose the server without its access code.

Backend limits: 10 MB per upload, 60 searchable PDF pages, 12 scanned OCR pages, 120,000 extracted characters, two simultaneous extraction jobs and 40 authenticated requests/hour/IP. Parsing is conservative; review your details. English OCR is included. Encrypted PDFs and other OCR languages are not supported.

## Build installable apps

`eas.json` includes an Android APK preview profile and a production profile:

```sh
npx eas-cli login
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile production
```

Set unique package/bundle identifiers in `app.json` before publishing. EAS uses your Expo account and signing credentials; iOS distribution requires the appropriate Apple account. No APK/IPA or store submission is included in this source ZIP. Use your own backend URL in Settings.

## Checks

```sh
npm run lint
npm run typecheck
npm run typecheck:backend
npm test
npm --prefix backend test
npm run check:expo
npm run export:android
npm run export:ios
```

Verified during delivery: lint and app/backend TypeScript checks, 13 shared model/import/research/document tests, three backend tests including real PDF/DOCX/OCR and authenticated multipart import, Android/iOS JS bundle exports, and React Native Web interaction/layout checks from 320 to 1024 pixels. AI provider calls are mocked in automated tests; no live paid AI request was made. PDF document HTML is escaped and embeds bundled fonts.

Physical Android/iOS device tests, native print/share dialogs, keyboard/safe-area behavior and signed EAS builds still require device verification. Print pagination and page-number support depend on the native print engine; preview is a continuous document and may paginate differently. Research evidence matching helps review but does not guarantee the truth of generated claims.

## Data and project structure

- `src/app`: Expo Router layout, home redirect and dynamic native screen routes.
- `App.tsx`: persistent providers, native shell, appearance and export dialogs.
- `src/screens`: native home, editor, import review, research, profile and settings.
- `src/components`: native UI, template thumbnails, new-CV flow and CV-only preview.
- `src/lib`: validated CV/import/workspace models, storage, fonts, exports and API client.
- `backend`: standalone Express extraction/OCR/research service.
- `assets`: app icons, bundled fonts and font licenses.
- `tests`, `backend/tests`: reproducible tests and synthetic fixtures.

Data is device-local. Uninstalling/clearing app storage removes drafts; export workspace JSON backups for portability. There is no cloud login, synchronization or recovery service. The initial first draft uses Nahin Intesher; every field is editable. Workspace backups exclude the access code and AI credentials. The app can be used by anyone.
