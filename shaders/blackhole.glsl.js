/**
 * ============================================================================
 * GARGANTUA 3D — RELATIVISTIC BLACK HOLE WEBGL & GLSL SHADER ENGINE
 * Created & Architected by: Abdullaev Samandar (nickname: Seterneus)
 * Copyright (c) 2026 Abdullaev Samandar (Seterneus). All Rights Reserved.
 * Unauthorized removal of attribution is strictly prohibited.
 * ============================================================================
 */

const BlackHoleShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    precision highp float;

    varying vec2 vUv;

    uniform vec2 uResolution;
    uniform float uTime;
    uniform vec3 uCameraPos;
    uniform mat4 uCameraMatrix;
    uniform float uLensingStrength;
    uniform float uDiskSpeed;
    uniform float uDiskDensity;
    uniform int uColorPalette;
    uniform float uAudioPulse;
    uniform float uBloomStrength;
    uniform float uBlackHoleScale;
    uniform float uDopplerAsymmetry;
    uniform float uPhotonSparks;
    uniform float uNebulaBrightness;

    #define PI 3.14159265359
    #define MAX_STEPS 72
    #define STEP_SIZE 0.07

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

    // Fast 3-octave FBM for real-time 60+ FPS high performance
    float fbmFast(vec2 p) {
      float v = 0.0;
      float amp = 0.52;
      mat2 rot = mat2(0.87, 0.48, -0.48, 0.87);
      for (int i = 0; i < 3; i++) {
        v += amp * noise(p);
        p = rot * p * 2.02 + vec2(1.7, 9.2);
        amp *= 0.48;
      }
      return v;
    }

    vec3 getPaletteColor(float t, float dopplerShift) {
      vec3 col = vec3(0.0);

      if (uColorPalette == 0) {
        vec3 deepRed    = vec3(0.85, 0.12, 0.02);
        vec3 warmOrange = vec3(1.00, 0.45, 0.06);
        vec3 brightGold = vec3(1.00, 0.82, 0.32);
        vec3 coreWhite  = vec3(1.00, 0.97, 0.90);

        col = mix(deepRed, warmOrange, smoothstep(0.0, 0.35, t));
        col = mix(col, brightGold, smoothstep(0.35, 0.75, t));
        col = mix(col, coreWhite, smoothstep(0.75, 1.0, t));
        col = mix(col * vec3(1.15, 0.65, 0.38), col * vec3(0.95, 1.05, 1.25), dopplerShift);

      } else if (uColorPalette == 1) {
        vec3 deepBlue  = vec3(0.02, 0.15, 0.65);
        vec3 cyan      = vec3(0.05, 0.70, 0.98);
        vec3 brightIce = vec3(0.60, 0.92, 1.00);
        vec3 coreWhite = vec3(0.95, 0.99, 1.00);

        col = mix(deepBlue, cyan, smoothstep(0.0, 0.35, t));
        col = mix(col, brightIce, smoothstep(0.35, 0.75, t));
        col = mix(col, coreWhite, smoothstep(0.75, 1.0, t));
        col = mix(col * vec3(0.7, 0.85, 1.2), col * vec3(1.1, 1.1, 0.9), dopplerShift);

      } else if (uColorPalette == 2) {
        vec3 deepPurple= vec3(0.38, 0.05, 0.62);
        vec3 magenta   = vec3(0.95, 0.15, 0.72);
        vec3 roseGold  = vec3(1.00, 0.65, 0.82);
        vec3 coreWhite = vec3(1.00, 0.94, 0.98);

        col = mix(deepPurple, magenta, smoothstep(0.0, 0.35, t));
        col = mix(col, roseGold, smoothstep(0.35, 0.75, t));
        col = mix(col, coreWhite, smoothstep(0.75, 1.0, t));

      } else if (uColorPalette == 3) {
        vec3 emberDark = vec3(0.60, 0.05, 0.01);
        vec3 crimson   = vec3(0.95, 0.18, 0.05);
        vec3 solarGold = vec3(1.00, 0.68, 0.18);
        vec3 coreWhite = vec3(1.00, 0.95, 0.85);

        col = mix(emberDark, crimson, smoothstep(0.0, 0.35, t));
        col = mix(col, solarGold, smoothstep(0.35, 0.75, t));
        col = mix(col, coreWhite, smoothstep(0.75, 1.0, t));

      } else if (uColorPalette == 4) {
        // 4: Pure Emerald Green
        vec3 deepGreen   = vec3(0.02, 0.38, 0.10);
        vec3 pureGreen   = vec3(0.05, 0.95, 0.22);
        vec3 brightLime  = vec3(0.50, 1.00, 0.60);
        vec3 coreWhite   = vec3(0.92, 1.00, 0.95);

        col = mix(deepGreen, pureGreen, smoothstep(0.0, 0.35, t));
        col = mix(col, brightLime, smoothstep(0.35, 0.75, t));
        col = mix(col, coreWhite, smoothstep(0.75, 1.0, t));

      } else if (uColorPalette == 5) {
        // 5: Aurora Borealis Green (Northern Lights)
        vec3 arcticTeal  = vec3(0.02, 0.20, 0.48);
        vec3 auroraGreen = vec3(0.10, 0.98, 0.55);
        vec3 cyanGlow    = vec3(0.38, 1.00, 0.90);
        vec3 coreWhite   = vec3(0.92, 1.00, 0.98);

        col = mix(arcticTeal, auroraGreen, smoothstep(0.0, 0.35, t));
        col = mix(col, cyanGlow, smoothstep(0.35, 0.75, t));
        col = mix(col, coreWhite, smoothstep(0.75, 1.0, t));

      } else {
        // 6: Aurora Violet (Geomagnetic Solar Storm)
        vec3 deepViolet   = vec3(0.25, 0.05, 0.58);
        vec3 auroraPurple = vec3(0.78, 0.12, 0.95);
        vec3 auroraMint   = vec3(0.40, 0.95, 0.82);
        vec3 coreWhite    = vec3(0.96, 0.94, 1.00);

        col = mix(deepViolet, auroraPurple, smoothstep(0.0, 0.35, t));
        col = mix(col, auroraMint, smoothstep(0.35, 0.75, t));
        col = mix(col, coreWhite, smoothstep(0.75, 1.0, t));
      }

      return col;
    }

    // Photorealistic Milky Way (~7%), Localized H-Alpha (~15%), & Multi-Spectral Glowing Stars
    vec3 renderCosmicBackgroundFast(vec3 rayDir) {
      vec2 p = rayDir.xy / (abs(rayDir.z) + 1.2) * 2.8;

      // 1. Milky Way Galactic Plane & Core Glow (~5% of sky)
      float mwPlane = abs(rayDir.y * 0.78 - rayDir.x * 0.48 + rayDir.z * 0.2);
      float mwCore  = exp(-mwPlane * mwPlane * 140.0);
      float mwHalo  = exp(-mwPlane * mwPlane * 54.0) * 0.18;

      float riftNoise = fbmFast(p * 2.4);
      float darkRift  = smoothstep(0.32, 0.72, riftNoise) * exp(-mwPlane * 25.0);

      vec3 mwOuterColor = vec3(0.12, 0.18, 0.38);
      vec3 mwCoreColor  = vec3(0.75, 0.68, 0.56);
      vec3 milkyWay = mix(mwOuterColor, mwCoreColor, mwCore) * (mwCore + mwHalo) * (1.0 - darkRift * 0.85) * 0.85;

      // 2. Localized H-Alpha Crimson Emission Nebula Wisps (~15% of sky)
      float neb1 = fbmFast(p * 1.6 + vec2(uTime * 0.003, 0.0));
      float hAlphaDensity = pow(smoothstep(0.58, 0.88, neb1), 1.8) * (mwHalo + 0.35);

      vec3 deepCrimson = vec3(0.90, 0.08, 0.22);
      vec3 brightRuby  = vec3(0.98, 0.28, 0.48);
      vec3 hAlphaCloud = mix(deepCrimson, brightRuby, smoothstep(0.68, 0.88, neb1)) * hAlphaDensity * 1.6 * uNebulaBrightness;

      vec3 nebula = milkyWay + hAlphaCloud;

      // 3. Realistic Multi-Spectral Glowing Stars (Slightly smaller, crisper points)
      vec3 starCoord1 = rayDir * 200.0;
      float starSeed1 = hash(floor(starCoord1.xy) + floor(starCoord1.z) * 11.0);
      vec2 starPos1 = fract(starCoord1.xy) - 0.5;
      float starDist1 = length(starPos1);
      float faintStar = smoothstep(0.11, 0.015, starDist1) * step(0.915, starSeed1);

      vec3 starCoord2 = rayDir * 85.0;
      float starSeed2 = hash(floor(starCoord2.xy) + floor(starCoord2.z) * 37.0);
      vec2 starPos2 = fract(starCoord2.xy) - 0.5;
      float starDist2 = length(starPos2);
      float brightStarCore = smoothstep(0.12, 0.008, starDist2) * step(0.968, starSeed2);
      float brightStarHalo = exp(-starDist2 * 20.0) * step(0.968, starSeed2) * 0.45;

      // Independent color hashes so only visible stars get distributed across spectral classes
      float colorHash1 = fract(starSeed1 * 149.1);
      vec3 faintColor = mix(vec3(0.5, 0.75, 1.0), vec3(1.0, 0.85, 0.55), colorHash1);

      float colorHash2 = fract(starSeed2 * 173.7);
      vec3 starColor;
      if (colorHash2 < 0.28) {
        starColor = vec3(0.2, 0.65, 1.5);   // Vivid Sapphire Blue Giant
      } else if (colorHash2 < 0.52) {
        starColor = vec3(1.5, 0.35, 0.25);  // Ruby Red / Orange Supergiant
      } else if (colorHash2 < 0.78) {
        starColor = vec3(1.5, 1.15, 0.45);  // Warm Golden Solar Star
      } else {
        starColor = vec3(1.2, 1.25, 1.35);  // Crisp Diamond White Star
      }

      float twinkle1 = 0.78 + 0.32 * sin(uTime * (2.2 + starSeed1 * 4.0) + starSeed1 * 6.28318);
      float twinkle2 = 0.75 + 0.35 * sin(uTime * (1.8 + starSeed2 * 3.5) + starSeed2 * 6.28318);

      vec3 stars = faintColor * (faintStar * 0.7) * twinkle1 + starColor * (brightStarCore * 1.8 + brightStarHalo * 0.9) * twinkle2;

      // 4. Distant Andromeda-Style Spiral Galaxy (Gravitationally Lensed into Einstein Arcs behind Gargantua!)
      vec3 galDir = normalize(vec3(-0.58, 0.32, -0.75));
      vec3 galTangent1 = normalize(cross(galDir, vec3(0.0, 1.0, 0.0)));
      vec3 galTangent2 = cross(galDir, galTangent1);
      vec2 galUV = vec2(dot(rayDir - galDir, galTangent1), dot(rayDir - galDir, galTangent2)) * 9.0;
      float galAngle = atan(galUV.y, galUV.x);
      float galR = length(galUV);
      float spiralArm = 0.5 + 0.5 * sin(galAngle * 2.0 - log(galR + 0.04) * 5.0 + uTime * 0.04);
      float galCore = exp(-galR * 16.0) * 1.5;
      float galDisk = exp(-galR * 3.8) * spiralArm * 0.7;
      vec3 spiralGalaxy = mix(vec3(0.3, 0.65, 1.4), vec3(1.3, 1.0, 0.65), galCore) * (galCore + galDisk);

      // 5. Planetary Ring / Eye Nebula (Helix / [O III] Emerald Ring Nebula - Same compact size as Spiral Galaxy)
      vec3 pnDir = normalize(vec3(0.62, -0.25, -0.74));
      float pnDist = length(rayDir - pnDir);
      float pnRing = exp(-pow((pnDist - 0.024) * 85.0, 2.0));
      float pnCore = exp(-pnDist * 38.0) * 0.40;
      vec3 pnColor = mix(vec3(1.3, 0.15, 0.38), vec3(0.05, 1.25, 1.05), smoothstep(0.035, 0.01, pnDist));
      vec3 planetaryNebula = pnColor * (pnRing * 1.5 + pnCore);

      return nebula + stars + spiralGalaxy + planetaryNebula;
    }

    vec4 sampleAccretionDiskFast(vec3 pos, float diskInner, float diskOuter) {
      float r = length(pos.xz);
      float vDist = abs(pos.y);

      // Early fast bounding-cylinder reject (Zero noise evaluations if outside disk!)
      float halfHeight = 0.12 * pow(max(r / diskInner, 0.01), 0.6);
      if (r < diskInner || r > diskOuter || vDist > halfHeight * 2.2) {
        return vec4(0.0);
      }

      float vertFalloff = exp(-pow(vDist / halfHeight, 2.0) * 2.8);
      float radialNorm = (r - diskInner) / (diskOuter - diskInner);
      float radialFalloff = pow(1.0 - radialNorm, 1.4) * smoothstep(0.0, 0.15, radialNorm);

      float keplerSpeed = uTime * uDiskSpeed * 1.8 * pow(diskInner / r, 1.5);
      float angle = atan(pos.z, pos.x);
      vec2 polarCoords = vec2(r * 2.3, angle * 2.2 - keplerSpeed);

      // Single fast 3-octave FBM call instead of two 5-octave calls!
      float plasma = fbmFast(polarCoords);

      float wisps = 0.35 + 0.65 * pow(clamp(plasma * 1.3, 0.0, 1.0), 1.25);
      float density = vertFalloff * radialFalloff * wisps * uDiskDensity * 1.9;
      density *= (1.0 + uAudioPulse * 0.35);

      vec3 velDir = normalize(vec3(-pos.z, 0.0, pos.x));
      vec3 viewDir = normalize(uCameraPos - pos);
      float dopplerFactor = dot(velDir, viewDir);
      float dopplerBoost = clamp(0.72 + 0.35 * dopplerFactor * uDopplerAsymmetry, 0.35, 1.45);

      float intensity = density * dopplerBoost * 1.6;
      float temp = clamp(radialFalloff * 0.85 + wisps * 0.35 + dopplerFactor * 0.20 * uDopplerAsymmetry, 0.0, 1.0);

      vec3 color = getPaletteColor(temp, dopplerBoost) * intensity * 2.8;
      return vec4(color, density);
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);

      float scale = uBlackHoleScale;
      float eventHorizon = 0.38 * scale;
      float photonSphere = 0.56 * scale;
      float diskInner    = 0.58 * scale;
      float diskOuter    = 3.40 * scale;

      vec3 forward = normalize(-uCameraMatrix[2].xyz);
      vec3 right   = normalize(uCameraMatrix[0].xyz);
      vec3 up      = normalize(uCameraMatrix[1].xyz);

      vec3 ro = uCameraPos;
      vec3 rd = normalize(forward * 2.0 + right * uv.x + up * uv.y);

      // Blue Noise ray jittering (dithering) completely breaks up circular stepping bands
      float jitter = hash(gl_FragCoord.xy) * STEP_SIZE * 0.85;
      vec3 pos = ro + rd * jitter;
      vec3 dir = rd;

      vec3 accumulatedColor = vec3(0.0);
      float accumulatedAlpha = 0.0;

      float minRadius = 1000.0;
      bool hitEventHorizon = false;

      for (int i = 0; i < MAX_STEPS; i++) {
        float r = length(pos);
        minRadius = min(minRadius, r);

        if (r < eventHorizon) {
          hitEventHorizon = true;
          break;
        }

        if (r > 12.0 || accumulatedAlpha > 0.98) {
          break;
        }

        vec4 sampleData = sampleAccretionDiskFast(pos, diskInner, diskOuter);
        if (sampleData.a > 0.001) {
          float stepAlpha = clamp(sampleData.a * STEP_SIZE * 3.6, 0.0, 1.0);
          accumulatedColor += (1.0 - accumulatedAlpha) * sampleData.rgb * STEP_SIZE * 4.2;
          accumulatedAlpha += (1.0 - accumulatedAlpha) * stepAlpha;
        }

        if (r < diskOuter * 1.5) {
          vec3 toCenter = -normalize(pos);
          float bendStrength = (0.28 * eventHorizon * uLensingStrength) / max(r * r, 0.05);
          dir = normalize(dir + toCenter * bendStrength * STEP_SIZE);
        }

        // Adaptive outer step: step 2x faster in empty space far outside the accretion disk
        float curStep = (r > diskOuter * 1.35) ? STEP_SIZE * 2.0 : STEP_SIZE;
        pos += dir * curStep;
      }

      float photonRingDist = abs(minRadius - photonSphere);
      float photonRingGlow = exp(-photonRingDist * 32.0 / scale) * 2.4 * (1.0 + uAudioPulse * 0.5);
      float secondaryHalo  = exp(-photonRingDist * 8.0 / scale) * 0.6;

      // Infalling Photon Sparks & Plasma Embers spiraling toward the Event Horizon
      float sparkWave = fract(dir.x * 14.0 + dir.y * 18.0 - uTime * 1.1);
      float sparkMask = step(0.97, sparkWave) * exp(-photonRingDist * 12.0 / scale);
      vec3 photonSparks = getPaletteColor(0.98, 1.3) * sparkMask * uPhotonSparks * 6.5;

      vec3 ringColor = getPaletteColor(0.88, 0.65) * (photonRingGlow + secondaryHalo) + photonSparks;

      if (hitEventHorizon) {
        accumulatedColor = vec3(0.0);
      } else {
        float edgeAA = smoothstep(eventHorizon, eventHorizon + 0.014, minRadius);
        accumulatedColor += (1.0 - accumulatedAlpha) * ringColor;
        if (accumulatedAlpha < 0.99) {
          vec3 cosmicBg = renderCosmicBackgroundFast(dir);
          accumulatedColor += (1.0 - accumulatedAlpha) * cosmicBg;
        }
        accumulatedColor *= edgeAA;
      }

      vec3 finalColor = accumulatedColor * (1.0 + uBloomStrength * 0.45);

      float a = 2.51;
      float b = 0.03;
      float c = 2.43;
      float d = 0.59;
      float e = 0.14;
      finalColor = clamp((finalColor * (a * finalColor + b)) / (finalColor * (c * finalColor + d) + e), 0.0, 1.0);
      finalColor = pow(finalColor, vec3(1.0 / 2.2));

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

const TAAShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uCurrentFrame;
    uniform sampler2D uHistoryFrame;
    uniform float uBlendFactor;

    void main() {
      vec4 curr = texture2D(uCurrentFrame, vUv);
      vec4 prev = texture2D(uHistoryFrame, vUv);
      vec3 blended = mix(prev.rgb, curr.rgb, uBlendFactor);
      gl_FragColor = vec4(blended, 1.0);
    }
  `
};

if (typeof window !== 'undefined') {
  window.BlackHoleShader = BlackHoleShader;
  window.TAAShader = TAAShader;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BlackHoleShader, TAAShader };
}
