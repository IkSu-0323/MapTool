/* =====================
   ✅ 折疊收納：記住開合狀態（並同步 header 高度）
===================== */
function setHeaderHeightVar(){
  const h = document.querySelector("header")?.getBoundingClientRect()?.height || 80;
  document.documentElement.style.setProperty("--header-h", Math.ceil(h) + "px");
}
function initFolds(scope = document){
  scope.querySelectorAll('details[data-fold-key]').forEach(det => {
    const key = det.getAttribute("data-fold-key");
    if (!key) return;
    const saved = localStorage.getItem("fold::" + key);
    if (saved === "1") det.open = true;
    if (saved === "0") det.open = false;
    det.addEventListener("toggle", () => {
      localStorage.setItem("fold::" + key, det.open ? "1" : "0");
      setHeaderHeightVar();
    }, { passive:true });
  });
}
initFolds();

/* =====================
   ✅ Toast
===================== */
let toastTimer = 0;
function toast(msg, ms=1800){
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> el.classList.remove("show"), ms);
}

/* =====================
   ✅ Hover 提示（點位名稱 OFF + 已勾選查詢魔靈時）
   - 顯示：魔靈名稱（大）+ 點位名稱（小）
===================== */
let hoverTipEl = null;
let hoverTipActiveMid = null;

function ensureHoverTip(){
  if (hoverTipEl) return hoverTipEl;
  const el = document.createElement("div");
  el.id = "hoverTip";
  el.className = "hover-tip";
  el.setAttribute("role", "tooltip");
  document.body.appendChild(el);
  hoverTipEl = el;
  return el;
}

function shouldShowHoverTip(){
  // ✅ 只在：點位名稱 OFF、且「查詢魔靈」已有勾選時顯示
  if (isPointLabelsEnabled()) return false;
  if (!selectedSpiritTags.size) return false;
  // 命名/註記模式時避免干擾
  if (namingMode || annotateMode) return false;
  return true;
}

function getMarkerSpiritNames(mk){
  const tags = (mk?.spiritTags || []).map(normalizeSpiritTag).filter(Boolean);
  if (!tags.length) return "（未註記魔靈）";

  // 優先顯示「符合目前查詢」的魔靈；若沒有則顯示全部
  const matched = tags.filter(t => selectedSpiritTags.has(t));
  const use = matched.length ? matched : tags;

  const names = use.map(t => displayNameFromTag(t)).filter(Boolean);
  const uniq = Array.from(new Set(names));
  return uniq.length ? uniq.join("、") : "（未註記魔靈）";
}

function setHoverTipContent(mk, idx){
  const el = ensureHoverTip();
  const spiritName = getMarkerSpiritNames(mk);
  const pn = ((mk?.pointName || "").trim() || "（未命名點位）");
  const pointLine = `#${idx}　${escapeHtml(pn)}`;
  el.innerHTML = `
    <div class="ht-spirit">${escapeHtml(spiritName)}</div>
    <div class="ht-point">${pointLine}</div>
  `;
}

function positionHoverTip(clientX, clientY){
  const el = ensureHoverTip();
  const pad = 12;
  const ox = 14, oy = 16;
  const vw = window.innerWidth || 0;
  const vh = window.innerHeight || 0;

  // 先放到預估位置，再量尺寸做 clamp
  el.style.left = (clientX + ox) + "px";
  el.style.top  = (clientY + oy) + "px";

  const r = el.getBoundingClientRect();
  let x = clientX + ox;
  let y = clientY + oy;
  if (x + r.width + pad > vw) x = Math.max(pad, vw - r.width - pad);
  if (y + r.height + pad > vh) y = Math.max(pad, vh - r.height - pad);
  el.style.left = x + "px";
  el.style.top  = y + "px";
}

function showHoverTip(mk, idx, e){
  if (!shouldShowHoverTip()) return;
  setHoverTipContent(mk, idx);
  positionHoverTip(e.clientX, e.clientY);
  ensureHoverTip().classList.add("show");
}

function hideHoverTip(){
  hoverTipActiveMid = null;
  if (hoverTipEl) hoverTipEl.classList.remove("show");
}

