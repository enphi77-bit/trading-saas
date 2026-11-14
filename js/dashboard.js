import { auth, db } from "./firebase-config.js";
import {
    onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import {
    doc, getDoc
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { createChart, loadHistory, connectLive } from "./chart.js";
import { sma, ema, rsi } from "./indikator.js";
import { getTenant, createTenant, joinTenant } from "./tenant.js";

const userInfo = document.getElementById("user-info");
const statusEl = document.getElementById("status");
const symbolSel = document.getElementById("symbol");
const intervalSel = document.getElementById("interval");

let chart, candles, smaSeries, emaSeries, rsiSeries;
let history = [];
const enabled = { sma: false, ema: false, rsi: false };
let userTier = "free";
const FREE_LIMIT = 1;

function refreshIndicators() {
    smaSeries.setData(enabled.sma ? sma(history, 20) : []);
    emaSeries.setData(enabled.ema ? ema(history, 20) : []);
    rsiSeries.setData(enabled.rsi ? rsi(history, 14) : []);
}

function onLiveCandle(c) {
    const last = history[history.length - 1];
    if (last && last.time === c.time) history[history.length - 1] = c;
    else history.push(c);

    candles.update(c);
    refreshIndicators();
}

async function loadChart() {
    statusEl.textContent = "memuat data...";
    try {
        const symbol = symbolSel.value;
        const interval = intervalSel.value;

        history = await loadHistory(symbol, interval);
        candles.setData(history);
        refreshIndicators();

        connectLive(symbol, interval, onLiveCandle, (s) => (statusEl.textContent = s));
    } catch (err) {
        statusEl.textContent = "gagal: " + err.message;
    }
}

function setupChart() {
    ({ chart, candles } = createChart(document.getElementById("chart")));

    smaSeries = chart.addLineSeries({
        color: "#f5a623", lineWidth: 2,
        priceLineVisible: false, lastValueVisible: false
    });
    emaSeries = chart.addLineSeries({
        color: "#00bcd4", lineWidth: 2,
        priceLineVisible: false, lastValueVisible: false
    });
    rsiSeries = chart.addLineSeries({
        color: "#ab47bc", lineWidth: 2,
        priceScaleId: "rsi", priceLineVisible: false
    });
    chart.priceScale("rsi").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0.02 }
    });
    rsiSeries.createPriceLine({ price: 70, color: "#555", lineStyle: 2, axisLabelVisible: false });
    rsiSeries.createPriceLine({ price: 30, color: "#555", lineStyle: 2, axisLabelVisible: false });

    const bind = (id, key) => {
        document.getElementById(id).onchange = (e) => {
            if (e.target.checked && userTier !== "pro") {
                const active = Object.values(enabled).filter(Boolean).length;
                if (active >= FREE_LIMIT) {
                    e.target.checked = false;
                    statusEl.textContent = "Akun Free maksimal 1 indikator. Upgrade ke Pro 🔒";
                    return;
                }
            }
            enabled[key] = e.target.checked;
            if (key === "rsi") {
                candles.priceScale().applyOptions({
                    scaleMargins: { top: 0.05, bottom: enabled.rsi ? 0.3 : 0.05 }
                });
            }
            refreshIndicators();
        };
    };
    bind("ind-sma", "sma");
    bind("ind-ema", "ema");
    bind("ind-rsi", "rsi");

    symbolSel.onchange = loadChart;
    intervalSel.onchange = loadChart;
    document.getElementById("logout-btn").onclick = async () => {
        await signOut(auth);
        window.location.href = "index.html";
    };
}

const tenantBar = document.getElementById("tenant-bar");

const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

function renderTenant(user, tenant) {
    if (tenant) {
        tenantBar.innerHTML =
            `Tenant: <strong>${esc(tenant.name)}</strong> · kode undangan: ` +
            `<strong>${esc(tenant.id)}</strong> · paket: ${esc(tenant.tier)}`;
        return;
    }

    tenantBar.innerHTML = `
    <input id="t-name" placeholder="Nama tenant baru">
    <button id="t-create" type="button">Buat</button>
    <span>atau</span>
    <input id="t-code" placeholder="Kode undangan">
    <button id="t-join" type="button">Gabung</button>`;

    const run = async (fn) => {
        try {
            await fn();
            location.reload();
        } catch (err) {
            statusEl.textContent = "Tenant gagal: " + err.message;
        }
    };

    document.getElementById("t-create").onclick = () => {
        const name = document.getElementById("t-name").value.trim().slice(0, 40);
        if (name) run(() => createTenant(user.uid, name));
    };
    document.getElementById("t-join").onclick = () => {
        const code = document.getElementById("t-code").value;
        if (code.trim()) run(() => joinTenant(user.uid, code));
    };
}

onAuthStateChanged(auth, async (user) => {
    if (!user || !user.emailVerified) {
        window.location.href = "index.html";
        return;
    

    const snap = await getDoc(doc(db, "users", user.uid));
    const data = snap.exists() ? snap.data() : {};
    const tenant = data.tenantId ? await getTenant(data.tenantId) : null;

    userTier = data.tier === "pro" || tenant?.tier === "pro" ? "pro" : "free";
    userInfo.innerHTML = `${user.email} <span class="badge ${userTier}">${userTier}</span>`;
    renderTenant(user, tenant);

    if (!chart) setupChart();
    loadChart();
});