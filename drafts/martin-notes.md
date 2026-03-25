THIS FILE CONTAINS RAW IDEAS, PERSONAL NOTES, HOW THE APP COULD POTENTIALLY WORK.

I like the bear notes simplicity the best, althougn not all features.

Minimal Core functionality

- notes organised in folders and sub folders, it needs to reflect the file / folder structure a user can create
- parameters

architecture

- Storage are MD files with the good and the bad (document in DB). For example the search is in the files not DB. There is no way to protect the note with a password.
  storage primarly in MD files, so no tadabase, all main info is contained in the file (or as document)
- there needs to be a system for metada and config for the app. I assume that would be stored separatly from MD files, or there could be a hidden folder like macos does. I'd have to consider, that user can edit the MD files in a separate app, move files around and that should not effect the meta data.

Ideas

- use macos spotlight inverted index to search fast across notes (with universal adapter)
- smart folders in navifation like macos notes
- smart widets in notes, perhpas like little plugin people can easily create with AI, like craft notes
- tags (not as properties but in the text)
- custom icons for folders
- content block for excalidraw
- store attachements as base64 encoded content
- map view, notes as pins on the map
- backlins overview
- table of contents overview
- stats overview
- publish online (github pages)
- templates for notes
- styles for notes, really like the craft approach of custom colored background, or Notion header image and icon (but there is no use for the icon in this app)
- export as jekyll project and deploy to github pages
- templating system compatible with jekyll - could be as simple as craft notes background color, or date widget for event note, or complex webpage design. It would have UI controls to pick a template and configure it. It needs to be easy to extend the template using html.
- webhooks and integration with zapier / make
- teams of editors for cloud
- spaces of notes
- shared with me
- only cloud storage, rest of the app can be desktop
- full screen toggle for note
- note split view

PROCESS IDEAS
add "review the result, is it like a pro would do it?"

BACKLOG IDEAS

1. `template-preview-editor` — edit the whole content inside a rendered
   template preview using one Tiptap document
2. `note-properties-editor` — edit note properties separately through
   structured controls in the Inspector
3. `custom-liquid-blocks` — support custom Liquid-compatible blocks in the note
   body through Tiptap extensions
4. `filesystem-storage` — user-configurable filesystem-backed note storage with
   one Markdown file per note
5. `note-list-selection` — browse folders and notes, then open a selected note
6. `note-edit-save` — persist note changes from the in-memory editor state
7. `cloud-storage-adapter` — persist the same logical note model in a cloud
   NoSQL backend

# App description

Web / desktop app for Notes. The structure is similar to Apple Notes and Bear Notes.

## Layout

Consists of four vertical sections:

- Sidebar
- Note list with a toolbar at top
- Note content with a toolbar at top
- Properties panel

## Sidebar

There is a toolbar at the top. The toolbar contains buttons aligned to right for:

- new folder (icon: folder with a plus)
- extra actions (icon: three dots)

Contains navigation items:

- All notes (icon: note)
- Favorites (icon: star)
- Structure of folders in two level hierarchy. Some folders have custom icon.
- Recently deleted (icon: trash)

There is hashtag list underneath the navigation.

## Note list

There is a toolbar at the top. The toolbar contains buttons for:

- search (icon: magnifier)
- new note (icon: penci at a note)
- extra actions (icon: three dots)

Underneath the toolbar, there is a list of notes. Each item contains bold title and two lines of description. One note is selected and has a thick solid color highlight left border. Each item is divided by a thin grey horizontal line. Items are not rounded.

## Note content

There is a toolbar at the top. The toolbar contains buttons aligned to right for:

- collapse properties panel
- Make it favorit (icon: star)
- Pin it (icon: pin)
- Share (icon: connected circles)
- Delete (icon: trash)
- Template (icon: page layout)
- Integration / Webhook (icon: two plugs)
- Search (icon: magnifier)
- extra actions (icon: three dots)

The note content is edited by Notion style block editor.

## Properties

List of key - value pairs. Some items are:

- createdAt: 24.12. 2025
- updatedAt: 1.1. 2026
- status: published
- rating: 86%
- eventDate: 11.11. 2011
- capacity: 100
- seoDescription: Web about nice gifts.
- seoTitle: Explore gifts that spark happiness

## Style

Light theme, modern, minimalistic, flat, purple as accent colour, shadcn components.

# Layout structure

AppLayout
├── SidebarPanel
│ ├── SidebarNavigation
│ │ └── SidebarNavigationItem
│ ├── SidebarFolders
│ │ ├── SidebarFoldersControls
│ │ │ ├── SidebarFoldersTitle
│ │ │ └── SidebarFoldersActions
│ │ └── SidebarFoldersList
│ │ └── SidebarFolderItem
│ ├── SidebarTags
│ │ ├── SidebarTagsControls
│ │ │ ├── SidebarTagsTitle
│ │ │ └── SidebarTagsActions
│ │ └── SidebarTagsList
│ │ └── SidebarTagItem
│ └── SidebarExtras
│ ├── SidebarExtrasControls
│ │ ├── SidebarExtrasTitle
│ │ └── SidebarExtrasActions
│ └── SidebarExtrasContent
├── NotesListPanel
│ ├── NotesListControls
│ │ ├── NotesSearch
│ │ └── NotesListActions
│ └── NotesList
│ └── NotesListItem
├── NotePanel
│ ├── NoteControls
│ │ ├── NoteTitle
│ │ └── NoteActions
│ └── NoteView
└── InspectorPanel
├── InspectorNavigation
│ └── InspectorNavigationItem
└── InspectorContent
├── InspectorPropertiesView
│ └── InspectorPropertiesList
│ └── InspectorPropertyItem
│ ├── PropertyKey
│ └── PropertyValue
├── InspectorStatsView
└── InspectorStyleView

https://codex.so/icons-v0-2-0
