// main.js
import Alpine from "alpinejs";
import modalComponent from "./modal.js";
import "swiper/css/bundle";

import "./hero.js"; // hero.jsをインポート
import "./feature.js"; // feature.jsをインポート

window.Alpine = Alpine;
Alpine.data("modalComponent", modalComponent);
Alpine.start();
