Fitness Application (Web + Java Swing)

Overview
- Desktop and Web versions to calculate BMI (Body Mass Index) and BFP (Body Fat Percentage) using the Deurenberg formula.
- Java Swing desktop app and a static HTML/CSS/JS web app for local browser use.

Features
- Inputs: age, sex, height, weight with metric/imperial units.
- Outputs: BMI value + category; BFP value + category.
- Validate inputs and quick reset.

Requirements
- For web: Node.js 18+ and npm (for dev server) or any modern browser (for direct-open fallback).
- For desktop: Java 8 or newer (JDK) installed and on PATH.

Web App (npm workflow)
- From the repo root: `npm install` (or `npm i`)
- Start dev server: `npm run dev`
- Open the shown local URL (e.g., http://localhost:5173)

Web App (direct-open fallback)
- Open `fitness-application/web/index.html` directly in your browser.

Desktop (Java Swing) — optional
- Windows:
  - `cd fitness-application`
  - `.\\build.bat`
  - `.\\run.bat`
- macOS/Linux:
  - `cd fitness-application`
  - `bash build.sh`
  - `bash run.sh`

Notes
- BMI formula: weight_kg / (height_m^2)
- BFP (Deurenberg): 1.20*BMI + 0.23*Age - 10.8*sex - 5.4 (sex=1 for male, 0 for female)
- BFP categories use common sex-specific ranges.

