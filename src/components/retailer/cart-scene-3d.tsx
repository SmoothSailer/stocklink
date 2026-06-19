"use client";

import { useMemo, Suspense, Component, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, useTexture, Float, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { CartItem } from "@/hooks/use-cart";

// ── Simple error boundary for R3F ────────────────────────────────
class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

// ── Procedural wood texture ──────────────────────────────────────
function createWoodTexture(): THREE.CanvasTexture {
  if (typeof document === "undefined") {
    return new THREE.CanvasTexture({ width: 512, height: 512 } as HTMLCanvasElement);
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const baseGrad = ctx.createLinearGradient(0, 0, 512, 512);
  baseGrad.addColorStop(0, "#d4a56a");
  baseGrad.addColorStop(0.5, "#c99554");
  baseGrad.addColorStop(1, "#b8854a");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 180; i++) {
    const y = Math.random() * 512;
    const w = 0.5 + Math.random() * 2;
    ctx.strokeStyle = `rgba(80,40,15,${0.02 + Math.random() * 0.07})`;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < 512; x += 8) {
      ctx.lineTo(x, y + Math.sin(x * 0.008 + y * 0.01) * 4 + Math.sin(x * 0.025) * 2);
    }
    ctx.stroke();
  }

  for (let k = 0; k < 6; k++) {
    const kx = 50 + Math.random() * 412;
    const ky = 50 + Math.random() * 412;
    const kr = 10 + Math.random() * 30;
    const grad = ctx.createRadialGradient(kx, ky, kr * 0.2, kx, ky, kr);
    grad.addColorStop(0, "rgba(55,28,10,0.65)");
    grad.addColorStop(0.4, "rgba(100,50,20,0.35)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(kx, ky, kr, kr * (0.4 + Math.random() * 0.4), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fillRect(0, 0, 512, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.5, 1.5);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let _woodTexture: THREE.CanvasTexture | null = null;
function getWoodTexture(): THREE.CanvasTexture {
  if (!_woodTexture) _woodTexture = createWoodTexture();
  return _woodTexture;
}

// ── Wooden pallet ────────────────────────────────────────────────
function Pallet() {
  const woodTex = useMemo(() => getWoodTexture(), []);
  const w = 5.5;
  const d = 3.5;
  const plankH = 0.12;
  const plankCount = 5;

  return (
    <group position={[0, -0.06, 0]}>
      {Array.from({ length: plankCount }).map((_, i) => (
        <mesh
          key={`plank-${i}`}
          position={[0, 0, -d / 2 + 0.15 + i * ((d - 0.3) / (plankCount - 1))]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[w, plankH, 0.22]} />
          <meshStandardMaterial map={woodTex} roughness={0.65} metalness={0.02} color="#c49a6c" />
        </mesh>
      ))}
      {[-1, 0, 1].map((_, i) => {
        const rx = -w / 2 + 0.4 + i * ((w - 0.8) / 2);
        return (
          <mesh key={`runner-${i}`} position={[rx, -plankH - 0.08, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.28, 0.16, d]} />
            <meshStandardMaterial map={woodTex} roughness={0.75} metalness={0.02} color="#a87848" />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Category styling ─────────────────────────────────────────────
const CATEGORY_STYLES: Record<string, { bg: string; accent: string; label: string }> = {
  rice:      { bg: "#fef9f0", accent: "#e8c97a", label: "#b8903a" },
  oil:       { bg: "#fffdf5", accent: "#d4ba5e", label: "#8a7420" },
  sugar:     { bg: "#fef8fb", accent: "#e0a8c0", label: "#8a5070" },
  flour:     { bg: "#fdfaf6", accent: "#d4c5a0", label: "#8a7040" },
  lpg:       { bg: "#fef8f6", accent: "#e89888", label: "#8a4030" },
  beverages: { bg: "#f6fafe", accent: "#90c0e0", label: "#3a608a" },
  dairy:     { bg: "#f8fcfe", accent: "#a0d0e8", label: "#4a6a8a" },
  cleaning:  { bg: "#f6fdf8", accent: "#90d0b0", label: "#3a6a50" },
};

const DEFAULT_STYLE = { bg: "#fafafa", accent: "#c0c0c0", label: "#606060" };

// ── Textured box (all faces covered by product image) ────────────
function TexturedBox({
  url,
  bw,
  bh,
  bd,
  accent,
  label,
  category,
  quantity,
}: {
  url: string;
  bw: number;
  bh: number;
  bd: number;
  accent: string;
  label: string;
  category: string;
  quantity: number;
}) {
  const texture = useTexture(url);
  if (!texture) {
    return (
      <mesh castShadow receiveShadow>
        <boxGeometry args={[bw, bh, bd]} />
        <meshStandardMaterial color="#fafafa" roughness={0.4} metalness={0.03} />
      </mesh>
    );
  }
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[bw, bh, bd]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.4}
          metalness={0.03}
        />
      </mesh>

      <mesh position={[0, bh / 2 + 0.008, 0]} castShadow>
        <boxGeometry args={[bw + 0.02, 0.025, bd + 0.02]} />
        <meshStandardMaterial color={accent} roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh position={[0, -bh / 2 - 0.008, 0]} castShadow>
        <boxGeometry args={[bw + 0.02, 0.025, bd + 0.02]} />
        <meshStandardMaterial color={accent} roughness={0.5} metalness={0.05} />
      </mesh>

      <Text
        position={[bw * 0.28, bh / 2 + 0.02, 0]}
        fontSize={0.075}
        color={label}
        anchorX="center"
        anchorY="bottom"
        fontWeight="bold"
        letterSpacing={0.02}
      >
        {category.toUpperCase()}
      </Text>

      {quantity > 1 && (
        <QuantityBadge
          position={[bw * 0.38, -bh / 2 - 0.01, 0]}
          count={quantity}
          color={label}
        />
      )}
    </>
  );
}

// ── Plain colored box (no image) ──────────────────────────────────
function PlainBox({
  bw,
  bh,
  bd,
  bg,
  accent,
  label,
  category,
  quantity,
}: {
  bw: number;
  bh: number;
  bd: number;
  bg: string;
  accent: string;
  label: string;
  category: string;
  quantity: number;
}) {
  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[bw, bh, bd]} />
        <meshStandardMaterial color={bg} roughness={0.4} metalness={0.03} />
      </mesh>

      <mesh position={[0, bh / 2 + 0.008, 0]} castShadow>
        <boxGeometry args={[bw + 0.02, 0.025, bd + 0.02]} />
        <meshStandardMaterial color={accent} roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh position={[0, -bh / 2 - 0.008, 0]} castShadow>
        <boxGeometry args={[bw + 0.02, 0.025, bd + 0.02]} />
        <meshStandardMaterial color={accent} roughness={0.5} metalness={0.05} />
      </mesh>

      <Text
        position={[bw * 0.28, bh / 2 + 0.02, 0]}
        fontSize={0.075}
        color={label}
        anchorX="center"
        anchorY="bottom"
        fontWeight="bold"
        letterSpacing={0.02}
      >
        {category.toUpperCase()}
      </Text>

      {quantity > 1 && (
        <QuantityBadge
          position={[bw * 0.38, -bh / 2 - 0.01, 0]}
          count={quantity}
          color={label}
        />
      )}
    </>
  );
}

// ── Single product box ───────────────────────────────────────────
function ProductBox({
  item,
  y,
}: {
  item: CartItem;
  y: number;
}) {
  const style = CATEGORY_STYLES[item.category] ?? DEFAULT_STYLE;
  const bw = 0.9;
  const bh = 0.6;
  const bd = 0.8;

  return (
    <group position={[0, y, 0]}>
      {item.imageUrl ? (
        <Suspense
          fallback={
            <PlainBox
              bw={bw} bh={bh} bd={bd}
              bg={style.bg} accent={style.accent} label={style.label}
              category={item.category} quantity={item.quantity}
            />
          }
        >
          <ErrorBoundary
            fallback={
              <PlainBox
                bw={bw} bh={bh} bd={bd}
                bg={style.bg} accent={style.accent} label={style.label}
                category={item.category} quantity={item.quantity}
              />
            }
          >
            <TexturedBox
              url={item.imageUrl}
              bw={bw} bh={bh} bd={bd}
              accent={style.accent} label={style.label}
              category={item.category} quantity={item.quantity}
            />
          </ErrorBoundary>
        </Suspense>
      ) : (
        <PlainBox
          bw={bw} bh={bh} bd={bd}
          bg={style.bg} accent={style.accent} label={style.label}
          category={item.category} quantity={item.quantity}
        />
      )}
    </group>
  );
}

// ── Quantity badge ───────────────────────────────────────────────
function QuantityBadge({
  position,
  count,
  color,
}: {
  position: [number, number, number];
  count: number;
  color: string;
}) {
  const geom = useMemo(() => {
    const shape = new THREE.Shape();
    const w = 0.48;
    const h = 0.2;
    const r = 0.06;
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return new THREE.ShapeGeometry(shape);
  }, []);

  return (
    <group position={position}>
      <mesh position={[0, 0, 0.01]}>
        <primitive object={geom} attach="geometry" />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </mesh>
      <Text
        position={[0, 0, 0.04]}
        fontSize={0.13}
        color="#fff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {`x${count}`}
      </Text>
    </group>
  );
}

// ── Vertical stack of products ───────────────────────────────────
function ProductStack({
  items,
  position: [sx, sy, sz],
}: {
  items: CartItem[];
  position: [number, number, number];
}) {
  const bh = 0.6;
  const stackHeight = items.length * bh;

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.1} floatingRange={[0, 0.08]}>
      <group position={[sx, sy + stackHeight / 2, sz]}>
        {items.map((item, i) => (
          <ProductBox
            key={`${item.productId}-${item.unit}`}
            item={item}
            y={i * bh - stackHeight / 2 + bh / 2}
          />
        ))}

        {/* Total quantity badge for the stack */}
        {items.length > 1 && (
          <QuantityBadge
            position={[0.5, stackHeight / 2 + 0.15, 0]}
            count={items.reduce((s, i) => s + i.quantity, 0)}
            color={CATEGORY_STYLES[items[0].category]?.label ?? DEFAULT_STYLE.label}
          />
        )}
      </group>
    </Float>
  );
}

// ── Main scene ───────────────────────────────────────────────────
interface CartScene3DProps {
  items: CartItem[];
}

export function CartScene3D({ items }: CartScene3DProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const STACK_SIZE = 3;

  const stacks = useMemo(() => {
    // Chunk items into stacks of up to STACK_SIZE
    const chunks: CartItem[][] = [];
    for (let i = 0; i < items.length; i += STACK_SIZE) {
      chunks.push(items.slice(i, i + STACK_SIZE));
    }

    // Layout stacks in rows (max 3 stacks per row)
    const maxStacksPerRow = 3;
    const spacing = 2.2;

    return chunks.map((chunk, idx) => {
      const row = Math.floor(idx / maxStacksPerRow);
      const col = idx % maxStacksPerRow;
      const stacksInRow = row === Math.floor((chunks.length - 1) / maxStacksPerRow)
        ? chunks.length - row * maxStacksPerRow
        : maxStacksPerRow;
      const rowCenterX = ((stacksInRow - 1) * spacing) / 2;
      const x = col * spacing - rowCenterX;
      const z = row * (spacing + 0.4);
      return { items: chunk, x, z, stackHeight: chunk.length * 0.6 };
    });
  }, [items]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-border/60 bg-muted/30">
        <div className="text-center">
          <div className="mb-2 text-4xl opacity-30">📦</div>
          <p className="text-sm font-medium text-muted-foreground">Your 3D builder is empty</p>
          <p className="text-xs text-muted-foreground/60">Add products to see them here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-80 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-b from-amber-50/20 via-stone-50/30 to-stone-100/20 sm:h-[420px]">
      {!mounted ? (
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <Canvas
          shadows
          camera={{ position: [3, 3.8, 5.5], fov: 38 }}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[8, 10, 6]}
            intensity={1.4}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-8}
            shadow-camera-right={8}
            shadow-camera-top={8}
            shadow-camera-bottom={-8}
            shadow-bias={-0.0005}
            shadow-normalBias={0.02}
          />
          <directionalLight position={[-4, 3, -5]} intensity={0.3} color="#d4c8b8" />
          <directionalLight position={[0, 1, 8]} intensity={0.2} color="#e8f0ff" />

          <Pallet />

          <ContactShadows
            position={[0, -0.35, 0]}
            opacity={0.35}
            scale={8}
            blur={2.5}
            far={5}
            color="#4a3020"
          />

          {stacks.map(({ items: stackItems, x, z, stackHeight }) => (
            <group key={stackItems.map((s) => `${s.productId}-${s.unit}`).join("-")}>
              <ProductStack items={stackItems} position={[x, 0.3, z]} />

              {stackItems.length === 1 ? (
                <Text
                  position={[x, -0.22, z]}
                  fontSize={0.1}
                  color="#6b5b4f"
                  anchorX="center"
                  anchorY="top"
                  maxWidth={1.8}
                >
                  {stackItems[0].name.length > 20
                    ? stackItems[0].name.slice(0, 18) + "…"
                    : stackItems[0].name}
                </Text>
              ) : (
                <Text
                  position={[x, -0.22, z]}
                  fontSize={0.09}
                  color="#6b5b4f"
                  anchorX="center"
                  anchorY="top"
                  maxWidth={1.8}
                >
                  {stackItems.length} products
                </Text>
              )}
            </group>
          ))}

          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            minDistance={2.5}
            maxDistance={12}
            maxPolarAngle={Math.PI / 2.4}
            target={[0, 0.4, 0]}
            dampingFactor={0.12}
          />
        </Canvas>
      )}

      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-card/85 px-4 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-md ring-1 ring-border/40">
        {items.length} product{items.length > 1 ? "s" : ""} &middot; {count} unit{count > 1 ? "s" : ""}
      </div>

      <p className="absolute bottom-1 left-3 text-[10px] text-muted-foreground/50">
        Drag to orbit &middot; Scroll to zoom
      </p>
    </div>
  );
}
