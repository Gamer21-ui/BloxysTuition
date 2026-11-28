-- O Level Business 7081 update (28 Nov 2026): notes filled in for the 2027 syllabus, formula list, 16 new questions.
-- Paste into Supabase > SQL Editor > Run. Safe to run more than once. Notes you edited yourself are NOT overwritten.
-- Part 3 of 3. Run the parts in order.
begin;
update parts set body = '## Business and the international economy
**Globalisation**: increasing links between countries through trade, investment, technology and travel.

**Opportunities**: bigger markets, cheaper supplies, and producing abroad. **Threats**: foreign competition, and the need to adapt to other cultures.

## Multinational companies (MNCs)
Operate in more than one country.
| Benefits to the host country | Drawbacks to the host country |
|---|---|
| Jobs and training | Profits sent home |
| Investment, technology | Local firms may be forced out |
| Tax revenue, exports | Use of resources, environmental damage |

## Protectionism
**Tariffs** (taxes on imports), **quotas** (limits), **subsidies** to local firms. It protects local jobs, but raises prices and limits choice.

## External costs and benefits
Business decisions affect third parties. **External costs**: pollution, congestion, noise (e.g. a new factory). **External benefits**: jobs, training, better roads. (See 6.3 for how governments control external costs.)

## Exchange rates
- **Appreciation**: exports dearer, imports cheaper
- **Depreciation**: exports cheaper, imports dearer

> Exam tip: work out an exchange-rate effect with a quick calculation (e.g. $10 at Rs45 = Rs450).' where id = '626a3898-eb5e-5dde-af31-67462ca97c08' and (body is null or body = '## Business and the international economy
**Globalisation**: increasing links between countries through trade, investment, technology and travel.

**Opportunities**: bigger markets, cheaper supplies, and producing abroad. **Threats**: foreign competition, and the need to adapt to other cultures.

## Multinational companies (MNCs)
Operate in more than one country.
| Benefits to the host country | Drawbacks to the host country |
|---|---|
| Jobs and training | Profits sent home |
| Investment, technology | Local firms may be forced out |
| Tax revenue, exports | Use of resources, environmental damage |

## Protectionism
**Tariffs** (taxes on imports), **quotas** (limits), **subsidies** to local firms. It protects local jobs, but raises prices and limits choice.

## Exchange rates
- **Appreciation**: exports dearer, imports cheaper
- **Depreciation**: exports cheaper, imports dearer

