#!/usr/bin/env node

import { parseArgs } from 'node:util';

// SEC requires a proper User-Agent header
const SEC_USER_AGENT = 'sec-insider-cli/1.0 (contact@example.com)';
const SEC_RSS_URL = 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&dateb=&owner=include&count=100&output=atom';

/**
 * Fetch Form 4 filings from SEC EDGAR RSS feed
 */
async function fetchFilings() {
  try {
    const response = await fetch(SEC_RSS_URL, {
      headers: {
        'User-Agent': SEC_USER_AGENT,
        'Accept': 'application/atom+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`SEC API returned ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    return parseRSS(xmlText);
  } catch (error) {
    console.error('Error fetching filings:', error.message);
    process.exit(1);
  }
}

/**
 * Parse RSS/Atom XML feed (basic XML parsing without external deps)
 */
function parseRSS(xml) {
  const filings = [];
  
  // Extract each entry from the Atom feed
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  const entries = [...xml.matchAll(entryRegex)];

  for (const entry of entries) {
    const entryXml = entry[1];
    
    // Extract basic fields
    const title = extractTag(entryXml, 'title');
    const summary = extractTag(entryXml, 'summary');
    const link = extractAttribute(entryXml, 'link', 'href');
    const updated = extractTag(entryXml, 'updated');

    // Parse title to get company name and form type
    // Title format: "4 - COMPANY NAME (CIK) (Reporting)" or "4 - Company Name (CIK) (Filer)"
    const titleMatch = title.match(/^(\S+)\s*-\s*(.+?)\s*\((\d+)\)\s*\((Reporting|Filer)\)/);
    const formType = titleMatch ? titleMatch[1].trim() : '';
    const company = titleMatch ? titleMatch[2].trim() : title;
    const cik = titleMatch ? titleMatch[3] : '';
    const filerType = titleMatch ? titleMatch[4] : '';

    // Extract accession number from summary or link
    const summaryAccMatch = summary.match(/AccNo:<\/b>\s*(\d+-\d+-\d+)/);
    const linkAccMatch = link.match(/\/(\d+-\d+-\d+)-index\.htm/);
    const accession = summaryAccMatch ? summaryAccMatch[1] : (linkAccMatch ? linkAccMatch[1] : '');

    // Only include Form 4 filings (insider trading)
    if (formType === '4' && filerType === 'Reporting') {
      filings.push({
        company,
        cik,
        accession,
        formType,
        filerType,
        summary: summary.trim(),
        link,
        updated,
        // These would need to be fetched from the actual filing document
        insider: 'N/A',
        title: 'N/A',
        transactionType: 'N/A',
        shares: 'N/A',
        price: 'N/A',
        value: 0,
      });
    }
  }

  return filings;
}

/**
 * Extract content from XML tag
 */
function extractTag(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() : '';
}

/**
 * Extract attribute from XML tag
 */
function extractAttribute(xml, tagName, attrName) {
  const regex = new RegExp(`<${tagName}[^>]*${attrName}=["']([^"']+)["']`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : '';
}

/**
 * Fetch and parse a specific Form 4 filing to extract insider details
 * (This is a simplified version - actual Form 4 parsing is complex)
 */
async function fetchFilingDetails(accession, cik) {
  try {
    // Construct URL to the filing page
    const filingUrl = `https://www.sec.gov/cgi-bin/viewer?action=view&cik=${cik}&accession_number=${accession}&xbrl_type=v`;
    
    // Note: This is a simplified approach. Real Form 4 parsing would require
    // fetching and parsing the actual XML document from EDGAR
    return {
      insider: 'Parsing not implemented',
      title: 'N/A',
      transactionType: 'N/A',
      shares: 'N/A',
      price: 'N/A',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Filter filings based on options
 */
function filterFilings(filings, options) {
  let filtered = [...filings];

  if (options.ticker) {
    const tickerUpper = options.ticker.toUpperCase();
    filtered = filtered.filter(f => 
      f.company.toUpperCase().includes(tickerUpper)
    );
  }

  if (options.minValue) {
    filtered = filtered.filter(f => f.value >= options.minValue);
  }

  return filtered;
}

/**
 * Format filings as a CLI table
 */
function displayTable(filings) {
  if (filings.length === 0) {
    console.log('No filings found matching criteria.');
    return;
  }

  // Table headers
  const headers = ['Company', 'CIK', 'Accession', 'Updated'];
  const colWidths = [40, 12, 22, 25];

  // Print header
  console.log('\n' + '='.repeat(105));
  console.log(formatRow(headers, colWidths));
  console.log('='.repeat(105));

  // Print rows
  for (const filing of filings) {
    const row = [
      truncate(filing.company, colWidths[0]),
      filing.cik,
      filing.accession,
      filing.updated.substring(0, 19).replace('T', ' '),
    ];
    console.log(formatRow(row, colWidths));
  }

  console.log('='.repeat(105));
  console.log(`\nTotal filings: ${filings.length}\n`);
}

/**
 * Format a table row
 */
function formatRow(columns, widths) {
  return columns.map((col, i) => {
    const str = String(col);
    return str.padEnd(widths[i]).substring(0, widths[i]);
  }).join(' | ');
}

/**
 * Truncate string to max length
 */
function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}

/**
 * Main CLI function
 */
async function main() {
  const { values } = parseArgs({
    options: {
      ticker: {
        type: 'string',
        short: 't',
      },
      'min-value': {
        type: 'string',
      },
      help: {
        type: 'boolean',
        short: 'h',
      },
    },
  });

  if (values.help) {
    console.log(`
sec-insider-cli - Track SEC Form 4 Insider Trading Filings

Usage:
  sec-insider [options]

Options:
  -t, --ticker <TICKER>      Filter by company ticker symbol
      --min-value <AMOUNT>   Filter by minimum transaction value
  -h, --help                 Show this help message

Examples:
  sec-insider
  sec-insider --ticker AAPL
  sec-insider --min-value 100000
  sec-insider --ticker TSLA --min-value 500000
`);
    process.exit(0);
  }

  console.log('Fetching recent Form 4 filings from SEC EDGAR...\n');

  const filings = await fetchFilings();
  
  const options = {
    ticker: values.ticker,
    minValue: values['min-value'] ? parseInt(values['min-value'], 10) : null,
  };

  const filtered = filterFilings(filings, options);
  displayTable(filtered);

  console.log('View filing details at: https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&owner=include\n');
}

main();
