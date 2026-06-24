import type { Metadata } from "next";
import PetKnowledgeClient from "./PetKnowledgeClient";
import { articles, healthDisclaimer, popularQuestions, topicFilters } from "./articles";

const title = "ความรู้สัตว์เลี้ยง | Whiskora Pet Knowledge Hub";
const description =
  "คลังบทความสัตว์เลี้ยงของ Whiskora ครอบคลุมการเริ่มเลี้ยง สุขภาพ วัคซีน พฤติกรรม อาหาร สายพันธุ์ ฟาร์ม Pet ID และการดูแลต่อเนื่อง";
const canonicalUrl = "https://whiskora.pet/th/pet-knowledge";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "ความรู้สัตว์เลี้ยง",
    "บทความสัตว์เลี้ยง",
    "วัคซีนแมว",
    "วัคซีนสุนัข",
    "Pet ID",
    "QR Pet Profile",
    "ฟาร์มสัตว์เลี้ยง",
    "การดูแลสัตว์เลี้ยง",
    "อาหารสัตว์เลี้ยง",
  ],
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title,
    description,
    url: canonicalUrl,
    siteName: "Whiskora",
    locale: "th_TH",
    type: "website",
    images: [
      {
        url: "https://whiskora.pet/home/hero-visual-desktop-v1.png",
        width: 1600,
        height: 1000,
        alt: "Whiskora Pet Knowledge Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["https://whiskora.pet/home/hero-visual-desktop-v1.png"],
  },
};

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: title,
  description,
  url: canonicalUrl,
  isPartOf: {
    "@type": "WebSite",
    name: "Whiskora",
    url: "https://whiskora.pet",
  },
  about: topicFilters
    .filter((topic) => topic.key !== "all")
    .map((topic) => ({
      "@type": "Thing",
      name: topic.label,
      description: topic.description,
    })),
  mainEntity: articles.slice(0, 10).map((article) => ({
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    dateModified: article.updated,
    author: {
      "@type": "Organization",
      name: article.author,
    },
    keywords: article.keywords.join(", "),
  })),
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    ...popularQuestions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
    {
      "@type": "Question",
      name: "บทความสุขภาพสัตว์เลี้ยงใน Whiskora ใช้แทนการพบสัตวแพทย์ได้ไหม",
      acceptedAnswer: {
        "@type": "Answer",
        text: healthDisclaimer,
      },
    },
  ],
};

export default function PetKnowledgePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PetKnowledgeClient />
    </>
  );
}
