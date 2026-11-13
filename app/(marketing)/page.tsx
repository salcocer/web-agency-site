import Link from "next/link";
import { ContactForm } from "./contact-form";
import "./marketing.css";

const services = [
  {
    title: "Website design",
    text: "Bespoke, mobile-first design that reflects your brand and leads visitors to book, buy or enquire.",
    tags: ["Art direction", "Prototypes", "Booking flows"],
    icon: (
      <>
        <rect x="5" y="8" width="30" height="22" rx="3" />
        <path d="M5 13h30" />
        <circle className="acc" cx="27" cy="22" r="4" />
        <path d="M10 20h9M10 24h6" />
      </>
    ),
  },
  {
    title: "Development",
    text: "Fast, secure sites on WordPress, Shopify or a custom build, handed over with training so you can edit freely.",
    tags: ["WordPress", "Shopify", "Integrations"],
    icon: (
      <>
        <path d="M14 12l-8 8 8 8M26 12l8 8-8 8" />
        <path d="M22 9l-4 22" />
        <circle className="acc" cx="31" cy="9" r="3" />
      </>
    ),
  },
  {
    title: "SEO & AI search",
    text: "Be found on Google, Google Maps and AI assistants when people search for “villa Koh Samui”.",
    tags: ["Local SEO", "Google Business", "AI answers"],
    icon: (
      <>
        <circle cx="17" cy="17" r="9" />
        <path d="M24 24l9 9" />
        <circle className="acc" cx="17" cy="17" r="3.5" />
      </>
    ),
  },
  {
    title: "Brand & content",
    text: "Logos, typography, photo direction and copy in English and Thai, written to sound like you.",
    tags: ["Identity", "Copywriting", "Photo & video"],
    icon: (
      <>
        <path d="M8 32l4-12 14-14 8 8-14 14z" />
        <path d="M22 10l8 8" />
        <circle className="acc" cx="10" cy="32" r="3" />
      </>
    ),
  },
  {
    title: "Marketing",
    text: "Google Ads, social media and email campaigns that bring the right guests, reported in plain language.",
    tags: ["Ads", "Instagram", "Newsletters"],
    icon: (
      <>
        <path d="M6 32h28" />
        <path d="M10 27v-6M17 27V15M24 27v-9M31 27V9" />
        <circle className="acc" cx="31" cy="9" r="3" />
      </>
    ),
  },
  {
    title: "Hosting & care",
    text: "Updates, backups, security and small changes every month, so your site stays fast without you thinking about it.",
    tags: ["Hosting", "Backups", "LINE support"],
    icon: (
      <>
        <path d="M20 5l12 5v9c0 8-5 13-12 16-7-3-12-8-12-16v-9z" />
        <path d="M15 20l4 4 7-8" />
        <circle className="acc" cx="32" cy="10" r="3" />
      </>
    ),
  },
];

const work = [
  { name: "Baan Talay Villa", short: "Baan Talay", place: "Private villa · Chaweng Noi", tag: "Hospitality", tone: "", thumb: "t1", text: "Direct-booking website with a calendar, gallery and bilingual pages." },
  { name: "Aura Wellness", short: "Aura", place: "Wellness clinic · Sukhumvit", tag: "Clinic", tone: "pill--p", thumb: "t2", text: "Treatment menus, online booking and local SEO in Bangkok." },
  { name: "Rim Nam Coffee", short: "Rim Nam", place: "Coffee roasters · Bophut", tag: "E-commerce", tone: "pill--g", thumb: "t3", text: "Shopify store and brand refresh for a small-batch roaster." },
  { name: "Kru Lek Muay Thai", short: "Kru Lek", place: "Muay Thai camp · Lamai", tag: "Fitness", tone: "", thumb: "t4", text: "Class schedules, training packages and international bookings." },
];

