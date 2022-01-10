import React, { useCallback, useMemo } from 'react';
import { Button, Classes, Divider, Icon, Menu, MenuItem, Spinner, Tag } from '@blueprintjs/core';
import { ContextMenu2, Tooltip2 } from '@blueprintjs/popover2';
import { queryCollections, queryItems, queryPermissions, queryTags } from '../../queries';
import { makeTimestamp } from '../../utils';
import './index.css';

function QueriesStatusIcon(props) {
    let { queries } = props;
    let updated = queries.map(q => q.dataUpdatedAt).filter(Boolean);
    let timestamp = updated.length > 0 ? <span zr-role="timestamp">{makeTimestamp(Math.max(...updated))}</span> : null;

    let isFetching = queries.some(q => q.isFetching);
    let isSuccess = queries.every(q => q.isSuccess);
    let isLoadingError = queries.some(q => q.isLoadingError);
    let isRefetchError = queries.some(q => q.isRefetchError);

    const refreshData = useCallback(() => {
        queries.forEach(q => {
            q.refetch();
        })
    }, [queries]);

    let iconProps = {};
    if(isSuccess){
        iconProps = {
            icon: 'tick',
            intent: 'success',
            color: '#00e676',
            title: 'The last update was successful'
        }
    } else if(isLoadingError){
        iconProps = {
            icon: 'delete',
            intent: 'danger',
            title: 'The extension was unable to retrieve the data'
        }
    } else if(isRefetchError){
        iconProps = {
            icon: 'error',
            intent: 'warning',
            title: 'The last update was unsuccessful'
        }
    }

    return (
        <span zr-role="status">
            {timestamp}
            {isFetching ? <Spinner size={16} /> : <Icon size={16} {...iconProps} /> }
            <Button minimal={true} onClick={refreshData} disabled={isFetching}>
                <Icon size={16} icon="refresh" />
            </Button>
        </span>
    )
}

function QueriesStatusList(props){
    const { queries } = props;
    return (
        <ul className={Classes.LIST_UNSTYLED}>
            {Object.keys(queries).map((key) => {
                return (
                    <li className="zr-queries-status" key={key}>
                        <span zr-role="entry">{key}</span>
                        <QueriesStatusIcon queries={queries[key]} />
                    </li>
                )
            })}
        </ul>
    )
}

const ExtensionIcon = React.memo(props => {

    const { status, version,
        dataRequests, apiKeys, libraries,
        openSearchPanel,
        toggleExtension } = props;
    
    const queryOpts = useMemo(() => {
        return {
            enabled: status == 'on',
            notifyOnChangeProps: ['dataUpdatedAt', 'status', 'isFetching']
        }
    }, [status]);

    const itemQueries = queryItems(dataRequests, queryOpts);
    const permissionQueries = queryPermissions(apiKeys, queryOpts);
    const tagQueries = queryTags(libraries, queryOpts);
    const collectionQueries = queryCollections(libraries, queryOpts);
    
    const isCurrentlyLoading = [...permissionQueries, ...itemQueries, ...tagQueries, ...collectionQueries].some(q => q.isLoading);
    const hasLoadingError = [...permissionQueries, ...itemQueries, ...tagQueries, ...collectionQueries].some(q => q.isLoadingError);
    const allowContext = itemQueries.some(q => q.data);

    const data_status = useMemo(() => hasLoadingError ? 'error' : (isCurrentlyLoading ? 'loading' : 'ready'), [isCurrentlyLoading, hasLoadingError]);
    const button_icon = useMemo(() => hasLoadingError ? "issue" : "manual", [hasLoadingError]);

    let tooltipContent = <>
        <span><strong>Status : </strong> {status}</span>
        <Divider />
        <span className= "zr-icon-tooltip-body">
            {status == 'on'
            ? <QueriesStatusList queries={ { 'Permissions': permissionQueries, 'Collections': collectionQueries, 'Tags': tagQueries, 'Items': itemQueries } } />
            : null}
            
        </span>
        <Divider />
        <span className="zr-icon-tooltip-footer">
            <a href="https://alix-lahuec.gitbook.io/zotero-roam/changelog" target="_blank">Changelog</a>
            <Tag className="zr-version-tag">v{version}</Tag>
        </span>
    </>;

    const contextMenu = useMemo(() => {
        return (
            <Menu>
                <MenuItem text="Search in library" icon="search" onClick={openSearchPanel} />
            </Menu>
        )
    }, [openSearchPanel]);

    return (
        <Tooltip2 popoverClassName="zr-icon-tooltip" 
        usePortal={false} 
        content={tooltipContent}
        placement='auto'
        interactionKind='hover' 
        hoverOpenDelay={450} 
        hoverCloseDelay={450} 
        >
            <ContextMenu2
            disabled={!allowContext}
            content={contextMenu}
            >
                <Button id="zotero-roam-icon"
                status={status}
                data-status={data_status}
                disabled={false}
                icon={button_icon}
                minimal={true} 
                small={true}
                onClick={toggleExtension} />
            </ContextMenu2>
        </Tooltip2>
        
    )

})

export default ExtensionIcon;