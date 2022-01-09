import ReactDOM from 'react-dom';
import App from './components/App';

let topbar = document.querySelector('.rm-topbar');
let extensionSlot = document.createElement('span');
extensionSlot.classList.add("zotero-roam-slot");
topbar.appendChild(extensionSlot);

ReactDOM.render(
    <App
        version="0.6.96"
    />, 
    extensionSlot);