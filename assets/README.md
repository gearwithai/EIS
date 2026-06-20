# Media assets — drop your files here

The hero and founder sections look for these files. Until you add them, the page falls
back gracefully (cinematic gradient hero + a placeholder founder card), so nothing breaks.

## Hero background video — `assets/hero.mp4`
- Slow, cinematic roofing/repair footage (a crew working, a finished roof, drone pass, etc.).
- Recommended: 1920×1080 (or larger), H.264 MP4, **no audio needed** (it's muted), 10–20s loop.
- It autoplays, loops, is muted, and is **slowed to 0.55× in-browser** for the luxury slow-mo feel —
  so you can hand us normal-speed footage and it'll play back slow automatically.
- Keep the file reasonably small (aim < 8 MB) so mobile loads fast. A poster image at
  `assets/hero-poster.jpg` shows while the video buffers.

## Founder photo — `assets/founder.jpg`
- A strong portrait of Will (on a roof, by a truck, or a clean studio shot).
- Recommended: portrait orientation, ~1000×1250. It fills the founder card.
- To wire it in, set it as the background of `.founder__photo` (or tell us and we'll do it).

Once you send the files, drop them in this folder with the exact names above and redeploy.
