## Changelog

### [0.7.11](https://github.com/alixlahuec/zotero-roam/compare/0.7.10...0.7.11) - 

#### Bug Fixes

-  excessive API calls due to broken `since` param ([`#176`](https://github.com/alixlahuec/zotero-roam/pull/176))
-  styling of multiselect input in Explorer ([`#173`](https://github.com/alixlahuec/zotero-roam/pull/173))
- \(deps): update dependency axios-retry to ^3.4.0 ([`#169`](https://github.com/alixlahuec/zotero-roam/pull/169))
-  tags with hyphen and special characters aren't processed correctly ([`#153`](https://github.com/alixlahuec/zotero-roam/pull/153))

### [0.7.10](https://github.com/alixlahuec/zotero-roam/compare/0.7.9...0.7.10) -  2022-12-15 

#### Features

-  show SemanticScholar items that don't have a DOI ([`#142`](https://github.com/alixlahuec/zotero-roam/pull/142))
-  add SmartBlocks commands for key and citekey ([`#140`](https://github.com/alixlahuec/zotero-roam/pull/140))
-  improve sorting and filtering in SemanticScholar panel ([`#139`](https://github.com/alixlahuec/zotero-roam/pull/139))
-  enable importing specific notes ([`#135`](https://github.com/alixlahuec/zotero-roam/pull/135))
#### Bug Fixes

-  styling issues in tags selector ([`#144`](https://github.com/alixlahuec/zotero-roam/pull/144))
-  sizing and positioning of dialogs on smaller displays ([`#143`](https://github.com/alixlahuec/zotero-roam/pull/143))

### [0.7.9](https://github.com/alixlahuec/zotero-roam/compare/0.7.8...0.7.9) -  2022-12-08 

#### Features

-  improve performance when opening the Search Panel ([`#131`](https://github.com/alixlahuec/zotero-roam/pull/131))
-  improve display of Zotero notes in drawer ([`#129`](https://github.com/alixlahuec/zotero-roam/pull/129))
-  improve parsing of Zotero notes ([`#127`](https://github.com/alixlahuec/zotero-roam/pull/127))
-  improve toaster and logs ([`#125`](https://github.com/alixlahuec/zotero-roam/pull/125))
-  give visual feedback on import errors ([`#124`](https://github.com/alixlahuec/zotero-roam/pull/124))

### [0.7.8](https://github.com/alixlahuec/zotero-roam/compare/0.7.7...0.7.8) -  2022-12-02 

#### Features

-  add interface to view logs ([`#115`](https://github.com/alixlahuec/zotero-roam/pull/115))
-  expand formatting options for autocomplete ([`#114`](https://github.com/alixlahuec/zotero-roam/pull/114))
-  add custom nesting options for notes ([`#112`](https://github.com/alixlahuec/zotero-roam/pull/112))
-  sort annotations and notes for import ([`#102`](https://github.com/alixlahuec/zotero-roam/pull/102))
#### Bug Fixes

-  ZOTEROITEMCOLLECTIONS doesn't return output ([`#110`](https://github.com/alixlahuec/zotero-roam/pull/110))

### [0.7.7](https://github.com/alixlahuec/zotero-roam/compare/0.7.6...0.7.7) -  2022-11-25 

### [0.7.6](https://github.com/alixlahuec/zotero-roam/compare/0.7.5...0.7.6) -  2022-11-20 

#### Bug Fixes

-  race condition with Smartblocks ([`#97`](https://github.com/alixlahuec/zotero-roam/pull/97))
-  fatal crash due to invalid shortcuts ([`#96`](https://github.com/alixlahuec/zotero-roam/pull/96))

### [0.7.5](https://github.com/alixlahuec/zotero-roam/compare/0.7.4...0.7.5) -  2022-11-17 

#### Features

-  update setup for automated releases ([`#78`](https://github.com/alixlahuec/zotero-roam/pull/78))

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