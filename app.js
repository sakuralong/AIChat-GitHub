const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant. Answer clearly and naturally.";
const SETTINGS_KEY = "seekchat.settings";
const CONVERSATIONS_KEY = "seekchat.conversations";

const DEFAULT_SETTINGS = {
  provider: "deepseek",
  apiKey: "",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-flash"
};

const state = {
  settings: {},
  conversations: [],
  currentConversationId: null,
  loading: false
};

const els = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheElements();
  setDisplayModeClass();
  state.settings = loadSettings();
  state.conversations = loadConversations();

  if (state.conversations.length > 0) {
    state.currentConversationId = sortConversations(state.conversations)[0].id;
  } else {
    createConversation(false);
  }

  bindEvents();
  renderApp();
  autoResizeTextarea();
  registerServiceWorker();
}

function cacheElements() {
  els.sidebar = document.getElementById("sidebar");
  els.drawerBackdrop = document.getElementById("drawerBackdrop");
  els.openDrawerBtn = document.getElementById("openDrawerBtn");
  els.closeDrawerBtn = document.getElementById("closeDrawerBtn");
  els.newChatBtn = document.getElementById("newChatBtn");
  els.clearChatBtn = document.getElementById("clearChatBtn");
  els.settingsBtn = document.getElementById("settingsBtn");
  els.mobileSettingsBtn = document.getElementById("mobileSettingsBtn");
  els.modelShortcutBtn = document.getElementById("modelShortcutBtn");
  els.composerSettingsBtn = document.getElementById("composerSettingsBtn");
  els.conversationList = document.getElementById("conversationList");
  els.chatScroll = document.getElementById("chatScroll");
  els.emptyState = document.getElementById("emptyState");
  els.messageList = document.getElementById("messageList");
  els.composerForm = document.getElementById("composerForm");
  els.messageInput = document.getElementById("messageInput");
  els.sendBtn = document.getElementById("sendBtn");
  els.settingsModal = document.getElementById("settingsModal");
  els.closeSettingsBtn = document.getElementById("closeSettingsBtn");
  els.providerSelect = document.getElementById("providerSelect");
  els.apiKeyInput = document.getElementById("apiKeyInput");
  els.toggleApiKeyBtn = document.getElementById("toggleApiKeyBtn");
  els.baseUrlInput = document.getElementById("baseUrlInput");
  els.modelInput = document.getElementById("modelInput");
  els.quickModelOptions = document.getElementById("quickModelOptions");
  els.saveSettingsBtn = document.getElementById("saveSettingsBtn");
  els.cancelSettingsBtn = document.getElementById("cancelSettingsBtn");
  els.clearApiKeyBtn = document.getElementById("clearApiKeyBtn");
  els.clearAllDataBtn = document.getElementById("clearAllDataBtn");
  els.exportDataBtn = document.getElementById("exportDataBtn");
  els.importDataInput = document.getElementById("importDataInput");
  els.toastContainer = document.getElementById("toastContainer");
}

