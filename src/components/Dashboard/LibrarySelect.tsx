import { memo } from "react";
import { Button, MenuItem } from "@blueprintjs/core";
import { Select, SelectProps } from "@blueprintjs/select";
import { Placement } from "@blueprintjs/popover2";

import { CustomClasses } from "../../constants";
import { ZLibrary } from "Types/transforms";


type SelectorProps = SelectProps<string>;

const staticProps: Partial<SelectorProps> & Pick<SelectorProps, "itemRenderer"> = {
	itemRenderer: (item, itemProps) => {
		const { handleClick/*, modifiers: { active }*/ } = itemProps;

		return <MenuItem key={item} onClick={handleClick} text={item} />;
	},
	popoverProps: {
		minimal: true,
		placement: "bottom-right" as Placement,
		popoverClassName: CustomClasses.POPOVER
	}
};

type OwnProps = {
	libProps: {
		currentLibrary: ZLibrary,
		onSelect: (value: string) => void,
		options: string[]
	}
};

const LibrarySelect = memo<OwnProps>(function LibrarySelect({ libProps }){
	const { currentLibrary: { path }, onSelect, options } = libProps;

	return (
		<Select
			filterable={false}
			items={options} 
			matchTargetWidth={true}
			onItemSelect={onSelect}
			{...staticProps} >
			<Button 
				className={["zr-dashboard--library-select", CustomClasses.TEXT_AUXILIARY, CustomClasses.TEXT_SMALL].join(" ")} 
				icon="folder-open"
				minimal={true} 
				text={path} />
		</Select>
	);
});


export type LibrarySelectProps = OwnProps;
export default LibrarySelect;
