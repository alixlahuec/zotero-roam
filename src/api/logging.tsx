import { H5, IconName, Intent } from "@blueprintjs/core";
import zrToaster from "Components/ExtensionToaster";


type LogConfig = {
	context?: Record<string, any>,
	detail?: string,
	origin?: string,
	message?: string,
	showToaster?: number | boolean
};

type LogLevel = "error" | "info" | "warning";

/**
 * Creates a log entry for the extension. This is meant to provide users with information about different events (e.g errors when fetching data), through an optional toast and more detailed logs.
 */
export class ZoteroRoamLog {
	level: LogLevel;
	origin: string;
	message: string;
	detail: string;
	context: Record<string, any>;
	intent: Intent | undefined;
	timestamp: Date;

	#LEVELS_MAPPING: Record<LogLevel, Intent> = {
		"error": "danger",
		"info": "primary",
		"warning": "warning"
	};

	#ICONS_MAPPING: Record<LogLevel, IconName> = {
		"error": "warning-sign",
		"info": "info-sign",
		"warning": "warning-sign"
	};

	constructor(obj: LogConfig = {}, level: LogLevel = "info") {
		const { origin = "", message = "", detail = "", context = {}, showToaster = false } = obj;
		this.level = level;
		this.origin = origin;
		this.message = message;
		this.detail = detail;
		this.context = context;
		this.intent = this.#LEVELS_MAPPING[level] || undefined;
		this.timestamp = new Date();

		if (showToaster) {
			zrToaster.show({
				icon: this.#ICONS_MAPPING[level] || null,
				intent: this.intent,
				message: (
					this.detail
						? <>
							<H5>{this.message}</H5>
							<p>{this.detail}</p>
						</>
						: this.message
				),
				timeout: showToaster.constructor === Number ? showToaster : 1000
			});
		}
	}
}

export class Logger {
	logs: ZoteroRoamLog[] = [];

	send(obj: LogConfig, level: LogLevel = "info") {
		this.logs.push(new ZoteroRoamLog(obj, level));
	}

	error(obj: LogConfig) {
		this.send(obj, "error");
	}

	info(obj: LogConfig) {
		this.send(obj, "info");
	}

	warn(obj: LogConfig) {
		this.send(obj, "warning");
	}
}
