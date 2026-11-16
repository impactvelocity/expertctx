/**
 * ExpertCTX page in Confluence (Apps > ExpertCTX).
 *
 * Teams browse the experts published on the ExpertCTX hub and learn how to
 * ask them in Rovo. Experts are sent to the hub to create and edit profiles.
 * Built with UI Kit only: plain HTML elements don't render here.
 */
import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Box,
  Heading,
  Inline,
  LinkButton,
  LoadingButton,
  Lozenge,
  SectionMessage,
  Spinner,
  Stack,
  Tag,
  TagGroup,
  Text,
  xcss,
} from '@forge/react';
import { invoke } from '@forge/bridge';

const cardStyle = xcss({
  padding: 'space.200',
  borderColor: 'color.border',
  borderWidth: 'border.width',
  borderStyle: 'solid',
  borderRadius: 'border.radius',
});

const ExpertCard = ({ expert, hubUrl, live }) => (
  <Box xcss={cardStyle}>
    <Stack space="space.100">
      <Inline space="space.100" alignBlock="center">
        <Heading size="small">{`${expert.expert}: ${expert.profile}`}</Heading>
        {expert.verified && <Lozenge appearance="success">Verified</Lozenge>}
      </Inline>
      <Text>{expert.tagline}</Text>
      {expert.frameworks?.length > 0 && <Text size="small">{`Frameworks: ${expert.frameworks.join(' · ')}`}</Text>}
      {expert.playbooks?.length > 0 && <Text size="small">{`Playbooks: ${expert.playbooks.join(' · ')}`}</Text>}
      {expert.topics?.length > 0 && (
        <TagGroup>
          {expert.topics.slice(0, 6).map((topic) => (
            <Tag key={topic} text={topic} />
          ))}
        </TagGroup>
      )}
      <Text size="small">{`Ask in Rovo: "Review this page with ${expert.expert.split(' ')[0]}'s ${expert.profile} profile."`}</Text>
      {live && expert.expertSlug && (
        <Inline>
          <LinkButton href={`${hubUrl}/experts/${expert.expertSlug}#${expert.id}`} target="_blank">
            View on ExpertCTX
          </LinkButton>
        </Inline>
      )}
    </Stack>
  </Box>
);

/**
 * Creates the fictional Pebblepath team space so anyone (including hackathon
 * judges) can try ExpertCTX on realistic pages in one click.
 */
const DemoSpace = () => {
  const [demo, setDemo] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    invoke('getDemoSpace').then(setDemo);
  }, []);

  const create = async (reset = false) => {
    setBusy(true);
    setResult(null);
    const response = await invoke('createDemoSpace', { reset });
    setBusy(false);
    setResult(response);
    if (response.ok && response.url) setDemo({ key: response.key, url: response.url });
  };

  return (
    <Box xcss={cardStyle}>
      <Stack space="space.150">
        <Heading size="small">Try it with a demo team</Heading>
        <Text>
          Creates a Pebblepath space: a fictional five-person startup about to launch a budgeting app for
          freelancers, with a goal, a draft launch plan, customer interviews, an email playbook, pricing options
          and a roadmap. Then ask ExpertCTX to review the launch plan.
        </Text>
        {demo?.url && (
          <Text size="small">
            "Reset demo pages" puts the demo pages back to their original text and adds any that are missing. Other pages in the space, like
            plans ExpertCTX created, are kept.
          </Text>
        )}
        {result && (
          <SectionMessage appearance={result.ok ? 'success' : 'error'}>
            <Text>{result.message}</Text>
          </SectionMessage>
        )}
        <Inline space="space.100" alignBlock="center">
          {demo?.url ? (
            <>
              <LinkButton href={demo.url} appearance="primary">
                Open the Pebblepath space
              </LinkButton>
              <LoadingButton isLoading={busy} onClick={() => create(true)}>
                Reset demo pages
              </LoadingButton>
            </>
          ) : (
            <LoadingButton appearance="primary" isLoading={busy} onClick={() => create(false)} isDisabled={demo === undefined}>
              Create demo space
            </LoadingButton>
          )}
        </Inline>
      </Stack>
    </Box>
  );
};

const App = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    invoke('listExperts').then(setData);
  }, []);

  return (
    <Stack space="space.300">
      <Stack space="space.100">
        <Heading size="large">ExpertCTX</Heading>
        <Text>
          Experts publish their frameworks, rules, red flags and playbooks on ExpertCTX. The ExpertCTX agent in
          Rovo applies them to your team's own pages and turns the advice into plan pages with owners.
        </Text>
      </Stack>

      <SectionMessage appearance="discovery" title="Ask an expert">
        <Text>
          Open the page with your plan, open Rovo chat, pick the ExpertCTX agent and ask: "Review this page
          with the Launch expert."
        </Text>
      </SectionMessage>

      <Inline spread="space-between" alignBlock="center">
        <Heading size="medium">Experts</Heading>
        {data?.hubUrl && (
          <Inline space="space.100">
            <LinkButton href={`${data.hubUrl}/experts`} target="_blank">
              Browse the marketplace
            </LinkButton>
            <LinkButton href={`${data.hubUrl}/studio`} target="_blank" appearance="primary">
              Become an expert
            </LinkButton>
          </Inline>
        )}
      </Inline>

      {!data && <Spinner label="Loading experts" />}
      {data && !data.live && (
        <SectionMessage appearance="warning">
          <Text>The ExpertCTX hub couldn't be reached, so these are the profiles bundled with the app.</Text>
        </SectionMessage>
      )}
      {data && data.experts.length === 0 && <Text>No experts are published yet.</Text>}
      {data && (
        <Stack space="space.200">
          {data.experts.map((expert) => (
            <ExpertCard key={expert.id} expert={expert} hubUrl={data.hubUrl} live={data.live} />
          ))}
        </Stack>
      )}

      <DemoSpace />
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
