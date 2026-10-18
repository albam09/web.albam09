/* 09 runtime bridge — never reads /place files */
const PLACES=Array.isArray(window.PUBLIC_VENUES)?window.PUBLIC_VENUES:[];
window.PLACES=PLACES;
