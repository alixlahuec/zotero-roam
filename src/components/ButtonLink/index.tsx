import { AnchorHTMLAttributes, FC } from "react";
import { AnchorButton, AnchorButtonProps } from "@blueprintjs/core";


type OwnProps = {
	href: string,
	minimal?: AnchorButtonProps["minimal"]
};

const ButtonLink: FC<OwnProps & Partial<AnchorButtonProps> & Partial<AnchorHTMLAttributes<HTMLAnchorElement>>> = (props) => {
	const { children = null, href, minimal = true, ...otherProps } = props;
	
	return (
		<AnchorButton href={href} intent="primary" minimal={minimal} rel="noreferrer" target="_blank" {...otherProps}>
			{children}
		</AnchorButton>
	);
};

export default ButtonLink;