function bindEvents() {
  els.openDrawerBtn.addEventListener("click", openDrawer);
  els.closeDrawerBtn.addEventListener("click", closeDrawer);
  els.drawerBackdrop.addEventListener("click", closeDrawer);

  els.newChatBtn.addEventListener("click", function () {
    createConversation(true);
    closeDrawer();
  });

  els.clearChatBtn.addEventListener("click", clearCurrentConversation);
  els.settingsBtn.addEventListener("click", openSettings);
  els.mobileSettingsBtn.addEventListener("click", openSettings);
  els.modelShortcutBtn.addEventListener("click", openSettings);
  els.composerSettingsBtn.addEventListener("click", openSettings);

  els.composerForm.addEventListener("submit", function (event) {
    event.preventDefault();
    handleSend();
  });

  els.messageInput.addEventListener("input", autoResizeTextarea);
  els.messageInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  });

  els.closeSettingsBtn.addEventListener("click", closeSettings);
  els.settingsModal.addEventListener("click", function (event) {
    if (event.target.classList.contains("modal-backdrop")) {
      closeSettings();
    }
  });

  els.providerSelect.addEventListener("change", function () {
    if (els.providerSelect.value === "deepseek") {
      els.baseUrlInput.value = "https://api.deepseek.com";
      if (!els.modelInput.value.trim()) {
        els.modelInput.value = "deepseek-v4-flash";
      }
    }
    renderSettings();
  });

  els.toggleApiKeyBtn.addEventListener("click", function () {
    const isPassword = els.apiKeyInput.type === "password";
    els.apiKeyInput.type = isPassword ? "text" : "password";
    els.toggleApiKeyBtn.textContent = isPassword ? "隐藏" : "显示";
  });

  els.quickModelOptions.addEventListener("click", function (event) {
    const button = event.target.closest("[data-model]");
    if (!button) return;
    els.modelInput.value = button.dataset.model;
    renderSettings();
  });

  els.saveSettingsBtn.addEventListener("click", function () {
    state.settings = {
      provider: els.providerSelect.value === "custom" ? "custom" : "deepseek",
      apiKey: els.apiKeyInput.value.trim(),
      baseUrl: normalizeBaseUrl(els.baseUrlInput.value.trim()),
      model: els.modelInput.value.trim()
    };

    if (state.settings.provider === "deepseek") {
      state.settings.baseUrl = "https://api.deepseek.com";
      if (!state.settings.model) {
        state.settings.model = "deepseek-v4-flash";
      }
    }

    saveSettings();
    renderApp();
    closeSettings();
    addToast("设置已保存在本机。", "success");
  });

  els.cancelSettingsBtn.addEventListener("click", closeSettings);

  els.clearApiKeyBtn.addEventListener("click", function () {
    els.apiKeyInput.value = "";
    state.settings.apiKey = "";
    saveSettings();
    addToast("API Key 已从本机清除。", "success");
  });

  els.clearAllDataBtn.addEventListener("click", function () {
    if (!confirm("确定要清空当前浏览器里的所有聊天记录吗？这个操作不能撤销。")) {
      return;
    }

    state.conversations = [];
    createConversation(false);
    saveConversations();
    renderApp();
    addToast("本机聊天记录已清空。", "success");
  });

  els.exportDataBtn.addEventListener("click", exportLocalData);
  els.importDataInput.addEventListener("change", importLocalData);

  document.querySelectorAll(".prompt-chip").forEach(function (button) {
    button.addEventListener("click", function () {
      els.messageInput.value = button.textContent;
      autoResizeTextarea();
      els.messageInput.focus();
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeSettings();
      closeDrawer();
    }
  });

  const displayModeQuery = window.matchMedia("(display-mode: standalone)");
  if (displayModeQuery.addEventListener) {
    displayModeQuery.addEventListener("change", setDisplayModeClass);
  } else if (displayModeQuery.addListener) {
    displayModeQuery.addListener(setDisplayModeClass);
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return Object.assign({}, DEFAULT_SETTINGS);
    }

    const parsed = JSON.parse(raw);
    return Object.assign({}, DEFAULT_SETTINGS, {
      provider: parsed.provider === "custom" ? "custom" : "deepseek",
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
      baseUrl: typeof parsed.baseUrl === "string" && parsed.baseUrl ? normalizeBaseUrl(parsed.baseUrl) : DEFAULT_SETTINGS.baseUrl,
      model: typeof parsed.model === "string" && parsed.model ? parsed.model : DEFAULT_SETTINGS.model
    });
  } catch (error) {
    addToast("设置读取失败，已使用默认设置。", "error");
    return Object.assign({}, DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  } catch (error) {
    addToast("设置无法保存到本机 localStorage。", "error");
  }
}

function loadConversations() {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidConversation);
  } catch (error) {
    addToast("历史对话读取失败，将暂时只保存在内存中。", "error");
    return [];
  }
}

function saveConversations() {
  const conversations = state.conversations
    .filter(function (conversation) {
      return conversation.messages.length > 0;
    })
    .map(function (conversation) {
      return {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: conversation.messages
      };
    });

  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (error) {
    addToast("聊天记录无法保存到本机 localStorage。", "error");
  }
}

function createConversation(shouldRender) {
  const now = Date.now();
  const conversation = {
    id: generateId(),
    title: "新对话",
    createdAt: now,
    updatedAt: now,
    messages: []
  };

  state.conversations.unshift(conversation);
  state.currentConversationId = conversation.id;

  if (shouldRender) {
    saveConversations();
    renderApp();
    requestAnimationFrame(function () {
      els.messageInput.focus();
    });
  }

  return conversation;
}

