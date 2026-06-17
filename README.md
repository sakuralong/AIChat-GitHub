# AI Chat

一个可以直接发布到 GitHub Pages 的静态 AI 聊天网页。它适合在 iPhone / Android / 电脑浏览器里使用 DeepSeek API 或自定义 OpenAI-Compatible API。

## 功能

- 纯静态网页，没有后台服务器
- 支持 DeepSeek：`deepseek-v4-flash` / `deepseek-v4-pro`
- 支持自定义 OpenAI-Compatible Base URL 和模型名
- API Key 只保存在当前浏览器的 `localStorage`
- 聊天记录只保存在当前浏览器的 `localStorage`
- 支持导出 / 导入本机聊天备份 JSON
- 支持添加到 iPhone 主屏幕，当作类似 App 使用
- 支持轻量联网搜索开关
- 支持本机长记忆：长对话会自动总结成一份“记忆摘要”，保存在当前浏览器 `localStorage`

## 文件结构

```text
index.html
style.css
app.js
manifest.webmanifest
pwa-icon.svg
sw.js
_headers
```

## 本地打开

直接双击 `index.html` 就可以打开。

如果想模拟正式发布效果，可以用任意静态服务器打开，例如：

```bash
python -m http.server 8787
```

然后访问：

```text
http://127.0.0.1:8787/
```

## 发布到 GitHub Pages

1. 把这些文件上传到 GitHub 仓库根目录。
2. 进入仓库 `Settings`。
3. 打开 `Pages`。
4. Source 选择 `Deploy from a branch`。
5. Branch 选择 `main` 和 `/(root)`。
6. 保存后等待 GitHub Pages 构建完成。

你的线上地址类似：

```text
https://你的用户名.github.io/仓库名/
```

## iPhone 使用方式

1. 用 Safari 打开 GitHub Pages 的 HTTPS 地址。
2. 点击 Safari 底部“分享”按钮。
3. 选择“添加到主屏幕”。
4. 以后从手机桌面打开即可。

电脑关机不影响 GitHub Pages 上的网页访问。聊天记录、API Key、长记忆都保存在手机浏览器本地。

## 使用 DeepSeek

1. 打开网页右上角设置。
2. 服务商选择 `DeepSeek`。
3. 输入你的 DeepSeek API Key。
4. 模型选择 `deepseek-v4-flash` 或 `deepseek-v4-pro`。
5. 点击保存。

默认 Base URL：

```text
https://api.deepseek.com
```

请求地址：

```text
https://api.deepseek.com/chat/completions
```

## 使用自定义 OpenAI-Compatible 服务

1. 设置里选择 `Custom OpenAI-Compatible`。
2. 输入 Base URL。
3. 输入模型名。
4. 输入 API Key。
5. 点击保存。

实际请求地址会自动拼成：

```text
${baseUrl}/chat/completions
```

## 本机长记忆

开启后，长对话会在 AI 回复完成后自动总结成一份简短“记忆摘要”。

它会保存这些类型的信息：

- 你的长期偏好
- 项目背景
- 常用配置
- 重要约定
- 未完成任务

它不会主动保存完整 API Key、密码、银行卡等敏感信息。长记忆只保存在当前浏览器 `localStorage`，不会上传到电脑后台或同步服务器。

注意：自动总结会额外调用一次当前选择的模型，因此会消耗一点 API 用量。

## 联网搜索

“联网搜索”是轻量模式：会把你的问题发送到 DuckDuckGo Instant Answer 和中文 Wikipedia 获取公开摘要，再把摘要发给模型。它不需要额外 API Key，但不是完整搜索引擎。

如果你不想把问题发送给搜索接口，请关闭输入框左侧的“网”按钮。

## 安全提醒

- API Key 存在当前浏览器的 `localStorage`。
- 不要在公共电脑、共享手机、网吧设备上保存 API Key。
- 删除浏览器数据、卸载浏览器、清理站点数据，可能会删除聊天记录和长记忆。
- 这个项目没有后台，所以别人无法通过你的电脑后台查看聊天记录。

## CORS 提醒

这是纯静态网页，浏览器会直接请求模型服务商 API。

如果服务商不允许浏览器直连，会出现 CORS 或 network error。纯静态网页无法绕过 CORS，需要服务商支持浏览器请求，或者以后再加自己的后端代理。

## 修改默认模型

在 `app.js` 里修改：

```js
model: "deepseek-v4-flash"
```

也可以修改设置弹窗里的快捷模型按钮。

## 常见问题

### Missing API key

设置里没有保存 API Key。重新打开设置，输入 API Key 后保存。

### 401 Unauthorized

API Key 错误、过期，或者账号没有权限。去 DeepSeek 控制台重新生成 Key。

### 400 Bad Request

模型名、Base URL 或请求格式不被当前服务商支持。先检查模型名是否写对。

### CORS / network error

服务商可能阻止浏览器直连。可以换支持浏览器请求的服务，或者以后搭建后端代理。

### Empty response

服务商返回里没有 `choices[0].message.content`。可能是模型错误、额度问题，或该服务商返回格式不完全兼容。

### 长记忆没有生成

需要开启“本机长记忆”，并且对话足够长。第一次通常在当前聊天达到约 10 条消息后自动生成，之后每增加一段对话再自动更新。
