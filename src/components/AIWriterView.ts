import {App, Editor, MarkdownView, Notice, WorkspaceLeaf, ItemView} from 'obsidian';
import { MyPluginSettings } from "../settings";
import type { default as MyPlugin } from '../main';

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
        return 'ai-writer-view';
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