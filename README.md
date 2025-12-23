# FoldSpace AI Writer Obsidian Plugin

一个功能强大的Obsidian插件，为您提供AI写作助手功能，常驻在编辑区右侧，支持大模型对话和MCP工具调用。

## 功能特性

- **常驻右侧面板**：在Obsidian编辑区右侧显示交互式对话框
- **快速文本引用**：双击选中的文本，自动发送到右侧面板
- **大模型对话**：支持调用OpenAI等大模型进行对话，获取AI辅助内容
- **MCP工具集成**：通过@langchain/mcp-adapters调用各种MCP工具执行任务
- **个性化配置**：支持配置大模型API地址、密钥和MCP工具列表

## 安装方法

### 手动安装

1. 下载插件的最新版本（.zip文件）
2. 解压到Obsidian的插件目录（通常是`VaultFolder/.obsidian/plugins/`）
3. 在Obsidian的设置中启用"FoldSpace AI Writer"插件

### 从源码构建

1. 克隆仓库：
   ```bash
   git clone https://github.com/yourusername/foldspace-obsidian-ai-writer.git
   ```

2. 安装依赖：
   ```bash
   cd foldspace-obsidian-ai-writer
   npm.cmd install
   ```

3. 构建插件：
   ```bash
   npm.cmd run build
   ```

4. 复制构建产物到Obsidian插件目录

## 使用说明

### 基本使用

1. **激活右侧面板**：
   - 点击Obsidian左侧边栏的"FoldSpace AI Writer"图标
   - 或使用快捷键（默认：Ctrl+P -> "Toggle FoldSpace AI Writer"）

2. **发送文本到面板**：
   - 在编辑区选中任意文本
   - 双击选中的文本，自动发送到右侧面板

3. **与AI对话**：
   - 在右侧面板的输入框中输入问题或指令
   - 按Enter或点击发送按钮
   - 等待AI返回结果

### 使用MCP工具

1. **选择文本**：在编辑区选中需要处理的文本
2. **点击工具按钮**：在右侧面板上方点击对应的MCP工具按钮
3. **查看结果**：工具执行完成后，结果会显示在面板中

## 配置选项

在Obsidian的设置面板中找到"FoldSpace AI Writer"插件，进行以下配置：

### AI模型设置

- **Model API URL**：大模型的API地址（默认：`https://api.openai.com/v1/chat/completions`）
- **Model API Key**：大模型的API密钥

### MCP工具设置

配置可用的MCP工具列表，每个工具包含：
- **名称**：工具的显示名称
- **描述**：工具的功能描述
- **命令**：工具的调用命令

## 开发说明

### 项目结构

```
src/
├── main.ts          # 插件主入口，包含面板实现和事件处理
├── settings.ts      # 插件设置配置
└── styles.css       # 插件样式
```

### 构建命令

- 开发模式：`npm.cmd run dev`
- 生产构建：`npm.cmd run build`

### 依赖库

- `@langchain/mcp-adapters`：MCP工具调用
- `obsidian`：Obsidian插件API
- `typescript`：类型支持
- `esbuild`：构建工具

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个插件！

## 联系方式

如有问题或建议，请通过GitHub Issues与我们联系。