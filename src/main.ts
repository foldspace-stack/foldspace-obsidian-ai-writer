import {App, Editor, MarkdownView, Modal, Notice, Plugin, WorkspaceLeaf} from 'obsidian';
import {DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab} from "./settings";
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { AIWriterView } from "./components/AIWriterView";
import './styles.css';

// 定义右侧面板视图的ID
const AI_WRITER_VIEW_TYPE = 'ai-writer-view';


// Remember to rename these classes and interfaces!

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	aiWriterView: AIWriterView | null = null;

	async onload() {
		await this.loadSettings();

		// 注册AI Writer视图
		this.registerView(
			AI_WRITER_VIEW_TYPE,
			(leaf) => (this.aiWriterView = new AIWriterView(leaf, this))
		);

		// 尝试从workspace中恢复视图，如果没有则创建一个
		await this.activateView();

		// 添加左侧功能区图标
		this.addRibbonIcon('message-square', 'AI Writer', (evt: MouseEvent) => {
			this.activateView();
		});

		// 添加打开AI Writer的命令
		this.addCommand({
			id: 'open-ai-writer',
			name: 'Open AI Writer',
			callback: () => this.activateView(),
		});

		// 添加选中文字双击事件监听
		this.registerDomEvent(document, 'dblclick', (evt: MouseEvent) => {
			const target = evt.target as HTMLElement;
			// 检查是否点击在编辑器区域
			if (target.closest('.cm-content')) {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					const selectedText = markdownView.editor.getSelection();
					if (selectedText && this.aiWriterView) {
						this.aiWriterView.receiveSelectedText(selectedText);
						new Notice('Selected text sent to AI Writer');
					}
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	async onunload() {
		// 清理视图
		this.app.workspace.detachLeavesOfType(AI_WRITER_VIEW_TYPE);
	}

	async activateView() {
		const { workspace } = this.app;

		// 检查是否已经存在该视图
		let leaf: WorkspaceLeaf | undefined;
		for (const wleaf of workspace.getLeavesOfType(AI_WRITER_VIEW_TYPE)) {
			if (wleaf.view.getViewType() === AI_WRITER_VIEW_TYPE) {
				leaf = wleaf;
				break;
			}
		}

		// 如果不存在，创建新视图
		if (!leaf) {
			// 尝试在右侧创建新视图
			leaf = workspace.getLeaf("split", "vertical");
			await leaf.setViewState({
				type: AI_WRITER_VIEW_TYPE,
				active: true,
			});
		}

		// 激活视图
		workspace.revealLeaf(leaf);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MyPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// 如果视图已存在，更新MCP工具
		if (this.aiWriterView) {
			this.aiWriterView.renderMCPTools();
		}
	}
}
