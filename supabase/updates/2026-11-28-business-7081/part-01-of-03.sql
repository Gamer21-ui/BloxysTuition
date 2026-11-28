-- O Level Business 7081 update (28 Nov 2026): notes filled in for the 2027 syllabus, formula list, 16 new questions.
-- Paste into Supabase > SQL Editor > Run. Safe to run more than once. Notes you edited yourself are NOT overwritten.
-- Part 1 of 3. Run the parts in order.
begin;
update parts set body = '## Types of business organisation
| Type | Ownership | Liability | Key advantage | Key disadvantage |
|---|---|---|---|---|
| **Sole trader** | One person | Unlimited | Full control, keeps all profit | Hard to raise finance, unlimited liability |
| **Partnership** | 2–20 partners | Usually unlimited | More capital and skills | Disagreements, shared profit |
| **Private limited company (Ltd)** | Shareholders (shares not sold to the public) | Limited | Limited liability, more finance | Legal formalities, shares not freely sold |
| **Public limited company (plc)** | Shareholders; shares sold on the stock exchange | Limited | Can raise large amounts | Risk of takeover, published accounts |
| **Franchise** | Franchisee buys the right to use a brand | Depends | Proven brand, support | Fees and royalties, little freedom |
| **Joint venture** | Two businesses share a project | Depends | Shared costs and risks | Shared profits, possible conflicts |
| **Social enterprise** | Owners/members | Depends on legal form | Social and environmental aims as well as profit; customers like it | Profit and social aims can conflict |
| **Public corporation** | Government | n/a | Provides essential services | May be inefficient |

**Limited liability**: owners can only lose what they invested. **Unlimited liability**: personal assets can be taken to pay business debts.

> Exam tip: "recommend a type of organisation" needs advantages AND disadvantages, then a justified choice.' where id = '9bec721a-4ca6-56e7-acbf-8659f394ea23' and (body is null or body = '## Types of business organisation
| Type | Ownership | Liability | Key advantage | Key disadvantage |
|---|---|---|---|---|
| **Sole trader** | One person | Unlimited | Full control, keeps all profit | Hard to raise finance, unlimited liability |
| **Partnership** | 2–20 partners | Usually unlimited | More capital and skills | Disagreements, shared profit |
| **Private limited company (Ltd)** | Shareholders (shares not sold to the public) | Limited | Limited liability, more finance | Legal formalities, shares not freely sold |
| **Public limited company (plc)** | Shareholders; shares sold on the stock exchange | Limited | Can raise large amounts | Risk of takeover, published accounts |
| **Franchise** | Franchisee buys the right to use a brand | Depends | Proven brand, support | Fees and royalties, little freedom |
| **Joint venture** | Two businesses share a project | Depends | Shared costs and risks | Shared profits, possible conflicts |
| **Public corporation** | Government | n/a | Provides essential services | May be inefficient |

**Limited liability**: owners can only lose what they invested. **Unlimited liability**: personal assets can be taken to pay business debts.

> Exam tip: "recommend a type of organisation" needs advantages AND disadvantages, then a justified choice.');
update parts set body = '## Business objectives
- **Survival** (especially new businesses)
- **Profit** (reward for owners, finance for growth)
- **Growth** (economies of scale, market power)
- **Market share**
- **Social and environmental** goals (social enterprises: social, environmental and financial aims)

Objectives change over time, e.g. survival at first, then growth.

## Stakeholders
| Stakeholder | Main objective |
|---|---|
| Owners / shareholders | Profit, dividends, growth in value |
| Managers | Higher pay, status, growth |
| Employees | Fair pay, job security, good conditions |
| Customers | Quality, low prices, service |
| Suppliers | Regular orders, paid on time |
| Lenders (banks) | Loans repaid on time with interest |
| Government | Taxes, jobs, following the law |
| Local community | Jobs, low pollution |

**Conflicting objectives**: e.g. shareholders want lower wage costs; employees want higher pay. Expanding a factory brings jobs (community likes) but noise and pollution (community dislikes).

> Exam tip: identify the conflict, explain both sides, then suggest how the business might balance them.' where id = '12a92fb8-1fdd-5fa4-a639-754c2522441a' and (body is null or body = '## Business objectives
- **Survival** (especially new businesses)
- **Profit** (reward for owners, finance for growth)
- **Growth** (economies of scale, market power)
- **Market share**
- **Social and environmental** goals (social enterprises: social, environmental and financial aims)

Objectives change over time, e.g. survival at first, then growth.

## Stakeholders
| Stakeholder | Main objective |
|---|---|
| Owners / shareholders | Profit, dividends, growth in value |
| Managers | Higher pay, status, growth |
| Employees | Fair pay, job security, good conditions |
| Customers | Quality, low prices, service |
| Suppliers | Regular orders, paid on time |
| Government | Taxes, jobs, following the law |
| Local community | Jobs, low pollution |

