// Calls onCurrentIndexChange with the index of the element crossing the
// middle line of the scroller (the page when scroller is null), or null when
// none does. Returns a function that stops watching.
export function watchElementAtMiddle(watchedElements, { scroller, scrollAxis }, onCurrentIndexChange) {
  const middleLineMargin = scrollAxis === "y" ? "-50% 0px -50% 0px" : "0px -50% 0px -50%";
  const indexesAtMiddle = new Set();
  let currentElementIndex = null;
  const middleLineObserver = new IntersectionObserver((intersectionEntries) => {
    for (const intersectionEntry of intersectionEntries) {
      const elementIndex = watchedElements.indexOf(intersectionEntry.target);
      if (intersectionEntry.isIntersecting) {
        indexesAtMiddle.add(elementIndex);
      } else {
        indexesAtMiddle.delete(elementIndex);
      }
    }
    // Where two overlap, the later one wins: a section that slides over the
    // one before it takes over as soon as it reaches the line.
    const nextCurrentElementIndex = indexesAtMiddle.size > 0 ? Math.max(...indexesAtMiddle) : null;
    if (nextCurrentElementIndex !== currentElementIndex) {
      currentElementIndex = nextCurrentElementIndex;
      onCurrentIndexChange(currentElementIndex);
    }
  }, { root: scroller, rootMargin: middleLineMargin });
  for (const watchedElement of watchedElements) {
    middleLineObserver.observe(watchedElement);
  }
  return () => middleLineObserver.disconnect();
}
