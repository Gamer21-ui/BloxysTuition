"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sfx, unlock } from "@/lib/battle-audio";
import { cn } from "@/lib/utils";
import { CheatSheet, ResultScreen, StartScreen, type Lesson } from "./shared";

/**
 * Topic 5 · the internet and its uses. Rounds:
 *  INBOX:   a message arrives. Legit or scam? (then the clues are revealed)
 *  NAME:    a description → name it (threats, protections, web basics)
 * All companies are made up.
 */
type Msg = { from: string; subject: string; body: string; link?: string; scam: boolean; clues: string };
const INBOX: Msg[] = [
  { from: "security@maur1bank-alerts.com", subject: "URGENT: your account will be closed in 24 hours", body: "Click below and log in now to keep your account open.", link: "http://maur1bank-verify.xyz/login", scam: true,
    clues: "misspelt sender (maur1bank with a 1), urgency, a link asking you to log in, and http not https" },
  { from: "noreply@mauribank.mu", subject: "Your monthly statement is ready", body: "Open the MauriBank app as usual to view it. We will never ask for your password by email.", scam: false,
    clues: "the official domain, no link to log in, no urgency, and it tells you to use the app you already trust" },
  { from: "prizes@winner-mu.top", subject: "You've won a FREE phone!!!", body: "Just pay the Rs 99 delivery fee here to claim it.", link: "http://bit.ly/fr33-phone", scam: true,
    clues: "too good to be true, a fee to 'claim' a prize, a hidden shortened link, and a strange domain" },
  { from: "support@quickship-mu.info", subject: "Dear Customer, delivery failed", body: "Kindly confirm you're card number and PIN to rebook.", link: "http://quickship-mu.info/pay", scam: true,
    clues: "generic greeting, spelling mistakes ('you're card'), and no real company ever asks for your PIN" },
  { from: "tracking@quickship.mu", subject: "Parcel QS-48213 arrives tomorrow, 9–12", body: "No action needed. You can track it in your QuickShip account.", scam: false,
    clues: "your real parcel number, the official domain, and no payment or details requested" },
  { from: "headteacher.school2026@gmail.com", subject: "Need a favour quickly", body: "I'm in a meeting. Buy 5 gift cards and send me the codes, I'll pay you back.", scam: true,
    clues: "a personal email address pretending to be the headteacher, pressure, and gift cards: classic social engineering" },
  { from: "it-help@campus.edu.mu", subject: "Your password was changed", body: "If this wasn't you, call the IT desk using the number on the college website.", scam: false,
    clues: "it doesn't contain a login link, and it sends you to an official contact you look up yourself" },
  { from: "admin@streambox-billing.net", subject: "Payment failed: update your details", body: "Your subscription is suspended. Re-enter your card here within 2 hours.", link: "http://streambox-billing.net/update", scam: true,
    clues: "a time limit, a request for card details by link, and a domain that isn't the company's real one" },
];
type Fam = { label: string; items: { name: string; text: string }[] };
const FAMS: Fam[] = [
  { label: "Name the threat", items: [
    { name: "Brute-force attack", text: "Trying every possible password combination until one works." },
    { name: "Data interception", text: "Stealing data while it's being transmitted, e.g. packet sniffing on public Wi-Fi." },
    { name: "DDoS attack", text: "Flooding a web server with requests from many infected computers so real users can't get in." },
    { name: "Virus", text: "Malware attached to a file that needs the user to run it before it can spread." },
    { name: "Worm", text: "Malware that copies itself across a network by itself, with no user action." },
    { name: "Trojan horse", text: "Malware disguised as useful software that the user installs willingly." },
    { name: "Spyware", text: "Secretly records what you type (keystrokes) and sends it to a third party." },
    { name: "Ransomware", text: "Encrypts your files and demands payment for the key to unlock them." },
    { name: "Pharming", text: "Malicious code redirects you to a fake website even when you type the correct address." },
    { name: "Social engineering", text: "Manipulating people into giving away information, e.g. pretending to be IT support on the phone." },
    { name: "Adware", text: "Floods you with unwanted adverts and can redirect your browser." },
  ] },
  { label: "Name the protection", items: [
    { name: "Firewall", text: "Monitors traffic in and out of a network and blocks anything that breaks its rules." },
    { name: "Anti-malware", text: "Scans files and quarantines or deletes viruses and other malware." },
    { name: "Two-step verification", text: "After the password, a code is sent to your phone to confirm it's really you." },
    { name: "Biometrics", text: "Uses a fingerprint or face recognition to check who the user is." },
    { name: "SSL/TLS", text: "Encrypts data between the browser and the web server; you see a padlock and https." },
    { name: "Proxy server", text: "Sits between users and the internet, hiding their IP address and filtering requests." },
    { name: "Access levels", text: "Each user can only see or change the data they need for their job." },
    { name: "Automatic updates", text: "Installs security patches as soon as they're released." },
  ] },
  { label: "Name it", items: [
    { name: "DNS", text: "Turns a domain name like shop.mu into an IP address." },
    { name: "HTTPS", text: "The secure protocol for transferring web pages, using SSL/TLS encryption." },
    { name: "Web browser", text: "Software that renders HTML and lets you visit web pages." },
    { name: "Session cookie", text: "Deleted when the browser closes, e.g. remembers your shopping basket during one visit." },
    { name: "Persistent cookie", text: "Stays on your device after the browser closes, e.g. remembers your login for next time." },
    { name: "World Wide Web", text: "The collection of web pages and resources that you access over the internet." },
    { name: "Internet", text: "The global network of connected computers: the infrastructure itself." },
    { name: "Blockchain", text: "A shared digital ledger where each block links to the one before, so past records can't be changed." },
  ] },
];
type Round = { kind: "inbox"; msg: Msg } | { kind: "name"; label: string; text: string; answer: string; options: string[] };
const PLAN = ["inbox", "name0", "inbox", "name2", "name1", "inbox", "name0", "name2", "inbox", "name1", "name0", "inbox", "name2", "name1", "name0"];
const WIN = 12, LIVES = 3;
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

