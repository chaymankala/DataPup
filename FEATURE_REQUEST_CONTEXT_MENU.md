# Feature Request: Context Menu for Saved Connections

## Is your feature request related to a problem? Please describe.
Currently, saved connections in DataPup only support basic click-to-connect and delete functionality. Users need more granular control over their saved connections without having to navigate through multiple screens or use keyboard shortcuts. The current interaction model is limited - users can only open a connection or delete it entirely, which doesn't provide the flexibility needed for database management workflows.

## Describe the solution you'd like
Add a context menu that appears on single-click for saved connection cards, providing the following options:

1. **Open** - Connect to the database (current behavior)
2. **Test Connection** - Verify connectivity without opening the full interface
3. **Rename** - Edit the connection name inline
4. **Read-only Connection** - Open the connection in read-only mode
5. **Delete** - Remove the saved connection (current behavior)
6. **Copy Connection String** - Copy connection details to clipboard

### Technical Implementation Details:

**UI Components:**
- Use existing `DropdownMenu` from Radix UI (already imported in `src/renderer/components/ui/index.ts`)
- Create a new `ConnectionContextMenu` component in `src/renderer/components/ConnectionCard/`
- Modify `ConnectionCard.tsx` to handle single-click context menu instead of direct connection

**Component Structure:**
```
src/renderer/components/ConnectionCard/
├── ConnectionCard.tsx (modified)
├── ConnectionContextMenu.tsx (new)
├── ConnectionCardSkeleton.tsx
└── index.ts (updated exports)
```

**Menu Layout:**
```
┌─────────────────────────┐
│ 🔗 Open                 │
│ 🧪 Test Connection      │
│ ✏️  Rename              │
│ 👁️  Read-only Connection│
│ 📋 Copy Connection      │
│ ─────────────────────── │
│ 🗑️  Delete              │
└─────────────────────────┘
```

**Interaction Model:**
- Single click on connection card → Opens context menu
- Right-click → Alternative way to open context menu
- Click outside menu → Closes menu
- Keyboard navigation support (arrow keys, Enter, Escape)

## Describe alternatives you've considered
1. **Double-click to open, single-click for menu** - Rejected as it's less intuitive and requires more user education
2. **Hover-based menu** - Rejected as it could be accidentally triggered and doesn't work well on touch devices
3. **Separate action buttons on each card** - Rejected as it would clutter the UI and make cards larger
4. **Toolbar with bulk actions** - Rejected as it doesn't provide per-connection granularity
5. **Modal dialog for connection options** - Rejected as it adds unnecessary complexity and modal overhead

## Additional context

### Current Code Analysis:
- `ConnectionCard` component is located at `src/renderer/components/ConnectionCard/ConnectionCard.tsx`
- Currently uses `onClick={() => !isDeleting && onSelect(connection)}` for direct connection
- Has hover states and delete functionality already implemented
- Uses Radix UI components which already include `DropdownMenu`

### User Experience Benefits:
- **Faster workflows** - Users can test connections before committing to opening them
- **Better error handling** - Test connection provides immediate feedback
- **Flexibility** - Read-only mode prevents accidental data modifications
- **Accessibility** - Context menus are a familiar pattern across applications
- **Touch-friendly** - Single tap works well on touch devices

### Implementation Priority:
1. **Phase 1**: Basic context menu with Open, Test, Delete options
2. **Phase 2**: Add Rename and Read-only functionality
3. **Phase 3**: Add Copy Connection String feature

### Screenshots/Mockups:
```
Current: [Connection Card] → Direct connection
Proposed: [Connection Card] → Context Menu → [Open/Test/Rename/etc.]
```

### Related Components to Modify:
- `src/renderer/components/Layout/MainPanel.tsx` - May need to handle new connection states
- `src/renderer/components/DatabaseConnection/DatabaseConnection.tsx` - May need read-only mode support
- `src/renderer/types/index.ts` - May need new connection state types 
