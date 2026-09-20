# Meshy Test · Creative Lab

供 Meshy 团队下载到本地、运行和评审的 Creative Lab 交互原型。

## 本地运行

需要 Git 和 Node.js 22.12+（建议使用 Node.js 24 LTS，包含 npm）。

```bash
git clone https://github.com/RongzhangGu/meshy-test.git
cd meshy-test/creative-lab-prototype
npm ci
npm run dev
```

打开 <http://127.0.0.1:5186/>。首次安装依赖需要联网，按 `Ctrl+C` 停止服务。
也可以在 GitHub 点击 **Code → Download ZIP**，解压后进入 `creative-lab-prototype` 目录运行相同的 npm 命令。

## 建议查看

- 首页悬浮作品、滚动展开的 14 类创作目录、搜索和悬停预览。
- 上传本地照片，进入不同类别的工作区，调整设置并查看演示预览。
- 保存到 My Creations、重新打开作品，以及默认深色的主题切换和手机布局。
- 打开常驻 Orders 入口，查看样例订单、送达通知、时间线和客服入口。

这是用于体验评审的前端原型。AI 生成和额度为演示，不会调用生成 API 或扣费；Orders 使用本地样例数据，不连接真实账户、支付、物流或客服提交。无需 Meshy API Key。保存的创作仅在当前页面会话中保留，刷新后清空。部分 3D 预览使用样例模型，上传照片不会生成真实 3D 模型。

## 测试与构建

在 `creative-lab-prototype` 目录执行：

```bash
npm test
npm run build
npm run preview
```

构建预览地址为 <http://127.0.0.1:4173/>。

## 项目资料

- [目录、复用指南与演示边界](creative-lab-prototype/README.md)
- [Creative Lab 改版说明](creative-lab-prototype/docs/SUBMISSION-DRAFT.md)
- [设计说明](creative-lab-prototype/docs/DESIGN-RATIONALE.md)
- [设计系统](creative-lab-prototype/docs/DESIGN-SYSTEM.md)
- [内容核对](creative-lab-prototype/docs/CONTENT-AUDIT.md)
- [图片来源](creative-lab-prototype/docs/assets-sources.json)与[模型来源](creative-lab-prototype/docs/models-sources.json)

源码位于 `creative-lab-prototype/src/`，运行所需素材位于 `creative-lab-prototype/public/`。依赖、构建产物和临时文件不纳入版本控制。

本仓库用于测试和评审；Meshy 品牌及第三方素材的权利归各自权利人所有。
