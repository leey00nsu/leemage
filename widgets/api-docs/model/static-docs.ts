import type { StaticDocItem } from "./types";

type TranslateRaw = (key: string) => string;

export function buildStaticDocs(tRaw: TranslateRaw): StaticDocItem[] {
  return [
    {
      key: "doc:introduction",
      section: "gettingStarted",
      title: tRaw("docs.introduction.title"),
      summary: tRaw("docs.introduction.summary"),
      paragraphs: [
        tRaw("docs.introduction.paragraph1"),
        tRaw("docs.introduction.paragraph2"),
      ],
      bullets: [
        tRaw("docs.introduction.bullet1"),
        tRaw("docs.introduction.bullet2"),
        tRaw("docs.introduction.bullet3"),
      ],
    },
    {
      key: "doc:authentication",
      section: "gettingStarted",
      title: tRaw("docs.authentication.title"),
      summary: tRaw("docs.authentication.summary"),
      paragraphs: [
        tRaw("docs.authentication.paragraph1"),
        tRaw("docs.authentication.paragraph2"),
      ],
      bullets: [
        tRaw("docs.authentication.bullet1"),
        tRaw("docs.authentication.bullet2"),
        tRaw("docs.authentication.bullet3"),
      ],
      requestExample: tRaw("docs.authentication.requestExample"),
      responseExample: tRaw("docs.authentication.responseExample"),
    },
    {
      key: "doc:rate-limits",
      section: "gettingStarted",
      title: tRaw("docs.rateLimits.title"),
      summary: tRaw("docs.rateLimits.summary"),
      paragraphs: [
        tRaw("docs.rateLimits.paragraph1"),
        tRaw("docs.rateLimits.paragraph2"),
      ],
      bullets: [
        tRaw("docs.rateLimits.bullet1"),
        tRaw("docs.rateLimits.bullet2"),
        tRaw("docs.rateLimits.bullet3"),
      ],
      responseExample: tRaw("docs.rateLimits.responseExample"),
    },
    {
      key: "doc:sdk",
      section: "sdk",
      title: tRaw("docs.sdk.title"),
      summary: tRaw("docs.sdk.summary"),
      paragraphs: [tRaw("docs.sdk.paragraph1"), tRaw("docs.sdk.paragraph2")],
      bullets: [
        tRaw("docs.sdk.bullet1"),
        tRaw("docs.sdk.bullet2"),
        tRaw("docs.sdk.bullet3"),
      ],
    },
  ];
}
