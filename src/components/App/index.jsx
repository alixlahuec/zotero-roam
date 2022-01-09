import { Component } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Button } from '@blueprintjs/core';

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
            status: 'on',
            searchPanel: {
                isOpen: false,
                isSidePanelOpen: false
            }
        }
    }

    render() {
        let { version } = this.props;
        let { status } = this.state;

        return (
            <QueryClientProvider client={queryClient}>
                <Button icon="manual" status={status} version={version}>zoteroRoam v{version}</Button>
            </QueryClientProvider>
        )
    }
}

export default App;