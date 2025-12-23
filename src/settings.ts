import {App, PluginSettingTab, Setting} from "obsidian";
import MyPlugin from "./main";

export interface MyPluginSettings {
	mySetting: string;
	modelApiUrl: string;
	modelApiKey: string;
	mcpTools: Array<{
		name: string;
		description: string;
		command: string;
	}>;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	modelApiUrl: 'https://api.openai.com/v1/chat/completions',
	modelApiKey: '',
	mcpTools: [
		{
			name: 'Summarize',
			description: 'Summarize selected text',
			command: 'summarize'
		},
		{
			name: 'Translate',
			description: 'Translate selected text',
			command: 'translate'
		}
	]
}

export class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'AI Model Settings'});

		new Setting(containerEl)
			.setName('Model API URL')
			.setDesc('Enter the API URL for the AI model')
			.addText(text => text
				.setPlaceholder('https://api.openai.com/v1/chat/completions')
				.setValue(this.plugin.settings.modelApiUrl)
				.onChange(async (value) => {
					this.plugin.settings.modelApiUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Model API Key')
			.setDesc('Enter the API key for the AI model')
			.addText(text => text
				.setPlaceholder('sk-...')
				.setValue(this.plugin.settings.modelApiKey)
				.onChange(async (value) => {
					this.plugin.settings.modelApiKey = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h2', {text: 'MCP Tools'});

		const mcpTools = this.plugin.settings.mcpTools;
		if (mcpTools) {
			mcpTools.forEach((tool, index) => {
				new Setting(containerEl)
					.setName(`Tool ${index + 1}: ${tool.name}`)
					.setDesc(tool.description)
					.addText(text => text
						.setValue(tool.command)
						.onChange(async (value) => {
							const mcpTools = this.plugin.settings.mcpTools;
							if (mcpTools && mcpTools[index]) {
								mcpTools[index].command = value;
							}
							await this.plugin.saveSettings();
						}));
			});
		}
	}
}
