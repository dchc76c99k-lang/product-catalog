// ============================================
//  产品目录 — 应用逻辑
//  自动路由 · 品牌展示 · 产品分页 · WhatsApp
// ============================================

(function () {
  "use strict";

  var config = window.SITE_CONFIG || {};
  var perPage = config.productsPerPage || 12;
  var currentPage = 1;
  var currentBrand = null;

  // ---- DOM 引用 ----
  var app = document.getElementById("app");
  var breadcrumb = document.getElementById("breadcrumb");
  var waModal = document.getElementById("waModal");
  var waModalClose = document.getElementById("waModalClose");
  var waFab = document.getElementById("waFab");
  var headerWaBtn = document.getElementById("headerWaBtn");
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxInfo = document.getElementById("lightboxInfo");
  var lightboxClose = document.getElementById("lightboxClose");

  // ---- 初始化 ----
  function init() {
    // 网站名称
    if (config.siteName) {
      document.getElementById("siteName").textContent = config.siteName;
      document.title = config.siteName;
    }
    // 页脚
    if (config.siteName) {
      document.getElementById("footerText").textContent =
        "\u00A9 " + new Date().getFullYear() + " " + config.siteName + " \u00B7 保留所有权利";
    }
    // WhatsApp 设置
    setupWhatsApp();
    // 路由
    window.addEventListener("hashchange", route);
    route();
  }

  // ---- WhatsApp 设置 ----
  function setupWhatsApp() {
    var wa = config.whatsapp || {};
    var number = wa.number || "";
    var message = wa.defaultMessage || "";
    var waLink = "https://wa.me/" + number + (message ? "?text=" + encodeURIComponent(message) : "");

    // 头部按钮
    headerWaBtn.href = waLink;
    headerWaBtn.target = "_blank";
    headerWaBtn.rel = "noopener";

    // 悬浮按钮和弹窗
    waFab.addEventListener("click", function () {
      openWaModal(waLink);
    });

    // 弹窗关闭
    waModalClose.addEventListener("click", closeWaModal);
    waModal.addEventListener("click", function (e) {
      if (e.target === waModal) closeWaModal();
    });

    // 弹窗内的聊天按钮
    var chatBtn = document.getElementById("waChatBtn");
    chatBtn.href = waLink;

    // 显示号码
    document.getElementById("waNumber").textContent = formatNumber(number);

    // 生成二维码
    var qrBox = document.getElementById("qrCodeBox");
    qrBox.innerHTML = "";
    if (wa.qrCodeImage) {
      // 用户提供了二维码图片
      var img = document.createElement("img");
      img.src = wa.qrCodeImage;
      img.width = 200;
      img.height = 200;
      img.alt = "WhatsApp QR Code";
      qrBox.appendChild(img);
    } else if (typeof QRCode !== "undefined" && number) {
      // 自动生成二维码
      new QRCode(qrBox, {
        text: waLink,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
      });
    } else {
      qrBox.innerHTML = "<p style='color:#999;font-size:13px;'>请在 config.js 中设置 WhatsApp 号码</p>";
    }
  }

  function formatNumber(num) {
    // 简单格式化：+86 138 0000 0000
    if (!num) return "";
    if (num.length >= 13) {
      return "+" + num.slice(0, 2) + " " + num.slice(2, 5) + " " + num.slice(5, 9) + " " + num.slice(9);
    }
    return "+" + num;
  }

  function openWaModal() {
    waModal.classList.add("show");
  }

  function closeWaModal() {
    waModal.classList.remove("show");
  }

  // ---- 路由 ----
  function route() {
    var hash = window.location.hash.slice(1) || "/";
    window.scrollTo(0, 0);

    if (hash === "/" || hash === "") {
      renderBrands();
    } else {
      // #/brand-a → brand-a
      var brandId = hash.replace(/^\//, "").split("?")[0];
      renderProducts(brandId);
    }
  }

  // ---- 渲染品牌列表 ----
  function renderBrands() {
    var brands = config.brands || [];
    breadcrumb.innerHTML = "";

    if (brands.length === 0) {
      app.innerHTML =
        '<div class="empty-state">' +
        '<div class="icon">\uD83D\uDCED</div>' +
        "<h3>暂无品牌</h3>" +
        "<p>请在 config.js 中添加品牌和产品</p>" +
        "</div>";
      return;
    }

    // Hero 区
    var html =
      '<div class="hero fade-in">' +
      "<h1>" + escapeHtml(config.siteName || "品牌精选") + "</h1>";
    if (config.siteSubtitle) {
      html += '<p class="hero-sub">' + escapeHtml(config.siteSubtitle) + "</p>";
    }
    html += '<div class="hero-line"></div>';
    if (config.siteNote) {
      html += '<p class="hero-note">' + escapeHtml(config.siteNote) + "</p>";
    }
    html += "</div>";

    // 品牌字标卡片网格
    html += '<div class="brand-grid">';
    brands.forEach(function (brand, idx) {
      var count = (brand.products || []).length;
      html +=
        '<a href="#/' + brand.id + '" class="brand-card fade-in" style="animation-delay:' + (idx * 40) + 'ms;">' +
        '<div class="brand-card-name">' + escapeHtml(brand.name) + "</div>" +
        '<div class="brand-card-count">' + count + " \u4E2A\u4EA7\u54C1</div>" +
        "</a>";
    });
    html += "</div>";

    app.innerHTML = html;
  }

  // ---- 渲染产品列表（带分页） ----
  function renderProducts(brandId) {
    var brands = config.brands || [];
    var brand = null;
    for (var i = 0; i < brands.length; i++) {
      if (brands[i].id === brandId) {
        brand = brands[i];
        break;
      }
    }

    if (!brand) {
      app.innerHTML =
        '<div class="empty-state">' +
        '<div class="icon">\uD83D\uDD0D</div>' +
        "<h3>未找到该品牌</h3>" +
        '<a href="#/" class="back-btn">\u2190 返回品牌列表</a>' +
        "</div>";
      return;
    }

    currentBrand = brand;
    currentPage = getPageFromHash() || 1;

    // 面包屑
    breadcrumb.innerHTML =
      '<a href="#/">首页</a>' +
      '<span class="sep">/</span>' +
      "<span>" + escapeHtml(brand.name) + "</span>";

    var products = brand.products || [];
    var totalPages = Math.ceil(products.length / perPage);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    var start = (currentPage - 1) * perPage;
    var end = Math.min(start + perPage, products.length);
    var pageProducts = products.slice(start, end);

    var html =
      '<button class="back-btn" onclick="window.location.hash=\'#/\'">\u2190 返回品牌列表</button>' +
      '<div class="product-hero fade-in">' +
      "<h1>" + escapeHtml(brand.name) + "</h1>" +
      '<div class="hero-line"></div>';
    if (brand.description) {
      html += "<p>" + escapeHtml(brand.description) + "</p>";
    }
    html += '<div class="product-count">' + products.length + " \u4E2A\u4EA7\u54C1</div></div>";

    if (products.length === 0) {
      html +=
        '<div class="empty-state">' +
        '<div class="icon">\uD83D\uDCC1</div>' +
        "<h3>暂无产品</h3>" +
        "<p>请在 config.js 中为该品牌添加产品</p>" +
        "</div>";
    } else {
      // 产品网格
      html += '<div class="product-grid">';
      pageProducts.forEach(function (product, idx) {
        var globalIdx = start + idx;
        html +=
          '<div class="product-card" data-brand="' + brand.id + '" data-idx="' + globalIdx + '" style="animation-delay:' + (idx * 50) + 'ms;">' +
          '<div class="product-card-img-wrap">' +
          '<img src="' + escapeAttr(product.image) + '" alt="' + escapeAttr(product.name || "") + '" loading="lazy" ' +
          'onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=\\\'http://www.w3.org/2000/svg\\\' viewBox=\\\'0 0 300 400\\\'%3E%3Crect fill=\\\'%23f3f0ea\\\' width=\\\'300\\\' height=\\\'400\\\'/%3E%3Ctext x=\\\'150\\\' y=\\\'210\\\' font-size=\\\'14\\\' fill=\\\'%23999\\\' text-anchor=\\\'middle\\\'%3E\u65E0\u56FE\u7247%3C/text%3E%3C/svg%3E\';">' +
          '<div class="product-card-overlay"><span>\u67E5\u770B\u8BE6\u60C5</span></div>' +
          "</div>" +
          '<div class="product-card-info">' +
          '<div class="product-card-name">' + escapeHtml(product.name || "未命名") + "</div>" +
          (product.price ? '<div class="product-card-price">' + escapeHtml(product.price) + "</div>" : "") +
          "</div>" +
          "</div>";
      });
      html += "</div>";

      // 分页
      if (totalPages > 1) {
        html += '<div class="pagination">';
        // 上一页
        html +=
          '<button class="page-btn" ' + (currentPage === 1 ? "disabled" : "") +
          ' onclick="window.location.hash=\'#/' + brand.id + "?page=" + (currentPage - 1) + "\'\">\u2190</button>";

        // 页码
        for (var p = 1; p <= totalPages; p++) {
          if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2) {
            html +=
              '<button class="page-btn ' + (p === currentPage ? "active" : "") + '" ' +
              'onclick="window.location.hash=\'#/' + brand.id + "?page=" + p + "\'\">" + p + "</button>";
          } else if (p === currentPage - 3 || p === currentPage + 3) {
            html += '<span class="page-info">...</span>';
          }
        }

        // 下一页
        html +=
          '<button class="page-btn" ' + (currentPage === totalPages ? "disabled" : "") +
          ' onclick="window.location.hash=\'#/' + brand.id + "?page=" + (currentPage + 1) + "\'\">\u2192</button>";

        // 信息
        html +=
          '<span class="page-info">第 ' + currentPage + "/" + totalPages + " 页 \u00B7 共 " + products.length + " 个产品</span>";
        html += "</div>";
      } else {
        html +=
          '<div class="pagination"><span class="page-info">共 ' + products.length + " 个产品</span></div>";
      }
    }

    app.innerHTML = html;

    // 绑定产品卡片点击 → 放大查看
    var cards = app.querySelectorAll(".product-card");
    cards.forEach(function (card) {
      card.addEventListener("click", function () {
        var idx = parseInt(this.dataset.idx, 10);
        openLightbox(brand, products[idx]);
      });
    });
  }

  // ---- 图片灯箱 ----
  function openLightbox(brand, product) {
    if (!product) return;
    lightboxImg.src = product.image;
    lightboxImg.alt = product.name || "";

    var wa = config.whatsapp || {};
    var productName = product.name || "未命名产品";
    var msg =
      "你好，我对 " +
      brand.name + " 的 " + productName +
      (product.price ? "（" + product.price + "）" : "") +
      " 感兴趣，想了解更多详情";
    var waLink = "https://wa.me/" + (wa.number || "") + "?text=" + encodeURIComponent(msg);

    lightboxInfo.innerHTML =
      '<div class="lb-name">' + escapeHtml(productName) + "</div>" +
      (product.price ? '<div class="lb-price">' + escapeHtml(product.price) + "</div>" : "") +
      '<div class="lb-wa"><a href="' + waLink + '" target="_blank" rel="noopener">' +
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>' +
      " WhatsApp 询问此产品</a></div>";

    lightbox.classList.add("show");
  }

  function closeLightbox() {
    lightbox.classList.remove("show");
    lightboxImg.src = "";
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeLightbox();
      closeWaModal();
    }
  });

  // ---- 工具函数 ----
  function getPageFromHash() {
    var hash = window.location.hash.slice(1);
    var parts = hash.split("?");
    if (parts.length > 1) {
      var params = new URLSearchParams(parts[1]);
      return parseInt(params.get("page"), 10) || 1;
    }
    return 1;
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  // ---- 启动 ----
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
