import { Component } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import ExtensionIcon from '../ExtensionIcon';
import GraphWatcher from '../GraphWatcher';
import SearchPanel from '../SearchPanel';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchIntervalInBackground: true,
            staleTime: 1000 * 60
        }
    }
  })

class App extends Component {
    constructor(props){
        super(props);
        this.state = {
            status: this.props.userSettings.autoload ? 'on' : 'off',
            searchPanel: {
                isOpen: false,
                isSidePanelOpen: false
            }
        }
        this.toggleExtension = this.toggleExtension.bind(this);
        this.openSearchPanel = this.openSearchPanel.bind(this);
        this.handleChangeInSearchPanel = this.handleChangeInSearchPanel.bind(this);
    }

    render() {
        let { extension, dataRequests, apiKeys, libraries, userSettings } = this.props;
        let { version, extensionPortal } = extension;
        let { autocomplete } = userSettings;
        let { status, searchPanel } = this.state;

        return (
            <QueryClientProvider client={queryClient}>
                <ExtensionIcon status={status} version={version}
                dataRequests={dataRequests} apiKeys={apiKeys} libraries={libraries} userSettings={userSettings}
                toggleExtension={this.toggleExtension}
                openSearchPanel={this.openSearchPanel}
                />
                {status == 'on'
                ? <GraphWatcher dataRequests={dataRequests} autocomplete={autocomplete} />
                : null}
                <SearchPanel panelState={searchPanel}
                portalTarget={extensionPortal}
                userSettings={userSettings}
                handleChange={this.handleChangeInSearchPanel}
                version={version}
                />
            </QueryClientProvider>
        )
    }

    toggleExtension() {
        this.setState((prevState) => {
            let { status } = prevState;
            if (status == 'on') {
                // Aka, turning off the extension
                queryClient.clear();
            }
            return {
                status: status == "off" ? "on" : "off"
            }
        })
    }

    openSearchPanel() {
        this.setState((prevState) => {
            let { isOpen, ...rest } = prevState.searchPanel;
            if (!isOpen) {
                return {
                    searchPanel: {
                        isOpen: true,
                        ...rest
                    }
                }
            } else {
                return {};
            }
        })
    }

    handleChangeInSearchPanel(newState) {
        this.setState({
            searchPanel: newState
        })
    }
}

export default App;