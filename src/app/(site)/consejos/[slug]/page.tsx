import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prose } from "@/components/Prose";
import { getPost, posts } from "@/data/posts";
import { GuideImage } from "@/components/guides/GuideImage";
import { ChainGuide } from "@/components/guides/ChainGuide";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  return post ? { alternates: { canonical: siteUrl(`/consejos/${post.slug}/`) }, title: post.title, description: post.excerpt } : { title: "Artículo no encontrado" };
}

export default async function PostPage({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const others = posts.filter((p) => p.slug !== post.slug).slice(0, 2);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Tropicleta" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="tp-hero tp-page-hero">
        <div className="tp-shell" style={{ position: "relative", zIndex: 1 }}>
          <nav className="tp-breadcrumb" aria-label="Ruta">
            <Link href="/consejos/">Consejos</Link>
          </nav>
          <span className="tp-meta">
            {new Date(post.date + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
            {post.readingMinutes} min de lectura
          </span>
          <h1 className="tp-display" style={{ marginTop: 14 }}>
            {post.title}
          </h1>
          <p className="tp-hero-copy">{post.excerpt}</p>
        </div>
      </section>
      <section className="tp-section">
        <div className="tp-shell">
          <div style={{ maxWidth: 850, marginBottom: 28, borderRadius: 12, overflow: "hidden" }}><GuideImage guide={post.slug} /></div>
          {post.slug === "cuidar-la-cadena" && <ChainGuide />}
          <Prose text={post.body} />
          <div className="tp-local-box" style={{ marginTop: 40, maxWidth: 720 }}>
            <span className="tp-kicker">¿Prefieres que lo hagamos nosotros?</span>
            <p className="tp-section-intro" style={{ marginBottom: 20 }}>
              Diagnóstico gratuito y garantía de 2 semanas.
            </p>
            <Link className="tp-btn tp-btn-primary" href="/agendar/">
              Solicitar hora
            </Link>
          </div>
          <h2 className="tp-display tp-category-heading" style={{ marginTop: 56 }}>
            Sigue leyendo
          </h2>
          <div className="tp-post-grid">
            {others.map((p) => (
              <Link key={p.slug} href={`/consejos/${p.slug}/`} className="tp-post-card">
                <h3 className="tp-display">{p.title}</h3>
                <p>{p.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
