if (window.location === window.parent.location) {
  const selector = `h1,h2,h3,h4,img`
  const CSS = `[data-ui=dialog]{background:#EEE;border:0;font-family:sans-serif;height:100dvh;inset:0;position:fixed;width:100vw;z-index:2147483647;}[data-ui=iframe]{aspect-ratio:9/19;background-color:white;border:0;border-radius:.5em;box-shadow:0 0 5px 1px #CCC;inline-size:375px;margin:2ch;padding:1em;resize:both;}[data-ui=group]{border:1px solid #CCC;display:flex;margin:2ch;& label{display:flex;gap:1ch;padding:1ch;&:has(input:checked){color:crimson;}}}`
  const CSSframe = `body.nope * { pointer-events: none; } [data-pf] { pointer-events: all; } [data-pf]:hover { outline: 3px solid crimson; }}`
  const nodeListToObject=(t,e)=>{const o={};return t.querySelectorAll(e).forEach((t=>{o[t.dataset.ui]=t})),o};
  const strToFragment=t=>{const e=document.createElement("template");return e.innerHTML=t,e.content};
  const F = new DocumentFragment();
  F.append(strToFragment(`
  <style>${CSS}</style>
  <dialog open data-ui="dialog">
    <fieldset data-ui="group"><label><input type="radio" name="pfbp" value="375" checked>Mobile</label><label><input type="radio" name="pfbp" value="768">Tablet</label><label><input type="radio" name="pfbp" value="1200">Desktop</label></fieldset>
    <iframe src="${window.location.href}" data-ui="iframe" sandbox="allow-scripts allow-forms allow-same-origin allow-pointer-lock allow-presentation allow-popups allow-popups-to-escape-sandbox"></iframe><br>
    <label><input type="checkbox" data-ui="toggle">Disable pointer-events</label>
  </dialog>`));
  const elements = nodeListToObject(F, '[data-ui]');
  elements.toggle.addEventListener('change', e => {
    elements.iframe.contentDocument.body.classList.toggle('nope', e.target.checked)
  })
  elements.dialog.addEventListener('input', e => elements.iframe.style.inlineSize = e.target.value + 'px')
  elements.iframe.addEventListener('load', e => {
    const frameCSS = document.createElement("style");
    frameCSS.textContent = CSSframe;
    elements.iframe.contentDocument.head.append(frameCSS);
    elements.iframe.contentDocument.querySelectorAll(selector).forEach(el => {
      el.dataset.pf = "{}"
    })
  })
  document.body.appendChild(F);
  let active = null;
  elements.iframe.contentWindow.addEventListener('click', e => {
    console.log(e.target);
  })
}