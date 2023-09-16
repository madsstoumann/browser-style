export default function uiColorGrid(group, colors) {
  return `
	<fieldset class="ui-color-grid --${group}">
		<legend>${group}</legend>
		${colors
      .map(
        (color, index) =>
          `<label><input type="radio" name="${group}" value="${color}" class="ui-color-input" style="--_bg:${color};"${
            index === 0 ? ` checked` : ""
          }></label>`
      )
      .join("")}
	</fieldset>`;
}