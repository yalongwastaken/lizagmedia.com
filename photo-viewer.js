import { watchElementAtMiddle } from "./element-at-middle.js";

const photoViewer = document.querySelector(".photo-viewer");
const placeNameHeading = photoViewer.querySelector(".photo-viewer-name");
const photoStrip = photoViewer.querySelector(".photo-viewer-strip");
const blurredBackdrop = photoViewer.querySelector(".photo-viewer-backdrop");
const photoDate = photoViewer.querySelector(".photo-viewer-date");
const previousButton = photoViewer.querySelector(".photo-viewer-previous");
const nextButton = photoViewer.querySelector(".photo-viewer-next");
const fullDateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

let shownPhotos = [];
let photoItems = [];
let currentPhotoIndex = 0;
let stopWatchingStrip = () => {};

previousButton.addEventListener("click", () => scrollToPhoto(currentPhotoIndex - 1));
nextButton.addEventListener("click", () => scrollToPhoto(currentPhotoIndex + 1));
photoViewer.querySelector(".photo-viewer-close").addEventListener("click", () => photoViewer.close());
photoViewer.addEventListener("click", (clickEvent) => {
  if (clickEvent.target === photoViewer || clickEvent.target === photoStrip) {
    photoViewer.close();
  }
});
photoViewer.addEventListener("keydown", (keyEvent) => {
  if (keyEvent.key === "ArrowLeft" || keyEvent.key === "ArrowRight") {
    keyEvent.preventDefault();
    scrollToPhoto(currentPhotoIndex + (keyEvent.key === "ArrowLeft" ? -1 : 1));
  }
});
photoViewer.addEventListener("close", () => {
  stopWatchingStrip();
  photoStrip.replaceChildren();
});

// photos: records of { src, alt, width, height, takenOn } in viewing order.
export function openPhotoViewer(shownPlaceName, photos, startIndex) {
  placeNameHeading.textContent = shownPlaceName;
  shownPhotos = photos;
  photoItems = photos.map(buildPhotoItem);
  photoStrip.replaceChildren(...photoItems);
  previousButton.hidden = nextButton.hidden = photos.length < 2;
  photoViewer.showModal();
  photoItems[startIndex].scrollIntoView({ inline: "center", block: "nearest", behavior: "instant" });
  showCurrentPhoto(startIndex);
  stopWatchingStrip = watchElementAtMiddle(photoItems, { scroller: photoStrip, scrollAxis: "x" }, (photoIndexAtMiddle) => {
    if (photoIndexAtMiddle !== null) {
      showCurrentPhoto(photoIndexAtMiddle);
    }
  });
}

function buildPhotoItem(photo) {
  const photoImage = document.createElement("img");
  Object.assign(photoImage, { src: photo.src, alt: photo.alt, width: photo.width, height: photo.height });
  const photoItem = document.createElement("li");
  photoItem.append(photoImage);
  return photoItem;
}

function scrollToPhoto(photoIndex) {
  photoItems[photoIndex]?.scrollIntoView({ inline: "center", block: "nearest" });
}

function showCurrentPhoto(photoIndex) {
  currentPhotoIndex = photoIndex;
  const currentPhoto = shownPhotos[photoIndex];
  photoDate.dateTime = currentPhoto.takenOn.toISOString().slice(0, 10);
  photoDate.textContent = fullDateFormat.format(currentPhoto.takenOn);
  blurredBackdrop.style.backgroundImage = `url("${currentPhoto.src}")`;
  previousButton.disabled = photoIndex === 0;
  nextButton.disabled = photoIndex === shownPhotos.length - 1;
}
