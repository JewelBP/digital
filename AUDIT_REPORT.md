# Project Audit & Optimization Report

## Scope
Reviewed the uploaded static web/PWA project: HTML entry points, CSS, JavaScript modules, Firebase integration, service-worker files, manifest, and asset references. The existing UI layout, styling, labels, colors, and user flows were intentionally preserved.

## Changes applied

1. **Background-tab performance**
   - The home hero slider now pauses its 3.5-second timer while the page is hidden and resumes when visible.
   - The notification slider follows the same behavior and replaces its previous visibility handler when it is rebuilt, preventing listener accumulation.
2. **Theme synchronization**
   - Removed the 1.5-second polling loop from the main-color synchronizer.
   - The synchronizer now avoids rewriting the same CSS custom property value, reducing unnecessary style recalculation and observer churn.
3. **Dead-code cleanup**
   - Removed `js/settings`, an obsolete duplicate settings-modal implementation with no references. The active settings implementation remains in `js/drawer.js`.
4. **Validation**
   - All standalone JavaScript files passed `node --check`.
   - Inline scripts in `index.html` and `splash.html` passed syntax checks.

## Important findings not changed automatically

### Critical security concern: Firebase service-account private key in the browser
`js/fcm-sender.js` stores a service-account JSON (including `private_key`) in browser `localStorage` and signs OAuth JWTs on the client. A service-account private key must not be stored or used in browser code. Anyone able to inspect that browser profile or exploit an XSS issue could obtain it. Move push sending to a trusted server/Cloud Function and rotate any key that has previously been entered into this app. This needs backend deployment and cannot be safely completed as a front-end-only cleanup without changing the push-send architecture.

### Configuration gap: ImgBB
`js/app.js` contains the placeholder `YOUR_IMGBB_API_KEY`. Image uploads will not work until configured. A production upload flow should preferably use a server-side endpoint rather than expose a privileged key in client code.

### Service worker
`sw.js` exists but no registration for it was found in the inspected HTML/JavaScript. Push setup separately registers `firebase-messaging-sw.js`. The unused worker was retained rather than removed or activated, because changing offline/PWA behavior without deployment testing could affect users.

### Large asset candidate
`icons/IMG_20250912_150957.jpg` is approximately 3.9 MB and no direct filename reference was found. It was retained because it may be selected dynamically or used outside the inspected source. Confirm its purpose before deleting or recompressing it.

## Recommended next steps

1. Move FCM service-account signing and message delivery to a Firebase Cloud Function or other trusted backend; rotate the exposed key.
2. Configure a secure image-upload endpoint and remove client-side privileged credentials.
3. Test on the actual hosting origin and Android devices: cold start, login/unlock, offline mode, Firebase reads/writes, push notifications, image upload, and back navigation.
4. Only after confirming the large JPG is unused, resize/re-encode or remove it. Do not delete user assets based only on filename search.

## Limitations
This was a static source audit and syntax validation. A live browser performance profile, Lighthouse run, Firebase integration test, and real-device regression test require the deployed site and its runtime credentials/environment.


## Continued optimization pass

4. **Confirmed broken asset reference**
   - Corrected the drawer avatar image path from `icon/icon-192.png` to the existing `icons/icon-192.png`. This prevents a broken image in the navigation drawer.
5. **Connection warm-up**
   - Added `preconnect` hints for the configured Firebase Realtime Database origin and Firebase CDN, allowing the browser to establish connections earlier without changing app behavior.
6. **Background CPU usage**
   - The live date/time clock now stops its one-second timer while the tab is hidden and resumes with an immediate refresh when the user returns. Its visible date/time format is unchanged.

## Continued-pass validation

- All standalone JavaScript files passed `node --check`.
- The corrected drawer icon target exists in the project.
- No UI layout, colors, labels, or navigation flows were intentionally changed.
- A browser/Lighthouse run and live Firebase regression test remain outstanding because the deployed runtime is not available in this source-only audit.


## Continued optimization pass 3

7. **JavaScript module startup**
   - Added `modulepreload` hints for the app's statically imported local modules (`firebase.js`, `auth.js`, and `app1.js`). This lets supported browsers fetch the import graph earlier and can reduce module-loading waterfalls on cold starts.
   - Kept `notice-box.js`, `driving-guide.js`, and `about-developer.js` as dynamic imports from the drawer. These are feature modules and should remain deferred until the user opens those sections, avoiding unnecessary initial-download work.
8. **Asset-reference review**
   - Rechecked local `src`/`href`/CSS URL references. The remaining scanner matches are dynamic JavaScript values or relative-to-document paths, not confirmed missing static assets. The previously fixed drawer icon now points to the existing `icons/` directory.

## Pass 3 validation
- Confirmed the modulepreload targets exist.
- Re-ran standalone JavaScript syntax validation and archive integrity checks.
- No feature modules were made eager and no visual styles or UI markup were redesigned.
