from pathlib import Path
from tempfile import TemporaryDirectory

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "scripts" / "assets" / "material-symbols-outlined.source.woff2"
ICONS = ROOT / "scripts" / "material-symbols-icons.txt"
OUTPUT = ROOT / "public" / "fonts" / "material-symbols-outlined.woff2"

if not SOURCE.exists():
    raise SystemExit(f"Missing source font: {SOURCE}")

icons = {line.strip() for line in ICONS.read_text(encoding="utf-8").splitlines() if line.strip()}
font = TTFont(SOURCE)
removed = 0
matched_icons = set()
digits = {"zero": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9"}

def ligature_name(first_glyph, components):
    glyphs = [first_glyph, *components]
    chars = []
    for glyph in glyphs:
        if glyph == "underscore":
            chars.append("_")
        elif glyph.startswith("digit_") and glyph[6:] in digits:
            chars.append(digits[glyph[6:]])
        elif len(glyph) == 1 and glyph.isascii():
            chars.append(glyph)
        else:
            return None
    return "".join(chars)

for lookup in font["GSUB"].table.LookupList.Lookup:
    subtables = []
    if lookup.LookupType == 4:
        subtables = lookup.SubTable
    elif lookup.LookupType == 7:
        subtables = [
            subtable.ExtSubTable
            for subtable in lookup.SubTable
            if subtable.ExtensionLookupType == 4
        ]

    for subtable in subtables:
        kept = {}
        for first_glyph, records in subtable.ligatures.items():
            matches = []
            for record in records:
                name = ligature_name(first_glyph, record.Component)
                if name in icons:
                    matches.append(record)
                    matched_icons.add(name)
            removed += len(records) - len(matches)
            if matches:
                kept[first_glyph] = matches
        subtable.ligatures = kept

missing_icons = sorted(icons - matched_icons)
if missing_icons:
    raise SystemExit(f"Icons are missing from the source font: {', '.join(missing_icons)}")

with TemporaryDirectory() as directory:
    filtered_source = Path(directory) / "material-symbols-filtered.ttf"
    font.flavor = None
    font.save(filtered_source)
    subset.main([
        str(filtered_source),
        f"--text-file={ICONS}",
        f"--output-file={OUTPUT}",
        "--flavor=woff2",
        "--layout-features=*",
        "--glyph-names",
        "--no-hinting",
    ])

print(f"Filtered out {removed} unused icon ligatures.")
