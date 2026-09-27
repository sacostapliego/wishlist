# TODO

Fix the three lint warnings in `desktop/` (they don't fail the build, but a
future plugin version could promote them to errors the way
`react-hooks/set-state-in-effect` just was):

- [ ] `src/components/layout/nav/MobileCreateMenu.tsx:22` — `useEffect` missing dependency `anchorRef`
- [ ] `src/components/layout/SideBar.tsx:93` — unused `eslint-disable` directive
- [ ] `src/components/profile/ProfileImageCropper.tsx:144` — raw `<img>` instead of `next/image`
