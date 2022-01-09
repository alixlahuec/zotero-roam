import ReactDOM from 'react-dom';
import { analyzeUserRequests, setupPortals } from './utils';
import { Toast } from '@blueprintjs/core';
import App from './components/App';
import "./index.css";

var zoteroRoam = {};

;(()=>{

    const version = "0.7.0";
    const extensionSlot = "zotero-roam-slot";
    const extensionPortal = "zotero-roam-portal";
    
    setupPortals(slotID = extensionSlot, portalID = extensionPortal);

    let {
        dataRequests = [],
        autoload = false
    } = window.zoteroRoam_settings;

    zoteroRoam.config = {
        userSettings: {
            autoload
        }
    };

    try {
        zoteroRoam.config.requests = analyzeUserRequests(dataRequests);
        ReactDOM.render(
            <App
                extension={{ version, extensionPortal }}
                {...zoteroRoam.config.requests}
                userSettings={zoteroRoam.config.userSettings}
            />,
            document.getElementById(extensionSlot)
        );
    } catch (e) {
        console.error(e);
        ReactDOM.render(
            <Toast intent="danger" message={e.message} />
        )
    }

})();