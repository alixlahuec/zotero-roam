## Changelog

### [0.7.1](https://github.com/alixlahuec/zotero-roam/compare/0.6.100...0.7.1) -  2022-09-09 

Latest public version is distributed as @0.6, the new version should strictly be released under 0.7.x when releasing as latest

<!-- auto-changelog-above -->
## v0.7.0

#### New Features

- **Integration: Zotero 6**
   + Zotero's native annotations are explicitly supported by the extension. They can be imported directly into Roam, and have their own formatting system.
- **Integration: SmartBlocks**
   + Metadata can now be formatted and imported to Roam using a SmartBlock.
- **Dashboard (beta)**
   + View all your recently added/modified items in one place
   + Manage your Zotero tags directly from Roam - edit, merge, delete
   + Explore your Zotero libraries via complex queries
- **Web Import (beta)**
   + The extension now supports adding items to Zotero from a URL.
- **Other**
   + User settings are editable directly via the interface - no more `roam/js` code.
   + Theming is now done through CSS variables.
   + Errors can be automatically shared to facilitate debugging.

#### General Changes

- Interface is more accessible, more consistent, and more reliable
- Extension icon shows detailed information about data retrieval status, as well as the current version and links to the extension docs