> Exam tip: work out an exchange-rate effect with a quick calculation (e.g. $10 at Rs45 = Rs450).');
insert into questions (id, course_id, chapter_id, quiz_id, prompt, options, explanation) values ('e984028a-4844-50ea-ade2-eeb6fb04d1a1', 'e4b4abea-0bf2-5180-affe-2a0ac83e65e7', 'f4c81869-c3cc-50d3-a177-dabf0bad1718', '904d6d01-c7b4-5c32-aef2-186694669f10', 'What is a social enterprise?', '["A business owned by its customers who share the profits","A business owned and run by the government for the public","A business that is not allowed to make any profit at all","A business with social or environmental aims as well as profit"]'::jsonb, 'Social enterprises trade like normal businesses but also aim to help society or the environment. They can make a profit.') on conflict (id) do update set prompt = excluded.prompt, explanation = excluded.explanation;
insert into question_keys (question_id, correct) values ('e984028a-4844-50ea-ade2-eeb6fb04d1a1', 3) on conflict (question_id) do nothing;
insert into questions (id, course_id, chapter_id, quiz_id, prompt, options, explanation) values ('01040393-478f-50f3-a4f0-b1043117a83a', 'e4b4abea-0bf2-5180-affe-2a0ac83e65e7', 'f4c81869-c3cc-50d3-a177-dabf0bad1718', '904d6d01-c7b4-5c32-aef2-186694669f10', 'Which stakeholder mainly wants loans repaid on time with interest?', '["Lenders such as banks","The local community","Customers of the business","Employees of the business"]'::jsonb, 'Lenders are external stakeholders whose main objective is getting their money back with interest.') on conflict (id) do update set prompt = excluded.prompt, explanation = excluded.explanation;
insert into question_keys (question_id, correct) values ('01040393-478f-50f3-a4f0-b1043117a83a', 0) on conflict (question_id) do nothing;
insert into questions (id, course_id, chapter_id, quiz_id, prompt, options, explanation) values ('0293021f-2d35-57ce-aec4-06c166527eed', 'e4b4abea-0bf2-5180-affe-2a0ac83e65e7', 'd85278ab-73c3-5282-a46a-813d3130834d', 'bbcbecad-5dfa-500e-aebc-dc33eeb82e66', 'Which is a benefit of an employment contract for the worker?', '["Their pay, hours and duties are clearly set out","They no longer need any training from the business","They can never be made redundant by the business","They can choose their own working hours each day"]'::jsonb, 'A contract sets out the terms of the job, so both sides know their rights and duties.') on conflict (id) do update set prompt = excluded.prompt, explanation = excluded.explanation;
insert into question_keys (question_id, correct) values ('0293021f-2d35-57ce-aec4-06c166527eed', 0) on conflict (question_id) do nothing;
insert into questions (id, course_id, chapter_id, quiz_id, prompt, options, explanation) values ('008d2d12-4972-5662-a6df-d8e1697145ab', 'e4b4abea-0bf2-5180-affe-2a0ac83e65e7', 'd85278ab-73c3-5282-a46a-813d3130834d', 'bbcbecad-5dfa-500e-aebc-dc33eeb82e66', 'Why might a business reduce its workforce (downsize)?', '["It wants to raise its spans of control","It has automated part of its production","It has just won a large new order","Its employees are highly motivated"]'::jsonb, 'Automation, falling demand and cost-cutting are the main reasons for downsizing.') on conflict (id) do update set prompt = excluded.prompt, explanation = excluded.explanation;
insert into question_keys (question_id, correct) values ('008d2d12-4972-5662-a6df-d8e1697145ab', 1) on conflict (question_id) do nothing;
insert into questions (id, course_id, chapter_id, quiz_id, prompt, options, explanation) values ('fd610d2c-d8a9-5bef-a92a-c08159d545e3', 'e4b4abea-0bf2-5180-affe-2a0ac83e65e7', 'd85278ab-73c3-5282-a46a-813d3130834d', 'bbcbecad-5dfa-500e-aebc-dc33eeb82e66', 'What is a disadvantage of using social media to communicate with customers?', '["Mistakes are public and spread very fast","It is always slower than writing a letter","It cannot reach customers outside the area","Customers have no way to reply to it"]'::jsonb, 'Social media is fast, cheap and two-way, but a mistake or complaint can spread publicly in minutes.') on conflict (id) do update set prompt = excluded.prompt, explanation = excluded.explanation;
insert into question_keys (question_id, correct) values ('fd610d2c-d8a9-5bef-a92a-c08159d545e3', 0) on conflict (question_id) do nothing;
insert into questions (id, course_id, chapter_id, quiz_id, prompt, options, explanation) values ('195e9b61-ee93-58a2-a485-6ad78d1dafcb', 'e4b4abea-0bf2-5180-affe-2a0ac83e65e7', 'd85278ab-73c3-5282-a46a-813d3130834d', 'bbcbecad-5dfa-500e-aebc-dc33eeb82e66', 'Which is an example of flexible working?', '["Working some days from home","Being paid a fixed monthly salary","Receiving a bonus for good sales","Moving between tasks on the line"]'::jsonb, 'Flexible working includes flexi-time, working from home and job sharing. Job rotation is a motivation method.') on conflict (id) do update set prompt = excluded.prompt, explanation = excluded.explanation;
insert into question_keys (question_id, correct) values ('195e9b61-ee93-58a2-a485-6ad78d1dafcb', 0) on conflict (question_id) do nothing;
insert into questions (id, course_id, chapter_id, quiz_id, prompt, options, explanation) values ('c9387396-0ed4-550f-ae23-676b694ff9e3', 'e4b4abea-0bf2-5180-affe-2a0ac83e65e7', '4a6917c9-553e-55e8-aa82-87402390ef15', '0944761e-b220-5635-aeec-975153efb1f8', 'A ride-sharing app charges more when demand is high. Which pricing strategy is this?', '["Competitive pricing","Cost-plus pricing","Dynamic pricing","Penetration pricing"]'::jsonb, 'Dynamic pricing changes the price in real time according to demand, as with flights, hotels and ride apps.') on conflict (id) do update set prompt = excluded.prompt, explanation = excluded.explanation;
insert into question_keys (question_id, correct) values ('c9387396-0ed4-550f-ae23-676b694ff9e3', 2) on conflict (question_id) do nothing;
insert into questions (id, course_id, chapter_id, quiz_id, prompt, options, explanation) values ('9ff5992d-e09f-5def-a04a-38890b04a8b9', 'e4b4abea-0bf2-5180-affe-2a0ac83e65e7', '4a6917c9-553e-55e8-aa82-87402390ef15', '0944761e-b220-5635-aeec-975153efb1f8', 'Which is an advantage of ecommerce for customers?', '["They pay no money until the business has made a profit","They never have to wait for any delivery to arrive","They can compare prices easily and shop at any time","They can always touch and try products before buying"]'::jsonb, 'Online shopping is convenient and makes price comparison easy, but customers can''t try products first and must wait for delivery.') on conflict (id) do update set prompt = excluded.prompt, explanation = excluded.explanation;
insert into question_keys (question_id, correct) values ('9ff5992d-e09f-5def-a04a-38890b04a8b9', 2) on conflict (question_id) do nothing;
insert into questions (id, course_id, chapter_id, quiz_id, prompt, options, explanation) values ('76712802-a20c-56e5-aa85-dc23d08a38ba', 'e4b4abea-0bf2-5180-affe-2a0ac83e65e7', '4a6917c9-553e-55e8-aa82-87402390ef15', '0944761e-b220-5635-aeec-975153efb1f8', 'What is a disadvantage of entering a new overseas market?', '["Different laws, language and culture","It allows growth when home sales stop","It gives access to more customers","It spreads the business''s risks"]'::jsonb, 'Overseas markets bring more customers and spread risk, but differences in laws, language and culture make it harder.') on conflict (id) do update set prompt = excluded.prompt, explanation = excluded.explanation;
insert into question_keys (question_id, correct) values ('76712802-a20c-56e5-aa85-dc23d08a38ba', 0) on conflict (question_id) do nothing;
insert into questions (id, course_id, chapter_id, quiz_id, prompt, options, explanation) values ('b8572082-823f-546b-a84a-db5dff798aad', 'e4b4abea-0bf2-5180-affe-2a0ac83e65e7', 'acfcb10e-2017-5def-aeb1-7d978feeb433', 'b1843aa4-56cf-5714-a55a-5d14084a03e9', 'What is 3D printing in production?', '["Using three machines in a row to make each product","Building a product layer by layer from a digital design","Printing three copies of every design for the factory","Designing products on paper before making them by hand"]'::jsonb, '3D printing builds objects layer by layer from a computer design. It suits prototypes and customised products.') on conflict (id) do update set prompt = excluded.prompt, explanation = excluded.explanation;
insert into question_keys (question_id, correct) values ('b8572082-823f-546b-a84a-db5dff798aad', 1) on conflict (question_id) do nothing;
insert into questions (id, course_id, chapter_id, quiz_id, prompt, options, explanation) values ('9a14642c-54ea-5c77-ab05-aa7fa408398b', 'e4b4abea-0bf2-5180-affe-2a0ac83e65e7', 'acfcb10e-2017-5def-aeb1-7d978feeb433', 'b1843aa4-56cf-5714-a55a-5d14084a03e9', 'Which is an example of reusing in sustainable production?', '["Burning waste to get rid of it","Using more packaging for safety","Refilling customers'' own bottles","Moving the factory to a cheaper area"]'::jsonb, 'Reusing means using items again, such as refill schemes. Reducing, reusing and recycling all cut waste.') on conflict (id) do update set prompt = excluded.prompt, explanation = excluded.explanation;
insert into question_keys (question_id, correct) values ('9a14642c-54ea-5c77-ab05-aa7fa408398b', 2) on conflict (question_id) do nothing;
insert into questions (id, course_id, chapter_id, quiz_id, prompt, options, explanation) values ('8857b725-1d70-56b9-ad1e-debe57b6b2dd', 'e4b4abea-0bf2-5180-affe-2a0ac83e65e7', 'acfcb10e-2017-5def-aeb1-7d978feeb433', 'b1843aa4-56cf-5714-a55a-5d14084a03e9', 'What is the difference between mechanisation and automation?', '["Automation helps workers; mechanisation needs no human input","Mechanisation is used in services; automation only on farms","Mechanisation helps workers; automation needs little human input","There is no difference: both mean using robots for everything"]'::jsonb, 'With mechanisation, workers still operate the machines. With automation, machines do the job with little human input.') on conflict (id) do update set prompt = excluded.prompt, explanation = excluded.explanation;
insert into question_keys (question_id, correct) values ('8857b725-1d70-56b9-ad1e-debe57b6b2dd', 2) on conflict (question_id) do nothing;
insert into questions (id, course_id, chapter_id, quiz_id, prompt, options, explanation) values ('f931faa4-c8e9-5772-af5a-6a08168c8edb', 'e4b4abea-0bf2-5180-affe-2a0ac83e65e7', 'e645c134-7320-552e-a820-0ae824153b0c', '1a56a715-38e1-551e-a307-65dccf8ba076', 'What is venture capital?', '["Money from investors in risky new firms, for a share of ownership","Money raised by selling assets the business no longer needs","A long-term bank loan that is repaid with a fixed interest rate","Profit that is kept in the business instead of paid to owners"]'::jsonb, 'Venture capitalists invest in new, risky businesses in return for part-ownership.') on conflict (id) do update set prompt = excluded.prompt, explanation = excluded.explanation;
insert into question_keys (question_id, correct) values ('f931faa4-c8e9-5772-af5a-6a08168c8edb', 0) on conflict (question_id) do nothing;
insert into questions (id, course_id, chapter_id, quiz_id, prompt, options, explanation) values ('0cc460ce-6762-5286-ad8b-4082b7a545bf', 'e4b4abea-0bf2-5180-affe-2a0ac83e65e7', 'e645c134-7320-552e-a820-0ae824153b0c', '1a56a715-38e1-551e-a307-65dccf8ba076', 'Equity is $60 000 and non-current liabilities are $40 000. What is the capital employed?', '["$60 000","$100 000","$40 000","$20 000"]'::jsonb, 'Capital employed = equity + non-current liabilities = $60 000 + $40 000 = $100 000.') on conflict (id) do update set prompt = excluded.prompt, explanation = excluded.explanation;
insert into question_keys (question_id, correct) values ('0cc460ce-6762-5286-ad8b-4082b7a545bf', 1) on conflict (question_id) do nothing;
insert into questions (id, course_id, chapter_id, quiz_id, prompt, options, explanation) values ('f3c2e067-4d5d-52cd-ac27-fe5901e00fc4', 'e4b4abea-0bf2-5180-affe-2a0ac83e65e7', 'e645c134-7320-552e-a820-0ae824153b0c', '1a56a715-38e1-551e-a307-65dccf8ba076', 'Profit is $15 000 and capital employed is $100 000. What is the ROCE?', '["1.5%","6.7%","15%","85%"]'::jsonb, 'ROCE = profit ÷ capital employed × 100 = 15 000 ÷ 100 000 × 100 = 15%.') on conflict (id) do update set prompt = excluded.prompt, explanation = excluded.explanation;
insert into question_keys (question_id, correct) values ('f3c2e067-4d5d-52cd-ac27-fe5901e00fc4', 2) on conflict (question_id) do nothing;
insert into questions (id, course_id, chapter_id, quiz_id, prompt, options, explanation) values ('8154ed3e-9e93-58a4-a1bd-6416d4ee661c', 'e4b4abea-0bf2-5180-affe-2a0ac83e65e7', 'b482d586-3417-5d4e-a2b0-bb5c0cac4090', '42a85e8c-ef58-57d9-af58-90a23dce0205', 'Which is an external cost of building a new factory?', '["New jobs created for local people","Higher wages paid to the factory workers","More profit for the factory''s owners","More traffic and noise for local people"]'::jsonb, 'External costs fall on third parties, such as local residents suffering noise, traffic and pollution. New jobs are an external benefit.') on conflict (id) do update set prompt = excluded.prompt, explanation = excluded.explanation;
insert into question_keys (question_id, correct) values ('8154ed3e-9e93-58a4-a1bd-6416d4ee661c', 3) on conflict (question_id) do nothing;
update courses set description = 'Replaces Business Studies 7115 from 2027. Paper 1: short answer and data response, 4 questions (1h30, 50%). Paper 2: case study, 4 questions (1h30, 50%). Application now carries more marks: always use the case. Full formula list in 5.5.' where slug = 'o-business';
commit;
