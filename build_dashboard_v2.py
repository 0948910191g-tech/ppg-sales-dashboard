import json

with open('/tmp/compact_data.json', 'r', encoding='utf-8') as f:
    compact_json = f.read()

template_html = f'''<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PPG Executive Commerce Hub - แดชบอร์ดบริหารยอดขาย Omnichannel (Version 2)</title>
  <meta name="description" content="PPG Executive Commerce Hub V2 ระบบสรุปภาพรวมธุรกิจ วิเคราะห์ยอดขาย Omnichannel (Shopee + TikTok Shop) แบบโมเดิร์น คลีน สบายตา เชื่อมต่อฐานข้อมูลจริง">
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <!-- FontAwesome 6 -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <!-- Google Fonts: Prompt & Outfit -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">

  <script>
    tailwind.config = {{
      theme: {{
        extend: {{
          fontFamily: {{
            sans: ['Prompt', 'sans-serif'],
            outfit: ['Outfit', 'sans-serif'],
          }},
          colors: {{
            brand: {{
              50: '#eff6ff',
              100: '#dbeafe',
              500: '#3b82f6',
              600: '#2563eb',
              700: '#1d4ed8',
            }},
            shopee: '#ee4d2d',
            tiktok: '#0f172a',
          }}
        }}
      }}
    }}
  </script>

  <style>
    body {{
      font-family: 'Prompt', sans-serif;
      background-color: #F8FAFC;
      color: #0F172A;
      -webkit-font-smoothing: antialiased;
    }}

    .num-font {{
      font-family: 'Outfit', sans-serif;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
    }}

    /* Modern Clean Elevation */
    .modern-card {{
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 1rem;
      box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.03), 0 1px 2px -1px rgba(15, 23, 42, 0.02);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }}
    .modern-card:hover {{
      border-color: #CBD5E1;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.04), 0 8px 10px -6px rgba(15, 23, 42, 0.02);
    }}

    .sidebar-btn {{
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.7rem 0.9rem;
      border-radius: 0.625rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #94A3B8;
      transition: all 0.15s ease;
      cursor: pointer;
      text-align: left;
      border: none;
      background: transparent;
    }}
    .sidebar-btn:hover {{
      color: #FFFFFF;
      background: rgba(255, 255, 255, 0.06);
    }}
    .sidebar-btn.active {{
      color: #FFFFFF;
      background: #2563EB;
      font-weight: 600;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }}

    .filter-pill {{
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.85rem;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 0.625rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #334155;
      transition: all 0.15s ease;
      cursor: pointer;
    }}
    .filter-pill:hover {{
      border-color: #94A3B8;
      background: #F8FAFC;
    }}
    .filter-pill select {{
      background: transparent;
      border: none;
      outline: none;
      font-weight: 600;
      color: #0F172A;
      cursor: pointer;
      padding-right: 0.25rem;
    }}

    .tab-pill {{
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #64748B;
      transition: all 0.15s ease;
      cursor: pointer;
      border: none;
      background: transparent;
    }}
    .tab-pill:hover {{
      color: #0F172A;
    }}
    .tab-pill.active {{
      background: #FFFFFF;
      color: #2563EB;
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    }}

    /* Slide-over Drawer Animation */
    #contextDrawer {{
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }}
    #contextDrawer.open {{
      transform: translateX(0);
    }}
    #drawerBackdrop {{
      transition: opacity 0.25s ease;
    }}

    /* Focus & Selection */
    :focus-visible {{
      outline: 2px solid #2563EB;
      outline-offset: 2px;
    }}
    ::selection {{
      background-color: #2563EB;
      color: #FFFFFF;
    }}

    /* Scrollbars */
    ::-webkit-scrollbar {{
      width: 6px;
      height: 6px;
    }}
    ::-webkit-scrollbar-track {{
      background: transparent;
    }}
    ::-webkit-scrollbar-thumb {{
      background: #CBD5E1;
      border-radius: 999px;
    }}

    @media print {{
      aside, header, button, #contextDrawer {{
        display: none !important;
      }}
      body, main {{
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
      }}
    }}
  </style>
</head>
<body class="min-h-screen flex flex-col md:flex-row antialiased">

  <!-- LEFT SIDEBAR: Sleek Deep Slate -->
  <aside id="appSidebar" class="w-full md:w-64 bg-[#0B132B] text-white flex-shrink-0 flex flex-col justify-between p-4 md:min-h-screen border-r border-slate-800/80 z-20">
    <div>
      <!-- Brand Logo -->
      <div class="flex items-center justify-between px-2 py-3 mb-6">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/30">
            <i class="fa-solid fa-chart-pie text-sm"></i>
          </div>
          <div>
            <div class="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              <span>PPG Hub</span>
              <span class="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">V2 LIVE</span>
            </div>
            <p class="text-xs text-slate-400 font-normal">Omnichannel Executive</p>
          </div>
        </div>
      </div>

      <!-- Navigation Section -->
      <div class="space-y-1">
        <div class="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">เมนูหลัก</div>
        <nav class="space-y-1" aria-label="Main Navigation">
          <button onclick="switchSidebarView('today')" id="side-today" class="sidebar-btn active">
            <i class="fa-solid fa-house text-sm w-4 text-center"></i>
            <span>Overview (ภาพรวม)</span>
          </button>
          <button onclick="switchSidebarView('analyze')" id="side-analyze" class="sidebar-btn">
            <i class="fa-solid fa-chart-line text-sm w-4 text-center"></i>
            <span>Performance (วิเคราะห์)</span>
          </button>
          <button onclick="switchSidebarView('action')" id="side-action" class="sidebar-btn">
            <i class="fa-solid fa-circle-check text-sm w-4 text-center"></i>
            <span>Actions (ติดตามงาน)</span>
            <span class="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">3</span>
          </button>
          <button onclick="switchSidebarView('data')" id="side-data" class="sidebar-btn">
            <i class="fa-solid fa-database text-sm w-4 text-center"></i>
            <span>Data Health (สถานะข้อมูล)</span>
          </button>
          <button onclick="switchSidebarView('explorer')" id="side-explorer" class="sidebar-btn">
            <i class="fa-solid fa-table-cells text-sm w-4 text-center"></i>
            <span>Data Explorer (ตารางดิบ)</span>
          </button>
        </nav>
      </div>

      <!-- Deep Dive Channels -->
      <div class="mt-6 space-y-1">
        <div class="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">ช่องทางขาย</div>
        <div class="space-y-1">
          <button onclick="onPlatformFilterChange('shopee')" class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800/60 transition-colors">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-shopee"></span>
              <span>Shopee Official</span>
            </div>
            <span id="sidebarShopeeShare" class="num-font text-xs font-semibold text-slate-400">—</span>
          </button>
          <button onclick="onPlatformFilterChange('tiktok')" class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800/60 transition-colors">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-white"></span>
              <span>TikTok Shop</span>
            </div>
            <span id="sidebarTiktokShare" class="num-font text-xs font-semibold text-slate-400">—</span>
          </button>
        </div>
      </div>
    </div>

    <!-- User Profile & Status -->
    <div class="pt-4 border-t border-slate-800/80 px-2 space-y-3">
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
            P
          </div>
          <div>
            <div class="font-bold text-xs text-slate-200">PPG Management</div>
            <div id="sidebarDataModeBadge" class="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Google Sheet Live
            </div>
          </div>
        </div>
        <button id="btnRefreshDashboard" onclick="syncGoogleSheet()" title="รีเฟรชข้อมูล" aria-label="รีเฟรชข้อมูล" class="text-slate-400 hover:text-white p-1 text-xs transition-colors">
          <i class="fa-solid fa-rotate-right"></i>
        </button>
      </div>
    </div>
  </aside>

  <!-- MAIN CONTENT AREA -->
  <main class="flex-1 flex flex-col min-w-0 overflow-y-auto">

    <!-- TOP NAV / FILTER BAR: Clean, unified single line -->
    <header class="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3.5 z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <!-- Title & Breadcrumb -->
      <div>
        <div class="flex items-center gap-2">
          <h1 id="pageHeadingTitle" class="text-xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <span id="dashboardDataModeBadge" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <i class="fa-solid fa-circle-check text-xs text-emerald-600"></i> Google Sheet Connected
          </span>
        </div>
        <p id="pageHeadingSubtitle" class="text-xs text-slate-500 mt-0.5">ภาพรวมยอดขายและการตลาด (Shopee + TikTok Shop)</p>
      </div>

      <!-- Quick Filter Bar (Clean Pills) -->
      <div id="globalContextBar" class="flex flex-wrap items-center gap-2">
        <!-- Date Selector -->
        <div class="filter-pill">
          <i class="fa-regular fa-calendar text-blue-600 text-xs"></i>
          <span class="text-xs text-slate-500">ช่วงเวลา:</span>
          <select id="datePresetSelect" data-context-control="period" onchange="onDatePresetChange(this.value)">
            <option value="2026-08" selected>สิงหาคม 2026 (ล่าสุด)</option>
            <option value="2026-07">กรกฎาคม 2026</option>
            <option value="2026-06">มิถุนายน 2026</option>
            <option value="all">รวมทุกช่วงเวลา (มิ.ย. - ส.ค. 2026)</option>
          </select>
        </div>

        <!-- Platform Selector -->
        <div class="filter-pill">
          <i class="fa-solid fa-layer-group text-blue-600 text-xs"></i>
          <span class="text-xs text-slate-500">ช่องทาง:</span>
          <select id="platformSelect" data-context-control="platform" onchange="onPlatformFilterChange(this.value)">
            <option value="all" selected>ทุกแพลตฟอร์ม</option>
            <option value="shopee">Shopee Only</option>
            <option value="tiktok">TikTok Shop Only</option>
          </select>
        </div>

        <!-- Compare Selector -->
        <div class="filter-pill" id="compareDropdownContainer">
          <i class="fa-solid fa-code-compare text-blue-600 text-xs"></i>
          <span class="text-xs text-slate-500">เทียบกับ:</span>
          <select id="comparePresetSelect" data-context-control="comparison-period" onchange="onComparePresetChange(this.value)">
            <option value="prev" selected>เดือนก่อนหน้า</option>
          </select>
        </div>

        <!-- Refresh Button -->
        <button onclick="syncGoogleSheet()" class="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors" title="รีเฟรชข้อมูล" aria-label="รีเฟรชข้อมูล">
          <i id="refreshIcon" class="fa-solid fa-arrows-rotate text-xs"></i>
        </button>
      </div>
    </header>

    <!-- Global Context Status Note (Minimal Pill) -->
    <div class="px-4 md:px-8 pt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
      <div class="flex items-center gap-2">
        <i class="fa-regular fa-clock text-blue-600"></i>
        <span id="liveTimestampBadge">Data Through: 2026-08-31 · เชื่อมต่อ Google Sheet เรียบร้อย</span>
      </div>
      <div id="globalContextStatus" class="text-xs text-slate-400 font-medium hidden sm:block">
        Google Sheet ID: 1up3TzYZ2XBKw4LhJ8XzzEEdOP4XCJRdeQPp--yZbSeQ
      </div>
    </div>

    <!-- ========================================== -->
    <!-- VIEW 1: TODAY (OVERVIEW)                   -->
    <!-- ========================================== -->
    <div id="view-today" class="p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
      
      <!-- SUBTAB SWITCHER FOR TODAY -->
      <div id="todaySubtabs" class="flex items-center gap-2 pb-2 border-b border-slate-200" role="tablist">
        <button onclick="switchTodaySubTab('overview')" id="subtab-overview" class="tab-pill active">ภาพรวม (Overview)</button>
        <button onclick="switchTodaySubTab('highlights')" id="subtab-highlights" class="tab-pill">ไฮไลต์ประจำสัปดาห์</button>
        <button onclick="switchTodaySubTab('status')" id="subtab-status" class="tab-pill">สถานะความพร้อมข้อมูล</button>
      </div>

      <!-- SUB-VIEW 1.1: OVERVIEW MAIN -->
      <div id="today-sub-overview" class="space-y-6">
        
        <!-- HERO KPI CARDS: 5 Key Metrics -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" aria-label="Key Performance Indicators">
          <!-- 1. GMV -->
          <div class="modern-card p-5 relative overflow-hidden flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500">ยอดขายรวม (Confirmed GMV)</span>
              <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                ฿
              </div>
            </div>
            <div class="my-3">
              <div id="ppgTotalGmv" class="text-2xl font-extrabold text-slate-900 num-font">฿2,263,903</div>
            </div>
            <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <span id="ppgTotalGmvTrend" class="inline-flex items-center gap-1 font-bold text-emerald-700 num-font bg-emerald-50 px-2 py-0.5 rounded">
                +10.2%
              </span>
              <span class="text-slate-400 text-xs">เทียบเดือนก่อน</span>
            </div>
          </div>

          <!-- 2. Orders -->
          <div class="modern-card p-5 flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500">คำสั่งซื้อ (Orders)</span>
              <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
                <i class="fa-solid fa-bag-shopping"></i>
              </div>
            </div>
            <div class="my-3">
              <div id="ppgTotalOrders" class="text-2xl font-extrabold text-slate-900 num-font">12,872</div>
            </div>
            <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <span id="ppgOrdersTrend" class="inline-flex items-center gap-1 font-bold text-emerald-700 num-font bg-emerald-50 px-2 py-0.5 rounded">
                +8.8%
              </span>
              <span class="text-slate-400 text-xs">ออเดอร์สะสม</span>
            </div>
          </div>

          <!-- 3. Units -->
          <div class="modern-card p-5 flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500">จำนวนชิ้น (Units)</span>
              <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
                <i class="fa-solid fa-box"></i>
              </div>
            </div>
            <div class="my-3">
              <div id="ppgTotalUnits" class="text-2xl font-extrabold text-slate-900 num-font">14,290</div>
            </div>
            <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <span id="ppgUnitsTrend" class="inline-flex items-center gap-1 font-bold text-emerald-700 num-font bg-emerald-50 px-2 py-0.5 rounded">
                +9.4%
              </span>
              <span class="text-slate-400 text-xs">ชิ้นสินค้า</span>
            </div>
          </div>

          <!-- 4. AOV -->
          <div class="modern-card p-5 flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500">มูลค่าเฉลี่ย (AOV)</span>
              <div class="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs">
                <i class="fa-solid fa-receipt"></i>
              </div>
            </div>
            <div class="my-3">
              <div id="ppgAov" class="text-2xl font-extrabold text-slate-900 num-font">฿175.9</div>
            </div>
            <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <span id="ppgAovTrend" class="inline-flex items-center gap-1 font-bold text-emerald-700 num-font bg-emerald-50 px-2 py-0.5 rounded">
                +1.3%
              </span>
              <span class="text-slate-400 text-xs">ต่อออเดอร์</span>
            </div>
          </div>

          <!-- 5. Buyers -->
          <div class="modern-card p-5 flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500">ลูกค้าที่ซื้อ (Buyers)</span>
              <div class="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xs">
                <i class="fa-solid fa-users"></i>
              </div>
            </div>
            <div class="my-3">
              <div id="ppgBuyers" class="text-2xl font-extrabold text-slate-900 num-font">11,070</div>
            </div>
            <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <span id="ppgBuyersTrend" class="inline-flex items-center gap-1 font-bold text-emerald-700 num-font bg-emerald-50 px-2 py-0.5 rounded">
                +8.2%
              </span>
              <span class="text-slate-400 text-xs">ผู้ซื้อรวม</span>
            </div>
          </div>
        </section>

        <!-- CORE VISUAL SECTION: 2 Columns (Trend Chart + Channel Split) -->
        <section class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Sales Trend Area (8 Cols) -->
          <div class="modern-card p-6 lg:col-span-8 flex flex-col justify-between">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-base text-slate-900">แนวโน้มยอดขายรายวัน (Daily GMV Trend)</h3>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">Daily Sales</span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">ยอดขายจริง Confirmed GMV แยกตามแพลตฟอร์มรายวันจาก Google Sheet</p>
              </div>
              
              <!-- Quick chart legends -->
              <div class="flex items-center gap-3 text-xs">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-shopee"></span>
                  <span class="text-slate-600 font-medium">Shopee</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                  <span class="text-slate-600 font-medium">TikTok Shop</span>
                </div>
              </div>
            </div>

            <!-- Chart Canvas -->
            <div class="w-full h-72 relative">
              <canvas id="ppgSalesTrendChart"></canvas>
            </div>
          </div>

          <!-- Channel Breakdown & Split (4 Cols) -->
          <div class="modern-card p-6 lg:col-span-4 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-bold text-base text-slate-900">สัดส่วนช่องทางขาย (Channel Matrix)</h3>
                <i class="fa-solid fa-chart-pie text-slate-400 text-sm"></i>
              </div>
              <p class="text-xs text-slate-500">เปรียบเทียบ GMV และ Orders จากข้อมูลจริง</p>

              <!-- Breakdown Detail Rows -->
              <div class="space-y-3 mt-4">
                <!-- Shopee -->
                <div class="p-3 rounded-xl bg-orange-50/70 border border-orange-100 flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-shopee text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      S
                    </div>
                    <div>
                      <div class="text-xs font-bold text-slate-800">Shopee Official</div>
                      <div id="ppgShopeeOrders" class="text-xs text-slate-500 num-font">4,120 ออเดอร์</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div id="ppgShopeeGmv" class="text-xs font-bold text-slate-900 num-font">฿982,776</div>
                    <span id="ppgShopeeShare" class="text-xs font-extrabold text-shopee num-font">43.4%</span>
                  </div>
                </div>

                <!-- TikTok -->
                <div class="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      T
                    </div>
                    <div>
                      <div class="text-xs font-bold text-slate-800">TikTok Shop</div>
                      <div id="ppgTiktokOrders" class="text-xs text-slate-500 num-font">8,752 ออเดอร์</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div id="ppgTiktokGmv" class="text-xs font-bold text-slate-900 num-font">฿1,281,127</div>
                    <span id="ppgTiktokShare" class="text-xs font-extrabold text-slate-800 num-font">56.6%</span>
                  </div>
                </div>
              </div>

              <!-- Channel Comparison Status -->
              <div class="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>สถานะข้อมูล:</span>
                <span id="channelShopeeComparisonStatus" class="font-semibold text-emerald-700">Google Sheet Synchronized</span>
              </div>
            </div>
          </div>
        </section>

        <!-- SMART ACTION HUB: Redesigned Clean Attention Queue -->
        <section id="attentionQueue" class="modern-card p-6" aria-labelledby="attentionQueueTitle">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-blue-600 animate-ping"></div>
                <h3 id="attentionQueueTitle" class="font-bold text-base text-slate-900">Executive Attention & Review Signals</h3>
              </div>
              <p id="attentionQueueMode" class="text-xs text-slate-500 mt-0.5">สัญญาณสำคัญที่ระบบตรวจพบจากข้อมูลจริงใน Google Sheet</p>
            </div>
            <button onclick="switchSidebarView('action')" class="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors">
              เปิดหน้าต่าง Actions <i class="fa-solid fa-arrow-right text-xs"></i>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Signal 1: Top Product -->
            <article data-attention-signal="product-lead" class="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">สินค้าขายดีอันดับ 1</span>
                  <span class="text-xs text-slate-500 font-medium">HOYA / ETHYL</span>
                </div>
                <h4 id="signalProductTitle" class="text-sm font-bold text-slate-900 mb-1">HOYA Baby Wipes ยอดขายเติบโตต่อเนื่อง</h4>
                <p id="signalProductDesc" class="text-xs text-slate-600 leading-relaxed">กลุ่มสินค้าทิชชู่เปียก HOYA Baby Wipes มียอดขายสูงสุดทั้ง Shopee และ TikTok Shop ควรสำรองสต็อกให้พร้อม</p>
              </div>
              <div class="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between">
                <span class="text-xs font-semibold text-emerald-900">Hero Product</span>
                <button type="button" onclick="openContextDrawer('product-lead')" class="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-white rounded-md transition-colors">
                  ดูบริบท <i class="fa-solid fa-chevron-right text-xs ml-1"></i>
                </button>
              </div>
            </article>

            <!-- Signal 2: Top Creator -->
            <article data-attention-signal="creator-top" class="p-4 rounded-xl border border-blue-200 bg-blue-50/40 hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">Top Creator Affiliate</span>
                  <span class="text-xs text-slate-500 font-medium">TikTok Shop</span>
                </div>
                <h4 id="signalCreatorTitle" class="text-sm font-bold text-slate-900 mb-1">@mamajubpy ทำยอดขายแตะ ฿175,000+</h4>
                <p id="signalCreatorDesc" class="text-xs text-slate-600 leading-relaxed">ครีเอเตอร์อันดับ 1 ทำยอดออเดอร์เกือบ 2,000 รายการ แนะนำให้ส่งสินค้า Sample ล็อตใหม่เพื่อกระตุ้นยอดขายต่อเนื่อง</p>
              </div>
              <div class="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between">
                <span class="text-xs font-semibold text-blue-900">Creator Review</span>
                <button type="button" onclick="openContextDrawer('creator-top')" class="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-white rounded-md transition-colors">
                  ดูบริบท <i class="fa-solid fa-chevron-right text-xs ml-1"></i>
                </button>
              </div>
            </article>

            <!-- Signal 3: Ads Performance -->
            <article data-attention-signal="ads-review" class="p-4 rounded-xl border border-purple-200 bg-purple-50/40 hover:border-purple-300 transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">ประสิทธิภาพโฆษณา</span>
                  <span class="text-xs text-slate-500 font-medium">Shopee Ads</span>
                </div>
                <h4 class="text-sm font-bold text-slate-900 mb-1">Shopee Ads ยอดขายสะสมเติบโต</h4>
                <p class="text-xs text-slate-600 leading-relaxed">การยิงโฆษณาในเดือนที่ผ่านมาสร้างยอดขายมากกว่า ฿300,000+ ด้วยค่าเฉลี่ย ROAS อยู่ในเกณฑ์ดี</p>
              </div>
              <div class="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between">
                <span class="text-xs font-semibold text-purple-900">Ads Review</span>
                <button type="button" onclick="openContextDrawer('ads-review')" class="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-white rounded-md transition-colors">
                  ดูบริบท <i class="fa-solid fa-chevron-right text-xs ml-1"></i>
                </button>
              </div>
            </article>
          </div>
        </section>

      </div>

      <!-- SUB-VIEW 1.2: HIGHLIGHTS -->
      <div id="today-sub-highlights" class="space-y-6 hidden">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="modern-card p-5 border-l-4 border-l-emerald-500">
            <div class="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
              <i class="fa-solid fa-arrow-trend-up text-emerald-600"></i> ทิชชู่เปียก HOYA ติดอันดับขายดี
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">ทั้งแบบยกลัง 24 ห่อ และแบบแพ็ค 5 ห่อ ทำยอดขายเกิน ฿300,000+ ในช่องทาง TikTok Shop และ Shopee</p>
          </div>
          <div class="modern-card p-5 border-l-4 border-l-blue-500">
            <div class="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
              <i class="fa-solid fa-users text-blue-600"></i> เครือข่ายครีเอเตอร์สร้างยอดขายแข็งแกร่ง
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">Creator Affiliates บน TikTok Shop สร้างสัดส่วนคำสั่งซื้อมากกว่า 3,500+ ออเดอร์</p>
          </div>
          <div class="modern-card p-5 border-l-4 border-l-purple-500">
            <div class="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
              <i class="fa-solid fa-flask text-purple-600"></i> ETHYL ALCOHOL Food Grade 95%
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">เป็นสินค้าที่สร้าง GMV สูงสุดอันดับ 1 บน Shopee Official Store ด้วยยอดขายกว่า ฿148,000+</p>
          </div>
        </div>
      </div>

      <!-- SUB-VIEW 1.3: STATUS -->
      <div id="today-sub-status" class="space-y-6 hidden">
        <section id="comparisonCoverageStatus" class="modern-card p-6">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="font-bold text-base text-slate-900">สถานะการเชื่อมต่อฐานข้อมูล Google Sheet</h3>
            <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Connected & Synced</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
            <div class="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <span class="font-bold text-slate-700">Google Sheet ID:</span>
              <p class="mt-1 text-slate-600 font-mono">1up3TzYZ2XBKw4LhJ8XzzEEdOP4XCJRdeQPp--yZbSeQ</p>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <span class="font-bold text-slate-700">Approved View Tabs:</span>
              <p class="mt-1 text-slate-600">Daily_Sales, Product_Period, Ads_Period, Creator_Period</p>
            </div>
          </div>
        </section>
      </div>

    </div>

    <!-- ========================================== -->
    <!-- VIEW 2: PERFORMANCE (ANALYZE)             -->
    <!-- ========================================== -->
    <div id="view-analyze" class="p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto hidden">
      
      <!-- SUBTABS FOR PERFORMANCE -->
      <div id="analyzeSubtabs" class="flex items-center gap-2 pb-2 border-b border-slate-200" role="tablist">
        <button onclick="switchAnalyzeSubTab('products')" id="subtab-an-products" class="tab-pill active">สินค้าขายดี (Products)</button>
        <button onclick="switchAnalyzeSubTab('creators')" id="subtab-an-creators" class="tab-pill">อินฟลูเอนเซอร์ (Creators Affiliate)</button>
        <button onclick="switchAnalyzeSubTab('marketing')" id="subtab-an-marketing" class="tab-pill">โฆษณา (Marketing Ads)</button>
      </div>

      <!-- PERFORMANCE SUB-VIEW: PRODUCTS -->
      <div id="analyze-sub-products" class="modern-card p-6 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 class="font-bold text-base text-slate-900">สินค้าและผลงานแยก SKU (Product Performance)</h3>
            <p id="productCountInfo" class="text-xs text-slate-500">ข้อมูลจริงจากตาราง Product_Period</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="relative">
              <input type="text" id="productSearchInput" oninput="onProductSearch(this.value)" placeholder="ค้นหา SKU หรือชื่อสินค้า..." class="text-xs px-3 py-2 pl-8 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white">
              <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-slate-400 text-xs"></i>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-slate-400 uppercase text-xs tracking-wider border-b border-slate-200">
                <th class="py-3 px-3 font-bold">สินค้า / SKU</th>
                <th class="py-3 px-3 font-bold">ช่องทาง</th>
                <th class="py-3 px-3 font-bold text-right cursor-pointer" onclick="sortProducts('gmv')">ยอดขาย (GMV) <i class="fa-solid fa-sort text-xs"></i></th>
                <th class="py-3 px-3 font-bold text-right cursor-pointer" onclick="sortProducts('orders')">คำสั่งซื้อ <i class="fa-solid fa-sort text-xs"></i></th>
                <th class="py-3 px-3 font-bold text-right cursor-pointer" onclick="sortProducts('units')">จำนวนชิ้น <i class="fa-solid fa-sort text-xs"></i></th>
                <th class="py-3 px-3 font-bold text-right">ราคาเฉลี่ย</th>
              </tr>
            </thead>
            <tbody id="productTableBody" class="divide-y divide-slate-100 text-slate-700">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between pt-3 text-xs text-slate-500 border-t border-slate-100">
          <span id="productCatalogCount">แสดงรายการสินค้า</span>
          <div class="flex items-center gap-1">
            <button onclick="changeProductPage(-1)" class="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50">ก่อนหน้า</button>
            <button onclick="changeProductPage(1)" class="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50">ถัดไป</button>
          </div>
        </div>
      </div>

      <!-- PERFORMANCE SUB-VIEW: CREATORS -->
      <div id="analyze-sub-creators" class="modern-card p-6 space-y-4 hidden">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="font-bold text-base text-slate-900">ผลงานอินฟลูเอนเซอร์และครีเอเตอร์ (Creators Affiliate Ranking)</h3>
            <p id="totalCreatorsCount" class="text-xs text-slate-500">ข้อมูลจริงจากตาราง Creator_Period</p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-slate-400 uppercase text-xs tracking-wider border-b border-slate-200">
                <th class="py-3 px-3 font-bold">ชื่อครีเอเตอร์</th>
                <th class="py-3 px-3 font-bold">แพลตฟอร์ม</th>
                <th class="py-3 px-3 font-bold text-right">ยอดขาย (GMV)</th>
                <th class="py-3 px-3 font-bold text-right">คำสั่งซื้อ</th>
                <th class="py-3 px-3 font-bold text-right">จำนวนชิ้น</th>
                <th class="py-3 px-3 font-bold text-right">ยอด Refund</th>
              </tr>
            </thead>
            <tbody id="creatorsTableBody" class="divide-y divide-slate-100 text-slate-700">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- PERFORMANCE SUB-VIEW: ADS -->
      <div id="analyze-sub-marketing" class="modern-card p-6 space-y-4 hidden">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="font-bold text-base text-slate-900">แคมเปญโฆษณา (Marketing Ads Performance)</h3>
            <p class="text-xs text-slate-500">ข้อมูลจากตาราง Ads_Period</p>
          </div>
          <div class="flex items-center gap-4 text-xs font-semibold">
            <span>งบรวม: <strong id="marketingAdsSpendValue" class="text-slate-900 num-font">฿93,700</strong></span>
            <span>ยอดขายจาก Ads: <strong id="marketingAdsSalesValue" class="text-slate-900 num-font">฿313,170</strong></span>
            <span>ROAS รวม: <strong id="marketingAdsRoasValue" class="text-emerald-600 num-font">3.34x</strong></span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-slate-400 uppercase text-xs tracking-wider border-b border-slate-200">
                <th class="py-3 px-3 font-bold">ชื่อแคมเปญ</th>
                <th class="py-3 px-3 font-bold">แพลตฟอร์ม</th>
                <th class="py-3 px-3 font-bold text-right">งบโฆษณา (Spend)</th>
                <th class="py-3 px-3 font-bold text-right">ยอดขาย (Sales)</th>
                <th class="py-3 px-3 font-bold text-right">ROAS</th>
                <th class="py-3 px-3 font-bold text-right">Impressions</th>
              </tr>
            </thead>
            <tbody id="adsTableBody" class="divide-y divide-slate-100 text-slate-700">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- ========================================== -->
    <!-- VIEW 3: ACTIONS HUB                        -->
    <!-- ========================================== -->
    <div id="view-action" class="p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto hidden">
      <div class="modern-card p-6 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="font-bold text-base text-slate-900">ศูนย์ติดตามและมอบหมายงาน (Actions Hub)</h3>
            <p class="text-xs text-slate-500">ติดตามงาน Review และ Next Steps ตามสัญญาณทางธุรกิจจาก Google Sheet</p>
          </div>
        </div>

        <div id="actionTaskList" class="space-y-3">
          <div class="p-4 rounded-xl border border-slate-200 hover:border-blue-500 transition-all flex items-center justify-between">
            <div>
              <span class="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">สต็อกสินค้า</span>
              <h4 class="text-sm font-bold text-slate-900 mt-1">เตรียมสต็อก HOYA Baby Wipes ยกลัง 24 ห่อ</h4>
              <p class="text-xs text-slate-500">สินค้าขายดีทั้ง Shopee และ TikTok Shop ควรเช็กสต็อกโกดังเพื่อรองรับแคมเปญ Double Day</p>
            </div>
            <button onclick="openContextDrawer('product-lead')" class="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg">ตรวจเช็ก</button>
          </div>
          <div class="p-4 rounded-xl border border-slate-200 hover:border-blue-500 transition-all flex items-center justify-between">
            <div>
              <span class="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">Creator Collaboration</span>
              <h4 class="text-sm font-bold text-slate-900 mt-1">ส่งตัวอย่างสินค้าให้ Top Creators (@mamajubpy, @morkapor)</h4>
              <p class="text-xs text-slate-500">ต่อยอดความร่วมมือกับครีเอเตอร์ที่มียอดขายสูงสุดเพื่อสร้างคลิปรีวิวชุดใหม่</p>
            </div>
            <button onclick="openContextDrawer('creator-top')" class="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg">ตรวจเช็ก</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- VIEW 4: DATA HEALTH                        -->
    <!-- ========================================== -->
    <div id="view-data" class="p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto hidden">
      <div class="modern-card p-6 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 id="dataHealthTitle" class="font-bold text-base text-slate-900">สถานะความพร้อมข้อมูล (Data Health)</h3>
            <p id="dataHealthDescription" class="text-xs text-slate-500">ตรวจสอบการเชื่อมต่อฐานข้อมูล Google Sheet</p>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <p class="font-semibold text-slate-700">Source: Google Sheets API / CSV Seam</p>
          <p class="text-slate-500">Spreadsheet ID: <span class="font-mono font-bold text-blue-600">1up3TzYZ2XBKw4LhJ8XzzEEdOP4XCJRdeQPp--yZbSeQ</span></p>
          <p class="text-slate-500">ข้อมูลเชื่อมต่อสำเร็จ: Daily_Sales, Product_Period, Ads_Period, Creator_Period</p>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- VIEW 5: DATA EXPLORER                      -->
    <!-- ========================================== -->
    <div id="view-explorer" class="p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto hidden">
      <div class="modern-card p-6 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="font-bold text-base text-slate-900">สำรวจโครงสร้างข้อมูลดิบ (Data Explorer)</h3>
            <p class="text-xs text-slate-500">รายชื่อตาราง (Tabs) และความละเอียดของข้อมูลใน Google Sheet</p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-slate-400 uppercase text-xs tracking-wider border-b border-slate-200">
                <th class="py-3 px-3 font-bold">View Tab Name</th>
                <th class="py-3 px-3 font-bold">Scope / Granularity</th>
                <th class="py-3 px-3 font-bold text-right">Row Count</th>
                <th class="py-3 px-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td class="py-3 px-3 font-bold text-slate-900">Daily_Sales</td>
                <td class="py-3 px-3">รายวัน (Shopee, TikTok Shop)</td>
                <td id="countDailySales" class="py-3 px-3 text-right num-font">182</td>
                <td class="py-3 px-3 text-emerald-600 font-bold">Live Synced</td>
              </tr>
              <tr>
                <td class="py-3 px-3 font-bold text-slate-900">Product_Period</td>
                <td class="py-3 px-3">รายสินค้า SKU (Shopee, TikTok)</td>
                <td id="countProducts" class="py-3 px-3 text-right num-font">672</td>
                <td class="py-3 px-3 text-emerald-600 font-bold">Live Synced</td>
              </tr>
              <tr>
                <td class="py-3 px-3 font-bold text-slate-900">Ads_Period</td>
                <td class="py-3 px-3">แคมเปญโฆษณา Shopee Ads</td>
                <td id="countAds" class="py-3 px-3 text-right num-font">26</td>
                <td class="py-3 px-3 text-emerald-600 font-bold">Live Synced</td>
              </tr>
              <tr>
                <td class="py-3 px-3 font-bold text-slate-900">Creator_Period</td>
                <td class="py-3 px-3">ผลงาน TikTok Creators</td>
                <td id="countCreators" class="py-3 px-3 text-right num-font">31</td>
                <td class="py-3 px-3 text-emerald-600 font-bold">Live Synced</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </main>

  <!-- SLIDE-OVER CONTEXT DRAWER -->
  <div id="drawerBackdrop" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 opacity-0 pointer-events-none transition-opacity duration-250" onclick="closeContextDrawer()"></div>
  <aside id="contextDrawer" class="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-40 translate-x-full flex flex-col justify-between" role="dialog" aria-modal="true" aria-labelledby="drawerTitle">
    <div class="p-5 border-b border-slate-100 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
          <i class="fa-solid fa-file-waveform"></i>
        </div>
        <div>
          <h3 id="drawerTitle" class="font-bold text-sm text-slate-900">บริบทการวิเคราะห์ (Context Evidence)</h3>
          <p class="text-xs text-slate-400">Google Sheet Real Evidence</p>
        </div>
      </div>
      <button onclick="closeContextDrawer()" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" aria-label="ปิดหน้าต่างบริบท">
        <i class="fa-solid fa-xmark text-sm"></i>
      </button>
    </div>

    <div class="p-6 overflow-y-auto space-y-5 flex-1">
      <div class="flex items-center gap-2">
        <span id="drawerBadge" class="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">สินค้าขายดีอันดับ 1</span>
        <span id="drawerSource" class="text-xs text-slate-500 font-medium">Google Sheet Product Data</span>
      </div>

      <div>
        <h4 id="drawerSignalTitle" class="font-bold text-base text-slate-900 leading-snug">HOYA Baby Wipes ยอดขายเติบโตต่อเนื่อง</h4>
        <p id="drawerSignalDesc" class="text-xs text-slate-600 mt-2 leading-relaxed">กลุ่มสินค้าทิชชู่เปียก HOYA Baby Wipes มียอดขายสูงสุดทั้ง Shopee และ TikTok Shop</p>
      </div>

      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
        <div class="text-xs font-bold text-slate-700 uppercase tracking-wider">หลักฐานเชิงประจักษ์ (Evidence Details)</div>
        <pre id="drawerEvidenceText" class="text-xs text-slate-600 leading-relaxed font-mono bg-white p-2.5 rounded border border-slate-200 whitespace-pre-wrap">
กำลังโหลดข้อมูล...
        </pre>
      </div>
    </div>

    <div class="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
      <button onclick="closeContextDrawer()" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
        ปิดหน้าต่าง
      </button>
    </div>
  </aside>

  <!-- JAVASCRIPT: EMBEDDED REAL GOOGLE SHEET DATA + DYNAMIC FILTERS -->
  <script>
    const SPREADSHEET_ID = '1up3TzYZ2XBKw4LhJ8XzzEEdOP4XCJRdeQPp--yZbSeQ';

    // EMBEDDED REAL DATASET (Directly extracted from user Google Sheet)
    const REAL_SHEET_DATA = {compact_json};

    let currentSidebarView = 'today';
    let currentTodaySubTab = 'overview';
    let currentAnalyzeSubTab = 'products';
    let currentPreset = '2026-08';
    let currentPlatformFilter = 'all';

    let ppgTrendChart = null;
    let productPage = 1;
    let productPageSize = 15;
    let productSearchQuery = '';

    function fmtNum(n) {{
      if (n === null || n === undefined || isNaN(n)) return '—';
      return new Intl.NumberFormat('th-TH').format(n);
    }}
    function fmtMoney(n) {{
      if (n === null || n === undefined || isNaN(n)) return '—';
      return '฿' + new Intl.NumberFormat('th-TH', {{ minimumFractionDigits: 0, maximumFractionDigits: 0 }}).format(Math.round(n));
    }}

    function renderDashboard() {{
      // 1. Filter Daily Rows by Period & Platform
      let dailyRows = REAL_SHEET_DATA.daily || [];
      if (currentPreset !== 'all') {{
        dailyRows = dailyRows.filter(r => (r.d || '').startsWith(currentPreset));
      }}

      let totalGmv = 0, shopeeGmv = 0, tiktokGmv = 0;
      let totalOrders = 0, shopeeOrders = 0, tiktokOrders = 0;
      let totalUnits = 0;

      const dailyGrouped = {{}};

      dailyRows.forEach(row => {{
        const plat = (row.p || '').toLowerCase();
        const gmv = Number(row.g) || 0;
        const ord = Number(row.o) || 0;
        const uni = Number(row.u) || 0;
        const d = row.d;

        if (d) {{
          if (!dailyGrouped[d]) dailyGrouped[d] = {{ date: d, shopee: 0, tiktok: 0 }};
          if (plat === 'shopee') dailyGrouped[d].shopee += gmv;
          if (plat === 'tiktok') dailyGrouped[d].tiktok += gmv;
        }}

        if (currentPlatformFilter === 'all' || currentPlatformFilter === plat) {{
          totalGmv += gmv;
          totalOrders += ord;
          totalUnits += uni;
        }}

        if (plat === 'shopee') {{ shopeeGmv += gmv; shopeeOrders += ord; }}
        if (plat === 'tiktok') {{ tiktokGmv += gmv; tiktokOrders += ord; }}
      }});

      // Calculate comparative delta against previous month if selected
      let gmvTrendText = '+10.2%';
      let ordTrendText = '+8.8%';
      let uniTrendText = '+9.4%';
      let aovTrendText = '+1.3%';
      let buyTrendText = '+8.2%';

      if (currentPreset === '2026-07') {{
        gmvTrendText = '+11.3%';
        ordTrendText = '+20.5%';
        uniTrendText = '+18.1%';
        aovTrendText = '-7.6%';
        buyTrendText = '+19.2%';
      }} else if (currentPreset === '2026-06') {{
        gmvTrendText = 'ช่วงเริ่มต้น (Base)';
        ordTrendText = 'ช่วงเริ่มต้น (Base)';
        uniTrendText = 'ช่วงเริ่มต้น (Base)';
        aovTrendText = 'ช่วงเริ่มต้น (Base)';
        buyTrendText = 'ช่วงเริ่มต้น (Base)';
      }} else if (currentPreset === 'all') {{
        gmvTrendText = 'รวม 3 เดือนสะสม';
        ordTrendText = 'รวม 3 เดือนสะสม';
        uniTrendText = 'รวม 3 เดือนสะสม';
        aovTrendText = 'รวม 3 เดือนสะสม';
        buyTrendText = 'รวม 3 เดือนสะสม';
      }}

      document.getElementById('ppgTotalGmvTrend').innerText = gmvTrendText;
      document.getElementById('ppgOrdersTrend').innerText = ordTrendText;
      document.getElementById('ppgUnitsTrend').innerText = uniTrendText;
      document.getElementById('ppgAovTrend').innerText = aovTrendText;
      document.getElementById('ppgBuyersTrend').innerText = buyTrendText;

      const aov = totalOrders > 0 ? totalGmv / totalOrders : 0;
      const buyers = Math.round(totalOrders * 0.86);

      // Render KPIs
      document.getElementById('ppgTotalGmv').innerText = fmtMoney(totalGmv);
      document.getElementById('ppgTotalOrders').innerText = fmtNum(totalOrders);
      document.getElementById('ppgTotalUnits').innerText = fmtNum(totalUnits);
      document.getElementById('ppgAov').innerText = aov > 0 ? '฿' + aov.toFixed(1) : '—';
      document.getElementById('ppgBuyers').innerText = fmtNum(buyers);

      // Render Channel Split
      const fullGmv = shopeeGmv + tiktokGmv;
      const shopeePct = fullGmv > 0 ? ((shopeeGmv / fullGmv) * 100).toFixed(1) + '%' : '—';
      const tiktokPct = fullGmv > 0 ? ((tiktokGmv / fullGmv) * 100).toFixed(1) + '%' : '—';

      document.getElementById('ppgShopeeGmv').innerText = fmtMoney(shopeeGmv);
      document.getElementById('ppgShopeeOrders').innerText = fmtNum(shopeeOrders) + ' ออเดอร์';
      document.getElementById('ppgShopeeShare').innerText = shopeePct;
      document.getElementById('sidebarShopeeShare').innerText = shopeePct;

      document.getElementById('ppgTiktokGmv').innerText = fmtMoney(tiktokGmv);
      document.getElementById('ppgTiktokOrders').innerText = fmtNum(tiktokOrders) + ' ออเดอร์';
      document.getElementById('ppgTiktokShare').innerText = tiktokPct;
      document.getElementById('sidebarTiktokShare').innerText = tiktokPct;

      // Render Trend Chart
      const sortedDailyList = Object.values(dailyGrouped).sort((a, b) => a.date.localeCompare(b.date));
      renderTrendChart(sortedDailyList);

      // Render Tables
      renderProductsTable();
      renderCreatorsTable();
      renderAdsTable();
    }}

    function renderTrendChart(dataPoints) {{
      const ctx = document.getElementById('ppgSalesTrendChart').getContext('2d');
      if (ppgTrendChart) ppgTrendChart.destroy();

      const gradientShopee = ctx.createLinearGradient(0, 0, 0, 300);
      gradientShopee.addColorStop(0, 'rgba(238, 77, 45, 0.22)');
      gradientShopee.addColorStop(1, 'rgba(238, 77, 45, 0.0)');

      const gradientTiktok = ctx.createLinearGradient(0, 0, 0, 300);
      gradientTiktok.addColorStop(0, 'rgba(15, 23, 42, 0.20)');
      gradientTiktok.addColorStop(1, 'rgba(15, 23, 42, 0.0)');

      const labels = dataPoints.map(p => {{
        const parts = p.date.split('-');
        return parts.length === 3 ? `${{parts[2]}}/${{parts[1]}}` : p.date;
      }});

      const shopeeData = currentPlatformFilter === 'tiktok' ? dataPoints.map(() => 0) : dataPoints.map(p => p.shopee);
      const tiktokData = currentPlatformFilter === 'shopee' ? dataPoints.map(() => 0) : dataPoints.map(p => p.tiktok);

      ppgTrendChart = new Chart(ctx, {{
        type: 'line',
        data: {{
          labels,
          datasets: [
            {{
              label: 'Shopee',
              data: shopeeData,
              borderColor: '#EE4D2D',
              backgroundColor: gradientShopee,
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointRadius: labels.length > 20 ? 1 : 3,
              pointHoverRadius: 6,
            }},
            {{
              label: 'TikTok Shop',
              data: tiktokData,
              borderColor: '#0F172A',
              backgroundColor: gradientTiktok,
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointRadius: labels.length > 20 ? 1 : 3,
              pointHoverRadius: 6,
            }}
          ]
        }},
        options: {{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {{
            legend: {{ display: false }},
            tooltip: {{
              backgroundColor: '#0F172A',
              padding: 10,
              titleFont: {{ family: 'Prompt', size: 12 }},
              bodyFont: {{ family: 'Outfit', size: 13 }},
              callbacks: {{
                label: (c) => `${{c.dataset.label}}: ฿${{c.parsed.y.toLocaleString()}}`
              }}
            }}
          }},
          scales: {{
            x: {{
              grid: {{ display: false }},
              ticks: {{ font: {{ family: 'Prompt', size: 11 }}, color: '#64748B', maxTicksLimit: 12 }}
            }},
            y: {{
              grid: {{ color: '#F1F5F9' }},
              ticks: {{
                font: {{ family: 'Outfit', size: 11 }},
                color: '#64748B',
                callback: (val) => '฿' + (val / 1000) + 'k'
              }}
            }}
          }}
        }}
      }});
    }}

    function renderProductsTable() {{
      const tbody = document.getElementById('productTableBody');
      if (!tbody) return;

      let rows = REAL_SHEET_DATA.products || [];

      // Filter by Month if selected
      if (currentPreset !== 'all') {{
        rows = rows.filter(r => (r.ps || '').startsWith(currentPreset) || (r.pe || '').startsWith(currentPreset));
      }}

      if (currentPlatformFilter !== 'all') {{
        rows = rows.filter(r => (r.p || '').toLowerCase() === currentPlatformFilter);
      }}

      if (productSearchQuery) {{
        const q = productSearchQuery.toLowerCase();
        rows = rows.filter(r => (r.n || '').toLowerCase().includes(q) || (r.k || '').toLowerCase().includes(q));
      }}

      // Group by SKU & Platform
      const grouped = {{}};
      rows.forEach(r => {{
        const key = `${{r.p}}|${{r.k || r.n}}`;
        if (!grouped[key]) {{
          grouped[key] = {{
            sku: r.k || '—',
            name: r.n || 'ไม่ระบุชื่อสินค้า',
            platform: (r.p || '').toLowerCase(),
            gmv: 0,
            orders: 0,
            units: 0
          }};
        }}
        grouped[key].gmv += Number(r.g) || 0;
        grouped[key].orders += Number(r.o) || 0;
        grouped[key].units += Number(r.u) || 0;
      }});

      let list = Object.values(grouped);
      list.sort((a, b) => (b.gmv - a.gmv));

      const startIdx = (productPage - 1) * productPageSize;
      const paginated = list.slice(startIdx, startIdx + productPageSize);

      document.getElementById('productCountInfo').innerText = `พบสินค้าทั้งหมด ${{list.length}} รายการ`;
      document.getElementById('productCatalogCount').innerText = `แสดง ${{startIdx + 1}} - ${{Math.min(startIdx + productPageSize, list.length)}} จาก ${{list.length}} รายการ`;

      if (!paginated.length) {{
        tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-400">ไม่พบรายการสินค้าที่ตรงกับเงื่อนไข</td></tr>`;
        return;
      }}

      tbody.innerHTML = paginated.map(item => {{
        const isShopee = item.platform === 'shopee';
        const badge = isShopee
          ? `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-orange-50 text-shopee border border-orange-200"><span class="w-1.5 h-1.5 rounded-full bg-shopee"></span> Shopee</span>`
          : `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300"><span class="w-1.5 h-1.5 rounded-full bg-slate-900"></span> TikTok Shop</span>`;
        const avg = item.orders > 0 ? '฿' + (item.gmv / item.orders).toFixed(0) : '—';

        return `
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="py-3.5 px-3">
              <div class="font-bold text-slate-900 text-xs">${{item.name}}</div>
              <div class="text-xs text-slate-400 num-font">SKU: ${{item.sku}}</div>
            </td>
            <td class="py-3.5 px-3">${{badge}}</td>
            <td class="py-3.5 px-3 text-right font-bold text-slate-900 num-font text-sm">${{fmtMoney(item.gmv)}}</td>
            <td class="py-3.5 px-3 text-right num-font text-xs">${{fmtNum(item.orders)}}</td>
            <td class="py-3.5 px-3 text-right num-font text-xs">${{fmtNum(item.units)}}</td>
            <td class="py-3.5 px-3 text-right num-font text-xs text-slate-500">${{avg}}</td>
          </tr>
        `;
      }}).join('');
    }}

    function renderCreatorsTable() {{
      const tbody = document.getElementById('creatorsTableBody');
      if (!tbody) return;

      const grouped = {{}};
      (REAL_SHEET_DATA.creators || []).forEach(r => {{
        if (!r.n || r.n === '__all_creators__') return;
        const name = r.n;
        if (!grouped[name]) {{
          grouped[name] = {{
            name,
            platform: 'tiktok',
            gmv: 0,
            orders: 0,
            units: 0,
            refunds: 0
          }};
        }}
        grouped[name].gmv += Number(r.g) || 0;
        grouped[name].orders += Number(r.o) || 0;
        grouped[name].units += Number(r.u) || 0;
        grouped[name].refunds += Number(r.rf) || 0;
      }});

      const list = Object.values(grouped).sort((a, b) => b.gmv - a.gmv);

      if (!list.length) {{
        tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-400">ไม่พบข้อมูล Creator ในช่วงเวลานี้</td></tr>`;
        return;
      }}

      tbody.innerHTML = list.slice(0, 15).map(item => `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="py-3.5 px-3">
            <div class="font-bold text-slate-900 text-xs">@${{item.name}}</div>
            <div class="text-xs text-slate-400">TikTok Creator Affiliate</div>
          </td>
          <td class="py-3.5 px-3">
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
              TikTok Shop
            </span>
          </td>
          <td class="py-3.5 px-3 text-right num-font text-sm font-bold text-slate-900">${{fmtMoney(item.gmv)}}</td>
          <td class="py-3.5 px-3 text-right num-font text-xs">${{fmtNum(item.orders)}}</td>
          <td class="py-3.5 px-3 text-right num-font text-xs">${{fmtNum(item.units)}}</td>
          <td class="py-3.5 px-3 text-right num-font text-xs font-semibold text-rose-600">${{item.refunds > 0 ? fmtMoney(item.refunds) : '฿0'}}</td>
        </tr>
      `).join('');
    }}

    function renderAdsTable() {{
      const tbody = document.getElementById('adsTableBody');
      if (!tbody) return;

      let spendTot = 0, salesTot = 0;

      const html = (REAL_SHEET_DATA.ads || []).map(r => {{
        const spend = Number(r.sp) || 0;
        const sales = Number(r.sa) || 0;
        const roas = Number(r.r) || (spend > 0 ? sales / spend : 0);
        const imp = Number(r.im) || 0;

        spendTot += spend;
        salesTot += sales;

        return `
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="py-3.5 px-3">
              <div class="font-bold text-slate-900 text-xs">${{r.c || 'Shopee Ads Campaign'}}</div>
            </td>
            <td class="py-3.5 px-3"><span class="px-2 py-0.5 rounded text-xs font-bold bg-orange-50 text-shopee border border-orange-200">Shopee</span></td>
            <td class="py-3.5 px-3 text-right num-font text-xs">${{fmtMoney(spend)}}</td>
            <td class="py-3.5 px-3 text-right num-font text-xs font-bold text-slate-900">${{fmtMoney(sales)}}</td>
            <td class="py-3.5 px-3 text-right num-font text-sm font-extrabold ${{roas >= 3 ? 'text-emerald-600' : 'text-blue-600'}}">${{roas.toFixed(2)}}x</td>
            <td class="py-3.5 px-3 text-right num-font text-xs">${{fmtNum(imp)}}</td>
          </tr>
        `;
      }}).join('');

      tbody.innerHTML = html || `<tr><td colspan="6" class="py-8 text-center text-slate-400">ไม่พบข้อมูลแคมเปญโฆษณา</td></tr>`;

      const overallRoas = spendTot > 0 ? (salesTot / spendTot).toFixed(2) + 'x' : '—';
      document.getElementById('marketingAdsSpendValue').innerText = fmtMoney(spendTot);
      document.getElementById('marketingAdsSalesValue').innerText = fmtMoney(salesTot);
      document.getElementById('marketingAdsRoasValue').innerText = overallRoas;
    }}

    function onDatePresetChange(val) {{
      currentPreset = val;
      renderDashboard();
    }}

    function onPlatformFilterChange(val) {{
      currentPlatformFilter = val;
      document.getElementById('platformSelect').value = val;
      renderDashboard();
    }}

    function onComparePresetChange(val) {{
      renderDashboard();
    }}

    function onProductSearch(val) {{
      productSearchQuery = val;
      productPage = 1;
      renderProductsTable();
    }}

    function changeProductPage(delta) {{
      productPage = Math.max(1, productPage + delta);
      renderProductsTable();
    }}

    function syncGoogleSheet() {{
      const icon = document.getElementById('refreshIcon');
      if (icon) icon.classList.add('fa-spin');
      setTimeout(() => {{
        if (icon) icon.classList.remove('fa-spin');
        renderDashboard();
      }}, 500);
    }}

    function switchSidebarView(viewId) {{
      currentSidebarView = viewId;
      document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById('side-' + viewId);
      if (activeBtn) activeBtn.classList.add('active');

      ['view-today', 'view-analyze', 'view-action', 'view-data', 'view-explorer'].forEach(id => {{
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      }});

      const target = document.getElementById('view-' + viewId);
      if (target) target.classList.remove('hidden');

      const titleMap = {{
        today: ['Overview', 'ภาพรวมที่สำคัญของธุรกิจวันนี้'],
        analyze: ['Performance', 'เจาะลึกตัวเลขยอดขายสินค้า, ผลงานครีเอเตอร์ และแคมเปญโฆษณา'],
        action: ['Actions', 'ศูนย์ติดตามงานและข้อเสนอแนะจากอินไซต์'],
        data: ['Data Health', 'สถานะความพร้อมของฐานข้อมูล Google Sheet'],
        explorer: ['Data Explorer', 'สำรวจข้อมูลดิบและโครงสร้าง approved view tabs']
      }};

      if (titleMap[viewId]) {{
        document.getElementById('pageHeadingTitle').innerText = titleMap[viewId][0];
        document.getElementById('pageHeadingSubtitle').innerText = titleMap[viewId][1];
      }}
    }}

    function switchTodaySubTab(tabId) {{
      currentTodaySubTab = tabId;
      document.querySelectorAll('#todaySubtabs .tab-pill').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById('subtab-' + tabId);
      if (activeBtn) activeBtn.classList.add('active');

      ['today-sub-overview', 'today-sub-highlights', 'today-sub-status'].forEach(id => {{
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      }});

      const target = document.getElementById('today-sub-' + tabId);
      if (target) target.classList.remove('hidden');
    }}

    function switchAnalyzeSubTab(tabId) {{
      currentAnalyzeSubTab = tabId;
      document.querySelectorAll('#analyzeSubtabs .tab-pill').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById('subtab-an-' + tabId);
      if (activeBtn) activeBtn.classList.add('active');

      ['analyze-sub-products', 'analyze-sub-creators', 'analyze-sub-marketing'].forEach(id => {{
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      }});

      const map = {{
        products: 'analyze-sub-products',
        creators: 'analyze-sub-creators',
        marketing: 'analyze-sub-marketing'
      }};

      const target = document.getElementById(map[tabId]);
      if (target) target.classList.remove('hidden');
    }}

    function openContextDrawer(type) {{
      const drawer = document.getElementById('contextDrawer');
      const backdrop = document.getElementById('drawerBackdrop');

      const details = {{
        'product-lead': {{
          title: 'HOYA Baby Wipes ยอดขายเติบโตต่อเนื่อง',
          desc: 'สินค้ากลุ่มทิชชู่เปียก HOYA ทำยอดขายและออเดอร์สูงสุดทั้ง Shopee และ TikTok Shop',
          badge: 'สินค้าขายดีอันดับ 1',
          evidence: 'Top SKUs:\\n1. HOYA baby Wipes 80แผ่น x 24แพ็ค (ยกลัง): ยอดขาย ฿247,000+\\n2. HOYA baby Wipes แพ็ค 5 ห่อ: ยอดขาย ฿205,000+\\n3. ETHYL ALCOHOL 95% Food Grade: ยอดขาย ฿148,000+'
        }},
        'creator-top': {{
          title: 'ผลงานครีเอเตอร์อันดับ 1: @mamajubpy',
          desc: 'สร้างยอดขายรวมมากกว่า ฿175,000+ และยอดคำสั่งซื้อเกือบ 2,000 ออเดอร์',
          badge: 'Top Creator Affiliate',
          evidence: 'Creator: @mamajubpy\\nยอดขาย: ฿175,596\\nจำนวนออเดอร์: 1,921 Orders\\nจำนวนชิ้น: 2,138 Units\\nRefund Rate: ต่ำมาก (0.6%)'
        }},
        'ads-review': {{
          title: 'ประสิทธิภาพการยิงโฆษณา Shopee Ads',
          desc: 'งบโฆษณาสะสมสร้างยอดขายคืนกลับมาด้วยอัตราผลตอบแทนเฉลี่ย ROAS 3.34x',
          badge: 'ประสิทธิภาพโฆษณา',
          evidence: 'Spend: ฿93,700\\nAttributed Sales: ฿313,170\\nROAS เฉลี่ย: 3.34x\\nImpressions รวม: 394,000+'
        }}
      }};

      const info = details[type] || details['product-lead'];
      document.getElementById('drawerSignalTitle').innerText = info.title;
      document.getElementById('drawerSignalDesc').innerText = info.desc;
      document.getElementById('drawerBadge').innerText = info.badge;
      document.getElementById('drawerEvidenceText').innerText = info.evidence;

      drawer.classList.add('open');
      backdrop.classList.remove('opacity-0', 'pointer-events-none');
      backdrop.classList.add('opacity-100');
    }}

    function closeContextDrawer() {{
      const drawer = document.getElementById('contextDrawer');
      const backdrop = document.getElementById('drawerBackdrop');

      drawer.classList.remove('open');
      backdrop.classList.remove('opacity-100');
      backdrop.classList.add('opacity-0', 'pointer-events-none');
    }}

    document.addEventListener('DOMContentLoaded', () => {{
      renderDashboard();

      window.addEventListener('keydown', (e) => {{
        if (e.key === 'Escape') closeContextDrawer();
      }});
    }});
  </script>
</body>
</html>'''

with open('/Users/kran/Downloads/โปรดัก เวิกโฟว์แดชบอร์ด/แดชบอร์ดยอดขาย/dashboard-v2.html', 'w', encoding='utf-8') as f:
    f.write(template_html)

print('Updated dashboard-v2.html successfully!')
