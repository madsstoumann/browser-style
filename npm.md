```bash
# Check npm login status
npm whoami

# Login if needed
npm login

# Verify package contents
npm pack --dry-run

# Publish package
npm publish --access public

# Update version in package.json
npm version patch
npm publish --access public
```
## Prereleases from v4 (dist-tag `next`)

v4 publishes as `<version>-next.N` under the dist-tag `next`; `latest` stays on the older line until v4 is
released. The set is layout and the components a consumer uses today (41: what the cms reads; badge,
breadcrumbs and energy stay out until something uses them). Every package in it carries
`"publishConfig": { "tag": "next" }`, so no publish from v4 can
move `latest`, and npm 11 refuses a prerelease without a tag anyway. `v4` cannot be the tag: npm refuses a
tag that parses as a semver range. A package that is new to npm gets `latest` too on its first publish
(the registry sets it when there is none): `@browser.style/accordion` is `latest: 5.0.0-next.0` until a release.

**2FA.** Sign in once in the browser and tick *remember me for 5 minutes*: npm then skips 2FA for later
publishes from the same IP and token ([npm changelog, 2022-07-26](https://github.blog/changelog/2022-07-26-general-availability-of-improved-2fa-experience-in-npm/)),
which covers the 41. Passing `--otp` instead forces the legacy flow (one code per publish), and the registry
rate-limits those codes (`E429 … rate limited otp`: the first run hit it on its fifth). If the browser asks again on every
publish, a granular access token with *bypass 2FA*, write access to `@browser.style` and a one-day expiry is
the other way npm allows.

```bash
npm run pack-next       # dry-run pack of every `next` package; fails on an export the tarball lacks,
                        # or on a packed file git does not track (a local file in a package folder)
npm run publish-next    # the same check, then publishes the versions npm lacks one by one, through
                        # npm's own sign-in: no --otp, so npm uses the browser (auth-type web)
npm dist-tag ls @browser.style/card
```

A new prerelease: bump the packages that changed (`4.0.0-next.0` → `4.0.0-next.1`), then
`npm run update-peers` (peer and dependency ranges on our own packages become `^<version>`), then
`npm run publish-next`. Installing: `npm install @browser.style/card@next`, or an exact version.
The release itself drops the suffix and removes `publishConfig.tag`.
