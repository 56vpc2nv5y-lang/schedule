# Sunny OS 第三皮肤：Executive Cobalt

## 文件

- `sunny-theme-3.css`：完整皮肤 CSS。
- `theme-preview.html`：可直接打开的组件与布局预览页。

## 设计定位

关键词：专业、紧凑、国际业务、行动导向、低噪音。

核心特点：

1. 深色导航栏与暖灰页面背景形成稳定框架。
2. 钴蓝作为唯一主操作色，避免页面颜色过多。
3. 项目、培训、接待、展会使用固定语义色。
4. 卡片保持轻边框和轻阴影，不使用渐变或玻璃拟态。
5. 默认信息密度适中，可通过 `data-density="compact"` 开启紧凑模式。
6. 日历、看板、表格、联系人和抽屉使用统一圆角与间距体系。

## 最简单的接入方式

在页面 `<head>` 中引入：

```html
<link rel="stylesheet" href="/styles/sunny-theme-3.css">
```

在根节点设置主题：

```html
<html data-theme="sunny-third">
```

使用紧凑密度：

```html
<html data-theme="sunny-third" data-density="compact">
```

恢复舒适密度：

```html
<html data-theme="sunny-third" data-density="comfortable">
```

## 在 React / Next.js 中切换第三皮肤

```tsx
function applyTheme(theme: string) {
  const root = document.documentElement;

  if (theme === "sunny-third") {
    root.dataset.theme = "sunny-third";
    root.dataset.density = "comfortable";
  }
}
```

建议将用户选择保存到现有设置数据中，不要在主题 CSS 中写业务状态。

## 业务类型类名

```html
<span class="pill blue">项目</span>
<span class="pill purple">培训</span>
<span class="pill green">接待</span>
<span class="pill orange">展会</span>
```

或者使用更明确的主题类：

```html
<span class="s3-pill s3-type-project">项目</span>
<span class="s3-pill s3-type-training">培训</span>
<span class="s3-pill s3-type-reception">接待</span>
<span class="s3-pill s3-type-expo">展会</span>
```

## 状态类名

```html
<span class="s3-pill status-idle">未开始</span>
<span class="s3-pill status-progress">进行中</span>
<span class="s3-pill status-check">待自查</span>
<span class="s3-pill status-leader">待 Leader 审核</span>
<span class="s3-pill status-waiting">待外部回复</span>
<span class="s3-pill status-send">待对外发送</span>
<span class="s3-pill status-done">已完成</span>
```

## 推荐使用方式

第三皮肤应只负责：

- 排版；
- 颜色；
- 间距；
- 字体层级；
- 边框与阴影；
- 响应式布局；
- 控件视觉状态。

不要把以下内容写死在 CSS 中：

- 项目名称；
- 数据库状态；
- 筛选逻辑；
- 权限；
- 页面路由；
- 任务流转。

## 主题切换建议

在设置页增加：

- 皮肤一：现有默认主题；
- 皮肤二：现有第二主题；
- 皮肤三：Executive Cobalt。

切换时仅修改：

```js
document.documentElement.dataset.theme = "sunny-third";
```

如果现有系统已经通过 `body` 类名切换主题，也可以改为：

```html
<body class="theme-sunny-third">
```

但需要同步把 CSS 中的 `html[data-theme="sunny-third"]` 替换为 `.theme-sunny-third`。
