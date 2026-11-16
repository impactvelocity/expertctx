/**
 * Demo team for ExpertCTX: Pebblepath, a fictional five-person startup about
 * to launch a budgeting app for freelancers.
 *
 * The draft launch plan has gaps a launch expert would catch, and the answers
 * are spread across the team's other pages: the email list is in Mitch's
 * playbook, the real audience is in Jennifer's interviews, the pricing
 * recommendation is in Kevin's page and the scope risk is in Cassi's roadmap.
 * That's what lets the agent connect expert judgment to *this* team.
 *
 * People are the demo site's seeded users, written as {{alana}} etc. and
 * replaced with real @mentions when the user exists on the site, or plain
 * names when not. All names and the company are fictional.
 */

export const DEMO_SPACE = {
  key: 'PEBBLE',
  name: 'Pebblepath',
  description: 'Fictional demo team for ExpertCTX: a five-person startup launching a budgeting app for freelancers.',
};

export const DEMO_PEOPLE = {
  alana: { name: 'Alana Grant', role: 'Co-founder, product and launch lead' },
  kevin: { name: 'Kevin Campbell', role: 'Co-founder, pricing and partnerships' },
  mitch: { name: 'Mitch Davis', role: 'Marketing and email' },
  jennifer: { name: 'Jennifer Evans', role: 'Customer research and support' },
  cassi: { name: 'Cassi Owens', role: 'Engineering lead' },
};

export const DEMO_HOME = `Pebblepath helps freelancers set aside the right amount for taxes and know what's safe to spend, even when income is uneven.

This space holds the team's plans for the **1.0 launch**.

> This is a fictional demo team for ExpertCTX. Open a draft below, open Rovo chat, pick the ExpertCTX agent and ask for a review.

## Try it
- **Q1 Launch Plan (draft):** "Review this page with the Launch expert."
- **Onboarding redesign brief (draft):** "Review this page with the Product design expert."
- **Signup funnel and offer (draft):** "Review this page with the Funnels and offers expert."

## Team
- {{alana}}: Co-founder, product and launch lead
- {{kevin}}: Co-founder, pricing and partnerships
- {{mitch}}: Marketing and email
- {{jennifer}}: Customer research and support
- {{cassi}}: Engineering lead`;

