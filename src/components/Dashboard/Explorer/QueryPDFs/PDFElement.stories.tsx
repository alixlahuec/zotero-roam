import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import PDFElement from "./PDFElement";

import { cleanLibraryPDF } from "./helpers";
import { ListWrapper } from "Components/DataList";
import { samplePDF } from "Mocks/zotero";


type Props = ComponentProps<typeof PDFElement>;

export default {
	component: PDFElement,
	decorators: [
		(Story, context) => (
			<ListWrapper>
				<Story {...context} />
			</ListWrapper>
		)
	]
} as Meta<Props>;

export const Default: StoryObj<Props> = {
	args: {
		item: cleanLibraryPDF(samplePDF)
	}
};