# NeonChat

## Current State
New project. No existing backend or frontend code.

## Requested Changes (Diff)

### Add
- Access gate: a fullscreen code entry screen that accepts a 4-digit passcode (1017). Incorrect codes show an error; correct code unlocks the chat.
- Name selection screen: after correct code, user picks a display name before entering chat.
- Global chat room: a real-time public chat where all users can send and receive messages. Messages are stored on-chain and polled frequently for live updates.
- Futuristic UI theme: dark background, neon/glowing accents, monospace or sci-fi fonts, grid/scanline aesthetics.
- Sleek pop-out sidebar (slides in from the right or left) containing:
  - AI Chat button: opens an AI assistant panel where the user can ask questions and receive responses (powered by HTTP outcalls to an AI API).
  - Personal DM button: opens a direct message interface to select a user and send private messages.
- DM system: users can see a list of online/known users and open a private conversation thread with any of them.
- AI panel: sends messages to an AI endpoint and displays responses inline.

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend (Motoko):
   - Store access code constant (1017)
   - verifyCode(code: Text) -> Bool
   - User registry: registerUser(name: Text) -> UserId, getUsers() -> [User]
   - Global chat: sendMessage(userId, text) -> MessageId, getMessages(since: Timestamp) -> [Message]
   - DM system: sendDM(fromId, toId, text) -> (), getDMs(userId, otherId) -> [Message]
   - AI outcall: askAI(prompt: Text) -> Text (HTTP outcall to external AI API)

2. Frontend:
   - Code entry screen with futuristic styling and input validation
   - Name picker screen
   - Main chat layout: message feed + input bar
   - Sidebar (pop-out): AI panel + DM panel with user list and conversation view
   - Polling mechanism (~1s interval) to keep messages live
   - Deterministic data-ocid markers on all interactive elements
