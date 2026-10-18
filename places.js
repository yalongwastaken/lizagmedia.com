import { Map, Marker, NavigationControl } from "./vendor/maplibre-gl/maplibre-gl.mjs";
import { watchElementAtMiddle } from "./element-at-middle.js";
import { openPhotoViewer } from "./photo-viewer.js";

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/fiord";
const WHOLE_EARTH_VIEW = { center: [175, 20], zoom: 1.9 };
const NO_PADDING = { top: 0, right: 0, bottom: 0, left: 0 };
const monthYearFormat = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

const placesSection = document.getElementById("places");
const photosToggle = placesSection.querySelector(".photos-toggle");
const stops = [...document.querySelectorAll(".stop")].map(readStop).sort(byEarliestPhoto);
document.querySelector(".stops").append(...stops.map((stop) => stop.section));
const globeMap = createGlobeMap(document.getElementById("globe"));
const stopPins = stops.map((stop) => addStopPin(globeMap, stop));
const placesNavLinks = buildPlacesNav(document.querySelector(".globe-stage"), stops);
labelStopPanels(stops);
writeCountryCount(stops);
openViewerFromStopPhotos(stops);
photosToggle.addEventListener("click", togglePhotos);
let currentStopIndex = null;
watchElementAtMiddle(stops.map((stop) => stop.section), { scroller: null, scrollAxis: "y" }, showCurrentStop);

function readStop(stopSection) {
  const stopView = {
    center: [Number(stopSection.dataset.lon), Number(stopSection.dataset.lat)],
    zoom: Number(stopSection.dataset.zoom),
  };
  if (![...stopView.center, stopView.zoom].every(Number.isFinite)) {
    throw new Error(`stop #${stopSection.id}: data-lon, data-lat and data-zoom must all be numbers`);
  }
  if (!stopSection.dataset.country) {
    throw new Error(`stop #${stopSection.id}: data-country must name the country the stop is in`);
  }
  return {
    section: stopSection,
    view: stopView,
    country: stopSection.dataset.country,
    name: stopSection.querySelector(".stop-name").textContent,
    photoLinks: [...stopSection.querySelectorAll(".stop-photos a")],
    photos: [...stopSection.querySelectorAll(".stop-photos img")].map(readPhoto),
  };
}

function readPhoto(photoImage) {
  const takenDay = photoImage.dataset.taken ?? "";
  const takenOn = new Date(`${takenDay}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(takenDay) || Number.isNaN(takenOn.getTime())) {
    throw new Error(`photo ${photoImage.getAttribute("src")}: data-taken must be the day it was taken, like 2025-10-12`);
  }
  return {
    src: photoImage.getAttribute("src"),
    alt: photoImage.alt,
    width: Number(photoImage.getAttribute("width")),
    height: Number(photoImage.getAttribute("height")),
    takenOn,
  };
}

function byEarliestPhoto(firstStop, secondStop) {
  return earliestTakenOn(firstStop) - earliestTakenOn(secondStop);
}

function earliestTakenOn(stop) {
  return Math.min(...stop.photos.map((photo) => photo.takenOn));
}

function createGlobeMap(globeContainer) {
  const pageBackground = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
  const newGlobeMap = new Map({
    container: globeContainer,
    style: MAP_STYLE_URL,
    ...WHOLE_EARTH_VIEW,
    // Cooperative gestures make one finger scroll the page and two fingers
    // move the map on phones; zooming is left to the buttons alone.
    cooperativeGestures: true,
    scrollZoom: false,
    dragRotate: false,
    touchPitch: false,
    attributionControl: { compact: true },
  });
  newGlobeMap.touchZoomRotate.disableRotation();
  newGlobeMap.keyboard.disableRotation();
  newGlobeMap.addControl(new NavigationControl({ showCompass: false }), "top-left");
  newGlobeMap.on("style.load", () => {
    newGlobeMap.setProjection({ type: "globe" });
    newGlobeMap.setSky({ "sky-color": pageBackground, "horizon-color": pageBackground, "atmosphere-blend": 0.6 });
  });
  return newGlobeMap;
}

function addStopPin(targetMap, stop) {
  const pinButton = document.createElement("button");
  pinButton.type = "button";
  pinButton.className = "stop-pin";
  pinButton.setAttribute("aria-label", `Photos from ${stop.name}`);
  pinButton.addEventListener("click", () => openPhotoViewer(stop.name, stop.photos, 0));
  new Marker({ element: pinButton }).setLngLat(stop.view.center).addTo(targetMap);
  return pinButton;
}

function buildPlacesNav(globeStage, stopsInOrder) {
  const stopList = document.createElement("ol");
  const stopLinks = stopsInOrder.map((stop) => {
    const stopLink = document.createElement("a");
    stopLink.href = `#${stop.section.id}`;
    stopLink.textContent = stop.name;
    const stopListItem = document.createElement("li");
    stopListItem.append(stopLink);
    stopList.append(stopListItem);
    return stopLink;
  });
  const placesNav = document.createElement("nav");
  placesNav.className = "places-nav";
  placesNav.setAttribute("aria-label", "Jump to a place");
  placesNav.append(stopList);
  globeStage.append(placesNav);
  return stopLinks;
}

