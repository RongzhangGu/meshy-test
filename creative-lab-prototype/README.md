# Meshy Creative Lab

React + Vite 交互原型，包含 14 类创作目录、照片上传、同页工作区、3D 示例、My Creations、Business、FAQ 和深浅主题。

## 运行与检查

需要 Node.js 22.12+。在本目录执行：

```bash
npm ci
npm run dev
```

开发地址：<http://127.0.0.1:5186/>。

```bash
npm test
npm run build
npm run preview
```

构建输出到 `dist/`，预览地址为 <http://127.0.0.1:4173/>。

## 目录与复用

```text
src/
  main.jsx       React 挂载、字体和全局样式入口
  App.jsx        页面状态、上传、工作区切换和保存
  components/    页面组件与各自的特效样式，不再套 UI 子目录
  data/          品类、创作参数、搜索词和 FAQ 内容
  lib/           上传校验、布局计算、滚动和动画逻辑
  styles/        全局样式，由 index.css 统一确定加载顺序
tests/           Node.js 原生测试
public/
  assets/        页面实际使用的图片
  fonts/         Caveat 字体及其许可证
  models/        灯具 STL 示例
docs/            设计说明、素材来源和现用素材提示词
```

常见修改位置：

| 要修改的内容 | 文件 |
| --- | --- |
| 品类名称、图片、链接 | `src/data/products.js` |
| 数量、额度、示例、样式选项 | `src/data/creation-settings.js` |
| 搜索关键词与分类 | `src/data/discovery-data.js` |
| FAQ 文案 | `src/data/faq-data.js` |
| 首页展开效果 | `src/components/CreativeOpening.jsx`、`src/lib/opening-*.js` |
| 工作区 | `src/components/InlineWorkspace.jsx`、`CatalogueWorkspace.jsx` |
| 页面与工作区布局 | `src/styles/layout.css` |
| 导航、流程、主题 | `src/styles/navigation.css`、`workflow.css`、`light-theme.css` |

组件专属样式与组件放在一起；全局主题覆盖最后加载。复用项目时复制本目录，重新运行 `npm ci` 即可。无需复制 `node_modules/` 或 `dist/`，无需 API Key。

## 演示范围

- 上传支持 JPG、PNG、WebP，默认上限 10 MB；部分模型类工作区支持 20 MB，所有图片最多 40 MP。错误输入保留最后一张有效照片。
- 钥匙扣是 Three.js 外壳与照片嵌片；灯具使用两个 STL 示例。其他照片类工作区使用参考图，地形和 Pixleap 提供各自的示例及官网入口。
- Start Design 演示预览流程，不调用 AI 生成接口或扣费。照片不会生成真实 3D 模型。
- My Creations 保存本次页面会话中的照片、名称和设置，刷新后清空。
- Business 表单只在本地显示摘要，联系链接不携带填写内容。
- 3D 预览按需加载；生产构建仍会提示现有的大型 JavaScript 分块。

## 设计与素材

- [设计说明](docs/DESIGN-RATIONALE.md)、[设计系统](docs/DESIGN-SYSTEM.md)、[内容核对](docs/CONTENT-AUDIT.md)
- [图片来源](docs/assets-sources.json)、[模型来源](docs/models-sources.json)
- [现用 AI 素材提示词](docs/asset-prompts/)、[按钮原始参考](docs/references/SpecularButton.user-source.md)

旧版展示组件、废弃图片、生成中间稿和一次性下载脚本已移除。现用原图、透明图集、字体许可证和来源记录保留。Meshy 品牌及第三方素材的权利归各自权利人所有。
