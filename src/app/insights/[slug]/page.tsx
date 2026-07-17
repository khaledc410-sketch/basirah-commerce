import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClientReviewArticle } from "@/components/visibility/client-review-article";
import {
  SENSITIVE_SKIN_ARTICLE_SLUG,
  sensitiveSkinArticle,
} from "@/components/visibility/demo-article";

interface InsightPageProps {
  params: Promise<{ slug: string }>;
}

const previewUrl = `https://basirah.example${sensitiveSkinArticle.previewPath}`;
const heroUrl = `https://basirah.example${sensitiveSkinArticle.heroImage}`;

export function generateStaticParams() {
  return [{ slug: SENSITIVE_SKIN_ARTICLE_SLUG }];
}

export async function generateMetadata({
  params,
}: InsightPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (slug !== SENSITIVE_SKIN_ARTICLE_SLUG) {
    return {
      title: "المقال غير موجود",
      robots: { follow: false, index: false },
    };
  }

  return {
    title: { absolute: sensitiveSkinArticle.metaTitle },
    description: sensitiveSkinArticle.metaDescription,
    alternates: { canonical: null },
    authors: [{ name: sensitiveSkinArticle.author }],
    creator: sensitiveSkinArticle.author,
    publisher: sensitiveSkinArticle.brand.name,
    robots: {
      follow: false,
      index: false,
      googleBot: { follow: false, index: false },
    },
    openGraph: {
      type: "article",
      locale: "ar_SA",
      url: sensitiveSkinArticle.previewPath,
      siteName: sensitiveSkinArticle.brand.name,
      title: sensitiveSkinArticle.metaTitle,
      description: sensitiveSkinArticle.metaDescription,
      images: [
        {
          url: sensitiveSkinArticle.heroImage,
          width: 1696,
          height: 960,
          alt: sensitiveSkinArticle.heroAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: sensitiveSkinArticle.metaTitle,
      description: sensitiveSkinArticle.metaDescription,
      images: [sensitiveSkinArticle.heroImage],
    },
  };
}

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": `${previewUrl}#article`,
  headline: sensitiveSkinArticle.title,
  description: sensitiveSkinArticle.metaDescription,
  image: heroUrl,
  inLanguage: "ar-SA",
  dateCreated: sensitiveSkinArticle.createdAt,
  dateModified: sensitiveSkinArticle.updatedAt,
  creativeWorkStatus: "Draft — merchant review required",
  author: {
    "@type": "Organization",
    name: sensitiveSkinArticle.author,
  },
  publisher: {
    "@type": "Organization",
    name: sensitiveSkinArticle.brand.name,
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": previewUrl,
  },
  about: ["البشرة الحساسة", "روتين العناية بالبشرة", "اختيار المنتجات"],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "أدلة العناية",
      item: "https://basirah.example/insights",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: sensitiveSkinArticle.title,
      item: previewUrl,
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${previewUrl}#faq`,
  mainEntity: sensitiveSkinArticle.faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default async function InsightPage({ params }: InsightPageProps) {
  const { slug } = await params;

  if (slug !== SENSITIVE_SKIN_ARTICLE_SLUG) {
    notFound();
  }

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleSchema) }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }}
        type="application/ld+json"
      />
      <ClientReviewArticle />
    </>
  );
}
