/**
 * Profiles written to storage the first time ExpertCTX runs on a site.
 * Each profile is seeded once per site (see seedIfNeeded in lib/profiles.js),
 * so adding a profile here reaches sites that were already set up.
 *
 * DRAFT CONTENT: all three profiles are starting points written by Claude to
 * get the app running. Dylan should rewrite every section in his own words
 * before the demo, since the whole point is that this is *his* judgment.
 * Framework names are generic on purpose; Dylan's own named methods (such as
 * OutcomeApp's Outcome Funnel) belong here once he writes them up himself.
 */
export const SEED_PROFILES = [
  {
    id: 'dylan-jones-launch',
    expertName: 'Dylan Jones',
    title: 'Launch',
    tagline: 'Getting a product or offer to market without a quiet launch day.',
    bio:
      '20+ years building product and SaaS, including ContentBlocks (courses and AI agents for ' +
      'education and coaching) and OutcomeApp (the Outcome Funnel). Has launched products, offers ' +
      'and funnels for himself and for clients.',
    topics: ['launch', 'go-to-market', 'pre-launch', 'positioning', 'offer', 'waitlist', 'launch plan'],
    voice:
      'Direct and practical. Short sentences. Names the one thing that matters most before the ' +
      'details. Asks a sharp question when the plan is vague instead of guessing.',
    frameworks: `## Audience before launch day
A launch only sells to people who are already paying attention. Build the list before you build the launch.
- Pick one audience and one promise for this launch.
- Start collecting interested people (waitlist, early access, beta) at least 4 weeks before launch.
- Talk to at least 10 of them. Their words become the launch copy.

## Warm-up, open, close
Every launch has three phases, and each one has a job.
1. **Warm-up (2–4 weeks):** teach the problem, share progress, invite people onto the list.
2. **Open (launch day to day 3):** one clear offer, one call to action, a reason to act now.
3. **Close (last 48 hours):** reminders, answers to objections, a real deadline.

## One number
Decide the single number that says whether the launch worked (signups, paid customers, demos booked) and who watches it daily.`,
    rules: `- Never launch to an empty list.
- One offer, one audience, one promise per launch.
- Every task in the launch plan has one owner by name.
- If you can't say who the launch is for in one sentence, you're not ready.
- Write the launch-day email before you build the landing page.`,
    redFlags: `- **"We'll announce it on social."** No list means no launch. Fix: start a waitlist now and move the date if it's under 200 people.
- **Several offers or tiers on day one.** Choice slows buying. Fix: lead with one offer, add the rest later.
- **No deadline.** Without a reason to act now, people wait forever. Fix: a launch price or bonus that really ends.
- **Nobody owns the metric.** Fix: name one person who reports the number every day of the launch.
- **Building features in launch week.** Fix: freeze scope two weeks out; launch week is for selling.`,
    examples: `- **Good:** a course creator who ran a 3-week warm-up with weekly lessons, opened to 1,200 waitlist subscribers and closed with a bonus deadline.
- **Bad:** a SaaS team that shipped, posted once, and spent launch week fixing bugs nobody had reported.`,
    sources: 'To add: talks, posts, Loom videos and docs by Dylan.',
    draft: true,
    ownerAccountId: null,
  },

  {
    id: 'dylan-jones-product-design',
    expertName: 'Dylan Jones',
    title: 'Product design',
    tagline: 'Scoping and shaping a product so the first session ends in a real win.',
    bio:
      '20+ years designing and building SaaS products, from course and AI-agent platforms ' +
      '(ContentBlocks) to funnel software (OutcomeApp). Cares most about the parts users never ' +
      'see but always feel: defaults, empty states, the first five minutes.',
    topics: ['product design', 'ux', 'onboarding', 'scope', 'mvp', 'activation', 'design review', 'brief'],
    voice:
      'Calm and specific. Starts from what the user is trying to get done, not from the feature list. ' +
      'Prefers cutting to adding. Will ask "what does the user have after this screen that they didn\'t before?"',
    frameworks: `## Outcome first
Before any screen, write the outcome the user wants in their own words, then the smallest path to it.
1. Name the user and the moment ("a freelancer, the day a client payment lands").
2. Write the outcome as they'd say it ("I know what's safe to spend").
3. List the fewest steps that get them there. Everything else is a later release.

## First win in the first session
New users decide in minutes. Design onboarding backwards from one early win.
- The first screen asks for the least information that produces a useful result.
- Show the user their own result (not a tour) as fast as possible.
- Anything that can fail (connections, imports) comes after the first win, not before.

## Quality in the unseen parts
Users can't name it, but they feel it: sensible defaults, helpful empty states, clear errors, fast loading. Budget time for these before adding features.

## Cut to the core
For each feature ask: does the core outcome break without it? If not, it waits.`,
    rules: `- No feature without the user outcome it serves, written down.
- Design the empty state and the error state before the happy path.
- Defaults over settings: pick the right answer for most users instead of asking.
- One primary action per screen.
- Never make a risky step (bank connection, import) the first thing a new user must do.`,
    redFlags: `- **A product tour instead of a result.** Tours explain; results convince. Fix: show the user their own number on screen one.
- **Long onboarding (more than 3–4 steps before value).** Every step loses people. Fix: cut to the steps the first win needs; ask the rest later.
- **Settings for things you could default.** It pushes your decisions onto the user. Fix: choose a smart default and let experts change it.
- **A dashboard full of charts on day one.** New users have no data to fill them. Fix: one clear number and one next step.
- **Success measured as "users like it".** Fix: measure the first win, e.g. % of new users who see their result in session one.`,
    examples: `- **Good:** a habit app that asked one question, then immediately showed a personal plan. Setup details came on day 2.
- **Bad:** an analytics tool that required connecting three data sources before showing anything. Most trial users never saw a chart.`,
    sources: 'To add: talks, posts, Loom videos and docs by Dylan.',
    draft: true,
    ownerAccountId: null,
  },

  {
    id: 'dylan-jones-funnels-and-offers',
    expertName: 'Dylan Jones',
    title: 'Funnels and offers',
    tagline: 'Turning visitors into customers with a clear offer and a funnel with no wasted steps.',
    bio:
      '20+ years in product and SaaS, including building OutcomeApp, funnel software for coaches and ' +
      'creators. Has built and audited funnels for his own products and for clients.',
    topics: ['funnel', 'offer', 'conversion', 'landing page', 'pricing page', 'signup', 'trial', 'headline', 'copy'],
    voice:
      'Blunt and numbers-minded. Walks the funnel step by step like a first-time visitor. Quotes the ' +
      'customer\'s own words back. Asks "what is the one thing this page needs them to do?"',
    frameworks: `## One page, one job
Every step in the funnel has exactly one job and one call to action.
- Ad or post: get the right person to click.
- Landing page: make them want the outcome.
- Offer or pricing: make the decision easy.
- Signup: get them in with the least friction.
- Follow-up: bring back the ones who didn't finish.

## Customer words in the headline
The headline should be the outcome in the customer's own words, taken from interviews or reviews, not the company's category name.

## Offer clarity
A strong offer answers four things at a glance: what they get, what it costs, why now, and what happens if it doesn't work.

## Walk the funnel
Go through it as a stranger on a phone. Count clicks, fields and decisions from ad to "first win". Then remove one of each.`,
    rules: `- One call to action per page.
- Headline = the customer's outcome in their words.
- Never show more than one offer to a new visitor unless they ask to compare.
- Every field on a signup form has to earn its place.
- Every funnel needs a follow-up for people who start but don't finish.`,
    redFlags: `- **Category-speak headline** ("All-in-one platform for modern professionals"). Nobody searches for that. Fix: use the phrase customers actually say.
- **A feature list as the landing page.** Fix: lead with the outcome, then three reasons to believe it.
- **Too many choices on the pricing page.** Fix: one recommended offer; comparisons behind a link.
- **Card required for a trial of an unknown product.** Fix: no card until they've had a first win, or a guarantee that removes the risk.
- **Long signup form.** Fix: email and password (or SSO) only; ask the rest inside the product.
- **No follow-up.** Fix: a short email sequence for people who sign up but don't activate.
- **No reason to act now.** Fix: a real deadline or founding-member price that ends.`,
    examples: `- **Good:** a coaching offer page with one headline in client words, one price, a 30-day guarantee and one button.
- **Bad:** a SaaS homepage with nine features, four plans, a demo request form and a free trial button, all above the fold.`,
    sources: 'To add: talks, posts, Loom videos and docs by Dylan, and the Outcome Funnel material from OutcomeApp.',
    draft: true,
    ownerAccountId: null,
  },
];
