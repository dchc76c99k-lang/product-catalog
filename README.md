# 产品目录网站 — 使用说明

## 这是什么？

一个纯静态的产品展示网站。买家点开链接后：
1. 看到所有品牌列表
2. 点击品牌 → 看到该品牌的产品图片（支持分页）
3. 点击产品图片可放大查看
4. 随时可通过 WhatsApp 二维码或按钮联系你

**不需要任何第三方应用**，只需要一个文件夹 + 照片 + 一个配置文件。

---

## 快速开始（3 步）

### 第 1 步：放照片

打开 `images/` 文件夹，按品牌建子文件夹，把产品照片放进去：

```
images/
├── 品牌A/
│   ├── 产品1.jpg
│   ├── 产品2.jpg
│   └── ...
├── 品牌B/
│   ├── 产品1.jpg
│   └── ...
└── 品牌C/
    └── ...
```

支持的图片格式：`.jpg` `.jpeg` `.png` `.gif` `.webp` `.svg` `.bmp`

### 第 2 步：生成配置

在 `product-catalog` 文件夹下运行：

```bash
node generate-config.js
```

这个脚本会自动扫描 `images/` 文件夹，把所有品牌和产品写入 `config.js`。

### 第 3 步：修改 WhatsApp 号码

打开 `config.js`，找到 `whatsapp` 部分，修改 `number` 为你的号码：

```javascript
whatsapp: {
  number: "8613800000000",  // ← 改成你的号码（国家代码+号码，不要+号和空格）
  defaultMessage: "你好，我对你们的产品感兴趣",
  qrCodeImage: null,  // 自动生成二维码，或填图片路径用自己的二维码
},
```

号码格式：国家代码 + 号码，比如：
- 中国：`8613812345678`
- 美国：`12025551234`
- 印度：`919876543210`

---

## 自定义设置

打开 `config.js` 可以修改：

| 设置 | 说明 | 默认值 |
|------|------|--------|
| `siteName` | 网站标题 | 我的产品目录 |
| `siteSubtitle` | 副标题 | 精选好货 · 品质保证 |
| `whatsapp.number` | WhatsApp 号码 | 需要修改 |
| `whatsapp.defaultMessage` | 默认聊天消息 | 你好... |
| `whatsapp.qrCodeImage` | 二维码图片（null=自动生成） | null |
| `productsPerPage` | 每页显示产品数 | 12 |

### 添加产品价格

在 `config.js` 的 `brands` 数组中，每个产品可以添加价格：

```javascript
{ image: "images/品牌A/产品1.jpg", name: "产品1", price: "¥99" }
```

### 手动添加品牌（不使用自动扫描）

直接在 `config.js` 的 `brands` 数组中添加：

```javascript
{
  id: "my-brand",           // 英文ID，不能重复
  name: "我的品牌",          // 显示名称
  description: "品牌简介",   // 简介（可空）
  products: [
    { image: "images/品牌A/产品1.jpg", name: "产品1", price: "¥99" },
    { image: "images/品牌A/产品2.jpg", name: "产品2", price: "¥199" },
  ],
},
```

---

## 本地预览

在 `product-catalog` 文件夹下运行：

```bash
# 方式1：用 Node.js
node -e "require('http').createServer((req,res)=>{const f=require('fs');let p='.'+req.url;if(p==='./')p='./index.html';f.readFile(p,(e,d)=>{if(e){res.writeHead(404);res.end('Not found')}else{res.writeHead(200);res.end(d)}})}).listen(3000,()=>console.log('预览地址: http://localhost:3000'))"

# 方式2：用 Python
python -m http.server 3000
```

然后浏览器打开 `http://localhost:3000`

---

## 部署上线（让别人通过链接访问）

### 方式1：免费托管（推荐）

把整个 `product-catalog` 文件夹上传到以下任一平台：

- **GitHub Pages**：免费，适合长期使用
- **CloudStudio**：直接部署，一键生成链接
- **Netlify / Vercel**：拖拽上传，自动生成链接

### 方式2：压缩发送

把整个文件夹压缩成 ZIP，放到网盘或云存储，分享下载链接。

---

## 管理后台（只有你能进）

管理后台地址是隐藏的，买家看不到、首页也没有入口，只有知道下面这个地址才能打开：

```
http://localhost:3000/admin.html
```

**登录密码：`666666`**

登录后可以看到统计、管理图片、重新生成配置。

### 🔒 添加 / 删除品牌（需要高级密码）

「添加品牌」和「删除品牌」按钮默认**隐藏**，防止误操作。需要用的时候：

1. 登录管理后台
2. 点右上角「⚙ 高级设置」
3. 输入高级密码 **`666666`**
4. 解锁后就会出现「+ 添加品牌」按钮和每个品牌旁的「删除品牌」按钮

> 提示：解锁状态在本次浏览器会话内保持，关闭浏览器后会自动上锁。

### 管理后台能做什么

| 功能 | 位置 | 说明 |
|------|------|------|
| 看统计 | 登录后首页 | 品牌数、产品总数、WhatsApp 号码 |
| 删除图片 | 点开品牌 → 图片右上角 × | 删除单个产品图 |
| 添加品牌 | ⚙ 高级设置解锁后 | 创建品牌文件夹 |
| 删除品牌 | ⚙ 高级设置解锁后 | 删除品牌及其全部图片 |
| 重新生成配置 | 顶部按钮 | 扫描图片文件夹，刷新产品列表 |

---

## 文件结构说明

```
product-catalog/
├── index.html          ← 主页面（一般不用改）
├── config.js           ← 配置文件（你需要修改的）
├── app.js              ← 应用逻辑（一般不用改）
├── style.css           ← 样式表（一般不用改）
├── qrcode.min.js       ← 二维码生成库（不用改）
├── generate-config.js  ← 自动生成配置的脚本
├── images/             ← 产品图片文件夹
│   ├── 品牌A/
│   ├── 品牌B/
│   └── 品牌C/
└── README.md           ← 本说明文件
```

---

## 常见问题

**Q: 为什么图片显示不出来？**
A: 检查 `config.js` 中图片路径是否正确，图片文件确实存在于对应位置。

**Q: 扫码后没有跳转 WhatsApp？**
A: 检查 `config.js` 中 `whatsapp.number` 格式是否正确（纯数字，带国家代码，无空格和+号）。

**Q: 怎么换品牌的图标颜色？**
A: 颜色是根据品牌 ID 自动生成的。如果要自定义，修改 `app.js` 中的 `brandColors` 数组。

**Q: 一个品牌产品太多怎么办？**
A: 修改 `config.js` 中 `productsPerPage` 控制每页显示数量，系统自动分页。
