// Cambridge International AS & A Level Economics 9708 (syllabus for 2026–2028).
// AS = topics 1–6 (Papers 1 & 2), A Level = topics 7–11 (Papers 3 & 4, AS assumed).
// Each chapter: parts, starter questions [prompt, options, correctIndex, explanation] (correct written first,
// shuffled at build time) and notes (one markdown string per part).

const AS = {
  slug: "as-economics", code: "9708", title: "AS Level Economics", tier: "AS", color: "#3b82f6", icon: "trending-up",
  exam_label: "Cambridge International AS Level Economics 9708 · Nov 2027",
  description: "Topics 1–6. Paper 1: 30 MCQs (1h). Paper 2: data response + one essay from a choice (2h).",
  chapters: [
    { n: "1", t: "Basic economic ideas and resource allocation",
      parts: ["1.1 Scarcity, choice and opportunity cost", "1.2 Economic methodology", "1.3 Factors of production", "1.4 Resource allocation in different economic systems", "1.5 Production possibility curves", "1.6 Classification of goods and services"],
      q: [
        ["What is the fundamental economic problem?", ["Unlimited wants but finite resources", "Too much money in the economy", "Prices that are too high", "Unemployment of labour"], 0, "Scarcity (unlimited wants, finite resources) forces choices on every economy."],
        ["Which is a normative statement?", ["The government should raise the minimum wage", "A rise in the minimum wage increases labour costs", "Inflation was 4% last year", "Higher interest rates reduce borrowing"], 0, "Normative statements are value judgements (should/ought) that cannot be tested."],
        ["The 'ceteris paribus' assumption means…", ["All other things remain equal", "Prices always fall", "The market is in equilibrium", "Consumers are rational"], 0, "It lets economists isolate the effect of one variable at a time."],
        ["Which is an example of capital as a factor of production?", ["A delivery van used by a business", "Money in a savings account", "Fish in the sea", "An entrepreneur's idea"], 0, "Capital is man-made goods used to produce other goods and services."],
        ["A point inside a production possibility curve shows…", ["Unemployed or inefficiently used resources", "Unattainable output", "Productive efficiency", "Economic growth"], 0, "Output could rise without giving anything up, so resources are not fully or efficiently used."],
        ["A PPC that is concave (bowed out) to the origin shows…", ["Increasing opportunity cost", "Constant opportunity cost", "Falling opportunity cost", "No opportunity cost"], 0, "Resources are not equally suited to both goods, so each extra unit costs more of the other."],
        ["A public good is…", ["Non-excludable and non-rival", "Rival and excludable", "Provided only by the private sector", "Always a merit good"], 0, "Non-excludability causes the free rider problem, so markets fail to provide it."],
        ["Which best describes a merit good?", ["Its benefits are underestimated by consumers, so it is under-consumed", "It is non-rival", "It harms third parties", "It is a free good"], 0, "Imperfect information leads to under-consumption of merit goods such as education."]],
      notes: [
`## Scarcity
**Wants are unlimited** but **resources are finite**, so every economy must choose. This is the **basic economic problem**.

## Choice and opportunity cost
**Opportunity cost** is the next best alternative given up when a choice is made.
- A student who spends Saturday revising gives up a paid shift (if that was the next best option)
- A government that builds a hospital may give up a new road

## Economic decision makers
| Agent | Typical aim |
|---|---|
| Consumers | Maximise satisfaction (utility) |
| Firms | Maximise profit (usually) |
| Government | Maximise social welfare |

## Short run vs long run
- **Short run**: at least one factor of production is fixed
- **Long run**: all factors are variable

> Exam tip: always name the *specific* next best alternative when explaining opportunity cost.`,
`## Positive and normative statements
- **Positive**: can be tested against evidence (\"Unemployment rose to 7%\")
- **Normative**: a value judgement, often uses *should* or *ought* (\"The government should cut taxes\")

## Ceteris paribus
\"All other things being equal\". Economists change one variable at a time to see its effect, e.g. the effect of a price change on quantity demanded.

## Models and assumptions
Economics uses simplified **models** (demand and supply, PPCs) built on **assumptions** (rational agents, perfect information). Models are useful but may not hold perfectly in real life.

## The margin
Decisions are made **at the margin**: is the extra benefit of one more unit worth the extra cost?

> Exam tip: in evaluation, question the assumptions behind a model.`,
`## The four factors
| Factor | Example | Reward |
|---|---|---|
| **Land** | Natural resources: soil, minerals, fish | Rent |
| **Labour** | Human effort | Wages |
| **Capital** | Machines, factories, roads | Interest |
| **Enterprise** | Organising factors and bearing risk | Profit |

## Division of labour and specialisation
Splitting production into small tasks raises output per worker.
- **Advantages**: higher productivity, workers become skilled, time saved
- **Disadvantages**: boredom, lack of flexibility, over-dependence on one process

## Role of the entrepreneur
Combines the other factors, takes risks, innovates.

> Exam tip: money is not capital; it is used to buy capital goods.`,
`## Three questions every economy answers
What to produce? How? For whom?

## Economic systems
| System | Who decides | Strengths | Weaknesses |
|---|---|---|---|
| **Market** | Price mechanism | Efficiency, choice, incentives | Inequality, market failure, no public goods |
| **Planned** | Government | Equity, provides public goods | Inefficiency, shortages, little choice |
| **Mixed** | Both | Combines benefits | Risk of government failure |

## Transition economies
Economies moving from planned towards market (privatisation, removing price controls). This can cause unemployment and inflation in the short run.

> Exam tip: nearly all real economies are mixed; the debate is about the *degree* of intervention.`,
`## What a PPC shows
All combinations of two goods that can be produced when resources are **fully and efficiently** used.
- **On** the curve: efficient
- **Inside**: unemployed or inefficient resources
- **Outside**: unattainable (for now)

## Opportunity cost on a PPC
- **Concave (bowed out)**: increasing opportunity cost, because resources are not equally suited to both goods
- **Straight line**: constant opportunity cost

## Shifts
- **Outward**: more or better resources, better technology (economic growth)
- **Inward**: natural disasters, war, emigration of skilled workers
- **Pivot**: technology improves in only one industry

> Exam tip: movement along the curve = reallocation; a shift = change in productive capacity.`,
`## Types of goods
| Type | Key feature | Example |
|---|---|---|
| **Free good** | No opportunity cost | Air |
| **Private good** | Rival and excludable | A sandwich |
| **Public good** | Non-rival and non-excludable | Street lights, defence |
| **Merit good** | Under-consumed, benefits underestimated | Education, vaccines |
| **Demerit good** | Over-consumed, harm underestimated | Cigarettes |

## Free rider problem
Because people cannot be excluded from a public good, they can benefit without paying, so private firms will not supply it.

## Information failure
Merit and demerit goods arise largely from **imperfect information**: people misjudge the true benefits or costs.

> Exam tip: quasi-public goods (e.g. roads with tolls) have some but not all public-good features.`]
    },
    { n: "2", t: "The price system and the microeconomy",
      parts: ["2.1 Demand and supply curves", "2.2 Price elasticity, income elasticity and cross elasticity of demand", "2.3 Price elasticity of supply", "2.4 The interaction of demand and supply", "2.5 Consumer and producer surplus"],
      q: [
        ["Which causes a rightward shift of the demand curve for a normal good?", ["A rise in consumer incomes", "A fall in the good's own price", "A rise in the price of a complement", "A fall in the price of a substitute"], 0, "Higher income raises demand at every price for a normal good. An own-price change is a movement along the curve."],
        ["Price rises from $10 to $12 and quantity demanded falls from 100 to 90. PED is…", ["−0.5", "−2", "−0.2", "−5"], 0, "%ΔQd = −10%, %ΔP = +20%, so PED = −10 ÷ 20 = −0.5 (inelastic)."],
        ["A good has a YED of −0.8. It is…", ["An inferior good", "A luxury good", "A normal necessity", "A complement"], 0, "Negative income elasticity means demand falls as income rises: an inferior good."],
        ["XED between two goods is +1.5. They are…", ["Substitutes", "Complements", "Unrelated", "Inferior goods"], 0, "A positive cross elasticity means a rise in the price of one raises demand for the other."],
        ["If demand is price inelastic, a price rise will…", ["Increase total revenue", "Decrease total revenue", "Leave revenue unchanged", "Reduce quantity demanded to zero"], 0, "The % fall in quantity is smaller than the % rise in price, so revenue rises."],
        ["Which makes supply more price elastic?", ["Spare capacity and large inventories", "A short time period", "Perishable products", "Factors that are hard to move between uses"], 0, "Firms can raise output quickly when they have spare capacity or stock."],
        ["A rise in the cost of raw materials will, other things equal…", ["Raise equilibrium price and lower equilibrium quantity", "Lower price and raise quantity", "Raise both price and quantity", "Lower both price and quantity"], 0, "Supply shifts left: price rises and quantity falls."],
        ["Consumer surplus is…", ["The difference between what consumers are willing to pay and what they actually pay", "Profit earned by firms", "Tax revenue", "Price minus cost of production"], 0, "It is the area below the demand curve and above the price."]],
      notes: [
`## Demand
**Demand** is the quantity consumers are willing **and able** to buy at each price.
- **Law of demand**: price ↑ → quantity demanded ↓ (movement along the curve)
- **Shifts** (conditions of demand): income, price of substitutes and complements, tastes, advertising, population, expectations

## Supply
**Supply** is the quantity producers are willing and able to sell at each price.
- Price ↑ → quantity supplied ↑ (higher price = more profitable)
- **Shifts**: costs of production, technology, indirect taxes, subsidies, weather, number of firms

## Joint, competitive and derived demand
- **Joint demand**: goods used together (cars and petrol)
- **Derived demand**: demand for a factor comes from demand for the product (bricklayers ← houses)
- **Joint supply**: making one good produces another (beef and leather)

> Exam tip: \"change in demand\" = shift; \"change in quantity demanded\" = movement.`,
`## Price elasticity of demand (PED)
**PED = %Δ quantity demanded ÷ %Δ price**
| Value (ignore sign) | Meaning |
|---|---|
| > 1 | Elastic |
| < 1 | Inelastic |
| = 1 | Unitary |
| 0 | Perfectly inelastic |

**Determinants**: number of substitutes, proportion of income, necessity vs luxury, time period, habit/addiction.

**PED and total revenue**: if demand is inelastic, raising price raises revenue; if elastic, cutting price raises revenue.

## Income elasticity (YED)
**YED = %ΔQd ÷ %Δ income**. Positive = normal (> 1 luxury), negative = inferior.

## Cross elasticity (XED)
**XED = %ΔQd of A ÷ %Δ price of B**. Positive = substitutes, negative = complements, zero = unrelated.

> Exam tip: PED varies along a straight-line demand curve: elastic at high prices, inelastic at low prices.`,
`## Price elasticity of supply (PES)
**PES = %Δ quantity supplied ÷ %Δ price** (always positive)

| Value | Meaning |
|---|---|
| > 1 | Elastic |
| < 1 | Inelastic |
| 0 | Perfectly inelastic (vertical) |
| ∞ | Perfectly elastic (horizontal) |

## Determinants
- **Spare capacity**: more = more elastic
- **Inventories**: goods in stock can be released quickly
- **Time**: supply is more elastic in the long run
- **Factor mobility**: how easily resources move between uses
- **Perishability**: perishable goods can't be stored, so inelastic

## Why it matters
Agricultural supply is inelastic in the short run, so demand shocks cause large price swings.

> Exam tip: any straight supply curve from the origin has PES = 1.`,
`## Equilibrium
Where **demand = supply**. No pressure for price to change.
- **Excess demand** (shortage): price rises, rationing the good
- **Excess supply** (surplus): price falls

## Changes in equilibrium
| Change | Price | Quantity |
|---|---|---|
| Demand ↑ | ↑ | ↑ |
| Demand ↓ | ↓ | ↓ |
| Supply ↑ | ↓ | ↑ |
| Supply ↓ | ↑ | ↓ |

## Functions of the price mechanism
1. **Signalling**: prices show where resources are wanted
2. **Incentive**: higher prices encourage more supply
3. **Rationing**: prices allocate scarce goods to those willing to pay

## Related markets
A change in one market spills into others: higher oil prices raise demand for electric cars (substitutes) and cut demand for large cars (complements).

> Exam tip: draw and label every diagram: axes, curves, old and new equilibria.`,
`## Consumer surplus
The difference between what consumers are **willing to pay** and what they **actually pay**.
Area: below demand curve, above price.

## Producer surplus
The difference between the price producers **receive** and the **minimum** they would accept.
Area: above supply curve, below price.

## Changes
- Price rises: consumer surplus falls, producer surplus rises
- Price falls: the opposite
- An indirect tax reduces both, creates tax revenue and a **deadweight loss**

## Why it matters
Total surplus (CS + PS) measures welfare. Government policy is often judged by how it changes it.

> Exam tip: shade and label the areas clearly on your diagram.`]
    },
    { n: "3", t: "Government microeconomic intervention",
      parts: ["3.1 Reasons for government intervention in markets", "3.2 Methods and effects of government intervention in markets", "3.3 Addressing income and wealth inequality"],
      q: [
        ["A maximum price set below equilibrium will cause…", ["A shortage (excess demand)", "A surplus", "No change", "A rise in market price"], 0, "Price can't rise to clear the market, so quantity demanded exceeds quantity supplied."],
        ["A specific indirect tax shifts the supply curve…", ["Upward (left) by the amount of the tax, parallel", "Downward (right)", "Upward, pivoting", "It does not shift supply"], 0, "A specific tax is a fixed amount per unit, so supply shifts up parallel."],
        ["The burden of an indirect tax falls mostly on consumers when demand is…", ["Price inelastic", "Price elastic", "Perfectly elastic", "Unitary"], 0, "Consumers keep buying even as price rises, so producers can pass on most of the tax."],
        ["Which is a reason governments subsidise public transport?", ["It creates positive externalities such as less congestion", "To reduce consumer surplus", "To create a surplus", "Because it is a demerit good"], 0, "Subsidies increase consumption of goods with external benefits."],
        ["A progressive tax is one where…", ["The proportion of income paid in tax rises as income rises", "Everyone pays the same amount", "The poor pay a higher proportion", "Tax is only on spending"], 0, "Progressive taxes reduce income inequality."],
        ["Which measures inequality of income?", ["Gini coefficient", "Consumer price index", "GDP per capita", "PED"], 0, "Gini ranges from 0 (perfect equality) to 1 (perfect inequality)."],
        ["Direct provision by the government is most likely for…", ["Public goods such as national defence", "Luxury cars", "Fast food", "Mobile phones"], 0, "Markets fail to provide public goods because of the free rider problem."],
        ["Which is an unintended consequence of a minimum price above equilibrium?", ["A surplus of the good", "A shortage", "Falling producer income", "A black market for buyers"], 0, "Supply exceeds demand at the higher price; governments may have to buy and store the surplus."]],
      notes: [
`## Why governments intervene
Markets can **fail** to allocate resources efficiently or fairly.
- **Public goods**: not provided because of free riders
- **Merit goods**: under-consumed (information failure)
- **Demerit goods**: over-consumed
- **Externalities**: third-party costs/benefits ignored
- **Inequality**: market outcomes may be seen as unfair
- **Monopoly power**: higher prices, lower output

## Objectives
Efficiency, equity, protecting consumers, stabilising prices of key goods (food, fuel).

> Exam tip: link each reason to the specific *type* of market failure.`,
`## Main methods
| Method | Effect |
|---|---|
| **Maximum price** (below eq.) | Cheaper for consumers but shortage, queues, black markets |
| **Minimum price** (above eq.) | Protects producers but surplus |
| **Indirect tax** | Supply shifts left; price ↑, quantity ↓, revenue raised |
| **Subsidy** | Supply shifts right; price ↓, quantity ↑ |
| **Direct provision** | Government provides (defence, schools) |
| **Price stabilisation (buffer stocks)** | Buy in good harvests, sell in bad |
| **Regulation** | Laws, bans, standards |
| **Nationalisation / privatisation** | Change ownership |

## Incidence of a tax
The more **inelastic demand** is, the greater the share paid by consumers.

## Unintended consequences
Black markets, surpluses, dependence on subsidies, government failure.

> Exam tip: draw tax/subsidy diagrams showing consumer and producer shares and the government revenue/cost box.`,
`## Income vs wealth
- **Income**: a flow (wages, rent, interest, profit, benefits)
- **Wealth**: a stock of assets (property, shares, savings)

## Measuring inequality
- **Lorenz curve**: further from the line of equality = more unequal
- **Gini coefficient**: 0 = perfect equality, 1 = perfect inequality

## Policies
- **Progressive taxes**: richer pay a higher %
- **Transfer payments**: pensions, unemployment benefit
- **Minimum wage**
- **State provision** of education and healthcare
- **Wealth/inheritance taxes**

## Trade-offs
Higher taxes may reduce incentives to work and invest. Benefits may create a **poverty trap**.

> Exam tip: distinguish **horizontal equity** (same treatment for equals) and **vertical equity** (different treatment for different circumstances).`]
    },
    { n: "4", t: "The macroeconomy",
      parts: ["4.1 National income statistics", "4.2 Introduction to the circular flow of income", "4.3 Aggregate demand and aggregate supply analysis", "4.4 Economic growth", "4.5 Unemployment", "4.6 Price stability"],
      q: [
        ["GDP measures…", ["The total value of output produced within a country in a year", "Total output of a country's citizens worldwide", "The money supply", "Government spending only"], 0, "GDP measures output produced within the country's borders."],
        ["Real GDP is nominal GDP…", ["Adjusted for inflation", "Adjusted for population", "Plus net property income from abroad", "Minus depreciation"], 0, "Real values remove the effect of price changes."],
        ["Which is an injection into the circular flow?", ["Exports", "Savings", "Taxation", "Imports"], 0, "Injections are investment, government spending and exports."],
        ["Aggregate demand is…", ["C + I + G + (X − M)", "C + S + T", "Output × price", "Total supply of goods"], 0, "AD is total planned spending on an economy's output."],
        ["A fall in the price level leads to…", ["A movement down along the AD curve", "A shift right of AD", "A shift left of AS", "A shift left of AD"], 0, "A price-level change moves along AD; other factors shift it."],
        ["Which is a cause of a rightward shift in long-run aggregate supply?", ["Improvements in education and technology", "A rise in interest rates", "Higher indirect taxes", "A fall in exports"], 0, "LRAS shifts when productive capacity grows."],
        ["Frictional unemployment occurs when…", ["Workers are between jobs", "An industry declines permanently", "Demand falls in a recession", "Jobs depend on the season"], 0, "It is short-term and caused by time spent searching for a new job."],
        ["Cost-push inflation is caused by…", ["Rising costs of production such as wages or oil", "Excess aggregate demand", "Falling interest rates", "Rising exports"], 0, "Higher costs shift SRAS left, raising the price level."]],
      notes: [
`## Measures of national income
- **GDP**: value of output produced **within** a country
- **GNI**: GDP + net primary income from abroad
- **NNI**: GNI − depreciation

## Three methods
Output, income and expenditure, which should give the same figure.

## Nominal vs real
- **Nominal**: current prices
- **Real**: adjusted for inflation, so it shows true change in output

**Real GDP = Nominal GDP × (base-year price index ÷ current price index)**

## Per capita
Divide by population for average living standards.

## Uses and limitations
Comparing living standards over time and between countries. Limitations: informal economy, inequality, quality of life, environment, different currencies (use PPP).

> Exam tip: when comparing countries, use real GDP per capita at **PPP**.`,
`## The circular flow
Households supply factors to firms; firms pay incomes; households spend on goods.

## Injections and withdrawals
| Injections (J) | Withdrawals (W) |
|---|---|
| Investment (I) | Savings (S) |
| Government spending (G) | Taxation (T) |
| Exports (X) | Imports (M) |

- If **J > W**, national income rises
- If **J < W**, national income falls
- Equilibrium when **J = W**

## Open vs closed
A closed economy has no trade; a three-sector economy adds government; a four-sector adds the foreign sector.

> Exam tip: injections and withdrawals do not need to be equal *individually*, only in total.`,
`## Aggregate demand (AD)
**AD = C + I + G + (X − M)**. Slopes downward (wealth, interest rate and international trade effects).

**Shifts**: consumer confidence, interest rates, government spending, exchange rate, world incomes.

## Aggregate supply (AS)
- **SRAS**: shifts with costs (wages, raw materials, indirect taxes)
- **LRAS**: shows productive capacity

**Keynesian AS**: horizontal at low output (spare capacity), then rising, then vertical at full employment.
**Classical/monetarist LRAS**: vertical at full employment.

## Equilibrium
Where AD = AS. A rise in AD raises output and/or the price level depending on spare capacity.

> Exam tip: be clear which AS model you're using and label it.`,
`## Economic growth
- **Actual growth**: increase in real GDP (using spare capacity)
- **Potential growth**: increase in productive capacity (PPC/LRAS shifts out)

## Causes
More or better factors, investment, technology, education, higher AD (short run).

## Business cycle
Boom → downturn → recession (two consecutive quarters of falling real GDP) → recovery.

## Output gaps
- **Negative output gap**: actual < potential (unemployment)
- **Positive output gap**: actual > potential (inflationary pressure)

## Costs and benefits
Higher incomes, jobs, tax revenue vs pollution, resource depletion, inequality.

> Exam tip: sustainable growth meets current needs without harming future generations.`,
`## Measuring unemployment
- **Claimant count**: people claiming unemployment benefits
- **Labour Force Survey (ILO)**: people without work, available and actively looking

**Unemployment rate = unemployed ÷ labour force × 100**

## Types
| Type | Cause |
|---|---|
| **Frictional** | Between jobs |
| **Structural** | Decline of an industry, skills mismatch |
| **Cyclical (demand-deficient)** | Recession, low AD |
| **Seasonal** | Season changes (tourism) |

## Consequences
Lost output, lower tax revenue, higher benefit spending, poverty, loss of skills, social problems.

> Exam tip: match the policy to the type: training for structural, raising AD for cyclical.`,
`## Inflation and deflation
- **Inflation**: sustained rise in the general price level
- **Deflation**: sustained fall
- **Disinflation**: inflation rate falling but still positive

## Measuring: the CPI
1. Choose a base year and a basket of goods
2. Weight items by share of spending
3. Track price changes

## Causes
- **Demand-pull**: AD rises faster than capacity
- **Cost-push**: rising costs shift SRAS left
- **Monetary**: too much money growth

## Consequences
Lower purchasing power, menu and shoe-leather costs, redistribution from savers to borrowers, lower international competitiveness, uncertainty.

> Exam tip: real interest rate = nominal rate − inflation.`]
    },
    { n: "5", t: "Government macroeconomic intervention",
      parts: ["5.1 Government macroeconomic policy objectives", "5.2 Fiscal policy", "5.3 Monetary policy", "5.4 Supply-side policy"],
      q: [
        ["Which is NOT a main macroeconomic objective?", ["Maximising company profits", "Low inflation", "Low unemployment", "Economic growth"], 0, "The main objectives are growth, low unemployment, stable prices and a sustainable balance of payments."],
        ["Expansionary fiscal policy involves…", ["Raising government spending or cutting taxes", "Raising interest rates", "Cutting the money supply", "Raising taxes"], 0, "It increases AD through G or disposable income."],
        ["A budget deficit occurs when…", ["Government spending exceeds tax revenue", "Exports exceed imports", "Tax revenue exceeds spending", "Savings exceed investment"], 0, "The government must borrow to fund the gap."],
        ["Which is an automatic stabiliser?", ["Unemployment benefits rising in a recession", "A new road-building programme", "A cut in interest rates", "A privatisation"], 0, "Benefit spending rises and tax revenue falls automatically when the economy slows."],
        ["Contractionary monetary policy aims to…", ["Reduce inflation by cutting AD", "Increase unemployment as a target", "Raise government spending", "Devalue the currency"], 0, "Higher interest rates reduce borrowing and spending."],
        ["A rise in interest rates is likely to…", ["Reduce consumer borrowing and investment", "Increase house prices", "Reduce savings", "Weaken the exchange rate"], 0, "Borrowing becomes more expensive and saving more attractive."],
        ["Which is a supply-side policy?", ["Increasing spending on education and training", "Raising interest rates", "Increasing unemployment benefits", "Cutting exports"], 0, "Training raises labour productivity and shifts LRAS right."],
        ["A limitation of supply-side policies is that they…", ["Take a long time to have an effect", "Always cause inflation", "Reduce productive capacity", "Cannot be used by governments"], 0, "Education and infrastructure take years to raise capacity."]],
      notes: [
`## Main objectives
1. **Economic growth**: sustained rise in real GDP
2. **Low unemployment**
3. **Low and stable inflation** (often around 2%)
4. **Balance of payments stability**

Others: income redistribution, environmental sustainability.

## Conflicts
- Growth vs inflation: higher AD may raise prices
- Growth vs current account: higher incomes raise imports
- Low inflation vs low unemployment (short run)

> Exam tip: questions often ask you to *evaluate* trade-offs between objectives.`,
`## Fiscal policy
Using **government spending** and **taxation** to influence AD.

- **Expansionary**: G ↑ or T ↓ → AD ↑
- **Contractionary**: G ↓ or T ↑ → AD ↓

## Budget position
- **Deficit**: G > T
- **Surplus**: T > G
- **National debt**: the accumulated total of borrowing

## Types of taxes
Direct (income tax, corporation tax) vs indirect (VAT, excise). Progressive, proportional, regressive.

## Automatic vs discretionary
- **Automatic stabilisers**: benefits and tax revenue change with the cycle automatically
- **Discretionary**: deliberate changes in budgets

## Limitations
Time lags, crowding out, incentive effects, debt.

> Exam tip: the effect depends on the size of the multiplier (A Level) and spare capacity.`,
`## Monetary policy
Changing **interest rates**, the **money supply** and the **exchange rate** to influence AD. Usually run by the central bank.

## Interest rates
Higher rates:
- Increase the cost of borrowing → less consumption and investment
- Encourage saving
- Raise mortgage payments → lower disposable income
- Attract hot money → stronger currency → fewer exports

## Quantitative easing (QE)
The central bank creates money to buy bonds, lowering long-term rates and raising money supply.

## Limitations
Time lags (up to 18–24 months), low confidence, rates near zero.

> Exam tip: an independent central bank may be more credible in fighting inflation.`,
`## Supply-side policy
Aims to increase **productive capacity** (shift LRAS right).

## Market-based
- Cutting income and corporation taxes (incentives)
- Deregulation
- Privatisation
- Reducing trade union power, labour market flexibility

## Interventionist
- Education and training
- Infrastructure investment
- Research and development grants
- Healthcare

## Benefits
Growth without inflation, lower unemployment (structural), improved competitiveness.

## Limitations
Slow to work, costly, may increase inequality.

> Exam tip: link supply-side policies to tackling **structural** unemployment and cost-push inflation.`]
    },
    { n: "6", t: "International economic issues",
      parts: ["6.1 The reasons for international trade", "6.2 Protectionism", "6.3 Current account of the balance of payments", "6.4 Exchange rates", "6.5 Policies to correct imbalances in the current account"],
      q: [
        ["Country A has a comparative advantage in a good when it…", ["Has a lower opportunity cost of producing it", "Can produce more of it in absolute terms", "Has more workers", "Has a larger GDP"], 0, "Comparative advantage depends on opportunity cost, not absolute output."],
        ["Which is a protectionist measure?", ["A tariff on imported cars", "A free trade agreement", "Removing quotas", "Reducing export taxes"], 0, "A tariff is a tax on imports that protects domestic producers."],
        ["An argument for protection is to…", ["Protect infant industries", "Increase consumer choice", "Lower import prices", "Encourage specialisation"], 0, "New industries may need time to grow before facing competition."],
        ["Which is recorded in the current account?", ["Trade in goods and services", "Foreign direct investment", "Purchases of foreign shares", "Central bank reserves"], 0, "The current account covers trade, primary income and secondary income."],
        ["A depreciation of the currency will usually…", ["Make exports cheaper abroad", "Make imports cheaper", "Reduce inflation", "Increase the price of exports"], 0, "Each unit of foreign currency buys more of the domestic currency."],
        ["In a floating exchange rate system the rate is determined by…", ["Demand and supply of the currency", "The government only", "The IMF", "Gold reserves"], 0, "Market forces set the price of a floating currency."],
        ["Which policy is expenditure-reducing?", ["Raising income tax to cut spending on imports", "Imposing tariffs", "Devaluation", "Export subsidies"], 0, "It reduces total spending, including on imports."],
        ["Terms of trade =", ["Index of export prices ÷ index of import prices × 100", "Exports − imports", "Imports ÷ exports", "GDP ÷ exports"], 0, "An improvement means each export buys more imports."]],
      notes: [
`## Absolute and comparative advantage
- **Absolute advantage**: can produce more with the same resources
- **Comparative advantage**: lower **opportunity cost**

Countries gain by specialising in goods where they have comparative advantage and trading.

## Free trade benefits
Lower prices, more choice, economies of scale, competition, spreading technology.

## Terms of trade
**ToT = (index of export prices ÷ index of import prices) × 100**
A rise means a favourable movement: each export buys more imports.

## Limitations
Transport costs, assumptions of constant costs, over-specialisation risk.

> Exam tip: in calculations, work out opportunity cost ratios first.`,
`## Methods of protection
| Method | Effect |
|---|---|
| **Tariff** | Tax on imports; raises price |
| **Quota** | Limit on quantity imported |
| **Subsidy** | Helps domestic firms compete |
| **Embargo** | Ban on trade |
| **Administrative barriers** | Red tape, standards |

## Arguments for
Protect infant industries, protect jobs, prevent dumping, national security, correct trade deficits, raise revenue.

## Arguments against
Higher prices, less choice, retaliation, inefficiency, harms comparative advantage.

> Exam tip: use a tariff diagram showing domestic supply, world price, imports and deadweight loss.`,
`## Structure of the current account
1. **Trade in goods** (visible)
2. **Trade in services** (invisible)
3. **Primary income**: wages, interest, profits, dividends
4. **Secondary income**: transfers such as remittances and aid

## Deficit and surplus
- **Deficit**: more money flows out than in
- **Surplus**: more flows in

## Causes of a deficit
High incomes (more imports), strong currency, low productivity, high inflation.

## Consequences
Downward pressure on the exchange rate, borrowing, loss of jobs in export industries.

> Exam tip: a deficit isn't always bad, e.g. if it's from importing capital goods.`,
`## Exchange rate systems
- **Floating**: set by demand and supply
- **Fixed**: set by government/central bank
- **Managed float**: mostly market, with intervention

## Causes of changes
Interest rates (hot money), inflation, trade flows, speculation, FDI.

## Effects of a depreciation
- Exports cheaper, imports dearer
- May improve the current account (depending on elasticities)
- May raise inflation (imported inflation)

## Depreciation vs devaluation
Depreciation (floating) vs devaluation (fixed, by government decision).

> Exam tip: use **SPICED**: Strong Pound, Imports Cheaper, Exports Dearer (works for any currency).`,
`## Policies to correct a deficit
| Type | Examples |
|---|---|
| **Expenditure-switching** | Tariffs, quotas, devaluation |
| **Expenditure-reducing** | Contractionary fiscal and monetary policy |
| **Supply-side** | Raise productivity and competitiveness |

## Evaluation
- Expenditure-reducing may cause unemployment
- Protection risks retaliation
- Devaluation may cause inflation
- Supply-side is slow but long-lasting

> Exam tip: match the policy to the cause of the imbalance.`]
    }
  ]
};

