import {App, MarkdownView, Notice, WorkspaceLeaf, ItemView} from 'obsidian';
import type { default as MyPlugin } from '../main';
import { createRoot, Root } from 'react-dom/client';
import { StrictMode } from 'react';
import { AIWriterReactView } from './views/AIWriterReactView';
import { AppContextProvider } from './views/AppContext';

export class AIWriterView extends ItemView {
    plugin: MyPlugin;
    root: Root | null = null;

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

        // 创建React根元素并渲染组件
        this.root = createRoot(containerEl);
        this.root.render(
            <StrictMode>
                <AppContextProvider app={this.app}>
                    <AIWriterReactView plugin={this.plugin} app={this.app} />
                </AppContextProvider>
            </StrictMode>
        );
    }

    async onClose() {
        // 卸载React组件
        this.root?.unmount();
    }

    // 接收从编辑器发送的选中文本
    receiveSelectedText(text: string) {
        // 此方法可用于与React组件通信
        // 可以通过DOM事件或状态管理解决方案实现
        console.log('Selected text received:', text);
    }
}