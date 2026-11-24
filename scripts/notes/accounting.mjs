// O Level Accounting 7707 starter notes, one string per syllabus part (same order as seed-data.mjs).
// Markdown: ## headings, - lists, **bold**, > tips, | tables |.
export default {
  "1": [
`## Why businesses keep accounts
**Book-keeping** is recording every financial transaction in the books. **Accounting** goes further: it summarises, presents and interprets that information so people can make decisions.

## What accounting is for
- Recording transactions accurately and in date order
- Working out **profit or loss** for a period
- Showing what the business **owns** (assets) and **owes** (liabilities)
- Helping the owner **plan and control** the business
- Giving information to others who need it (lenders, tax authorities, partners)

## Who uses the information
| User | What they want to know |
|---|---|
| Owner | Is it profitable? How much can I take as drawings? |
| Bank / lender | Can the business repay a loan? |
| Suppliers | Will we be paid on time? |
| Government | How much tax is due? |
| Employees | Is my job secure? |

> Exam tip: when asked "why does the owner keep accounting records?", give a reason AND explain it, e.g. "to calculate profit, so he knows whether the business is worth continuing".`,
`## The accounting equation
**Assets = Capital + Liabilities**

- **Assets**: resources the business owns or controls (premises, vehicles, inventory, trade receivables, bank, cash)
- **Liabilities**: amounts the business owes to outsiders (trade payables, loans, bank overdraft)
- **Capital**: the owner's investment in the business (what the business "owes" the owner)

Rearranged: **Capital = Assets − Liabilities** and **Liabilities = Assets − Capital**.

## Every transaction keeps it balanced
| Transaction | Effect |
|---|---|
| Owner pays $5 000 into the business bank | Assets +5 000, Capital +5 000 |
| Buys a van on credit $8 000 | Assets +8 000, Liabilities +8 000 |
| Pays a supplier $1 200 by bank | Assets −1 200, Liabilities −1 200 |
| Customer pays $400 into the bank | Bank +400, Trade receivables −400 (no total change) |
| Owner takes goods for personal use $300 | Assets −300, Capital −300 (drawings) |

**Profit increases capital**; **losses and drawings reduce capital**.

> Exam tip: always check the equation still balances after each change. If it doesn't, you've missed one side of the transaction.`,
  ],
  "2": [
`## The double entry rule
Every transaction affects **two accounts**: one is **debited**, the other **credited**, with the same amount.

| Increase on the debit side | Increase on the credit side |
|---|---|
| Assets | Liabilities |
| Expenses | Capital |
| Drawings | Income (revenue) |

Decreases go on the opposite side.

## Examples
- Cash sales $250 → **Dr Cash, Cr Sales**
- Credit purchases from Ali $600 → **Dr Purchases, Cr Ali**
- Rent paid by cheque $500 → **Dr Rent, Cr Bank**
- Owner takes $100 cash → **Dr Drawings, Cr Cash**
- Goods returned to Ali $60 → **Dr Ali, Cr Purchases returns**

## Balancing an account
1. Add up both sides.
2. Put the difference on the smaller side as **Balance c/d** (carried down).
3. Total both sides (they now match).
4. Bring the balance down on the other side as **Balance b/d**.

A debit balance on an asset or expense account is normal; a credit balance on a liability, capital or income account is normal.

> Exam tip: name the account in the narrative. For a debit entry in Ali's account you write "Purchases returns", the name of the *other* account.`,
`## Business documents (source documents)
Transactions are recorded from documents, which are the evidence.

| Document | Sent by → to | Purpose | Recorded in |
|---|---|---|---|
| **Invoice** | Seller → buyer | Bills for goods sold on credit | Sales / purchases journal |
| **Credit note** | Seller → buyer | Reduces the amount owed (returns, overcharge) | Returns journals |
| **Debit note** | Buyer → seller | Asks for a credit note | (Not recorded) |
| **Statement of account** | Seller → buyer | Summary of the month and balance owed | (Checking only) |
| **Receipt** | Receiver of cash → payer | Proof of payment | Cash book |
| **Cheque counterfoil / bank slip** | Business | Record of bank payments / deposits | Cash book |
| **Petty cash voucher** | Business | Small cash spending | Petty cash book |

## Discounts
- **Trade discount**: reduction off the list price for trade customers. Shown on the invoice, **never recorded** in the ledger.
- **Cash discount**: reward for paying early. **Discount allowed** is an expense; **discount received** is income.

> Exam tip: the net invoice value (after trade discount) is the amount entered in the books.`,
`## Books of prime entry
Transactions are first listed in a book of prime entry, then **posted** to the ledger. This keeps the ledger tidy and gives a record of each type of transaction.

| Book | Records | Posted to |
|---|---|---|
| **Sales journal** | Credit sales invoices | Dr each customer; Cr Sales (total) |
| **Purchases journal** | Credit purchases invoices | Cr each supplier; Dr Purchases (total) |
| **Sales returns journal** | Credit notes sent | Cr customers; Dr Sales returns |
| **Purchases returns journal** | Credit notes received | Dr suppliers; Cr Purchases returns |
| **Cash book** | All cash and bank receipts/payments | It is also a ledger account |
| **Petty cash book** | Small cash payments (imprest system) | Expense accounts |
| **General journal** | Anything else: opening entries, non-current assets on credit, corrections, write-offs | The accounts named |

## Ledger divisions
- **Sales ledger**: customers' accounts (trade receivables)
- **Purchases ledger**: suppliers' accounts (trade payables)
- **Nominal (general) ledger**: everything else (expenses, income, assets, capital)

> Exam tip: a general journal entry needs a **narrative** (a short explanation) under it.`,
  ],
  "3": [
`## The trial balance
A list of all ledger balances on a date, debits in one column and credits in the other. If double entry is correct, **the totals agree**.

| Usually debit | Usually credit |
|---|---|
| Assets, expenses, drawings, purchases, sales returns | Liabilities, capital, sales, purchases returns, income |

## It proves arithmetic, not accuracy
These errors **do not** stop it from balancing:
- **Omission**: transaction left out completely
- **Commission**: right type of account, wrong person (J. Lee instead of J. Leigh)
- **Principle**: wrong class of account (a machine debited to purchases)
- **Original entry**: wrong amount used in both entries
- **Complete reversal**: debit and credit swapped
- **Compensating**: two errors that cancel out

Errors that **do** make it disagree: single entry, unequal amounts, two debits, adding mistakes, a balance missed off the trial balance.

> Exam tip: learn the six "hidden" errors with an example of each. It's a favourite MCQ topic.`,
`## Correcting errors
Use the **general journal**, with a narrative.

Example (commission): $200 credit sale to K. Ram was debited to K. Rao.
| | Dr | Cr |
|---|---|---|
| K. Ram | 200 | |
| K. Rao | | 200 |
*Correction of sale posted to wrong customer.*

## Suspense account
If the trial balance doesn't agree, put the difference in a **suspense account** so the totals match, then clear it as each error is found.
- Debit total short by $90 → suspense has a **debit** balance of $90.
- Find an error that affects only one side → one entry is to suspense.

Example: discount allowed $40 was not posted to the discount allowed account.
| | Dr | Cr |
|---|---|---|
| Discount allowed | 40 | |
| Suspense | | 40 |

## Effect on profit
Ask: does the error change an **income or expense** account? If yes, profit changes. Errors only in assets/liabilities change the statement of financial position, not profit.

> Exam tip: for "effect on profit" questions, make a small table: original profit, + / − each correction, corrected profit.`,
`## Bank reconciliation
The **cash book (bank column)** and the **bank statement** rarely show the same balance, because of timing differences and items only one side knows about.

## Step 1: update the cash book
Add items on the bank statement not yet in the cash book:
- **Increase** (debit cash book): credit transfers, interest received, direct credits
- **Decrease** (credit cash book): bank charges, standing orders, direct debits, dishonoured cheques

## Step 2: reconcile to the bank statement
Start with the **updated cash book balance**, then adjust for timing differences:
| Updated cash book balance | X |
|---|---|
| Add: unpresented cheques (paid out, not yet cleared) | + |
| Less: uncredited deposits (paid in, not yet on statement) | − |
| **Balance per bank statement** | **X** |

You can also start from the bank statement and reverse the signs.

## Why it matters
- Finds errors in the cash book or by the bank
- Shows the correct bank figure for the statement of financial position
- Helps detect fraud
- Spots dishonoured cheques and stale cheques

> Exam tip: on a bank statement, credits increase the balance; in the cash book, debits increase it. Don't mix the two up.`,
`## Control accounts
A **control account** is a summary account that checks the accuracy of a whole ledger.

**Sales ledger control account** (trade receivables)
| Debit | Credit |
|---|---|
| Balance b/d | Cash and cheques received |
| Credit sales | Discounts allowed |
| Dishonoured cheques | Sales returns |
| Interest charged on overdue accounts | Irrecoverable debts written off |
| | Contra (set-off) |
| | Balance c/d |

**Purchases ledger control account** (trade payables) is the mirror image: payments, discounts received, returns and contras on the debit side; credit purchases on the credit side.

## Sources of the figures
Totals come from the books of prime entry (sales journal, returns journals, cash book, general journal).

## Uses
- Locate errors quickly (to one ledger)
- Give a fast total of receivables/payables for the statements
- Help prevent fraud when kept by a different person

> Exam tip: cash sales and cash purchases **never** go in a control account. Only credit transactions do.`,
  ],
  "4": [
`## Capital vs revenue
| | Capital | Revenue |
|---|---|---|
| **Expenditure** | Buying or improving non-current assets, including delivery, installation, legal fees | Running costs: repairs, wages, fuel, rent, insurance |
| **Receipts** | Owner's capital, loans, sale of non-current assets | Sales, rent received, commission received |

- Capital expenditure goes on the **statement of financial position**.
- Revenue expenditure is an **expense in the income statement**.

## Why getting it right matters
If capital expenditure is wrongly treated as revenue:
- **profit is understated** (expense too high)
- **non-current assets are understated**

The reverse overstates profit and assets.

Examples: painting a new building before it's used is part of getting it ready → capital. Repainting later → revenue. Extending a building → capital.

> Exam tip: "improves or adds to an asset" = capital; "maintains it" = revenue.`,
`## Depreciation
The loss in value of a non-current asset over its useful life, caused by **wear and tear, time, obsolescence, depletion**. It spreads the cost over the years that benefit (the **matching/accruals** concept).

## Methods
**Straight-line**: same amount each year
> (Cost − residual value) ÷ useful life
e.g. ($12 000 − $2 000) ÷ 5 = **$2 000 a year**

**Reducing balance**: fixed % of the net book value (NBV)
e.g. $20 000 at 25%: Year 1 $5 000 (NBV $15 000), Year 2 $3 750 (NBV $11 250)

## Recording
- Dr Depreciation (expense), Cr Provision for depreciation (accumulated depreciation)
- On the statement of financial position: Cost − accumulated depreciation = **Net book value**

## Disposal
Use a **disposal account**:
1. Dr Disposal, Cr Asset: cost
2. Dr Provision for depreciation, Cr Disposal: accumulated depreciation
3. Dr Bank, Cr Disposal: proceeds
4. Balance = **profit** (credit side short) or **loss** (debit side short) on disposal → income statement

> Exam tip: profit/loss on disposal = proceeds − NBV at the date of sale.`,
`## Accruals and prepayments
The **accruals concept**: income and expenses belong to the period they relate to, not when cash moves.

| | Meaning | Income statement | Statement of financial position |
|---|---|---|---|
| **Accrued expense** | Expense owed at year end | Add to expense | Other payable (current liability) |
| **Prepaid expense** | Expense paid in advance | Deduct from expense | Other receivable (current asset) |
| **Accrued income** | Income earned, not yet received | Add to income | Other receivable |
| **Income received in advance** | Received for next year | Deduct from income | Other payable |

## Worked example
Insurance $900 paid for 12 months from 1 October; year ends 31 December.
- Monthly cost $75. This year: Oct–Dec = **$225** expense.
- Prepaid: 9 months = **$675** (current asset).

## Expense account layout
Opening accrual on the credit side, opening prepayment on the debit side; cash paid on the debit; closing accrual c/d on the debit; closing prepayment c/d on the credit; the figure to the income statement balances it.

> Exam tip: ask "how much belongs to THIS year?" first. That's the income statement figure.`,
`## Irrecoverable debts
A debt that will not be paid (customer bankrupt, disappeared). Write it off:
- **Dr Irrecoverable debts, Cr Customer** (trade receivables)
- It is an expense in the income statement.

A debt later recovered: reinstate the debt, then record the cash.

## Allowance for irrecoverable debts
An estimate of debts that **might** not be paid (prudence). Often a % of trade receivables.
- **Increase** in allowance → expense (Dr income statement, Cr allowance)
- **Decrease** → income (Dr allowance, Cr income statement)
- On the statement of financial position: trade receivables **less** allowance.

## Worked example
Trade receivables $20 000, allowance 3% = $600. Last year's allowance was $450.
- Increase = $150 → **expense $150**
- SOFP: Trade receivables $20 000 − $600 = **$19 400**

> Exam tip: write off irrecoverable debts **before** calculating the allowance %.`,
`## Valuing inventory
Inventory is valued at **the lower of cost and net realisable value (NRV)**, following **prudence**.

- **Cost**: purchase price plus costs of getting it to its present location and condition (e.g. carriage inwards)
- **NRV**: expected selling price − costs to complete and sell

## Worked example
Damaged goods cost $800. After $100 of repairs they can be sold for $600.
NRV = $600 − $100 = **$500**. $500 < $800, so value at **$500**.

Value each item or group separately, not the total.

## Effect of errors
- Closing inventory **overstated** → cost of sales too low → **profit overstated** (and next year's profit understated).
- Closing inventory **understated** → profit understated.

## Inventory count adjustments
If the count is done after the year end, adjust back: add goods sold after the year end (at cost), deduct goods bought after the year end.

> Exam tip: never value inventory at selling price unless that's below cost.`,
  ],
  "5": [
`## Sole trader financial statements
**Income statement** (for the year ended …)
| | $ | $ |
|---|---|---|
| Revenue | | 60 000 |
| Less sales returns | | (1 000) |
| | | 59 000 |
| Opening inventory | 4 000 | |
| Purchases (+ carriage inwards − purchases returns) | 26 000 | |
| Less closing inventory | (5 000) | |
| **Cost of sales** | | (25 000) |
| **Gross profit** | | 34 000 |
| Add other income (discount received, rent received) | | 500 |
| Less expenses (wages, rent, depreciation, carriage outwards…) | | (20 500) |
| **Profit for the year** | | 14 000 |

**Statement of financial position** (at …)
- Non-current assets (at NBV)
- Current assets: inventory, trade receivables (less allowance), other receivables, bank, cash
- Current liabilities: trade payables, other payables, overdraft
- Non-current liabilities: long-term loans
- **Capital**: opening + profit (or − loss) − drawings = closing capital

> Exam tip: carriage inwards → cost of sales; carriage outwards → expenses.`,
`## Partnerships
Two or more people in business together. A **partnership agreement** sets out: profit-sharing ratio, interest on capital, interest on drawings, partners' salaries.

**Without an agreement**: share profits and losses **equally**, no interest on capital, no salaries.

## Appropriation account
Follows the income statement and shares out the profit.
| | $ |
|---|---|
| Profit for the year | 18 000 |
| Add interest on drawings | 300 |
| Less partner's salary | (6 000) |
| Less interest on capital | (2 300) |
| **Residual profit** shared in profit ratio | 10 000 |

## Capital and current accounts
- **Capital accounts**: fixed amounts invested.
- **Current accounts**: salaries, interest and share of profit (credit); drawings and interest on drawings (debit). The balance may be debit or credit.

> Exam tip: salaries and interest on capital are **not** expenses in the income statement. They're appropriations of profit.`,
`## Limited companies
Owned by **shareholders**, run by **directors**. A separate legal entity, so shareholders have **limited liability**.

## Equity (capital)
- **Ordinary share capital**: issued shares at nominal value
- **Retained earnings**: profits kept in the business
- **Reserves**, e.g. general reserve
**Equity = share capital + reserves**

## Key differences from a sole trader
| Sole trader | Limited company |
|---|---|
| Capital account | Share capital + reserves |
| Drawings | Dividends to shareholders |
| Owner bears all losses personally | Limited liability |

**Dividends** are paid out of retained earnings to shareholders. They are not an expense.

## Loans
Long-term borrowing (debentures/loans) is a **non-current liability**. Interest on loans **is** an expense.

> Exam tip: retained earnings at the end = opening + profit for the year − dividends paid.`,
`## Manufacturing accounts
Used by businesses that make their own goods. Prepared before the trading section to find the **cost of production**.

| | $ |
|---|---|
| Opening inventory of raw materials | 3 000 |
| Purchases of raw materials (+ carriage inwards) | 20 000 |
| Less closing inventory of raw materials | (4 000) |
| **Cost of raw materials consumed** | 19 000 |
| Direct labour (factory wages of production workers) | 15 000 |
| Direct expenses (e.g. royalties) | 1 000 |
| **Prime cost** | 35 000 |
| Factory overheads: indirect wages, factory rent, power, depreciation of machinery | 8 000 |
| Add opening WIP, less closing WIP | (500) |
| **Cost of production** | 42 500 |

The cost of production replaces "purchases" in the trading section (cost of sales of finished goods).

> Exam tip: split shared costs (e.g. rent) between factory and office using the ratio given. Only the factory share is a factory overhead.`,
`## Clubs and societies
Non-profit organisations. They use different names:
| Business | Club |
|---|---|
| Cash book summary | **Receipts and payments account** |
| Income statement | **Income and expenditure account** |
| Profit / loss | **Surplus / deficit** |
| Capital | **Accumulated fund** |

## Receipts and payments account
A summary of the cash book: opening balance, cash in, cash out, closing balance. It ignores accruals and depreciation.

## Income and expenditure account
Accruals basis: includes subscriptions for the year, depreciation, accrued and prepaid expenses.

## Subscriptions
Subscriptions in arrears (owed by members) → add to income, current asset. Subscriptions in advance → deduct from income, current liability.

## Trading activities
A bar or café is shown in a separate trading account; its profit goes to the income and expenditure account.

> Exam tip: opening accumulated fund = opening assets − opening liabilities.`,
`## Incomplete records
Many small traders don't keep full double entry. You build the statements from what is known.

## Method 1: statement of affairs
Capital = assets − liabilities at each date.
**Profit = closing capital − opening capital + drawings − capital introduced**
e.g. 38 000 − 30 000 + 5 000 − 0 = **$13 000**

## Method 2: reconstruct the accounts
- **Credit sales**: use a total trade receivables account (receipts + closing − opening receivables)
- **Credit purchases**: use a total trade payables account
- **Missing figures**: from mark-up or margin

## Mark-up and margin
- Mark-up = gross profit ÷ cost of sales
- Margin = gross profit ÷ revenue
A 25% mark-up = 20% margin (25/125).

> Exam tip: write the opening statement of affairs first. It gives opening capital, which you'll need later.`,
  ],
  "6": [
`## Accounting ratios
**Profitability**
| Ratio | Formula |
|---|---|
| Gross margin | Gross profit ÷ revenue × 100 |
| Mark-up | Gross profit ÷ cost of sales × 100 |
| Profit margin | Profit for the year ÷ revenue × 100 |
| Return on capital employed (ROCE) | Profit ÷ capital employed × 100 |

**Liquidity**
| Ratio | Formula |
|---|---|
| Current ratio | Current assets ÷ current liabilities |
| Liquid (acid test) ratio | (Current assets − inventory) ÷ current liabilities |

**Efficiency**
| Ratio | Formula |
|---|---|
| Rate of inventory turnover | Cost of sales ÷ average inventory (times) |
| Trade receivables turnover | Trade receivables ÷ credit sales × 365 (days) |
| Trade payables turnover | Trade payables ÷ credit purchases × 365 (days) |

Average inventory = (opening + closing) ÷ 2.

> Exam tip: show the formula, the figures, then the answer with the right unit (%, : 1, times or days).`,
`## Interpreting ratios
A ratio means nothing alone. Compare it with **last year, a competitor or an industry average**, then explain *why* it changed and suggest an action.

| Change | Possible causes | Possible actions |
|---|---|---|
| Gross margin falls | Higher purchase costs, price cuts, theft | Find cheaper suppliers, review prices |
| Profit margin falls but gross margin same | Expenses grew | Control expenses |
| Current ratio very low (< 1) | Too many payables, little cash | Raise cash, chase debtors, long-term loan |
| Current ratio very high | Idle cash or too much inventory | Invest surplus, reduce inventory |
| Inventory turnover slower | Overstocking, slow-selling goods | Reduce orders, promotions |
| Receivables days rising | Customers paying late | Credit control, discounts for early payment |

Guide only: a current ratio of about **1.5–2 : 1** and an acid test of about **1 : 1** are often seen as comfortable, but it depends on the business.

> Exam tip: "evaluate" means give both sides and a conclusion.`,
`## Inter-business comparison
Comparing with another business shows whether performance is good **for that kind of business**.

## Problems with comparing
- **Different accounting policies** (depreciation method, inventory valuation)
- **Different sizes**: use ratios, not raw figures
- **Different year ends** and seasons
- **Different types of business** within the same industry (e.g. online vs high-street)
- Financial statements are **historic**, so they may be out of date
- Figures may not include non-financial factors

## Making a fair comparison
- Use businesses in the same industry and similar size
- Use the same year and the same ratio formulas
- Look at trends over several years, not one year

> Exam tip: when asked to compare two businesses, pick the 2–3 most important ratios and explain what each difference means.`,
`## Who uses accounting information
| User | Main interest | Useful ratios |
|---|---|---|
| Owner / shareholders | Profit, return on investment | Margins, ROCE |
| Managers | Control and planning | All, especially efficiency |
| Bank / lenders | Repayment ability, security | Liquidity ratios, profit |
| Suppliers | Being paid on time | Current and acid test ratios, payables days |
| Customers | Continued supply, warranties | Profit, liquidity |
| Employees | Job security, pay rises | Profit |
| Government / tax | Tax due, statistics | Profit |
| Potential investors | Should I invest? | ROCE, profit trends |

> Exam tip: link the user to the ratio. "A bank would look at the liquid ratio because it shows whether short-term debts can be paid without selling inventory."`,
`## Limitations of accounting statements
- **Historic cost**: figures show the past and ignore inflation, so values may be out of date
- **Only money items** are recorded (money measurement): staff skill, reputation and customer loyalty don't appear
- **Estimates and judgement**: depreciation, allowance for irrecoverable debts, inventory valuation
- **Different policies** make comparison hard
- **A snapshot**: the statement of financial position is true on one day only
- Can be **window-dressed** to look better

## Limitations of ratios
- Based on the same historic figures
- Don't explain *why* something happened
- Averages can hide problems
- No single "correct" value

> Exam tip: in a 'discuss the usefulness' question, give the benefits first, then two or three limitations, then a conclusion.`,
  ],
  "7": [
`## Accounting concepts
| Concept | Meaning | Example |
|---|---|---|
| **Business entity** | The business is separate from the owner | Owner's personal shopping is drawings |
| **Duality** | Every transaction has two aspects | Double entry |
| **Money measurement** | Only items with a money value are recorded | Staff morale isn't recorded |
| **Historic cost** | Assets recorded at cost | Premises at purchase price |
| **Going concern** | The business will continue for the foreseeable future | Assets at cost, not break-up value |
| **Consistency** | Same methods every year | Same depreciation method |
| **Materiality** | Small items needn't be treated strictly | Stapler expensed, not capitalised |
| **Prudence** | Don't overstate assets or profit | Inventory at lower of cost and NRV |
| **Realisation** | Revenue recognised when goods pass to the customer | Credit sale recorded at delivery |
| **Accruals (matching)** | Income and expenses in the period they relate to | Accrued rent added to expense |

> Exam tip: in "which concept?" questions, look for the key word: "separate" = entity, "same method" = consistency, "small" = materiality, "continue" = going concern.`,
`## Ethics in accounting
Users trust financial statements only if accountants act ethically.

## Key principles
- **Integrity**: honest and straightforward
- **Objectivity**: not influenced by bias, pressure or conflicts of interest
- **Professional competence and due care**: keep skills up to date, work carefully
- **Confidentiality**: don't share business information without permission
- **Professional behaviour**: follow laws and regulations

## Ethical dilemmas
- An owner asks you to hide a loss or overstate inventory → breaks integrity
- A friend runs a business you're auditing → conflict of interest (objectivity)
- Telling a competitor about a client's results → breaks confidentiality

## Why it matters
- Lenders and investors make decisions on the figures
- Fraud and misleading statements are illegal
- The business's reputation depends on it

> Exam tip: name the principle AND explain how the situation breaks it.`,
`## Technology in accounting
**Accounting software** and cloud systems now do most book-keeping.

| Benefits | Drawbacks |
|---|---|
| Fast, accurate calculations | Cost of software and training |
| Automatic double entry and reports | Errors of principle/omission still possible |
| Real-time information | Risk of hacking and data loss, so backups and passwords are needed |
| Easy to share with accountants (cloud) | Depends on power and internet |
| Less paper | Staff may resist change |

Controls still matter: passwords, access levels, backups, checking reports.

## Sustainability
Businesses increasingly report on their **environmental and social impact**: carbon emissions, waste, energy use, fair treatment of workers.
- Investors and customers want sustainable businesses
- Can reduce costs (less energy, less waste)
- Some costs (pollution, clean-up) may need to be recognised

> Exam tip: in technology questions, balance benefits with risks and finish with a judgement.`,
  ],
};
