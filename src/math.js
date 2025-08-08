export function vec3Sub(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}

export function vec3Cross(out, a, b) {
  const ax = a[0], ay = a[1], az = a[2];
  const bx = b[0], by = b[1], bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}

export function vec3Normalize(out, a) {
  const x = a[0], y = a[1], z = a[2];
  const len = Math.hypot(x, y, z) || 1;
  out[0] = x / len;
  out[1] = y / len;
  out[2] = z / len;
  return out;
}

export function mat4Perspective(out, fovy, aspect, near, far) {
  const f = 1.0 / Math.tan(fovy / 2);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;
  if (far != null && far !== Infinity) {
    const nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }
  return out;
}

export function mat4LookAt(out, eye, center, up) {
  const f = vec3Normalize(new Float32Array(3), vec3Sub(new Float32Array(3), center, eye));
  const s = vec3Normalize(new Float32Array(3), vec3Cross(new Float32Array(3), f, up));
  const u = vec3Cross(new Float32Array(3), s, f);

  out[0] = s[0];
  out[1] = u[0];
  out[2] = -f[0];
  out[3] = 0;
  out[4] = s[1];
  out[5] = u[1];
  out[6] = -f[1];
  out[7] = 0;
  out[8] = s[2];
  out[9] = u[2];
  out[10] = -f[2];
  out[11] = 0;
  out[12] = - (s[0]*eye[0] + s[1]*eye[1] + s[2]*eye[2]);
  out[13] = - (u[0]*eye[0] + u[1]*eye[1] + u[2]*eye[2]);
  out[14] = f[0]*eye[0] + f[1]*eye[1] + f[2]*eye[2];
  out[15] = 1;
  return out;
}

export function mat4Multiply(out, a, b) {
  const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

  const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
  const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
  const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
  const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

  out[0] = b00*a00 + b01*a10 + b02*a20 + b03*a30;
  out[1] = b00*a01 + b01*a11 + b02*a21 + b03*a31;
  out[2] = b00*a02 + b01*a12 + b02*a22 + b03*a32;
  out[3] = b00*a03 + b01*a13 + b02*a23 + b03*a33;
  out[4] = b10*a00 + b11*a10 + b12*a20 + b13*a30;
  out[5] = b10*a01 + b11*a11 + b12*a21 + b13*a31;
  out[6] = b10*a02 + b11*a12 + b12*a22 + b13*a32;
  out[7] = b10*a03 + b11*a13 + b12*a23 + b13*a33;
  out[8] = b20*a00 + b21*a10 + b22*a20 + b23*a30;
  out[9] = b20*a01 + b21*a11 + b22*a21 + b23*a31;
  out[10]= b20*a02 + b21*a12 + b22*a22 + b23*a32;
  out[11]= b20*a03 + b21*a13 + b22*a23 + b23*a33;
  out[12]= b30*a00 + b31*a10 + b32*a20 + b33*a30;
  out[13]= b30*a01 + b31*a11 + b32*a21 + b33*a31;
  out[14]= b30*a02 + b31*a12 + b32*a22 + b33*a32;
  out[15]= b30*a03 + b31*a13 + b32*a23 + b33*a33;
  return out;
}

export function mat4Invert(out, a) {
  const m = a;
  const b00 = m[0] * m[5] - m[1] * m[4];
  const b01 = m[0] * m[6] - m[2] * m[4];
  const b02 = m[0] * m[7] - m[3] * m[4];
  const b03 = m[1] * m[6] - m[2] * m[5];
  const b04 = m[1] * m[7] - m[3] * m[5];
  const b05 = m[2] * m[7] - m[3] * m[6];
  const b06 = m[8] * m[13] - m[9] * m[12];
  const b07 = m[8] * m[14] - m[10] * m[12];
  const b08 = m[8] * m[15] - m[11] * m[12];
  const b09 = m[9] * m[14] - m[10] * m[13];
  const b10 = m[9] * m[15] - m[11] * m[13];
  const b11 = m[10]* m[15] - m[11] * m[14];

  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) return null;
  const invDet = 1.0 / det;

  out[0] = ( m[5]*b11 - m[6]*b10 + m[7]*b09) * invDet;
  out[1] = (-m[1]*b11 + m[2]*b10 - m[3]*b09) * invDet;
  out[2] = ( m[13]*b05 - m[14]*b04 + m[15]*b03) * invDet;
  out[3] = (-m[9]*b05 + m[10]*b04 - m[11]*b03) * invDet;
  out[4] = (-m[4]*b11 + m[6]*b08 - m[7]*b07) * invDet;
  out[5] = ( m[0]*b11 - m[2]*b08 + m[3]*b07) * invDet;
  out[6] = (-m[12]*b05 + m[14]*b02 - m[15]*b01) * invDet;
  out[7] = ( m[8]*b05 - m[10]*b02 + m[11]*b01) * invDet;
  out[8] = ( m[4]*b10 - m[5]*b08 + m[7]*b06) * invDet;
  out[9] = (-m[0]*b10 + m[1]*b08 - m[3]*b06) * invDet;
  out[10]= ( m[12]*b04 - m[13]*b02 + m[15]*b00) * invDet;
  out[11]= (-m[8]*b04 + m[9]*b02 - m[11]*b00) * invDet;
  out[12]= (-m[4]*b09 + m[5]*b07 - m[6]*b06) * invDet;
  out[13]= ( m[0]*b09 - m[1]*b07 + m[2]*b06) * invDet;
  out[14]= (-m[12]*b03 + m[13]*b01 - m[14]*b00) * invDet;
  out[15]= ( m[8]*b03 - m[9]*b01 + m[10]*b00) * invDet;
  return out;
}

export function vec4TransformMat4(out, v, m) {
  const x = v[0], y = v[1], z = v[2], w = v[3];
  out[0] = m[0]*x + m[4]*y + m[8]*z + m[12]*w;
  out[1] = m[1]*x + m[5]*y + m[9]*z + m[13]*w;
  out[2] = m[2]*x + m[6]*y + m[10]*z + m[14]*w;
  out[3] = m[3]*x + m[7]*y + m[11]*z + m[15]*w;
  return out;
}
