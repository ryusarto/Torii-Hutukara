# Geração dos sprites da Ponte das Frequências

Método usado: ImageGen integrado, com o cenário da Floresta de Ressonância como referência. Os PNGs de origem ficam em `source/`. A exportação técnica em `runtime/` preserva alpha, define pivôs e alinha as duas sequências.

## tronco

```text
Use case: stylized-concept. The attached screenshot is the existing Torii & Hutukara forest, provided only as reference for camera, light, scale, materials, and precise pixel-art style. Produce polished original SNES-style compact low-resolution game pixel art with deliberate visible pixel clusters, clean stepped silhouettes, warm amber bounce light, dark umber shadows, and earthy ochre/olive highlights like the screenshot. 3/4 top-down RPG perspective, camera sees top and south-facing side. Transparent alpha background, absolutely no ground tile, scenery, text, UI, framing, numbers, gradients, realistic 3D rendering, anti-aliased outline, or baked cast shadow beyond the object footprint.
Asset type and primary request: Only one compact horizontal fallen forest log, hollow circular end facing lower left, bark chipped into chunky layered warm-brown clusters, a few tiny olive moss tufts, dark hollow with a carved circular ring around its lip. Use a clean stout oval silhouette at gameplay scale. Full object, centered with generous transparent margins, occupying middle 70% of square.
```

## pedra

```text
Use case: stylized-concept. The attached screenshot is the existing Torii & Hutukara forest, provided only as reference for camera, light, scale, materials, and precise pixel-art style. Produce polished original SNES-style compact low-resolution game pixel art with deliberate visible pixel clusters, clean stepped silhouettes, warm amber bounce light, dark umber shadows, and earthy ochre/olive highlights like the screenshot. 3/4 top-down RPG perspective, camera sees top and south-facing side. Transparent alpha background, absolutely no ground tile, scenery, text, UI, framing, numbers, gradients, realistic 3D rendering, anti-aliased outline, or baked cast shadow beyond the object footprint.
Asset type and primary request: Only one stout old forest standing stone, a moss-gray irregular triangular monolith with a broad base and one diagonal pale jade triangular fracture, dark mottled moss near base. Tapered triangular silhouette, readable at 35 logical pixels. Full object, centered with generous transparent margins. Subtle warm light on one top edge.
```

## sino

```text
Use case: stylized-concept. The attached screenshot is the existing Torii & Hutukara forest, provided only as reference for camera, light, scale, materials, and precise pixel-art style. Produce polished original SNES-style compact low-resolution game pixel art with deliberate visible pixel clusters, clean stepped silhouettes, warm amber bounce light, dark umber shadows, and earthy ochre/olive highlights like the screenshot. 3/4 top-down RPG perspective, camera sees top and south-facing side. Transparent alpha background, absolutely no ground tile, scenery, text, UI, framing, numbers, gradients, realistic 3D rendering, anti-aliased outline, or baked cast shadow beyond the object footprint.
Asset type and primary request: Only one wooden resonant bell suspended under a very short weathered timber A-frame with stout supports, distinct squared shape and warm copper-brown rim and simple square clapper, scraps of rope and two sparse moss pixels. Wood clearly, no ornate metal bell. Full object, centered with generous transparent margins and good readable square silhouette.
```

## marco

```text
Use case: stylized-concept. The attached screenshot is the existing Torii & Hutukara forest, provided only as reference for camera, light, scale, materials, and precise pixel-art style. Produce polished original SNES-style compact low-resolution game pixel art with deliberate visible pixel clusters, clean stepped silhouettes, warm amber bounce light, dark umber shadows, and earthy ochre/olive highlights like the screenshot. 3/4 top-down RPG perspective, camera sees top and south-facing side. Transparent alpha background, absolutely no ground tile, scenery, text, UI, framing, numbers, gradients, realistic 3D rendering, anti-aliased outline, or baked cast shadow beyond the object footprint.
Asset type and primary request: Only one small old riverside listening shrine, warm timber and flat stone base, chunky shield-like vertical shape, circular resonance disc inset on the front with one fine amber line ring, carved border, three tiny moss flecks. No letters. Full object, centered with generous transparent margins.
```

## montagem

```text
Use case: stylized-concept. The attached screenshot is the existing Torii & Hutukara forest, provided only as reference for camera, light, scale, materials, and precise pixel-art style. Produce polished original SNES-style compact low-resolution game pixel art with deliberate visible pixel clusters, clean stepped silhouettes, warm amber bounce light, dark umber shadows, and earthy ochre/olive highlights like the screenshot. 3/4 top-down RPG perspective, camera sees top and south-facing side. Transparent alpha background, absolutely no ground tile, scenery, text, UI, framing, numbers, gradients, realistic 3D rendering, anti-aliased outline, or baked cast shadow beyond the object footprint.
Asset type and primary request: Only a pixel-art game sprite sheet for the same single MODULAR SECTION of a weathered living timber bridge from the reference. Exactly FOUR animation frame cells arranged in a rigid 2×2 layout with broad transparent central gutters and transparent outer margins. Fixed camera and identical area/origin in every quadrant. In each cell the asset is a vertical narrow rectangular slice of the wide deck running north-south (walk direction is west to east across slices). Top-left shows roots emerging and one cross member, top-right shows pegged supports and 3 scattered boards beginning to slot in, bottom-left shows mostly assembled surface with a few unfinished openings, bottom-right a fully assembled vertical rectangular panel with horizontal warm brown little timber boards, dark seams, alternating warm honey bevels, understated rivets, and clean straight sides. Each frame with alpha around it and between disconnected pieces. All four final bounding boxes proportion approx 1:4 (width : height); center each vertical slice at exactly 25%/75% of image width and 25%/75% of image height. No panel separators, captions, water representation, side perspective drift or varying scale. The whole image is strictly a reusable animation atlas.
```

## desmonte

```text
Use case: stylized-concept. The attached screenshot is the existing Torii & Hutukara forest, provided only as reference for camera, light, scale, materials, and precise pixel-art style. Produce polished original SNES-style compact low-resolution game pixel art with deliberate visible pixel clusters, clean stepped silhouettes, warm amber bounce light, dark umber shadows, and earthy ochre/olive highlights like the screenshot. 3/4 top-down RPG perspective, camera sees top and south-facing side. Transparent alpha background, absolutely no ground tile, scenery, text, UI, framing, numbers, gradients, realistic 3D rendering, anti-aliased outline, or baked cast shadow beyond the object footprint.
Asset type and primary request: Only a pixel-art game sprite sheet for timber bridge section breaking. Exactly FOUR animation frame cells arranged in a rigid 2×2 layout with broad transparent central gutters and transparent outer margins. Fixed camera and same origin every quadrant. In each cell the asset is a vertical narrow rectangular slice of the wide deck running north-south, made from horizontal brown timber boards with warm honey bevels, muted moss and dark seams. Top-left mostly built deck with pegged beams beginning to split, top-right geometry visibly separating into crooked boards and dark exposed roots, bottom-left only a few scattered falling slats and pegs, bottom-right two or three little falling wooden fragments. Keep strong chunky silhouettes; amber highlights feel like glints, no supernatural light. Each state is a vertical strip around the same center as a 1:4 panel. Use 25%/75% image width and height centers. Transparent space around and among fragments; no water, no background, no letters, no frames, no separators, no melted shapes. This is a reusable animation atlas.
```
