// ============================================
//  自动扫描文件夹生成 config.js
//  使用方法：node generate-config.js
//
//  规则：
//  1. images/ 下每个子文件夹 = 一个品牌
//  2. 文件夹名 = 品牌名
//  3. 文件夹里的图片 = 该品牌的产品
//  4. 支持 .jpg .jpeg .png .gif .webp .svg
//
//  你只需要：
//  - 在 images/ 下建品牌文件夹
//  - 把产品照片放进去
//  - 运行 node generate-config.js
//  - config.js 自动更新
// ============================================

const fs = require("fs");
const path = require("path");

const IMAGES_DIR = path.join(__dirname, "images");
const CONFIG_PATH = path.join(__dirname, "config.js");
const VALID_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"];

// ---- 保留用户已有的 WhatsApp 和站点设置 ----
let existingConfig = {};
try {
  const oldContent = fs.readFileSync(CONFIG_PATH, "utf-8");
  // 简单提取 whatsapp 和 siteName 设置
  const siteNameMatch = oldContent.match(/siteName:\s*"([^"]*)"/);
  const siteSubMatch = oldContent.match(/siteSubtitle:\s*"([^"]*)"/);
  const siteNoteMatch = oldContent.match(/siteNote:\s*"([^"]*)"/);
  const waNumberMatch = oldContent.match(/number:\s*"([^"]*)"/);
  const waMsgMatch = oldContent.match(/defaultMessage:\s*"([^"]*)"/);
  const waQrMatch = oldContent.match(/qrCodeImage:\s*(null|"[^"]*")/);
  const perPageMatch = oldContent.match(/productsPerPage:\s*(\d+)/);

  existingConfig.siteName = siteNameMatch ? siteNameMatch[1] : "我的产品目录";
  existingConfig.siteSubtitle = siteSubMatch ? siteSubMatch[1] : "精选好货 · 品质保证";
  existingConfig.siteNote = siteNoteMatch ? siteNoteMatch[1] : "";
  existingConfig.waNumber = waNumberMatch ? waNumberMatch[1] : "8613800000000";
  existingConfig.waMessage = waMsgMatch ? waMsgMatch[1] : "你好，我在产品目录上看到了感兴趣的商品，想咨询一下";
  existingConfig.waQrImage = waQrMatch ? waQrMatch[1] : "null";
  existingConfig.perPage = perPageMatch ? parseInt(perPageMatch[1], 10) : 12;
} catch (e) {
  existingConfig = {
    siteName: "我的产品目录",
    siteSubtitle: "精选好货 · 品质保证",
    siteNote: "",
    waNumber: "8613800000000",
    waMessage: "你好，我在产品目录上看到了感兴趣的商品，想咨询一下",
    waQrImage: "null",
    perPage: 12,
  };
}

// ---- 品牌显示名称智能转换 ----
// 小写文件夹名 → 美观的品牌名（可自行添加）
const BRAND_NAME_MAP = {
  lv: "LV",
  mcm: "MCM",
  ysl: "YSL",
  gucci: "Gucci",
  prada: "Prada",
  fendi: "FENDI",
  dior: "Dior",
  chanel: "Chanel",
  celine: "Celine",
  coach: "Coach",
  miumiu: "Miu Miu",
  nike: "Nike",
  adidas: "Adidas",
  puma: "Puma",
};

function toDisplayName(folderName) {
  if (BRAND_NAME_MAP[folderName.toLowerCase()]) {
    return BRAND_NAME_MAP[folderName.toLowerCase()];
  }
  // 默认：首字母大写
  return folderName.charAt(0).toUpperCase() + folderName.slice(1);
}

// ---- 扫描文件夹 ----
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  console.log("\u2705 创建了 images 文件夹");
}

const entries = fs.readdirSync(IMAGES_DIR, { withFileTypes: true });
const brands = [];

entries.forEach(function (entry) {
  if (!entry.isDirectory()) return;

  var brandName = entry.name;
  var brandId = brandName.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, "-");
  var brandDir = path.join(IMAGES_DIR, brandName);
  var files = fs.readdirSync(brandDir);

  var products = files
    .filter(function (f) {
      var ext = path.extname(f).toLowerCase();
      return VALID_EXTS.indexOf(ext) !== -1;
    })
    .sort()
    .map(function (f, idx) {
      var imgPath = "images/" + brandName + "/" + f;
      return {
        image: imgPath,
        name: "产品 " + (idx + 1),
        price: "",
      };
    });

  if (products.length > 0) {
    brands.push({
      id: brandId,
      name: toDisplayName(brandName),
      description: "",
      products: products,
    });
    console.log("  \uD83D\uDCC1 " + toDisplayName(brandName) + " -> " + products.length + " 个产品");
  }
});

if (brands.length === 0) {
  console.log("\u26A0\uFE0F  images/ 下没有找到任何品牌文件夹或图片");
  console.log("   请先创建品牌文件夹并放入产品图片");
  process.exit(0);
}

// ---- 生成 config.js ----
var configContent = [
  "// ============================================",
  "//  产品目录配置文件 — 自动生成",
  "//  最后更新: " + new Date().toLocaleString("zh-CN"),
  "//",
  "//  \u26A0\uFE0F 此文件由 generate-config.js 自动生成",
  "//  请勿手动修改品牌和产品列表，修改后会被覆盖",
  "//  如需修改 WhatsApp 号码等设置，请修改后重新运行生成脚本",
  "//  如需手动添加价格等信息，请在下方 products 数组中修改",
  "// ============================================",
  "",
  "const SITE_CONFIG = {",
  "",
  "  // ---- 网站基本设置 ----",
  '  siteName: "' + existingConfig.siteName + '",',
  '  siteSubtitle: "' + existingConfig.siteSubtitle + '",',
  '  siteNote: "' + existingConfig.siteNote + '",',
  "",
  "  // ---- WhatsApp 联系方式 ----",
  "  whatsapp: {",
  "    number: \"" + existingConfig.waNumber + "\",",
  '    defaultMessage: "' + existingConfig.waMessage + '",',
  "    qrCodeImage: " + existingConfig.waQrImage + ",",
  "  },",
  "",
  "  // ---- 品牌列表（自动扫描生成）----",
  "  brands: [",
];

brands.forEach(function (brand, idx) {
  configContent.push("    {");
  configContent.push('      id: "' + brand.id + '",');
  configContent.push('      name: "' + brand.name + '",');
  configContent.push('      description: "' + (brand.description || "") + '",');
  configContent.push("      products: [");
  brand.products.forEach(function (p, pidx) {
    var comma = pidx < brand.products.length - 1 ? "," : "";
    configContent.push(
      '        { image: "' + p.image + '", name: "' + p.name + '", price: "' + (p.price || "") + '" }' + comma
    );
  });
  configContent.push("      ],");
  configContent.push("    }" + (idx < brands.length - 1 ? "," : ""));
});

configContent.push("  ],");
configContent.push("");
configContent.push("  // ---- 分页设置 ----");
configContent.push("  productsPerPage: " + existingConfig.perPage + ",");
configContent.push("};");

fs.writeFileSync(CONFIG_PATH, configContent.join("\n") + "\n", "utf-8");

console.log("");
console.log("\u2705 配置文件已生成: config.js");
console.log("   品牌: " + brands.length + " 个");
console.log("   产品: " + brands.reduce(function (s, b) { return s + b.products.length; }, 0) + " 个");
console.log("");
console.log("\u{1F4A1} 提示:");
console.log("   1. 可以在 config.js 中修改品牌描述和产品价格");
console.log("   2. 添加新照片后重新运行 node generate-config.js 即可更新");
