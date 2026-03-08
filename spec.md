# NeonChat

## Current State

NeonChat is a futuristic chat app with:
- Code gate entry (code: 1017)
- Username picker
- Global chat with real-time polling
- Slide-out sidebar with AI assistant and DM panel
- Users stored with id, name, lastSeen fields
- Messages stored with id, userId, userName, text, timestamp

## Requested Changes (Diff)

### Add
- Rank system with 3 tiers: Admin (top), Employee (middle), Friend (bottom)
- Auto-assign Admin rank to any user registering with the name "NEXUS"
- New backend functions: `getUserRank`, `assignRank` (admin-only), `getRanks` (returns all user ranks)
- Rank label displayed next to username in global chat messages
- Rank label displayed next to username in DM user list and DM conversation headers
- Admin users can assign ranks to other users via a UI control in the sidebar/DM panel

### Modify
- `User` type gains a `rank` field: `#Admin | #Employee | #Friend`
- `registerUser` sets default rank to Friend, except "NEXUS" gets Admin
- `getUsers` returns users with rank included
- Messages should include the sender's rank so it can be displayed inline

### Remove
- Nothing removed

## Implementation Plan

1. Update `User` type in Motoko to include a `rank` variant field
2. Add rank variant type: `#Admin`, `#Employee`, `#Friend`
3. Update `registerUser` to auto-assign Admin to "NEXUS", Friend to all others
4. Add `assignRank(adminUserId, targetUserId, rank)` -- only works if caller is Admin
5. Add `getUserRank(userId)` query
6. Update `Message` type to include `userRank` field so messages display rank inline
7. Update `sendMessage` and `sendDM` to embed current rank in message
8. Frontend: Display rank badge next to username in chat messages (color-coded: Admin=gold, Employee=cyan, Friend=gray)
9. Frontend: Display rank badge in DM user list
10. Frontend: Admin users see a rank assignment control when viewing other users in the DM panel
