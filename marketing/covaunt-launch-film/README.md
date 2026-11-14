# COVAUNT launch film workspace

This directory contains the editable huashu-motion composition, treatment, storyboard, evidence manifest and release drafts for the COVAUNT proof film.

The production app remains independent. Heavy render outputs belong in `output/` or a release asset, not in the application repository history.

```powershell
Set-Location .\huashu-motion-src
node .\cli\om.js doctor
node .\cli\om.js check ..\project
node .\cli\om.js sound ..\project
node .\cli\om.js render ..\project --format mp4 --fps 30 --workers 4 --video seek
node .\cli\om.js qa ..\project\out\COVAUNT_LAUNCH_FILM_FINAL.mp4 --sheet 4
```

The delivered master was rendered with the standard seek renderer after the
motion and frame review pass. A motion-blur retry was tested separately but was
not used for the final Windows master.

The current film is 84 seconds by composition design, 1920×1080, score-led, and uses the public COVAUNT production capture plus verified testnet receipt IDs listed in `COVAUNT_VIDEO_EVIDENCE.md`.
