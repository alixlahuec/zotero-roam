import { ComponentProps } from "react";
import { Meta, StoryFn } from "@storybook/react";
import { NoWriteableLibraries } from ".";


type Props = ComponentProps<typeof NoWriteableLibraries>;

export default {
	component: NoWriteableLibraries
} as Meta<Props>;

export const Default: StoryFn<Props> = () => <NoWriteableLibraries />;