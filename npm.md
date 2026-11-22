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
tag that parses as a semver range.

```bash
npm run pack-next       # dry-run pack of every `next` package; fails on an export the tarball lacks
npm run publish-next    # asks for the OTP, then publishes the versions npm does not have yet
npm dist-tag ls @browser.style/card
```

A new prerelease: bump the packages that changed (`4.0.0-next.0` → `4.0.0-next.1`), then
`npm run update-peers` (peer and dependency ranges on our own packages become `^<version>`), then
`npm run publish-next`. Installing: `npm install @browser.style/card@next`, or an exact version.
The release itself drops the suffix and removes `publishConfig.tag`.
