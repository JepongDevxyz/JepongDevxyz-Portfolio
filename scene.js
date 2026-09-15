const LOW_MEMORY_GB = 3;
const MID_MEMORY_GB = 6;
const LOW_CORE_COUNT = 4;
const HIGH_CORE_COUNT = 8;

export function detectPerformanceTier({
  webgl = true,
  reducedMotion = false,
  memory = 4,
  cores = 4,
} = {}) {
  if (!webgl || reducedMotion) return 'low';
  if (memory <= LOW_MEMORY_GB || cores <= LOW_CORE_COUNT) return 'low';
  if (memory >= MID_MEMORY_GB && cores >= HIGH_CORE_COUNT) return 'high';
  return 'mid';
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown shader compilation error';
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || 'Unknown WebGL link error';
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

function getBrowserCapabilities(canvas) {
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const memory = typeof navigator !== 'undefined' && Number.isFinite(navigator.deviceMemory)
    ? navigator.deviceMemory
    : 4;
  const cores = typeof navigator !== 'undefined' && Number.isFinite(navigator.hardwareConcurrency)
    ? navigator.hardwareConcurrency
    : 4;

  let webgl = false;
  try {
    webgl = Boolean(canvas?.getContext?.('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    }));
  } catch {
    webgl = false;
  }

  return { webgl, reducedMotion, memory, cores };
}

function fallbackScene(tier = 'low') {
  return {
    tier,
    setProgress() {},
    setChapter() {},
    resize() {},
    start() {},
    stop() {},
    destroy() {},
  };
}

export function createScene(canvas, options = {}) {
  if (!canvas || typeof window === 'undefined') return fallbackScene('low');

  const capabilities = {
    ...getBrowserCapabilities(canvas),
    ...options.capabilities,
  };
  let tier = options.forceTier || detectPerformanceTier(capabilities);

  if (tier === 'low' || !capabilities.webgl) {
    document.documentElement.classList.add('performance-low', 'scene-fallback');
    return fallbackScene('low');
  }

  let gl;
  try {
    gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: tier === 'high' ? 'high-performance' : 'low-power',
      preserveDrawingBuffer: false,
    });
  } catch {
    gl = null;
  }

  if (!gl) {
    document.documentElement.classList.add('performance-low', 'scene-fallback');
    return fallbackScene('low');
  }

  const vertexSource = `
    attribute vec2 aPosition;
    varying vec2 vUv;
    void main() {
      vUv = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision mediump float;
    varying vec2 vUv;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uProgress;
    uniform float uChapter;
    uniform float uIntensity;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main() {
      vec2 uv = vUv;
      vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
      vec2 p = (uv - 0.5) * aspect;

      float drift = uTime * 0.018;
      float n1 = noise(p * 2.6 + vec2(drift, uProgress * 1.7));
      float n2 = noise(p * 5.0 - vec2(drift * 1.5, uChapter * 0.13));
      float haze = smoothstep(0.18, 0.95, n1 * 0.72 + n2 * 0.28);

      vec2 warmCenter = vec2(-0.48 + sin(uChapter * 0.67) * 0.17, -0.22 + uProgress * 0.18);
      vec2 coolCenter = vec2(0.46 + cos(uChapter * 0.51) * 0.14, 0.26 - uProgress * 0.12);
      float warm = exp(-dot(p - warmCenter, p - warmCenter) * 2.9);
      float cool = exp(-dot(p - coolCenter, p - coolCenter) * 3.4);

      vec3 base = vec3(0.019, 0.026, 0.039);
      vec3 warmColor = vec3(0.52, 0.31, 0.16) * warm;
      vec3 coolColor = vec3(0.17, 0.31, 0.48) * cool;
      vec3 fog = vec3(0.09, 0.105, 0.13) * haze * 0.52;

      float vignette = smoothstep(1.05, 0.2, length((uv - 0.5) * vec2(1.05, 1.0)));
      vec3 color = base + (warmColor + coolColor) * 0.34 * uIntensity + fog * uIntensity;
      color *= 0.72 + vignette * 0.34;

      gl_FragColor = vec4(color, 0.97);
    }
  `;

  let program;
  try {
    program = createProgram(gl, vertexSource, fragmentSource);
  } catch (error) {
    console.warn('[Jepong Devxyz] WebGL disabled:', error);
    document.documentElement.classList.add('performance-low', 'scene-fallback');
    return fallbackScene('low');
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );

  const position = gl.getAttribLocation(program, 'aPosition');
  const uniforms = {
    resolution: gl.getUniformLocation(program, 'uResolution'),
    time: gl.getUniformLocation(program, 'uTime'),
    progress: gl.getUniformLocation(program, 'uProgress'),
    chapter: gl.getUniformLocation(program, 'uChapter'),
    intensity: gl.getUniformLocation(program, 'uIntensity'),
  };

  gl.useProgram(program);
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  document.documentElement.classList.add(`performance-${tier}`);

  let globalProgress = 0;
  let chapterIndex = 0;
  let rafId = 0;
  let running = false;
  let visible = document.visibilityState !== 'hidden';
  let renderScale = 1;
  let frameSamples = [];
  let lastFrame = performance.now();
  const startedAt = lastFrame;

  const targetFpsMs = tier === 'high' ? 20 : 25;
  const maxDpr = tier === 'high' ? 1.5 : 1;
  const minScale = tier === 'high' ? 0.68 : 0.58;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr) * renderScale;
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function tuneFrameBudget(delta) {
    if (delta <= 0 || delta > 250) return;
    frameSamples.push(delta);
    if (frameSamples.length < 45) return;

    const average = frameSamples.reduce((sum, value) => sum + value, 0) / frameSamples.length;
    frameSamples = [];

    if (average > targetFpsMs && renderScale > minScale) {
      renderScale = Math.max(minScale, renderScale - 0.1);
      resize();
    }
  }

  function render(now) {
    if (!running) return;
    rafId = window.requestAnimationFrame(render);
    if (!visible) return;

    const delta = now - lastFrame;
    lastFrame = now;
    tuneFrameBudget(delta);
    resize();

    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.time, (now - startedAt) / 1000);
    gl.uniform1f(uniforms.progress, globalProgress);
    gl.uniform1f(uniforms.chapter, chapterIndex);
    gl.uniform1f(uniforms.intensity, tier === 'high' ? 1 : 0.72);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function start() {
    if (running) return;
    running = true;
    lastFrame = performance.now();
    rafId = window.requestAnimationFrame(render);
  }

  function stop() {
    running = false;
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function setProgress(value) {
    globalProgress = Math.min(1, Math.max(0, Number(value) || 0));
  }

  function setChapter(value) {
    chapterIndex = Math.max(0, Number(value) || 0);
  }

  function onVisibilityChange() {
    visible = document.visibilityState !== 'hidden';
    if (visible) lastFrame = performance.now();
  }

  document.addEventListener('visibilitychange', onVisibilityChange, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  resize();

  return {
    get tier() {
      return tier;
    },
    setProgress,
    setChapter,
    resize,
    start,
    stop,
    destroy() {
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', resize);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
    },
  };
}
