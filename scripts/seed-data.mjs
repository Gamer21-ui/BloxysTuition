// Starter content for the O Level courses (Nov 2027 exams).
// Chapters and parts follow the official Cambridge syllabuses:
//   Accounting 7707 (2027–2029), Business 7081 (2027–2029, replaces Business Studies 7115),
//   Economics 2281 (2027–2029), Computer Science 2210 (2026–2028).
// Questions: [prompt, [options], correctIndex, explanation]
// Run `npm run seed:sql` to regenerate supabase/seed.sql from this file.

export const COURSES = [
  {
    slug: "o-accounting", code: "7707", title: "O Level Accounting", tier: "O", color: "#22c55e", icon: "calculator",
    exam_label: "Cambridge O Level Accounting 7707 · Nov 2027",
    description: "Double entry, verification, financial statements and ratios. Paper 1: 40 MCQs (1h30). Paper 2: five 20-mark questions (1h45).",
    chapters: [
      { n: "1", t: "The fundamentals of accounting", parts: ["1.1 The purpose of accounting", "1.2 The accounting equation"], q: [
        ["What is the accounting equation?", ["Assets = Capital + Liabilities", "Assets = Capital − Liabilities", "Capital = Assets + Liabilities", "Liabilities = Assets + Capital"], 0, "Everything a business owns is financed either by the owner (capital) or by outsiders (liabilities)."],
        ["A business has assets of $50 000 and liabilities of $18 000. What is the capital?", ["$32 000", "$68 000", "$18 000", "$50 000"], 0, "Capital = Assets − Liabilities = 50 000 − 18 000."],
        ["The owner takes goods for personal use. What happens to the accounting equation?", ["Assets and capital both decrease", "Assets increase, capital decreases", "Liabilities increase", "No change"], 0, "Drawings reduce capital, and the inventory (an asset) falls."],
        ["What is the main purpose of accounting?", ["To provide financial information for decision making", "To calculate tax only", "To pay employees", "To advertise the business"], 0, "Accounting records transactions and reports information users need to make decisions."],
        ["Which of these is a liability?", ["Trade payables", "Trade receivables", "Inventory", "Motor vehicles"], 0, "Trade payables are amounts the business owes to credit suppliers."]] },
      { n: "2", t: "Sources and recording of data", parts: ["2.1 The double entry system of book-keeping", "2.2 Business documents", "2.3 Books of prime entry"], q: [
        ["Goods bought on credit from Ali. Which entries are made?", ["Debit purchases, credit Ali", "Debit Ali, credit purchases", "Debit purchases, credit cash", "Debit inventory, credit sales"], 0, "The expense/asset account is debited; the supplier (a liability) is credited."],
        ["Which document is sent by a seller to correct an overcharge or for goods returned?", ["Credit note", "Debit note", "Invoice", "Statement of account"], 0, "A credit note reduces the amount the customer owes."],
        ["In which book of prime entry are credit sales recorded?", ["Sales journal", "Purchases journal", "Cash book", "General journal"], 0, "Credit sales invoices are listed in the sales journal."],
        ["A cash discount allowed to a customer is recorded as…", ["Debit discount allowed, credit customer", "Debit customer, credit discount allowed", "Debit cash, credit sales", "Only in the sales journal"], 0, "Discount allowed is an expense (debit) and reduces the customer's balance (credit)."],
        ["Which document is used to record goods returned by a customer?", ["Sales returns journal", "Purchases journal", "Petty cash book", "Sales journal"], 0, "Returns inwards are listed in the sales returns journal from credit notes issued."]] },
      { n: "3", t: "Verification of accounting records", parts: ["3.1 The trial balance", "3.2 Corrections of errors", "3.3 Bank reconciliation", "3.4 Control accounts"], q: [
        ["Which error does NOT affect the agreement of the trial balance?", ["Error of commission", "Single entry", "Wrong addition in one ledger account", "Debit entry only"], 0, "Errors of commission (and omission, principle, original entry, complete reversal, compensating) leave the trial balance balanced."],
        ["Why might the bank statement show a higher balance than the cash book?", ["Unpresented cheques", "Bank charges", "Dishonoured cheques", "Direct debits"], 0, "Cheques paid out but not yet presented are already deducted in the cash book but not by the bank."],
        ["Where is a difference in the trial balance temporarily recorded?", ["Suspense account", "Capital account", "Drawings account", "Bank account"], 0, "The suspense account holds the difference until the errors are found."],
        ["In a sales ledger control account, which item is on the debit side?", ["Credit sales", "Receipts from customers", "Discounts allowed", "Sales returns"], 0, "Credit sales increase trade receivables, so they are debited."],
        ["A purchase of office equipment was debited to the purchases account. This is an error of…", ["Principle", "Commission", "Omission", "Original entry"], 0, "Capital expenditure was posted to a revenue account: the wrong class of account."]] },
      { n: "4", t: "Accounting procedures", parts: ["4.1 Capital and revenue expenditure and receipts", "4.2 Accounting for depreciation and disposal of non-current assets", "4.3 Other payables and other receivables", "4.4 Irrecoverable debts and allowance for irrecoverable debts", "4.5 Valuation of inventory"], q: [
        ["Which is capital expenditure?", ["Cost of installing a new machine", "Repairs to a machine", "Fuel for delivery vans", "Wages of salespeople"], 0, "Installation is part of bringing the asset into use, so it is capitalised."],
        ["A machine costs $20 000 and is depreciated at 25% per year on the reducing balance. What is the depreciation in year 2?", ["$3 750", "$5 000", "$2 500", "$4 000"], 0, "Year 1: 5 000; NBV 15 000; Year 2: 25% × 15 000 = 3 750."],
        ["Rent of $1 200 is owed at the year end. How is it shown?", ["Other payable (accrual) and added to the rent expense", "Other receivable", "Deducted from rent expense", "Not shown"], 0, "Expenses owed are accruals: a current liability, and the expense is increased."],
        ["Inventory should be valued at…", ["The lower of cost and net realisable value", "Selling price", "Replacement cost", "The higher of cost and NRV"], 0, "This follows the prudence concept."],
        ["An increase in the allowance for irrecoverable debts is…", ["An expense in the income statement", "Income", "A liability only", "Added to trade receivables"], 0, "The increase is charged as an expense; the allowance is deducted from receivables."]] },
      { n: "5", t: "Preparation of financial statements", parts: ["5.1 Sole traders", "5.2 Partnerships", "5.3 Limited companies", "5.4 Manufacturing accounts", "5.5 Clubs and societies", "5.6 Incomplete records"], q: [
        ["Gross profit is…", ["Revenue − cost of sales", "Revenue − all expenses", "Assets − liabilities", "Cost of sales − expenses"], 0, "Cost of sales = opening inventory + purchases − closing inventory."],
        ["In a partnership, where is interest on capital recorded?", ["Appropriation account", "Income statement", "Statement of financial position only", "Purchases account"], 0, "It shares out profit, so it goes in the appropriation account."],
        ["A club's equivalent of the income statement is the…", ["Income and expenditure account", "Receipts and payments account", "Trading account", "Appropriation account"], 0, "The receipts and payments account is a summary of the cash book."],
        ["Prime cost in a manufacturing account is…", ["Direct materials + direct labour + direct expenses", "Factory overheads only", "Cost of production + profit", "Raw materials only"], 0, "Prime cost is the total of direct costs."],
        ["Opening capital $30 000, closing capital $38 000, drawings $5 000, no new capital. What is the profit?", ["$13 000", "$8 000", "$3 000", "$43 000"], 0, "Profit = closing − opening + drawings = 38 000 − 30 000 + 5 000."]] },
      { n: "6", t: "Analysis and interpretation", parts: ["6.1 Calculation and understanding of accounting ratios", "6.2 Interpretation of accounting ratios", "6.3 Inter-business comparison", "6.4 Interested parties", "6.5 Limitations of accounting statements"], q: [
        ["Current ratio =", ["Current assets ÷ current liabilities", "Current liabilities ÷ current assets", "(Current assets − inventory) ÷ current liabilities", "Profit ÷ revenue"], 0, "It measures the ability to pay short-term debts."],
        ["Revenue $80 000, gross profit $20 000. Gross margin is…", ["25%", "20%", "33.3%", "75%"], 0, "20 000 ÷ 80 000 × 100."],
        ["The liquid (acid test) ratio excludes…", ["Inventory", "Trade receivables", "Cash", "Bank"], 0, "Inventory is the least liquid current asset."],
        ["Which user is most interested in a business's ability to repay a loan?", ["Bank / lender", "Customers", "Competitors", "Employees"], 0, "Lenders focus on liquidity and profitability for repayment."],
        ["A limitation of comparing ratios between two businesses is that…", ["They may use different accounting policies", "Ratios are always identical", "Ratios use no figures", "Ratios ignore profit"], 0, "Different policies (e.g. depreciation methods) make comparison less reliable."]] },
      { n: "7", t: "Accounting concepts and modern practice", parts: ["7.1 Accounting concepts", "7.2 Ethical considerations", "7.3 Technology and sustainability"], q: [
        ["Recording a non-current asset at cost rather than market value follows which concept?", ["Historic cost", "Going concern", "Materiality", "Realisation"], 0, "Assets are recorded at their original cost."],
        ["Expenses are matched against the revenue of the period they relate to. This is…", ["Accruals (matching)", "Prudence", "Duality", "Business entity"], 0, "Accruals: record income and expenses when earned/incurred, not when paid."],
        ["The owner's personal expenses are kept separate from the business. This is…", ["Business entity", "Consistency", "Money measurement", "Going concern"], 0, "The business is treated as separate from its owner."],
        ["Why must accountants behave ethically?", ["So users can trust the financial information", "To increase profit", "To avoid tax", "To reduce inventory"], 0, "Integrity and objectivity keep financial statements reliable."],
        ["A benefit of using accounting software is…", ["Faster, more accurate processing", "No need for any controls", "Errors of principle become impossible", "It replaces all accountants"], 0, "Software speeds up calculations and reduces arithmetic errors, but controls are still needed."]] }
    ]
  },
  {
    slug: "o-business", code: "7081", title: "O Level Business", tier: "O", color: "#f59e0b", icon: "briefcase",
    exam_label: "Cambridge O Level Business 7081 · Nov 2027",
    description: "Replaces Business Studies 7115 from 2027. Paper 1: short answer and data response (1h30). Paper 2: case study (1h30).",
    chapters: [
      { n: "1", t: "Understanding business activity", parts: ["1.1 Business activity", "1.2 Economic sectors", "1.3 Enterprise, business growth and size", "1.4 Types of business organisation", "1.5 Business objectives and stakeholder objectives"], q: [
        ["Which business is in the secondary sector?", ["Car manufacturer", "Bank", "Fishing company", "Hairdresser"], 0, "Secondary = manufacturing and construction."],
        ["Unlimited liability means…", ["Owners may lose personal possessions to pay business debts", "Owners can only lose their investment", "The business cannot borrow", "The business pays no tax"], 0, "Sole traders and ordinary partners have unlimited liability."],
        ["Which is a measure of business size?", ["Number of employees", "The owner's age", "The business name", "Number of products advertised"], 0, "Others include capital employed and market share."],
        ["Two businesses at the same stage of production join together. This is…", ["Horizontal integration", "Vertical integration", "Conglomerate integration", "A franchise"], 0, "Same stage, same industry."],
        ["Which stakeholder is most likely to want higher wages?", ["Employees", "Shareholders", "Customers", "Government"], 0, "Stakeholder objectives can conflict, e.g. wages vs profit."]] },
      { n: "2", t: "People in business", parts: ["2.1 Human resource management (HRM)", "2.2 Organisation and management", "2.3 Methods of communication", "2.4 Motivating employees"], q: [
        ["In Maslow's hierarchy, which need is at the top?", ["Self-actualisation", "Safety", "Social", "Physiological"], 0, "Achieving your full potential."],
        ["Span of control is…", ["The number of subordinates directly under a manager", "The number of levels in a hierarchy", "The chain of command", "The total workforce"], 0, "Wide spans mean flatter structures."],
        ["Which is a non-financial method of motivation?", ["Job enrichment", "Bonus", "Commission", "Piece rate"], 0, "Job enrichment gives more challenging, responsible tasks."],
        ["Induction training is…", ["Introducing new employees to the business", "Training on the job for experienced staff", "Training at a college", "Dismissal"], 0, "It helps new staff settle in and become productive quickly."],
        ["A disadvantage of email compared with a face-to-face meeting is…", ["No immediate feedback or body language", "It is slow", "It cannot be stored", "It is expensive"], 0, "Written communication can be misunderstood without immediate feedback."]] },
      { n: "3", t: "Marketing", parts: ["3.1 Marketing and the market", "3.2 Market research", "3.3 Marketing mix", "3.4 Legal controls"], q: [
        ["Primary market research is…", ["Collecting new data first-hand", "Using published statistics", "Using competitors' reports", "Reading newspapers"], 0, "E.g. questionnaires, interviews, observation."],
        ["The four Ps of the marketing mix are…", ["Product, price, place, promotion", "Product, profit, place, people", "Price, profit, promotion, people", "Plan, price, place, promotion"], 0, "The core marketing mix."],
        ["Setting a low price to enter a market and gain share is…", ["Penetration pricing", "Price skimming", "Cost-plus pricing", "Premium pricing"], 0, "Skimming is a high price for a new, unique product."],
        ["Market segmentation means…", ["Dividing a market into groups of customers with similar needs", "Selling to everyone the same way", "Reducing prices", "Opening new shops"], 0, "Segments may be by age, income, location, lifestyle…"],
        ["Why do governments have laws on marketing?", ["To protect consumers from misleading practices", "To raise prices", "To stop all advertising", "To help one business"], 0, "E.g. laws against false descriptions and unsafe products."]] },
      { n: "4", t: "Operations management", parts: ["4.1 Production of goods and services", "4.2 Technology and production of goods and services", "4.3 Sustainable production of goods and services", "4.4 Costs, scale of production and break-even analysis", "4.5 Quality of goods and services", "4.6 Location decisions"], q: [
        ["Fixed costs $12 000, price $10, variable cost $6 per unit. Break-even output?", ["3 000 units", "1 200 units", "2 000 units", "1 500 units"], 0, "Contribution per unit = 4; 12 000 ÷ 4 = 3 000."],
        ["Job production means…", ["Making one-off products to order", "Making identical products continuously", "Making products in groups", "Outsourcing"], 0, "E.g. wedding dresses, bridges."],
        ["Lean production aims to…", ["Reduce waste", "Increase inventory", "Increase prices", "Hire more workers"], 0, "Techniques include JIT and kaizen."],
        ["Margin of safety is…", ["Actual output − break-even output", "Fixed costs ÷ contribution", "Revenue − profit", "Price − variable cost"], 0, "How far sales can fall before a loss."],
        ["Which is an example of an economy of scale?", ["Bulk-buying discounts", "Poor communication", "Low motivation", "Slow decision-making"], 0, "The others are diseconomies of scale."]] },
      { n: "5", t: "Financial information and decisions", parts: ["5.1 Business finance", "5.2 Cash flow forecast", "5.3 Profit and loss", "5.4 Statement of financial position", "5.5 Analysis of accounts"], q: [
        ["Which is an internal source of finance?", ["Retained profit", "Bank loan", "Overdraft", "Share issue"], 0, "Money already inside the business."],
        ["A cash-flow forecast shows…", ["Expected cash inflows and outflows over a period", "Profit for the year", "Assets and liabilities", "Share prices"], 0, "It helps predict cash shortages."],
        ["Net cash flow = ", ["Cash inflows − cash outflows", "Revenue − costs", "Assets − liabilities", "Opening balance + inflows"], 0, "Closing balance = opening balance + net cash flow."],
        ["Gross profit margin = ", ["Gross profit ÷ revenue × 100", "Revenue ÷ gross profit", "Profit ÷ capital", "Current assets ÷ current liabilities"], 0, "Shows profit made on each $ of sales before expenses."],
        ["Why is cash important to a business even if it is profitable?", ["It needs cash to pay suppliers and wages on time", "Profit is the same as cash", "Cash has no use", "Only for taxes"], 0, "Profitable businesses can fail from lack of liquidity."]] },
      { n: "6", t: "External influences on business activity", parts: ["6.1 Economic issues", "6.2 Business and the international economy", "6.3 Business and the environment", "6.4 Business and ethical issues", "6.5 Pressure groups"], q: [
        ["Higher interest rates usually…", ["Increase the cost of borrowing for businesses", "Increase consumer spending", "Reduce loan repayments", "Have no effect"], 0, "Borrowing is dearer, and spending on credit falls."],
        ["A multinational company…", ["Has operations in more than one country", "Only exports", "Is owned by the government", "Has one shop"], 0, "It produces or provides services in several countries."],
        ["An appreciation of the exchange rate makes exports…", ["More expensive abroad", "Cheaper abroad", "Unaffected", "Illegal"], 0, "SPICED: Strong Pound Imports Cheaper Exports Dearer."],
        ["A pressure group…", ["Tries to change business decisions, e.g. through campaigns or boycotts", "Is a government department", "Is a type of business", "Owns shares only"], 0, "E.g. environmental groups."],
        ["Which is an external cost of production?", ["Pollution from a factory affecting residents", "Wages", "Raw materials", "Rent"], 0, "Costs paid by third parties, not the business."]] }
    ]
  },
  {
    slug: "o-economics", code: "2281", title: "O Level Economics", tier: "O", color: "#3b82f6", icon: "trending-up",
    exam_label: "Cambridge O Level Economics 2281 · Nov 2027",
    description: "Revised syllabus for 2027. Paper 1: 40 MCQs (1h). Paper 2: one compulsory question + three from four (2h).",
    chapters: [
      { n: "1", t: "The basic economic problem", parts: ["1.1 The nature of the basic economic problem", "1.2 Factors of production", "1.3 Opportunity cost", "1.4 Production possibility curve (PPC) diagrams"], q: [
        ["The basic economic problem is…", ["Finite resources and unlimited wants", "Too much money", "Unemployment only", "Inflation only"], 0, "This scarcity forces choices."],
        ["Opportunity cost is…", ["The next best alternative given up", "The money price of a good", "The total cost of production", "The cost of labour"], 0, "Every choice has an opportunity cost."],
        ["Which is a factor of production?", ["Enterprise", "Money", "Shares", "Profit"], 0, "Land, labour, capital and enterprise."],
        ["A point inside a PPC shows…", ["Unemployed or inefficiently used resources", "Maximum efficiency", "Unattainable output", "Economic growth"], 0, "Output could rise without giving anything up."],
        ["An outward shift of a PPC shows…", ["Economic growth", "A recession", "Higher unemployment", "Inflation"], 0, "More resources or better technology."]] },
      { n: "2", t: "The allocation of resources", parts: ["2.1 The role of markets in allocating resources", "2.2 Demand", "2.3 Supply", "2.4 Price determination", "2.5 Price changes", "2.6 Price elasticity of demand (PED)", "2.7 Price elasticity of supply (PES)", "2.8 Market economic system", "2.9 Market failure", "2.10 Mixed economic system"], q: [
        ["A rise in the price of a good causes…", ["A contraction (movement along) in demand", "A shift of the demand curve right", "A shift left", "No change in quantity"], 0, "Price changes move along the curve; other factors shift it."],
        ["Price rises 10% and quantity demanded falls 20%. PED is…", ["−2 (elastic)", "−0.5 (inelastic)", "−1", "−20"], 0, "−20 ÷ 10 = −2."],
        ["At a price above equilibrium there is…", ["Excess supply", "Excess demand", "A shortage", "Equilibrium"], 0, "Quantity supplied exceeds quantity demanded."],
        ["A merit good is…", ["Under-consumed if left to the market", "Over-consumed", "Free to everyone", "Always provided by firms"], 0, "E.g. education, healthcare."],
        ["Which would shift supply to the right?", ["A fall in production costs", "A rise in the good's price", "A tax on the good", "Higher wages"], 0, "Lower costs let firms supply more at every price."]] },
      { n: "3", t: "Microeconomic decision-makers", parts: ["3.1 Money and banking", "3.2 Households", "3.3 Workers", "3.4 Firms", "3.5 Firms and production", "3.6 Firms' costs, revenue and objectives", "3.7 Types of markets"], q: [
        ["Which is a function of money?", ["Medium of exchange", "Factor of production", "Source of labour", "Type of tax"], 0, "Also store of value, unit of account, standard of deferred payment."],
        ["Total cost =", ["Fixed cost + variable cost", "Price × quantity", "Revenue − profit", "Average cost × price"], 0, "Average cost = total cost ÷ output."],
        ["A monopoly is…", ["A market with a single supplier", "A market with many small firms", "A government department", "A type of tax"], 0, "There are high barriers to entry."],
        ["Division of labour means…", ["Workers specialise in particular tasks", "Workers do every task", "Workers share wages", "Fewer workers"], 0, "Raises productivity but can be boring."],
        ["Saving is more likely when…", ["Interest rates rise", "Interest rates fall", "Incomes fall sharply", "Prices fall"], 0, "A higher reward for saving."]] },
      { n: "4", t: "Government and the macroeconomy", parts: ["4.1 Government macroeconomic intervention", "4.2 Fiscal policy", "4.3 Monetary policy", "4.4 Supply-side policy", "4.5 Economic growth", "4.6 Employment and unemployment", "4.7 Inflation"], q: [
        ["Changing government spending and taxation is…", ["Fiscal policy", "Monetary policy", "Supply-side policy", "Exchange rate policy"], 0, "Monetary policy uses interest rates and the money supply."],
        ["Inflation is…", ["A sustained rise in the general price level", "A fall in prices", "A rise in one price", "Rising unemployment"], 0, "Often measured by the consumer prices index."],
        ["Which is a supply-side policy?", ["Improving education and training", "Raising interest rates", "Cutting government spending to reduce demand", "Printing money"], 0, "It aims to raise the productive capacity of the economy."],
        ["Cyclical unemployment is caused by…", ["A fall in demand in a recession", "Changing jobs", "Seasonal work", "Changes in technology"], 0, "Demand-deficient unemployment."],
        ["Economic growth is measured by a rise in…", ["Real GDP", "Prices", "Exports only", "Population"], 0, "Real GDP removes the effect of inflation."]] },
      { n: "5", t: "Economic development", parts: ["5.1 Living standards", "5.2 Poverty", "5.3 Population", "5.4 Differences in economic development between countries"], q: [
        ["The Human Development Index (HDI) combines…", ["Income, education and life expectancy", "Exports and imports", "Population and land", "Inflation and unemployment"], 0, "It's a wider measure of living standards than GDP."],
        ["Absolute poverty means…", ["Being unable to afford basic needs", "Earning less than average", "Having no job", "Living in a city"], 0, "Relative poverty compares with others in the society."],
        ["Which raises population growth?", ["A fall in the death rate", "A fall in the birth rate", "Net emigration", "Higher death rate"], 0, "Natural increase = birth rate − death rate."],
        ["Real GDP per head is…", ["Real GDP ÷ population", "GDP × population", "Nominal GDP ÷ prices", "Exports ÷ population"], 0, "Used to compare living standards."],
        ["A reason for differences in development between countries is…", ["Differences in productivity and education", "Different flags", "Different time zones", "Different languages only"], 0, "Also investment, healthcare, infrastructure."]] },
      { n: "6", t: "International trade and globalisation", parts: ["6.1 Specialisation and free trade", "6.2 Globalisation and trade restrictions", "6.3 Foreign exchange rates", "6.4 Current account of the balance of payments"], q: [
        ["A tariff is…", ["A tax on imports", "A limit on the quantity of imports", "A subsidy to exporters", "A ban on exports"], 0, "A quota limits quantity."],
        ["A depreciation of a currency makes imports…", ["More expensive", "Cheaper", "Unchanged", "Free"], 0, "More home currency is needed to buy foreign goods."],
        ["Which is in the current account?", ["Trade in goods", "Purchase of foreign shares", "Foreign direct investment", "Government loans"], 0, "Trade in goods and services, primary and secondary income."],
        ["An argument for free trade is…", ["More choice and lower prices for consumers", "Protecting infant industries", "Avoiding dumping", "Protecting jobs in declining industries"], 0, "The others are arguments for protection."],
        ["Globalisation means…", ["Increasing integration of the world's economies", "Fewer imports", "Only local trade", "Higher tariffs"], 0, "Driven by trade, technology and investment."]] }
    ]
  },
  {
    slug: "o-computer-science", code: "2210", title: "O Level Computer Science", tier: "O", color: "#a855f7", icon: "cpu",
    exam_label: "Cambridge O Level Computer Science 2210 · Nov 2027",
    description: "Paper 1: Computer Systems (topics 1–6). Paper 2: Algorithms, Programming and Logic (topics 7–10). No calculators.",
    chapters: [
      { n: "1", t: "Data representation", parts: ["1.1 Number systems", "1.2 Text, sound and images", "1.3 Data storage and compression"], q: [
        ["What is denary 45 in 8-bit binary?", ["00101101", "00110101", "00101011", "01001101"], 0, "32 + 8 + 4 + 1 = 45."],
        ["What is binary 1111 1010 in hexadecimal?", ["FA", "AF", "F9", "EA"], 0, "1111 = F, 1010 = A."],
        ["How many bytes are in 1 KiB?", ["1024", "1000", "8", "512"], 0, "Binary prefix: 2¹⁰."],
        ["Increasing colour depth will…", ["Increase file size and number of colours", "Reduce file size", "Reduce quality", "Change resolution"], 0, "More bits per pixel."],
        ["Which compression is lossless?", ["Run-length encoding", "JPEG", "MP3", "Reducing resolution"], 0, "The original can be restored exactly."]] },
      { n: "2", t: "Data transmission", parts: ["2.1 Types and methods of data transmission", "2.2 Methods of error detection", "2.3 Encryption"], q: [
        ["Serial transmission sends…", ["One bit at a time over a single wire", "Several bits at once over several wires", "Only analogue data", "Only in one direction"], 0, "Parallel sends several bits simultaneously."],
        ["Half-duplex means data travels…", ["In both directions but not at the same time", "In one direction only", "In both directions at the same time", "Only wirelessly"], 0, "E.g. walkie-talkies."],
        ["Which is an error-detection method?", ["Checksum", "Encryption", "Compression", "Packet switching"], 0, "Also parity check, echo check, check digit, ARQ."],
        ["Asymmetric encryption uses…", ["A public key and a private key", "One shared key", "No keys", "Only passwords"], 0, "Encrypt with the public key, decrypt with the private key."],
        ["In packet switching each packet has…", ["A header with the destination address and packet number", "The full message", "No address", "Only the payload"], 0, "Packets may take different routes and are reassembled."]] },
      { n: "3", t: "Hardware", parts: ["3.1 Computer architecture", "3.2 Input and output devices", "3.3 Data storage", "3.4 Network hardware"], q: [
        ["Which register holds the address of the next instruction?", ["Program counter (PC)", "MDR", "Accumulator", "CIR"], 0, "PC is incremented during the fetch stage."],
        ["Which storage has no moving parts?", ["Solid state drive", "Hard disk drive", "DVD", "Magnetic tape"], 0, "SSDs use flash memory."],
        ["A MAC address…", ["Uniquely identifies a device's network interface", "Changes every time you connect", "Is the website address", "Is assigned by DNS"], 0, "Set by the manufacturer, 48 bits."],
        ["RAM is…", ["Volatile", "Non-volatile", "Read-only", "Secondary storage"], 0, "Contents are lost when power is off."],
        ["Which is an input device?", ["Microphone", "Speaker", "Actuator", "Printer"], 0, "It captures sound."]] },
      { n: "4", t: "Software", parts: ["4.1 Types of software and interrupts", "4.2 Types of programming language, translators and integrated development environments (IDEs)"], q: [
        ["A compiler…", ["Translates the whole program before it runs", "Translates line by line", "Runs assembly code", "Is an operating system"], 0, "An interpreter translates line by line."],
        ["An interrupt is…", ["A signal asking the processor for attention", "A virus", "A type of memory", "A compiler error"], 0, "E.g. a key press or a printer out of paper."],
        ["Which is system software?", ["Operating system", "Word processor", "Spreadsheet", "Web browser"], 0, "It manages hardware and provides a platform for applications."],
        ["A high-level language is…", ["Easier for humans to read and portable", "Machine code", "Only for one processor", "Binary"], 0, "It must be translated before running."],
        ["An IDE feature that shows errors as you type is…", ["Error diagnostics", "Run-time environment", "Translator", "Auto-documenter"], 0, "Others: code editor, auto-completion, auto-correction, prettyprint."]] },
      { n: "5", t: "The internet and its uses", parts: ["5.1 The internet and the world wide web", "5.2 Digital currency", "5.3 Cyber security"], q: [
        ["The internet is…", ["A global network of networks", "A collection of web pages", "A browser", "A search engine"], 0, "The WWW is the pages accessed over it."],
        ["Phishing is…", ["Fake emails that trick users into giving personal data", "Redirecting to a fake website by malicious code", "Overloading a server", "Recording keystrokes"], 0, "Pharming redirects via code on the computer or DNS."],
        ["Blockchain is used in…", ["Digital currencies like Bitcoin", "Email", "Compression", "Printers"], 0, "A decentralised digital ledger of transactions."],
        ["A DNS server…", ["Translates a domain name into an IP address", "Stores web pages", "Encrypts data", "Blocks viruses"], 0, "Domain name server."],
        ["A firewall…", ["Monitors and filters traffic between networks", "Speeds up the internet", "Is a type of virus", "Stores passwords"], 0, "It blocks unauthorised access."]] },
      { n: "6", t: "Automated and emerging technologies", parts: ["6.1 Automated systems", "6.2 Robotics", "6.3 Artificial intelligence"], q: [
        ["An automated system uses…", ["Sensors, a microprocessor and actuators", "Only a keyboard", "Only humans", "No input"], 0, "Sensors → microprocessor → actuators."],
        ["A characteristic of a robot is…", ["It has a mechanical structure", "It never needs programming", "It cannot move", "It is always humanoid"], 0, "Robots have a mechanical structure, electrical components and are programmable."],
        ["Machine learning means…", ["A program that improves its performance from data without being explicitly reprogrammed", "A robot with wheels", "Any spreadsheet", "Manual coding of every rule"], 0, "AI can learn and adapt."],
        ["An expert system includes…", ["A knowledge base, rule base and inference engine", "Only a printer", "Only sensors", "A compiler"], 0, "Also a user interface."],
        ["A disadvantage of automated systems is…", ["High set-up cost", "They never break", "They are always cheap", "They need no maintenance"], 0, "They are expensive to set up and maintain."]] },
      { n: "7", t: "Algorithm design and problem-solving", parts: ["7 Algorithm design and problem-solving"], q: [
        ["Decomposition means…", ["Breaking a problem into smaller sub-problems", "Removing unnecessary detail", "Testing a program", "Translating code"], 0, "Abstraction removes unnecessary detail."],
        ["Which test data is just outside a valid range of 1–100?", ["101", "50", "100", "1"], 0, "Boundary data includes values just inside and just outside."],
        ["A linear search…", ["Checks each item in turn", "Splits the list in half", "Sorts the list", "Only works on numbers"], 0, "Simple but slow for large lists."],
        ["The flowchart symbol for a decision is a…", ["Diamond", "Rectangle", "Parallelogram", "Oval"], 0, "Rectangle = process, parallelogram = input/output."],
        ["A trace table is used to…", ["Record variable values as an algorithm is dry-run", "Draw flowcharts", "Store data", "Compile code"], 0, "It helps find logic errors."]] },
      { n: "8", t: "Programming", parts: ["8.1 Programming concepts", "8.2 Arrays", "8.3 File handling"], q: [
        ["Which loop always runs at least once?", ["REPEAT … UNTIL", "WHILE … DO … ENDWHILE", "FOR … TO … NEXT", "IF … THEN"], 0, "The condition is checked at the end."],
        ["17 MOD 5 =", ["2", "3", "3.4", "12"], 0, "The remainder."],
        ["An array is…", ["A data structure holding many items of the same type under one name", "A single variable", "A loop", "A file"], 0, "Accessed with an index."],
        ["Why store data in a file?", ["So it is kept after the program stops", "To make the program run faster", "To avoid variables", "To encrypt it"], 0, "Files store data permanently."],
        ["A procedure differs from a function because a function…", ["Returns a value", "Cannot have parameters", "Cannot be called", "Has no name"], 0, "Functions return a value."]] },
      { n: "9", t: "Databases", parts: ["9 Databases"], q: [
        ["A primary key…", ["Uniquely identifies each record", "Can be repeated", "Is always a name", "Is a type of table"], 0, "No two records can share it."],
        ["Which SQL keyword chooses the fields to display?", ["SELECT", "FROM", "WHERE", "ORDER BY"], 0, "FROM names the table, WHERE filters records."],
        ["A record is…", ["One row in a table", "One column", "The whole database", "A query"], 0, "A field is one column."],
        ["Which data type is best for a phone number like 0570123456?", ["Text/alphanumeric", "Integer", "Boolean", "Real"], 0, "A leading zero would be lost in an integer, and no calculations are done on it."],
        ["Which SQL counts the records that match?", ["COUNT", "SUM", "ORDER BY", "FROM"], 0, "SUM adds up values in a field."]] },
      { n: "10", t: "Boolean logic", parts: ["10 Boolean logic"], q: [
        ["The output of an AND gate is 1 when…", ["Both inputs are 1", "Either input is 1", "Both inputs are 0", "The inputs are different"], 0, "AND requires all inputs to be 1."],
        ["XOR outputs 1 when…", ["The inputs are different", "Both are 1", "Both are 0", "Any input is 1"], 0, "Exclusive OR."],
        ["NOR outputs 1 when…", ["Both inputs are 0", "Both inputs are 1", "One input is 1", "Always"], 0, "NOT OR."],
        ["How many rows does a truth table with 3 inputs have?", ["8", "6", "3", "9"], 0, "2³ = 8."],
        ["NOT (A AND B) is the same as which single gate?", ["NAND", "NOR", "XOR", "OR"], 0, "NAND = NOT AND."]] }
    ]
  }
];

