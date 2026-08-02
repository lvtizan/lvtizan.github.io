/* PRECIFORM — 样板站交互
   两块：① 产品目录多维筛选 ② RFQ 分步询盘表单（含产品型号预填、图纸上传、成功态）
   样板站不落库，提交只演示成功态；真实交付需接 CF Pages Functions 或表单服务。 */
(function () {
  "use strict";

  /* ---------- ① 产品目录筛选 ---------- */
  var rows = document.querySelectorAll("[data-row]");
  var sels = document.querySelectorAll("[data-filter]");
  var count = document.querySelector("[data-count]");
  var reset = document.querySelector("[data-reset]");

  function applyFilters() {
    var active = {};
    sels.forEach(function (s) {
      if (s.value) active[s.dataset.filter] = s.value;
    });
    var shown = 0;
    rows.forEach(function (r) {
      var ok = Object.keys(active).every(function (k) {
        return r.dataset[k] === active[k];
      });
      r.style.display = ok ? "" : "none";
      if (ok) shown++;
    });
    if (count) count.textContent = shown;
  }

  sels.forEach(function (s) { s.addEventListener("change", applyFilters); });
  if (reset) {
    reset.addEventListener("click", function () {
      sels.forEach(function (s) { s.value = ""; });
      applyFilters();
    });
  }

  /* ---------- ② 产品详情页：型号随 ?model= 变化 ----------
     样板站只演示"型号一路带过去"这条链路：目录行 → 详情页 → 询盘表单，
     客户全程不用重复描述零件。真实站这里应由后端或静态生成出独立 URL。 */
  var pageModel = new URLSearchParams(location.search).get("model");
  if (pageModel && /^[A-Za-z0-9-]{4,32}$/.test(pageModel)) {
    var mEl = document.querySelector("[data-model]");
    var mCrumb = document.querySelector("[data-model-crumb]");
    var mLink = document.querySelector("[data-quote-link]");
    if (mEl) mEl.textContent = pageModel;
    if (mCrumb) mCrumb.textContent = pageModel;
    if (mLink) mLink.href = "/work/preciform/contact/?model=" + encodeURIComponent(pageModel);
  }

  /* ---------- ③ RFQ 表单 ---------- */
  var form = document.getElementById("rfq");
  if (!form) return;

  // 从产品页跳来时预填型号：/contact/?model=PF-ST-1240
  var model = new URLSearchParams(location.search).get("model");
  var modelField = form.querySelector('[name="model"]');
  if (model && modelField) {
    modelField.value = model;
    modelField.setAttribute("data-prefilled", "1");
  }

  // 第二屏折叠（选填项默认收起，避免一屏十五个格子）
  var toggle = document.querySelector("[data-opt-toggle]");
  var optBody = document.querySelector("[data-opt-body]");
  var steps = document.querySelectorAll("[data-step]");
  if (toggle && optBody) {
    toggle.addEventListener("click", function () {
      var open = optBody.classList.toggle("open");
      toggle.textContent = open
        ? "− Hide optional details"
        : "+ Add optional details (target price, certifications, drawings)";
      if (steps[1]) steps[1].classList.toggle("on", open);
    });
  }

  // 图纸上传：只显示文件名，不上传（样板站）
  var file = form.querySelector('input[type="file"]');
  var fileHint = document.querySelector("[data-file-hint]");
  if (file && fileHint) {
    file.addEventListener("change", function () {
      fileHint.textContent = file.files.length
        ? "Selected: " + Array.from(file.files).map(function (f) { return f.name; }).join(", ")
        : "STEP, IGES, DWG, DXF or PDF · up to 25 MB";
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    form.style.display = "none";
    var ok = document.querySelector("[data-rfq-ok]");
    if (ok) {
      ok.classList.add("show");
      ok.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
})();
