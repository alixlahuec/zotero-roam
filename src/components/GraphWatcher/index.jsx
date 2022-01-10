import React, { PureComponent } from 'react';

import { 
    addPageMenus,
    findPageMenus,
    CitekeyMenuFactory, 
    DNPMenuFactory, 
    TagMenuFactory 
} from './Menus';
import Autocomplete from './Autocomplete';
import './index.css';

class GraphWatcher extends PureComponent {
    constructor(props){
        super(props);
        this.state = {
            citekeyMenus: [],
            dnpMenus: [],
            tagMenus: []
        }
        this.updatePageElements = this.updatePageElements.bind(this);
    }

    componentDidMount() {
        // From React Docs : https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
        this._isMounted = true;
        
        // The watcher adds empty <div>s to relevant page elements
        // The contents of the <div>s will be managed by rendering portals
        this.watcher = setInterval(
            () => {
                addPageMenus();
                // TODO: Add other page elems (explo, etc)

                if(this._isMounted){
                    this.updatePageElements();
                }
            },
            1000
        );
    }

    componentWillUmmount() {
        // From React Docs : https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
        this._isMounted = false;
        clearInterval(this.watcher);
        Array.from(document.querySelectorAll(`[class*=${menuPrefix}]`)).forEach(div => div.remove());
    }

    render() {
        let { citekeyMenus, dnpMenus, tagMenus } = this.state;
        let { dataRequests, autocomplete } = this.props;
        
        return <>
        {citekeyMenus ? <CitekeyMenuFactory menus={citekeyMenus} dataRequests={dataRequests} /> : null}
        {dnpMenus ? <DNPMenuFactory menus={dnpMenus} dataRequests={dataRequests} /> : null}
        {tagMenus ? <TagMenuFactory menus={tagMenus} dataRequests={dataRequests} /> : null}
        {autocomplete.trigger ? <Autocomplete config={autocomplete} /> : null}
        </>
    }

    updatePageElements(){
        // TODO: Add other page elems (explo, etc)
        this.setState((prevState) => {
            let update = {};
            const currentElems = findPageMenus()
            for(let key of Object.keys(currentElems)){
                let prev = prevState[key];
                let current = currentElems[key];
                // From mauroc8 on SO: https://stackoverflow.com/questions/51958759/how-can-i-test-the-equality-of-two-nodelists
                if((prev.length + current.length) != 0 && (prev.length !== current.length || prev.some((el, i) => el !== current[i]))){
                    update[key] = currentElems[key];
                }
            }

            if(JSON.stringify(update) === '{}'){
                return null;
            } else {
                return update;
            }
        })
    }
}

export default GraphWatcher;