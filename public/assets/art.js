// Íconos, ilustraciones y sellos de MUVY (SVG en línea).
(function () {
  const s = (d, w = 20, extra = "") => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
  const P = {
    cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    truck: '<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    chat: '<path d="M3 21l1.7-4.6A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-1.8-1-1 .8a4 4 0 0 1-2.3-2.3l.8-1-1-1.8z"/>',
    cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2.5"/><rect x="14" y="3" width="7" height="7" rx="2.5"/><rect x="3" y="14" width="7" height="7" rx="2.5"/><rect x="14" y="14" width="7" height="7" rx="2.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
    bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    gift: '<path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    drop: '<path d="M12 2.7C8 7.5 6 11 6 14a6 6 0 0 0 12 0c0-3-2-6.5-6-11.3z"/>',
    wifi: '<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M1.5 9a15 15 0 0 1 21 0"/><circle cx="12" cy="19.5" r="1"/>',
    bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    cube: '<path d="m12 2 9 5v10l-9 5-9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>',
    mirror: '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M3 3l4 4M21 3l-4 4M3 21l4-4M21 21l-4-4"/>',
    flower: '<path d="M12 22c4-3 7-6.5 7-11a7 7 0 0 0-14 0c0 4.5 3 8 7 11z"/><path d="M12 8v6M9 11h6"/>',
    bed: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M2 16h20M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/>',
    sofa: '<path d="M4 18v-6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6M2 18h20M6 21v-3M18 21v-3"/>',
    desk: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>'
  };
  const icon = (name, w = 20, extra = "") => s(P[name] || "", w, extra);
  const star = (fill, w = 14) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="${fill}" aria-hidden="true"><path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"/></svg>`;
  const stars = (n, w = 14) => `<span class="stars" role="img" aria-label="${n} de 5 estrellas">${[1, 2, 3, 4, 5].map((k) => star(k <= Math.round(n) ? "#C0702A" : "#E6D6CB", w)).join("")}</span>`;

  const hat = `<svg class="hat" width="62" height="54" viewBox="0 0 64 56" aria-hidden="true"><path d="M10 42 C14 24 26 10 42 10 C52 10 58 16 57 24 L50 25 C48 20 44 19 41 22 C37 27 38 36 42 42 Z" fill="#B8352B"/><path d="M24 42 C27 30 33 20 42 16 C36 22 33 32 34 42 Z" fill="#9E2C23"/><rect x="4" y="37" width="46" height="13" rx="6.5" fill="#FFFFFF" stroke="#EADDD4" stroke-width="1.2"/><circle cx="56" cy="26" r="6.5" fill="#FFFFFF" stroke="#EADDD4" stroke-width="1.2"/></svg>`;
  const snow = () => `<span class="snow" aria-hidden="true">${Array.from({ length: 18 }, (_, i) => {
    const size = 3 + (i * 7) % 5, left = (i * 37 + 7) % 100, dur = 4 + (i * 13) % 5, delay = -((i * 0.73) % dur).toFixed(2);
    return `<i style="left:${left}%;width:${size}px;height:${size}px;animation-duration:${dur}s;animation-delay:${delay}s"></i>`;
  }).join("")}</span>`;

  // Ilustración de la portada: sala acogedora con la paleta de la tienda.
  const hero = `<svg viewBox="0 0 390 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><clipPath id="vidrio"><path d="M60 244 V112 A70 70 0 0 1 200 112 V244 Z"/></clipPath></defs>
    <rect x="0" y="0" width="390" height="560" fill="#EBD2C1"/>
    <rect x="0" y="330" width="390" height="230" fill="#D9B297"/>
    <path d="M0 360 H390 M0 392 H390 M0 428 H390 M0 470 H390 M0 516 H390" stroke="#CDA386" stroke-width="1.2"/>
    <rect x="0" y="324" width="390" height="8" fill="#F4E6DC"/>
    <polygon points="62,332 200,332 262,500 20,500" fill="#FFF4E8" opacity="0.38"/>
    <line x1="26" y1="26" x2="262" y2="26" stroke="#9A6B4F" stroke-width="3" stroke-linecap="round"/>
    <path d="M50 252 V110 A80 80 0 0 1 210 110 V252 Z" fill="#FBF6F2"/>
    <g clip-path="url(#vidrio)">
      <rect x="60" y="30" width="140" height="220" fill="#F7CDAE"/><rect x="60" y="30" width="140" height="70" fill="#F9DCC4"/>
      <circle cx="152" cy="158" r="22" fill="#FFE8D4"/>
      <path d="M60 198 Q95 172 135 190 T200 178 V250 H60 Z" fill="#DA9C7B"/>
      <path d="M60 220 Q108 198 150 214 T200 206 V250 H60 Z" fill="#B9694C"/>
      <path d="M60 236 Q120 226 200 234 V250 H60 Z" fill="#8F4C35"/>
    </g>
    <line x1="130" y1="42" x2="130" y2="246" stroke="#FBF6F2" stroke-width="5"/>
    <line x1="58" y1="172" x2="202" y2="172" stroke="#FBF6F2" stroke-width="5"/>
    <rect x="42" y="248" width="176" height="10" rx="5" fill="#F7EDE5"/>
    <path d="M218 28 C228 120 208 220 224 326 L254 326 C238 220 258 120 246 28 Z" fill="#FBF3EC"/>
    <path d="M230 40 C236 130 222 230 234 320" stroke="#EFDCCF" stroke-width="2" fill="none"/>
    <rect x="286" y="78" width="78" height="98" rx="16" fill="#FBF6F2"/><rect x="294" y="86" width="62" height="82" rx="12" fill="#E8BDA3"/>
    <path d="M304 168 V134 A21 21 0 0 1 346 134 V168 Z" fill="#C46E4E"/><circle cx="336" cy="108" r="9" fill="#FBF6F2"/>
    <circle cx="332" cy="128" r="44" fill="#FFE9D6" opacity="0.55"/>
    <path d="M374 326 V128 Q374 84 334 84" stroke="#3A2A22" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M312 84 H356 L346 110 H322 Z" fill="#FBF6F2"/><ellipse cx="374" cy="328" rx="15" ry="4" fill="#3A2A22"/>
    <rect x="160" y="226" width="200" height="74" rx="30" fill="#A9533B"/>
    <rect x="138" y="268" width="234" height="54" rx="22" fill="#9A4430"/>
    <rect x="130" y="246" width="36" height="78" rx="18" fill="#8A3C29"/><rect x="346" y="246" width="36" height="78" rx="18" fill="#8A3C29"/>
    <rect x="158" y="318" width="8" height="12" rx="3" fill="#5A3A2A"/><rect x="346" y="318" width="8" height="12" rx="3" fill="#5A3A2A"/>
    <rect x="176" y="236" width="56" height="46" rx="16" fill="#F2B9A4" transform="rotate(-7 204 259)"/>
    <rect x="238" y="238" width="54" height="44" rx="16" fill="#FBF6F2"/>
    <rect x="296" y="240" width="48" height="42" rx="16" fill="#C9D1AE" transform="rotate(6 320 261)"/>
    <path d="M330 270 Q352 262 370 272 L372 314 Q350 306 334 312 Z" fill="#F4E6DC"/>
    <ellipse cx="230" cy="402" rx="176" ry="36" fill="#F4E6DC"/>
    <ellipse cx="230" cy="402" rx="150" ry="27" fill="none" stroke="#E3C7B2" stroke-width="2"/>
    <rect x="186" y="352" width="6" height="34" rx="3" fill="#8F5E40"/><rect x="250" y="352" width="6" height="34" rx="3" fill="#8F5E40"/>
    <ellipse cx="221" cy="354" rx="62" ry="13" fill="#A86F4C"/><ellipse cx="221" cy="350" rx="62" ry="12" fill="#C48B63"/>
    <path d="M196 348 Q190 330 198 318 H210 Q218 330 212 348 Z" fill="#FBF6F2"/>
    <path d="M204 318 Q196 292 186 280 M204 318 Q206 290 214 274 M204 318 Q214 298 226 290" stroke="#E2C3A6" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="240" cy="346" rx="9" ry="3" fill="#9A4430"/><rect x="232" y="336" width="16" height="10" rx="4" fill="#F2B9A4"/>
    <path d="M12 330 L18 276 H64 L70 330 Z" fill="#C98563"/><rect x="14" y="272" width="54" height="8" rx="4" fill="#B5744F"/>
    <ellipse cx="40" cy="214" rx="11" ry="44" fill="#5F7440"/>
    <ellipse cx="22" cy="232" rx="10" ry="36" fill="#6E844A" transform="rotate(-28 22 232)"/>
    <ellipse cx="60" cy="230" rx="10" ry="36" fill="#7D9156" transform="rotate(30 60 230)"/>
    <ellipse cx="14" cy="258" rx="8" ry="24" fill="#5F7440" transform="rotate(-55 14 258)"/>
    <ellipse cx="68" cy="256" rx="8" ry="24" fill="#6E844A" transform="rotate(55 68 256)"/>
    <ellipse cx="44" cy="186" rx="8" ry="26" fill="#7D9156" transform="rotate(14 44 186)"/>
  </svg>`;

  // Sellos de confianza (Envío seguro / Certificación y garantía).
  const rosette = "M280.0,28.0 Q306.0,49.5 336.1,34.3 Q356.6,61.0 389.3,53.0 Q403.4,83.6 437.1,83.0 Q444.0,116.0 477.0,122.9 Q476.4,156.6 507.0,170.7 Q499.0,203.4 525.7,223.9 Q510.5,254.0 532.0,280.0 Q510.5,306.0 525.7,336.1 Q499.0,356.6 507.0,389.3 Q476.4,403.4 477.0,437.1 Q444.0,444.0 437.1,477.0 Q403.4,476.4 389.3,507.0 Q356.6,499.0 336.1,525.7 Q306.0,510.5 280.0,532.0 Q254.0,510.5 223.9,525.7 Q203.4,499.0 170.7,507.0 Q156.6,476.4 122.9,477.0 Q116.0,444.0 83.0,437.1 Q83.6,403.4 53.0,389.3 Q61.0,356.6 34.3,336.1 Q49.5,306.0 28.0,280.0 Q49.5,254.0 34.3,223.9 Q61.0,203.4 53.0,170.7 Q83.6,156.6 83.0,122.9 Q116.0,116.0 122.9,83.0 Q156.6,83.6 170.7,53.0 Q203.4,61.0 223.9,34.3 Q254.0,49.5 280.0,28.0 Z";
  const starsRow = '<polygon points="238.0,445.0 240.2,450.9 246.6,451.2 241.6,455.2 243.3,461.3 238.0,457.8 232.7,461.3 234.4,455.2 229.4,451.2 235.8,450.9" fill="#E0A458"/><polygon points="280.0,448.0 283.0,455.9 291.4,456.3 284.8,461.6 287.1,469.7 280.0,465.0 272.9,469.7 275.2,461.6 268.6,456.3 277.0,455.9" fill="#E0A458"/><polygon points="322.0,445.0 324.2,450.9 330.6,451.2 325.6,455.2 327.3,461.3 322.0,457.8 316.7,461.3 318.4,455.2 313.4,451.2 319.8,450.9" fill="#E0A458"/>';
  function seal({ band, tail, title, titleSize, top, bottom, art, label }) {
    return `<svg viewBox="0 0 560 560" role="img" aria-label="${label}" font-family="Manrope, system-ui, sans-serif">
      <path d="${rosette}" fill="#9A4430"/>
      <circle cx="280" cy="280" r="214" fill="#FBF6F2"/><circle cx="280" cy="280" r="204" fill="#2B1F1B"/>
      <circle cx="280" cy="280" r="192" fill="none" stroke="#E0A458" stroke-width="1.5" opacity="0.6"/>
      <path d="M70,318 L20,318 L46,350 L20,382 L92,382 Z" fill="${tail}"/><path d="M490,318 L540,318 L514,350 L540,382 L468,382 Z" fill="${tail}"/>
      <path d="M66,300 Q280,284 494,300 L494,372 Q280,356 66,372 Z" fill="${band}"/>
      <path d="M66,300 Q280,284 494,300" fill="none" stroke="#E0A458" stroke-width="2.5"/><path d="M66,372 Q280,356 494,372" fill="none" stroke="#E0A458" stroke-width="2.5"/>
      ${starsRow}${art}
      <text x="280" y="116" text-anchor="middle" font-size="18" font-weight="800" letter-spacing="5.7" fill="#FBF6F2">MUVY</text>
      <text x="280" y="347" text-anchor="middle" font-size="${titleSize}" font-weight="800" fill="#FBF6F2">${title}</text>
      <line x1="146" y1="400" x2="186" y2="400" stroke="#E0A458" stroke-width="2"/><line x1="374" y1="400" x2="414" y2="400" stroke="#E0A458" stroke-width="2"/>
      <text x="280" y="406" text-anchor="middle" font-size="17" font-weight="700" letter-spacing="2" fill="#EADDD4">${top}</text>
      <text x="280" y="434" text-anchor="middle" font-size="22" font-weight="800" letter-spacing="2.2" fill="#FBF6F2">${bottom}</text>
    </svg>`;
  }
  const sealEnvio = seal({
    band: "#9A4430", tail: "#7A3424", title: "ENVÍO SEGURO", titleSize: 44, top: "COMPRA CON", bottom: "TRANQUILIDAD", label: "Sello Envío seguro MUVY",
    art: '<rect x="128" y="186" width="58" height="9" rx="4.5" fill="#E0A458"/><rect x="110" y="208" width="76" height="9" rx="4.5" fill="#E0A458"/><rect x="138" y="230" width="48" height="9" rx="4.5" fill="#E0A458"/><path d="M196,170 L270,148 L344,170 L270,192 Z" fill="#E7C29A"/><path d="M196,170 L270,192 L270,276 L196,252 Z" fill="#C0702A"/><path d="M270,192 L344,170 L344,252 L270,276 Z" fill="#A85E22"/><path d="M232,159 L306,181 L306,206 L294,202 L294,186 L220,164 Z" fill="#EADDD4" opacity="0.9"/><path d="M352,166 L400,148 L448,166 L448,206 Q448,246 400,268 Q352,246 352,206 Z" fill="#FBF6F2"/><path d="M361,172 L400,157 L439,172 L439,206 Q439,238 400,257 Q361,238 361,206 Z" fill="#46552A"/><path d="M380,206 L395,221 L422,192" fill="none" stroke="#FBF6F2" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'
  });
  const sealGarantia = seal({
    band: "#46552A", tail: "#34401F", title: "CERTIFICACIÓN", titleSize: 40, top: "Y GARANTÍA", bottom: "DE USO", label: "Sello Certificación y garantía de uso MUVY",
    art: '<rect x="170" y="140" width="150" height="128" rx="10" fill="#FBF6F2"/><rect x="180" y="150" width="130" height="108" rx="6" fill="none" stroke="#EADDD4" stroke-width="2"/><rect x="196" y="166" width="70" height="8" rx="4" fill="#9A4430"/><rect x="196" y="186" width="98" height="6" rx="3" fill="#EADDD4"/><rect x="196" y="200" width="88" height="6" rx="3" fill="#EADDD4"/><rect x="196" y="214" width="60" height="6" rx="3" fill="#EADDD4"/><path d="M282,246 L272,292 L286,284 L296,298 L302,252 Z" fill="#9A4430"/><path d="M310,246 L320,292 L306,284 L296,298 L290,252 Z" fill="#7A3424"/><circle cx="296" cy="236" r="24" fill="#E0A458"/><circle cx="296" cy="236" r="17" fill="#C0702A"/><polygon points="296.0,227.0 298.4,232.8 304.6,233.2 299.8,237.2 301.3,243.3 296.0,240.0 290.7,243.3 292.2,237.2 287.4,233.2 293.6,232.8" fill="#FBF6F2"/><path d="M346,160 L394,142 L442,160 L442,200 Q442,240 394,262 Q346,240 346,200 Z" fill="#FBF6F2"/><path d="M355,166 L394,151 L433,166 L433,200 Q433,232 394,251 Q355,232 355,200 Z" fill="#9A4430"/><path d="M374,200 L389,215 L416,186" fill="none" stroke="#FBF6F2" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'
  });

  window.MUVY_ART = { icon, star, stars, hat, snow, hero, sealEnvio, sealGarantia };
})();
