# AI Chat

纯静态手机聊天 App，用浏览器直接请求 DeepSeek 或自定义 OpenAI-Compatible API。

- API Key 只保存在当前浏览器 localStorage
- 聊天记录只保存在当前浏览器 localStorage
- 没有后台
- 没有上传
- 没有同步服务器
- 可开启轻量联网搜索：使用 DuckDuckGo Instant Answer 和中文 Wikipedia 摘要作为模型上下文

发布到 GitHub Pages 后，iPhone 用 Safari 打开 HTTPS 地址，然后选择“分享” -> “添加到主屏幕”。

如果 DeepSeek 或自定义服务商阻止浏览器直连，会出现 CORS/network error。纯静态版无法绕过 CORS。

联网搜索会把你的问题发送到第三方公开搜索接口获取摘要；它不需要额外 API Key，但不是完整搜索引擎。
