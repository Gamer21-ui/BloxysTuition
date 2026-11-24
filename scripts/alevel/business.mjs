// Cambridge International AS & A Level Business 9609 (syllabus for 2026–2028).
// AS = topics 1–5 (Papers 1 & 2), A Level = topics 6–10 (Papers 3 & 4, AS assumed).
// Questions: [prompt, options, correctIndex, explanation] with the correct answer first (shuffled at build time).

const AS = {
  slug: "as-business", code: "9609", title: "AS Level Business", tier: "AS", color: "#f59e0b", icon: "briefcase",
  exam_label: "Cambridge International AS Level Business 9609 · Nov 2027",
  description: "Topics 1–5. Paper 1: short answers + one essay (1h15). Paper 2: two data response questions (1h30).",
  chapters: [
    { n: "1", t: "Business and its environment",
      parts: ["1.1 Enterprise", "1.2 Business structure", "1.3 Size of business", "1.4 Business objectives", "1.5 Stakeholders in a business"],
      q: [
        ["Which is a key quality of a successful entrepreneur?", ["Willingness to take risks", "Avoiding all change", "Needing constant supervision", "Low self-confidence"], 0, "Entrepreneurs combine resources and accept risk in pursuit of profit."],
        ["Which business is in the tertiary sector?", ["A bank", "A gold mine", "A car factory", "A fishing company"], 0, "The tertiary sector provides services."],
        ["A key feature of a private limited company is…", ["Limited liability for shareholders", "Shares sold on the stock exchange", "Unlimited liability", "Only one owner allowed"], 0, "Shareholders can only lose the amount they invested."],
        ["A social enterprise aims to…", ["Achieve social or environmental objectives as well as financial ones", "Maximise profit only", "Be owned by the government", "Avoid paying any tax"], 0, "Social enterprises have a triple bottom line: profit, people, planet."],
        ["Which is a measure of business size?", ["Number of employees", "Owner's age", "Number of competitors", "Interest rate"], 0, "Others include revenue, capital employed and market share."],
        ["A SMART objective must be…", ["Specific, measurable, achievable, relevant and time-bound", "Simple and cheap", "Set by the government", "Profit-based only"], 0, "SMART objectives make progress easy to measure."],
        ["Corporate social responsibility (CSR) means…", ["A business considering its impact on society and the environment", "Paying the lowest wages possible", "Following only shareholder wishes", "Avoiding taxes legally"], 0, "CSR goes beyond legal obligations."],
        ["Which is an example of conflict between stakeholders?", ["Shareholders want higher dividends while workers want higher wages", "Customers and managers both want quality", "Suppliers want to be paid on time", "The government wants tax paid"], 0, "Both demands compete for the same profits."]],
      notes: [
`## What is enterprise?
**Enterprise** is the willingness and ability to start and run a business, taking **risks** to make a profit.

## Role of the entrepreneur
- Spots an opportunity
- Combines the factors of production
- Takes risks
- Makes key decisions

## Qualities
Initiative, creativity, resilience, risk-taking, self-confidence, hard work.

## Business and the economy
Businesses create **added value** (selling price − cost of bought-in materials), employment, innovation, competition and tax revenue.

## Problems for new businesses
Lack of finance, weak market research, poor cash flow, competition, lack of experience.

> Exam tip: link the importance of enterprise to a country's economic development.`,
`## Economic sectors
Primary (extraction), secondary (manufacturing), tertiary (services), quaternary (knowledge, IT).

## Public vs private sector
- **Private**: owned by individuals, usually profit-driven
- **Public**: owned by government, provides services

## Legal structures
| Type | Liability | Key points |
|---|---|---|
| **Sole trader** | Unlimited | Full control, keeps profit, hard to raise finance |
| **Partnership** | Usually unlimited | Shared skills and capital, possible disagreements |
| **Private limited company (Ltd)** | Limited | Shares not on stock exchange |
| **Public limited company (plc)** | Limited | Shares on stock exchange, more finance, risk of takeover |
| **Franchise** | Varies | Proven model, royalties |
| **Cooperative** | Limited | Owned by members |
| **Social enterprise** | Varies | Social aims |

> Exam tip: recommend a structure that suits the business's size and goals, and justify it.`,
`## Measuring size
Number of employees, revenue, capital employed, market share. Each has limitations (e.g. capital-intensive firms employ few people).

## Small businesses
**Advantages**: flexibility, personal service, niche markets, quick decisions.
**Importance**: jobs, innovation, competition, supply larger firms.

## Growth
- **Internal (organic)**: new products, markets, reinvesting profit
- **External**: mergers and takeovers

## Types of integration
| Type | Example |
|---|---|
| Horizontal | Two banks merge |
| Vertical backward | Restaurant buys a farm |
| Vertical forward | Factory buys shops |
| Conglomerate | Phone maker buys a hotel |

## Joint ventures and strategic alliances
Sharing risks and resources without full merger.

> Exam tip: mergers often fail because of culture clashes.`,
`## Objectives
Survival, profit maximisation, growth, market share, social/ethical objectives, increasing shareholder value.

## SMART objectives
**S**pecific, **M**easurable, **A**chievable, **R**elevant, **T**ime-bound.

## Hierarchy
Mission statement → corporate objectives → departmental objectives → individual targets.

## Mission and vision
- **Mission**: purpose now
- **Vision**: where the business wants to be

## Ethics and CSR
Ethical decisions may raise costs in the short run but improve reputation and loyalty.

## Changing objectives
Objectives change with the business life cycle, competition and economic conditions.

> Exam tip: link objectives to the type and stage of the business.`,
`## Stakeholders
Anyone affected by or with an interest in the business: owners, employees, customers, suppliers, lenders, government, local community.

## Roles, rights and responsibilities
- **Employees**: want fair pay and security; must work responsibly
- **Customers**: want value and quality
- **Government**: wants tax and law-abiding behaviour

## Stakeholder conflict
- Shareholders want profit; workers want pay rises
- Community wants less pollution; managers want expansion

## Stakeholder mapping (Mendelow)
Power vs interest: manage closely, keep satisfied, keep informed, monitor.

> Exam tip: identify *which* stakeholders are affected and how much power they have.`]
    },
    { n: "2", t: "Human resource management",
      parts: ["2.1 Human resource management", "2.2 Motivation", "2.3 Management"],
      q: [
        ["Labour turnover measures…", ["The percentage of staff leaving a business in a year", "Hours worked per week", "Output per worker", "Wage costs per unit"], 0, "Labour turnover = leavers ÷ average number employed × 100."],
        ["Which is an advantage of internal recruitment?", ["The candidate already knows the business", "It brings in new ideas", "It fills two vacancies", "It always costs more"], 0, "It is cheaper and quicker, and the person knows the culture."],
        ["Maslow's hierarchy places which need at the top?", ["Self-actualisation", "Safety", "Physiological", "Social"], 0, "Self-actualisation means reaching one's full potential."],
        ["Herzberg's hygiene factors include…", ["Pay and working conditions", "Recognition", "Achievement", "Responsibility"], 0, "Hygiene factors prevent dissatisfaction but don't motivate on their own."],
        ["Taylor's scientific management assumes workers are motivated mainly by…", ["Money", "Recognition", "Social needs", "Self-fulfilment"], 0, "Taylor advocated piece rates and closely supervised work."],
        ["Job enrichment involves…", ["Giving workers more challenging, responsible tasks", "Adding more tasks of the same level", "Rotating between jobs", "Cutting pay"], 0, "It provides vertical loading of the job."],
        ["Which is a function of management according to Fayol?", ["Planning", "Selling", "Producing", "Investing"], 0, "Fayol's functions: plan, organise, command, coordinate and control."],
        ["Mintzberg's managerial roles are grouped as…", ["Interpersonal, informational and decisional", "Financial, marketing and operations", "Autocratic, democratic and laissez-faire", "Planning, controlling and leading"], 0, "Managers act as figureheads, monitors, negotiators and more."]],
      notes: [
`## Purpose of HRM
Making sure the business has the **right number** of workers with the **right skills** at the right time and cost.

## Workforce planning
Forecasting the number and skills of workers needed.

## Recruitment and selection
- **Job description**: duties of the job
- **Person specification**: qualities needed
- **Internal**: cheaper, motivating, but no new ideas
- **External**: wider pool, fresh ideas, but costly

## Training
Induction, on-the-job, off-the-job.

## Contracts
Full-time, part-time, temporary, zero-hours, flexible working.

## Key measures
- **Labour turnover** = leavers ÷ average staff × 100
- **Absenteeism**, labour productivity

## Dismissal vs redundancy
Dismissal is for misconduct or capability; redundancy is when the job is no longer needed.

> Exam tip: high labour turnover raises recruitment and training costs.`,
`## Why motivation matters
Higher productivity, lower absenteeism and labour turnover, better quality.

## Theories
| Theorist | Key idea |
|---|---|
| **Taylor** | Money motivates; break jobs into simple tasks |
| **Mayo** | Social needs and attention (Hawthorne effect) |
| **Maslow** | Hierarchy of needs |
| **Herzberg** | Hygiene factors vs motivators |
| **McClelland** | Achievement, affiliation, power |
| **Vroom** | Expectancy: effort → performance → reward |

## Financial methods
Piece rate, commission, bonus, profit sharing, performance-related pay.

## Non-financial methods
Job rotation, job enlargement, job enrichment, empowerment, team working, quality circles.

> Exam tip: apply a theory to the case study rather than just describing it.`,
`## Functions of management (Fayol)
Planning, organising, commanding, coordinating, controlling.

## Mintzberg's roles
- **Interpersonal**: figurehead, leader, liaison
- **Informational**: monitor, disseminator, spokesperson
- **Decisional**: entrepreneur, disturbance handler, resource allocator, negotiator

## Leadership styles
| Style | Features | Best when |
|---|---|---|
| **Autocratic** | Leader decides | Crises, unskilled staff |
| **Democratic** | Staff involved | Skilled, motivated staff |
| **Laissez-faire** | Staff decide | Highly skilled, creative teams |

## McGregor's Theory X and Y
X: workers are lazy, need control. Y: workers want responsibility.

> Exam tip: there's no single best style; it depends on the task and workers.`]
    },
    { n: "3", t: "Marketing",
      parts: ["3.1 The nature of marketing", "3.2 Market research", "3.3 The marketing mix"],
      q: [
        ["Market share is calculated as…", ["Firm's sales ÷ total market sales × 100", "Total market sales ÷ firm's sales", "Profit ÷ revenue × 100", "Market growth ÷ firm's sales"], 0, "It shows the firm's share of total market sales."],
        ["Which is an example of primary research?", ["A questionnaire sent to customers", "Government statistics", "Newspaper articles", "Competitors' published accounts"], 0, "Primary data is collected first-hand for a specific purpose."],
        ["Quota sampling means…", ["Choosing respondents to match groups in the population", "Choosing people completely at random", "Asking anyone available", "Sampling only existing customers"], 0, "Each group (e.g. age) is represented in proportion."],
        ["Which pricing method sets a low price to gain market share quickly?", ["Penetration pricing", "Price skimming", "Cost-plus pricing", "Premium pricing"], 0, "Penetration pricing builds market share before raising prices."],
        ["The product life cycle stage with the highest sales is usually…", ["Maturity", "Introduction", "Growth", "Decline"], 0, "Sales peak at maturity, then start to fall."],
        ["A business focusing on a small, specialised segment uses…", ["Niche marketing", "Mass marketing", "Penetration pricing", "Above-the-line promotion"], 0, "Niche marketing targets a specific group."],
        ["Which is above-the-line promotion?", ["A TV advertisement", "A free sample", "A loyalty card", "A trade fair"], 0, "Above-the-line uses mass media."],
        ["Price elasticity of demand of −0.4 means…", ["Demand is price inelastic", "Demand is price elastic", "Demand is unitary", "Demand is perfectly elastic"], 0, "Quantity changes by less than the price change in percentage terms."]],
      notes: [
`## Marketing
Identifying, anticipating and satisfying customer needs **profitably**.

## Markets
- **Consumer vs industrial** markets
- **Mass vs niche** marketing
- **Market size**, **growth**, **share**: Market share = firm's sales ÷ total market sales × 100

## Market orientation vs product orientation
- **Market-oriented**: starts with customer research
- **Product-oriented**: starts with the product

## Segmentation
Dividing the market by age, income, gender, location, lifestyle.

## Customer relationship marketing (CRM)
Building long-term loyalty.

## Demand and supply
Price affects sales; elasticity (PED, YED) helps marketing decisions.
**PED = %Δ quantity demanded ÷ %Δ price**

> Exam tip: use PED to explain whether a price change will raise revenue.`,
`## Purpose of market research
Reducing risk by understanding customers, competitors and trends.

## Primary research
Questionnaires, interviews, focus groups, observation, test marketing.
**Pros**: up to date, specific. **Cons**: costly, slow.

## Secondary research
Government data, reports, internet, trade journals.
**Pros**: cheap, quick. **Cons**: may be out of date or not specific.

## Sampling methods
| Method | How |
|---|---|
| **Random** | Everyone equally likely to be chosen |
| **Quota** | Fixed numbers from each group |
| **Stratified** | Random within each group |
| **Cluster** | Chosen areas |
| **Convenience** | Whoever is available |

## Quantitative vs qualitative
Numbers vs opinions and reasons.

## Analysing data
Mean, median, mode, range; correlation; reliability depends on sample size and bias.

> Exam tip: discuss the reliability and cost of research methods.`,
`## The 4Ps (and 7Ps for services)
Product, Price, Promotion, Place (+ People, Process, Physical evidence).

## Product
Product life cycle: introduction → growth → maturity → decline. **Extension strategies**: new markets, new features, rebranding.

## Price
| Method | When |
|---|---|
| Cost-plus | Simple, ensures profit |
| Penetration | Entering a market |
| Skimming | New, innovative products |
| Competitive | Many rivals |
| Psychological | $9.99 |
| Dynamic | Changes with demand |

## Promotion
Above-the-line (TV, online ads) vs below-the-line (sales promotion, PR, direct marketing). Social media and influencers.

## Place
Channels of distribution: direct, via retailer, via wholesaler, e-commerce.

## Integrated mix
All elements must fit the target market.

> Exam tip: always tie the mix to the product's stage in its life cycle.`]
    },
    { n: "4", t: "Operations management",
      parts: ["4.1 The nature of operations", "4.2 Inventory management", "4.3 Capacity utilisation and outsourcing"],
      q: [
        ["Labour productivity is…", ["Output ÷ number of workers", "Number of workers ÷ output", "Wages ÷ output", "Revenue ÷ costs"], 0, "It measures output per worker."],
        ["Job production is most suitable for…", ["Unique, custom-made products", "Mass-produced cans of drink", "Bread made in batches", "Identical cars"], 0, "Each item is made individually to order."],
        ["Flow production is best for…", ["Large quantities of standardised products", "One-off wedding cakes", "Small batches of furniture", "Bespoke suits"], 0, "Products move continuously along a production line."],
        ["Just-in-time inventory management aims to…", ["Hold minimal stock, receiving supplies only when needed", "Hold large buffer stocks", "Buy in bulk for discounts", "Avoid relationships with suppliers"], 0, "JIT cuts storage costs but depends on reliable suppliers."],
        ["The buffer inventory is…", ["The minimum stock held for emergencies", "The maximum stock level", "Stock that has expired", "Stock ordered each time"], 0, "It protects against delays or unexpected demand."],
        ["Capacity utilisation =", ["Actual output ÷ maximum possible output × 100", "Maximum output ÷ actual output", "Output ÷ workers", "Fixed costs ÷ output"], 0, "It shows how much of the potential output is used."],
        ["A benefit of high capacity utilisation is…", ["Lower average fixed costs per unit", "More time for maintenance", "Less stress on staff", "Ability to meet sudden extra orders easily"], 0, "Fixed costs are spread over more units."],
        ["Outsourcing means…", ["Using another business to carry out a function", "Hiring more employees", "Making everything in-house", "Selling the business"], 0, "It can reduce costs but loses some control over quality."]],
      notes: [
`## Operations
The transformation of **inputs** into **outputs**, adding value.

## Efficiency and productivity
- **Labour productivity** = output ÷ workers
- **Capital productivity** = output ÷ capital
Improving productivity: training, technology, motivation, better methods.

## Production methods
| Method | Features |
|---|---|
| **Job** | One-off, customised |
| **Batch** | Groups of identical items |
| **Flow** | Continuous, mass production |
| **Mass customisation** | Flow with personalised features |

## Labour- vs capital-intensive
Depends on cost of labour, technology, scale.

## Sustainability
Reducing waste, renewable energy, ethical sourcing.

> Exam tip: recommend a method that fits the demand pattern and product.`,
`## Why hold inventory?
Meet demand, avoid production stoppages, buy in bulk.

## Costs of holding inventory
Storage, insurance, opportunity cost of capital, risk of theft, waste or obsolescence.

## Inventory control chart
Shows maximum level, reorder level, buffer inventory and lead time.
- **Reorder level** = buffer + (lead time × usage rate)

## Just-in-time (JIT)
**Pros**: less storage, less waste, more working capital.
**Cons**: relies on reliable suppliers; no buffer if demand spikes; higher ordering costs.

## Just-in-case
Holding extra stock for safety.

> Exam tip: evaluate JIT in the context of the business's supply chain.`,
`## Capacity utilisation
**Capacity utilisation = actual output ÷ maximum output × 100**

## High utilisation
Lower unit fixed costs, but no room for extra orders or maintenance, staff stress.

## Low utilisation
Higher unit costs; may need to rationalise.

## Improving utilisation
Increase sales (marketing), reduce capacity (rationalise), subcontract spare capacity.

## Outsourcing
Using an external business for a function (e.g. IT, payroll, manufacturing).
**Benefits**: lower costs, specialist expertise, flexibility.
**Drawbacks**: loss of control, quality risks, reliance on supplier, ethical concerns.

> Exam tip: around 90% utilisation is often considered efficient.`]
    },
    { n: "5", t: "Finance and accounting",
      parts: ["5.1 Business finance", "5.2 Sources of finance", "5.3 Forecasting and managing cash flows", "5.4 Costs", "5.5 Budgets"],
      q: [
        ["Working capital is…", ["Current assets − current liabilities", "Non-current assets + current assets", "Profit − expenses", "Equity + loans"], 0, "It funds day-to-day running of the business."],
        ["Which is an internal source of finance?", ["Retained earnings", "Bank loan", "Share issue", "Overdraft"], 0, "Retained profits come from within the business."],
        ["An overdraft is best suited to…", ["Short-term cash flow gaps", "Buying a new factory", "Long-term expansion", "Paying dividends"], 0, "Overdrafts are flexible but expensive for long-term use."],
        ["A cash flow forecast shows…", ["Expected cash inflows and outflows over time", "Profit for the year", "Assets and liabilities", "Share prices"], 0, "It helps identify when cash shortages may happen."],
        ["Which would improve cash flow?", ["Asking customers to pay sooner", "Giving customers longer credit", "Buying more inventory", "Paying suppliers earlier"], 0, "Faster receipts bring cash in sooner."],
        ["Break-even output =", ["Fixed costs ÷ contribution per unit", "Variable costs ÷ price", "Total costs ÷ price", "Profit ÷ contribution"], 0, "Contribution per unit = price − variable cost per unit."],
        ["Price $20, variable cost $12, fixed costs $40 000. Break-even output is…", ["5 000 units", "2 000 units", "3 333 units", "8 000 units"], 0, "Contribution = $8. 40 000 ÷ 8 = 5 000."],
        ["A favourable variance occurs when…", ["Actual costs are lower than budgeted", "Actual revenue is lower than budgeted", "Actual costs are higher than budgeted", "The budget is exceeded by spending"], 0, "Lower costs or higher revenue than planned increase profit."]],
      notes: [
`## Why businesses need finance
Start-up capital, working capital, expansion, research, unexpected costs.

## Working capital
**Working capital = current assets − current liabilities**

Too little: cannot pay bills. Too much: idle resources.

## Liquidity vs profit
A profitable business can still fail if it runs out of cash.

## Insolvency
- **Bankruptcy** (individuals) / **liquidation** (companies): assets sold to pay debts
- **Administration**: attempt to rescue the business

> Exam tip: distinguish cash from profit in every finance answer.`,
`## Internal sources
Retained earnings, sale of assets, reducing working capital.

## External sources
| Source | Term | Notes |
|---|---|---|
| **Overdraft** | Short | Flexible, high interest |
| **Trade credit** | Short | Pay suppliers later |
| **Debt factoring** | Short | Sell receivables for immediate cash |
| **Bank loan** | Medium/long | Fixed repayments, interest |
| **Leasing / hire purchase** | Medium | Use assets without buying outright |
| **Share issue** | Long | No repayment, loss of control |
| **Venture capital** | Long | Finance + expertise for a share |
| **Crowdfunding** | Varies | Many small investors online |
| **Microfinance** | Short/medium | Small loans for small businesses |

## Choosing a source
Purpose, amount, cost, legal structure, control, existing debt.

> Exam tip: match the length of finance to the length of the need.`,
`## Cash flow forecasts
Expected **cash inflows**, **outflows**, **net cash flow**, **opening and closing balances**.

**Closing balance = opening balance + net cash flow**

## Uses
Plan for shortfalls, arrange overdrafts, support loan applications.

## Limitations
Based on estimates; unexpected events.

## Improving cash flow
- Faster customer payments (shorter credit, discounts)
- Delay payments to suppliers
- Debt factoring, sale and leaseback
- Reduce inventory

## Causes of cash flow problems
Overtrading, poor credit control, seasonal demand, unexpected costs.

> Exam tip: each method has a downside (e.g. delaying payments harms supplier relationships).`,
`## Types of cost
- **Fixed**: don't change with output (rent)
- **Variable**: change with output (raw materials)
- **Direct/indirect**: can or can't be linked to one product
- **Marginal cost**: cost of one more unit

## Contribution
**Contribution per unit = price − variable cost per unit**

## Break-even
**Break-even output = fixed costs ÷ contribution per unit**
**Margin of safety = actual output − break-even output**

## Break-even chart
Shows revenue, total costs, fixed costs and the break-even point.

## Limitations
Assumes all output is sold, constant prices and costs, a single product.

> Exam tip: show every step of your calculations, with units.`,
`## Budgets
Financial plans for the future, e.g. sales, cost and profit budgets.

## Purposes
Planning, coordinating, controlling, motivating, allocating resources.

## Setting budgets
- **Incremental**: based on last year plus a %
- **Zero-based**: every item justified from scratch
- **Flexible**: adjusts to the actual level of output

## Variance analysis
**Variance = actual − budgeted**
- **Favourable**: higher revenue or lower costs than budgeted
- **Adverse**: lower revenue or higher costs

## Limitations
Can be unrealistic, rigid, time-consuming; may cause short-term thinking.

> Exam tip: explain *possible causes* of variances, not just whether they're adverse.`]
    }
  ]
};