**Conflicting objectives**: e.g. shareholders want lower wage costs; employees want higher pay. Expanding a factory brings jobs (community likes) but noise and pollution (community dislikes).

> Exam tip: identify the conflict, explain both sides, then suggest how the business might balance them.');
update parts set body = '## Human resource management (HRM)
HRM covers recruitment, selection, training, motivation, and dismissal or redundancy.

## Recruitment
1. Identify the vacancy → **job analysis**
2. **Job description** (duties of the job) and **person specification** (skills and qualities wanted)
3. Advertise: **internal** (cheaper, known worker, motivates staff) or **external** (new ideas, wider choice)
4. Applications (CV/application form), shortlist, interview/tests, appoint

## Employment contracts
A legal agreement between employer and employee: job title, duties, hours, pay, holidays, notice period, start date.
**Benefits**: both sides know their rights and duties, which reduces disputes; it gives the worker security.

## Training
- **Induction**: introduces new staff to the business
- **On-the-job**: learn while working (cheap, but may pick up bad habits)
- **Off-the-job**: courses away from work (expert teaching, but costly and production lost)

## Reducing the workforce
- **Dismissal**: due to the worker (misconduct, poor performance)
- **Redundancy**: the job is no longer needed (closure, automation, falling demand), usually with compensation

## Employment law
Protects against unfair dismissal and discrimination, sets minimum wages and health and safety.

> Exam tip: recommend a recruitment method using the case (e.g. internal for a manager who must know the business).' where id = '24e3f1a2-b425-5abb-a556-18fdb62c2746' and (body is null or body = '## Human resource management (HRM)
HRM covers recruitment, selection, training, motivation, and dismissal or redundancy.

## Recruitment
1. Identify the vacancy → **job analysis**
2. **Job description** (duties of the job) and **person specification** (skills and qualities wanted)
3. Advertise: **internal** (cheaper, known worker, motivates staff) or **external** (new ideas, wider choice)
4. Applications (CV/application form), shortlist, interview/tests, appoint

## Training
- **Induction**: introduces new staff to the business
- **On-the-job**: learn while working (cheap, but may pick up bad habits)
- **Off-the-job**: courses away from work (expert teaching, but costly and production lost)

## Reducing the workforce
- **Dismissal**: due to the worker (misconduct, poor performance)
- **Redundancy**: the job is no longer needed (closure, automation, falling demand), usually with compensation

## Employment law
Protects against unfair dismissal and discrimination, sets minimum wages and health and safety.

> Exam tip: recommend a recruitment method using the case (e.g. internal for a manager who must know the business).');
update parts set body = '## Organisational structure
Shows who is responsible to whom.
- **Hierarchy**: levels of authority
- **Chain of command**: the route instructions pass down
- **Span of control**: number of subordinates directly under one manager

| Tall structure | Flat structure |
|---|---|
| Many levels, narrow spans | Few levels, wide spans |
| Close supervision | More delegation and motivation |
| Slow communication | Faster communication |

## Management functions
Planning, organising, coordinating, commanding and controlling.

**Delegation**: passing authority to a subordinate. It saves managers'' time and motivates staff, but the manager stays responsible.

## Leadership styles
- **Autocratic**: leader decides alone (quick decisions, useful in a crisis, can demotivate)
- **Democratic**: staff are involved (better ideas, motivation, slower)
- **Laissez-faire**: staff decide (suits skilled, self-motivated workers)

## Flexible working and contracts
- **Full-time** vs **part-time** staff: part-time gives flexibility to cover busy periods, but less commitment and more training per hour worked.
- **Flexible working**: flexi-time, working from home, job sharing. Better work-life balance and motivation, but harder to coordinate.

## Reducing the workforce (downsizing)
Reasons: **automation**, **falling demand**, **cutting costs**. **Redundancy** = the job is no longer needed (not the worker''s fault), usually with compensation. Handle it fairly to keep remaining staff motivated.

## Trade unions
A group of workers who join together to protect their interests. Member benefits: stronger voice when negotiating pay and conditions (**collective bargaining**), legal support, help with disputes and job security.

> Exam tip: link leadership style to the situation, e.g. "laissez-faire suits a team of experienced designers".' where id = 'e9cd1805-7824-52dd-a7e6-f233c8aada98' and (body is null or body = '## Organisational structure
Shows who is responsible to whom.
- **Hierarchy**: levels of authority
- **Chain of command**: the route instructions pass down
- **Span of control**: number of subordinates directly under one manager

| Tall structure | Flat structure |
|---|---|
| Many levels, narrow spans | Few levels, wide spans |
| Close supervision | More delegation and motivation |
| Slow communication | Faster communication |

## Management functions
Planning, organising, coordinating, commanding and controlling.

**Delegation**: passing authority to a subordinate. It saves managers'' time and motivates staff, but the manager stays responsible.

