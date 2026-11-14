const REST = "https://data-api.binance.vision/api/v3/klines";
const WS = "wss://data-stream.binance.vision/ws";

export function createChart(container) {
  const chart = LightweightCharts.createChart(container, {
    layout: { background: { color: "#0f1419" }, textColor: "#d1d4dc" },
    grid: {
      vertLines: { color: "#1e262e" },
      horzLines: { color: "#1e262e" }
    },
    timeScale: { timeVisible: true, secondsVisible: false },
    autoSize: true
  });

  const candles = chart.addCandlestickSeries({
    upColor: "#26a69a", downColor: "#ef5350",
    borderVisible: false,
    wickUpColor: "#26a69a", wickDownColor: "#ef5350"
  });

  return { chart, candles };
}

export async function loadHistory(symbol, interval, limit = 500) {
  const url = `${REST}?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal ambil data Binance");
  const data = await res.json();

  return data.map((k) => ({
    time: Math.floor(k[0] / 1000),
    open: +k[1],
    high: +k[2],
    low: +k[3],
    close: +k[4]
  }));
}

let socket = null;

export function connectLive(symbol, interval, onCandle, onStatus) {
  if (socket) socket.close();

  socket = new WebSocket(`${WS}/${symbol.toLowerCase()}@kline_${interval}`);
  const current = socket;

  current.onopen = () => onStatus("live 🟢");
  current.onclose = () => {
    if (socket === current) onStatus("terputus 🔴");
  };
  current.onerror = () => onStatus("error 🔴");

  current.onmessage = (event) => {
    const k = JSON.parse(event.data).k;
    onCandle({
      time: Math.floor(k.t / 1000),
      open: +k.o,
      high: +k.h,
      low: +k.l,
      close: +k.c
    });
  };
}