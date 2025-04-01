// feature.js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const featLists = gsap.utils.toArray(".un_feature_contentList");

featLists.forEach((list, index) => {
  const listWidths = list.scrollWidth;
  const horizontalScroll = gsap.fromTo(
    list,
    {
      x: 0,
    },
    {
      x: () => -(listWidths - list.offsetWidth),
      scrollTrigger: {
        trigger: list,
        start: "bottom+=200 bottom",
        // markers: true,
        scrub: true,
      },
    },
  );
});

const featNames = gsap.utils.toArray(".un_feature_productName .inner");
featNames.forEach((item, index) => {
  console.log(item.scrollWidth);
  gsap.to(item, {
    x: () => -0.5 * item.scrollWidth,
    duration: item.scrollWidth * 0.005,
    ease: "linear",
    repeat: -1,
  });
});
