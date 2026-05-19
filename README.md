# TXS Corp Dolibarr MCP Server 🚀

[![npm version](https://img.shields.io/npm/v/mcp-dolibarr.svg)](https://www.npmjs.com/package/mcp-dolibarr)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-digitalfactorysn-black?logo=github)](https://github.com/digitalfactorysn)

> A complete **Model Context Protocol (MCP)** server for Dolibarr ERP/CRM. It allows any AI assistant (Claude, Cursor, Windsurf, etc.) to act as a **full-fledged Dolibarr expert**: invoicing, advanced accounting, CRM, projects, inventory, contracts, complete system configuration, and much more.
>
> **Developed by [Digital Factory Senegal](https://digitalfactory.sn)**  
> 🌐 [digitalfactory.sn](https://digitalfactory.sn) &nbsp;|&nbsp; 📞 WhatsApp: [+221 77 800 38 14](https://wa.me/221778003814) &nbsp;|&nbsp; 📧 [infos@digitalfactory.sn](mailto:infos@digitalfactory.sn)

---

## ✨ Features (55+ Tools)

### 🏢 Third Parties (Customers / Suppliers)
- List, search, create, and update third parties
- Access history (invoices, quotes, orders, contacts for a third party)

### 📄 Invoicing (10 Tools)
- Create draft invoices, add/edit/delete invoice lines
- Officially validate invoices
- Record payments with multi-invoice allocation
- Create credit notes (credit invoices)
- Send invoices by email

### 📋 Quotes & Commercial Proposals
- Create, send, validate, sign, and reject quotes
- Convert a signed quote into a customer order

### 📦 Orders (Customers & Suppliers)
- Full management of the order → delivery → invoicing workflow
- Supplier orders and procurement

### 🏭 Products & Inventory
- Product and service catalog with pricing, VAT, and accounting codes
- Inventory lookup and stock movements by warehouse

### 💰 Accounting & Treasury (Advanced)
- View bank accounts and transactions
- Chart of accounts and accounting journals
- General ledger entries
- **Financial summary reports**: revenue, outstanding invoices, cash balance

### 🤝 CRM
- Individual contacts
- Activity calendar (calls, meetings, sales emails)

### 📊 Projects & Tasks
- Manage customer projects with budgets and deadlines
- Create and track tasks

### 👥 HR & Administration
- List users and sales representatives
- View expense reports

### 📑 Contracts & Subscriptions
- Create and manage customer contracts

### ⚙️ System Configuration & Administration
- Company information (including updates)
- Enable/disable modules
- Read and write system constants
- Payment methods and terms, currencies, countries

---

## 🚀 Installation

### Method 1: Using npx (Recommended, No Installation Required)
```bash
npx mcp-dolibarr
```

### Method 2: Global Installation
```bash
npm install -g mcp-dolibarr
```

### Method 3: Install from Source Code
```bash
git clone https://github.com/digitalfactorysn/mcp-dolibarr.git
cd mcp-dolibarr
npm install && npm run build
```

---

## ⚙️ Configuration

### 1. Enable the REST API in Dolibarr
In your Dolibarr instance: **Home > Setup > Modules > Enable "Dolibarr REST API"**

### 2. Obtain Your API Key
In your Dolibarr instance: **Home > Users & Groups > [Your Profile] > "User Card" Tab**  
Copy the value from the **"Key for REST API"** field (generate one if it is empty).

---

## 🔌 Connect with Claude Desktop

Edit the Claude Desktop configuration file:
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "dolibarr": {
      "command": "npx",
      "args": ["mcp-dolibarr"],
      "env": {
        "DOLIBARR_URL": "https://your-instance.dolibarr.com",
        "DOLIBARR_API_KEY": "YOUR_SECRET_API_KEY"
      }
    }
  }
}
```

> Restart Claude Desktop. A new 🔌 icon will appear — Dolibarr is now connected!

---

## 🔌 Connect with Cursor / Windsurf

In your IDE MCP settings:

```json
{
  "mcp": {
    "servers": {
      "dolibarr": {
        "command": "npx",
        "args": ["mcp-dolibarr"],
        "env": {
          "DOLIBARR_URL": "https://your-instance.dolibarr.com",
          "DOLIBARR_API_KEY": "YOUR_API_KEY"
        }
      }
    }
  }
}
```

---

## 💡 Example AI Prompts

Once connected, you can ask your AI assistant:

```text
"What are the last 5 unpaid invoices?"
→ list_invoices (status=1, limit=5)

"Create a quote for STN GROUPE for Azure maintenance at 150,000 FCFA before tax with 18% VAT"
→ create_proposal → add_proposal_line → validate_proposal

"What is our revenue for 2025?"
→ get_financial_summary (year=2025)

"Show me the chart of accounts"
→ list_accounting_accounts

"Which modules are enabled on our Dolibarr instance?"
→ list_modules
```

---

## 🔐 Security

- **Never commit** your API key to a Git repository.
- Use a dedicated Dolibarr account with the **minimum required permissions**.
- The API key is transmitted only between your local machine and your Dolibarr instance (not through third-party services).

---

## 📜 License

MIT © [Digital Factory Senegal](https://digitalfactory.sn)
