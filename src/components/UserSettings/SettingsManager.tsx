import { createContext, FC, ReactChildren, useCallback, useContext, useMemo, useState } from "react";
import { InitSettings } from "Types/extension";


type ContextSetter<K extends keyof InitSettings> = (fn: (prev: InitSettings[K]) => InitSettings[K]) => void;
type ContextValue<K extends keyof InitSettings> = (readonly [InitSettings[K], ContextSetter<K>]) | null;
type ContextType<K extends keyof InitSettings> = ReturnType<typeof createContext<ContextValue<K> | null>>;


type HookEvents =
	| "beforeUpdate"
	| "afterUpdate";

type Hooks<K extends keyof InitSettings> = {
	[event in HookEvents]: ((prevState: InitSettings[K], update: InitSettings[K]) => void) | null
};


type ProviderProps<K extends keyof InitSettings> = {
	children: ReactChildren,
	init: InitSettings[K],
	updater: (prevState: InitSettings[K]) => void
};

export type SettingsProvider<K extends keyof InitSettings> = FC<ProviderProps<K>>;

class SettingsManager<K extends keyof InitSettings> {
	context: ContextType<K>;
	hooks: Partial<Hooks<K>>;

	constructor(hooks: Partial<Hooks<K>> = {}) {
		this.context = createContext<ContextValue<K>>(null);
		this.hooks = hooks;
	}

	Provider: SettingsProvider<K> = ({ children, init, updater }) => {
		const [settings, _setSettings] = useState<InitSettings[K]>(init);

		const setSettings = useCallback<ContextSetter<K>>((updateFn) => {
			_setSettings((prevState) => {
				const update = updateFn(prevState);
				this.hooks.beforeUpdate?.(prevState, update);
				updater(update);
				this.hooks.afterUpdate?.(prevState, update);
				return update;
			});
		}, [updater]);

		const contextValue = useMemo(() => [settings, setSettings] as const, [settings, setSettings]);

		return (
			<this.context.Provider value={contextValue} >
				{children}
			</this.context.Provider>
		);
	};

	useSettings = () => {
		const context = useContext(this.context);

		if (!context) {
			throw new Error("No context provided");
		}

		return context;
	};

}

export { SettingsManager };