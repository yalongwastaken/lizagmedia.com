import { watchElementAtMiddle } from "./element-at-middle.js";

const sectionLinks = [...document.querySelectorAll(".site-nav a")];
const linkedSections = sectionLinks.map((sectionLink) => document.querySelector(sectionLink.getAttribute("href")));
watchElementAtMiddle(linkedSections, { scroller: null, scrollAxis: "y" }, markCurrentSection);

function markCurrentSection(currentSectionIndex) {
  sectionLinks.forEach((sectionLink, sectionIndex) => {
    if (sectionIndex === currentSectionIndex) {
      sectionLink.setAttribute("aria-current", "location");
    } else {
      sectionLink.removeAttribute("aria-current");
    }
  });
}
