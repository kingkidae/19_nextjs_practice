"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Side } from "@/lib/types";

const INK = "#18181a";
const LINEN = "#ece5d6";

function faceTexture(label: string, bg: string, sub: string) {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const font = getComputedStyle(document.body).getPropertyValue("--font-black-han") || "sans-serif";
  g.fillStyle = bg;
  g.fillRect(0, 0, size, size);
  // 테두리 링 두 줄: 동전의 각인
  g.strokeStyle = LINEN;
  g.lineWidth = 10;
  g.beginPath();
  g.arc(size / 2, size / 2, size / 2 - 30, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 3;
  g.beginPath();
  g.arc(size / 2, size / 2, size / 2 - 52, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = LINEN;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `118px ${font}`;
  g.fillText(label, size / 2, size / 2 - 10);
  g.font = `44px ${font}`;
  g.fillText(sub, size / 2, size / 2 + 100);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

interface Props {
  /** hero: 마우스를 따라 기울고 클릭하면 뒤집힌다. roulette: result 면으로 떨어진다. */
  mode: "hero" | "roulette";
  result?: Side | null;
  onDone?: () => void;
  className?: string;
  label?: string;
}

export function Coin({ mode, result, onDone, className, label }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      el.dataset.fallback = "true";
      if (mode === "roulette") setTimeout(() => doneRef.current?.(), 800);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 4, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xf2301f, 1.2);
    rim.position.set(-5, -2, -3);
    scene.add(rim);

    const geo = new THREE.CylinderGeometry(1.8, 1.8, 0.26, 128, 1);
    geo.rotateX(Math.PI / 2); // 원판 면이 카메라(z)를 보게 눕힌다
    const prosTex = faceTexture("PROS", "#2747d8", "찬성");
    const consTex = faceTexture("CONS", "#f2301f", "반대");
    // 실린더 캡의 UV 방향 보정
    prosTex.center.set(0.5, 0.5);
    consTex.center.set(0.5, 0.5);
    prosTex.rotation = Math.PI / 2;
    consTex.rotation = Math.PI / 2;
    const mats = [
      new THREE.MeshStandardMaterial({ color: INK, metalness: 0.7, roughness: 0.35 }),
      new THREE.MeshStandardMaterial({ map: prosTex, metalness: 0.15, roughness: 0.55 }),
      new THREE.MeshStandardMaterial({ map: consTex, metalness: 0.15, roughness: 0.55 }),
    ];
    const coin = new THREE.Mesh(geo, mats);
    scene.add(coin);

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // ── hero 상호작용 ──
    const pointer = { x: 0, y: 0 };
    let flipTarget = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onClick = () => {
      flipTarget += Math.PI;
    };
    if (mode === "hero") {
      window.addEventListener("pointermove", onMove);
      el.addEventListener("click", onClick);
    }

    // ── roulette 연출 ──
    const SPIN_MS = reduce ? 300 : 5200;
    const turns = 9;
    const spinTo = turns * Math.PI * 2 + (result === "cons" ? Math.PI : 0);
    const start = performance.now();
    let finished = false;

    let raf = 0;
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      if (mode === "hero") {
        const sway = reduce ? 0 : Math.sin(t * 0.8) * 0.12;
        coin.rotation.y += (flipTarget + pointer.x * 0.5 + sway - coin.rotation.y) * 0.08;
        coin.rotation.x += (pointer.y * 0.35 - coin.rotation.x) * 0.08;
        coin.position.y = reduce ? 0 : Math.sin(t * 1.3) * 0.08;
      } else {
        const p = Math.min(1, (now - start) / SPIN_MS);
        const ease = 1 - Math.pow(1 - p, 4);
        coin.rotation.y = spinTo * ease;
        coin.rotation.x = Math.sin(p * Math.PI) * 0.5;
        coin.position.y = Math.sin(p * Math.PI) * 1.2;
        coin.scale.setScalar(1 + Math.sin(p * Math.PI) * 0.15);
        if (p >= 1 && !finished) {
          finished = true;
          doneRef.current?.();
        }
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("click", onClick);
      geo.dispose();
      mats.forEach((m) => m.dispose());
      prosTex.dispose();
      consTex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [mode, result]);

  return (
    <div
      ref={mount}
      className={`${className ?? ""} ${mode === "hero" ? "cursor-pointer" : ""}`}
      role="img"
      aria-label={label ?? "PROS 와 CONS 가 새겨진 동전"}
    />
  );
}