function selectConversation(id) {
  if (state.loading) {
    addToast("当前回复结束后再切换对话。", "error");
    return;
  }

  const conversation = state.conversations.find(function (item) {
    return item.id === id;
  });

  if (!conversation) return;

  state.currentConversationId = id;
  renderApp();
  closeDrawer();
}

function deleteConversation(id) {
  if (state.loading) {
    addToast("当前回复结束后再删除对话。", "error");
    return;
  }

  state.conversations = state.conversations.filter(function (item) {
    return item.id !== id;
  });

  if (state.conversations.length === 0) {
    createConversation(false);
  } else if (state.currentConversationId === id) {
    state.currentConversationId = sortConversations(state.conversations)[0].id;
  }

  saveConversations();
  renderApp();
}

function clearCurrentConversation() {
  if (state.loading) {
    addToast("当前回复结束后再清空。", "error");
    return;
  }

  const conversation = getCurrentConversation();
  if (!conversation) return;

  conversation.messages = [];
  conversation.title = "新对话";
  conversation.updatedAt = Date.now();
  saveConversations();
  renderApp();
  closeDrawer();
}

function renderApp() {
  renderSidebar();
  renderMessages();
  renderSettings();
  els.modelShortcutBtn.textContent = state.settings.model || "选择模型";
  els.sendBtn.disabled = state.loading || els.messageInput.value.trim().length === 0;
}

function renderSidebar() {
  const conversations = sortConversations(state.conversations).filter(function (conversation) {
    return conversation.messages.length > 0 || conversation.id === state.currentConversationId;
  });

  els.conversationList.textContent = "";

  if (conversations.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-list";
    empty.textContent = "还没有对话。";
    els.conversationList.appendChild(empty);
    return;
  }

  conversations.forEach(function (conversation) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "conversation-item";
    if (conversation.id === state.currentConversationId) {
      item.classList.add("active");
    }
    item.addEventListener("click", function () {
      selectConversation(conversation.id);
    });

    const main = document.createElement("span");
    main.className = "conversation-main";

    const title = document.createElement("span");
    title.className = "conversation-title";
    title.textContent = conversation.title || "新对话";

    const meta = document.createElement("span");
    meta.className = "conversation-meta";

    const time = document.createElement("span");
    time.textContent = formatTime(conversation.updatedAt);

    const count = document.createElement("span");
    count.textContent = conversation.messages.length + " 条";

    meta.appendChild(time);
    meta.appendChild(count);
    main.appendChild(title);
    main.appendChild(meta);

    const deleteButton = document.createElement("span");
    deleteButton.className = "delete-conversation";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("role", "button");
    deleteButton.setAttribute("aria-label", "删除本机对话");
    deleteButton.addEventListener("click", function (event) {
      event.stopPropagation();
      deleteConversation(conversation.id);
    });

    item.appendChild(main);
    item.appendChild(deleteButton);
    els.conversationList.appendChild(item);
  });
}

function renderMessages() {
  const conversation = getCurrentConversation();
  const messages = conversation ? conversation.messages : [];

  els.messageList.textContent = "";
  els.emptyState.hidden = messages.length > 0 || state.loading;

  messages.forEach(function (message) {
    els.messageList.appendChild(createMessageElement(message));
  });

  if (state.loading) {
    els.messageList.appendChild(createLoadingElement());
  }

  scrollToBottom();
}

function renderSettings() {
  const settings = state.settings;
  const isDeepSeek = settings.provider !== "custom";

  els.providerSelect.value = isDeepSeek ? "deepseek" : "custom";
  els.apiKeyInput.value = settings.apiKey || "";
  els.baseUrlInput.value = isDeepSeek ? "https://api.deepseek.com" : (settings.baseUrl || "");
  els.baseUrlInput.readOnly = isDeepSeek;
  els.modelInput.value = settings.model || "";
  els.quickModelOptions.hidden = !isDeepSeek;

  document.querySelectorAll(".model-option").forEach(function (button) {
    button.classList.toggle("active", button.dataset.model === els.modelInput.value);
  });

  if (isDeepSeek && !els.modelInput.value.trim()) {
    els.modelInput.value = "deepseek-v4-flash";
  }
}

