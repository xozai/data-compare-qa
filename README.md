# Data Compare

A local desktop utility for QA testers to compare two datasets side-by-side and get a detailed report of what matches, what doesn't, and what's missing.

Runs entirely in the browser — no backend, no cloud, no data leaves your machine.

---

## Features

- **Upload CSV or Excel files** — drag-and-drop or browse; auto-detects CSV delimiter; sheet picker for multi-tab Excel files
- **Map columns** — auto-map by name or manually pair source→target columns; supports differently-named columns across datasets
- **Define key columns** — pick one or more columns to use as the row identifier; composite keys supported
- **Comparison options** — case sensitivity, whitespace trimming, numeric tolerance
- **Results report**
  - Summary cards: matched rows, mismatched rows, cell-level mismatches, missing from target, missing from source
  - Mismatch table: key, column, source value vs target value — filterable by column or key search
  - Missing rows tabs: full row data for rows only in source or only in target
- **Export** — download CSV report or copy tab-separated data to clipboard (pastes cleanly into Excel/Google Sheets)

---

## Getting Started

**Requirements:** Node.js 18+

```bash
git clone https://github.com/xozai/data-compare-qa
cd data-compare-qa
npm install
npm run dev
```

Opens at `http://localhost:5173` in your default browser.

### Build for distribution

```bash
npm run build
npx serve dist
```

The `dist/` folder is a fully static site — share it as a folder or host it anywhere.

---

## Usage

### Step 1 — Upload Files

Drag and drop your **source** and **target** files onto the upload zones, or click to browse. Supported formats: `.csv`, `.tsv`, `.xlsx`, `.xls`.

After upload, a preview of the first 5 rows confirms the data was parsed correctly.

### Step 2 — Map Columns

- Click **Auto-Map by Name** to automatically pair columns with matching names (case-insensitive)
- Use the dropdowns to manually map columns with different names (e.g. `name` → `full_name`)
- Click the **key icon** next to a mapped column to designate it as the row identifier
- Set comparison options: case sensitivity, whitespace trimming, numeric tolerance

At least one key column is required before comparing.

### Step 3 — Results

The results view shows:

| Card | Meaning |
|------|---------|
| Matched Rows | Rows found in both datasets by key |
| Rows with Mismatches | Matched rows where at least one column value differs |
| Cell Mismatches | Total number of individual cell-level differences |
| Missing from Target | Rows in source with no matching key in target |
| Missing from Source | Rows in target with no matching key in source |

Use the **Mismatches**, **Missing from Target**, and **Missing from Source** tabs to drill into the details. Filter by column or search by key value.

Click **Download CSV** to save the report, or **Copy to Clipboard** to paste directly into Excel or Google Sheets.

---

## Test Data

The `test-data/` folder includes ready-made files for all QA scenarios:

| Files | Tests |
|-------|-------|
| `perfect-match-source/target.csv` | Identical datasets — expect 0 differences |
| `unicode-source/target.csv` | Accented characters, CJK, Arabic, emoji |
| `whitespace-source/target.csv` | Leading/trailing spaces — toggle trim whitespace |
| `case-diff-source/target.csv` | Mixed case vs lowercase — toggle case sensitivity |
| `numeric-source/target.csv` | Decimal precision differences — test numeric tolerance |
| `duplicate-keys-source/target.csv` | Duplicate key values — triggers warning |
| `large-source/target.csv` | 10,000 / 9,800 rows with 300 deliberate differences |
| `wide-source/target.csv` | 50 columns — tests horizontal scroll in mapper |
| `empty-source.csv` | Headers only, no data rows |
| `multi-sheet.xlsx` | 3-sheet Excel file — tests sheet picker |

---

## Project Structure

```
src/
  engine/
    parser.ts       # CSV (PapaParse) and Excel (SheetJS) parsing
    comparator.ts   # Core comparison algorithm
  components/
    upload/         # FileUploader, FilePreview
    mapping/        # ColumnMapper with auto-map and key picker
    results/        # ResultsSummary, MismatchTable, MissingRowsTable
    export/         # ExportButtons (CSV + clipboard)
  hooks/            # useFileParser, useColumnMapping, useComparison
  utils/            # cn (Tailwind merge), export helpers
  types/            # TypeScript interfaces
```

**Stack:** React 18, TypeScript, Vite, Tailwind CSS, PapaParse, SheetJS

---

## License

MIT — see [LICENSE](LICENSE) for details.