const steps = [
  { step: "Discover", what: "A free call about your business, guests and goals.", when: "Week 1", get: "Plan & fixed quote", tone: "" },
  { step: "Design", what: "Sitemap, wireframes and a visual direction for you to approve.", when: "Weeks 1–2", get: "Clickable prototype", tone: "" },
  { step: "Build", what: "We develop the site, write the content and set up SEO.", when: "Weeks 2–4", get: "Staging site", tone: "" },
  { step: "Launch", what: "Testing on every device, then go live with hosting and domain handled.", when: "Weeks 4–6", get: "Live website", tone: "pill--p" },
  { step: "Care", what: "Training, monthly updates and plain-language reports.", when: "Ongoing", get: "Monthly report", tone: "pill--g" },
];

const plans = [
  { name: "Essential", price: "฿35,000", per: "one-time", text: "For cafés, gyms and small businesses that need a professional presence.", cta: "Get started", href: "#contact", features: ["Up to 5 pages", "Mobile-first design", "Contact form & LINE button", "Basic SEO & Google Maps"] },
  { name: "Signature", price: "฿85,000", per: "one-time", text: "For villas, resorts and clinics that take bookings online.", cta: "Get started", href: "#contact", featured: true, features: ["Up to 12 pages, EN & TH", "Bespoke design & copywriting", "Booking or e-commerce", "Full SEO set-up"] },
  { name: "Care plan", price: "฿4,500", per: "/ month", text: "Keep everything fast, secure and up to date after launch.", cta: "Add to a project", href: "/portal/billing", features: ["Hosting & daily backups", "Updates & security", "Small content changes", "Monthly visibility report"] },
];

const faqs = [
  { q: "How long does a website take?", a: "Most sites launch in 3 to 6 weeks. The Essential package is usually live in about 3 weeks; booking and e-commerce sites take closer to 6." },
  { q: "Will I be able to edit the website myself?", a: "Yes. We build on WordPress or Shopify and give you a short training session, so you can change text, photos and prices without us." },
  { q: "Do you make websites in Thai and English?", a: "Yes. Our Signature package includes both languages, and we can add Thai to any other package." },
  { q: "Who owns the website and domain?", a: "You do, from day one. The domain, hosting account and code are registered in your name." },
  { q: "Can you take over an existing website?", a: "Yes. We can redesign it, or simply move it onto our Care plan for hosting, updates and support." },
  { q: "How do I follow my project and pay invoices?", a: "Every client gets a login to our client portal. You see your project’s progress, send change requests, and pay invoices or your care plan online." },
];

