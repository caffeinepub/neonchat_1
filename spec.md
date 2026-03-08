# NeonChat

## Current State
A futuristic real-time chat app with:
- Code gate (verifyCode), name picker, global chat, DMs, AI assistant
- Rank system: Friend < Employee < VIP < Admin
- PhillyNEXUS auto-gets Admin on login (frontend sets initialRank), but backend `getUserRank` call fires after and overwrites with stored rank (Friend), so PhillyNEXUS ends up as Friend
- `registerUser` in backend still sets Admin for "NEXUS" and "admin" usernames — even though this was supposed to be removed. NEXUS logs in, backend registers it as Admin, then `getUserRank` returns Admin, so NEXUS keeps Admin
- Version string hardcoded as "v2.4.1" in CodeGateScreen.tsx footer
- No backend API for getting/setting the version string
- Admin Panel has: Ban, Kick, Edit Announcement, Change Access Code

## Requested Changes (Diff)

### Add
- `getVersionString(): async Text` backend function — returns current version string
- `setVersionString(adminUserId: Text, version: Text): async Bool` backend function — admin-only, updates stored version string
- Version string section in Admin Panel sidebar — text input + save button, loads current version on open
- CodeGateScreen fetches version string from backend on mount and displays it in the footer

### Modify
- `registerUser` in backend: remove auto-Admin for "NEXUS" and "admin" — all users register as Friend by default
- `handleNameConfirmed` in App.tsx: after setting PhillyNEXUS initialRank to Admin, immediately call `actor.assignRank` using a self-assign workaround OR add a dedicated `setAdminRank` backend function that forces Admin for PhillyNEXUS — so the backend rank matches before `getUserRank` fires
- The `getUserRank` useEffect in App.tsx: add a guard so it does NOT overwrite the rank when the user just logged in with a forced rank (i.e. skip the overwrite if name is PhillyNEXUS and rank is already Admin)

### Remove
- Auto-Admin assignment for "NEXUS" and "admin" in `registerUser`

## Implementation Plan
1. Regenerate backend with: registerUser gives #Friend to everyone; add getVersionString/setVersionString; add forceAdminRank(userId) that sets a user's rank to Admin (used internally at login for PhillyNEXUS)
2. In App.tsx handleNameConfirmed: after registerUser, if name === "PhillyNEXUS" call actor.forceAdminRank(id) to write Admin to backend immediately
3. In App.tsx getUserRank useEffect: skip overwrite if userName === "PhillyNEXUS" (rank is already authoritatively set)
4. CodeGateScreen: on mount fetch getVersionString and display in footer; if fetch fails fall back to "v2.4.1"
5. Sidebar Admin Panel: add "Version String" section with input + save button calling setVersionString; load current value on admin panel open
