// main.js
import Alpine from "alpinejs";
import modalComponent from "./modal.js";
import "swiper/css/bundle";

window.Alpine = Alpine;
Alpine.data("modalComponent", modalComponent);
Alpine.start();