export const ACHIEVEMENTS = [
  { code: "first_quiz", title: "First Steps", description: "Pass your first quiz", icon: "footprints", rarity: "common", xp: 25, criteria: { type: "quizzes_passed", value: 1 } },
  { code: "quiz_master", title: "Quiz Master", description: "Pass 10 different quizzes", icon: "brain", rarity: "rare", xp: 150, criteria: { type: "quizzes_passed", value: 10 } },
  { code: "perfect_score", title: "Perfect Score", description: "Get 100% on a quiz", icon: "target", rarity: "rare", xp: 75, criteria: { type: "perfect_quiz", value: 1 } },
  { code: "perfectionist", title: "Perfectionist", description: "Get 100% on 10 quizzes", icon: "gem", rarity: "epic", xp: 250, criteria: { type: "perfect_quiz", value: 10 } },
  { code: "streak_3", title: "Warming Up", description: "Study 3 days in a row", icon: "flame", rarity: "common", xp: 30, criteria: { type: "streak", value: 3 } },
  { code: "streak_7", title: "7 Day Streak", description: "Study 7 days in a row", icon: "flame", rarity: "rare", xp: 100, criteria: { type: "streak", value: 7 } },
  { code: "streak_30", title: "Unstoppable", description: "Study 30 days in a row", icon: "zap", rarity: "legendary", xp: 500, criteria: { type: "streak", value: 30 } },
  { code: "homework_hero", title: "Homework Hero", description: "Submit 10 pieces of homework", icon: "notebook-pen", rarity: "rare", xp: 150, criteria: { type: "homework", value: 10 } },
  { code: "first_win", title: "First Blood", description: "Win your first battle", icon: "swords", rarity: "common", xp: 50, criteria: { type: "battles_won", value: 1 } },
  { code: "logic_king", title: "Logic King", description: "Win 10 battles", icon: "crown", rarity: "epic", xp: 300, criteria: { type: "battles_won", value: 10 } },
  { code: "regular", title: "Regular", description: "Attend 10 classes", icon: "calendar-check", rarity: "rare", xp: 120, criteria: { type: "attendance", value: 10 } },
  { code: "speed_demon", title: "Speed Demon", description: "Score 1 000+ points in a speedrun", icon: "timer", rarity: "epic", xp: 200, criteria: { type: "speedrun_points", value: 1000 } },
  { code: "level_5", title: "Rising Star", description: "Reach level 5", icon: "star", rarity: "common", xp: 50, criteria: { type: "level", value: 5 } },
  { code: "level_10", title: "Veteran", description: "Reach level 10", icon: "shield", rarity: "epic", xp: 200, criteria: { type: "level", value: 10 } },
  { code: "level_20", title: "Legend", description: "Reach level 20", icon: "trophy", rarity: "legendary", xp: 500, criteria: { type: "level", value: 20 } }
];

export const CHALLENGES = [
  { title: "Daily quiz", description: "Pass any quiz today", period: "daily", type: "quiz_pass", target: 1, xp: 50, coins: 5 },
  { title: "Grind 150 XP", description: "Earn 150 XP today", period: "daily", type: "xp_earned", target: 150, xp: 40, coins: 5 },
  { title: "Battle ready", description: "Play a battle today", period: "daily", type: "battle_play", target: 1, xp: 30, coins: 5 },
  { title: "Study 5 days", description: "Study on 5 different days this week", period: "weekly", type: "study_days", target: 5, xp: 200, coins: 25 },
  { title: "Pass 3 quizzes", description: "Pass 3 quizzes this week", period: "weekly", type: "quiz_pass", target: 3, xp: 150, coins: 20 },
  { title: "Homework on time", description: "Hand in 2 pieces of homework on time this week", period: "weekly", type: "homework_on_time", target: 2, xp: 150, coins: 20 },
  { title: "Win 3 battles", description: "Win 3 battles this week", period: "weekly", type: "battle_win", target: 3, xp: 150, coins: 20 }
];
