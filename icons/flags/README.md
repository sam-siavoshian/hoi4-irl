# Flags

Each country's real flag as it was in official use in the scenario's year, from Wikimedia Commons. The artwork is
not drawn here: it is the Commons file, rendered to PNG by `tools/build-flags.cjs` (headless Chromium) at the sizes
the app uses. `<id>.png` is 320 px wide, `<id>-128.png` and `<id>-64.png` are the smaller ones; the app picks one by
the size it shows (`srcset`), so a 2x screen gets a sharp flag. The vector files themselves are not kept in this
repository.

All eight are in the public domain (the licence tag on each Commons page is given below). Flags are official
insignia: their use can be restricted by the law of the country they belong to, whatever their copyright status.
They are shown here only to identify the country a map is of.

| File | Flag | In use | Commons file | Author | Licence |
|---|---|---|---|---|---|
| `ethiopia.png` | Flag of the Ethiopian Empire: green, yellow and red with the Lion of Judah | 1897, 1914–1936, 1941–1974 | [Flag of Ethiopia (1897–1974).svg](https://commons.wikimedia.org/wiki/File:Flag_of_Ethiopia_(1897%E2%80%931974).svg) | Oren neu dag | Public domain (PD-Ethiopia) |
| `france.png` | The tricolour | 1794–1815, 1830 to today | [Flag of France.svg](https://commons.wikimedia.org/wiki/File:Flag_of_France.svg) | SKopp | Public domain (PD-shape, PD-flag) |
| `greece.png` | Flag of the Kingdom of Greece: the white cross on blue with the royal crown, the national flag on land | 1863–1924, 1935–1973 | [State Flag of Greece (1863-1924 and 1935-1973).svg](https://commons.wikimedia.org/wiki/File:State_Flag_of_Greece_(1863-1924_and_1935-1973).svg) | Peeperman | Public domain (PD-self) |
| `iran.png` | State flag of the Imperial State of Iran: green, white and red with the lion and sun, 1:3 | 1933–1964 | [State flag of Iran (1933–1964).svg](https://commons.wikimedia.org/wiki/File:State_flag_of_Iran_(1933%E2%80%931964).svg) | Orange Tuesday | Public domain (PD-user, PD-Iran) |
| `mexico.png` | Flag of Mexico with the 1934 coat of arms, 4:7 | 1934–1968 | [Flag of Mexico (1934-1968).svg](https://commons.wikimedia.org/wiki/File:Flag_of_Mexico_(1934-1968).svg) | TownDown | Public domain (PD-Coa-Mexico) |
| `peru.png` | Flag of Peru with the coat of arms (one flag for every use until 1950) | 1825–1950 (these arms from 1884) | [Flag of Peru (1884–1950).svg](https://commons.wikimedia.org/wiki/File:Flag_of_Peru_(1884%E2%80%931950).svg) | Huhsunqu | Public domain (PD-ineligible) |
| `siam.png` | The Trairanga, red, white and blue | 1917 to today | [Flag of Thailand.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Thailand.svg) | Zscout370 | Public domain (PD-Thailand, PD-shape) |
| `turkey.png` | Flag of Turkey, the crescent and star, as fixed by the Turkish Flag Law of 29 May 1936 | 1936 to today | [Flag of Turkey.svg](https://commons.wikimedia.org/wiki/File:Flag_of_Turkey.svg) | David Benbennick | Public domain (PD-Turkey, PD-shape) |

Notes:

- **Mexico** and **Peru** are rendered from Commons' own 1280 px PNG rendering of the file (Commons refused the
  original SVG to automated downloads), with its last, half-covered row of pixels cut off.
- **Siam**: the design is the 1917 one; the file uses the shades standardised in 2017, which are close to it.
- **Turkey**: the file is drawn to the 1983 Flag Law, which kept the 1936 law's construction.
- **Mexico**: the Commons page's structured data also lists GFDL and CC BY-SA 3.0; its licence tag is public domain
  (Mexican law does not protect the national arms and flag by copyright).

To rebuild: download each file into its own empty folder, `<dir>/<id>/flag.svg` (or `flag.png`), then
`node tools/build-flags.cjs <dir>`.
