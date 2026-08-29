function currentTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function sendGiscusTheme(theme) {
  const iframe = document.querySelector("iframe.giscus-frame");
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage(
    { giscus: { setConfig: { theme } } },
    "https://giscus.app"
  );
}

const observer = new MutationObserver(() => {
  sendGiscusTheme(currentTheme());
});
observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

window.addEventListener("message", (event) => {
  if (event.origin !== "https://giscus.app") return;
  if (!event.data || !event.data.giscus) return;
  sendGiscusTheme(currentTheme());
});
