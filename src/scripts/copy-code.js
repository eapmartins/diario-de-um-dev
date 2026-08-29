function initCodeCopyButtons() {
  const blocks = document.querySelectorAll("article pre.astro-code");
  blocks.forEach((pre) => {
    if (pre.parentElement?.classList.contains("code-copy-frame")) return;
    const code = pre.querySelector("code");
    if (!code) return;

    const frame = document.createElement("div");
    frame.className = "code-copy-frame";
    pre.replaceWith(frame);
    frame.appendChild(pre);

    const button = document.createElement("button");
    button.className = "code-copy-button";
    button.type = "button";
    button.textContent = "copiar";
    button.addEventListener("click", () => {
      navigator.clipboard.writeText(code.innerText).then(() => {
        button.textContent = "copiado";
        setTimeout(() => {
          button.textContent = "copiar";
        }, 1200);
      });
    });

    frame.prepend(button);
  });
}

initCodeCopyButtons();