export default function HomePage() {
  return (
    <div className="site">
      <header className="top">
        <div className="wrap">
          <a className="brand" href="#top">
            <i>S</i>Saltlight
          </a>
          <nav className="menu" aria-label="Main">
            <a href="#services">Services</a>
            <a href="#work">Work</a>
            <a href="#process">Process</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="top-actions">
            <Link className="login" href="/portal">
              Client login
            </Link>
            <a className="btn" href="#contact">
              Book a call
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap">
            <span className="eyebrow">Web design studio · Koh Samui &amp; Bangkok</span>
            <h1>
              Your website,
              <br />
              beautifully <span className="mark">handled</span>.
            </h1>
            <p className="lede">
              We design, build and look after websites for villas, resorts, clinics and independent businesses in
              Thailand. One team, one plan, and a site you can actually update.
            </p>
            <div className="hero-actions">
              <a className="btn" href="#contact">
                Book a free consultation
              </a>
              <a className="btn btn--ghost" href="#work">
                See our work →
              </a>
            </div>
            <span className="hero-note">Launch in 3–6 weeks · English &amp; Thai · You own everything</span>

            <div className="workspace" aria-label="Example project page from our client workspace">
              <div className="ws-side" aria-hidden="true">
                <b>Client workspace</b>
                <span>🏠 Home</span>
                <span className="on">🌴 Baan Talay Villa</span>
                <span>🌿 Aura Wellness</span>
                <span>☕ Rim Nam Coffee</span>
                <b>Studio</b>
                <span>📋 Content checklist</span>
                <span>📈 Monthly reports</span>
              </div>
              <div className="ws-main">
                <div className="ws-cover" aria-hidden="true"></div>
                <h3>Baan Talay Villa · New website</h3>
                <dl className="props">
                  <dt>Status</dt>
                  <dd>
                    <span className="pill pill--p">In design</span>
                  </dd>
                  <dt>Launch</dt>
                  <dd>12 Dec 2026</dd>
                  <dt>Languages</dt>
                  <dd>
                    <span className="pill">EN</span> <span className="pill">TH</span>
                  </dd>
                  <dt>Package</dt>
                  <dd>
                    <span className="pill pill--g">Signature</span>
                  </dd>
                </dl>
                <ul className="todo">
                  <li className="done">Discovery call and sitemap</li>
                  <li className="done">Moodboard approved</li>
                  <li>Homepage and booking flow design</li>
                  <li>Photo shoot, Chaweng Noi</li>
                  <li>Google Business Profile set-up</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <div className="logos">
          <div className="wrap">
            <p>Built for businesses across Koh Samui and Bangkok (example clients)</p>
            <div className="logo-row" aria-hidden="true">
              <span>BAAN TALAY</span>
              <span>Aura Wellness</span>
              <span>Rim Nam</span>
              <span>kru_lek</span>
              <span>Sala Bophut</span>
            </div>
          </div>
        </div>

        <section id="services">
          <div className="wrap">
            <div className="head">
              <span className="eyebrow">Services</span>
              <h2>Everything your website needs, in one place.</h2>
              <p className="lede">From the first sketch to the monthly report, with one point of contact the whole way.</p>
            </div>
            <div className="grid3">
              {services.map((service) => (
                <article className="svc" key={service.title}>
                  <svg viewBox="0 0 40 40" aria-hidden="true">
                    {service.icon}
                  </svg>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                  <ul>
                    {service.tags.map((tag) => (
                      <li className="pill pill--g" key={tag}>
                        {tag}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="work" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="head">
              <span className="eyebrow">Selected work</span>
              <h2>Recent projects.</h2>
            </div>
            <div className="work">
              {work.map((project) => (
                <a className="proj" href="#contact" key={project.name}>
                  <div className={`thumb ${project.thumb}`}>
                    <div className="page">
                      <i></i>
                      <b>
                        {project.short}
                        <small>{project.place}</small>
                      </b>
                    </div>
                  </div>
                  <div className="body">
                    <div className="row">
                      <h3>{project.name}</h3>
                      <span className={`pill ${project.tone}`}>{project.tag}</span>
                    </div>
                    <p>{project.text}</p>
                  </div>
                </a>
              ))}
            </div>
            <p className="note">Example projects shown for preview. Replace with your real case studies and screenshots.</p>
          </div>
        </section>

        <section id="process" className="process" style={{ background: "var(--card)" }}>
          <div className="wrap">
            <div className="head">
              <span className="eyebrow">How we work</span>
              <h2>A clear plan from first call to launch.</h2>
              <p className="lede">
                Every client gets a shared project page like this one in our client portal, so you always know what
                happens next.
              </p>
            </div>
            <div className="db">
              <table>
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>What happens</th>
                    <th>Timing</th>
                    <th>You get</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((step, i) => (
                    <tr key={step.step}>
                      <td>
                        <span>{i + 1}</span>
                        {step.step}
                      </td>
                      <td>{step.what}</td>
                      <td>{step.when}</td>
                      <td>
                        <span className={`pill ${step.tone}`}>{step.get}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="quote">
          <div className="wrap">
            <blockquote>“A good website should feel like a good host: calm, clear and quick to help.”</blockquote>
            <cite>The Saltlight approach</cite>
          </div>
        </section>

        <section id="pricing" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="head head--center">
              <span className="eyebrow">Pricing</span>
              <h2>Simple, honest pricing.</h2>
              <p className="lede">
                Fixed prices in Thai baht with no hidden fees. Every project starts with a free consultation.
              </p>
            </div>
            <div className="plans">
              {plans.map((plan) => (
                <article className={plan.featured ? "plan featured" : "plan"} key={plan.name}>
                  {plan.featured && <span className="pill pill--p badge">Most popular</span>}
                  <span className="name">{plan.name}</span>
                  <div className="price">
                    {plan.price}
                    <small>{plan.per}</small>
                  </div>
                  <p>{plan.text}</p>
                  {plan.href.startsWith("/") ? (
                    <Link className="btn btn--ghost" href={plan.href}>
                      {plan.cta}
                    </Link>
                  ) : (
                    <a className={plan.featured ? "btn" : "btn btn--ghost"} href={plan.href}>
                      {plan.cta}
                    </a>
                  )}
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about" id="about" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="doodle" aria-hidden="true">
              <svg
                viewBox="0 0 320 260"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="232" cy="64" r="30" fill="var(--primary)" stroke="none" />
                <path d="M20 200c30-12 60-12 90 0s60 12 90 0 60-12 100 0" />
                <path d="M20 224c30-12 60-12 90 0s60 12 90 0 60-12 100 0" stroke="var(--secondary)" />
                <path d="M70 196c4-40 10-80 26-118" />
                <path d="M96 78c-22-6-44 0-58 14M96 78c-8-18-26-28-46-28M96 78c14-14 34-18 52-12M96 78c18 0 34 10 42 26" />
                <rect x="150" y="120" width="120" height="76" rx="8" fill="var(--bg)" />
                <path d="M150 136h120" />
                <path d="M164 156h50M164 170h34" stroke="var(--secondary)" />
                <circle cx="250" cy="164" r="8" fill="var(--primary)" stroke="none" />
              </svg>
            </div>
            <div className="about-copy">
              <span className="eyebrow">About</span>
              <h2>A small studio, on purpose.</h2>
              <p className="lede">
                We are designers and developers based between Koh Samui and Bangkok. We keep the studio small so you
                work directly with the people building your site.
              </p>
              <div className="values">
                <div>
                  <h3>Personal</h3>
                  <p>One point of contact, on email, WhatsApp or LINE.</p>
                </div>
                <div>
                  <h3>Transparent</h3>
                  <p>Fixed quotes and plain-language reports.</p>
                </div>
                <div>
                  <h3>Yours</h3>
                  <p>You own your domain, hosting and website from day one.</p>
                </div>
                <div>
                  <h3>Local</h3>
                  <p>We know the island, the market and your guests.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="head head--center">
              <span className="eyebrow">FAQ</span>
              <h2>Questions, answered.</h2>
            </div>
            <div className="faq">
              {faqs.map((faq) => (
                <details key={faq.q}>
                  <summary>{faq.q}</summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="contact" id="contact" style={{ background: "var(--card)" }}>
          <div className="wrap">
            <div className="contact-info">
              <span className="eyebrow">Contact</span>
              <h2>Let’s talk about your website.</h2>
              <p className="lede">
                Tell us a little about your business. We reply within one working day to arrange a free consultation.
              </p>
              <dl>
                <div>
                  <dt>Email</dt>
                  <dd>hello@saltlight.studio</dd>
                </div>
                <div>
                  <dt>Phone · WhatsApp · LINE</dt>
                  <dd>+66 00 000 0000</dd>
                </div>
                <div>
                  <dt>Studios</dt>
                  <dd>Bophut, Koh Samui · Sukhumvit, Bangkok</dd>
                </div>
              </dl>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="about-f">
            <a className="brand" href="#top">
              <i>S</i>Saltlight
            </a>
            <p>Websites for villas, resorts, clinics and independent businesses in Thailand.</p>
          </div>
          <div>
            <h4>Studio</h4>
            <ul>
              <li><a href="#services">Services</a></li>
              <li><a href="#work">Work</a></li>
              <li><a href="#about">About</a></li>
            </ul>
          </div>
          <div>
            <h4>Plans</h4>
            <ul>
              <li><a href="#pricing">Essential</a></li>
              <li><a href="#pricing">Signature</a></li>
              <li><a href="#pricing">Care plan</a></li>
            </ul>
          </div>
          <div>
            <h4>Clients</h4>
            <ul>
              <li><Link href="/portal">Client portal</Link></li>
              <li><a href="#contact">Book a call</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div className="legal">
            <span>© 2026 Saltlight Studio</span>
            <span>Made on Koh Samui</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