function openSettings() {
  renderSettings();
  els.settingsModal.hidden = false;
  setTimeout(function () {
    els.apiKeyInput.focus();
  }, 0);
}

function closeSettings() {
  els.settingsModal.hidden = true;
  els.apiKeyInput.type = "password";
  els.toggleApiKeyBtn.textContent = "显示";
  renderSettings();
}

function openDrawer() {
  els.sidebar.classList.add("open");
  els.drawerBackdrop.hidden = false;
}

function closeDrawer() {
  els.sidebar.classList.remove("open");
  els.drawerBackdrop.hidden = true;
}

function autoResizeTextarea() {
  els.messageInput.style.height = "auto";
  els.messageInput.style.height = Math.min(els.messageInput.scrollHeight, 150) + "px";
  els.sendBtn.disabled = state.loading || els.messageInput.value.trim().length === 0;
}

async function handleSend() {
  if (state.loading) return;

  const content = els.messageInput.value.trim();
  if (!content) {
    addToast("先输入一条消息。", "error");
    return;
  }

  const validation = validateSettings();
  if (validation) {
    addToast(validation, "error");
    openSettings();
    return;
  }

  let conversation = getCurrentConversation();
  if (!conversation) {
    conversation = createConversation(false);
  }

  const isFirstUserMessage = conversation.messages.filter(function (message) {
    return message.role === "user";
  }).length === 0;

  conversation.messages.push({ role: "user", content });
  conversation.updatedAt = Date.now();

  if (isFirstUserMessage) {
    conversation.title = createTitleFromMessage(content);
  }

  els.messageInput.value = "";
  autoResizeTextarea();
  setLoading(true);
  saveConversations();
  renderApp();

  try {
    const apiMessages = buildApiMessages(conversation.messages);
    const data = await callChatApi(apiMessages);
    const assistant = safeGetAssistantContent(data);

    conversation.messages.push({
      role: "assistant",
      content: assistant.content,
      reasoningContent: assistant.reasoningContent
    });
    conversation.updatedAt = Date.now();
    saveConversations();
    renderApp();
  } catch (error) {
    const message = error && error.message ? error.message : "请求失败。";
    conversation.messages.push({
      role: "assistant",
      content: message
    });
    conversation.updatedAt = Date.now();
    saveConversations();
    renderApp();
    addToast(message, "error");
  } finally {
    setLoading(false);
    renderApp();
  }
}

function buildApiMessages(conversationMessages) {
  const latestMessages = conversationMessages.slice(-20).map(function (message) {
    return {
      role: message.role,
      content: message.content
    };
  });

  return [
    { role: "system", content: DEFAULT_SYSTEM_PROMPT }
  ].concat(latestMessages);
}

async function callChatApi(messages) {
  const baseUrl = normalizeBaseUrl(state.settings.baseUrl);
  const url = baseUrl + "/chat/completions";
  const controller = new AbortController();
  const timeoutId = setTimeout(function () {
    controller.abort();
  }, 60000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + state.settings.apiKey
      },
      body: JSON.stringify({
        model: state.settings.model,
        messages,
        stream: false
      }),
      signal: controller.signal
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error("请求失败，状态码 " + response.status + "：" + compactErrorText(text));
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error("服务商返回的不是有效 JSON。");
    }
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("请求超过 60 秒，已自动停止。");
    }

    if (error instanceof TypeError) {
      throw new Error("Request failed. This provider may block direct browser requests with CORS. You may need a backend proxy.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function safeGetAssistantContent(data) {
  const message = data &&
    data.choices &&
    data.choices[0] &&
    data.choices[0].message;

  if (!message) {
    throw new Error("空响应：没有找到 assistant message。");
  }

  const content = typeof message.content === "string" ? message.content : "";
  const reasoningContent = typeof message.reasoning_content === "string" ? message.reasoning_content : "";

  if (!content.trim() && !reasoningContent.trim()) {
    throw new Error("空响应：模型没有返回内容。");
  }

  return {
    content: content.trim() || "（没有返回最终回答。）",
    reasoningContent: reasoningContent.trim()
  };
}

function createMessageElement(message) {
  const row = document.createElement("article");
  row.className = "message-row " + message.role;

  const block = document.createElement("div");
  block.className = "message-block";

  if (message.reasoningContent) {
    const details = document.createElement("details");
    details.className = "reasoning";

    const summary = document.createElement("summary");
    summary.textContent = "Reasoning";

    const reasoning = document.createElement("div");
    reasoning.className = "reasoning-content";
    reasoning.textContent = message.reasoningContent;

    details.appendChild(summary);
    details.appendChild(reasoning);
    block.appendChild(details);
  }

  const content = document.createElement("div");
  content.textContent = message.content;
  block.appendChild(content);

  row.appendChild(block);
  return row;
}

function createLoadingElement() {
  const row = document.createElement("article");
  row.className = "message-row loading";

  const block = document.createElement("div");
  block.className = "message-block";

  const dots = document.createElement("span");
  dots.className = "loading-dots";
  dots.setAttribute("aria-label", "助手正在思考");

  for (let index = 0; index < 3; index += 1) {
    dots.appendChild(document.createElement("span"));
  }

  block.appendChild(dots);
  row.appendChild(block);
  return row;
}

function validateSettings() {
  if (!state.settings.apiKey) return "缺少 API Key，请先在设置里填写。";
  if (!state.settings.baseUrl) return "缺少 Base URL，请先在设置里填写。";
  if (!state.settings.model) return "缺少模型名称，请先在设置里填写。";
  return "";
}

function exportLocalData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "AI Chat",
    version: 1,
    conversations: state.conversations.filter(function (conversation) {
      return conversation.messages.length > 0;
    })
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ai-chat-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  addToast("本机聊天备份已导出。", "success");
}