function makeRounds(): Round[] {
  const msgs = shuffle(INBOX), decks = FAMS.map((f) => shuffle(f.items));
  let mi = 0; const fi = [0, 0, 0];
  return PLAN.map((k) => {
    if (k === "inbox") return { kind: "inbox", msg: msgs[mi++ % msgs.length] };
    const f = +k.slice(4), item = decks[f][fi[f]++ % decks[f].length];
    const others = shuffle(FAMS[f].items.filter((x) => x.name !== item.name)).slice(0, 3).map((x) => x.name);
    return { kind: "name", label: FAMS[f].label, text: item.text, answer: item.name, options: shuffle([item.name, ...others]) };
  });
}

export function CyberDefender() {
  const [phase, setPhase] = useState<"start" | "play" | "done">("start");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [i, setI] = useState(0);
  const [res, setRes] = useState<null | { good: boolean; text: string }>(null);
  const [correct, setCorrect] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const r = rounds[i];

  const begin = () => { unlock(); sfx("round"); setRounds(makeRounds()); setI(0); setRes(null); setCorrect(0); setLives(LIVES); setScore(0); setStreak(0); setLessons([]); setPhase("play"); };
  function answer(v: string | boolean) {
    if (res || !r) return;
    let good: boolean, text: string, lesson: Lesson;
    if (r.kind === "inbox") {
      good = v === r.msg.scam;
      text = `${good ? "[OK]" : "[X]"} ${r.msg.scam ? "SCAM" : "LEGIT"}: ${r.msg.clues}.`;
      lesson = { wrong: `"${r.msg.subject}"`, why: `${r.msg.scam ? "scam" : "legit"}: ${r.msg.clues}` };
    } else {
      good = v === r.answer;
      text = `${good ? "[OK]" : "[X]"} ${r.answer}: ${r.text}`;
      lesson = { wrong: String(v), why: `${r.answer}: ${r.text}` };
    }
    if (good) { const s = streak + 1; setStreak(s); setCorrect((c) => c + 1); setScore((x) => x + 100 + Math.min(s, 10) * 15); sfx("correct"); }
    else { setLives((l) => l - 1); setStreak(0); setLessons((l) => [...l, lesson]); sfx("wrong"); }
    setRes({ good, text });
  }
  const next = () => { if (lives <= 0 || i + 1 >= rounds.length) { setPhase("done"); return; } setI((n) => n + 1); setRes(null); };

  if (phase === "start") return (
    <StartScreen title="CYBER DEFENDER" emoji="🛡️" onStart={begin}
      how={[
        "You run the security desk. Two kinds of round:",
        "INBOX: a message arrives. Is it LEGIT or a SCAM? The clues are shown after you decide.",
        "NAME: a description of a threat, a protection or a piece of the web. Name it.",
        `${PLAN.length} rounds, ${LIVES} lives. All companies in the game are made up.`,
      ]}
      goal={`get at least ${WIN} of ${PLAN.length} right`}
      tips={[
        "Scam signs: urgency, spelling mistakes, generic greetings, odd sender domains, asking for passwords/PIN/card details, links you didn't expect.",
        "Virus needs a user to run it. Worm spreads by itself. Trojan pretends to be useful software.",
        "Phishing = fake email. Pharming = redirected to a fake site even when you type the right address.",
        "DNS turns names into IP addresses. HTTPS = HTTP + SSL/TLS encryption.",
      ]}
      extra={<div className="rounded bg-surface2 p-2 text-left text-xs"><b>Golden rule:</b> a real company never asks for your password or PIN by email or text.</div>} />
  );
  if (phase === "done") return (
    <ResultScreen game="cyber-defender" success={lives > 0 && correct >= WIN} celebrate={lives > 0 && correct === rounds.length} score={score} onAgain={() => setPhase("start")} lessons={lessons}
      stats={[{ label: "Right", value: `${correct}/${rounds.length}` }, { label: "Score", value: String(score) }, { label: "Lives", value: String(Math.max(0, lives)) }]}
      winText={correct === rounds.length ? "Perfect defence. Nothing got past you." : `Network defended, with ${rounds.length - correct} slip${rounds.length - correct === 1 ? "" : "s"}. Check the lessons below.`}
      loseText={lives <= 0 ? "Breached! Read the lessons: they're straight out of Paper 1." : `You got ${correct}, you needed ${WIN}.`} />
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 font-mono text-sm font-bold">
        <span className="chip">RND {i + 1}/{rounds.length}</span>
        <span className={cn("chip", streak >= 3 && "text-warn")}>streak {streak}</span>
        <span className="chip">OK {correct}/{WIN}</span>
        <span className="chip">LIVES {"#".repeat(Math.max(0, lives))}{"-".repeat(LIVES - Math.max(0, lives))}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card space-y-3">
          {r.kind === "inbox" ? (<>
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted">[ inbox · 1 new message ]</div>
            <div className="space-y-1 rounded border-2 border-line bg-surface2 p-3 text-sm">
              <div><span className="text-muted">From: </span><span className="break-all font-mono">{r.msg.from}</span></div>
              <div className="font-bold">{r.msg.subject}</div>
              <div>{r.msg.body}</div>
              {r.msg.link && <div className="break-all font-mono text-accent underline">{r.msg.link}</div>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button disabled={!!res} onClick={() => answer(false)} className="btn h-auto border-good bg-good/15 py-4 font-mono text-lg">LEGIT</button>
              <button disabled={!!res} onClick={() => answer(true)} className="btn h-auto border-bad bg-bad/15 py-4 font-mono text-lg">SCAM</button>
            </div>
          </>) : (<>
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted">[ {r.label} ]</div>
            <p className="text-lg font-bold">{r.text}</p>
            <div className="grid grid-cols-2 gap-2">
              {r.options.map((o) => (
                <button key={o} disabled={!!res} onClick={() => answer(o)}
                  className={cn("btn btn-ghost h-auto py-3 normal-case", res && o === r.answer && "!border-good !bg-good/15")}>{o}</button>
              ))}
            </div>
          </>)}
        </motion.div>
      </AnimatePresence>
      {res && (
        <motion.div initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn("space-y-2 rounded-lg border-2 px-3 py-2 text-sm font-bold", res.good ? "border-good bg-good/10" : "border-bad bg-bad/10")}>
          <div>{res.text}</div>
          <button className="btn btn-primary w-full" onClick={next}>{lives <= 0 || i + 1 >= rounds.length ? "See results" : "Next →"}</button>
        </motion.div>
      )}
      <CheatSheet items={["never give a PIN/password", "check the sender domain", "virus needs you · worm doesn't", "phishing = email · pharming = redirect"]} />
    </div>
  );
}