const A = {
  slug: "a-business", code: "9609", title: "A Level Business", tier: "A", color: "#f59e0b", icon: "briefcase",
  exam_label: "Cambridge International A Level Business 9609 · Nov 2028",
  description: "Topics 6–10 (AS content assumed). Paper 3: case study decision-making (1h45). Paper 4: strategy essays on a case study (1h15).",
  chapters: [
    { n: "6", t: "Business and its environment",
      parts: ["6.1 External influences on business activity", "6.2 Business strategy"],
      q: [
        ["PESTLE analysis looks at…", ["Political, economic, social, technological, legal and environmental factors", "Product, price, place and promotion", "Strengths and weaknesses only", "Profit and sales"], 0, "It helps a business understand its external environment."],
        ["A rise in interest rates is most likely to…", ["Increase costs for businesses with large loans", "Increase consumer spending", "Weaken the currency", "Reduce saving"], 0, "Borrowing becomes more expensive."],
        ["Which is a threat in SWOT analysis?", ["A new competitor entering the market", "A strong brand", "Skilled employees", "Poor cash flow"], 0, "Threats are external; strengths and weaknesses are internal."],
        ["Ansoff's matrix: selling new products in new markets is…", ["Diversification", "Market penetration", "Product development", "Market development"], 0, "It's the riskiest option."],
        ["Porter's five forces include…", ["Bargaining power of suppliers", "Interest rates", "Labour turnover", "Cash flow"], 0, "The five forces assess competitive intensity."],
        ["A business that offers the lowest prices in the industry follows which Porter generic strategy?", ["Cost leadership", "Differentiation", "Focus differentiation", "Diversification"], 0, "Cost leaders aim for the lowest costs."],
        ["Core competencies are…", ["Unique strengths that give competitive advantage", "Government regulations", "Market research methods", "Short-term objectives"], 0, "Prahalad and Hamel: hard to imitate, valuable to customers."],
        ["Which is an example of a legal influence on business?", ["Consumer protection laws", "Rising incomes", "Changing fashions", "New technology"], 0, "Laws set rules businesses must follow."]],
      notes: [
`## PESTLE
| Factor | Examples |
|---|---|
| **Political** | Stability, trade policy, government spending |
| **Economic** | Interest rates, inflation, exchange rates, unemployment, growth |
| **Social** | Demographics, lifestyles, ethics |
| **Technological** | Automation, e-commerce, AI |
| **Legal** | Employment, consumer, competition, health and safety laws |
| **Environmental** | Climate change, pollution regulations, sustainability |

## Economic influences in detail
- **Interest rates ↑**: higher borrowing costs, lower consumer spending
- **Exchange rate ↑**: exports dearer, imports cheaper
- **Inflation**: rising costs, uncertainty
- **Business cycle**: demand varies

## Globalisation and multinationals
Access to new markets, lower costs, but cultural and legal challenges.

> Exam tip: pick the 2–3 factors most relevant to the case study.`,
`## Strategic analysis
- **SWOT**: internal strengths and weaknesses, external opportunities and threats
- **PESTLE**: external environment
- **Porter's five forces**: rivalry, new entrants, substitutes, buyer power, supplier power
- **Boston Matrix**: product portfolio (stars, cash cows, question marks, dogs)

## Strategic choice
- **Ansoff's matrix**: market penetration, product development, market development, diversification
- **Porter's generic strategies**: cost leadership, differentiation, focus
- **Force-field analysis** and **decision trees**

## Strategic implementation
Planning, change management, corporate culture, project management, contingency planning, crisis management.

## Core competencies
Unique, hard-to-copy strengths.

> Exam tip: Paper 4 rewards a justified recommendation, not just analysis.`]
    },
    { n: "7", t: "Human resource management",
      parts: ["7.1 Organisational structure", "7.2 Business communication", "7.3 Leadership", "7.4 Human resource management strategy"],
      q: [
        ["A wide span of control means…", ["A manager supervises many subordinates", "There are many levels of hierarchy", "Decisions are centralised", "A manager has few subordinates"], 0, "Wide spans usually mean flatter structures."],
        ["A matrix structure organises staff…", ["By both function and project", "Only by product", "Only by region", "By seniority only"], 0, "Staff report to a functional manager and a project manager."],
        ["Delayering means…", ["Removing layers of management", "Adding more managers", "Recruiting more staff", "Centralising decisions"], 0, "It creates a flatter structure."],
        ["Which is a barrier to effective communication?", ["Too many levels of hierarchy", "Clear language", "Feedback", "Appropriate medium"], 0, "Messages can be distorted as they pass through many layers."],
        ["An emotionally intelligent leader (Goleman) has strong…", ["Self-awareness and empathy", "Technical skills only", "Autocratic control", "Financial knowledge"], 0, "Goleman's five elements include self-awareness, self-regulation, motivation, empathy and social skills."],
        ["Hard HRM treats employees as…", ["A resource to be managed efficiently", "Assets to be developed", "Owners of the business", "Customers"], 0, "Soft HRM treats them as assets to be developed."],
        ["Collective bargaining involves…", ["Negotiation between employers and trade unions", "Individual pay deals", "Government setting wages", "Workers setting their own pay"], 0, "Unions negotiate for many workers together."],
        ["Labour productivity increases if…", ["Output rises while the number of workers stays the same", "More workers produce the same output", "Wages rise", "Absenteeism rises"], 0, "Productivity = output ÷ workers."]],
      notes: [
`## Organisational structure
- **Hierarchy**: levels of authority
- **Span of control**: subordinates per manager
- **Chain of command**: line of authority

## Types
| Structure | Features |
|---|---|
| **Functional** | By department |
| **Product/regional** | By product or area |
| **Matrix** | Project teams across functions |
| **Flat** | Few levels, wide spans |
| **Tall** | Many levels, narrow spans |

## Centralisation vs decentralisation
Central control vs delegated authority.

## Delayering and delegation
Delayering cuts costs and speeds communication but may overload managers.

> Exam tip: the right structure depends on size, culture and strategy.`,
`## Communication process
Sender → message → medium → receiver → feedback.

## Methods
Face-to-face, written, electronic (email, intranet, video calls), visual.

## Barriers
Language/jargon, too many layers, poor medium, information overload, attitudes, distance and time zones.

## Formal vs informal
Official channels vs the \"grapevine\".

## Importance
Coordination, motivation, decision-making, customer relationships.

> Exam tip: link poor communication to its effects on motivation and efficiency.`,
`## Leadership theories
- **Trait theory**: leaders have certain qualities
- **Situational/contingency**: the best style depends on the situation
- **Tannenbaum–Schmidt continuum**: from boss-centred to subordinate-centred

## Emotional intelligence (Goleman)
Self-awareness, self-regulation, motivation, empathy, social skills.

## Informal leaders
Influence through respect, not position.

## Leadership vs management
Leaders set direction and inspire; managers plan and control.

> Exam tip: recommend a style based on the business's situation and workforce.`,
`## HRM strategy
Aligns HR with corporate objectives.
- **Hard HRM**: workers as a cost; short-term contracts, central control
- **Soft HRM**: workers as assets; training, empowerment, long-term

## Labour flexibility
Part-time, temporary, zero-hours contracts, home working, multi-skilling.

## Measuring performance
- Labour productivity, absenteeism, labour turnover, health and safety

## Employer–employee relations
Trade unions, collective bargaining, works councils, employee participation, conflict resolution (conciliation, arbitration).

## Management by objectives (MBO)
Agreeing targets with employees.

> Exam tip: compare hard and soft approaches with reference to the business's objectives.`]
    },
    { n: "8", t: "Marketing",
      parts: ["8.1 Marketing analysis", "8.2 Marketing strategy"],
      q: [
        ["Income elasticity of demand of +2 means the product is…", ["A luxury (income elastic)", "An inferior good", "A necessity", "Price inelastic"], 0, "Demand rises faster than income."],
        ["A moving average helps a business to…", ["Identify a trend in sales data", "Calculate profit", "Measure market share", "Set wages"], 0, "It smooths out fluctuations."],
        ["Correlation between two variables shows…", ["Whether they are related", "That one definitely causes the other", "The firm's profit", "The size of the market"], 0, "Correlation doesn't prove causation."],
        ["Which is a reason to enter international markets?", ["Saturated domestic market", "Lower transport costs", "Fewer legal differences", "No cultural differences"], 0, "Growth opportunities exist abroad."],
        ["A pan-global marketing strategy uses…", ["The same marketing mix in all countries", "A different mix for each country", "No promotion", "Only local brands"], 0, "It gains economies of scale but may ignore local needs."],
        ["A marketing plan should include…", ["Objectives, budget, strategy and the marketing mix", "Only the price", "Only competitors' plans", "The balance sheet"], 0, "It sets out how marketing objectives will be achieved."],
        ["Which is an advantage of using AI in marketing?", ["Personalised recommendations from customer data", "No need for any data", "Guaranteed sales", "Lower data protection rules"], 0, "AI can analyse large data sets to target customers."],
        ["Sales forecasts based on expert opinion are an example of…", ["Qualitative forecasting", "Moving averages", "Extrapolation", "Correlation"], 0, "They use judgement rather than numbers."]],
      notes: [
`## Elasticity of demand
| Type | Formula | Use |
|---|---|---|
| **PED** | %ΔQd ÷ %ΔP | Pricing decisions |
| **YED** | %ΔQd ÷ %ΔY | Planning for economic change |
| **Promotional elasticity** | %ΔQd ÷ %Δ promotion spending | Judging advertising |
| **XED** | %ΔQd(A) ÷ %ΔP(B) | Competitor price changes |

## Sales forecasting
- **Quantitative**: moving averages, extrapolation, correlation
- **Qualitative**: expert opinion, Delphi technique, consumer surveys

**Moving average** smooths fluctuations to show the trend. Variations from the trend show seasonal patterns.

## Limitations
Forecasts assume the past predicts the future; external shocks.

> Exam tip: \"correlation does not prove causation\" is a strong evaluative point.`,
`## Marketing plans
Objectives → research → strategy → marketing mix → budget → monitoring.

## New product development
Idea → screening → concept testing → development → test marketing → launch. **R&D** drives innovation.

## International marketing
**Reasons**: growth, saturated home market, spreading risk.
**Problems**: culture, language, legal, exchange rates, logistics.

## Strategies
| Strategy | Approach |
|---|---|
| **Pan-global** | Same mix everywhere |
| **Global localisation (glocalisation)** | Adapt to local needs |

## Methods of entry
Exporting, licensing, franchising, joint ventures, FDI.

## Technology and marketing
Social media, digital promotion, AI, data analysis.

> Exam tip: weigh economies of scale (standardise) against local fit (adapt).`]
    },
    { n: "9", t: "Operations management",
      parts: ["9.1 Location and scale", "9.2 Quality management", "9.3 Operations strategy"],
      q: [
        ["Which is a quantitative factor in a location decision?", ["Land and labour costs", "Owner's preference", "Quality of life", "Local culture"], 0, "Quantitative factors can be measured in money."],
        ["Offshoring means…", ["Relocating business activities to another country", "Moving to the coast", "Using local suppliers", "Opening an online shop"], 0, "Often done to reduce costs."],
        ["Total quality management (TQM) means…", ["Everyone in the business is responsible for quality", "Only inspectors check quality", "Quality is checked only at the end", "Quality doesn't matter"], 0, "TQM builds quality into every stage."],
        ["Kaizen is…", ["Continuous improvement through small changes", "A one-off major change", "Just-in-time delivery", "A pricing strategy"], 0, "Employees suggest small, regular improvements."],
        ["Benchmarking means…", ["Comparing performance with the best in the industry", "Setting prices", "Hiring new staff", "Recording inventory"], 0, "It identifies best practice to copy."],
        ["Lean production aims to…", ["Minimise waste of all resources", "Maximise inventory", "Increase labour costs", "Slow down production"], 0, "It includes JIT, kaizen and cell production."],
        ["In critical path analysis, the critical path is…", ["The sequence of activities with zero float", "The shortest route", "Activities that can be delayed", "The cheapest route"], 0, "Any delay on the critical path delays the whole project."],
        ["Total float =", ["Latest finish time − duration − earliest start time", "Earliest start + duration", "Duration ÷ latest finish", "Latest start − earliest finish"], 0, "It shows how long an activity can be delayed without delaying the project."]],
      notes: [
`## Location factors
- **Quantitative**: land, labour, transport costs, grants (investment appraisal, break-even)
- **Qualitative**: infrastructure, quality of life, political stability, culture

## International location
**Offshoring** and **reshoring**; multinational location decisions.

## Scale
- **Economies of scale**: purchasing, technical, financial, managerial, marketing
- **Diseconomies of scale**: communication, coordination, motivation

> Exam tip: weigh cost savings against risks such as quality and reputation.`,
`## Quality
Meeting customer expectations consistently.

## Approaches
| Approach | Features |
|---|---|
| **Quality control** | Inspect at the end |
| **Quality assurance** | Check at every stage |
| **TQM** | Quality is everyone's job |

## Methods
Kaizen, quality circles, benchmarking, internal and external quality standards (e.g. ISO).

## Costs and benefits
Training and checks cost money, but reduce waste, returns and complaints, and improve reputation.

> Exam tip: link quality to competitive advantage.`,
`## Operations strategy
Aligning operations with corporate objectives.

## Lean production
Minimising waste. Techniques: JIT, kaizen, cell production, simultaneous engineering.

## Flexibility and innovation
Process innovation (how things are made) and product innovation.

## Project management
**Critical path analysis (CPA)**:
- **EST**: earliest start time
- **LFT**: latest finish time
- **Total float = LFT − duration − EST**
- Critical activities have zero float

## Enterprise resource planning (ERP)
Software that integrates all operations data.

> Exam tip: practise drawing network diagrams with nodes, ESTs and LFTs.`]
    },
    { n: "10", t: "Finance and accounting",
      parts: ["10.1 Financial statements", "10.2 Analysis of published accounts", "10.3 Investment appraisal", "10.4 Finance and accounting strategy"],
      q: [
        ["Gross profit =", ["Revenue − cost of sales", "Revenue − all expenses", "Profit after tax", "Assets − liabilities"], 0, "Cost of sales = opening inventory + purchases − closing inventory."],
        ["Current ratio =", ["Current assets ÷ current liabilities", "Current liabilities ÷ current assets", "(Current assets − inventory) ÷ current liabilities", "Profit ÷ capital"], 0, "A ratio of 1.5–2 is often considered healthy."],
        ["ROCE =", ["Operating profit ÷ capital employed × 100", "Net profit ÷ revenue × 100", "Revenue ÷ capital", "Dividends ÷ shares"], 0, "It measures how well capital generates profit."],
        ["Gearing measures…", ["The proportion of capital employed that comes from long-term debt", "Short-term liquidity", "Profitability", "Inventory turnover"], 0, "High gearing means high reliance on loans."],
        ["Payback period measures…", ["How long an investment takes to repay its cost", "The total profit", "The interest rate", "The net present value"], 0, "Shorter payback means less risk."],
        ["Average rate of return =", ["Average annual profit ÷ initial investment × 100", "Total profit ÷ years", "Cost ÷ annual cash flow", "Net cash flow − cost"], 0, "ARR compares average profit to the cost."],
        ["Net present value takes account of…", ["The time value of money", "Only the payback period", "Only accounting profit", "Inflation only"], 0, "Future cash flows are discounted to present values."],
        ["Depreciation is…", ["The fall in value of a non-current asset over time", "A cash outflow", "A current liability", "A source of finance"], 0, "It spreads the cost of an asset over its useful life."]],
      notes: [
`## Income statement
Revenue − cost of sales = **gross profit**
Gross profit − expenses = **operating profit**
Operating profit − interest − tax = **profit for the year**
Profit is then split between **dividends** and **retained earnings**.

## Statement of financial position
- **Non-current assets**, **current assets**
- **Current liabilities**, **non-current liabilities**
- **Equity**: share capital + retained earnings

## Depreciation
Straight-line: **(cost − residual value) ÷ useful life**

## Inventory valuation
Lower of cost and net realisable value.

> Exam tip: be able to amend a statement after a transaction.`,
`## Ratio analysis
| Type | Ratio | Formula |
|---|---|---|
| Profitability | Gross margin | GP ÷ revenue × 100 |
| Profitability | Profit margin | Profit ÷ revenue × 100 |
| Profitability | ROCE | Operating profit ÷ capital employed × 100 |
| Liquidity | Current ratio | CA ÷ CL |
| Liquidity | Acid test | (CA − inventory) ÷ CL |
| Efficiency | Inventory turnover | Cost of sales ÷ average inventory |
| Efficiency | Receivables days | Receivables ÷ revenue × 365 |
| Efficiency | Payables days | Payables ÷ cost of sales × 365 |
| Gearing | Gearing | Non-current liabilities ÷ capital employed × 100 |
| Investor | Dividend yield | Dividend per share ÷ share price × 100 |
| Investor | P/E ratio | Share price ÷ earnings per share |

## Limitations
Historic data, different accounting methods, inflation, window dressing, ignore qualitative factors.

> Exam tip: compare ratios over time or with competitors, never in isolation.`,
`## Methods
- **Payback period**: time to recover the cost
- **ARR** = average annual profit ÷ initial investment × 100
- **NPV**: sum of discounted cash flows − initial cost. Positive NPV = worthwhile
- **IRR**: discount rate where NPV = 0

## Discounting
Money now is worth more than money later (time value of money). Multiply future cash by a discount factor.

## Evaluation
| Method | Pro | Con |
|---|---|---|
| Payback | Simple, focuses on risk | Ignores later cash flows |
| ARR | Uses all cash flows | Ignores timing |
| NPV | Time value of money | Depends on discount rate chosen |

## Qualitative factors
Objectives, ethics, risk, reliability of forecasts.

> Exam tip: always conclude with a recommendation that considers qualitative factors.`,
`## Finance and accounting strategy
Planning how finance supports corporate objectives.

## Working capital management
Controlling inventory, receivables and payables to balance liquidity and profitability.

## Choosing finance for strategy
Debt vs equity: control, cost, gearing, risk.

## Window dressing
Presenting accounts more favourably (e.g. delaying expenses). Limits the reliability of ratios.

## Budgets and variances at A Level
Using variance analysis to make strategic decisions.

## Contribution and costing decisions
Contribution decisions such as special orders, make or buy.

> Exam tip: connect financial choices to the wider strategy of the business.`]
    }
  ]
};

export default [AS, A];
