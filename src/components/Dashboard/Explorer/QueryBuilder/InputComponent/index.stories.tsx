import { ComponentProps, useState } from "react";
import { Meta, StoryObj } from "@storybook/react";
import InputComponent from ".";
import { InputEnum } from "../types";


type Props = ComponentProps<typeof InputComponent>;

export default {
	component: InputComponent,
	decorators: [
		(Story, context) => {
			const [value, setValue] = useState(context.args.value);
			return <Story {...context} args={{ ...context.args, value, setValue }} />;
		}
	],
	parameters: {
		userSettings: {
			typemap: {
				journalArticle: "Paper",
				podcast: "Podcast"
			}
		}
	}
} as Meta<Props>;

export const Text: StoryObj<Props> = {
	args: {
		inputType: InputEnum.TEXT,
		value: "systems"
	}
};

export const NoInput: StoryObj<Props> = {
	args: {
		inputType: null,
		value: null
	}
};

export const DateRange: StoryObj<Props> = {
	args: {
		inputType: InputEnum.DATE_RANGE,
		value: [new Date(2022, 0, 1), null]
	}
};

export const DateSingle: StoryObj<Props> = {
	args: {
		inputType: InputEnum.DATE,
		value: new Date(2022, 0, 1)
	}
};

export const ItemType: StoryObj<Props> = {
	args: {
		inputType: InputEnum.ITEM_TYPE,
		value: ["journalArticle", "podcast"]
	}
};

export const ItemTags: StoryObj<Props> = {
	args: {
		inputType: InputEnum.ITEM_TAGS,
		value: ["history"]
	}
};