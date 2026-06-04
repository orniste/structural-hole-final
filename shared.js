/* ═══════════════════════════════════════════════════════════
   《結構洞 Structural Hole》— shared.js
   Ronald Burt (1992): 群落之間的洞由中介者橋接
   ─────────────────────────────────────────────────────────
   Canvas 分三層：
   1. stars[]  — 閃爍星光（獨立陣列，不參與連線計算）
   2. nodes[]  — 四角群落節點 + 橋接節點（結構洞網路）
   3. 游標線   — 游標作為 broker 向節點拉出橋接線
   ═══════════════════════════════════════════════════════════ */

/* ── 1. Structural Hole Canvas ──────────────────────────── */
function initCanvas(id, opts) {
    opts = opts || {};
    var canvas = document.getElementById(id);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W, H;
    var collapse = !!opts.collapseOnScroll;
    var scrollRatio = 0;
    var mouse = { x: null, y: null };

    /* 四角群落定義 — 刻意留空中心區域 = 結構洞 */
    var CDEFS = [
        { rx: 0.11, ry: 0.20, col: '#3d6e8f', n: 11 },
        { rx: 0.89, ry: 0.18, col: '#6d5ea0', n: 11 },
        { rx: 0.10, ry: 0.83, col: '#9e4d60', n: 11 },
        { rx: 0.90, ry: 0.81, col: '#b59040', n: 11 },
    ];
    /* 橋接節點 — 分布在洞的邊緣 */
    var BDEFS = [
        { rx: 0.50, ry: 0.19 },
        { rx: 0.10, ry: 0.52 },
        { rx: 0.50, ry: 0.50 },
        { rx: 0.90, ry: 0.52 },
        { rx: 0.50, ry: 0.81 },
    ];

    var nodes = [];  /* 群落節點 + 橋接節點 */
    var stars = [];  /* 閃爍星光粒子（獨立，不參與連線） */

    function hexRgba(hex, a) {
        return 'rgba(' + parseInt(hex.slice(1,3),16) + ',' +
                         parseInt(hex.slice(3,5),16) + ',' +
                         parseInt(hex.slice(5,7),16) + ',' + a + ')';
    }

    function build() {
        nodes = [];
        stars = [];

        /* 群落節點 */
        CDEFS.forEach(function(d, ci) {
            for (var i = 0; i < d.n; i++) {
                var ang = Math.random() * Math.PI * 2;
                var r   = Math.random() * 95 + 20;
                nodes.push({
                    x:  d.rx * W + Math.cos(ang) * r,
                    y:  d.ry * H + Math.sin(ang) * r,
                    vx: (Math.random() - 0.5) * 0.22,
                    vy: (Math.random() - 0.5) * 0.22,
                    sz: Math.random() * 0.9 + 0.45,
                    ci: ci, col: d.col, bridge: false
                });
            }
        });

        /* 橋接節點 */
        BDEFS.forEach(function(d) {
            nodes.push({
                x:  d.rx * W + (Math.random() - 0.5) * 40,
                y:  d.ry * H + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 0.11,
                vy: (Math.random() - 0.5) * 0.11,
                sz: 1.8, ci: -1, col: '#c9a84c', bridge: true
            });
        });

        /* 星光粒子 — 閃爍，廣佈全畫面 */
        for (var s = 0; s < 160; s++) {
            stars.push({
                x:     Math.random() * W,
                y:     Math.random() * H,
                vx:    (Math.random() - 0.5) * 0.04,
                vy:    (Math.random() - 0.5) * 0.04,
                sz:    Math.random() * 0.55 + 0.12,
                phase: Math.random() * Math.PI * 2,
                spd:   Math.random() * 0.0013 + 0.0004,
                peak:  Math.random() * 0.22 + 0.06
            });
        }
    }

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
        build();
    }

    function frame() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#050407'; ctx.fillRect(0, 0, W, H);

        /* ── 層 1：閃爍星光 ────────── */
        var now = Date.now();
        for (var s = 0; s < stars.length; s++) {
            var st = stars[s];
            st.x += st.vx; st.y += st.vy;
            if (st.x < 0 || st.x > W) st.vx *= -1;
            if (st.y < 0 || st.y > H) st.vy *= -1;
            var alpha = st.peak * (0.2 + 0.8 * (0.5 + 0.5 * Math.sin(now * st.spd + st.phase)));
            ctx.beginPath(); ctx.arc(st.x, st.y, st.sz, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(232, 218, 175, ' + alpha + ')';
            ctx.fill();
        }

        /* ── 層 2：結構洞連線 ──────────────────────────── */
        var spd   = collapse ? 1 + scrollRatio * 14 : 1;
        var intra = collapse ? 100 * Math.max(0, 1 - scrollRatio * 1.3) : 100;
        var brdg  = collapse ? 360 * Math.max(0, 1 - scrollRatio * 0.85) : 360;

        for (var i = 0; i < nodes.length; i++) {
            var a = nodes[i];
            for (var j = i + 1; j < nodes.length; j++) {
                var b  = nodes[j];
                var dx = a.x - b.x, dy = a.y - b.y;
                var d  = Math.sqrt(dx*dx + dy*dy);
                if (!a.bridge && !b.bridge && a.ci === b.ci && d < intra) {
                    ctx.strokeStyle = hexRgba(a.col, (1 - d/intra) * 0.14);
                    ctx.lineWidth = 0.4;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                }
                if ((a.bridge || b.bridge) && d < brdg) {
                    ctx.strokeStyle = 'rgba(201,168,76,' + ((1 - d/brdg) * 0.16) + ')';
                    ctx.lineWidth = 0.5;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                }
            }
        }

        /* ── 游標 broker 橋接線 ────────────────────────── */
        if (mouse.x !== null) {
            for (var k = 0; k < nodes.length; k++) {
                var n  = nodes[k];
                var mx = mouse.x - n.x, my = mouse.y - n.y;
                var md = Math.sqrt(mx*mx + my*my);
                if (md < 200) {
                    ctx.strokeStyle = 'rgba(201,168,76,' + ((1 - md/200) * 0.28) + ')';
                    ctx.lineWidth = 0.55;
                    ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(n.x, n.y); ctx.stroke();
                }
            }
        }

        /* ── 層 3：更新並繪製節點 ──────────────────────── */
        for (var p = 0; p < nodes.length; p++) {
            var nd = nodes[p];
            nd.x += nd.vx * spd; nd.y += nd.vy * spd;
            if (nd.x < 0 || nd.x > W) nd.vx *= -1;
            if (nd.y < 0 || nd.y > H) nd.vy *= -1;
            if (mouse.x !== null) {
                var ddx = mouse.x - nd.x, ddy = mouse.y - nd.y;
                var ddd = Math.sqrt(ddx*ddx + ddy*ddy);
                if (ddd < 200) { nd.x += ddx * 0.007; nd.y += ddy * 0.007; }
            }
            if (nd.bridge) {
                ctx.beginPath(); ctx.arc(nd.x, nd.y, nd.sz * 2.8, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(201,168,76,0.06)'; ctx.fill();
            }
            ctx.beginPath(); ctx.arc(nd.x, nd.y, nd.sz, 0, Math.PI * 2);
            ctx.fillStyle = hexRgba(nd.col, nd.bridge ? 0.75 : 0.42); ctx.fill();
        }

        requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', function(e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseout',  function()  { mouse.x = null; mouse.y = null; });
    
    // 改為向 window 註冊，並動態判定當前是否存在需要收縮的機制
    window.addEventListener('scroll', function() {
        var h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        scrollRatio = h > 0 ? document.documentElement.scrollTop / h : 0;
    }, { passive: true });

    resize();
    frame();
}

