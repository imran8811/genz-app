# Releasing GEN Z Foods to Google Play

Android only. The app is `pk.genzfoods.app`; the Play listing uses **Play App
Signing**, so the key below is the *upload* key — Google holds the app signing
key.

## One-time machine setup

Builds run on Ubuntu. You need JDK 17 and the Android SDK command-line tools:

```bash
sudo apt install -y openjdk-17-jdk unzip
# "Command line tools only" from https://developer.android.com/studio
mkdir -p ~/Android/Sdk/cmdline-tools
unzip ~/Downloads/commandlinetools-linux-*.zip -d ~/Android/Sdk/cmdline-tools
mv ~/Android/Sdk/cmdline-tools/cmdline-tools ~/Android/Sdk/cmdline-tools/latest
```

In `~/.bashrc`:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
```

Then `sdkmanager --licenses` and accept everything — gradle downloads the SDK
platform, build-tools and NDK itself on the first build, but only if the
licences are already accepted. `adb` is **not** auto-installed; run
`sdkmanager "platform-tools"` if you want a device over USB.

## Signing credentials

The upload keystore lives **outside this repo** and its passwords are never
committed. `android/app/build.gradle` reads four properties from
`~/.gradle/gradle.properties` (mode `600`):

```properties
GENZ_UPLOAD_STORE_FILE=/home/imran/keys/genz-upload.jks
GENZ_UPLOAD_STORE_PASSWORD=...
GENZ_UPLOAD_KEY_ALIAS=genz-upload
GENZ_UPLOAD_KEY_PASSWORD=...
```

If those properties are missing the release build **fails** with "Keystore file
not set". That is deliberate: it must never fall back to the debug key, because
Play rejects debug-signed uploads. `.gitignore` blocks `*.jks` and `*.keystore`
(with `android/app/debug.keystore` negated) so the real key cannot be staged by
accident.

> Losing the keystore is recoverable — with Play App Signing you can request an
> upload key reset through Play support — but it blocks releases for days. Keep
> the `.jks`, both passwords and the alias in a password manager, plus an
> encrypted copy off this machine.

## Cutting a release

1. Bump the version in **both** places, keeping them in step:
   - `app.json` → `expo.version` (name) and `expo.android.versionCode`
   - `android/app/build.gradle` → `versionName` and `versionCode`

   `versionCode` must increase on every upload; Play rejects a reused one.
2. `npm install && npm run typecheck`
3. Build the bundle:

   ```bash
   cd android && ./gradlew :app:bundleRelease
   ```

   Output: `android/app/build/outputs/bundle/release/app-release.aab`.
   The first build on a clean machine downloads Gradle, the SDK platform and
   the NDK — budget an hour. Later builds are far quicker.
4. Verify it is signed with the upload key, **not** the debug key:

   ```bash
   keytool -printcert -jarfile android/app/build/outputs/bundle/release/app-release.aab
   ```

   The owner must be your `CN=…, O=GEN Z Foods, …` certificate. If it says
   `CN=Android Debug`, stop — the signing config did not apply.
5. Upload the `.aab` to the Play Console.

## Before submitting

- `php artisan migrate` on **genz-web-apis** — account deletion needs the
  `restrict_order_delete_on_user_delete` migration, and Play reviewers test the
  deletion flow.
- **genz-web** must be deployed with `/privacy` and `/account-deletion` live.
  The app links to `https://genzfoods.pk/privacy` from the Account tab, and
  Play requires a reachable, login-free deletion URL.

## Notes

- `android/` is committed on purpose — it carries the signing config and
  manifest fixes. Do **not** run `expo prebuild --clean`; it regenerates the
  folder and drops them. `app.json` mirrors the same settings
  (`blockedPermissions`, `allowBackup`, `splash`, `versionCode`) so a prebuild
  would at least reproduce most of it.
- Never commit build output. `*.apk`, `*.aab` and `android/**/build/` are
  ignored; a 79 MB APK was committed once and had to be stripped from history.
- R8 minification is **off** (`android.enableMinifyInReleaseBuilds`). It is a
  known source of release-only crashes in React Native, and the AAB's per-ABI
  splitting already delivers the size win. Turn it on only behind an internal
  testing track.
- `store-assets/play-icon-512.png` is the 512×512 listing icon, generated from
  `assets/icon.png`.
