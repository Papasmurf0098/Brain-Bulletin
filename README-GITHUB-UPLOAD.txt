BULLETIN PWA - GITHUB UPLOAD INSTRUCTIONS

Upload every file and folder in this package to the root of your GitHub Pages repository.

Required structure:
- index.html
- styles.css
- app.js
- manifest.json
- service-worker.js
- icons/

After upload:
1. Wait for GitHub Pages to publish.
2. Open the site in iPhone Safari.
3. Tap Share.
4. Tap Add to Home Screen.
5. Launch Bulletin from the home screen.

Note:
- The app stores data locally in the browser on that device.
- Reminder toggle is stored, but this version does not yet fire real notifications.
- If you update app files later and changes seem stuck, bump CACHE_NAME in service-worker.js.
