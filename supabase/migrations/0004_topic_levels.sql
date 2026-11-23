-- Adds a middle option for topic ratings: weak (needs work) / average / strong.
alter table student_topics drop constraint if exists student_topics_label_check;
alter table student_topics add constraint student_topics_label_check check (label in ('weak', 'average', 'strong'));
