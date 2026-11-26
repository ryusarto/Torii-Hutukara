#!/usr/bin/env python3
"""Exporta sprites lógicos RGBA da Ponte das Frequências com Pillow.

As duas folhas têm uma grade 2×2 na ordem TL, TR, BL, BR. O enquadramento
de cada folha é calibrado uma vez pelo quadro que já mostra o piso inteiro.
As opções --montagem-deck e --desmonte-deck aceitam x, y, largura e altura
em pixels locais ao painel de referência, sem considerar as outras células.
"""

import argparse
import json
from pathlib import Path

from PIL import Image

STATION_SIZE = (48, 56)
STATION_PIVOT = (24, 53)
STATION_ART = {"tronco": (41, 30), "pedra": (34, 46), "sino": (41, 48), "marco": (41, 44)}
BRIDGE_SIZE = (40, 136)
DECK_RECT = (8, 8, 24, 120)
BRIDGE_REFERENCES = {"montagem": 3, "desmonte": 0}


def load_rgba(path):
    with Image.open(path) as source:
        image = source.convert("RGBA")
    low, high = image.getchannel("A").getextrema()
    if high < 250 or low == 255:
        raise ValueError(f"{path.name}: precisa conter arte opaca e fundo com alpha real")
    return image


def export_station(image, max_size):
    alpha = image.getchannel("A")
    bounds = alpha.point(lambda value: 255 if value >= 16 else 0).getbbox()
    if bounds is None:
        raise ValueError("Estação sem pixels visíveis")
    source = image.crop(bounds)
    source.thumbnail(max_size, Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", STATION_SIZE)
    left = STATION_PIVOT[0] - source.width // 2
    top = STATION_PIVOT[1] - source.height
    frame.paste(source, (left, top))
    return frame


def quadrants(image):
    # Borda de número ímpar vai para a segunda metade. A origem de cada
    # célula passa a ser (0, 0), preservando o alinhamento da própria folha.
    mid_x, mid_y = image.width // 2, image.height // 2
    return [
        image.crop(box)
        for box in [
            (0, 0, mid_x, mid_y),
            (mid_x, 0, image.width, mid_y),
            (0, mid_y, mid_x, image.height),
            (mid_x, mid_y, image.width, image.height),
        ]
    ]


def largest_opaque_rect(image):
    """Localiza o maior retângulo opaco com o histograma por linha."""
    width, height = image.size
    alpha = image.getchannel("A").tobytes()
    heights = [0] * (width + 1)
    best_area = 0
    best_rect = None
    for y in range(height):
        row = y * width
        for x in range(width):
            heights[x] = heights[x] + 1 if alpha[row + x] >= 250 else 0
        stack = []
        for x, column_height in enumerate(heights):
            first_x = x
            while stack and stack[-1][1] > column_height:
                first_x, rectangle_height = stack.pop()
                rectangle_width = x - first_x
                area = rectangle_width * rectangle_height
                if area > best_area:
                    best_area = area
                    best_rect = (first_x, y + 1 - rectangle_height, rectangle_width, rectangle_height)
            if column_height and (not stack or stack[-1][1] < column_height):
                stack.append((first_x, column_height))
    return best_rect


def prepare_bridge(image, reference, manual_rect, name):
    cells = quadrants(image)
    rect = manual_rect or largest_opaque_rect(cells[reference])
    if rect is None:
        raise ValueError(f"{name}.png: não encontrei o piso opaco no quadro {reference + 1}")
    x, y, w, h = rect
    panel = cells[reference]
    if w < 3 or h < 3 or x < 0 or y < 0 or x + w > panel.width or y + h > panel.height:
        raise ValueError(f"{name}.png: o recorte {rect} está fora do painel ou abaixo de 3 px")
    if min(w / h, h / w) < 0.07 and manual_rect is None:
        raise ValueError(f"{name}.png: recorte automático muito estreito {rect}; calibre --{name}-deck")

    left, top, deck_w, deck_h = DECK_RECT
    # Uma pequena margem interna mantém a amostragem bicúbica dentro da
    # superfície opaca nas bordas do encaixe. O restante do alpha é mantido.
    inset = 1 if min(w, h) >= 12 else 0
    x, y, w, h = x + inset, y + inset, w - 2 * inset, h - 2 * inset
    scale_x, scale_y = w / deck_w, h / deck_h
    bounds = (
        x - left * scale_x,
        y - top * scale_y,
        x + (BRIDGE_SIZE[0] - left) * scale_x,
        y + (BRIDGE_SIZE[1] - top) * scale_y,
    )
    frames = [
        cell.transform(BRIDGE_SIZE, Image.Transform.EXTENT, bounds, Image.Resampling.BICUBIC)
        for cell in cells
    ]
    deck = frames[reference].getchannel("A").crop((left, top, left + deck_w, top + deck_h))
    if deck.getextrema()[0] < 245:
        raise ValueError(f"{name}.png: quadro {reference + 1} tem lacunas em {rect}")
    return frames


def make_palette(frames, colors):
    visible = [
        (r, g, b)
        for frame in frames
        for r, g, b, alpha in frame.get_flattened_data()
        if alpha >= 96
    ]
    if not visible:
        raise ValueError("Grupo de sprites vazio")
    strip = Image.new("RGB", (len(visible), 1))
    strip.putdata(visible)
    return strip.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)


def save_sprite(frame, palette, path):
    saved = frame.convert("RGB").quantize(palette=palette, dither=Image.Dither.NONE).convert("RGBA")
    alpha = frame.getchannel("A")
    saved.putalpha(alpha)
    clean = Image.new("RGBA", saved.size)
    clean.paste(saved, mask=alpha.point(lambda value: 255 if value else 0))
    path.parent.mkdir(parents=True, exist_ok=True)
    clean.save(path, optimize=True)


def pack(source, output, scales):
    stations = {
        name: export_station(load_rgba(source / f"{name}.png"), size)
        for name, size in STATION_ART.items()
    }
    bridge = {
        name: prepare_bridge(load_rgba(source / f"{name}.png"), reference, scales[name], name)
        for name, reference in BRIDGE_REFERENCES.items()
    }
    station_palette = make_palette(stations.values(), 48)
    bridge_palette = make_palette([frame for frames in bridge.values() for frame in frames], 40)
    station_data = {}
    for name, frame in stations.items():
        file = f"stations/{name}.png"
        save_sprite(frame, station_palette, output / file)
        station_data[name] = {"file": file, "size": STATION_SIZE, "pivot": STATION_PIVOT}

    bridge_data = {"size": BRIDGE_SIZE, "deckRect": DECK_RECT, "stable": "bridge/montagem-04.png"}
    for name, frames in bridge.items():
        files = []
        for index, frame in enumerate(frames, 1):
            file = f"bridge/{name}-{index:02}.png"
            save_sprite(frame, bridge_palette, output / file)
            files.append(file)
        bridge_data[name] = files
    manifest = {"stations": station_data, "bridge": bridge_data}
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"{output / 'manifest.json'} · 4 estações e 8 quadros RGBA")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    for name in BRIDGE_REFERENCES:
        parser.add_argument(f"--{name}-deck", type=int, nargs=4, metavar=("X", "Y", "LARGURA", "ALTURA"))
    args = parser.parse_args()
    try:
        pack(args.source, args.output, {name: getattr(args, f"{name}_deck") for name in BRIDGE_REFERENCES})
    except (OSError, ValueError) as error:
        parser.exit(1, f"Erro de exportação: {error}\n")


if __name__ == "__main__":
    main()