/* ── 2. Scroll Progress Bar ─────────────────────────────── */
function initProgressBar(id) {
    var bar = document.getElementById(id);
    if (!bar) return;
    // 移除舊有的重複綁定，改用單次驅動
    var scrollFunc = function() {
        var h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        bar.style.width = (h > 0 ? document.documentElement.scrollTop / h * 100 : 0) + '%';
    };
    window.addEventListener('scroll', scrollFunc, { passive: true });
    scrollFunc(); // 初始化一次
}

/* ── 3. Scroll Reveal ───────────────────────────────────── */
function initReveal(selector) {
    var els = document.querySelectorAll(selector);
    if (!els.length) return;
    function check() {
        for (var i = 0; i < els.length; i++) {
            if (els[i].getBoundingClientRect().top < window.innerHeight - 60)
                els[i].classList.add('active');
        }
    }
    window.addEventListener('scroll', check, { passive: true });
    check();
}

/* ── 4. Typewriter ──────────────────────────────────────── */
var typewriterTimeout; // 用於頁面切換時清除定時器
function initTypewriter(id, words) {
    var el = document.getElementById(id);
    if (!el) return;
    var wi = 0, buf = '', del = false;
    if (typewriterTimeout) clearTimeout(typewriterTimeout);
    function tick() {
        if (!document.getElementById(id)) return; // 防呆
        var w = words[wi];
        buf = del ? w.substring(0, buf.length - 1) : w.substring(0, buf.length + 1);
        el.textContent = buf;
        var ms = del ? 22 : 42;
        if (!del && buf === w)  { ms = 2200; del = true; }
        if ( del && buf === '') { del = false; wi = (wi + 1) % words.length; ms = 450; }
        typewriterTimeout = setTimeout(tick, ms);
    }
    typewriterTimeout = setTimeout(tick, 700);
}

