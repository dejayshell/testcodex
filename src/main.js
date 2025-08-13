import { mat4Perspective, mat4LookAt, mat4Multiply, mat4Invert, vec4TransformMat4, vec3Sub, vec3Cross, vec3Normalize } from './math.js';
import { loadSplat } from './splat.js';

async function init() {
  if (!navigator.gpu) {
    alert('WebGPU not supported');
    return;
  }
  const canvas = document.getElementById('webgpu-canvas');
  const context = canvas.getContext('webgpu');

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({device, format, alphaMode:'opaque'});

  const size = {
    width: Math.floor(canvas.clientWidth * devicePixelRatio),
    height: Math.floor(canvas.clientHeight * devicePixelRatio)
  };
  canvas.width = size.width;
  canvas.height = size.height;

  const depthTexture = device.createTexture({
    size,
    format: 'depth32float',
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
  });

  const quadVertices = new Float32Array([
    -1,-1, 1,-1, -1,1,
    -1,1, 1,-1, 1,1
  ]);
  const vertexBuffer = device.createBuffer({size: quadVertices.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST});
  device.queue.writeBuffer(vertexBuffer, 0, quadVertices);

  let gaussians;
  try {
    gaussians = await loadSplat('./model.splat');
  } catch (e) {
    console.warn('loadSplat failed, using demo data', e);
    gaussians = new Float32Array([
      // x,y,z,radius,r,g,b,a
      0,0,0,0.5, 1,0,0,1,
      1,0,0,0.3, 0,1,0,1,
      -1,0,0,0.3, 0,0,1,1
    ]);
  }
  const instanceBuffer = device.createBuffer({size: gaussians.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST});
  device.queue.writeBuffer(instanceBuffer, 0, gaussians);

  const shader = `
struct Camera {
  viewProj : mat4x4<f32>;
  right : vec3<f32>;
  _pad0 : f32;
  up : vec3<f32>;
  _pad1 : f32;
};
@group(0) @binding(0) var<uniform> camera : Camera;

struct VertexIn {
  @location(0) pos : vec2<f32>;
  @location(1) center : vec3<f32>;
  @location(2) radius : f32;
  @location(3) color : vec3<f32>;
};

struct VertexOut {
  @builtin(position) Position : vec4<f32>;
  @location(0) color : vec3<f32>;
  @location(1) local : vec2<f32>;
};

@vertex
fn vs_main(input: VertexIn) -> VertexOut {
  var out : VertexOut;
  let worldPos = input.center + camera.right * input.pos.x * input.radius + camera.up * input.pos.y * input.radius;
  out.Position = camera.viewProj * vec4<f32>(worldPos, 1.0);
  out.color = input.color;
  out.local = input.pos;
  return out;
}

@fragment
fn fs_main(input: VertexOut) -> @location(0) vec4<f32> {
  let r2 = dot(input.local, input.local);
  if (r2 > 1.0) { discard; }
  let alpha = exp(-4.0 * r2);
  return vec4<f32>(input.color * alpha, alpha);
}
`;

  const module = device.createShaderModule({code: shader});
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module,
      entryPoint: 'vs_main',
      buffers: [
        {arrayStride: 8, attributes:[{shaderLocation:0, offset:0, format:'float32x2'}]},
        {arrayStride: 32, stepMode:'instance', attributes:[
          {shaderLocation:1, offset:0, format:'float32x3'},
          {shaderLocation:2, offset:12, format:'float32'},
          {shaderLocation:3, offset:16, format:'float32x3'}
        ]}
      ]
    },
    fragment:{
      module,
      entryPoint:'fs_main',
      targets:[{format, blend:{color:{srcFactor:'src-alpha', dstFactor:'one-minus-src-alpha'}, alpha:{srcFactor:'one', dstFactor:'one-minus-src-alpha'}}}]
    },
    primitive:{topology:'triangle-list'},
    depthStencil:{format:'depth32float', depthWriteEnabled:true, depthCompare:'less'}
  });

  const cameraBuffer = device.createBuffer({size: 4*4*4 + 2*4*4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries:[{binding:0, resource:{buffer:cameraBuffer}}]
  });

  function updateCamera() {
    const aspect = size.width / size.height;
    const proj = mat4Perspective(new Float32Array(16), Math.PI/4, aspect, 0.1, 100);
    const eye = [0,0,5];
    const center = [0,0,0];
    const up = [0,1,0];
    const view = mat4LookAt(new Float32Array(16), eye, center, up);
    const viewProj = mat4Multiply(new Float32Array(16), proj, view);

    const f = vec3Normalize(new Float32Array(3), vec3Sub(new Float32Array(3), center, eye));
    const right = vec3Normalize(new Float32Array(3), vec3Cross(new Float32Array(3), f, up));
    const trueUp = vec3Cross(new Float32Array(3), right, f);

    const array = new Float32Array(24);
    array.set(viewProj, 0);
    array.set(right, 16);
    array[19] = 0;
    array.set(trueUp, 20);
    array[23] = 0;
    device.queue.writeBuffer(cameraBuffer, 0, array);
    return {viewProj};
  }

  let viewProjMat;
  function frame() {
    viewProjMat = updateCamera().viewProj;
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments:[{view: context.getCurrentTexture().createView(), clearValue:{r:0,g:0,b:0,a:1}, loadOp:'clear', storeOp:'store'}],
      depthStencilAttachment:{view:depthTexture.createView(), depthClearValue:1, depthLoadOp:'clear', depthStoreOp:'store'}
    });
    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setVertexBuffer(1, instanceBuffer);
    pass.setBindGroup(0, bindGroup);
    pass.draw(6, gaussians.length/8);
    pass.end();
    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  async function getDepthAt(px, py) {
    const buffer = device.createBuffer({size:4, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ});
    const encoder = device.createCommandEncoder();
    encoder.copyTextureToBuffer({texture: depthTexture, origin:{x:px, y:py, z:0}}, {buffer, bytesPerRow:4}, {width:1, height:1, depthOrArrayLayers:1});
    device.queue.submit([encoder.finish()]);
    await buffer.mapAsync(GPUMapMode.READ);
    const d = new Float32Array(buffer.getMappedRange())[0];
    buffer.unmap();
    return d;
  }

  canvas.addEventListener('click', async (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * devicePixelRatio);
    const y = Math.floor((e.clientY - rect.top) * devicePixelRatio);
    const depth = await getDepthAt(x, y);
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = ((e.clientY - rect.top) / rect.height) * -2 + 1;
    const clip = [ndcX, ndcY, depth * 2 - 1, 1];
    const inv = mat4Invert(new Float32Array(16), viewProjMat);
    const world = vec4TransformMat4(new Float32Array(4), clip, inv);
    const w = world[3];
    const pos = [world[0]/w, world[1]/w, world[2]/w];
    console.log('Picked world position:', pos);
  });
}

init();
