const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 3000;
const ROOT = __dirname;
const IMAGES_DIR = path.join(ROOT, 'images');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + filePath);
    } else {
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    }
  });
}

function parseJSON(req, callback) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      callback(JSON.parse(body));
    } catch {
      callback(null);
    }
  });
}

function jsonResponse(res, data, statusCode) {
  res.writeHead(statusCode || 200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// ---- 安全校验：确保操作在 images/ 目录内 ----
function isSafePath(targetPath) {
  const resolved = path.resolve(targetPath);
  const imagesResolved = path.resolve(IMAGES_DIR);
  return resolved.startsWith(imagesResolved);
}

// ============================================
// 管理 API
// ============================================

// 1. 删除品牌文件夹
function handleDeleteBrand(req, res) {
  parseJSON(req, data => {
    if (!data || !data.brandId) return jsonResponse(res, { success: false, error: '缺少 brandId' }, 400);
    
    const brandName = data.brandId; // 实际上 id 就是小写品牌名
    const brandPath = path.join(IMAGES_DIR, brandName);
    
    if (!isSafePath(brandPath)) return jsonResponse(res, { success: false, error: '路径不合法' }, 400);
    if (!fs.existsSync(brandPath)) return jsonResponse(res, { success: false, error: '品牌不存在' }, 404);
    
    try {
      // 删除文件夹及其所有内容
      fs.rmSync(brandPath, { recursive: true, force: true });
      jsonResponse(res, { success: true, message: '品牌已删除' });
    } catch (err) {
      jsonResponse(res, { success: false, error: err.message }, 500);
    }
  });
}

// 2. 删除图片文件
function handleDeleteImage(req, res) {
  parseJSON(req, data => {
    if (!data || !data.brandId || !data.imageName) return jsonResponse(res, { success: false, error: '缺少参数' }, 400);
    
    const imagePath = path.join(IMAGES_DIR, data.brandId, data.imageName);
    if (!isSafePath(imagePath)) return jsonResponse(res, { success: false, error: '路径不合法' }, 400);
    if (!fs.existsSync(imagePath)) return jsonResponse(res, { success: false, error: '图片不存在' }, 404);
    
    try {
      fs.unlinkSync(imagePath);
      // 如果品牌文件夹变空了，删除它
      const brandDir = path.join(IMAGES_DIR, data.brandId);
      const remaining = fs.readdirSync(brandDir).filter(f => {
        const ext = path.extname(f).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
      });
      if (remaining.length === 0) {
        fs.rmSync(brandDir, { recursive: true, force: true });
      }
      jsonResponse(res, { success: true, message: '图片已删除' });
    } catch (err) {
      jsonResponse(res, { success: false, error: err.message }, 500);
    }
  });
}

// 3. 创建品牌文件夹
function handleCreateBrand(req, res) {
  parseJSON(req, data => {
    if (!data || !data.brandName) return jsonResponse(res, { success: false, error: '缺少品牌名称' }, 400);
    
    const brandName = data.brandName.trim();
    const brandDir = path.join(IMAGES_DIR, brandName);
    
    if (!isSafePath(brandDir)) return jsonResponse(res, { success: false, error: '路径不合法' }, 400);
    if (fs.existsSync(brandDir)) return jsonResponse(res, { success: false, error: '品牌已存在' }, 400);
    
    try {
      fs.mkdirSync(brandDir, { recursive: true });
      jsonResponse(res, { success: true, message: '品牌文件夹已创建', brandName: brandName });
    } catch (err) {
      jsonResponse(res, { success: false, error: err.message }, 500);
    }
  });
}

// 4. 重新生成配置
function handleRegenerateConfig(req, res) {
  try {
    execSync('node generate-config.js', { cwd: ROOT, encoding: 'utf-8' });
    jsonResponse(res, { success: true, message: '配置已重新生成' });
  } catch (err) {
    jsonResponse(res, { success: false, error: err.message || '生成失败' }, 500);
  }
}

// ============================================
// 主服务器
// ============================================

const server = http.createServer((req, res) => {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = req.url.split('?')[0];
  
  // API 路由
  if (url === '/api/delete-brand' && req.method === 'POST') {
    handleDeleteBrand(req, res);
    return;
  }
  if (url === '/api/delete-image' && req.method === 'POST') {
    handleDeleteImage(req, res);
    return;
  }
  if (url === '/api/create-brand' && req.method === 'POST') {
    handleCreateBrand(req, res);
    return;
  }
  if (url === '/api/regenerate-config' && req.method === 'POST') {
    handleRegenerateConfig(req, res);
    return;
  }
  
  // 静态文件服务
  let filePath = url === '/' ? '/index.html' : url;
  filePath = decodeURIComponent(filePath);
  // 防止路径遍历
  const safePath = path.join(ROOT, filePath);
  if (!safePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  serveFile(safePath, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('  产品目录服务器已启动');
  console.log('  访问地址: http://localhost:' + PORT);
  console.log('  管理后台: http://localhost:' + PORT + '/admin.html');
  console.log('  密码: 123456');
  console.log('========================================');
});
