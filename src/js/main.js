// src/js/main.js
import Alpine from "alpinejs";
import modalComponent from "./modal.js";
import initHero from './hero.js';
import initFeatureAnimations from './feature.js';

window.Alpine = Alpine;
Alpine.data("modalComponent", modalComponent);
Alpine.start();

// --- DOM読み込み完了後にアニメーションを初期化 ---
document.addEventListener('DOMContentLoaded', async () => { // ★ async を追加
  console.log('DOM fully loaded and parsed');

  // ヒーローアニメーション初期化
  try {
    // ★ await を追加 (initHero が async function のため)
    await initHero('hero'); // HTML内の <div id="hero"> を想定
  } catch (error) {
    console.error("Failed to initialize hero animation:", error);
  }

  // 特徴セクションのアニメーション初期化
  try {
    initFeatureAnimations();
  } catch (error) {
    console.error("Failed to initialize feature animations:", error);
  }
});
// -----------------------------------------------