# TODO: Integrate Conversation History Tracking

## Backend Updates
- [x] Add GET /api/conversations endpoint to retrieve list of user's conversations (threadId, last message timestamp, etc.)
- [x] Add GET /api/conversations/:threadId endpoint to retrieve specific conversation messages

## Frontend Updates
- [x] Update Chat.jsx: Add sidebar component for conversation history list
- [x] Implement fetching conversation list on component mount
- [x] Add functionality to load selected conversation into chat messages state
- [x] Ensure sidebar doesn't disrupt main chat UI and keeps existing CSS

## Followup Steps
- [x] Test conversation history loading and switching
- [x] Verify UI remains intact and conversations work with assistant
