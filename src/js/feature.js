// src/js/feature.js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// --- プラグイン登録 ---
gsap.registerPlugin(ScrollTrigger);
// --------------------

// --- 初期化関数をエクスポート ---
export default function initFeatureAnimations() {
  // 横スクロールアニメーション
  const featLists = gsap.utils.toArray(".un_feature_contentList");
  featLists.forEach((list, index) => {
    const listWidth = list.scrollWidth; // ここで取得
    const listVisibleWidth = list.offsetWidth;

    // scrollWidth が offsetWidth より大きい場合のみアニメーション設定
    if (listWidth > listVisibleWidth) {
      gsap.fromTo(
        list,
        { x: 0 },
        {
          x: () => -(listWidth - listVisibleWidth), // 再計算できるように関数形式
          ease: "none", // scrub では ease: "none" が基本
          scrollTrigger: {
            trigger: list,
            start: "bottom bottom", // リストの下端が画面下端に来たら開始
            end: () => `+=${listWidth - listVisibleWidth}`, // スクロール距離を動的に計算
            scrub: 1, // スクロールに滑らかに追従 (1秒程度のラグ)
            pin: false, // 通常、横スクロール要素自体はピン留めしない
            invalidateOnRefresh: true, // リサイズ時に値を再計算
            // markers: true, // デバッグ用
          },
        }
      );
    }
  });

  // 製品名ループアニメーション
  const featNames = gsap.utils.toArray(".un_feature_productName .inner");
  featNames.forEach((item, index) => {
    // scrollWidthが取得できるか確認
    if (item.scrollWidth > item.offsetWidth) {
        const scrollWidth = item.scrollWidth; // ここで取得
      gsap.to(item, {
        x: () => -scrollWidth / 2, // 半分まで移動してループさせる場合など調整
        duration: scrollWidth * 0.01, // 速さを調整
        ease: "linear",
        repeat: -1,
        modifiers: { // ループのための modifier
            x: gsap.utils.unitize(gsap.utils.wrap(-scrollWidth / 2, 0)) // -scrollWidth/2 から 0 の間でループ
        }
      });
    } else {
        console.warn("Product name inner element is not scrollable:", item);
    }
  });

  console.log('Feature animations initialized.');
}
// --- ここまで ---