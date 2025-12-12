# TrafficIQ: DNS Log Analyzer

TrafficIQ is a modern web application for analyzing DNS logs, classifying domains, and visualizing network activity. It is designed for security analysts, IT admins, and anyone interested in understanding DNS traffic patterns, threats, and trends.

## Features
- **CSV Upload:** Import DNS logs (e.g., from OpenDNS) in CSV format.
- **Automatic Parsing:** Reads key columns (domain, category, traffic count/Total, etc.) and normalizes data.
- **Domain Classification:** Categorizes domains (user, phishing, adult, infrastructure) using customizable filters.
- **Summary Cards:** Quick stats for total domains, requests, and category breakdowns.
- **Aggregated Table:** Sortable, filterable view of registered domains and their traffic.
- **Preview Table:** See the first 200 rows of your uploaded data.
- **Edit Filters:** UI to adjust classification rules (keywords, TLDs) on the fly.
- **Export:** Download visible/filtered data as CSV.
- **Responsive UI:** Clean, modern, and mobile-friendly design.
- **Planned:** Timeline graph to visualize top domains over time (see Issues).

## How It Works
1. Upload a DNS CSV (OpenDNS or similar; must have domain and traffic columns).
2. The app parses the file, classifies each domain, and aggregates stats.
3. Use summary cards and tables to explore the data.
4. Adjust filters to refine classification.
5. Export results as needed.

## Tech Stack
- **Frontend:** React 18, JavaScript, modern CSS
- **Backend (planned):** FastAPI (Python) for advanced processing and storage
- **Charting (planned):** Chart.js or Recharts for timeline graphs

## Setup & Usage
1. Clone the repo: `git clone https://github.com/contactshobhit/TrafficIQ.git`
2. Install dependencies: `cd frontend && npm install`
3. Start the app: `npm start`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Folder Structure
- `frontend/src/`
  - `App.js` - Main entry
  - `DnsCsvAnalyzer.js` - Main analyzer component
  - `components/` - Modular UI components (SummaryCards, AggregatedTable, EditFiltersModal)

## Contributing
Pull requests and feature suggestions are welcome! See [Issues](https://github.com/contactshobhit/TrafficIQ/issues) for ideas.

## License
MIT License

---
For questions or support, contact the maintainer via GitHub.
