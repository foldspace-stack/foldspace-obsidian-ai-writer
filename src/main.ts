import {App, Editor, MarkdownView, Modal, Notice, Plugin, WorkspaceLeaf, ItemView} from 'obsidian';
import {DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab} from "./settings";
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import './styles.css';

// 定义右侧面板视图的ID
const AI_WRITER_VIEW_TYPE = 'ai-writer-view';

// 实现右侧面板组件
export class AIWriterView extends ItemView {
    plugin: MyPlugin;
    contentContainer: HTMLElement;
    messageHistory: HTMLElement;
    inputContainer: HTMLElement;
    input: HTMLTextAreaElement;
    sendButton: HTMLButtonElement;
    mcpToolsContainer: HTMLElement;

    constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return AI_WRITER_VIEW_TYPE;
    }

    getDisplayText(): string {
        return "AI Writer";
    }

    getIcon(): string {
        return "message-square";
    }

    async onOpen() {
        const {containerEl} = this;
        containerEl.empty();

        // 创建组件容器
        this.contentContainer = containerEl.createEl("div", {cls: "ai-writer-container"});

        // 创建消息历史区域
        this.messageHistory = this.contentContainer.createEl("div", {cls: "ai-writer-messages"});

        // 创建MCP工具按钮区域
        this.mcpToolsContainer = this.contentContainer.createEl("div", {cls: "ai-writer-mcp-tools"});
        this.renderMCPTools();

        // 创建输入区域
        this.inputContainer = this.contentContainer.createEl("div", {cls: "ai-writer-input-container"});
        this.input = this.inputContainer.createEl("textarea", {cls: "ai-writer-input"});
        this.input.placeholder = "Type your message or select text and double-click to send...";
        this.sendButton = this.inputContainer.createEl("button", {cls: "ai-writer-send-button", text: "Send"});

        // 添加事件监听
        this.sendButton.addEventListener("click", () => this.sendMessage());
        this.input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    async onClose() {
        // 清理资源
    }

    renderMCPTools() {
        this.mcpToolsContainer.empty();
        this.plugin.settings.mcpTools.forEach(tool => {
            const button = this.mcpToolsContainer.createEl("button", {cls: "ai-writer-mcp-button", text: tool.name});
            button.setAttribute("title", tool.description);
            button.addEventListener("click", () => this.executeMCPTool(tool));
        });
    }

    addMessage(text: string, isUser: boolean) {
        const messageEl = this.messageHistory.createEl("div", {cls: `ai-writer-message ${isUser ? 'user' : 'assistant'}`});
        messageEl.createEl("div", {cls: "message-content", text});
        this.messageHistory.scrollTop = this.messageHistory.scrollHeight;
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        // 添加用户消息
        this.addMessage(message, true);
        this.input.value = "";

        try {
            // 调用AI模型
            const response = await this.callAI(message);
            this.addMessage(response, false);
        } catch (error) {
            this.addMessage(`Error: ${error}`, false);
            new Notice("Failed to get response from AI model");
        }
    }

    async callAI(message: string): Promise<string> {
        // 实现AI模型调用
        const response = await fetch(this.plugin.settings.modelApiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.plugin.settings.modelApiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{role: "user", content: message}],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async executeMCPTool(tool: {name: string; description: string; command: string}) {
        // 实现MCP工具调用
        const selectedText = this.getCurrentSelectedText();
        if (!selectedText) {
            new Notice("Please select text first");
            return;
        }

        this.addMessage(`Executing ${tool.name} on selected text...`, true);

        try {
            // 模拟MCP工具调用
            // 注意：实际实现需要根据@langchain/mcp-adapters的API进行调整
            const result = `Mock MCP ${tool.name} result for: ${selectedText.substring(0, 50)}...`;
            await new Promise(resolve => setTimeout(resolve, 500)); // 模拟异步延迟
            
            this.addMessage(result, false);
        } catch (error) {
            this.addMessage(`Error executing ${tool.name}: ${error}`, false);
            new Notice(`Failed to execute ${tool.name}`);
        }
    }

    getCurrentSelectedText(): string {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) return "";
        return activeView.editor.getSelection();
    }

    // 接收从编辑器发送的选中文本
    receiveSelectedText(text: string) {
        this.addMessage(`Selected text: ${text}`, true);
    }
}

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