function labelStopPanels(stopsInOrder) {
  const stopCountText = String(stopsInOrder.length).padStart(2, "0");
  stopsInOrder.forEach((stop, stopIndex) => {
    const stopCounter = document.createElement("p");
    stopCounter.className = "stop-count";
    stopCounter.textContent = `${String(stopIndex + 1).padStart(2, "0")} / ${stopCountText}`;
    const stopMonths = document.createElement("p");
    stopMonths.className = "stop-months";
    stopMonths.textContent = listMonthsTaken(stop.photos).join(" · ");
    const stopLabel = stop.section.querySelector(".stop-label");
    stopLabel.prepend(stopCounter);
    stopLabel.append(stopMonths);
  });
}

function writeCountryCount(stopsInOrder) {
  const countryCount = new Set(stopsInOrder.map((stop) => stop.country)).size;
  document.getElementById("country-count").textContent = `${countryCount} ${countryCount === 1 ? "country" : "countries"}`;
}

function listMonthsTaken(photos) {
  const sortedPhotos = [...photos].sort((firstPhoto, secondPhoto) => firstPhoto.takenOn - secondPhoto.takenOn);
  return [...new Set(sortedPhotos.map((photo) => monthYearFormat.format(photo.takenOn)))];
}

function openViewerFromStopPhotos(stopsInOrder) {
  for (const stop of stopsInOrder) {
    stop.photoLinks.forEach((photoLink, photoIndex) => {
      photoLink.addEventListener("click", (clickEvent) => {
        clickEvent.preventDefault();
        openPhotoViewer(stop.name, stop.photos, photoIndex);
      });
    });
  }
}

function togglePhotos() {
  setPhotosHidden(!placesSection.classList.contains("is-photos-hidden"));
  if (currentStopIndex !== null) {
    globeMap.easeTo({ ...stops[currentStopIndex].view, padding: measurePhotosCover() });
  }
}

function setPhotosHidden(arePhotosHidden) {
  placesSection.classList.toggle("is-photos-hidden", arePhotosHidden);
  photosToggle.setAttribute("aria-pressed", String(arePhotosHidden));
  photosToggle.setAttribute("aria-label", arePhotosHidden ? "Show photos" : "Hide photos");
}

// styles.css owns how much of the globe the photos cover; the camera keeps
// the current stop centred in what is left.
function measurePhotosCover() {
  if (placesSection.classList.contains("is-photos-hidden")) {
    return NO_PADDING;
  }
  const placesStyle = getComputedStyle(placesSection);
  return {
    top: 0,
    right: parseFloat(placesStyle.getPropertyValue("--photos-cover-right")),
    bottom: parseFloat(placesStyle.getPropertyValue("--photos-cover-bottom")),
    left: 0,
  };
}

function showCurrentStop(stopIndexAtMiddle) {
  currentStopIndex = stopIndexAtMiddle;
  photosToggle.hidden = currentStopIndex === null;
  if (currentStopIndex === null) {
    globeMap.flyTo({ ...WHOLE_EARTH_VIEW, padding: NO_PADDING });
  } else {
    // Hiding the photos lasts for one stop; landing on the next brings them back.
    setPhotosHidden(false);
    globeMap.flyTo({ ...stops[currentStopIndex].view, padding: measurePhotosCover() });
  }
  stops.forEach((stop, stopIndex) => {
    const isCurrentStop = stopIndex === currentStopIndex;
    stopPins[stopIndex].classList.toggle("is-current", isCurrentStop);
    if (isCurrentStop) {
      placesNavLinks[stopIndex].setAttribute("aria-current", "location");
      // On phones the nav is a strip wider than the screen.
      placesNavLinks[stopIndex].scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    } else {
      placesNavLinks[stopIndex].removeAttribute("aria-current");
    }
  });
}
