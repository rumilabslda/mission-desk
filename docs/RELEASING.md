# Releasing Mission Desk

A release is built by GitHub Actions when a version tag is pushed: macOS (signed and notarized), Windows and Linux. The files go to a **draft** release, which becomes public only when you publish it.

## One-time setup: signing the macOS app

macOS opens apps from outside the App Store without warnings only if they are signed with a **Developer ID** certificate and notarized by Apple. Both use the Rumi Labs Apple Developer account. Only someone with the **Account Holder** role (or Admin, with access to Developer ID certificates) can create the certificate.

### 1. The Developer ID Application certificate

1. On the Mac, open **Keychain Access → Certificate Assistant → Request a Certificate From a Certificate Authority…**, enter your email, choose **Saved to disk**.
2. At [developer.apple.com/account/resources/certificates](https://developer.apple.com/account/resources/certificates), click **+**, choose **Developer ID Application**, upload that request, and download the certificate.
3. Double-click the downloaded file to add it to your login keychain. `security find-identity -v -p codesigning` should now list *Developer ID Application: … (TEAMID)*.
4. For GitHub: in Keychain Access, right-click the certificate (with its private key) → **Export…** as a `.p12` file with a strong password. Then:

   ```bash
   base64 -i DeveloperID.p12 | pbcopy
   ```

   and save it as the repository secret `MAC_CERT_P12_BASE64`, and the password as `MAC_CERT_PASSWORD`. Delete the `.p12` file afterwards.

### 2. A notarization key

1. In [App Store Connect → Users and Access → Integrations → App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api), create a **Team key** with the **Developer** role.
2. Download the `.p8` file (Apple lets you download it only once) and note the **Key ID** and the **Issuer ID**.
3. Save these repository secrets: `APPLE_API_KEY_P8` (the whole content of the `.p8` file), `APPLE_API_KEY_ID`, `APPLE_API_ISSUER`.

Secrets are added in GitHub under **Settings → Secrets and variables → Actions**. Never commit them.

### 3. The provisioning profile (passkeys)

Mission Desk keeps passkeys in the Mac's keychain (`src/main/passkeys`). The keychain entitlement in `build/entitlements.mac.plist` is allowed only by a provisioning profile embedded in the app. A signed build without it doesn't open at all, so `npm run dist:mac` and the Release workflow stop with an error instead. An Admin or the Account Holder makes it once:

1. At [developer.apple.com/account/resources/identifiers](https://developer.apple.com/account/resources/identifiers), click **+** → **App IDs** → **App**. Description *Mission Desk*, **Explicit** Bundle ID `pt.rumilabs.missiondesk`. No capabilities are needed. Register it (skip if it already exists).
2. At [Profiles](https://developer.apple.com/account/resources/profiles/list), click **+** → **Developer ID** (under Distribution) → the App ID above → the Developer ID Application certificate. Name it *Mission Desk Developer ID* and download it.
3. Save it as `build/Mission_Desk_Developer_ID.provisionprofile` and commit it. A profile holds no secret: only the App ID, the team and the certificate's public part.
4. Check: `security cms -D -i build/Mission_Desk_Developer_ID.provisionprofile | grep -A3 keychain-access-groups` should show `WY943M5DF7.*`.

The profile expires with the certificate (Apple shows the date). Renew both together and commit the new profile.

The passkeys are on only in a build that carries the profile. `npm run dev` and the unsigned `npm run dist` leave them off: sites then don't offer a passkey and ask for the password.

### Windows and Linux

Windows and Linux builds are not signed for now. Windows shows "Windows protected your PC" the first time; users choose **More info → Run anyway**. To sign later, add a code-signing certificate (for example Azure Trusted Signing) to the Release workflow.

## Making a release

1. Make sure `main` is green (the CI workflow runs the tests and type checks).
2. Add the new version's section at the top of [CHANGELOG.md](../CHANGELOG.md).
3. Set the version, without creating a tag yet:

   ```bash
   npm version 0.2.0 --no-git-tag-version
   ```

4. Commit both files, then tag and push:

   ```bash
   git commit -am "chore: release 0.2.0"
   git tag v0.2.0
   git push origin main v0.2.0
   ```

5. The **Release** workflow first creates a draft release for the tag, then builds the three systems (about 15 minutes) and uploads them to it. The workflow stops if the tag and `package.json` disagree.
6. Before publishing, download the files and check them:
   - macOS: open the `.dmg`, drag the app to Applications, open it. No warning should appear. `spctl -a -vv "/Applications/Mission Desk.app"` should say *accepted, source=Notarized Developer ID*.
   - Windows and Linux: install and open on a test machine if you can.
   - Run the [manual test checklist](manual-test-checklist.md) on the macOS build.
7. Paste the changelog section into the release notes and **Publish release**.

Installed copies update from the **published** release: they read `latest-mac.yml`, `latest.yml` and `latest-linux.yml`, which the workflow uploads with the installers. A draft is invisible to them, so nobody gets a version before you publish it. On macOS an update installs only if it is signed by the same Developer ID as the installed app, and it uses the `.zip` files, so never remove those from a release.

Versions follow [Semantic Versioning](https://semver.org). Until 1.0.0 (an early preview): 0.1.1 for fixes, 0.2.0 for new features or changes to how things work. 1.0.0 is the first version ready for everyone; after it, 1.0.1 for fixes, 1.1.0 for new features, 2.0.0 when something people rely on changes.

## A signed build on your own Mac

With the certificate in your keychain and the notarization key on disk:

```bash
export APPLE_API_KEY=~/keys/AuthKey_XXXXXXXXXX.p8 APPLE_API_KEY_ID=XXXXXXXXXX APPLE_API_ISSUER=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
npm run dist:mac
```

The `.dmg` and `.zip` files are written to `dist/`. `npm run dist` makes a quick unsigned build for testing instead.