/* ── 5. Parallax Cards ──────────────────────────────────── */
function initParallax(selector) {
    var cards = document.querySelectorAll(selector);
    if (!cards.length) return;
    window.addEventListener('scroll', function() {
        if (window.innerWidth < 1024) return;
        for (var i = 0; i < cards.length; i++) {
            var spd = parseFloat(cards[i].dataset.speed || 0);
            cards[i].style.transform = 'translateY(' + (-(window.scrollY * spd / 100)) + 'px)';
        }
    }, { passive: true });
}

/* ── 6. 全局音訊與無縫網頁切換 (SPA) 核心邏輯 ────────────────── */
document.addEventListener('DOMContentLoaded', function() {
    var bgm = document.getElementById('bgm');
    var btn = document.getElementById('music-btn');
    if (!bgm || !btn) return;

    // 音樂開關
    btn.addEventListener('click', function() {
        if (bgm.paused) {
            bgm.play().then(function() {
                btn.classList.add('playing');
                btn.querySelector('.music-status').textContent = 'SOUND ON';
            }).catch(function(err) {
                console.log("播放攔截:", err);
            });
        } else {
            bgm.pause();
            btn.classList.remove('playing');
            btn.querySelector('.music-status').textContent = 'SOUND OFF';
        }
    });

    // 攔截點擊事件實現 SPA 無縫換頁
    document.addEventListener('click', function(e) {
        var link = e.target.closest('a');
        if (!link) return;
        
        var href = link.getAttribute('href');
        // 只處理站內 .html 跳轉，排除外部連結與純錨點
        if (href && href.endsWith('.html') && !href.startsWith('http')) {
            e.preventDefault();
            
            fetch(href)
                .then(function(res) { return res.text(); })
                .then(function(html) {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(html, 'text/html');
                    
                    // 替換核心內容與樣式標籤 (抽換 accent 顏色)
                    var newApp = doc.getElementById('app');
                    var currentApp = document.getElementById('app');
                    if (newApp && currentApp) {
                        currentApp.innerHTML = newApp.innerHTML;
                    }
                    
                    // 同步更新頁面特定的 :root style 標籤變數
                    var oldStyle = document.querySelector('head style');
                    var newStyle = doc.querySelector('head style');
                    if (oldStyle && newStyle) oldStyle.innerHTML = newStyle.innerHTML;
                    else if (newStyle) document.head.appendChild(newStyle.cloneNode(true));

                    document.title = doc.title;
                    history.pushState({ path: href }, doc.title, href);
                    
                    // 重新驅動新頁面的腳本邏輯
                    reinitPageScripts(href);
                    window.scrollTo({ top: 0 });
                })
                .catch(function() {
                    window.location.href = href; // 降級保底
                });
        }
    });

    window.addEventListener('popstate', function() {
        location.reload(); 
    });

    function reinitPageScripts(href) {
        initProgressBar('bar');
        initReveal('.reveal');
        initReveal('.reveal-p');
        initParallax('[data-speed]');
        
        if (href.includes('index.html') || href.endsWith('/') || href === '') {
            initTypewriter('tw', [
                '靈光輓歌：大眾審美被集體眷養後的抵抗',
                '在無意識中，我們讓渡了美學主體性',
                '活得比演算法更難以預測'
            ]);
        }
        
        // 重新綁定 Chapter 2 專屬網格滾動收縮
        var grid = document.getElementById('grid-element');
        if (grid) {
            window.addEventListener('scroll', function() {
                var h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                var ratio = h > 0 ? document.documentElement.scrollTop / h : 0;
                var size = Math.max(20, 60 - ratio * 22) + 'px';
                grid.style.backgroundSize = size + ' ' + size;
            }, { passive: true });
        }
        
        // 重新綁定 Chapter 3 畫布崩解
        if (href.includes('chapter3.html')) {
            initCanvas('bg-canvas', { collapseOnScroll: true });
        } else {
            initCanvas('bg-canvas');
        }
    }
});