function importLocalData(event) {
  const file = event.target.files && event.target.files[0];
  event.target.value = "";
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", function () {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      const conversations = Array.isArray(parsed) ? parsed : parsed.conversations;

      if (!Array.isArray(conversations)) {
        addToast("备份文件格式不正确。", "error");
        return;
      }

      const valid = conversations.filter(isValidConversation);
      if (valid.length === 0) {
        addToast("备份文件里没有可导入的聊天记录。", "error");
        return;
      }

      const byId = new Map();
      state.conversations.concat(valid).forEach(function (conversation) {
        byId.set(conversation.id, conversation);
      });

      state.conversations = sortConversations(Array.from(byId.values()));
      state.currentConversationId = state.conversations[0].id;
      saveConversations();
      renderApp();
      addToast("备份已导入本机。", "success");
    } catch (error) {
      addToast("备份文件无法读取。", "error");
    }
  });
  reader.readAsText(file);
}

function setLoading(isLoading) {
  state.loading = isLoading;
  els.sendBtn.disabled = isLoading || els.messageInput.value.trim().length === 0;
  els.messageInput.disabled = isLoading;
}

function addToast(message, type) {
  const toast = document.createElement("div");
  toast.className = "toast " + (type || "info");
  toast.textContent = message;
  els.toastContainer.appendChild(toast);

  setTimeout(function () {
    toast.remove();
  }, 5200);
}

function getCurrentConversation() {
  return state.conversations.find(function (conversation) {
    return conversation.id === state.currentConversationId;
  });
}

function isValidConversation(conversation) {
  return conversation &&
    typeof conversation.id === "string" &&
    typeof conversation.title === "string" &&
    typeof conversation.createdAt === "number" &&
    typeof conversation.updatedAt === "number" &&
    Array.isArray(conversation.messages) &&
    conversation.messages.every(isValidMessage);
}

function isValidMessage(message) {
  return message &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string";
}

function sortConversations(conversations) {
  return conversations.slice().sort(function (a, b) {
    return b.updatedAt - a.updatedAt;
  });
}

function createTitleFromMessage(message) {
  const title = message.replace(/\s+/g, " ").trim().slice(0, 40);
  return title || "新对话";
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

function compactErrorText(text) {
  if (!text) return "没有错误正文。";
  return text.replace(/\s+/g, " ").trim().slice(0, 500);
}

function scrollToBottom() {
  requestAnimationFrame(function () {
    els.chatScroll.scrollTop = els.chatScroll.scrollHeight;
  });
}

function generateId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "chat_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") {
    return;
  }

  navigator.serviceWorker.register("sw.js").catch(function () {
    // The app still works without the offline shell cache.
  });
}

function setDisplayModeClass() {
  const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  document.body.classList.toggle("standalone", standalone);
}