export const DEMO_PAGES = [
  {
    title: 'Goal: Launch Pebblepath 1.0 in Q1',
    body: `Owner: {{alana}}

## Objective
Launch Pebblepath 1.0 to the public by **March 31**.

## Why now
Our 60 beta users open the app 4 times a week on average, and the "tax jar" feature is the one they talk about. January tax season pain is fresh, and we want to be the app people set up before the next quarterly payment.

## Who it's for
Freelancers, small agencies and the accountants who work with them.

## What success looks like
Lots of signups and good buzz in the freelance community.

## Budget
$8,000 for launch ads and promotion.

## Status
Planning. See **Q1 Launch Plan (draft)**.`,
  },
  {
    title: 'Q1 Launch Plan (draft)',
    body: `Owner: {{alana}}

Status: Draft, for review

## Summary
Pebblepath 1.0 goes live on **Tuesday, March 31**. We announce it everywhere on launch day and let the product speak for itself.

## Audience
Freelancers, small agencies and accountants. Accountants could recommend us to all their clients, so they're a big opportunity.

## Offer
Three plans on launch day, plus a lifetime deal for the first week:
- Solo: $9/month
- Pro: $19/month
- Agency: $49/month
- Lifetime deal: $199 one-time

## Channels
- Launch post on social media (X, LinkedIn) on March 31
- Post in launch directories and freelancer forums
- Blog post: "Introducing Pebblepath 1.0"
- Paid ads from launch day ($8k budget)

## Timeline
- February: finish bank sync and invoicing
- March 23–30: final features, bug fixes, landing page
- March 31: launch

## Tasks
- [ ] Landing page
- [ ] Social posts
- [ ] Set up ads
- [ ] Blog post
- [ ] Finish invoicing

## Metrics
Track signups after launch.

## Open questions
- Which pricing do we go with?
- Do we need a waitlist?`,
  },
  {
    title: 'Customer interviews: freelancers (Oct–Nov)',
    body: `Owner: {{jennifer}}

## Who we talked to
12 interviews: 9 solo freelancers (designers, developers, writers), 2 agency owners, 1 accountant.

## What we heard
- 8 of 9 freelancers said taxes are their biggest money worry. "Every January I panic."
- "I'd pay for something that just tells me what's safe to spend this month."
- "I never know how much to put aside, so I either hoard everything or get a scary bill."
- Freelancers in their first two years felt this most.
- Both agency owners said they already have an accountant and bookkeeping software. Not interested.
- The accountant liked the idea but said she wouldn't recommend a tool her firm hasn't vetted.

## Takeaways
- Our strongest audience is **solo freelancers in their first two years**.
- Their words: "safe to spend", "tax panic", "scary bill".
- 7 of 9 freelancers asked to be told when we launch. Their emails are in the beta sign-up sheet.`,
  },
  {
    title: 'Email playbook',
    body: `Owner: {{mitch}}

## Our list
- **The Freelance Ledger** newsletter: 340 subscribers, 48% open rate.
- A beta waitlist form exists on the blog but isn't linked from anywhere right now.
- 7 interviewees asked to hear about the launch (see Jennifer's interview notes).

## What we send today
- Weekly newsletter: one money tip for freelancers.
- Welcome email for new beta users.

## Not written yet
- Launch announcement email
- Pre-launch sequence
- Follow-up for people who sign up but don't connect a bank

## Ideas
- Turn the "tax jar" tip series into a 3-part pre-launch sequence.
- Ask beta users for a one-line quote we can use.`,
  },
  {
    title: 'Pricing options',
    body: `Owner: {{kevin}}

## Options on the table
1. Three tiers: Solo $9, Pro $19, Agency $49 (current draft plan).
2. One plan at $12/month, with a founding-member price of $8/month for anyone who joins in launch week.
3. Lifetime deal at $199.

## My view
Option 2. Interviews say our buyer is a solo freelancer, and the Agency tier has no buyer yet. A founding-member price that really ends gives people a reason to join in launch week. Lifetime deals worry me: they bring bargain hunters and cap our revenue from our best users.

## Decision
Not made yet. Needs Alana and me before the landing page is built.`,
  },
  {
    title: '1.0 scope and roadmap',
    body: `Owner: {{cassi}}

## Done
- Tax jar: set a percentage, see what's safe to spend
- Manual income and expense entry
- Monthly summary email

## In progress
- **Bank sync**: due March 27. Depends on a third-party data provider; their sandbox has been unreliable.
- **Invoicing**: due March 30. Has slipped twice.

## Risks
- If bank sync slips, launch week becomes bug-fixing week.
- Invoicing isn't something interviewees asked for.

## Proposal
Freeze scope by **March 13**. Ship 1.0 with tax jar and manual entry, and bank sync as "beta". Move invoicing to 1.1.`,
  },

  // For the Product design profile: an onboarding brief that front-loads the
  // risky bank connection and tours features instead of showing a result.
  {
    title: 'Onboarding redesign brief (draft)',
    body: `Owner: {{cassi}}

Status: Draft, for review

## Goal
Redesign onboarding for 1.0 so new users understand everything Pebblepath can do.

## Proposed flow
1. Create account (name, email, password, business type, country)
2. **Connect your bank** (required to continue)
3. Choose tax settings: tax rate, quarterly or yearly payments, self-employment tax on or off
4. Set income categories
5. Set expense categories
6. Product tour: 7 tooltips covering every feature, including invoicing
7. Invite your accountant (optional)
8. Choose notification preferences
9. Land on the dashboard: income chart, expense chart, tax jar, safe-to-spend, invoices, cash-flow forecast

## Notes
- Bank connection first so the dashboard has real data.
- Beta users asked for more control, so every setting is available up front.

## Success measure
New users like the onboarding.`,
  },

  // For the Funnels and offers profile: a signup funnel with a category-speak
  // headline, too many choices, a long form and no follow-up.
  {
    title: 'Signup funnel and offer (draft)',
    body: `Owner: {{mitch}}

Status: Draft, for review

## Funnel
1. **Ads and social posts** link to the homepage.
2. **Homepage.** Headline: "The all-in-one financial platform for modern independent professionals." Below it, a grid of 9 features.
3. **Pricing page.** Solo $9, Pro $19, Agency $49 and the $199 lifetime deal, side by side.
4. **Signup form.** Name, email, password, phone, company name, business type, annual revenue, how did you hear about us.
5. **14-day free trial.** Credit card required.

## Follow-up
None planned yet. We'll look at it after launch.

## What we'll measure
Homepage visits and trial starts.

## Notes
- Kevin's pricing recommendation isn't reflected yet (see Pricing options).
- Jennifer's interview quotes aren't used anywhere on the site yet.`,
  },
];
