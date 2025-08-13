export async function loadSplat(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  const buf = await res.arrayBuffer();
  const count = new Uint32Array(buf, 0, 1)[0];
  const floats = new Float32Array(buf, 4);
  const stride = 14; // floats per gaussian
  const out = new Float32Array(count * 8); // x,y,z,radius,r,g,b,a
  for (let i = 0; i < count; i++) {
    const base = i * stride;
    const px = floats[base];
    const py = floats[base + 1];
    const pz = floats[base + 2];
    const sx = floats[base + 7];
    const sy = floats[base + 8];
    const sz = floats[base + 9];
    const r = floats[base + 10];
    const g = floats[base + 11];
    const b = floats[base + 12];
    const a = floats[base + 13];
    const radius = Math.max(sx, sy, sz);
    const o = i * 8;
    out[o] = px;
    out[o + 1] = py;
    out[o + 2] = pz;
    out[o + 3] = radius;
    out[o + 4] = r;
    out[o + 5] = g;
    out[o + 6] = b;
    out[o + 7] = a;
  }
  return out;
}
