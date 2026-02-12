# sec-insider-cli

A lightweight Node.js CLI tool to track SEC Form 4 insider trading filings from EDGAR in real-time.

## Features

- 📊 Fetch recent Form 4 filings from SEC EDGAR RSS feed
- 🔍 Filter by ticker symbol or minimum transaction value
- 📋 Display results in a formatted CLI table
- 🚀 Zero external dependencies (uses native Node.js `fetch`)

## Installation

### From source

```bash
git clone https://github.com/kaikoh95/sec-insider-cli.git
cd sec-insider-cli
chmod +x index.js
npm link
```

### Direct usage

```bash
node index.js
```

## Usage

```bash
# View all recent Form 4 filings
sec-insider

# Filter by company ticker
sec-insider --ticker AAPL

# Filter by minimum transaction value
sec-insider --min-value 100000

# Combine filters
sec-insider --ticker TSLA --min-value 500000

# Show help
sec-insider --help
```

## Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--ticker <TICKER>` | `-t` | Filter filings by company ticker symbol |
| `--min-value <AMOUNT>` | - | Filter by minimum transaction value |
| `--help` | `-h` | Display help information |

## Output

The tool displays a formatted table with:

- **Company**: Company name from the filing
- **CIK**: SEC Central Index Key
- **Accession**: Filing accession number
- **Updated**: Timestamp of the filing

## How It Works

1. Fetches the SEC EDGAR Atom RSS feed for Form 4 filings
2. Parses the XML response (without external libraries)
3. Extracts company information and filing metadata
4. Filters based on provided options
5. Displays results in a clean CLI table

## Requirements

- Node.js v18+ (for native `fetch` support)

## SEC EDGAR API

This tool uses the SEC's official EDGAR RSS feed:
- Endpoint: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&output=atom`
- Complies with SEC's fair access policy (< 10 requests/second)
- Includes proper User-Agent header as required by SEC

## Limitations

- Currently displays metadata from RSS feed only
- Full Form 4 XML parsing (insider name, transaction details, prices, shares) requires additional API calls and complex XML parsing
- This is a POC demonstrating the core functionality

## Future Enhancements

- Parse actual Form 4 XML documents for detailed transaction information
- Add insider name, title, transaction type extraction
- Calculate transaction values (shares × price)
- Export to JSON/CSV
- Historical data search
- Real-time monitoring mode

## License

MIT

## Disclaimer

This tool is for informational purposes only. Not financial advice. Always verify information with official SEC sources.

## Links

- [SEC EDGAR](https://www.sec.gov/edgar.shtml)
- [Form 4 Information](https://www.sec.gov/files/form4data.pdf)
- [SEC Developer Resources](https://www.sec.gov/developer)
