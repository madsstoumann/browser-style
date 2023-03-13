/**
 * colorSwatch
 * @version 1.0.10
 * @summary 07-23-2022
 * @author Mads Stoumann
 * @description Color Swatch
*/
export default function colorSwatch(app, config) {
	const settings = Object.assign({ eventScope: app }, config);

	const standard = '\
		#000000 #434343 #656666 #999999 #B7B7B7 #CCCDCD #D7D8D8 #EEEEEF #F3F3F3 #FFFFFF \
		#94000B #F8001A #F99922 #FBFF2F #2AFF24 #45FFFE #5880E6 #3600FC #9D00FC #FC01FD \
		#E4B7B0 #F2CBCC #FAE5CE #FDF3CD #DAEBD5 #D1E0E3 #CBD9F7 #D2E1F3 #D9D1E8 #E9D0DC \
		#D97C6D #E7979A #F5CC9E #FCE79C #B6D9A9 #A4C4C8 #A8C0F3 #A3C5E7 #B5A4D5 #D3A4BD \
		#C73B2C #DB6268 #F1B370 #FBDB6E #94C77F #7AA5AE #769AE9 #77A6DA #9077C1 #C077A0 \
		#A1100E #C60013 #E19140 #EDC43F #6BAB52 #4B818D #4B72D6 #4A82C4 #6A46A5 #A34879 \
		#811B13 #95000B #B05E17 #BB921A #3A7921 #1C4F5B #2F4BCA #214F92 #380D74 #711147 \
		#580A04 #630005 #753F0D #7C610E #285016 #12343D #284185 #143562 #220A4C #4A0B30'.split(' ');

	const apple = '\
		#FE0500 #FF8000 #FFFF05 #02FF00 #02FFFF #0000FE #FE01FF #80007E #986633 #FFFFFF #7F7F7F #000000 \
		#FFFFFF #EBEBEB #D6D6D6 #C2C2C2 #ADADAD #999999 #858585 #707070 #5C5C5C #474747 #333333 #000000 \
		#03374B #051B59 #11053C #31043C #3B081A #5C0702 #5A1D00 #573300 #573D00 #666100 #4F5604 #263E10 \
		#004D65 #012F7B #1A0A54 #450E58 #541029 #821103 #7A2A00 #7B4B00 #785900 #8C8605 #71750D #385718 \
		#006E8E #0042A7 #2B0977 #62187C #781A3E #B51A00 #AE3C00 #A96900 #A67A02 #C5BB00 #9AA40B #4E7A28 \
		#008CB4 #0255D5 #371A93 #7A219E #982450 #E22403 #D95100 #D38101 #D19C02 #F3EC01 #C2D013 #679C33 \
		#01A0D8 #0062FE #4E22B3 #982ABB #BA2C5D #FF4017 #FF6803 #FDA909 #FCC800 #FFFA44 #DAEB37 #75BC3F \
		#03C7FB #3C87FD #5E2FEB #BE37F3 #E63B7B #FF6151 #FF8647 #FEB43F #FECB3E #FFF669 #E3EE64 #96D35F \
		#54D6FA #74A6FF #864EFD #D257FF #EE719E #FD8C81 #FFA47D #FEC776 #FFD876 #FFF893 #EBF08F #B1DC8B \
		#95E1FD #A9C5FF #B08DFC #E391FD #F6A2C0 #FFB4B0 #FEC5AB #FFD9A8 #FDE3A8 #FDFBB9 #F1F5B7 #CCE8B4 \
		#CBEFFE #D3E1FF #D9C7FF #EECAFF #F8D3DE #FFDAD8 #FFE3D5 #FEEBD4 #FEF2D4 #FDFBDF #F5F9DB #DEEED5'.split(' ');

	const flatui = '\
		#1abc9c #2ecc71 #3498db #9b59b6 #34495e \
		#16a085 #27ae60 #2980b9 #8e44ad #2c3e50 \
		#f1c40f #e67e22 #e74c3c #ecf0f1 #95a5a6 \
		#f39c12 #d35400 #c0392b #bdc3c7 #7f8c8d'.split(' ');

	const html = '\
		MediumVioletRed DeepPink PaleVioletRed HotPink LightPink Pink \
		DarkRed Red Firebrick Crimson IndianRed LightCoral Salmon DarkSalmon LightSalmon \
		OrangeRed Tomato DarkOrange Coral Orange \
		DarkKhaki Gold Khaki PeachPuff Yellow PaleGoldenrod Moccasin PapayaWhip LightGoldenrodYellow LemonChiffon LightYellow \
		Maroon Brown SaddleBrown Sienna Chocolate DarkGoldenrod Peru RosyBrown Goldenrod SandyBrown Tan Burlywood Wheat NavajoWhite Bisque BlanchedAlmond Cornsilk \
		DarkGreen Green DarkOliveGreen ForestGreen SeaGreen Olive OliveDrab MediumSeaGreen LimeGreen Lime SpringGreen MediumSpringGreen DarkSeaGreen MediumAquamarine YellowGreen LawnGreen Chartreuse LightGreen GreenYellow PaleGreen \
		Teal DarkCyan LightSeaGreen CadetBlue DarkTurquoise MediumTurquoise Turquoise Aqua Cyan Aquamarine PaleTurquoise LightCyan \
		MidnightBlue Navy DarkBlue MediumBlue Blue RoyalBlue SteelBlue DodgerBlue DeepSkyBlue CornflowerBlue SkyBlue LightSkyBlue LightSteelBlue LightBlue PowderBlue \
		Indigo Purple DarkMagenta DarkViolet DarkSlateBlue RebeccaPurple BlueViolet DarkOrchid Fuchsia Magenta SlateBlue MediumSlateBlue MediumOrchid MediumPurple Orchid Violet Plum Thistle Lavender \
		MistyRose AntiqueWhite Linen Beige WhiteSmoke LavenderBlush OldLace AliceBlue Seashell GhostWhite Honeydew FloralWhite Azure MintCream Snow Ivory White \
		Black DarkSlateGray DimGray SlateGray Gray LightSlateGray DarkGray Silver LightGray Gainsboro'.split(' ')

	const material = '\
		#B71C1C #C62828 #D32F2F #E53935 #F44336 #EF5350 #E57373 #EF9A9A #FFCDD2 #FFEBEE \
		#880E4F #AD1457 #C2185B #D81B60 #E91E63 #EC407A #F06292 #F48FB1 #F8BBD0 #FCE4EC \
		#4A148C #6A1B9A #7B1FA2 #8E24AA #9C27B0 #AB47BC #BA68C8 #CE93D8 #E1BEE7 #F3E5F5 \
		#311B92 #4527A0 #512DA8 #5E35B1 #673AB7 #7E57C2 #9575CD #B39DDB #D1C4E9 #EDE7F6 \
		#1A237E #283593 #303F9F #3949AB #3F51B5 #5C6BC0 #7986CB #9FA8DA #C5CAE9 #E8EAF6 \
		#0D47A1 #1565C0 #1976D2 #1E88E5 #2196F3 #42A5F5 #64B5F6 #90CAF9 #BBDEFB #E3F2FD \
		#01579B #0277BD #0288D1 #039BE5 #03A9F4 #29B6F6 #4FC3F7 #81D4FA #B3E5FC #E1F5FE \
		#006064 #00838F #0097A7 #00ACC1 #00BCD4 #26C6DA #4DD0E1 #80DEEA #B2EBF2 #E0F7FA \
		#004D40 #00695C #00796B #00897B #009688 #26A69A #4DB6AC #80CBC4 #B2DFDB #E0F2F1 \
		#1B5E20 #2E7D32 #388E3C #43A047 #4CAF50 #66BB6A #81C784 #A5D6A7 #C8E6C9 #E8F5E9 \
		#33691E #558B2F #689F38 #7CB342 #8BC34A #9CCC65 #AED581 #C5E1A5 #DCEDC8 #F1F8E9 \
		#827717 #9E9D24 #AFB42B #C0CA33 #CDDC39 #D4E157 #DCE775 #E6EE9C #F0F4C3 #F9FBE7 \
		#F57F17 #F9A825 #FBC02D #FDD835 #FFEB3B #FFEE58 #FFF176 #FFF59D #FFF9C4 #FFFDE7 \
		#FF6F00 #FF8F00 #FFA000 #FFB300 #FFC107 #FFCA28 #FFD54F #FFE082 #FFECB3 #FFF8E1 \
		#E65100 #EF6C00 #F57C00 #FB8C00 #FF9800 #FFA726 #FFB74D #FFCC80 #FFE0B2 #FFF3E0 \
		#BF360C #D84315 #E64A19 #F4511E #FF5722 #FF7043 #FF8A65 #FFAB91 #FFCCBC #FBE9E7 \
		#3E2723 #4E342E #5D4037 #6D4C41 #795548 #8D6E63 #A1887F #BCAAA4 #D7CCC8 #EFEBE9 \
		#212121 #424242 #616161 #757575 #9E9E9E #BDBDBD #E0E0E0 #EEEEEE #F5F5F5 #FAFAFA \
		#263238 #37474F #455A64 #546E7A #607D8B #78909C #90A4AE #B0BEC5 #CFD8DC #ECEFF1'.split(' ');

	const metro = '\
		#A4C400 #60A917 #008A00 #00ABA9 #1BA1E2 \
		#0050EF #6A00FF #AA00FF #F472D0 #D80073 \
		#A20025 #E51400 #FA6800 #F0A30A #E3C800 \
		#825A2C #6D8764 #647687 #76608A #A0522D'.split(' ');

	const tailwind = '\
		#7F1D1D #991B1B #B91C1C #DC2626 #EF4444 #F87171 #FCA5A5 #FECACA #FEE2E2 #FEF2F2 \
		#7C2D12 #9A3412 #C2410C #EA580C #F97316 #FB923C #FDBA74 #FED7AA #FFEDD5 #FFF7ED \
		#78350F #92400E #B45309 #D97706 #F59E0B #F59E0B #FCD34D #FCD34D #FEF3C7 #FEF3C7 \
		#713F12 #854D0E #A16207 #CA8A04 #EAB308 #FACC15 #FDE047 #FEF08A #FEF9C3 #FEFCE8 \
		#365314 #3F6212 #4D7C0F #4D7C0F #84CC16 #A3E635 #BEF264 #BEF264 #ECFCCB #F7FEE7 \
		#14532D #166534 #15803D #16A34A #22C55E #4ADE80 #86EFAC #BBF7D0 #BBF7D0 #F0FDF4 \
		#064E3B #065F46 #047857 #059669 #059669 #34D399 #6EE7B7 #A7F3D0 #D1FAE5 #ECFDF5 \
		#134E4A #115E59 #0F766E #0D9488 #14B8A6 #2DD4BF #5EEAD4 #99F6E4 #CCFBF1 #F0FDFA \
		#164E63 #155E75 #0E7490 #0891B2 #06B6D4 #22D3EE #67E8F9 #A5F3FC #CFFAFE #ECFEFF \
		#0C4A6E #075985 #075985 #0284C7 #0EA5E9 #38BDF8 #7DD3FC #7DD3FC #E0F2FE #F0F9FF \
		#1E3A8A #1E40AF #1D4ED8 #2563EB #3B82F6 #60A5FA #93C5FD #BFDBFE #DBEAFE #EFF6FF \
		#312E81 #3730A3 #4338CA #4F46E5 #6366F1 #818CF8 #A5B4FC #C7D2FE #E0E7FF #EEF2FF \
		#4C1D95 #5B21B6 #6D28D9 #7C3AED #8B5CF6 #A78BFA #C4B5FD #DDD6FE #EDE9FE #F5F3FF \
		#581C87 #6B21A8 #7E22CE #9333EA #A855F7 #C084FC #D8B4FE #E9D5FF #F3E8FF #FAF5FF \
		#701A75 #86198F #A21CAF #C026D3 #D946EF #E879F9 #F0ABFC #F5D0FE #FAE8FF #FDF4FF \
		#831843 #9D174D #BE185D #DB2777 #EC4899 #F472B6 #F9A8D4 #FBCFE8 #FCE7F3 #FDF2F8 \
		#881337 #9F1239 #9F1239 #E11D48 #F43F5E #FB7185 #FDA4AF #FECDD3 #FFE4E6 #FFF1F2 \
		#1C1917 #292524 #44403C #57534E #78716C #A8A29E #D6D3D1 #E7E5E4 #F5F5F4 #FAFAF9 \
		#171717 #262626 #404040 #525252 #737373 #A3A3A3 #D4D4D4 #E5E5E5 #F5F5F5 #FAFAFA \
		#18181B #27272A #3F3F46 #52525B #71717A #A1A1AA #D4D4D8 #E4E4E7 #F4F4F5 #FAFAFA \
		#111827 #1F2937 #374151 #4B5563 #6B7280 #9CA3AF #D1D5DB #E5E7EB #F3F4F6 #F9FAFB \
		#0F172A #1E293B #334155 #475569 #64748B #94A3B8 #CBD5E1 #E2E8F0 #F1F5F9 #F8FAFC'.split(' ');

	const groups = { apple, flatui, html, material, metro, standard, tailwind };
	const colors = (settings.colors||' ').split(' ');
	const array = colors.length === 1 ? groups[colors[0]] : colors;

	function brightness(elm) {
		const rgb = window.getComputedStyle(elm).getPropertyValue('background-color'); 
		if (rgb) {
			const [r,g,b] = rgb.replace(/[^\d,]/g, '').split(',');
			const brightness = (299 * r + 587 * g + 114 * b) / 1000;
			if (!elm.style.cssText.includes('transparent')) {
				elm.dataset.brightness = brightness;
				elm.dataset.rgb = rgb;
				elm.style.setProperty('--_c', brightness <= 127 ? `#FFF` : `#000`);
			}
		}
	}

	function render(colors, group, selected) {
		return colors.map((color, index) => `
		<label style="--_bgc:${color.trim()};" title="${color.trim()}" data-index="${index}">
			<input type="radio" name="${group}" value="${color.trim()}"${index === selected ? ` checked`:''} class="sr-only">
			<span></span>
		</label>` ).join('');
	}

	app.insertAdjacentHTML('beforeend', render(array, (settings.group||'standard'), (settings.selected||'')-0));
	[...app.children].forEach(elm => brightness(elm));

	if (settings.eventScope) {
		app.addEventListener('input', (event) => {
			const node = event.target.parentNode;
			settings.eventScope.dispatchEvent(new CustomEvent('swatchSelect', {
				detail: {
					brightness: node.dataset.brightness-0,
					color: node.title,
					index: node.dataset.index-0,
					rgb: node.dataset.rgb
				}
			}))
		})
	}
}