import React from 'react';
import { Classes, Icon } from '@blueprintjs/core';

function ButtonLink(props) {
    const { icon = null, iconProps = {}, text = null, textProps = {}, href, linkClass = [] } = props;
    let extraClasses = linkClass.constructor === Array ? linkClass : [linkClass];

    return (
        <a role="button" className={[Classes.BUTTON, ...extraClasses].join(' ')} target="_blank" href={href}>
            {icon ? <Icon icon={icon} {...iconProps} /> : null}
            {text ? <span className={Classes.BUTTON_TEXT} {...textProps}>{text}</span> : null}
        </a>
    )
}

export default ButtonLink;