## Leadership styles
- **Autocratic**: leader decides alone (quick decisions, useful in a crisis, can demotivate)
- **Democratic**: staff are involved (better ideas, motivation, slower)
- **Laissez-faire**: staff decide (suits skilled, self-motivated workers)

**Trade unions** represent workers in negotiations on pay and conditions.

> Exam tip: link leadership style to the situation, e.g. "laissez-faire suits a team of experienced designers".');
update parts set body = '## Communication
Communication: sender → message → medium → receiver → feedback.

| Method | Advantages | Disadvantages |
|---|---|---|
| Verbal (meetings, calls) | Fast, instant feedback | No permanent record |
| Written (letters, reports, email) | Permanent record, detailed | Slower, no body language |
| Visual (charts, posters) | Easy to understand | May oversimplify |
| Electronic (email, messaging, video calls) | Quick, reaches many | Information overload, needs equipment |
| **Text messages** | Instant, read quickly, good for short updates | Too short for detail, easy to miss |
| **Social media** (business pages, groups) | Reaches customers and staff fast, cheap, two-way | Public mistakes spread fast, hard to control |
| **Noticeboards** | Cheap, everyone can see it | One-way, may be ignored or out of date |

- **One-way**: no reply possible (notice board)
- **Two-way**: feedback (meeting)
- **Internal** (inside the business) vs **external** (customers, suppliers)

## Barriers and solutions
| Barrier | Solution |
|---|---|
| Jargon or language | Use clear, simple language |
| Wrong medium | Choose the right method |
| Long chain of command | Flatter structure |
| No feedback | Use two-way communication |
| Noise, distractions | Quiet setting, written follow-up |

> Exam tip: choose a method for a scenario and justify it (e.g. a meeting for bad news so questions can be asked).' where id = '10d3d840-86db-5fad-afe3-273b32a9a94f' and (body is null or body = '## Communication
Communication: sender → message → medium → receiver → feedback.

| Method | Advantages | Disadvantages |
|---|---|---|
| Verbal (meetings, calls) | Fast, instant feedback | No permanent record |
| Written (letters, reports, email) | Permanent record, detailed | Slower, no body language |
| Visual (charts, posters) | Easy to understand | May oversimplify |
| Electronic (email, messaging, video calls) | Quick, reaches many | Information overload, needs equipment |

- **One-way**: no reply possible (notice board)
- **Two-way**: feedback (meeting)
- **Internal** (inside the business) vs **external** (customers, suppliers)

## Barriers and solutions
| Barrier | Solution |
|---|---|
| Jargon or language | Use clear, simple language |
| Wrong medium | Choose the right method |
| Long chain of command | Flatter structure |
| No feedback | Use two-way communication |
| Noise, distractions | Quiet setting, written follow-up |

> Exam tip: choose a method for a scenario and justify it (e.g. a meeting for bad news so questions can be asked).');
update parts set body = '## Motivation
Motivated staff are more productive, with lower labour turnover and absenteeism.

## Theories
**Maslow''s hierarchy** (bottom to top): physiological → safety → social → esteem → self-actualisation. Meet lower needs first.

**Herzberg**: **hygiene factors** (pay, conditions, security) prevent dissatisfaction. **Motivators** (achievement, recognition, responsibility) actually motivate.

**Taylor**: workers are motivated mainly by money, so pay piece rates.

## Financial methods
Wages (time rate), **salary**, **piece rate**, **commission**, **bonus**, **profit sharing**, fringe benefits (car, discounts, health insurance).

## Non-financial methods
- **Job rotation**: moving between tasks (variety)
- **Job enlargement**: more tasks at the same level
- **Job enrichment**: more challenging, responsible work
- **Teamworking**, training, promotion, **recognition** (praise, **employee of the month**)

> Exam tip: recommend motivation methods that fit the job, e.g. commission for sales staff, piece rate for factory output.' where id = 'd65743a7-a875-58da-aa8c-1f1e20e86226' and (body is null or body = '## Motivation
Motivated staff are more productive, with lower labour turnover and absenteeism.

## Theories
**Maslow''s hierarchy** (bottom to top): physiological → safety → social → esteem → self-actualisation. Meet lower needs first.

**Herzberg**: **hygiene factors** (pay, conditions, security) prevent dissatisfaction. **Motivators** (achievement, recognition, responsibility) actually motivate.

**Taylor**: workers are motivated mainly by money, so pay piece rates.

## Financial methods
Wages (time rate), **salary**, **piece rate**, **commission**, **bonus**, **profit sharing**, fringe benefits (car, discounts, health insurance).

## Non-financial methods
- **Job rotation**: moving between tasks (variety)
- **Job enlargement**: more tasks at the same level
- **Job enrichment**: more challenging, responsible work
- **Teamworking**, training, promotion, **recognition**

> Exam tip: recommend motivation methods that fit the job, e.g. commission for sales staff, piece rate for factory output.');
commit;
