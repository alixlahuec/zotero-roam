## Changelog

### [0.7.4](https://github.com/alixlahuec/zotero-roam/compare/0.7.3...0.7.4) -  2022-09-30 

#### Bug Fixes

- \(deps): update dependency @tanstack/react-query to ^4.7.1 ([`#64`](https://github.com/alixlahuec/zotero-roam/pull/64))

### [0.7.3](https://github.com/alixlahuec/zotero-roam/compare/0.7.2...0.7.3) -  2022-09-17 

#### Bug Fixes

-  dataRequests not processed in manual setup when specified as an Object ([`#61`](https://github.com/alixlahuec/zotero-roam/pull/61))
- \(deps): update sentry to ^7.12.1 ([`#44`](https://github.com/alixlahuec/zotero-roam/pull/44))

### [0.7.2](https://github.com/alixlahuec/zotero-roam/compare/0.7.1...0.7.2) -  2022-09-11 

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

#### General Changes

- Interface is more accessible, more consistent, and more reliable
- Extension icon shows detailed information about data retrieval status, as well as the current version and links to the extension docs