const A = {
  slug: "a-economics", code: "9708", title: "A Level Economics", tier: "A", color: "#3b82f6", icon: "trending-up",
  exam_label: "Cambridge International A Level Economics 9708 · Nov 2028",
  description: "Topics 7–11 (AS content assumed). Paper 3: 30 MCQs (1h15). Paper 4: data response + essays (2h).",
  chapters: [
    { n: "7", t: "The price system and the microeconomy",
      parts: ["7.1 Utility", "7.2 Indifference curves and budget lines", "7.3 Efficiency and market failure", "7.4 Private costs and benefits, externalities and social costs and benefits", "7.5 Types of cost, revenue and profit, short-run and long-run production", "7.6 Different market structures", "7.7 Growth and survival of firms", "7.8 Differing objectives and policies of firms"],
      q: [
        ["The law of diminishing marginal utility states that…", ["Each extra unit consumed gives less additional satisfaction", "Total utility always falls", "Price falls as output rises", "Marginal cost rises with output"], 0, "This helps explain why demand curves slope downwards."],
        ["Allocative efficiency occurs where…", ["P = MC", "MC = MR", "AC is minimised", "P = AR"], 0, "Price reflects the value consumers place on the good, which equals its marginal cost."],
        ["A negative externality in production means…", ["Social cost exceeds private cost", "Private cost exceeds social cost", "Social benefit exceeds private benefit", "There is no third-party effect"], 0, "Social cost = private cost + external cost."],
        ["Profit is maximised where…", ["MC = MR", "AC = AR", "TR is maximised", "MC = AC"], 0, "Producing beyond MC = MR adds more to cost than to revenue."],
        ["In the long run, a firm in perfect competition earns…", ["Normal profit", "Supernormal profit", "A loss", "Monopoly profit"], 0, "Free entry and exit remove supernormal profits."],
        ["A kinked demand curve is associated with…", ["Oligopoly", "Perfect competition", "Monopoly", "Monopolistic competition"], 0, "It explains price rigidity among interdependent firms."],
        ["Which is an example of vertical integration?", ["A car maker buying a tyre manufacturer", "Two banks merging", "A bakery buying a shoe shop", "A supermarket buying another supermarket"], 0, "It merges firms at different stages of the same production chain."],
        ["A firm aiming to maximise sales revenue will produce where…", ["MR = 0", "MC = MR", "AC = AR", "P = MC"], 0, "Total revenue is at its peak when marginal revenue is zero."]],
      notes: [
`## Total and marginal utility
- **Total utility (TU)**: overall satisfaction
- **Marginal utility (MU)**: extra satisfaction from one more unit

## Diminishing marginal utility
Each extra unit adds less satisfaction. This underlies the downward-sloping demand curve.

## Equi-marginal principle
A consumer maximises utility when
**MU of A ÷ price of A = MU of B ÷ price of B**
i.e. the last dollar spent on each good gives the same utility.

## Limitations
Utility can't be measured; people aren't always rational (habit, impulse, limited information). See behavioural economics.

> Exam tip: link MU theory directly to why demand slopes down.`,
`## Budget line
Shows combinations of two goods a consumer can afford.
- **Income rise**: shifts out parallel
- **Price change**: pivots

## Indifference curves
Show combinations giving **equal satisfaction**. Convex to the origin (diminishing marginal rate of substitution). Higher curves = more utility.

## Optimum
Where the budget line is **tangent** to the highest indifference curve.

## Income and substitution effects
| Good | Substitution effect | Income effect |
|---|---|---|
| Normal | Buy more when price falls | Buy more |
| Inferior | Buy more | Buy less (but smaller) |
| Giffen | Buy more | Buy less (larger) |

> Exam tip: draw both effects carefully and label them on the diagram.`,
`## Types of efficiency
- **Productive**: output at the lowest point of average cost
- **Allocative**: P = MC
- **Dynamic**: improvement over time through innovation
- **Pareto optimality**: no one can be made better off without someone else worse off

## Market failure
When the market allocates resources inefficiently:
- Externalities
- Public goods
- Merit/demerit goods
- Information failure
- Monopoly power
- Factor immobility

> Exam tip: link each type of failure to which form of efficiency is lost.`,
`## Key definitions
- **Private cost/benefit**: borne by the decision maker
- **External cost/benefit**: borne by third parties
- **Social cost = private cost + external cost**
- **Social benefit = private benefit + external benefit**

## Negative externalities
Pollution from a factory: MSC > MPC, so the market **over-produces**. Deadweight welfare loss.

## Positive externalities
Education, vaccinations: MSB > MPB, so the market **under-consumes**.

## Cost-benefit analysis
Used for public projects. Steps: identify all costs and benefits (private and external), put money values on them, discount future values, decide.

**Problems**: valuing intangibles (noise, life), forecasting, bias.

> Exam tip: the socially optimal output is where MSC = MSB.`,
`## Short-run costs
- **Fixed costs** (don't vary with output) and **variable costs** (do)
- **AC = TC ÷ Q**, **MC = ΔTC ÷ ΔQ**
- **Law of diminishing returns**: adding variable factors to a fixed one eventually reduces marginal product

## Long-run costs
- **Economies of scale**: AC falls as output grows (technical, managerial, financial, purchasing, risk-bearing)
- **Diseconomies of scale**: AC rises (communication, coordination, motivation)
- **Minimum efficient scale**: lowest output where LRAC is minimised

## Revenue and profit
TR = P × Q; AR = TR ÷ Q; MR = ΔTR ÷ ΔQ
- **Normal profit**: TR = TC (including opportunity cost)
- **Supernormal profit**: TR > TC

## Decisions
- Short run: produce if P ≥ AVC
- Long run: produce if P ≥ AC

> Exam tip: MC cuts AC and AVC at their lowest points.`,
`## Market structures
| Structure | Firms | Barriers | Product | Long-run profit |
|---|---|---|---|---|
| **Perfect competition** | Many | None | Identical | Normal |
| **Monopolistic competition** | Many | Low | Differentiated | Normal |
| **Oligopoly** | Few | High | Same or differentiated | Supernormal possible |
| **Monopoly** | One | Very high | Unique | Supernormal |

## Oligopoly behaviour
Interdependence, price rigidity (kinked demand curve), non-price competition, collusion (cartels), game theory.

## Contestable markets
Low entry/exit costs keep prices low even with few firms.

## Price discrimination
Charging different prices for the same product to different groups. Needs separate markets with different PEDs and no resale.

> Exam tip: evaluate monopoly: higher prices vs economies of scale and dynamic efficiency.`,
`## How firms grow
- **Internal (organic)**: reinvesting profits, new products, new markets
- **External**: mergers and takeovers
  - **Horizontal**: same stage, same industry
  - **Vertical**: different stages (backward or forward)
  - **Conglomerate**: unrelated industries

## Reasons for growth
Economies of scale, market power, diversification, survival.

## Why small firms survive
Niche markets, personal service, flexibility, low barriers, government support.

## Principal–agent problem
Owners (principals) and managers (agents) may have different objectives.

> Exam tip: discuss benefits *and* costs of mergers for consumers.`,
`## Objectives of firms
| Objective | Output rule |
|---|---|
| **Profit maximisation** | MC = MR |
| **Revenue maximisation** | MR = 0 |
| **Sales maximisation** | AC = AR (break-even) |
| **Satisficing** | Enough profit to keep owners happy |
| **Survival** | Covering costs |

## Pricing policies
Limit pricing (deter entry), predatory pricing (drive rivals out), price leadership, price wars.

## Non-price competition
Branding, quality, advertising, after-sales service.

## Public sector objectives
Social welfare rather than profit, e.g. P = MC.

> Exam tip: link the objective to who controls the firm (owners vs managers).`]
    },
    { n: "8", t: "Government microeconomic intervention",
      parts: ["8.1 Government policies to achieve efficient resource allocation and correct market failure", "8.2 Equity and policies towards income and wealth redistribution", "8.3 Labour market forces and government intervention", "8.4 Government failure in microeconomic intervention"],
      q: [
        ["A Pigouvian tax is designed to…", ["Make polluters pay the external cost", "Raise revenue from the rich", "Subsidise merit goods", "Reduce inflation"], 0, "Setting the tax equal to the external cost moves output to the social optimum."],
        ["Tradable pollution permits work by…", ["Capping total pollution and letting firms trade allowances", "Banning all pollution", "Subsidising polluters", "Setting a minimum price"], 0, "Firms that can cut pollution cheaply sell permits to those that can't."],
        ["The marginal revenue product of labour is…", ["The extra revenue from employing one more worker", "The wage rate", "Total output ÷ workers", "The cost of training"], 0, "MRP = marginal product × marginal revenue."],
        ["A monopsony employer in the labour market will tend to…", ["Pay lower wages and employ fewer workers than a competitive market", "Pay higher wages", "Employ more workers", "Have no effect on wages"], 0, "As the only buyer, it can push wages down."],
        ["A trade union can raise wages without reducing employment when…", ["The employer is a monopsony", "Demand for labour is very elastic", "The market is perfectly competitive", "There is no union"], 0, "In monopsony a union can move wages and employment towards the competitive level."],
        ["Transfer earnings are…", ["The minimum payment needed to keep a factor in its current use", "Earnings above that minimum", "Tax paid on income", "Benefits paid to workers"], 0, "Anything above transfer earnings is economic rent."],
        ["Government failure occurs when…", ["Intervention leads to a less efficient outcome", "Markets fail to provide public goods", "Taxes are progressive", "The budget is balanced"], 0, "Causes include poor information, unintended effects and administrative costs."],
        ["A poverty trap occurs when…", ["Earning more leads to losing benefits so little extra income is gained", "Inflation exceeds wage growth", "Unemployment is high", "Taxes are proportional"], 0, "High effective marginal tax rates reduce the incentive to work."]],
      notes: [
`## Correcting market failure
| Policy | Use |
|---|---|
| **Indirect taxes (Pigouvian)** | Internalise negative externalities |
| **Subsidies** | Encourage positive externalities |
| **Regulation** | Limits, standards, bans |
| **Tradable permits** | Cap and trade pollution |
| **Property rights** | Let parties bargain (Coase) |
| **Information provision** | Correct information failure |
| **Direct provision** | Public goods |
| **Competition policy** | Control monopoly |

## Evaluation
Hard to value externalities, enforcement costs, effects on competitiveness, risk of government failure.

> Exam tip: draw the externality diagram showing the tax moving output to the social optimum.`,
`## Equity and efficiency
- **Equity**: fairness
- Trade-off: redistribution may reduce incentives (efficiency)

## Absolute and relative poverty
- **Absolute**: can't meet basic needs
- **Relative**: below a % of median income

## Policies
- **Negative income tax**: below a threshold, people receive payments
- Progressive taxation, wealth taxes
- Universal vs means-tested benefits
- Minimum wage, state education and health

## Means-tested vs universal
Means-tested targets help but can cause a poverty trap and low take-up; universal is simple but costly.

> Exam tip: discuss the incentive effects of each redistribution policy.`,
`## Demand for labour
Derived demand. The **MRP** curve is the firm's demand curve for labour.
**MRP = MP × MR**

Shifts: product demand, productivity, price of capital.

## Supply of labour
Wage rate, population, skills, working conditions, migration.

## Wage determination
- **Competitive market**: wage set by demand and supply
- **Monopsony**: lower wage and employment
- **Trade unions**: collective bargaining raises wages
- **Minimum wage**: effect depends on market structure

## Economic rent and transfer earnings
- **Transfer earnings**: minimum to keep the worker in the job
- **Economic rent**: anything above that (top footballers earn mostly rent)

> Exam tip: in monopsony, a minimum wage can raise *both* wages and employment.`,
`## Government failure
When intervention makes resource allocation **worse**.

## Causes
- **Information gaps**: not knowing the true size of an externality
- **Unintended consequences**: black markets, tax evasion
- **Administrative costs**
- **Conflicting objectives**
- **Political pressure** (short-termism, lobbying)
- **Regulatory capture**
- **Moral hazard**

## Examples
Agricultural price support creating surpluses, rent controls cutting housing supply.

> Exam tip: always consider whether the cure might be worse than the disease.`]
    },
    { n: "9", t: "The macroeconomy",
      parts: ["9.1 The circular flow of income", "9.2 Economic growth and sustainability", "9.3 Employment/unemployment", "9.4 Money and banking"],
      q: [
        ["If the marginal propensity to withdraw is 0.25, the multiplier is…", ["4", "0.25", "1.33", "2.5"], 0, "Multiplier = 1 ÷ MPW = 1 ÷ 0.25 = 4."],
        ["The accelerator theory links investment to…", ["The rate of change of national income", "The level of interest rates only", "The exchange rate", "Government borrowing"], 0, "Firms invest more when demand is growing faster."],
        ["Which is a limitation of using GDP to compare living standards?", ["It ignores the informal economy and inequality", "It is measured in money", "It includes all output", "It adjusts for inflation"], 0, "GDP can mislead about real well-being."],
        ["The Human Development Index combines…", ["Income, education and life expectancy", "GDP and inflation", "Exports and imports", "Unemployment and inflation"], 0, "HDI is a broader measure of development."],
        ["The natural rate of unemployment is…", ["Unemployment when the labour market is in equilibrium", "Zero unemployment", "Cyclical unemployment only", "Unemployment during a recession"], 0, "It consists of frictional and structural unemployment."],
        ["Broad money includes…", ["Notes, coins and bank deposits", "Only notes and coins", "Only bank reserves", "Government bonds"], 0, "Broad money adds bank deposits to narrow money."],
        ["The quantity theory of money is…", ["MV = PT", "AD = C + I + G + (X − M)", "Y = C + S", "P = MC"], 0, "Monetarists argue increases in M cause rises in P if V and T are stable."],
        ["Keynes' liquidity preference theory says demand for money depends on…", ["Transactions, precautionary and speculative motives", "Exports only", "Supply of bonds", "Inflation only"], 0, "Speculative demand is inversely related to interest rates."]],
      notes: [
`## The multiplier
An injection leads to a **larger final rise** in national income.
**Multiplier (k) = 1 ÷ MPW = 1 ÷ (MPS + MPT + MPM)**

Example: MPW = 0.2 → k = 5. A $10m injection raises income by $50m.

## Consumption and saving
- **APC = C ÷ Y**, **MPC = ΔC ÷ ΔY**
- Consumption depends on income, wealth, interest rates, confidence

## The accelerator
Investment depends on the **rate of change** of output. Causes volatile investment.

## Equilibrium income
Where **AE = output** or **J = W**. Inflationary and deflationary gaps compare equilibrium with full employment.

> Exam tip: the multiplier works in reverse too.`,
`## Measuring growth and development
| Measure | Includes |
|---|---|
| **GDP per capita** | Income |
| **HDI** | Income, education, life expectancy |
| **MEW** | Adjusts output for leisure, pollution and household work |
| **MPI** | Multidimensional Poverty Index: health, education, living standards |

## Sustainability
Growth that does not damage future generations' ability to meet needs (renewable energy, resource management).

## Costs of growth
Pollution, resource depletion, inequality, urban congestion.

## Comparing countries
Differences in data accuracy, informal economies, PPP, distribution, non-monetary factors.

> Exam tip: evaluate whether GDP growth always means higher living standards.`,
`## Labour market measures
- **Labour force** = employed + unemployed
- **Participation rate** = labour force ÷ working-age population
- **Unemployment rate** = unemployed ÷ labour force

## Natural rate of unemployment
Frictional + structural. Cannot be removed by raising AD.

## Policies
| Type of unemployment | Policy |
|---|---|
| Cyclical | Expansionary fiscal/monetary |
| Structural | Training, relocation subsidies |
| Frictional | Better job information |

## Phillips curve (short run)
Trade-off between inflation and unemployment. In the long run (monetarist view) it is vertical at the natural rate.

> Exam tip: explain why the long-run Phillips curve may be vertical.`,
`## Functions of money
Medium of exchange, store of value, unit of account, standard of deferred payment.

## Money supply
- **Narrow**: notes and coins
- **Broad**: plus bank deposits

**Credit creation**: banks lend a proportion of deposits.
**Credit multiplier = 1 ÷ reserve ratio**

## Demand for money (Keynes)
Transactions, precautionary, speculative (inversely related to interest rates).

## Quantity theory
**MV = PT**. If V and T are constant, more money → higher prices.

## Central bank roles
Issue currency, bank to the government and banks, lender of last resort, monetary policy.

> Exam tip: contrast Keynesian and monetarist views on money.`]
    },
    { n: "10", t: "Government macroeconomic intervention",
      parts: ["10.1 Government macroeconomic policy objectives", "10.2 Links between macroeconomic problems and their interrelatedness", "10.3 Effectiveness of policy options to meet all macroeconomic objectives"],
      q: [
        ["Stagflation is…", ["High inflation combined with high unemployment", "Low inflation and low unemployment", "Fast growth and falling prices", "A budget surplus"], 0, "It is often caused by supply shocks such as oil price rises."],
        ["The short-run Phillips curve shows…", ["An inverse relationship between inflation and unemployment", "A positive link between inflation and growth", "No relationship", "Exchange rates against interest rates"], 0, "Lower unemployment tends to come with higher inflation in the short run."],
        ["Which pair of objectives is most likely to conflict in the short run?", ["Low unemployment and low inflation", "Growth and low unemployment", "Low inflation and a stable currency", "Growth and higher tax revenue"], 0, "Raising AD to cut unemployment can raise inflation."],
        ["Crowding out happens when…", ["Government borrowing raises interest rates and reduces private investment", "Exports fall", "Consumers save more", "Taxes fall"], 0, "Private spending is displaced by public spending."],
        ["Which policy combination might reduce inflation without increasing unemployment much?", ["Supply-side policies", "Higher interest rates alone", "Cutting government spending", "Higher indirect taxes"], 0, "Raising capacity lowers cost pressures while supporting output."],
        ["A time lag in policy means that…", ["The effect occurs long after the decision", "Policies act immediately", "Policies always fail", "Interest rates can't change"], 0, "Lags make it hard to fine-tune the economy."],
        ["Monetarists believe that in the long run…", ["Unemployment returns to the natural rate", "Fiscal policy always works", "Inflation does not matter", "AD has a permanent effect on output"], 0, "The long-run Phillips curve is vertical at the natural rate."],
        ["Which is a possible consequence of a large budget deficit?", ["Rising national debt and interest payments", "Falling interest rates", "A current account surplus", "Lower government borrowing"], 0, "Deficits must be financed by borrowing."]],
      notes: [
`## The objectives revisited
Growth, low unemployment, low inflation, balance of payments stability, redistribution, sustainability.

## Trade-offs
- **Inflation vs unemployment**: Phillips curve
- **Growth vs current account**: imports rise with income
- **Growth vs environment**
- **Low inflation vs exports**: higher interest rates raise the exchange rate

> Exam tip: use a specific country example if you can.`,
`## Interrelatedness
- High inflation → loss of competitiveness → current account deficit
- Recession → unemployment → budget deficit (automatic stabilisers)
- Exchange rate falls → imported inflation

## Phillips curve
- **Short run**: inverse relationship
- **Long run** (monetarist): vertical at the natural rate; expectations adjust

## Stagflation
Supply shocks shift SRAS left: inflation and unemployment rise together. Policy dilemma: stimulus worsens inflation, contraction worsens unemployment.

> Exam tip: use AD/AS diagrams to show how one problem leads to another.`,
`## Comparing policy options
| Policy | Strengths | Weaknesses |
|---|---|---|
| Fiscal | Targeted, multiplier | Time lags, crowding out, debt |
| Monetary | Flexible, independent bank | Time lags, rates near zero |
| Supply-side | Long-term growth without inflation | Slow, costly |
| Exchange rate | Affects trade quickly | Inflation, retaliation |

## Factors affecting effectiveness
Spare capacity, confidence, size of multiplier, global conditions, policy credibility.

## Policy mix
Governments combine policies: e.g. loose fiscal with tight monetary.

> Exam tip: a strong essay concludes which policy is *most* effective in a *given* context.`]
    },
    { n: "11", t: "International economic issues",
      parts: ["11.1 Policies to correct disequilibrium in the balance of payments", "11.2 Exchange rates", "11.3 Economic development", "11.4 Characteristics of countries at different levels of development", "11.5 Relationship between countries at different levels of development", "11.6 Globalisation"],
      q: [
        ["The Marshall-Lerner condition states that a depreciation will improve the current account if…", ["The sum of PEDs for exports and imports is greater than 1", "Exports are inelastic", "Imports are perfectly inelastic", "Inflation is zero"], 0, "Demand must be elastic enough for volumes to respond to price changes."],
        ["The J-curve shows that after a depreciation, the current account…", ["Worsens first, then improves", "Improves immediately and permanently", "Never improves", "Improves first, then worsens"], 0, "Demand is inelastic in the short run, so the trade balance worsens first."],
        ["Purchasing power parity theory suggests exchange rates adjust to…", ["Equalise the prices of identical goods across countries", "Equalise interest rates", "Maximise exports", "Eliminate tariffs"], 0, "In the long run currencies should buy the same basket everywhere."],
        ["Which is a typical characteristic of a developing economy?", ["A large share of employment in the primary sector", "Low population growth", "A high HDI", "A large service sector"], 0, "Many developing countries rely heavily on agriculture and raw materials."],
        ["Foreign direct investment is…", ["A firm investing in production facilities abroad", "Buying foreign currency", "Foreign aid", "Importing goods"], 0, "FDI involves ownership and control of assets in another country."],
        ["Which is a criticism of globalisation?", ["It can increase inequality and exploit low-wage workers", "It always lowers prices", "It increases competition", "It spreads technology"], 0, "Gains are not always evenly shared."],
        ["Which body promotes free trade and settles trade disputes?", ["World Trade Organization", "International Monetary Fund", "World Bank", "OPEC"], 0, "The WTO enforces trade rules between members."],
        ["A dependency ratio measures…", ["Non-working population relative to working population", "Exports relative to imports", "Debt relative to GDP", "Aid relative to income"], 0, "A high ratio places pressure on the working population."]],
      notes: [
`## Correcting imbalances
| Approach | Examples |
|---|---|
| **Expenditure-switching** | Depreciation, tariffs, quotas |
| **Expenditure-reducing** | Higher taxes, higher interest rates |
| **Supply-side** | Productivity, innovation |

## Marshall-Lerner condition
A depreciation improves the current account only if **PED(X) + PED(M) > 1**.

## J-curve
In the short run, demand is inelastic so the balance **worsens** before improving.

## Surpluses
Persistent surpluses can also cause problems: inflationary pressure, currency appreciation, trade tensions.

> Exam tip: discuss time frames and elasticities when evaluating depreciation.`,
`## Exchange rate determination
Demand for a currency comes from exports, inward investment and speculation. Supply from imports and outward investment.

## Systems compared
| System | Pros | Cons |
|---|---|---|
| **Floating** | Automatic adjustment, independent monetary policy | Volatility, uncertainty |
| **Fixed** | Certainty, discipline | Needs reserves, loses monetary independence |
| **Managed** | Balance of both | Can be hard to judge |

## Purchasing power parity
Currencies adjust so identical goods cost the same across countries (Big Mac index).

## Effects of changes
On inflation, growth, employment and the current account.

> Exam tip: an appreciation can reduce inflation but harm exporters.`,
`## Growth vs development
- **Growth**: increase in real output
- **Development**: improvement in living standards, health, education, freedom

## Indicators
- **HDI**: income, education, life expectancy
- **MPI** (Multidimensional Poverty Index): health, education, living standards
- **Other**: infant mortality, literacy, access to clean water

## Barriers to development
Poor infrastructure, low savings and investment, corruption, debt, reliance on primary products, rapid population growth.

> Exam tip: compare HDI and GDP per capita to show why one measure isn't enough.`,
`## Typical characteristics
| Feature | Developing | Developed |
|---|---|---|
| Population growth | High | Low |
| Main sector | Primary | Tertiary |
| Income per head | Low | High |
| Urbanisation | Rapid | High, stable |
| Dependency | Young population | Ageing population |

## Population issues
- **Dependency ratio** = dependants ÷ working-age
- Birth and death rates, migration
- Demographic transition model

## Employment
Large informal economy, underemployment.

> Exam tip: use data in the question to identify characteristics.`,
`## Trade and aid
- **Trade**: export earnings fund development, but dependency on primary products and falling terms of trade
- **Aid**: bilateral, multilateral, tied vs untied. Can help but may cause dependency

## FDI and multinationals
**Benefits**: jobs, technology, tax revenue, skills.
**Costs**: profit repatriation, exploitation, environmental damage, influence over policy.

## External debt
Debt servicing diverts resources. Debt relief can help but risks moral hazard.

## International organisations
IMF (financial stability), World Bank (development loans), WTO (trade rules).

> Exam tip: evaluate aid and FDI using the host country's perspective.`,
`## Globalisation
The increasing **integration** of economies through trade, capital flows, technology and people.

## Drivers
Lower transport and communication costs, trade liberalisation, multinationals, technology.

## Benefits
Specialisation, economies of scale, lower prices, technology transfer, growth.

## Costs
Inequality, loss of jobs in high-cost countries, environmental damage, cultural loss, financial contagion.

## Trading blocs
| Type | Features |
|---|---|
| Free trade area | No internal tariffs |
| Customs union | Plus common external tariff |
| Common market | Plus free movement of factors |
| Economic/monetary union | Plus common currency/policy |

> Exam tip: distinguish **trade creation** and **trade diversion**.`]
    }
  ]
};

export default [AS, A];