/* =====================
   安全限制
===================== */
const IMPORT_MAX_BYTES = 3 * 1024 * 1024;
const IMPORT_MAX_MARKERS = 5000;
/* =====================
   ✅ 內建預設檔（首次開啟自動套用）
   - 來源：mapTaskTool_export_2026-01-18_1319.json
   - 說明：若使用者沒有任何本機資料（localStorage），會以此檔作為初始資料與預設參數
===================== */
const BUILTIN_PRESET = {
  "data": {
    "maps": [
      {
        "id": "344b3c30-3276-4c7a-8355-1ea4c1b073a5",
        "name": "淨界島",
        "src": "maps/map1.png",
        "needsMapUpload": false
      },
      {
        "id": "a969263e-d36e-489f-9822-6b599764b528",
        "name": "冰湖城東區",
        "src": "maps/map2.png",
        "needsMapUpload": false
      },
      {
        "id": "34ee4dbf-d94e-4354-9f5d-58da55c5f32e",
        "name": "冰湖城下水道",
        "src": "maps/map3.png",
        "needsMapUpload": false
      },
      {
        "id": "f33f7732-44e1-41d5-8cf7-a0187aaaf517",
        "name": "格雷姆廢礦",
        "src": "maps/map4.png",
        "needsMapUpload": false
      },
      {
        "id": "0d18af9d-f63b-4f36-affd-bea62c0e24fa",
        "name": "龍莎要塞",
        "src": "maps/map5.png",
        "needsMapUpload": false
      },
      {
        "id": "e71d453e-d022-4f62-a043-205cedd5687a",
        "name": "煙津渡",
        "src": "maps/map6.png",
        "needsMapUpload": false
      }
    ],
    "markers": [
      {
        "id": "nas5qge6-mjn8c1mu",
        "mapId": "344b3c30-3276-4c7a-8355-1ea4c1b073a5",
        "x": 0.2664430775085697,
        "y": 0.654009313719198,
        "state": 0,
        "createdAt": 1766775195462,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9111"
      },
      {
        "id": "6cvibkti-mjn8c3cx",
        "mapId": "344b3c30-3276-4c7a-8355-1ea4c1b073a5",
        "x": 0.3483418382844816,
        "y": 0.6835309600453988,
        "state": 0,
        "createdAt": 1766775197697,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9111"
      },
      {
        "id": "6c0bm70x-mjn8c5eg",
        "mapId": "344b3c30-3276-4c7a-8355-1ea4c1b073a5",
        "x": 0.4597622453865942,
        "y": 0.6892448270762764,
        "state": 0,
        "createdAt": 1766775200344,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9112"
      },
      {
        "id": "vb5vzb8q-mjn8c7as",
        "mapId": "344b3c30-3276-4c7a-8355-1ea4c1b073a5",
        "x": 0.41622801208593735,
        "y": 0.8403902809162554,
        "state": 0,
        "createdAt": 1766775202804,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9112"
      },
      {
        "id": "oh08v66x-mjn8cbx8",
        "mapId": "344b3c30-3276-4c7a-8355-1ea4c1b073a5",
        "x": 0.15645744834632566,
        "y": 0.5491190735806376,
        "state": 0,
        "createdAt": 1766775208796,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9111"
      },
      {
        "id": "n6g9wp5e-mjn8cf0x",
        "mapId": "344b3c30-3276-4c7a-8355-1ea4c1b073a5",
        "x": 0.18407447232890056,
        "y": 0.3062797392994561,
        "state": 0,
        "createdAt": 1766775212817,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9122"
      },
      {
        "id": "82riuxjy-mjn8cgji",
        "mapId": "344b3c30-3276-4c7a-8355-1ea4c1b073a5",
        "x": 0.33045831218535376,
        "y": 0.2756697415000735,
        "state": 0,
        "createdAt": 1766775214782,
        "spiritTags": [
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9121"
      },
      {
        "id": "ai1ydpg9-mjn8cikn",
        "mapId": "344b3c30-3276-4c7a-8355-1ea4c1b073a5",
        "x": 0.3523614691370511,
        "y": 0.35090232407329486,
        "state": 0,
        "createdAt": 1766775217415,
        "spiritTags": [
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9121"
      },
      {
        "id": "wmtnsmlg-mjn8ck7l",
        "mapId": "344b3c30-3276-4c7a-8355-1ea4c1b073a5",
        "x": 0.3885492936659424,
        "y": 0.4727981540653497,
        "state": 0,
        "createdAt": 1766775219537,
        "spiritTags": [
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9121"
      },
      {
        "id": "7fi8qmo3-mjn8cnpn",
        "mapId": "344b3c30-3276-4c7a-8355-1ea4c1b073a5",
        "x": 0.6590789360572392,
        "y": 0.4043677899961878,
        "state": 0,
        "createdAt": 1766775224075,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9131"
      },
      {
        "id": "nh34zefr-mjn8crch",
        "mapId": "344b3c30-3276-4c7a-8355-1ea4c1b073a5",
        "x": 0.6110552275002555,
        "y": 0.09868324517911471,
        "state": 0,
        "createdAt": 1766775228785,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9131"
      },
      {
        "id": "nzs9ezhq-mjn8d2ci",
        "mapId": "344b3c30-3276-4c7a-8355-1ea4c1b073a5",
        "x": 0.8695397050278965,
        "y": 0.24479494630836893,
        "state": 0,
        "createdAt": 1766775243042,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9131"
      },
      {
        "id": "4azgzzn0-mjo8yusv",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.19910944928057142,
        "y": 0.8093665069959225,
        "state": 0,
        "createdAt": 1766836725871,
        "spiritTags": [
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9231"
      },
      {
        "id": "f27k4yvk-mjo8ywtl",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.20506742491772476,
        "y": 0.8699143238375581,
        "state": 0,
        "createdAt": 1766836728489,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9232"
      },
      {
        "id": "usonqehn-mjo8yyeg",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.20722716960838528,
        "y": 0.9268129179887316,
        "state": 0,
        "createdAt": 1766836730536,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9232"
      },
      {
        "id": "zdhs5rvk-mjo8z09r",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.12753938069209983,
        "y": 0.8175587155422649,
        "state": 0,
        "createdAt": 1766836732959,
        "spiritTags": [
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9231"
      },
      {
        "id": "bi6klaq8-mjo90att",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.0962599926875578,
        "y": 0.7190521591408168,
        "state": 0,
        "createdAt": 1766836793297,
        "spiritTags": [
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9231"
      },
      {
        "id": "wvn2bpr5-mjo90cf4",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.14876457741990778,
        "y": 0.6892623445929985,
        "state": 0,
        "createdAt": 1766836795360,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9232"
      },
      {
        "id": "r625jw1r-mjo90e0l",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.12947566072717503,
        "y": 0.6348959044061534,
        "state": 0,
        "createdAt": 1766836797429,
        "spiritTags": [
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9231"
      },
      {
        "id": "sfp1qq4l-mjo90frx",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.20395022891569484,
        "y": 0.5937859170563593,
        "state": 0,
        "createdAt": 1766836799709,
        "spiritTags": [
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9231"
      },
      {
        "id": "zzhw982p-mjo90gcu",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.19717304196959956,
        "y": 0.5593786602531062,
        "state": 0,
        "createdAt": 1766836800462,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9232"
      },
      {
        "id": "xvr0wc3r-mjo90rqk",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.42193737537380005,
        "y": 0.8608582112528389,
        "state": 0,
        "createdAt": 1766836815212,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9211"
      },
      {
        "id": "t6ko7d7k-mjo90scu",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.46416446326870153,
        "y": 0.8473038373606482,
        "state": 0,
        "createdAt": 1766836816014,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9213"
      },
      {
        "id": "g9kdec9h-mjo90va9",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.40421239308042284,
        "y": 0.776627468299647,
        "state": 0,
        "createdAt": 1766836819809,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9211"
      },
      {
        "id": "j8l9mco3-mjo90y21",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.44338603675719335,
        "y": 0.7560724905342371,
        "state": 0,
        "createdAt": 1766836823401,
        "spiritTags": [
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9212"
      },
      {
        "id": "p8tb3gup-mjo90zjd",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.47742091610575255,
        "y": 0.7754358636265242,
        "state": 0,
        "createdAt": 1766836825321,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9213"
      },
      {
        "id": "9d8fx808-mjo91dm9",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.6690439424129676,
        "y": 0.8203440421490932,
        "state": 0,
        "createdAt": 1766836843569,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9214"
      },
      {
        "id": "tqnmw3w4-mjo91o4g",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.6550426710285806,
        "y": 0.755997994360965,
        "state": 0,
        "createdAt": 1766836857184,
        "spiritTags": [
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9212"
      },
      {
        "id": "f5i3klof-mjo91sib",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.6076023624059135,
        "y": 0.7445289087598806,
        "state": 0,
        "createdAt": 1766836862867,
        "spiritTags": [
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9212"
      },
      {
        "id": "z5rvo528-mjo91ymq",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.5755782831299321,
        "y": 0.576067391034523,
        "state": 0,
        "createdAt": 1766836870802,
        "spiritTags": [
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9212"
      },
      {
        "id": "sfbavmzr-mjo924qq",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.5650788327788913,
        "y": 0.5337350630855248,
        "state": 0,
        "createdAt": 1766836878722,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9223"
      },
      {
        "id": "hs4bjjgz-mjo928xz",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.4858518128113096,
        "y": 0.49619531983803944,
        "state": 0,
        "createdAt": 1766836884167,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9221"
      },
      {
        "id": "poshzvkc-mjo92kpq",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.5325828855794035,
        "y": 0.4322330330803113,
        "state": 0,
        "createdAt": 1766836899422,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9221"
      },
      {
        "id": "rf73tnk4-mjo92osf",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.5108257068212642,
        "y": 0.3435791745102476,
        "state": 0,
        "createdAt": 1766836904703,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9221"
      },
      {
        "id": "y8h4um87-mjo932nd",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.6304481775691467,
        "y": 0.3317842017578728,
        "state": 0,
        "createdAt": 1766836922665,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9223"
      },
      {
        "id": "czz1qg2r-mjo938fx",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.6904844577095381,
        "y": 0.32166382809736993,
        "state": 0,
        "createdAt": 1766836930173,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9223"
      },
      {
        "id": "xxoi8lw7-mjo93bc3",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.8294256584497769,
        "y": 0.28058180539285305,
        "state": 0,
        "createdAt": 1766836933923,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9223"
      },
      {
        "id": "4edgfsrc-mjo93hgx",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.6889406405327732,
        "y": 0.1835802628517122,
        "state": 0,
        "createdAt": 1766836941873,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9221"
      },
      {
        "id": "d27iuvj0-mjo93ktc",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.7615845838409911,
        "y": 0.11258417119956399,
        "state": 0,
        "createdAt": 1766836946208,
        "spiritTags": [
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9222"
      },
      {
        "id": "9rrqsqw4-mjo93n6x",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.9051466135971443,
        "y": 0.13900015058437057,
        "state": 0,
        "createdAt": 1766836949289,
        "spiritTags": [
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9222"
      },
      {
        "id": "xdc47vwn-mjo93v6h",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.11344391296711769,
        "y": 0.4055091701641313,
        "state": 0,
        "createdAt": 1766836959641,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9225"
      },
      {
        "id": "edvmcx1h-mjo93xkb",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.32130996725804034,
        "y": 0.3618820182312469,
        "state": 0,
        "createdAt": 1766836962731,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9225"
      },
      {
        "id": "ny0q2clh-mjo940af",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.2731851813614934,
        "y": 0.4911892989399508,
        "state": 0,
        "createdAt": 1766836966263,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9225"
      },
      {
        "id": "vpiww1ly-mjo949wc",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.3503197927956843,
        "y": 0.28467248039278076,
        "state": 0,
        "createdAt": 1766836978716,
        "spiritTags": [
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9224"
      },
      {
        "id": "k6rum2qp-mjo94er9",
        "mapId": "a969263e-d36e-489f-9822-6b599764b528",
        "x": 0.22670960905253065,
        "y": 0.15611976413661371,
        "state": 0,
        "createdAt": 1766836985013,
        "spiritTags": [
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9224"
      },
      {
        "id": "f260777a63ca4819b659fc78b",
        "mapId": "34ee4dbf-d94e-4354-9f5d-58da55c5f32e",
        "x": 0.9066511119003109,
        "y": 0.7505946547960082,
        "state": 0,
        "createdAt": 1766936528779,
        "spiritTags": [
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9281"
      },
      {
        "id": "9f0af422e21e6819b659fd1e8",
        "mapId": "34ee4dbf-d94e-4354-9f5d-58da55c5f32e",
        "x": 0.6957588253190845,
        "y": 0.7927941990703542,
        "state": 0,
        "createdAt": 1766936531432,
        "spiritTags": [
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9281"
      },
      {
        "id": "9392e71bc5dff19b659ff91c",
        "mapId": "34ee4dbf-d94e-4354-9f5d-58da55c5f32e",
        "x": 0.8468772066640683,
        "y": 0.5068688504135571,
        "state": 0,
        "createdAt": 1766936541468,
        "spiritTags": [
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "92101"
      },
      {
        "id": "3e85cc58dba3919b65a00436",
        "mapId": "34ee4dbf-d94e-4354-9f5d-58da55c5f32e",
        "x": 0.658715829127179,
        "y": 0.47056243650541774,
        "state": 0,
        "createdAt": 1766936544310,
        "spiritTags": [
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "92101"
      },
      {
        "id": "72630bbee8ecf19b65a0168d",
        "mapId": "34ee4dbf-d94e-4354-9f5d-58da55c5f32e",
        "x": 0.6029410047966862,
        "y": 0.5626436747440499,
        "state": 0,
        "createdAt": 1766936549005,
        "spiritTags": [
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9281"
      },
      {
        "id": "d192053ae9c9619b65a03e5f",
        "mapId": "34ee4dbf-d94e-4354-9f5d-58da55c5f32e",
        "x": 0.560530950633581,
        "y": 0.3937403775868794,
        "state": 0,
        "createdAt": 1766936559199,
        "spiritTags": [
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9291"
      },
      {
        "id": "28171f17cc80b819b65a04765",
        "mapId": "34ee4dbf-d94e-4354-9f5d-58da55c5f32e",
        "x": 0.4837089141958083,
        "y": 0.37143046583929473,
        "state": 0,
        "createdAt": 1766936561509,
        "spiritTags": [
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9291"
      },
      {
        "id": "be55d88fa17cd19b65a06924",
        "mapId": "34ee4dbf-d94e-4354-9f5d-58da55c5f32e",
        "x": 0.3278912233760867,
        "y": 0.3657767269552434,
        "state": 0,
        "createdAt": 1766936570148,
        "spiritTags": [
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9291"
      },
      {
        "id": "98a5ec1dcec1119b65a07679",
        "mapId": "34ee4dbf-d94e-4354-9f5d-58da55c5f32e",
        "x": 0.27885328869110093,
        "y": 0.46205209877871534,
        "state": 0,
        "createdAt": 1766936573561,
        "spiritTags": [
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9292"
      },
      {
        "id": "fb0337bbe620e819b65a087fd",
        "mapId": "34ee4dbf-d94e-4354-9f5d-58da55c5f32e",
        "x": 0.17908276418738858,
        "y": 0.563940874322896,
        "state": 0,
        "createdAt": 1766936578045,
        "spiritTags": [
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9281"
      },
      {
        "id": "3016aea76089d819b65a09a2f",
        "mapId": "34ee4dbf-d94e-4354-9f5d-58da55c5f32e",
        "x": 0.3690916156359982,
        "y": 0.1721668125369269,
        "state": 0,
        "createdAt": 1766936582703,
        "spiritTags": [
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9292"
      },
      {
        "id": "6e53db4a8c4fa19b65a1b945",
        "mapId": "34ee4dbf-d94e-4354-9f5d-58da55c5f32e",
        "x": 0.4892723736870034,
        "y": 0.75670335793685,
        "state": 0,
        "createdAt": 1766936656197,
        "spiritTags": [
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9282"
      },
      {
        "id": "842a37b4dedac19b65a2371b",
        "mapId": "34ee4dbf-d94e-4354-9f5d-58da55c5f32e",
        "x": 0.4030550829197322,
        "y": 0.48506471303752985,
        "state": 0,
        "createdAt": 1766936688411,
        "spiritTags": [
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9282"
      },
      {
        "id": "364de313903b219b65a5229f",
        "mapId": "f33f7732-44e1-41d5-8cf7-a0187aaaf517",
        "x": 0.3152118446147552,
        "y": 0.8177427436534659,
        "state": 0,
        "createdAt": 1766936879775,
        "spiritTags": [
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404"
        ],
        "pointName": "9341"
      },
      {
        "id": "e8a580badd06219b65a52e8d",
        "mapId": "f33f7732-44e1-41d5-8cf7-a0187aaaf517",
        "x": 0.3103499249915024,
        "y": 0.4787619820380506,
        "state": 0,
        "createdAt": 1766936882829,
        "spiritTags": [
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404"
        ],
        "pointName": "9341"
      },
      {
        "id": "0ab2dba8b5ae9819b65a53d7a",
        "mapId": "f33f7732-44e1-41d5-8cf7-a0187aaaf517",
        "x": 0.4756740665813789,
        "y": 0.7131815122505148,
        "state": 0,
        "createdAt": 1766936886650,
        "spiritTags": [
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404"
        ],
        "pointName": "9351"
      },
      {
        "id": "108523e52413f819b65a54674",
        "mapId": "f33f7732-44e1-41d5-8cf7-a0187aaaf517",
        "x": 0.5381439034622334,
        "y": 0.577041482566166,
        "state": 0,
        "createdAt": 1766936888948,
        "spiritTags": [
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404"
        ],
        "pointName": "9351"
      },
      {
        "id": "9cda5b0ddb5cb819b65a5601f",
        "mapId": "f33f7732-44e1-41d5-8cf7-a0187aaaf517",
        "x": 0.7343784245177947,
        "y": 0.6653005111232436,
        "state": 0,
        "createdAt": 1766936895519,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9361"
      },
      {
        "id": "968eea35a3a9a819b65a57e80",
        "mapId": "f33f7732-44e1-41d5-8cf7-a0187aaaf517",
        "x": 0.8280209534794388,
        "y": 0.6228833722851508,
        "state": 0,
        "createdAt": 1766936903296,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9361"
      },
      {
        "id": "07d69e1b04545819b65a58aa2",
        "mapId": "f33f7732-44e1-41d5-8cf7-a0187aaaf517",
        "x": 0.8057936600954357,
        "y": 0.5195174543680533,
        "state": 0,
        "createdAt": 1766936906402,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9361"
      },
      {
        "id": "2475316a5a1bd19b65a5a1fc",
        "mapId": "f33f7732-44e1-41d5-8cf7-a0187aaaf517",
        "x": 0.7626040152985241,
        "y": 0.33838615913633696,
        "state": 0,
        "createdAt": 1766936912380,
        "spiritTags": [
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3"
        ],
        "pointName": "9371"
      },
      {
        "id": "b08b552651d71819b65a5b470",
        "mapId": "f33f7732-44e1-41d5-8cf7-a0187aaaf517",
        "x": 0.9193395929909098,
        "y": 0.26453607717339944,
        "state": 0,
        "createdAt": 1766936917104,
        "spiritTags": [
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3"
        ],
        "pointName": "9371"
      },
      {
        "id": "1dab2512aa161819b65a5c327",
        "mapId": "f33f7732-44e1-41d5-8cf7-a0187aaaf517",
        "x": 0.9115088221367101,
        "y": 0.1228597583370086,
        "state": 0,
        "createdAt": 1766936920871,
        "spiritTags": [
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3"
        ],
        "pointName": "9371"
      },
      {
        "id": "9cac4a6318d9819b65a7735d",
        "mapId": "0d18af9d-f63b-4f36-affd-bea62c0e24fa",
        "x": 0.8487151632990195,
        "y": 0.2611668200088666,
        "state": 0,
        "createdAt": 1766937031517,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9311"
      },
      {
        "id": "8af03417ee37819b65a779df",
        "mapId": "0d18af9d-f63b-4f36-affd-bea62c0e24fa",
        "x": 0.8065835718055356,
        "y": 0.32645758188417806,
        "state": 0,
        "createdAt": 1766937033183,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9311"
      },
      {
        "id": "642c1ae4e0df3819b65a78c02",
        "mapId": "0d18af9d-f63b-4f36-affd-bea62c0e24fa",
        "x": 0.690310954103454,
        "y": 0.19375631663950024,
        "state": 0,
        "createdAt": 1766937037826,
        "spiritTags": [
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404"
        ],
        "pointName": "9312"
      },
      {
        "id": "d8a965283cac219b65a7e3b1",
        "mapId": "0d18af9d-f63b-4f36-affd-bea62c0e24fa",
        "x": 0.45813670006535256,
        "y": 0.19916182839806068,
        "state": 0,
        "createdAt": 1766937060273,
        "spiritTags": [
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404"
        ],
        "pointName": "9312"
      },
      {
        "id": "99ffdcd39b9cb19b65a833d2",
        "mapId": "0d18af9d-f63b-4f36-affd-bea62c0e24fa",
        "x": 0.41923783944853826,
        "y": 0.40271838355015266,
        "state": 0,
        "createdAt": 1766937080786,
        "spiritTags": [
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404"
        ],
        "pointName": "9312"
      },
      {
        "id": "c15927001f7ce819b65a8405d",
        "mapId": "0d18af9d-f63b-4f36-affd-bea62c0e24fa",
        "x": 0.31563120869942324,
        "y": 0.42635453482596297,
        "state": 0,
        "createdAt": 1766937083997,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9322"
      },
      {
        "id": "f0956f506771c19b65a85c94",
        "mapId": "0d18af9d-f63b-4f36-affd-bea62c0e24fa",
        "x": 0.13851949230369862,
        "y": 0.6149133341724237,
        "state": 0,
        "createdAt": 1766937091220,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9322"
      },
      {
        "id": "8478596b6813c19b65a87be4",
        "mapId": "0d18af9d-f63b-4f36-affd-bea62c0e24fa",
        "x": 0.13752717633951927,
        "y": 0.7149710110301235,
        "state": 0,
        "createdAt": 1766937099236,
        "spiritTags": [
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404"
        ],
        "pointName": "9321"
      },
      {
        "id": "c619ed65e9c2119b65a882b9",
        "mapId": "0d18af9d-f63b-4f36-affd-bea62c0e24fa",
        "x": 0.1732473800237605,
        "y": 0.7480311593895792,
        "state": 0,
        "createdAt": 1766937100985,
        "spiritTags": [
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404"
        ],
        "pointName": "9321"
      },
      {
        "id": "9e4dc3b858ad6819b65a88e52",
        "mapId": "0d18af9d-f63b-4f36-affd-bea62c0e24fa",
        "x": 0.2604578602608192,
        "y": 0.7110759662586552,
        "state": 0,
        "createdAt": 1766937103954,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9322"
      },
      {
        "id": "d0db79111ef7819b65a897df",
        "mapId": "0d18af9d-f63b-4f36-affd-bea62c0e24fa",
        "x": 0.3939336054997399,
        "y": 0.7705462870200179,
        "state": 0,
        "createdAt": 1766937106399,
        "spiritTags": [
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404"
        ],
        "pointName": "9321"
      },
      {
        "id": "88fda933e6cb919b70739ee0",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.20468767507834806,
        "y": 0.5062807722887499,
        "state": 0,
        "createdAt": 1767118184160,
        "spiritTags": [
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404"
        ],
        "pointName": "9481"
      },
      {
        "id": "3e586f4a27cad819b7073a939",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.24312251208579336,
        "y": 0.4794227117703646,
        "state": 0,
        "createdAt": 1767118186809,
        "spiritTags": [
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404"
        ],
        "pointName": "9481"
      },
      {
        "id": "1081594c4988d19b7073b2a8",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.28813294246970744,
        "y": 0.5376306444017969,
        "state": 0,
        "createdAt": 1767118189224,
        "spiritTags": [
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404"
        ],
        "pointName": "9481"
      },
      {
        "id": "5414b0f59b23319b7073c6e5",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.3725969528969258,
        "y": 0.47946900748045373,
        "state": 0,
        "createdAt": 1767118194405,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9471"
      },
      {
        "id": "8751318789f4c19b7073da1e",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.40473402024966587,
        "y": 0.5062344765786608,
        "state": 0,
        "createdAt": 1767118199326,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9472"
      },
      {
        "id": "6887597785630819b7073e5e4",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.4285821275860719,
        "y": 0.5097538012785696,
        "state": 0,
        "createdAt": 1767118202340,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9472"
      },
      {
        "id": "2fe13f806e4119b707401d0",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.44474326752098886,
        "y": 0.519431978826179,
        "state": 0,
        "createdAt": 1767118209488,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9472"
      },
      {
        "id": "7d3ca074b5ca719b7074235e",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.4465492453655239,
        "y": 0.5460585212251358,
        "state": 0,
        "createdAt": 1767118218078,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9471"
      },
      {
        "id": "63a94662e9e1c819b70742a73",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.46243255168643155,
        "y": 0.5467068194423156,
        "state": 0,
        "createdAt": 1767118219891,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9472"
      },
      {
        "id": "bcd005448bd819b70744792",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.4572461659489922,
        "y": 0.5693972570436122,
        "state": 0,
        "createdAt": 1767118227346,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9471"
      },
      {
        "id": "1a6a5d8a26e27819b7074740c",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.425618460221936,
        "y": 0.4393208434021262,
        "state": 0,
        "createdAt": 1767118238732,
        "spiritTags": [
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9491"
      },
      {
        "id": "8d5a7857c0e7819b70748180",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.43497247876870965,
        "y": 0.3768526964334268,
        "state": 0,
        "createdAt": 1767118242176,
        "spiritTags": [
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9491"
      },
      {
        "id": "8f70ba3081a8a819b70749312",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.4430762064834584,
        "y": 0.34439147997209674,
        "state": 0,
        "createdAt": 1767118246674,
        "spiritTags": [
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9491"
      },
      {
        "id": "fc3fe7fc2a495819b7074b0fe",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.4013072770776896,
        "y": 0.30762370400218186,
        "state": 0,
        "createdAt": 1767118254334,
        "spiritTags": [
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9491"
      },
      {
        "id": "d9a8fd55cf3219b7074d48d",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.5177694083739062,
        "y": 0.4466373659849361,
        "state": 0,
        "createdAt": 1767118263437,
        "spiritTags": [
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404"
        ],
        "pointName": "9461"
      },
      {
        "id": "8da47f5066ee0819b7074e0c5",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.5300407688979895,
        "y": 0.5034560711928474,
        "state": 0,
        "createdAt": 1767118266565,
        "spiritTags": [
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404"
        ],
        "pointName": "9461"
      },
      {
        "id": "a10081ea1853919b7074e917",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.5711151043764893,
        "y": 0.4802099465790407,
        "state": 0,
        "createdAt": 1767118268695,
        "spiritTags": [
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404"
        ],
        "pointName": "9461"
      },
      {
        "id": "3c0f162157fdc19b7074f8ad",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.5895916035661164,
        "y": 0.44163620265683645,
        "state": 0,
        "createdAt": 1767118272685,
        "spiritTags": [
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404",
          "2762d8a6-9788-46a7-8bb0-060e825c9404"
        ],
        "pointName": "9461"
      },
      {
        "id": "41fb2f85de088819b70768097",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.5676884403424789,
        "y": 0.5582835662546383,
        "state": 0,
        "createdAt": 1767118373015,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9421"
      },
      {
        "id": "c4f400742859a819b70768520",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.5793578082517172,
        "y": 0.5683321886209268,
        "state": 0,
        "createdAt": 1767118374176,
        "spiritTags": [
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9431"
      },
      {
        "id": "862f54064072819b70768a48",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.6146900610880218,
        "y": 0.586484538701964,
        "state": 0,
        "createdAt": 1767118375496,
        "spiritTags": [
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9431"
      },
      {
        "id": "9cfac5bc436119b70777e4e",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.5436550611355047,
        "y": 0.6264011945531087,
        "state": 0,
        "createdAt": 1767118437966,
        "spiritTags": [
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "c4d954c4-9652-47f5-984b-85bcdcb633ab",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
          "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2"
        ],
        "pointName": "9431"
      },
      {
        "id": "2500b07faa59119b7077f2c2",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.6819278334809007,
        "y": 0.6236227792750496,
        "state": 0,
        "createdAt": 1767118467778,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9421"
      },
      {
        "id": "d74e6edd688fd19b707808df",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.6722033800076936,
        "y": 0.6795153625440173,
        "state": 0,
        "createdAt": 1767118473439,
        "spiritTags": [
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9412"
      },
      {
        "id": "7eadad19c615519b707817e7",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.69836684659881,
        "y": 0.6796542892432678,
        "state": 0,
        "createdAt": 1767118477287,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9411"
      },
      {
        "id": "157ca5793e64a19b707825da",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.7302723859398755,
        "y": 0.6622891442941693,
        "state": 0,
        "createdAt": 1767118480858,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9411"
      },
      {
        "id": "20d7b2960d1e319b7078370d",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.7634282062207204,
        "y": 0.6874801635595157,
        "state": 0,
        "createdAt": 1767118485261,
        "spiritTags": [
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9413"
      },
      {
        "id": "71e84a88868f719b707847a8",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.7651878586784291,
        "y": 0.6201960657798106,
        "state": 0,
        "createdAt": 1767118489512,
        "spiritTags": [
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9413"
      },
      {
        "id": "449bf62b484d6819b70785de7",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.8183019969926004,
        "y": 0.5935232276707647,
        "state": 0,
        "createdAt": 1767118495207,
        "spiritTags": [
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9412"
      },
      {
        "id": "b3167b0ccbba0819b70787035",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.7637986510393995,
        "y": 0.537399136174614,
        "state": 0,
        "createdAt": 1767118499893,
        "spiritTags": [
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9412"
      },
      {
        "id": "4eeeb172c68f7819b70787db0",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.7291146964202747,
        "y": 0.506234506255398,
        "state": 0,
        "createdAt": 1767118503344,
        "spiritTags": [
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "o04i3un8-mjn7zql9",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12",
          "dh7x434y-mjn7zw12"
        ],
        "pointName": "9421"
      },
      {
        "id": "c3fd1c7c0b51d819b70788eed",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.6512262892617708,
        "y": 0.4888230557039647,
        "state": 0,
        "createdAt": 1767118507757,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9441"
      },
      {
        "id": "c0968a9b0ac25819b70789698",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.6729442795372975,
        "y": 0.46775336364561787,
        "state": 0,
        "createdAt": 1767118509720,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9441"
      },
      {
        "id": "a6c9d74b4480519b70789e8f",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.7018398656963839,
        "y": 0.44853595503414095,
        "state": 0,
        "createdAt": 1767118511759,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9441"
      },
      {
        "id": "321640a8925cf819b7078a6f0",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.695588421428505,
        "y": 0.4261696665414343,
        "state": 0,
        "createdAt": 1767118513904,
        "spiritTags": [
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368",
          "d8b3a81f-f71c-4678-a047-4b3165fbe368"
        ],
        "pointName": "9441"
      },
      {
        "id": "62009bedbe8cd819b7078bf52",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.6744724237678233,
        "y": 0.4050999744830875,
        "state": 0,
        "createdAt": 1767118520146,
        "spiritTags": [
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9452"
      },
      {
        "id": "96e11d8defddb19b7078d04f",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.5973712415257498,
        "y": 0.38162231196536056,
        "state": 0,
        "createdAt": 1767118524495,
        "spiritTags": [
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9452"
      },
      {
        "id": "cf49fa77500c819b7078e088",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.6242756175387157,
        "y": 0.37773252266228113,
        "state": 0,
        "createdAt": 1767118528648,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9451"
      },
      {
        "id": "9de31b8897a12819b7079056c",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.6290915386729843,
        "y": 0.32998999249488853,
        "state": 0,
        "createdAt": 1767118538092,
        "spiritTags": [
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "a93e8f6c-1834-4098-a440-e79b104ce736",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
          "391ca201-74f0-4bb6-89bb-fefdee4e9fc2"
        ],
        "pointName": "9452"
      },
      {
        "id": "aa6bce979ef71819b707926ad",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.6056601916498381,
        "y": 0.3312402833269134,
        "state": 0,
        "createdAt": 1767118546605,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9451"
      },
      {
        "id": "b79292c37dd26819b707930f5",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.6280264801425447,
        "y": 0.310124275773986,
        "state": 0,
        "createdAt": 1767118549237,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9451"
      },
      {
        "id": "9bc2b30c77c3119b707986e9",
        "mapId": "e71d453e-d022-4f62-a043-205cedd5687a",
        "x": 0.7293005442175199,
        "y": 0.7859233565015318,
        "state": 0,
        "createdAt": 1767118571241,
        "spiritTags": [
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "20641479-f8c8-4489-aea9-e6e7fec25275",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
          "4aad0e37-ff3d-4090-8d9d-0881bef913c7"
        ],
        "pointName": "9411"
      }
    ],
    "spirits": [
      {
        "id": "3b38effe-e794-4f30-a3e5-bb2af8e45e56",
        "name": "好夢先生"
      },
      {
        "id": "a93e8f6c-1834-4098-a440-e79b104ce736",
        "name": "球球蜂"
      },
      {
        "id": "391ca201-74f0-4bb6-89bb-fefdee4e9fc2",
        "name": "閃靈鈴"
      },
      {
        "id": "44ec6eda-b89e-41ec-8bc1-20ba8bc0da2e",
        "name": "珍珠兔"
      },
      {
        "id": "c4d954c4-9652-47f5-984b-85bcdcb633ab",
        "name": "浮魷燈"
      },
      {
        "id": "ee78a4f7-a7d5-4dcf-b9d6-4a0c2061e1d2",
        "name": "紫紗黑雲"
      },
      {
        "id": "8c4a3c4f-7462-40e2-a6ad-652d57376b07",
        "name": "搖搖火尾"
      },
      {
        "id": "d8b3a81f-f71c-4678-a047-4b3165fbe368",
        "name": "打火雞"
      },
      {
        "id": "efd9c272-de8e-4d3f-877c-9d5e20c2e434",
        "name": "你好箱"
      },
      {
        "id": "ef8e090e-814d-4621-8aa0-ffc1fbb5a8a3",
        "name": "劈啪貓車"
      },
      {
        "id": "2762d8a6-9788-46a7-8bb0-060e825c9404",
        "name": "炸毛球"
      },
      {
        "id": "20641479-f8c8-4489-aea9-e6e7fec25275",
        "name": "糖霜白兔"
      },
      {
        "id": "4aad0e37-ff3d-4090-8d9d-0881bef913c7",
        "name": "雨衣水滴"
      },
      {
        "id": "o04i3un8-mjn7zql9",
        "name": "綿綿草"
      },
      {
        "id": "dh7x434y-mjn7zw12",
        "name": "搖曳菇"
      }
    ],
    "currentMapId": "344b3c30-3276-4c7a-8355-1ea4c1b073a5"
  },
  "ui": {
    "showPointLabels": false,
    "pointLabelMode": "all",
    "customEnabled": false,
    "focusMode": false,
    "leftDockCollapsed": false,
    "rightDockCollapsed": false
  }
};
function deepClone(o){ return JSON.parse(JSON.stringify(o)); }


/* =====================
   ✅ 點位名稱顯示
===================== */
const LABEL_TOGGLE_KEY = "mapTaskTool_showPointLabels_v1";
const _sp = localStorage.getItem(LABEL_TOGGLE_KEY);
let showPointLabels = (_sp === null ? !!BUILTIN_PRESET.ui.showPointLabels : (_sp !== "0"));

// ✅ 點位名稱只在「自定義 ON」下允許顯示（使用者仍可保留偏好設定）
function isPointLabelsEnabled(){
  return !!customEnabled && !!showPointLabels;
}

const LABEL_MODE_KEY = "mapTaskTool_pointLabelMode_v1";
const _lm = localStorage.getItem(LABEL_MODE_KEY);
let pointLabelMode = (_lm === null ? (BUILTIN_PRESET.ui.pointLabelMode || "all") : _lm);
if (!["matched","all"].includes(pointLabelMode)) pointLabelMode = "all";

/* =====================
   自定義模式
===================== */
const CUSTOM_SESSION_KEY = "mapTaskTool_customEnabled_v1";
const _ce = localStorage.getItem(CUSTOM_SESSION_KEY);
let customEnabled = (_ce === null ? !!BUILTIN_PRESET.ui.customEnabled : (_ce === "1"));

/* =====================
   ✅ 魔靈（已取消奇跡/銳意/閃亮形態）
   - tag = spiritId（字串）
   - 相容舊資料：若遇到 "id::miracle" 會自動轉成 "id"
===================== */
function normalizeSpiritTag(tag){
  const t = String(tag||"").trim();
  if (!t) return "";
  // 舊版：id::variant
  const [id] = t.split("::");
  return (id || "").trim();
}
function tagKey(spiritId){ return String(spiritId||""); }

/* =====================
   查詢魔靈：已套用狀態
===================== */
const selectedSpiritTags = new Set(); // 套用後：Set<spiritId>
let activeSpiritPickTag = null;       // 註記目標：spiritId or null

/* 面板暫存（按完成才套用） */
let panelSelectedSpiritTags = new Set();
let panelActiveSpiritPickTag = null;

/* 魔靈管理：批次刪除勾選 */
let panelManageDeleteIds = new Set();

/* 註記模式 */
let annotateMode = false;
let annotateTag = null; // spiritId

/* ✅ 點位配對：是否要返回「查詢魔靈」 */
let pairReturnToSpiritDialog = false;

/* 點位命名模式 */
let namingMode = false;
let namingSelectedMarkerIds = new Set();
let namingSnapshot = null;
let namingLastClickedIndex = null;

/* 草稿制 */
let panelSpiritsDraft = [];
let panelDeletedSpiritIds = new Set();

/* =====================
   狀態
===================== */
const stateIcons = ["icons/state0.png","icons/state1.png","icons/state2.png","icons/state3.png"];
const stateLegend = ["還沒看","抓到了","沒魔靈","失敗 / 需再試"];
const STORAGE_KEY = "mapTaskTool_v8";

/* =====================
   ✅ 首次啟動：自動套用內建預設檔
   - 不覆蓋使用者既有資料
===================== */
function ensureBuiltinPresetOnFirstRun(){
  // 1) 若沒有任何資料，將內建 preset 寫入 localStorage 作為初始資料
  if (!localStorage.getItem(STORAGE_KEY)) {
    try{
      data = deepClone(BUILTIN_PRESET.data);
      save();
    }catch(e){ console.warn(e); }
  }

  // 2) UI 預設值：只在 key 不存在時寫入（避免覆蓋使用者偏好）
  try{
    if (localStorage.getItem(LABEL_TOGGLE_KEY) === null)
      localStorage.setItem(LABEL_TOGGLE_KEY, BUILTIN_PRESET.ui.showPointLabels ? "1" : "0");

    if (localStorage.getItem(LABEL_MODE_KEY) === null)
      localStorage.setItem(LABEL_MODE_KEY, BUILTIN_PRESET.ui.pointLabelMode || "all");

    if (localStorage.getItem(CUSTOM_SESSION_KEY) === null)
      localStorage.setItem(CUSTOM_SESSION_KEY, BUILTIN_PRESET.ui.customEnabled ? "1" : "0");

    if (localStorage.getItem(FOCUS_KEY) === null)
      localStorage.setItem(FOCUS_KEY, BUILTIN_PRESET.ui.focusMode ? "1" : "0");

    if (localStorage.getItem(LEFT_DOCK_KEY) === null)
      localStorage.setItem(LEFT_DOCK_KEY, BUILTIN_PRESET.ui.leftDockCollapsed ? "1" : "0");

    if (localStorage.getItem(RIGHT_DOCK_KEY) === null)
      localStorage.setItem(RIGHT_DOCK_KEY, BUILTIN_PRESET.ui.rightDockCollapsed ? "1" : "0");
  }catch(e){ console.warn(e); }
}


/* =====================
   ✅ 視角（縮放/平移/聚焦）
===================== */
const VIEW_KEY = "mapTaskTool_view_v1";
const FOCUS_KEY = "mapTaskTool_focusMode_v1";
const _fm = localStorage.getItem(FOCUS_KEY);
let focusMode = (_fm === null ? !!BUILTIN_PRESET.ui.focusMode : (_fm === "1"));

let view = { scale: 1, tx: 0, ty: 0 };
const VIEW_MIN = 0.6;
const VIEW_MAX = 5.0;
const PAN_BUFFER = 80;

/* =====================
   Dock 收起狀態（左/右）
===================== */
const LEFT_DOCK_KEY = "mapTaskTool_leftDockCollapsed_v1";
const RIGHT_DOCK_KEY = "mapTaskTool_rightDockCollapsed_v1";

/* =====================
   預設資料
===================== */
function uid(){
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
function clamp01(x){ return Math.max(0, Math.min(1, x)); }

function createDefaultData(){
  // ✅ 預設使用內建 preset（首次進入 / 清空後可回到此狀態）
  try{
    const d = (BUILTIN_PRESET && BUILTIN_PRESET.data) ? BUILTIN_PRESET.data : null;
    if (d && typeof d === 'object') return deepClone(d);
  }catch(e){ console.warn(e); }
  return { maps: [], markers: [], spirits: [], currentMapId: null };
}

let data = createDefaultData();
let mode = "normal";

/* =====================
   DOM
===================== */
const mapSelect = document.getElementById("mapSelect");
const mapNameInput = document.getElementById("mapName");
const mapImg = document.getElementById("mapImg");
const mapContainer = document.getElementById("mapContainer");
const mapStage = document.getElementById("mapStage");
const modeLabel = document.getElementById("modeLabel");
const legendEl = document.getElementById("legend");

const btnViewReset = document.getElementById("btnViewReset");
const btnFocusMode = document.getElementById("btnFocusMode");

const btnTogglePointLabels = document.getElementById("btnTogglePointLabels");
const labelModeWrap = document.getElementById("labelModeWrap");
const labelModeSelect = document.getElementById("labelModeSelect");

const btnToggleCustom = document.getElementById("btnToggleCustom");
const btnCustomToggleAddMarker = document.getElementById("btnCustomToggleAddMarker");
const btnCustomToggleDeleteMarker = document.getElementById("btnCustomToggleDeleteMarker");
const btnCustomToggleNameMarker = document.getElementById("btnCustomToggleNameMarker");

const btnAddMap = document.getElementById("btnAddMap");
const btnDeleteMap = document.getElementById("btnDeleteMap");
const btnReplaceMapImage = document.getElementById("btnReplaceMapImage");
const fileMap = document.getElementById("fileMap");
const btnDeleteMarkersCurrent = document.getElementById("btnDeleteMarkersCurrent");
const btnDeleteAllMarkers = document.getElementById("btnDeleteAllMarkers");

const btnSortMaps = document.getElementById("btnSortMaps");
const sortModal = document.getElementById("sortModal");
const sortList = document.getElementById("sortList");
const btnSortDone = document.getElementById("btnSortDone");
const btnSortCancel = document.getElementById("btnSortCancel");

const btnExport = document.getElementById("btnExport");
const btnImport = document.getElementById("btnImport");
const fileImport = document.getElementById("fileImport");
const btnClearAll = document.getElementById("btnClearAll");
const btnResetAllStates = document.getElementById("btnResetAllStates");

/* 查詢魔靈 */
const btnOpenSpirits = document.getElementById("btnOpenSpirits");
const spiritDialog = document.getElementById("spiritDialog");
const btnCloseSpirits = document.getElementById("btnCloseSpirits");
const btnSpiritsDone = document.getElementById("btnSpiritsDone");
const spiritSubText = document.getElementById("spiritSubText");
const spiritSearch = document.getElementById("spiritSearch");
const spiritList = document.getElementById("spiritList");
const spiritInfoBox = document.getElementById("spiritInfoBox");
const spiritManageList = document.getElementById("spiritManageList");
const manageHintText = document.getElementById("manageHintText");
const btnSpiritsSelectAll = document.getElementById("btnSpiritsSelectAll");
const btnSpiritsClear = document.getElementById("btnSpiritsClear");
const btnSpiritAdd = document.getElementById("btnSpiritAdd");
const btnStartAnnotate = document.getElementById("btnStartAnnotate");
const spiritPickBadge = document.getElementById("spiritPickBadge");

/* 魔靈管理：批次工具列 */
const btnManageSelectAll = document.getElementById("btnManageSelectAll");
const btnManageClear = document.getElementById("btnManageClear");
const btnManageBulkDelete = document.getElementById("btnManageBulkDelete");
const manageSelectedBadge = document.getElementById("manageSelectedBadge");

/* 點位配對 */
const btnOpenPairing = document.getElementById("btnOpenPairing");
const pairModal = document.getElementById("pairModal");
const pairSpiritSelect = document.getElementById("pairSpiritSelect");
const pairNameSearch = document.getElementById("pairNameSearch");
const btnPairSelectAllNames = document.getElementById("btnPairSelectAllNames");
const btnPairClearNames = document.getElementById("btnPairClearNames");
const pairNameList = document.getElementById("pairNameList");
const pairPreview = document.getElementById("pairPreview");
const btnPairApply = document.getElementById("btnPairApply");
const btnPairUnpair = document.getElementById("btnPairUnpair");
const btnPairClose = document.getElementById("btnPairClose");

/* 命名 HUD */
const namingSheet = document.getElementById("namingSheet");
const namingDesc = document.getElementById("namingDesc");
const namingMini = document.getElementById("namingMini");
const namingInput = document.getElementById("namingInput");
const btnNamingApply = document.getElementById("btnNamingApply");
const btnNamingClearName = document.getElementById("btnNamingClearName");
const btnNamingSelectAll = document.getElementById("btnNamingSelectAll");
const btnNamingClearSel = document.getElementById("btnNamingClearSel");
const btnNamingCancel = document.getElementById("btnNamingCancel");
const btnNamingDone = document.getElementById("btnNamingDone");
const btnNamingSelectUnnamed = document.getElementById("btnNamingSelectUnnamed");
const btnNamingSelectNamed = document.getElementById("btnNamingSelectNamed");
const btnNamingInvertSel = document.getElementById("btnNamingInvertSel");
const btnNamingApplyNumbered = document.getElementById("btnNamingApplyNumbered");
const recentNameChips = document.getElementById("recentNameChips");
const stepPick = document.getElementById("stepPick");
const stepType = document.getElementById("stepType");
const stepApply = document.getElementById("stepApply");
const btnNamingCollapse = document.getElementById("btnNamingCollapse");

/* 魔靈排序 */
const btnOpenSpiritSort = document.getElementById("btnOpenSpiritSort");
const spiritSortModal = document.getElementById("spiritSortModal");
const spiritSortList = document.getElementById("spiritSortList");
const btnSpiritSortDone = document.getElementById("btnSpiritSortDone");
const btnSpiritSortCancel = document.getElementById("btnSpiritSortCancel");

/* 規則 */
const btnOpenRules = document.getElementById("btnOpenRules");
const ruleDialog = document.getElementById("ruleDialog");
const btnCloseRules = document.getElementById("btnCloseRules");

/* ✅ 清空資料 Modal */
const clearModal = document.getElementById("clearModal");
const c_maps = document.getElementById("c_maps");
const c_markers = document.getElementById("c_markers");
const c_states = document.getElementById("c_states");
const c_pointNames = document.getElementById("c_pointNames");
const c_spiritsList = document.getElementById("c_spiritsList");
const c_notesAll = document.getElementById("c_notesAll");
const c_query = document.getElementById("c_query");
const c_prefs = document.getElementById("c_prefs");
const btnClearPickAll = document.getElementById("btnClearPickAll");
const btnClearPickNone = document.getElementById("btnClearPickNone");
const btnClearApply = document.getElementById("btnClearApply");
const btnClearInitAll = document.getElementById("btnClearInitAll");
const btnClearClose = document.getElementById("btnClearClose");

/* Dock */
const leftDock = document.getElementById("leftDock");
const rightDock = document.getElementById("rightDock");
const btnLeftDockToggle = document.getElementById("btnLeftDockToggle");
const btnRightDockToggle = document.getElementById("btnRightDockToggle");

/* =====================
   工具：字串/安全
===================== */
function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, (m)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
function formatDateForFile(d){
  const pad = (n)=> String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/* =====================
   資料存取 / 修復 / 遷移（含形態取消）
===================== */
function save(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch(e){
    console.error(e);
    alert("❌ 儲存失敗：localStorage 空間不足或瀏覽器限制。");
  }
}
function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try{ data = JSON.parse(raw); }catch(e){ console.error(e); }
}
function assertValidData(incoming){
  if (!incoming || typeof incoming !== "object") throw new Error("bad");
  if (!Array.isArray(incoming.maps) || !Array.isArray(incoming.markers) || !Array.isArray(incoming.spirits)) throw new Error("bad shape");
}
function repairDataShapeAndMigrate(){
  data.maps = Array.isArray(data.maps) ? data.maps : [];
  data.markers = Array.isArray(data.markers) ? data.markers : [];
  data.spirits = Array.isArray(data.spirits) ? data.spirits : [];
  data.currentMapId = data.currentMapId || (data.maps[0]?.id ?? null);

  data.maps.forEach(m=>{
    if (!m.id) m.id = uid();
    if (typeof m.name !== "string") m.name = "未命名地圖";
    if (typeof m.src !== "string") m.src = "";
  });

  data.spirits.forEach(s=>{
    if (!s.id) s.id = uid();
    if (typeof s.name !== "string") s.name = "未命名魔靈";
  });

  const spiritIds = new Set(data.spirits.map(s=>s.id));

  data.markers.forEach(mk=>{
    if (!mk.id) mk.id = uid();
    if (!mk.mapId) mk.mapId = data.maps[0]?.id ?? null;
    mk.x = clamp01(Number(mk.x ?? 0));
    mk.y = clamp01(Number(mk.y ?? 0));
    mk.state = Number.isFinite(mk.state) ? (mk.state|0) : 0;
    mk.createdAt = Number.isFinite(mk.createdAt) ? mk.createdAt : Date.now();
    mk.pointName = typeof mk.pointName === "string" ? mk.pointName : "";

    // ✅ 遷移：spiritTags 可能是舊版 "id::variant"，轉成 "id"
    mk.spiritTags = Array.isArray(mk.spiritTags) ? mk.spiritTags : [];
    mk.spiritTags = mk.spiritTags
      .map(normalizeSpiritTag)
      .filter(Boolean)
      .filter(id => spiritIds.has(id));
  });

  const mapIds = new Set(data.maps.map(m=>m.id));
  data.markers = data.markers.filter(mk => mapIds.has(mk.mapId));
  if (!data.currentMapId || !mapIds.has(data.currentMapId)) data.currentMapId = data.maps[0]?.id ?? null;
}

/* =====================
   ✅ 命名模式：右側 Dock 強制收起（退出可恢復）
===================== */
let namingPrevRightDockCollapsed = null;
let namingRightDockUserTouched = false;

function setRightDockCollapsedUI(collapsed){
  rightDock.classList.toggle("collapsed", !!collapsed);
  btnRightDockToggle.textContent = collapsed ? "◀" : "▶";
}

function forceRightDockCollapseForNaming(){
  if (!rightDock) return;
  if (rightDock.dataset.forceNaming === "1") return;

  namingPrevRightDockCollapsed = rightDock.classList.contains("collapsed");
  namingRightDockUserTouched = false;

  rightDock.dataset.forceNaming = "1";
  setRightDockCollapsedUI(true);
}

function releaseRightDockCollapseForNaming(){
  if (!rightDock) return;
  if (rightDock.dataset.forceNaming !== "1") return;

  rightDock.dataset.forceNaming = "0";

  if (!namingRightDockUserTouched && namingPrevRightDockCollapsed !== null){
    setRightDockCollapsedUI(!!namingPrevRightDockCollapsed);
  }

  namingPrevRightDockCollapsed = null;
  namingRightDockUserTouched = false;
}

/* =====================
   ✅ Dock：套用收起狀態
===================== */
function applyDockState(){
  const l = localStorage.getItem(LEFT_DOCK_KEY) === "1";
  const r = localStorage.getItem(RIGHT_DOCK_KEY) === "1";

  leftDock.classList.toggle("collapsed", l);
  rightDock.classList.toggle("collapsed", r);

  btnLeftDockToggle.textContent = l ? "▶" : "◀";
  btnRightDockToggle.textContent = r ? "◀" : "▶";

  if (namingMode && rightDock.dataset.forceNaming === "1"){
    rightDock.classList.add("collapsed");
    btnRightDockToggle.textContent = "◀";
  }
}

btnLeftDockToggle.addEventListener("click", () => {
  const next = !leftDock.classList.contains("collapsed");
  localStorage.setItem(LEFT_DOCK_KEY, next ? "1" : "0");
  applyDockState();
});
btnRightDockToggle.addEventListener("click", () => {
  if (namingMode) namingRightDockUserTouched = true;
  const next = !rightDock.classList.contains("collapsed");
  localStorage.setItem(RIGHT_DOCK_KEY, next ? "1" : "0");
  applyDockState();
});

/* =====================
   ✅ 點位名稱顯示 UI
===================== */
function applyPointLabelUI(){
  const enabled = isPointLabelsEnabled();
  if (enabled) hideHoverTip();
  btnTogglePointLabels.classList.toggle("active", enabled);
  btnTogglePointLabels.textContent = enabled ? "🏷️ 點位名稱：ON" : "🏷️ 點位名稱：OFF";
  // ✅ 不用 inline style 控制顯示，避免在自定義 OFF 時 inline style 覆蓋 CSS 的 [data-custom]{display:none}
  if (labelModeWrap) labelModeWrap.hidden = !enabled;
  if (labelModeSelect) labelModeSelect.value = pointLabelMode;
}
btnTogglePointLabels.addEventListener("click", () => {
  if (!customEnabled) return; // ✅ 非自定義模式不提供點位名稱顯示
  showPointLabels = !showPointLabels;
  localStorage.setItem(LABEL_TOGGLE_KEY, showPointLabels ? "1" : "0");
  applyPointLabelUI();
  render();
});
labelModeSelect.addEventListener("change", () => {
  pointLabelMode = labelModeSelect.value || "all";
  if (!["matched","all"].includes(pointLabelMode)) pointLabelMode = "all";
  localStorage.setItem(LABEL_MODE_KEY, pointLabelMode);
  applyPointLabelUI();
  render();
});

/* =====================
   ✅ 自定義 UI
===================== */
function applyCustomUI(){
  document.body.classList.toggle("custom", !!customEnabled);
  mapNameInput.disabled = !customEnabled;

  // ✅ 最高優先：在自定義 OFF 時，強制把「點位名稱」相關控制整組隱藏
  // （避免被其他 CSS selector 以更高 specificity 覆蓋 [data-custom]{display:none}）
  if (btnTogglePointLabels) btnTogglePointLabels.hidden = !customEnabled;
  if (labelModeWrap) labelModeWrap.hidden = (!customEnabled) || (!isPointLabelsEnabled());

  // ✅ 切到自定義 OFF 時，清除可能殘留的 inline display（避免覆蓋 CSS 的 [data-custom]{display:none}）
  if (!customEnabled){
    document.querySelectorAll("[data-custom]").forEach(el => {
      el.style.removeProperty("display");
    });
  }

  btnToggleCustom.classList.toggle("active", !!customEnabled);
  btnToggleCustom.textContent = customEnabled ? "🧩 自定義模式：ON" : "🧩 自定義模式：OFF";

  spiritSubText.textContent = customEnabled
    ? "勾選名稱可高亮符合點位；要註記點位請先在右側選註記目標再按「魔靈點位註記」。"
    : "勾選名稱可在地圖上高亮符合點位，左側資訊欄會顯示結果。（不想自定義也能直接用）";
}

/* =====================
   ✅ 視角：Transform / clamp
===================== */
let transformRAF = 0;
function applyTransformImmediate(){
  // rAF-synced transform update for smoother 60fps interaction
  mapStage.style.transform = `translate3d(${view.tx}px, ${view.ty}px, 0) scale(${view.scale})`;
}
function applyTransform(){
  if (transformRAF) return;
  transformRAF = requestAnimationFrame(() => {
    transformRAF = 0;
    applyTransformImmediate();
  });
}
function clampView(){
  const vw = mapContainer.clientWidth;
  const vh = mapContainer.clientHeight;
  if (!vw || !vh) return;

  const stageW = (mapImg.clientWidth || 0) * view.scale;
  const stageH = (mapImg.clientHeight || 0) * view.scale;
  if (!stageW || !stageH) return;

  const minTx = -stageW - PAN_BUFFER;
  const maxTx =  vw + PAN_BUFFER;
  const minTy = -stageH - PAN_BUFFER;
  const maxTy =  vh + PAN_BUFFER;

  view.tx = Math.max(minTx, Math.min(maxTx, view.tx));
  view.ty = Math.max(minTy, Math.min(maxTy, view.ty));
}
let viewSaveTimer = 0;
function saveViewDebounced(){
  clearTimeout(viewSaveTimer);
  viewSaveTimer = setTimeout(() => {
    try{
      localStorage.setItem(VIEW_KEY, JSON.stringify({ scale:view.scale, tx:view.tx, ty:view.ty }));
    }catch(_){}
  }, 180);
}
function setScale(nextScale, pivotX, pivotY){
  const rect = mapContainer.getBoundingClientRect();
  const x = pivotX - rect.left;
  const y = pivotY - rect.top;

  const prev = view.scale;
  const next = Math.min(VIEW_MAX, Math.max(VIEW_MIN, nextScale));
  if (Math.abs(next - prev) < 1e-6) return;

  const sx = (x - view.tx) / prev;
  const sy = (y - view.ty) / prev;

  view.scale = next;
  view.tx = x - sx * next;
  view.ty = y - sy * next;

  clampView();
  applyTransform();
  markMapMovingThrottled();
  scheduleDeclutter();
  saveViewDebounced();
}
function zoomBy(factor, clientX, clientY){
  setScale(view.scale * factor, clientX, clientY);
}
function resetView(){
  view.scale = 1;
  const vw = mapContainer.clientWidth;
  const vh = mapContainer.clientHeight;
  const iw = mapImg.clientWidth || 0;
  const ih = mapImg.clientHeight || 0;
  view.tx = (vw - iw) / 2;
  view.ty = (vh - ih) / 2;

  clampView();
  applyTransform();
  scheduleDeclutter();
  saveViewDebounced();
}

/* =====================
   ✅ 聚焦 UI
===================== */
function applyFocusUI(){
  btnFocusMode.classList.toggle("active", !!focusMode);
  btnFocusMode.textContent = focusMode ? "🎯 聚焦：ON" : "🎯 聚焦：OFF";
  btnFocusMode.title = focusMode
    ? "ON：符合查詢的點位高亮，其餘變暗（不改視角）"
    : "OFF：不變暗其它點位";
}

/* =====================
   ✅ Label declutter（效能優化版）
   - 目標：點位很多時，避免「全量標籤 + 碰撞避讓」造成拖拽/縮放卡頓
   - 作法：
     1) 拖拽/縮放期間先暫時隱藏標籤（大幅降低重繪成本）
     2) 停止操作後，以「螢幕格網」挑選代表點位顯示標籤（降低雜亂 & DOM 數量）
     3) 縮放較小時只顯示 #編號（compact），避免文字塞滿畫面
===================== */
const LABEL_SMART_KEY = "mapTaskTool_smartLabels_v1";
let smartLabels = (localStorage.getItem(LABEL_SMART_KEY) !== "0"); // 預設 ON（使用者需求：降雜亂/更順）

// ✅ 調整這些數值即可微調顯示密度
const LABEL_SHOW_MIN_SCALE = 0.92;     // 低於此縮放就不顯示任何標籤
const LABEL_NAME_MIN_SCALE = 1.15;     // 低於此縮放只顯示 #編號（compact）
const LABEL_VIEWPORT_MARGIN = 90;      // 只挑選畫面附近的點位（px）
const LABEL_GRID_BASE = 140;           // 格網基準（px）
const LABEL_MAX_DOM = 420;             // 最多同時顯示的標籤數（避免 DOM 太多）

let markerElById = new Map();
let lastLabelWinners = new Set();
let moveRAF = 0;
let moveIdleTimer = 0;

function setMapMoving(on){
  document.body.classList.toggle("map-moving", !!on);
  if (on) hideHoverTip();
}

// 在拖拽/縮放期間呼叫：先隱藏標籤，停下後再重算顯示集合
function markMapMoving(){
  if (!isPointLabelsEnabled()) return;
  if (!smartLabels) return;
  setMapMoving(true);
  clearTimeout(moveIdleTimer);
  moveIdleTimer = setTimeout(() => {
    setMapMoving(false);
    updatePointLabelsNow();
  }, 140);
}
function markMapMovingThrottled(){
  if (!smartLabels) return;
  if (moveRAF) return;
  moveRAF = requestAnimationFrame(() => {
    moveRAF = 0;
    markMapMoving();
  });
}

// ✅ 計算「要顯示標籤的點位集合」
function computeLabelWinners(){
  const m = getCurrentMap();
  if (!m) return new Map();
  if (!isPointLabelsEnabled()) return new Map();

  // 縮放太小：直接不顯示（畫面也比較乾淨）
  if (view.scale < LABEL_SHOW_MIN_SCALE) return new Map();

  // 若使用者選「只顯示符合」本來就會很少，仍沿用格網避免爆量
  const markers = getMarkersInMap(m.id);
  if (!markers.length) return new Map();

  const iw = mapImg.clientWidth || 0;
  const ih = mapImg.clientHeight || 0;
  if (!iw || !ih) return new Map();

  const cont = mapContainer.getBoundingClientRect();
  const cx = cont.width / 2;
  const cy = cont.height / 2;

  // 格網大小：縮放越小 -> 格網越大（顯示更少）
  const grid = Math.max(110, Math.min(220, LABEL_GRID_BASE / Math.max(0.85, view.scale)));

  // cell -> best { id, score, idx, name, pos }
  const best = new Map();

  const margin = LABEL_VIEWPORT_MARGIN;
  const x0 = -margin, y0 = -margin;
  const x1 = cont.width + margin, y1 = cont.height + margin;

  // 先做一個「可快速查 matched」的 set（避免每次都跑 normalize）
  // matched 的重要性最高：聚焦/查詢時，優先顯示它
  const hasSelected = selectedSpiritTags.size > 0;

  for (let i = 0; i < markers.length; i++){
    const mk = markers[i];
    const idx = i + 1;

    const matched = (pointLabelMode === "matched")
      ? isMarkerMatchedBySelected(mk)
      : (hasSelected ? isMarkerMatchedBySelected(mk) : false);

    // labelMode = matched：非 matched 直接跳過
    if (pointLabelMode === "matched" && !matched) continue;

    // 轉為容器內座標（px）
    const sx = view.tx + (mk.x * iw) * view.scale;
    const sy = view.ty + (mk.y * ih) * view.scale;

    if (sx < x0 || sx > x1 || sy < y0 || sy > y1) continue;

    // cell key
    const gx = Math.floor(sx / grid);
    const gy = Math.floor(sy / grid);
    const key = gx + "," + gy;

    const pn = (mk.pointName || "").trim();
    const hasName = !!pn;

    // score：matched / naming選取 / 有名稱 / 距中心近
    const dx = sx - cx, dy = sy - cy;
    const dist = Math.hypot(dx, dy);

    let score = 0;
    if (matched) score += 1000;
    if (namingMode && namingSelectedMarkerIds.has(mk.id)) score += 700;
    if (hasName) score += 140;

    // 距中心近：加分（避免邊緣被選太多）
    score += Math.max(0, 260 - dist / 2);

    // 若 focusMode ON：畫面上會暗掉不符合的點位，則更偏好 matched
    if (focusMode && hasSelected && matched) score += 260;

    const prev = best.get(key);
    if (!prev || score > prev.score){
      // label 方向（不做碰撞避讓，用象限規則讓看起來比較一致）
      let pos = "pos-r";
      if (sx >= cx && sy >= cy) pos = "pos-l";
      else if (sx >= cx && sy < cy) pos = "pos-l";
      else if (sx < cx && sy >= cy) pos = "pos-r";
      else pos = "pos-r";

      best.set(key, { id: mk.id, score, idx, name: pn, pos, matched });
    }
  }

  // 抽取 winners
  let winners = Array.from(best.values());

  // 上限保護：太多就取分數最高者
  if (winners.length > LABEL_MAX_DOM){
    winners.sort((a,b)=> b.score - a.score);
    winners = winners.slice(0, LABEL_MAX_DOM);
  }

  const out = new Map();
  for (const w of winners) out.set(w.id, w);
  return out;
}

// ✅ 套用 winners：只增刪 label，不重建 marker（避免卡頓）
function applyLabelsFromWinners(winners){
  const nextSet = new Set(winners.keys());

  // 先移除不需要的
  for (const id of lastLabelWinners){
    if (nextSet.has(id)) continue;
    const el = markerElById.get(id);
    if (!el) continue;
    const lb = el.querySelector(".marker-label");
    if (lb) lb.remove();
  }

  const compact = (view.scale < LABEL_NAME_MIN_SCALE);

  // 再新增/更新需要的
  for (const [id, w] of winners.entries()){
    const el = markerElById.get(id);
    if (!el) continue;

    let lb = el.querySelector(".marker-label");
    const wantPos = w.pos || getLabelPosClass((w.idx - 1) || 0);

    if (!lb){
      lb = document.createElement("div");
      lb.className = "marker-label";
      el.appendChild(lb);
    }

    // class / pos
    lb.classList.toggle("compact", compact);
    lb.classList.remove("pos-r","pos-l","pos-t","pos-b");
    lb.classList.add(wantPos);

    // 內容只有在必要時更新（避免每次都 innerHTML）
    const nm = (w.name || "").trim();
    const textName = nm || "（未命名）";
    const sig = `${w.idx}::${textName}::${compact ? 1 : 0}`;
    if (lb.dataset.sig !== sig){
      lb.dataset.sig = sig;
      lb.innerHTML = `
        <div class="ml-line"><span class="ml-num">#${w.idx}</span></div>
        <div class="ml-line ml-name">${escapeHtml(textName)}</div>
      `;
    }
  }

  lastLabelWinners = nextSet;
}

let labelUpdateRAF = 0;
function updatePointLabelsNow(){
  cancelAnimationFrame(labelUpdateRAF);
  labelUpdateRAF = requestAnimationFrame(() => {
    // 若關閉標籤（或非自定義）：直接清乾淨
    if (!isPointLabelsEnabled()){
      for (const id of lastLabelWinners){
        const el = markerElById.get(id);
        const lb = el?.querySelector?.(".marker-label");
        if (lb) lb.remove();
      }
      lastLabelWinners = new Set();
      return;
    }

    // smartLabels OFF：回到「全顯示」但仍會在拖拽時隱藏（避免卡）
    if (!smartLabels){
      // 全顯示的成本很高，仍加一個上限保護
      const m = getCurrentMap();
      if (!m) return;
      const markers = getMarkersInMap(m.id);
      const out = new Map();
      const compact = (view.scale < LABEL_NAME_MIN_SCALE);
      const max = Math.min(markers.length, LABEL_MAX_DOM);
      for (let i = 0; i < max; i++){
        const mk = markers[i];
        if (pointLabelMode === "matched" && !isMarkerMatchedBySelected(mk)) continue;
        out.set(mk.id, { id: mk.id, idx: i+1, name: (mk.pointName||"").trim(), pos: getLabelPosClass(i), score: 0 });
      }
      applyLabelsFromWinners(out);
      return;
    }

    const winners = computeLabelWinners();
    applyLabelsFromWinners(winners);
  });
}

// 舊 scheduleDeclutter 改成：重算標籤（輕量）
let declutterRAF = 0;
function scheduleDeclutter(){
  cancelAnimationFrame(declutterRAF);
  declutterRAF = requestAnimationFrame(updatePointLabelsNow);
}


/* =====================
   基本取用
===================== */
function getCurrentMap(){ return data.maps.find(m => m.id === data.currentMapId) || null; }
function getMarkersInMap(mapId){ return data.markers.filter(mk => mk.mapId === mapId); }
function setMode(next){ mode = next; render(); }
function renderMapSelect(keepValue){
  const cur = keepValue ? mapSelect.value : data.currentMapId;
  mapSelect.innerHTML = "";
  data.maps.forEach(mp=>{
    const opt = document.createElement("option");
    opt.value = mp.id;
    opt.textContent = mp.name || "未命名地圖";
    mapSelect.appendChild(opt);
  });
  if (cur && data.maps.some(m=>m.id===cur)) mapSelect.value = cur;
  data.currentMapId = mapSelect.value || data.maps[0]?.id || null;
}
function syncCurrentMapUI(){
  const m = getCurrentMap();
  mapSelect.value = m?.id || "";
  mapNameInput.value = m?.name || "";
}

/* =====================
   規則 Dialog
===================== */
btnOpenRules.addEventListener("click", ()=> ruleDialog.showModal());
btnCloseRules.addEventListener("click", ()=> ruleDialog.close());
ruleDialog.addEventListener("click", (e) => {
  const r = ruleDialog.getBoundingClientRect();
  const inside = e.clientX>=r.left && e.clientX<=r.right && e.clientY>=r.top && e.clientY<=r.bottom;
  if (!inside) ruleDialog.close();
});

/* =====================
   自定義模式切換
===================== */
btnToggleCustom.addEventListener("click", () => {
  customEnabled = !customEnabled;
  if (customEnabled) localStorage.setItem(CUSTOM_SESSION_KEY, "1");
  else {
    localStorage.removeItem(CUSTOM_SESSION_KEY);
    setMode("normal");
    stopAnnotateMode();
    stopNamingMode(false);
  }
  applyCustomUI();
  if (spiritDialog.open) renderSpiritDialog();
  render();
});

/* =====================
   查詢魔靈 Dialog（完成才套用）
===================== */
btnOpenSpirits.addEventListener("click", () => {
  syncPanelFromApplied();
  renderSpiritDialog();
  spiritDialog.showModal();
});
btnSpiritsDone.addEventListener("click", () => {
  applyPanelToApplied();
  spiritDialog.close();
  render();
});
btnCloseSpirits.addEventListener("click", () => attemptCloseSpiritDialog());
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && spiritDialog.open){
    e.preventDefault();
    attemptCloseSpiritDialog();
  }
});
spiritSearch.addEventListener("input", () => renderSpiritDialog());

function getFilteredSpirits(){
  const kw = (spiritSearch.value || "").trim().toLowerCase();
  let list = panelSpiritsDraft.slice();
  if (kw) list = list.filter(s => (s.name || "").toLowerCase().includes(kw));
  return list;
}

btnSpiritsSelectAll.addEventListener("click", () => {
  getFilteredSpirits().forEach(s => panelSelectedSpiritTags.add(tagKey(s.id)));
  renderSpiritDialog();
});
btnSpiritsClear.addEventListener("click", () => {
  panelSelectedSpiritTags = new Set();
  renderSpiritDialog();
});

function syncPanelFromApplied(){
  panelSelectedSpiritTags = new Set(Array.from(selectedSpiritTags));
  panelActiveSpiritPickTag = activeSpiritPickTag;

  panelSpiritsDraft = (data.spirits || []).map(s => ({ id: s.id, name: s.name }));
  panelDeletedSpiritIds = new Set();
  panelManageDeleteIds = new Set();
}
function applyPanelToApplied(){
  const draftIds = new Set(panelSpiritsDraft.map(s => s.id));
  const deleted = new Set(panelDeletedSpiritIds);
  for (const s of (data.spirits || [])){
    if (!draftIds.has(s.id)) deleted.add(s.id);
  }

  data.spirits = panelSpiritsDraft.map(s => ({
    id: s.id,
    name: (s.name || "").trim() || "未命名魔靈",
  }));

  if (deleted.size > 0){
    data.markers.forEach(mk => {
      mk.spiritTags = (mk.spiritTags || []).map(normalizeSpiritTag).filter(id => !deleted.has(id));
    });
  }

  selectedSpiritTags.clear();
  for (const t of panelSelectedSpiritTags) selectedSpiritTags.add(t);

  activeSpiritPickTag = panelActiveSpiritPickTag;
  if (activeSpiritPickTag && deleted.has(activeSpiritPickTag)) activeSpiritPickTag = null;
  if (annotateTag && deleted.has(annotateTag)) stopAnnotateMode();

  save();
  updateAnnotateButtonState();
  renderLegendAndStats();
}
function panelChanged(){
  const a = Array.from(selectedSpiritTags).sort().join("|");
  const b = Array.from(panelSelectedSpiritTags).sort().join("|");
  if (a !== b) return true;
  if ((activeSpiritPickTag || "") !== (panelActiveSpiritPickTag || "")) return true;

  const base = (data.spirits || []).map(s => `${s.id}::${s.name||""}`).sort().join("|");
  const draft = (panelSpiritsDraft || []).map(s => `${s.id}::${s.name||""}`).sort().join("|");
  if (base !== draft) return true;

  if (panelDeletedSpiritIds && panelDeletedSpiritIds.size > 0) return true;
  return false;
}
function attemptCloseSpiritDialog(){
  if (!panelChanged()){
    spiritDialog.close();
    return;
  }
  const ok = confirm("⚠️ 你在「查詢魔靈」面板的操作尚未按「完成」記錄。\n\n按「確定」會放棄本次變更並關閉視窗。\n按「取消」返回繼續操作。");
  if (!ok) return;
  syncPanelFromApplied();
  spiritDialog.close();
}

/* 新增魔靈 */
btnSpiritAdd.addEventListener("click", () => {
  if (!customEnabled) return;
  const name = prompt("輸入魔靈名稱：", `新魔靈 ${panelSpiritsDraft.length + 1}`);
  if (name === null) return;
  const nm = name.trim() || `新魔靈 ${panelSpiritsDraft.length + 1}`;
  panelSpiritsDraft.push({ id: uid(), name: nm });
  renderSpiritDialog();
});

/* =====================
   註記按鈕狀態
===================== */
function displayNameFromTag(tag){
  const sp = data.spirits.find(s => s.id === tag);
  return sp?.name || "未命名魔靈";
}
function updateAnnotateButtonState(){
  btnStartAnnotate.textContent = "🧩 魔靈點位註記";
  if (spiritPickBadge) spiritPickBadge.style.display = (customEnabled ? "inline-flex" : "none");

  if (annotateMode){
    btnStartAnnotate.disabled = true;
    btnStartAnnotate.title = "目前正在註記模式中。";
    if (spiritPickBadge) spiritPickBadge.textContent = `🎯 目標：${displayNameFromTag(annotateTag)}`;
    return;
  }

  if (!customEnabled){
    btnStartAnnotate.disabled = true;
    btnStartAnnotate.title = "自定義模式 ON 才能使用。";
    if (spiritPickBadge){ spiritPickBadge.textContent = "🎯 目標：—"; spiritPickBadge.style.display = "none"; }
    return;
  }

  const target = spiritDialog.open ? panelActiveSpiritPickTag : activeSpiritPickTag;
  if (!target){
    btnStartAnnotate.disabled = true;
    btnStartAnnotate.title = "請先在右側「魔靈管理」選一個『註記目標』。";
    if (spiritPickBadge){ spiritPickBadge.textContent = "🎯 目標：—"; spiritPickBadge.style.display = "inline-flex"; }
    return;
  }

  btnStartAnnotate.disabled = false;
  btnStartAnnotate.title = `開始註記：「${displayNameFromTag(target)}」`;
  if (spiritPickBadge){
    spiritPickBadge.textContent = `🎯 目標：${displayNameFromTag(target)}`;
    spiritPickBadge.style.display = "inline-flex";
  }
}
btnStartAnnotate.addEventListener("click", () => {
  if (!customEnabled) return;
  const target = spiritDialog.open ? panelActiveSpiritPickTag : activeSpiritPickTag;
  if (!target){
    alert("請先在右側「魔靈管理」選一個『註記目標』。");
    return;
  }
  activeSpiritPickTag = target;
  panelActiveSpiritPickTag = target;

  if (mode !== "normal") setMode("normal");
  stopNamingMode(false);
  if (spiritDialog.open) spiritDialog.close();
  startAnnotateMode(target);
});

function toggleMarkerTag(markerId, tag){
  const mk = data.markers.find(m => m.id === markerId);
  if (!mk) return;
  mk.spiritTags = Array.isArray(mk.spiritTags) ? mk.spiritTags.map(normalizeSpiritTag).filter(Boolean) : [];
  const t = normalizeSpiritTag(tag);
  const has = mk.spiritTags.includes(t);
  if (has) mk.spiritTags = mk.spiritTags.filter(x => x !== t);
  else mk.spiritTags.push(t);
}
function startAnnotateMode(tag){
  annotateMode = true;
  annotateTag = tag;
  toast(`🧩 註記模式：${displayNameFromTag(tag)}`, 1600);
  if (mode !== "normal") setMode("normal");
  updateAnnotateButtonState();
  render();
}
function stopAnnotateMode(){
  annotateMode = false;
  annotateTag = null;
  updateAnnotateButtonState();
}

/* =====================
   ✅ 點位命名：進入/退出
===================== */
btnCustomToggleNameMarker.addEventListener("click", () => {
  if (!customEnabled) return;

  if (annotateMode) stopAnnotateMode();
  setMode("normal");

  if (namingMode){
    stopNamingMode(false);
    render();
    return;
  }
  startNamingMode();
});

/* =====================
   ✅ 命名 HUD：收合/展開（記住狀態）
===================== */
const NAMING_HUD_COLLAPSE_KEY = "mapTaskTool_namingHudCollapsed_v1";

function applyNamingHudCollapse(){
  const collapsed = (localStorage.getItem(NAMING_HUD_COLLAPSE_KEY) === "1");
  namingSheet.classList.toggle("mini", collapsed);
  if (btnNamingCollapse){
    btnNamingCollapse.textContent = collapsed ? "▸" : "▾";
    btnNamingCollapse.title = collapsed ? "展開命名面板" : "收合命名面板";
  }
}
btnNamingCollapse?.addEventListener("click", () => {
  const next = !namingSheet.classList.contains("mini");
  localStorage.setItem(NAMING_HUD_COLLAPSE_KEY, next ? "1" : "0");
  applyNamingHudCollapse();
});

function startNamingMode(){
  if (!customEnabled) return;

  namingMode = true;
  forceRightDockCollapseForNaming();

  namingSelectedMarkerIds = new Set();
  namingLastClickedIndex = null;

  namingSnapshot = new Map();
  const m = getCurrentMap();
  const arr = m ? getMarkersInMap(m.id) : [];
  arr.forEach(mk => namingSnapshot.set(mk.id, mk.pointName ?? ""));

  namingInput.value = "";
  namingSheet.classList.add("show");
  applyNamingHudCollapse();

  updateNamingUI();
  render();
}

function stopNamingMode(apply){
  if (!namingMode) return;

  if (!apply && namingSnapshot){
    for (const [mid, oldName] of namingSnapshot.entries()){
      const mk = data.markers.find(x => x.id === mid);
      if (mk) mk.pointName = oldName || "";
    }
  }

  namingMode = false;
  namingSelectedMarkerIds = new Set();
  namingSnapshot = null;
  namingLastClickedIndex = null;

  namingSheet.classList.remove("show");
  releaseRightDockCollapseForNaming();
  updateNamingUI();
}

const RECENT_NAME_KEY = "mapTaskTool_recentPointNames_v1";
function getRecentNames(){
  try{
    const arr = JSON.parse(localStorage.getItem(RECENT_NAME_KEY) || "[]");
    if (Array.isArray(arr)) return arr.filter(x => typeof x === "string").slice(0, 10);
  }catch(_){}
  return [];
}
function pushRecentName(name){
  const n = (name || "").trim();
  if (!n) return;
  const cur = getRecentNames();
  const next = [n, ...cur.filter(x => x !== n)].slice(0, 10);
  try{ localStorage.setItem(RECENT_NAME_KEY, JSON.stringify(next)); }catch(_){}
}
function renderRecentChips(){
  const arr = getRecentNames();
  recentNameChips.innerHTML = arr.length
    ? arr.map(n => `<span class="chip" data-chip="${escapeHtml(n)}">🏷️ ${escapeHtml(n)}</span>`).join("")
    : `<span class="muted">（尚無常用名稱）</span>`;
  recentNameChips.querySelectorAll("[data-chip]").forEach(el => {
    el.addEventListener("click", () => {
      const v = el.getAttribute("data-chip") || "";
      namingInput.value = v;
      namingInput.focus();
      updateNamingUI();
    });
  });
}
function updateNamingUI(){
  const m = getCurrentMap();
  const mapName = m?.name || "未命名地圖";
  const selCount = namingSelectedMarkerIds.size;
  const namedCount = m ? getMarkersInMap(m.id).filter(x => (x.pointName||"").trim()).length : 0;
  namingDesc.innerHTML = `地圖：<b>${escapeHtml(mapName)}</b> ｜ 已命名：<b>${namedCount}</b> ｜ 已選：<b>${selCount}</b>`;

  stepPick.classList.toggle("on", true);
  const hasText = (namingInput.value || "").trim().length > 0;
  stepType.classList.toggle("on", hasText);
  stepApply.classList.toggle("on", hasText && selCount > 0);

  if (!m){
    namingMini.innerHTML = `<span class="muted">尚未選取地圖。</span>`;
    return;
  }
  const arr = getMarkersInMap(m.id).map((mk, i) => ({ mk, idx: i+1 }))
    .filter(x => namingSelectedMarkerIds.has(x.mk.id));

  namingMini.innerHTML = arr.length
    ? arr.slice(0, 60).map((x, j) => {
        const nm = (x.mk.pointName || "").trim();
        const s = nm ? `#${x.idx}(${escapeHtml(nm)})` : `#${x.idx}`;
        return `<span class="kbadge" title="已選取">${j+1}. ${s}</span>`;
      }).join("")
    : `<span class="muted">尚未選取點位（點地圖上的點位即可選取）。</span>`;

  renderRecentChips();
}
function applyNameToSelection(name){
  const nm = (name || "").trim();
  if (!nm) return alert("請先輸入點位名稱。");
  if (namingSelectedMarkerIds.size === 0) return alert("請先選取點位（可多選）。");

  for (const mid of namingSelectedMarkerIds){
    const mk = data.markers.find(x => x.id === mid);
    if (mk) mk.pointName = nm;
  }
  pushRecentName(nm);
  save();
  renderLegendAndStats();
  updateNamingUI();
  render();
  toast(`✅ 已套用名稱：${nm}`);
}

btnNamingApply.addEventListener("click", () => applyNameToSelection(namingInput.value));
namingInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter"){
    e.preventDefault();
    applyNameToSelection(namingInput.value);
  }
});
btnNamingApplyNumbered.addEventListener("click", () => {
  if (!namingMode) return;
  const base = (namingInput.value || "").trim();
  if (!base) return alert("請先輸入名稱（將作為前綴）。");
  if (namingSelectedMarkerIds.size === 0) return alert("請先選取點位（可多選）。");

  const m = getCurrentMap();
  if (!m) return;

  const arr = getMarkersInMap(m.id).map((mk, i) => ({ mk, idx:i+1 }))
    .filter(x => namingSelectedMarkerIds.has(x.mk.id));

  arr.forEach((x, i) => { x.mk.pointName = `${base}-${i+1}`; });
  pushRecentName(base);
  save();
  renderLegendAndStats();
  updateNamingUI();
  render();
  toast(`✅ 已批次編號：${base}-1…`);
});
btnNamingClearName.addEventListener("click", () => {
  if (!namingMode) return;
  if (namingSelectedMarkerIds.size === 0) return alert("請先選取點位（可多選）。");
  if (!confirm("確定要清空「已選取點位」的名稱？")) return;

  for (const mid of namingSelectedMarkerIds){
    const mk = data.markers.find(x => x.id === mid);
    if (mk) mk.pointName = "";
  }
  save();
  renderLegendAndStats();
  updateNamingUI();
  render();
  toast("✅ 已清空已選點位名稱");
});
btnNamingSelectAll.addEventListener("click", () => {
  if (!namingMode) return;
  const m = getCurrentMap();
  if (!m) return;
  namingSelectedMarkerIds = new Set(getMarkersInMap(m.id).map(x => x.id));
  updateNamingUI();
  render();
});
btnNamingSelectUnnamed.addEventListener("click", () => {
  if (!namingMode) return;
  const m = getCurrentMap();
  if (!m) return;
  namingSelectedMarkerIds = new Set(getMarkersInMap(m.id).filter(mk => !(mk.pointName||"").trim()).map(mk=>mk.id));
  updateNamingUI();
  render();
});
btnNamingSelectNamed.addEventListener("click", () => {
  if (!namingMode) return;
  const m = getCurrentMap();
  if (!m) return;
  namingSelectedMarkerIds = new Set(getMarkersInMap(m.id).filter(mk => (mk.pointName||"").trim()).map(mk=>mk.id));
  updateNamingUI();
  render();
});
btnNamingInvertSel.addEventListener("click", () => {
  if (!namingMode) return;
  const m = getCurrentMap();
  if (!m) return;
  const all = getMarkersInMap(m.id).map(x=>x.id);
  const next = new Set();
  for (const id of all){
    if (!namingSelectedMarkerIds.has(id)) next.add(id);
  }
  namingSelectedMarkerIds = next;
  updateNamingUI();
  render();
});
btnNamingClearSel.addEventListener("click", () => {
  if (!namingMode) return;
  namingSelectedMarkerIds = new Set();
  namingLastClickedIndex = null;
  updateNamingUI();
  render();
});
btnNamingCancel.addEventListener("click", () => {
  if (!namingMode) return;
  stopNamingMode(false);
  render();
  toast("已取消命名（未保存）");
});
btnNamingDone.addEventListener("click", () => {
  if (!namingMode) return;
  save();
  stopNamingMode(true);
  renderLegendAndStats();
  render();
  toast("✅ 點位命名已完成並保存。");
});

/* =====================
   Drag Sort（地圖/魔靈）
===================== */
function initDragSort(listEl){
  let dragging = null;
  listEl.querySelectorAll("li").forEach(li => {
    li.addEventListener("dragstart", (e) => {
      dragging = li;
      li.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      try{ e.dataTransfer.setData("text/plain", li.dataset.id || ""); }catch(_){}
    });
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      dragging = null;
    });
    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!dragging || dragging === li) return;
      const r = li.getBoundingClientRect();
      const after = (e.clientY - r.top) > r.height/2;
      if (after) li.after(dragging);
      else li.before(dragging);
    });
  });
}

/* =====================
   地圖排序
===================== */
btnSortMaps.addEventListener("click", () => openMapSortModal());
btnSortCancel.addEventListener("click", () => closeMapSortModal(false));
btnSortDone.addEventListener("click", () => closeMapSortModal(true));

function openMapSortModal(){
  sortList.innerHTML = "";
  data.maps.forEach(mp => {
    const li = document.createElement("li");
    li.draggable = true;
    li.dataset.id = mp.id;
    li.innerHTML = `<span class="drag-handle">≡</span><span class="sort-name">${escapeHtml(mp.name||"未命名地圖")}</span>`;
    sortList.appendChild(li);
  });
  sortModal.hidden = false;
  sortModal.setAttribute("aria-hidden","false");
  initDragSort(sortList);
}
function closeMapSortModal(apply){
  if (apply){
    const order = Array.from(sortList.children).map(li => li.dataset.id);
    data.maps.sort((a,b) => order.indexOf(a.id) - order.indexOf(b.id));
    save();
    renderMapSelect(true);
    renderLegendAndStats();
  }
  sortModal.hidden = true;
  sortModal.setAttribute("aria-hidden","true");
  sortList.innerHTML = "";
  render();
}

/* =====================
   匯出 / 導入
===================== */
btnExport.addEventListener("click", () => {
  const payload = {
    version: 8,
    exportedAt: Date.now(),
    data,
    ui: {
      showPointLabels,
      pointLabelMode,
      customEnabled,
      focusMode,
      leftDockCollapsed: leftDock.classList.contains("collapsed"),
      rightDockCollapsed: rightDock.classList.contains("collapsed"),
    }
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mapTaskTool_export_${formatDateForFile(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 1000);
});

btnImport.addEventListener("click", () => fileImport.click());
fileImport.addEventListener("change", async () => {
  const f = fileImport.files?.[0];
  fileImport.value = "";
  if (!f) return;
  if (f.size > IMPORT_MAX_BYTES) return alert("❌ 檔案過大，請確認匯出檔是否正確。");

  const text = await f.text();
  let incoming = null;
  try{ incoming = JSON.parse(text); }catch(e){ return alert("❌ JSON 格式錯誤。"); }

  const incomingData = incoming?.data ?? incoming;
  try{ assertValidData(incomingData); }catch(e){ return alert("❌ 匯入資料格式不正確。"); }

  if ((incomingData.markers||[]).length > IMPORT_MAX_MARKERS){
    return alert("❌ 匯入點位太多（超過上限），請分批或精簡資料。");
  }

  data = incomingData;
  repairDataShapeAndMigrate();
  save();

  toast("✅ 已導入資料");
  renderMapSelect(false);
  syncCurrentMapUI();
  loadMapImageForCurrent(true);
  renderLegendAndStats();
  render();
});

/* =====================
   清空資料
===================== */
function openClearModal(){
  [c_maps,c_markers,c_states,c_pointNames,c_spiritsList,c_notesAll,c_query,c_prefs].forEach(x => x.checked = false);
  clearModal.hidden = false;
  clearModal.setAttribute("aria-hidden","false");
}
function closeClearModal(){
  clearModal.hidden = true;
  clearModal.setAttribute("aria-hidden","true");
}
btnClearAll.addEventListener("click", openClearModal);
btnClearClose.addEventListener("click", closeClearModal);
btnClearPickAll.addEventListener("click", () => {
  [c_maps,c_markers,c_states,c_pointNames,c_spiritsList,c_notesAll,c_query,c_prefs].forEach(x => x.checked = true);
});
btnClearPickNone.addEventListener("click", () => {
  [c_maps,c_markers,c_states,c_pointNames,c_spiritsList,c_notesAll,c_query,c_prefs].forEach(x => x.checked = false);
});

function resetPrefs(){
  [
    CUSTOM_SESSION_KEY, FOCUS_KEY, LABEL_TOGGLE_KEY, LABEL_MODE_KEY,
    VIEW_KEY, LEFT_DOCK_KEY, RIGHT_DOCK_KEY, RECENT_NAME_KEY, NAMING_HUD_COLLAPSE_KEY
  ].forEach(k => localStorage.removeItem(k));
  Object.keys(localStorage).filter(k => k.startsWith("fold::")).forEach(k => localStorage.removeItem(k));

  customEnabled = false;
  focusMode = false;
  showPointLabels = true;
  pointLabelMode = "all";
  applyCustomUI();
  applyFocusUI();
  applyPointLabelUI();
  applyDockState();
  initFolds();
}

btnClearApply.addEventListener("click", () => {
  const any = [c_maps,c_markers,c_states,c_pointNames,c_spiritsList,c_notesAll,c_query,c_prefs].some(x=>x.checked);
  if (!any) return alert("請先勾選要清空的項目。");

  if (c_maps.checked){
    const base = createDefaultData();
    if (!c_spiritsList.checked) base.spirits = data.spirits;
    data = base;
  }

  if (c_markers.checked) data.markers = [];
  if (c_states.checked) data.markers.forEach(mk => mk.state = 0);
  if (c_pointNames.checked) data.markers.forEach(mk => mk.pointName = "");
  if (c_notesAll.checked) data.markers.forEach(mk => mk.spiritTags = []);
  if (c_spiritsList.checked){
    const base = createDefaultData();
    data.spirits = base.spirits;
    data.markers.forEach(mk => mk.spiritTags = []);
  }
  if (c_query.checked){
    selectedSpiritTags.clear();
    activeSpiritPickTag = null;
    panelSelectedSpiritTags = new Set();
    panelActiveSpiritPickTag = null;
  }
  if (c_prefs.checked) resetPrefs();

  repairDataShapeAndMigrate();
  save();
  closeClearModal();
  toast("✅ 已清空選取項目");
  renderMapSelect(false);
  syncCurrentMapUI();
  loadMapImageForCurrent(true);
  renderLegendAndStats();
  render();
});

btnClearInitAll.addEventListener("click", () => {
  if (!confirm("⚠️ 這會初始化（全部清空）並回到預設地圖/示範魔靈。\n確定要繼續？")) return;
  data = createDefaultData();
  resetPrefs();
  repairDataShapeAndMigrate();
  save();
  closeClearModal();
  toast("✅ 已初始化全部資料");
  renderMapSelect(false);
  syncCurrentMapUI();
  loadMapImageForCurrent(true);
  renderLegendAndStats();
  render();
});

/* =====================
   切地圖 / 改名
===================== */
mapSelect.addEventListener("change", () => {
  data.currentMapId = mapSelect.value;
  setMode("normal");
  stopAnnotateMode();
  stopNamingMode(false);
  syncCurrentMapUI();
  save();
  loadMapImageForCurrent(true);
  render();
});
mapNameInput.addEventListener("input", () => {
  if (!customEnabled) return;
  const m = getCurrentMap();
  if (!m) return;
  m.name = mapNameInput.value.trim() || "未命名地圖";
  renderMapSelect(true);
  save();
  renderLegendAndStats();
});

/* =====================
   自定義新增/刪除點位模式
===================== */
function applyModeButtons(){
  btnCustomToggleAddMarker?.classList.toggle("active", mode === "addMarker");
  btnCustomToggleDeleteMarker?.classList.toggle("active", mode === "deleteMarker");
  btnCustomToggleNameMarker?.classList.toggle("active", namingMode);
}
function isAddMarkerMode(){ return !!customEnabled && mode === "addMarker"; }

btnCustomToggleAddMarker?.addEventListener("click", () => {
  if (!customEnabled) return;
  if (annotateMode) stopAnnotateMode();
  stopNamingMode(false);
  setMode(mode === "addMarker" ? "normal" : "addMarker");
});
btnCustomToggleDeleteMarker?.addEventListener("click", () => {
  if (!customEnabled) return;
  if (annotateMode) stopAnnotateMode();
  stopNamingMode(false);
  setMode(mode === "deleteMarker" ? "normal" : "deleteMarker");
});

/* =====================
   滾輪縮放 + 拖曳平移 + 雙指縮放
===================== */
mapContainer.addEventListener("wheel", (e) => {
  e.preventDefault();
  const factor = (e.deltaY > 0) ? 0.92 : 1.08;
  zoomBy(factor, e.clientX, e.clientY);
}, { passive:false });

let isPanning = false;
let panStart = null;
const pointers = new Map();
let pinchStart = null;

function dist(a,b){
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.hypot(dx,dy);
}
let suppressNextClick = false;
let movedDuringPan = false;

mapContainer.addEventListener("contextmenu", (e) => e.preventDefault(), { capture:true });

mapContainer.addEventListener("pointerdown", (e) => {
  const leftPanAllowed = (e.button === 0 && !isAddMarkerMode());
  const trackGesture = (e.pointerType === "touch") || (e.button === 2) || leftPanAllowed;
  if (!trackGesture) return;
  if (e.target?.closest?.(".marker-hit")) return;
  if (e.button === 2) e.preventDefault();

  mapContainer.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 1) {
    const canStartPan = (e.button === 2) || leftPanAllowed || (e.pointerType === "touch" && !isAddMarkerMode());
    if (canStartPan) {
      isPanning = true;
      movedDuringPan = false;
      panStart = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
      mapContainer.classList.add("panning");
      markMapMoving();
    } else {
      isPanning = false;
      panStart = null;
      mapContainer.classList.remove("panning");
    }
  } else if (pointers.size === 2) {
    const arr = Array.from(pointers.values());
    const midX = (arr[0].x + arr[1].x) / 2;
    const midY = (arr[0].y + arr[1].y) / 2;
    pinchStart = { dist: dist(arr[0], arr[1]), scale: view.scale, midX, midY };
  }
});

mapContainer.addEventListener("pointermove", (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 2 && pinchStart) {
    const arr = Array.from(pointers.values());
    const d = dist(arr[0], arr[1]);
    const ratio = d / (pinchStart.dist || 1);

    const midX = (arr[0].x + arr[1].x) / 2;
    const midY = (arr[0].y + arr[1].y) / 2;

    const dmx = midX - pinchStart.midX;
    const dmy = midY - pinchStart.midY;

    setScale(pinchStart.scale * ratio, midX, midY);

    view.tx += dmx;
    view.ty += dmy;
    clampView();
    applyTransform();
    markMapMovingThrottled();

    pinchStart.midX = midX;
    pinchStart.midY = midY;
    return;
  }

  if (!isPanning || !panStart) return;

  const dx = e.clientX - panStart.x;
  const dy = e.clientY - panStart.y;
  if (!movedDuringPan && (Math.abs(dx) + Math.abs(dy) > 6)) movedDuringPan = true;

  view.tx = panStart.tx + dx;
  view.ty = panStart.ty + dy;
  clampView();
  applyTransform();
  markMapMovingThrottled();
});

function endPointer(e){
  if (pointers.has(e.pointerId)) pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchStart = null;

  if (pointers.size === 0){
    isPanning = false;
    panStart = null;
    mapContainer.classList.remove("panning");
    if (movedDuringPan && !isAddMarkerMode()) suppressNextClick = true;
    markMapMoving();
    scheduleDeclutter();
  }
}
mapContainer.addEventListener("pointerup", endPointer);
mapContainer.addEventListener("pointercancel", endPointer);
mapContainer.addEventListener("lostpointercapture", endPointer);

/* 點地圖新增點位 */
mapContainer.addEventListener("click", (e) => {
  if (suppressNextClick){
    suppressNextClick = false;
    if (!(customEnabled && mode === "addMarker")) return;
  }

  const m = getCurrentMap();
  if (!m) return;

  // ✅ 新增點位模式：點空白新增
  if ((customEnabled && mode === "addMarker") && !e.target?.closest?.(".marker-hit")){
    const rect = mapContainer.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const iw = mapImg.clientWidth || 0;
    const ih = mapImg.clientHeight || 0;
    if (!iw || !ih) return;

    const sx = (px - view.tx) / view.scale;
    const sy = (py - view.ty) / view.scale;

    const x = sx / iw;
    const y = sy / ih;

    data.markers.push({
      id: uid(), mapId: m.id, x: clamp01(x), y: clamp01(y),
      state: 0, createdAt: Date.now(),
      spiritTags: [],
      pointName: ""
    });
    save();
    renderLegendAndStats();
    render();
    toast("✅ 已新增點位");
  }
});

/* =====================
   聚焦按鈕 / 重置視角
===================== */
btnFocusMode.addEventListener("click", () => {
  focusMode = !focusMode;
  localStorage.setItem(FOCUS_KEY, focusMode ? "1" : "0");
  applyFocusUI();
  render();
});
btnViewReset.addEventListener("click", resetView);

window.addEventListener("resize", () => {
  setHeaderHeightVar();
  clampView();
  applyTransform();
  scheduleDeclutter();
});

/* =====================
   Map load / view restore
===================== */
mapImg.addEventListener("load", () => {
  setHeaderHeightVar();
  mapStage.style.width = mapImg.clientWidth + "px";
  mapStage.style.height = mapImg.clientHeight + "px";

  let applied = false;
  try{
    const sv = JSON.parse(localStorage.getItem(VIEW_KEY) || "null");
    if (sv && typeof sv === "object"){
      const s = Number(sv.scale);
      const tx = Number(sv.tx), ty = Number(sv.ty);
      if (Number.isFinite(s) && Number.isFinite(tx) && Number.isFinite(ty)){
        view.scale = Math.max(VIEW_MIN, Math.min(VIEW_MAX, s));
        view.tx = tx; view.ty = ty;
        clampView();
        applyTransform();
        applied = true;
      }
    }
  }catch(_){}
  if (!applied) resetView();

  scheduleDeclutter();
  render();
});

/* =====================
   Legend / Stats
===================== */
function computeCountsByMap(){
  const map = new Map();
  for (const mp of data.maps) map.set(mp.id, { s1: 0, s3: 0 });
  for (const mk of data.markers){
    const c = map.get(mk.mapId);
    if (!c) continue;
    if (mk.state === 1) c.s1++;
    if (mk.state === 3) c.s3++;
  }
  return map;
}
function formatIdxName(idx, name){
  const n = (name || "").trim();
  return n ? `#${idx}(${n})` : `#${idx}`;
}
function isMarkerMatchedBySelected(mk){
  if (!mk) return false;
  if (!selectedSpiritTags.size) return false;
  const tags = (mk.spiritTags || []).map(normalizeSpiritTag).filter(Boolean);
  return tags.some(t => selectedSpiritTags.has(t));
}
function countMarkersForSelected(selSet){
  const set = selSet instanceof Set ? selSet : new Set(selSet||[]);
  if (!set.size) return 0;
  let n=0;
  for (const mk of data.markers){
    const tags = (mk.spiritTags || []).map(normalizeSpiritTag).filter(Boolean);
    if (tags.some(t => set.has(t))) n++;
  }
  return n;
}
function getAllMatchesForTag(tag){
  const out = [];
  for (const mp of data.maps){
    const arr = getMarkersInMap(mp.id);
    const items = [];
    arr.forEach((mk, i) => {
      const tags = (mk.spiritTags||[]).map(normalizeSpiritTag);
      if (tags.includes(tag)){
        items.push({ idx: i+1, name: (mk.pointName||"").trim() });
      }
    });
    if (items.length) out.push({ mapId: mp.id, mapName: mp.name || "未命名地圖", items });
  }
  return out;
}
function buildSpiritQueryLegendInner(){
  if (selectedSpiritTags.size === 0){
    return `<div class="muted">尚未勾選。按右側 <b>「🔎 查詢魔靈」</b> 開始篩選點位。</div>`;
  }

  const lines = Array.from(selectedSpiritTags).map(t => {
    const hits = getAllMatchesForTag(t);
    const total = hits.reduce((sum, h) => sum + h.items.length, 0);
    const name = displayNameFromTag(t);

    const detail = hits.length
      ? hits.map(h => {
          const nums = h.items.map(it => escapeHtml(formatIdxName(it.idx, it.name))).join("、");
          return `<div class="rowline" style="border-style:solid; border-color: rgba(255,255,255,.10); background: rgba(255,255,255,.03);">
            <b style="min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(h.mapName)}</b>
            <span class="muted" style="flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${nums}</span>
          </div>`;
        }).join("")
      : `<div class="muted">沒有任何點位符合。</div>`;

    return `
      <div class="rowline" style="border-style:solid; border-color: rgba(255,210,120,.22); background: rgba(255,255,255,.04);">
        ✅ <b style="min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(name)}</b>
        <span class="kbadge">符合 ${total}</span>
      </div>
      <div style="display:grid; gap:6px; margin-top:6px;">${detail}</div>
    `;
  }).join("");

  return `
    <div class="muted" style="margin-bottom:8px;">
      已勾選 <b>${selectedSpiritTags.size}</b> 個魔靈，總符合 <b>${countMarkersForSelected(selectedSpiritTags)}</b> 個點位。<br>
      顯示格式：<b>#編號(名稱)</b>（名稱需先用「🏷️ 點位命名」設定）
    </div>
    <div style="display:grid; gap:10px;">${lines}</div>
  `;
}
function renderLegendAndStats(){
  if (!legendEl) return;

  const legendItems = stateIcons.map((src, i) => `
    <div class="rowline" style="justify-content:space-between;">
      <span class="chk" style="flex:1 1 auto;">
        <img src="${src}" alt="狀態${i}" style="width:20px;height:20px;border-radius:6px;">
        <span class="name">${escapeHtml(stateLegend[i] ?? `狀態 ${i}`)}</span>
      </span>
      <span class="kbadge">#${i}</span>
    </div>
  `).join("");

  const countsByMap = computeCountsByMap();
  const statsRows = data.maps.map(mp => {
    const c = countsByMap.get(mp.id) || { s1: 0, s3: 0 };
    return `
      <div class="rowline" style="justify-content:space-between;">
        <div class="name" style="flex:1 1 auto; min-width:0;">${escapeHtml(mp.name || "未命名地圖")}</div>
        <div style="display:flex; gap:8px; flex:0 0 auto;">
          <span class="kbadge" title="state1 數量">✅ ${c.s1}</span>
          <span class="kbadge" title="state3 數量">⚠️ ${c.s3}</span>
        </div>
      </div>
    `;
  }).join("");

  const failedMaps = data.maps
    .filter(mp => (countsByMap.get(mp.id)?.s3 ?? 0) > 0)
    .map(mp => `<div class="rowline" style="border-color: rgba(255,120,120,.25); background: rgba(255,120,120,.06);">上次「${escapeHtml(mp.name || "未命名地圖")}」有魔靈捕捉失敗</div>`)
    .join("");

  const failBlock = failedMaps ? `${failedMaps}` : `<div class="muted">目前沒有魔靈捕捉失敗。</div>`;
  const cur = getCurrentMap();
  const namedCount = cur ? getMarkersInMap(cur.id).filter(mk => (mk.pointName||"").trim()).length : 0;

  const nameBlock = `
    <div class="muted">
      本地圖已命名：<b>${namedCount}</b><br>
      顯示標籤：<b>${showPointLabels ? "ON" : "OFF"}</b>
    </div>
  `;

  const queryInner = buildSpiritQueryLegendInner();

  legendEl.innerHTML = `
    <details class="fold" open data-fold-key="legend_status">
      <summary>🧩 點位狀態</summary>
      <div class="fold-body">${legendItems}</div>
    </details>

    <div style="height:10px;"></div>

    <details class="fold" open data-fold-key="legend_stats">
      <summary>📊 地圖統計</summary>
      <div class="fold-body">${statsRows}</div>
    </details>

    <div style="height:10px;"></div>

    <details class="fold" data-fold-key="legend_naming">
      <summary>🏷️ 點位命名</summary>
      <div class="fold-body">${nameBlock}</div>
    </details>

    <div style="height:10px;"></div>

    <details class="fold" open data-fold-key="legend_query">
      <summary>🔎 查詢結果</summary>
      <div class="fold-body">${queryInner}</div>
    </details>

    <div style="height:10px;"></div>

    <details class="fold" data-fold-key="legend_fail">
      <summary>⚠️ 提醒</summary>
      <div class="fold-body">${failBlock}</div>
    </details>
  `;

  initFolds(legendEl);
}

/* =====================
   查詢魔靈：渲染（含管理）
===================== */
function buildInfoBoxHtml(){
  const total = data.spirits.length;
  const selectedCount = panelSelectedSpiritTags.size;
  const totalMatches = countMarkersForSelected(panelSelectedSpiritTags);

  const curMap = getCurrentMap();
  const curMapName = curMap?.name || "未命名地圖";
  const tagsThis = Array.from(panelSelectedSpiritTags);

  const perSpiritBlocks = tagsThis.slice(0, 8).map(t => {
    const dispName = displayNameFromTag(t);
    const items = getMatchesInCurrentMapForTag(t);
    const totalInMap = items.length;
    const shown = items.slice(0, 18).map(x => escapeHtml(formatIdxName(x.idx, x.name))).join("、");
    return `
      <div class="rowline" style="border-style:solid; border-color: rgba(255,255,255,.10); background: rgba(255,255,255,.03);">
        <b style="min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(dispName)}</b>
        <span class="kbadge">本地圖 ${totalInMap}</span>
        <div class="muted" style="width:100%; white-space:normal; overflow-wrap:anywhere;">
          ${totalInMap ? `${shown}${totalInMap>18 ? `、…等 ${totalInMap} 個` : ""}` : `（本地圖沒有符合點位）`}
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="muted">
      魔靈總數：<b>${total}</b><br>
      勾選：<b>${selectedCount}</b>｜總符合點位：<b>${totalMatches}</b><br>
      <b>本地圖（${escapeHtml(curMapName)}）</b>：顯示格式 <b>#編號(名稱)</b>
    </div>
    <div class="panel-sep"></div>
    <div style="display:grid; gap:8px;">
      ${perSpiritBlocks || `<div class="muted">（尚未勾選魔靈）</div>`}
    </div>
  `;
}
function getMatchesInCurrentMapForTag(tag){
  const m = getCurrentMap();
  if (!m) return [];
  const arr = getMarkersInMap(m.id);
  const items = [];
  arr.forEach((mk, i) => {
    const tags = (mk.spiritTags || []).map(normalizeSpiritTag);
    if (tags.includes(tag)){
      items.push({ idx: i+1, name: (mk.pointName||"").trim() });
    }
  });
  return items;
}

function renderSpiritDialog(){
  // list
  const list = getFilteredSpirits();
  spiritList.innerHTML = list.length ? "" : `<div class="muted">（沒有符合的魔靈）</div>`;

  list.forEach(s => {
    const id = s.id;
    const checked = panelSelectedSpiritTags.has(id);
    const row = document.createElement("div");
    row.className = "rowline";
    row.innerHTML = `
      <label class="chk">
        <input type="checkbox" ${checked ? "checked":""} data-sel="${escapeHtml(id)}" />
        <span class="name">${escapeHtml(s.name || "未命名魔靈")}</span>
      </label>
      <span class="kbadge">符合 ${countMarkersForTag(id)}</span>
    `;
    spiritList.appendChild(row);
  });

  spiritList.querySelectorAll('input[type="checkbox"][data-sel]').forEach(cb => {
    cb.addEventListener("change", () => {
      const id = cb.getAttribute("data-sel");
      if (!id) return;
      if (cb.checked) panelSelectedSpiritTags.add(id);
      else panelSelectedSpiritTags.delete(id);
      spiritInfoBox.innerHTML = buildInfoBoxHtml();
      renderLegendAndStats();
      updateAnnotateButtonState();
      render();
    });
  });

  spiritInfoBox.innerHTML = buildInfoBoxHtml();

  // manage
  if (customEnabled){
    renderSpiritManage();
  }else{
    spiritManageList.innerHTML = "";
  }

  updateAnnotateButtonState();
}

function countMarkersForTag(tag){
  let n=0;
  for (const mk of data.markers){
    const tags = (mk.spiritTags||[]).map(normalizeSpiritTag);
    if (tags.includes(tag)) n++;
  }
  return n;
}

function renderSpiritManage(){
  const list = panelSpiritsDraft.slice();
  spiritManageList.innerHTML = list.length ? "" : `<div class="muted">（尚無魔靈）</div>`;

  list.forEach(s => {
    const id = s.id;
    const selectedForDelete = panelManageDeleteIds.has(id);
    const isTarget = (panelActiveSpiritPickTag === id);

    const row = document.createElement("div");
    row.className = "rowline";
    row.innerHTML = `
      <label class="chk" style="flex:1 1 auto;">
        <input type="checkbox" data-del="${escapeHtml(id)}" ${selectedForDelete ? "checked":""} />
        <span class="name">${escapeHtml(s.name || "未命名魔靈")}</span>
      </label>

      <button type="button" data-settarget="${escapeHtml(id)}" class="${isTarget ? "primary active":"primary"}" title="設定/取消註記目標">
        🎯 ${isTarget ? "目標" : "設目標"}
      </button>

      <button type="button" data-rename="${escapeHtml(id)}" title="改名">✏️</button>
    `;
    spiritManageList.appendChild(row);
  });

  spiritManageList.querySelectorAll('[data-del]').forEach(el => {
    el.addEventListener("change", () => {
      const id = el.getAttribute("data-del");
      if (!id) return;
      if (el.checked) panelManageDeleteIds.add(id);
      else panelManageDeleteIds.delete(id);
      manageSelectedBadge.textContent = `已選：${panelManageDeleteIds.size}`;
    });
  });

  spiritManageList.querySelectorAll('[data-settarget]').forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-settarget");
      if (!id) return;
      panelActiveSpiritPickTag = (panelActiveSpiritPickTag === id) ? null : id;
      renderSpiritDialog();
    });
  });

  spiritManageList.querySelectorAll('[data-rename]').forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-rename");
      const s = panelSpiritsDraft.find(x => x.id === id);
      if (!s) return;
      const next = prompt("修改魔靈名稱：", s.name || "");
      if (next === null) return;
      s.name = next.trim() || "未命名魔靈";
      renderSpiritDialog();
    });
  });

  manageSelectedBadge.textContent = `已選：${panelManageDeleteIds.size}`;
}

/* 管理工具列 */
btnManageSelectAll.addEventListener("click", () => {
  panelManageDeleteIds = new Set(panelSpiritsDraft.map(s => s.id));
  renderSpiritDialog();
});
btnManageClear.addEventListener("click", () => {
  panelManageDeleteIds = new Set();
  renderSpiritDialog();
});
btnManageBulkDelete.addEventListener("click", () => {
  if (!panelManageDeleteIds.size) return alert("請先勾選要刪除的魔靈。");
  if (!confirm(`確定要刪除 ${panelManageDeleteIds.size} 個魔靈？（會同時移除所有點位上的對應註記）`)) return;

  panelDeletedSpiritIds = new Set([...panelDeletedSpiritIds, ...panelManageDeleteIds]);
  panelSpiritsDraft = panelSpiritsDraft.filter(s => !panelManageDeleteIds.has(s.id));

  // 若刪到目標，清空
  if (panelActiveSpiritPickTag && panelManageDeleteIds.has(panelActiveSpiritPickTag)){
    panelActiveSpiritPickTag = null;
  }
  panelManageDeleteIds = new Set();
  renderSpiritDialog();
});

/* =====================
   ✅ 魔靈排序 Modal
===================== */
btnOpenSpiritSort.addEventListener("click", () => openSpiritSortModal());
btnSpiritSortCancel.addEventListener("click", () => closeSpiritSortModal(false));
btnSpiritSortDone.addEventListener("click", () => closeSpiritSortModal(true));

function openSpiritSortModal(){
  spiritSortList.innerHTML = "";
  panelSpiritsDraft.forEach(sp => {
    const li = document.createElement("li");
    li.draggable = true;
    li.dataset.id = sp.id;
    li.innerHTML = `<span class="drag-handle">≡</span><span class="sort-name">${escapeHtml(sp.name||"未命名魔靈")}</span>`;
    spiritSortList.appendChild(li);
  });
  spiritSortModal.hidden = false;
  spiritSortModal.setAttribute("aria-hidden","false");
  initDragSort(spiritSortList);
}
function closeSpiritSortModal(apply){
  if (apply){
    const order = Array.from(spiritSortList.children).map(li => li.dataset.id);
    panelSpiritsDraft.sort((a,b) => order.indexOf(a.id) - order.indexOf(b.id));
    renderSpiritDialog();
  }
  spiritSortModal.hidden = true;
  spiritSortModal.setAttribute("aria-hidden","true");
  spiritSortList.innerHTML = "";
}

/* =====================
   ✅ 點位配對（註記）- 已移除形態
===================== */
btnOpenPairing.addEventListener("click", () => {
  if (!customEnabled) return;
  pairReturnToSpiritDialog = !!spiritDialog.open;
  if (pairReturnToSpiritDialog) spiritDialog.close();
  openPairModal();
});

btnPairClose.addEventListener("click", () => {
  closePairModal();
  if (pairReturnToSpiritDialog){
    syncPanelFromApplied();
    renderSpiritDialog();
    spiritDialog.showModal();
  }
});

function openPairModal(){
  // populate spirit select
  pairSpiritSelect.innerHTML = "";
  panelSpiritsDraft.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name || "未命名魔靈";
    pairSpiritSelect.appendChild(opt);
  });

  if (panelActiveSpiritPickTag && panelSpiritsDraft.some(s=>s.id===panelActiveSpiritPickTag)){
    pairSpiritSelect.value = panelActiveSpiritPickTag;
  }

  pairNameSearch.value = "";
  renderPairNameList();
  updatePairPreview();
  pairModal.hidden = false;
  pairModal.setAttribute("aria-hidden","false");
}

function closePairModal(){
  pairModal.hidden = true;
  pairModal.setAttribute("aria-hidden","true");
  pairNameList.innerHTML = "";
}

pairSpiritSelect.addEventListener("change", updatePairPreview);
pairNameSearch.addEventListener("input", renderPairNameList);

btnPairSelectAllNames.addEventListener("click", () => {
  pairNameList.querySelectorAll('input[type="checkbox"][data-pn]').forEach(cb => cb.checked = true);
  updatePairPreview();
});
btnPairClearNames.addEventListener("click", () => {
  pairNameList.querySelectorAll('input[type="checkbox"][data-pn]').forEach(cb => cb.checked = false);
  updatePairPreview();
});

function getNamedPointNamesInCurrentMap(){
  const m = getCurrentMap();
  if (!m) return [];
  const arr = getMarkersInMap(m.id);
  const set = new Set();
  arr.forEach(mk => {
    const n = (mk.pointName || "").trim();
    if (n) set.add(n);
  });
  return Array.from(set).sort((a,b)=>a.localeCompare(b, "zh-Hant"));
}

function renderPairNameList(){
  const kw = (pairNameSearch.value || "").trim().toLowerCase();
  let names = getNamedPointNamesInCurrentMap();
  if (kw) names = names.filter(n => n.toLowerCase().includes(kw));

  pairNameList.innerHTML = names.length ? "" : `<div class="muted">（本地圖沒有已命名的點位）</div>`;

  names.forEach(n => {
    const row = document.createElement("div");
    row.className = "pair-row";
    row.innerHTML = `
      <label class="chk">
        <input type="checkbox" data-pn="${escapeHtml(n)}" />
        <span class="name">${escapeHtml(n)}</span>
      </label>
      <span class="kbadge" title="同名點位數量">${countMarkersByPointName(n)}</span>
    `;
    pairNameList.appendChild(row);
  });

  pairNameList.querySelectorAll('input[type="checkbox"][data-pn]').forEach(cb => {
    cb.addEventListener("change", updatePairPreview);
  });
  updatePairPreview();
}

function countMarkersByPointName(name){
  const m = getCurrentMap();
  if (!m) return 0;
  return getMarkersInMap(m.id).filter(mk => (mk.pointName||"").trim() === name).length;
}

function getCheckedPairNames(){
  return Array.from(pairNameList.querySelectorAll('input[type="checkbox"][data-pn]:checked'))
    .map(cb => cb.getAttribute("data-pn"))
    .filter(Boolean);
}

function updatePairPreview(){
  const spiritId = pairSpiritSelect.value || "";
  const spiritName = displayNameFromTag(spiritId);
  const names = getCheckedPairNames();
  const totalMarkers = names.reduce((sum, n) => sum + countMarkersByPointName(n), 0);

  pairPreview.innerHTML = `
    目標魔靈：<b>${escapeHtml(spiritName)}</b><br>
    已選名稱：<b>${names.length}</b>｜涉及點位：<b>${totalMarkers}</b>
  `;
}

btnPairApply.addEventListener("click", () => {
  const spiritId = pairSpiritSelect.value || "";
  if (!spiritId) return alert("請先選擇魔靈。");

  const names = getCheckedPairNames();
  if (!names.length) return toast("未選擇點位", 1600);

  const m = getCurrentMap();
  if (!m) return;

  const setNames = new Set(names);
  const markers = getMarkersInMap(m.id);

  let changed = 0;
  markers.forEach(mk => {
    const pn = (mk.pointName||"").trim();
    if (!pn || !setNames.has(pn)) return;
    mk.spiritTags = Array.isArray(mk.spiritTags) ? mk.spiritTags.map(normalizeSpiritTag).filter(Boolean) : [];
    if (!mk.spiritTags.includes(spiritId)){
      mk.spiritTags.push(spiritId);
      changed++;
    }
  });

  save();
  renderLegendAndStats();
  render();
  toast(`✅ 已配對：${displayNameFromTag(spiritId)}（新增 ${changed} 筆）`);

  // ✅ 配對後清空勾選（避免重複誤按）
  pairNameList.querySelectorAll('input[type="checkbox"][data-pn]').forEach(cb => cb.checked = false);
  updatePairPreview();
});

btnPairUnpair.addEventListener("click", () => {
  const spiritId = pairSpiritSelect.value || "";
  if (!spiritId) return alert("請先選擇魔靈。");

  const names = getCheckedPairNames();
  if (!names.length) return toast("未選擇點位", 1600);

  const m = getCurrentMap();
  if (!m) return;

  const setNames = new Set(names);
  const markers = getMarkersInMap(m.id);

  let changed = 0;
  markers.forEach(mk => {
    const pn = (mk.pointName||"").trim();
    if (!pn || !setNames.has(pn)) return;
    const before = (mk.spiritTags || []).map(normalizeSpiritTag).filter(Boolean);
    const after = before.filter(x => x !== spiritId);
    if (after.length !== before.length){
      mk.spiritTags = after;
      changed++;
    }
  });

  save();
  renderLegendAndStats();
  render();
  toast(`✅ 已取消配對：${displayNameFromTag(spiritId)}（影響 ${changed} 個點位）`);

  // ✅ 取消後清空勾選
  pairNameList.querySelectorAll('input[type="checkbox"][data-pn]').forEach(cb => cb.checked = false);
  updatePairPreview();
});

/* =====================
   自定義：新增/刪除地圖、上傳
===================== */
btnAddMap?.addEventListener("click", () => {
  if (!customEnabled) return;
  fileMap.click();
  fileMap.onchange = async () => {
    const f = fileMap.files?.[0];
    fileMap.value = "";
    if (!f) return;

    const url = URL.createObjectURL(f);
    const id = uid();
    const name = prompt("新地圖名稱：", `新地圖 ${data.maps.length + 1}`);
    data.maps.push({ id, name: (name||"").trim() || `新地圖 ${data.maps.length + 1}`, src: url });
    data.currentMapId = id;
    save();
    renderMapSelect(false);
    syncCurrentMapUI();
    loadMapImageForCurrent(true);
    renderLegendAndStats();
    render();
    toast("✅ 已新增地圖");
  };
});

btnDeleteMap?.addEventListener("click", () => {
  if (!customEnabled) return;
  const m = getCurrentMap();
  if (!m) return;
  if (!confirm(`確定要刪除地圖「${m.name}」？（該地圖點位也會移除）`)) return;

  const id = m.id;
  data.maps = data.maps.filter(x => x.id !== id);
  data.markers = data.markers.filter(mk => mk.mapId !== id);
  data.currentMapId = data.maps[0]?.id ?? null;
  save();
  renderMapSelect(false);
  syncCurrentMapUI();
  loadMapImageForCurrent(true);
  renderLegendAndStats();
  render();
  toast("✅ 已刪除地圖");
});

btnReplaceMapImage?.addEventListener("click", () => {
  if (!customEnabled) return;
  const m = getCurrentMap();
  if (!m) return;

  fileMap.click();
  fileMap.onchange = async () => {
    const f = fileMap.files?.[0];
    fileMap.value = "";
    if (!f) return;

    const url = URL.createObjectURL(f);
    m.src = url;
    save();
    loadMapImageForCurrent(true);
    render();
    toast("✅ 已更新地圖圖片");
  };
});

btnDeleteMarkersCurrent?.addEventListener("click", () => {
  if (!customEnabled) return;
  const m = getCurrentMap();
  if (!m) return;
  if (!confirm("確定要清空本地圖所有點位？")) return;
  data.markers = data.markers.filter(mk => mk.mapId !== m.id);
  save();
  renderLegendAndStats();
  render();
  toast("✅ 已清空本地圖點位");
});

btnDeleteAllMarkers?.addEventListener("click", () => {
  if (!customEnabled) return;
  if (!confirm("確定要刪除所有點位？")) return;
  data.markers = [];
  save();
  renderLegendAndStats();
  render();
  toast("✅ 已刪除所有點位");
});

/* =====================
   全部點位狀態重置
===================== */
btnResetAllStates.addEventListener("click", () => {
  if (!confirm("確定要把所有點位狀態重置為 #0？")) return;
  data.markers.forEach(mk => mk.state = 0);
  save();
  renderLegendAndStats();
  render();
  toast("✅ 已重置所有點位狀態");
});

/* =====================
   地圖載入
===================== */
function loadMapImageForCurrent(triggerRender){
  const m = getCurrentMap();
  if (!m){ mapImg.src = ""; return; }
  mapImg.src = m.src || "";
  if (triggerRender) render();
}

/* =====================
   點位渲染 + 點擊行為
===================== */
function getLabelPosClass(i){
  const mod = i % 4;
  return mod === 0 ? "pos-b" : mod === 1 ? "pos-t" : mod === 2 ? "pos-r" : "pos-l";
}

function handleMarkerClick(mkId, idxInMap, e){
  const mk = data.markers.find(x => x.id === mkId);
  if (!mk) return;

  // ✅ 命名模式：點選/反選（支援 Shift 連續選取）
  if (namingMode){
    const m = getCurrentMap();
    if (!m) return;
    const list = getMarkersInMap(m.id);
    const curIndex = list.findIndex(x => x.id === mkId);

    const isShift = e.shiftKey && (namingLastClickedIndex !== null) && (curIndex >= 0);
    if (isShift){
      const a = Math.min(namingLastClickedIndex, curIndex);
      const b = Math.max(namingLastClickedIndex, curIndex);
      for (let i=a;i<=b;i++){
        namingSelectedMarkerIds.add(list[i].id);
      }
    }else{
      if (namingSelectedMarkerIds.has(mkId)) namingSelectedMarkerIds.delete(mkId);
      else namingSelectedMarkerIds.add(mkId);
      namingLastClickedIndex = curIndex >= 0 ? curIndex : null;
    }
    updateNamingUI();
    render();
    return;
  }

  // ✅ 刪除點位模式
  if (customEnabled && mode === "deleteMarker"){
    if (!confirm("刪除此點位？")) return;
    data.markers = data.markers.filter(x => x.id !== mkId);
    save();
    renderLegendAndStats();
    render();
    toast("✅ 已刪除點位");
    return;
  }

  // ✅ 註記模式：切換該魔靈註記
  if (annotateMode && annotateTag){
    toggleMarkerTag(mkId, annotateTag);
    save();
    renderLegendAndStats();
    render();
    return;
  }

  // ✅ 一般：切換狀態 #0~#3
  mk.state = ((mk.state|0) + 1) % 4;
  save();
  renderLegendAndStats();
  render();
}

function renderMarkers(){
  const m = getCurrentMap();
  if (!m){ return; }
  const markers = getMarkersInMap(m.id);

  // 清空舊 marker DOM（保留 mapImg）
  Array.from(mapStage.querySelectorAll(".marker")).forEach(el => el.remove());
  markerElById = new Map();

  const frag = document.createDocumentFragment();

  markers.forEach((mk, i) => {
    const idx = i + 1;

    const matched = isMarkerMatchedBySelected(mk);
    const shouldDim = focusMode && selectedSpiritTags.size > 0 && !matched;

    const root = document.createElement("div");
    root.className = "marker";
    root.dataset.mid = mk.id;
    root.dataset.idx = String(idx);

    root.style.left = (mk.x * 100) + "%";
    root.style.top  = (mk.y * 100) + "%";

    const ico = document.createElement("img");
    ico.className = "marker-ico";
    ico.src = stateIcons[mk.state] || stateIcons[0];
    ico.alt = "marker";

    const hit = document.createElement("button");
    hit.className = "marker-hit";
    hit.type = "button";
    hit.title = `點位 #${idx}`;

    // 標記狀態 class
    if (matched) root.classList.add("hl");
    if (shouldDim) root.classList.add("dim");

    // 註記模式：目前目標已註記 -> assign
    if (annotateMode && annotateTag){
      const tags = (mk.spiritTags||[]).map(normalizeSpiritTag);
      if (tags.includes(annotateTag)) root.classList.add("assign");
    }

    // 命名模式：選取顯示
    if (namingMode && namingSelectedMarkerIds.has(mk.id)){
      root.classList.add("sel");
      const badge = document.createElement("div");
      badge.className = "sel-badge";
      badge.textContent = String(Array.from(namingSelectedMarkerIds).indexOf(mk.id) + 1);
      root.appendChild(badge);
    }

    hit.addEventListener("click", (e) => handleMarkerClick(mk.id, idx, e));

    // ✅ 點位名稱 OFF + 已勾選查詢魔靈：hover 顯示魔靈名稱/點位名稱
    hit.addEventListener("pointerenter", (e) => {
      hoverTipActiveMid = mk.id;
      showHoverTip(mk, idx, e);
    }, { passive:true });
    hit.addEventListener("pointermove", (e) => {
      if (hoverTipActiveMid !== mk.id) return;
      if (!shouldShowHoverTip()) return;
      positionHoverTip(e.clientX, e.clientY);
    }, { passive:true });
    hit.addEventListener("pointerleave", () => {
      if (hoverTipActiveMid === mk.id) hideHoverTip();
    }, { passive:true });

    root.appendChild(ico);
    root.appendChild(hit);

    // labels are handled by smart declutter (updatePointLabelsNow)

    frag.appendChild(root);
    markerElById.set(mk.id, root);
  });

  mapStage.appendChild(frag);
  scheduleDeclutter();
}

/* =====================
   render
===================== */
function render(){
  // header / mode label
  modeLabel.textContent =
    namingMode ? "點位命名" :
    annotateMode ? "魔靈註記" :
    (mode === "addMarker" ? "新增點位" :
     mode === "deleteMarker" ? "刪除點位" : "一般");

  applyModeButtons();
  applyCustomUI();
  applyPointLabelUI();
  applyFocusUI();
  applyDockState();

  renderMarkers();
}

/* =====================
   點位配對/聚焦相關
===================== */
btnTogglePointLabels && applyPointLabelUI();
applyCustomUI();
applyFocusUI();

/* =====================
   啟動：load + migrate + init
===================== */
ensureBuiltinPresetOnFirstRun();
load();
repairDataShapeAndMigrate();

renderMapSelect(false);
syncCurrentMapUI();
applyDockState();

loadMapImageForCurrent(false);
renderLegendAndStats();
render();

/* =====================
   外層：初始化視角若圖片已快取載入
===================== */
setTimeout(() => {
  setHeaderHeightVar();
  clampView();
  applyTransform();
}, 0);

/* =====================
   清單工具：刪除/新增魔靈後即時更新配對下拉
===================== */
function refreshPairSpiritSelectIfOpen(){
  if (pairModal.hidden) return;
  const cur = pairSpiritSelect.value;
  pairSpiritSelect.innerHTML = "";
  panelSpiritsDraft.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name || "未命名魔靈";
    pairSpiritSelect.appendChild(opt);
  });
  if (cur && panelSpiritsDraft.some(s=>s.id===cur)) pairSpiritSelect.value = cur;
  updatePairPreview();
}

/* 讓排序/新增/刪除等後順便刷新配對下拉 */
const _renderSpiritDialogOriginal = renderSpiritDialog;
renderSpiritDialog = function(){
  _renderSpiritDialogOriginal();
  refreshPairSpiritSelectIfOpen();
};
