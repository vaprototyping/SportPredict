
# FootyValue Pro - A+1 Analytics Engine

A production-ready football betting analytics tool focusing on **Asian Handicap 0.0 (DNB)** and **+0.5** markets.

## Deployment Steps (GitHub + Cloudflare Pages)

1.  **Repository Setup:**
    - Create a new repository on GitHub (e.g., `footy-value-pro`).
    - Initialize it with the code provided in this response.
    - `git add .`, `git commit -m "initial commit"`, `git push origin main`.

2.  **Cloudflare Pages Deployment:**
    - Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
    - Go to **Workers & Pages** > **Create application** > **Pages**.
    - Click **Connect to Git** and select your repository.
    - Set **Build Settings**:
        - Framework preset: `Create React App` (or `None`).
        - Build command: `npm run build`.
        - Build output directory: `dist` or `build` (depending on your setup, usually `build` for standard React).
    - Click **Save and Deploy**.

3.  **Domain:**
    - Cloudflare will provide a `*.pages.dev` URL. Your app is now live and accessible from anywhere.

## Weekly Checklist

1.  **Historical Update:**
    - Download latest results CSVs from [football-data.co.uk](https://www.football-data.co.uk/).
    - Drag and drop them into the **Data Sources** tab.
2.  **Odds Snapshot:**
    - Check upcoming matches and their Asian Handicap odds (0.0 or +0.5).
    - Format them into the provided template `upcoming_events.csv`.
3.  **Upload & Map:**
    - Upload your upcoming events.
    - Check the **Team Mapping** tab for any red highlights or missing links. Match the upcoming name to the historical name.
4.  **Analyze:**
    - Click **Run Analysis**.
    - Use the EV and Probability sliders to find your comfort zone.
    - Review the Top 3-5 picks.
5.  **Export:**
    - Download the results as CSV for your records.

## Troubleshooting

- **Team Mismatches:** If a team "Man Utd" appears in your odds CSV but "Man United" is in historical data, the engine won't find form. Use the **Team Mapping** screen to link them.
- **Bad Date Formats:** The engine expects `YYYY-MM-DD` or `DD/MM/YYYY`. Ensure your CSV matches one of these.
- **Empty Picks:** If no picks show up, try lowering the **EV Filter** (e.g., to 2%) or ensure you have at least 10 previous matches for both teams in the historical upload.
