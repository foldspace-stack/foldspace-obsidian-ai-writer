import React, { useState, useEffect, useRef } from 'react';
import type { App } from 'obsidian';
import { MarkdownView, Notice } from 'obsidian';
import type { default as MyPlugin } from '../../main';
// 暂时移除ai包的导入，因为当前版本不包含Conversation和Message组件
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { Separator } from '@radix-ui/react-separator';

import { useAppContext } from './AppContext';

// 定义消息类型
interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

export const AIWriterReactView: React.FC<{
  plugin: MyPlugin;
  app: App;
}> = ({ plugin, app }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { app: contextApp } = useAppContext();

  // 加载保存的消息历史
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = await plugin.loadData();
        if (data && data.messageHistory) {
          setMessages(JSON.parse(data.messageHistory));
        }
      } catch (error) {
        console.error('Failed to load message history:', error);
      }
    };

    loadMessages();
  }, [plugin]);

  // 保存消息历史
  useEffect(() => {
    const saveMessages = async () => {
      try {
        await plugin.saveData({ messageHistory: JSON.stringify(messages) });
      } catch (error) {
        console.error('Failed to save message history:', error);
      }
    };

    if (messages.length > 0) {
      saveMessages();
    }
  }, [messages, plugin]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await callAI(inputValue.trim());
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Error: ${error}`,
        role: 'assistant',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
      new Notice('Failed to get response from AI model');

    } finally {
      setIsLoading(false);
    }
  };

  // 调用AI模型
  const callAI = async (message: string): Promise<string> => {
    const response = await fetch(plugin.settings.modelApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${plugin.settings.modelApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  // 执行MCP工具
  const handleExecuteMCPTool = async (tool: { name: string; description: string; command: string }) => {
    const selectedText = getCurrentSelectedText();
    if (!selectedText) {
      new Notice('Please select text first');

      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: `Executing ${tool.name} on selected text...`,
      role: 'user',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 模拟MCP工具调用
      const result = `Mock MCP ${tool.name} result for: ${selectedText.substring(0, 50)}...`;
      await new Promise(resolve => setTimeout(resolve, 500)); // 模拟异步延迟

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: result,
        role: 'assistant',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Error executing ${tool.name}: ${error}`,
        role: 'assistant',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
      new Notice(`Failed to execute ${tool.name}`);

    } finally {
      setIsLoading(false);
    }
  };

  // 获取当前选中的文本
  const getCurrentSelectedText = (): string => {
    const markdownView = contextApp.workspace.getActiveViewOfType(MarkdownView);
    if (!markdownView) return '';
    return markdownView.editor.getSelection();
  };

  // 清空对话历史
  const handleClearConversation = () => {
    setMessages([]);
  };

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="ai-writer-container">
      {/* MCP工具按钮区域 */}
      <div className="ai-writer-mcp-tools">
        <h4>MCP Tools</h4>
        <div className="tools-container">
          {plugin.settings.mcpTools.map((tool, index) => (
            <button
              key={index}
              className="ai-writer-mcp-button"
              title={tool.description}
              onClick={() => handleExecuteMCPTool(tool)}
              disabled={isLoading}
            >
              {tool.name}
            </button>
          ))}
        </div>
      </div>

      <Separator className="ai-writer-separator" />

      {/* 对话区域 */}
      <div className="ai-writer-conversation">
        <ScrollArea className="conversation-scroll-area">
          <div className="conversation">
            {messages.length === 0 ? (
              <div className="conversation-empty-state">
                <h3>No messages yet</h3>
                <p>Start a conversation to see messages here</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`message message-${message.role}`}
                >
                  <div className="message-content">
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="message message-assistant loading">
                <div className="message-content">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      <Separator className="ai-writer-separator" />

      {/* 输入区域 */}
      <div className="ai-writer-input-container w-full" style={{ width: '100%' }}
      >
        <div className="input-wrapper w-full" style={{ width: '100%' }}
        >
          <textarea
            className="ai-writer-input w-full"
            style={{ width: '100%' }}
            placeholder="Type your message or select text and double-click to send..."
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={4}
          />
          <div className="input-actions w-full">
            <button
              className="ai-writer-clear-button"
              onClick={handleClearConversation}
              style={{ width: '48px', height: '24px', fontSize: '16px' }}
              disabled={isLoading || messages.length === 0}
              title="Clear conversation"
            >
              清除
            </button>
            <button
              className="ai-writer-send-button"
              style={{ width: '48px', height: '24px', fontSize: '16px' }}

              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
