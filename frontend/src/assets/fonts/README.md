Current code prefers the `Trigram` font family first.

The repo already contains:

- `Trigram-vmLDM.ttf`

and falls back to `Adwaita Mono` if that file is missing or fails to load.

The repo currently still includes Adwaita Mono font files:

- `AdwaitaMono-Regular.ttf`
- `AdwaitaMono-Italic.ttf`
- `AdwaitaMono-Bold.ttf`
- `AdwaitaMono-BoldItalic.ttf`

If you later swap the primary font again, update the `@font-face` and `font-family` lines in `frontend/src/styles.css`.
