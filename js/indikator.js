export function sma(data, period) {
  const out = [];
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i].close;
    if (i >= period) sum -= data[i - period].close;
    if (i >= period - 1) out.push({ time: data[i].time, value: sum / period });
  }
  return out;
}

export function ema(data, period) {
  const out = [];
  const k = 2 / (period + 1);
  let prev;
  for (let i = 0; i < data.length; i++) {
    if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += data[j].close;
      prev = sum / period;
      out.push({ time: data[i].time, value: prev });
    } else if (i >= period) {
      prev = data[i].close * k + prev * (1 - k);
      out.push({ time: data[i].time, value: prev });
    }
  }
  return out;
}

export function rsi(data, period = 14) {
  if (data.length <= period) return [];
  const out = [];
  let gain = 0, loss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    gain += Math.max(diff, 0);
    loss += Math.max(-diff, 0);
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;

  const calc = () => (avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  out.push({ time: data[period].time, value: calc() });

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    out.push({ time: data[i].time, value: calc() });
  }
  return out;
}