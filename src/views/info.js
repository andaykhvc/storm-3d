import { biography, experience, contact, legal, studio } from '../content/data.js';
import { escape, photo } from './kit.js';

export function about() {
  const list = (rows) => `<dl class="cv-list">${rows.map(([when, where, what]) => `<dt>${when}</dt><dd>${where}<span>${what}</span></dd>`).join('')}</dl>`;
  return `<article class="page">
    <header class="opening opening--left">
      <h1 class="opening-title gothic">Storm Nijhuis</h1>
      <p class="opening-line">Fashion designer, stylist and creative director, based in Amsterdam.</p>
    </header>
    <section class="about">
      <figure class="about-portrait">${photo('about-02', studio, { eager: true, priority: true, sizes: '(max-width: 760px) 100vw, 40vw' })}</figure>
      <div class="prose prose--large">${biography.map((p) => `<p>${p}</p>`).join('')}<p><a class="inline" href="${contact.cv}" target="_blank" rel="noopener">Read the CV (PDF)</a></p></div>
    </section>
    <section class="cv" aria-labelledby="cv-title">
      <h2 class="chapter-title" id="cv-title">Experience</h2>
      <div class="cv-grid">
        <div><h3>Education</h3>${list(experience.education)}</div>
        <div><h3>Internships</h3><ul class="cv-plain">${experience.internships.map(([where, what]) => `<li>${where}<span>${what}</span></li>`).join('')}</ul></div>
        <div><h3>Work</h3>${list(experience.work)}<h3>Working with</h3><p class="cv-skills">${experience.skills}</p></div>
      </div>
    </section>
  </article>`;
}

export function contactPage() {
  return `<article class="page">
    <header class="opening opening--left">
      <h1 class="opening-title gothic">Write to Storm</h1>
      <p class="opening-line">For fashion design, styling, creative direction and collaborations.</p>
    </header>
    <section class="contact">
      <a class="contact-mail" href="mailto:${contact.email}">${contact.email}</a>
      <dl class="contact-list">
        <dt>Telephone</dt><dd><a href="tel:${contact.telephone}">${contact.phone}</a></dd>
        <dt>Instagram</dt><dd><a href="${contact.instagram}" target="_blank" rel="noopener noreferrer">${contact.handle}</a></dd>
        <dt>CV</dt><dd><a href="${contact.cv}" target="_blank" rel="noopener">Download the PDF</a></dd>
        <dt>Based in</dt><dd>Amsterdam, the Netherlands</dd>
      </dl>
      <p class="contact-note">Your message is handled as described in the <a class="inline" href="/privacy/">privacy notice</a>. Before a commission starts, read <a class="inline" href="/terms/">enquiries and commissions</a>.</p>
    </section>
  </article>`;
}

const businessMissing = () => {
  const b = legal.business;
  return !b.registeredName || !b.tradingName || !b.kvkNumber || (!b.address && b.addressShielded !== true) || b.vatApplicable === null || (b.vatApplicable && !b.vatId);
};
const privacyMissing = () => !legal.privacy.enquiryRetention || !legal.privacy.hostingLogRetention || !legal.privacy.transferSafeguards || !legal.deploymentPrivacyVerified;
const draft = (message) => `<aside class="draft" aria-label="Publication status"><p><strong>Draft, details to confirm.</strong> ${message}</p></aside>`;

function information({ title, intro, sections, notice = '' }) {
  const updated = new Date(`${legal.updated}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return `<article class="page">
    <header class="opening opening--left"><h1 class="opening-title gothic">${title}</h1><p class="opening-line">${intro}</p></header>
    <div class="information">
      <nav class="information-toc" aria-label="On this page">${sections.map(({ id, heading }) => `<a href="#${id}">${heading}</a>`).join('')}<p>Last updated <time datetime="${legal.updated}">${updated}</time></p></nav>
      <div class="information-body">${notice}${sections.map(({ id, heading, body }) => `<section id="${id}" aria-labelledby="${id}-title"><h2 id="${id}-title">${heading}</h2>${body}</section>`).join('')}</div>
    </div>
  </article>`;
}

const mail = (subject = '') => `<a href="mailto:${contact.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}">${contact.email}</a>`;
const out = (href, text) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;

export function privacy() {
  const p = legal.privacy;
  return information({
    title: 'Privacy',
    intro: 'How personal data is handled when you visit the website or get in touch.',
    notice: privacyMissing() ? draft('Enquiry retention, hosting-log retention, international-transfer arrangements and the deployed site’s privacy settings still need confirmation before this notice is final.') : '',
    sections: [
      { id: 'responsible', heading: 'Who is responsible', body: `<p>${escape(legal.controllerName)}, based in Amsterdam, the Netherlands, is responsible for the personal data handled through this website and its enquiries. For privacy questions or requests, email ${mail()}. Business identification is on the <a href="/legal/">business details page</a>.</p>` },
      { id: 'data', heading: 'Information handled', body: '<p>When you email or call, the information you provide may include your name, email address, telephone number, organisation, project brief, messages and attachments.</p><p>When you visit, Vercel processes technical information needed to deliver and protect the website. This may include your IP address, requested URL, request time, browser or device information, and security or error information.</p><p>You can browse without submitting an enquiry. Contact details and a project brief are needed to respond meaningfully or prepare a commission; information that is not relevant to your enquiry is optional.</p>' },
      { id: 'purposes', heading: 'Why information is used', body: '<ul><li><strong>Requested quotes and commissions:</strong> to take steps at your request before entering a contract, or to perform an agreed contract (GDPR Article 6(1)(b)).</li><li><strong>Other enquiries and collaborations:</strong> the legitimate interest in responding to correspondence and organising professional work (Article 6(1)(f)).</li><li><strong>Website delivery and security:</strong> the legitimate interest in providing a reliable website and preventing misuse (Article 6(1)(f)).</li><li><strong>Records required by law:</strong> compliance with applicable legal obligations, such as tax and accounting requirements, where relevant (Article 6(1)(c)).</li></ul><p>The website does not use visitor profiling or automated decisions that produce legal or similarly significant effects.</p>' },
      { id: 'providers', heading: 'Service providers', body: `<ul><li><strong>Vercel</strong> hosts and delivers the website and handles technical requests and security information. See ${out('https://vercel.com/legal/privacy-notice', 'Vercel’s privacy notice')} and ${out('https://vercel.com/legal/dpa', 'data processing addendum')}.</li><li><strong>Google (Gmail)</strong> provides the mailbox used for email enquiries and processes message contents, attachments and email metadata. See ${out('https://policies.google.com/privacy', 'Google’s privacy policy')}.</li><li><strong>GitHub</strong> holds the website’s source code and supports deployment to Vercel. The website does not send enquiries to GitHub or load images and fonts from it. See ${out('https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement', 'GitHub’s privacy statement')}.</li></ul><p>Information may also need to be disclosed to professional advisers or public authorities where required for a commission or by law. Information about any additional recipients involved in a commission should be supplied before sharing personal data with them.</p>` },
      { id: 'transfers', heading: 'International processing', body: `<p>Vercel and Google operate internationally, so personal data may be processed outside the European Economic Area, including in the United States.</p><p>${p.transferSafeguards ? escape(p.transferSafeguards) : 'The applicable transfer arrangements for the hosting and email accounts, and how to obtain a copy of the safeguards, are being confirmed.'}</p><p>Email ${mail()} for information about the safeguards relevant to your data.</p>` },
      { id: 'retention', heading: 'How long information is kept', body: `<dl class="facts facts--legal"><dt>Enquiry correspondence</dt><dd>${p.enquiryRetention ? escape(p.enquiryRetention) : 'The retention period for enquiries that do not become commissions is being confirmed.'}</dd><dt>Hosting and security logs</dt><dd>${p.hostingLogRetention ? escape(p.hostingLogRetention) : 'The retention periods for the Vercel project and its enabled logging features are being confirmed.'}</dd><dt>Commission records</dt><dd>For as long as needed to perform the commission and deal with relevant claims, subject to legal retention obligations.</dd><dt>Accounting records</dt><dd>For the statutory retention period where tax and accounting obligations require it.</dd></dl>` },
      { id: 'rights', heading: 'Your privacy rights', body: `<p>Depending on the circumstances, you may request access, correction, deletion, restriction of processing or a portable copy of your data. You may object to processing based on legitimate interests. Where processing relies on consent, you may withdraw it without affecting the lawfulness of earlier processing.</p><p>Email ${mail('Privacy request')} with your request. Only information necessary to verify your identity should be requested. Requests are normally answered within one month; if a lawful extension is needed, you will be told.</p><p>You may lodge a complaint with the ${out('https://autoriteitpersoonsgegevens.nl/', 'Autoriteit Persoonsgegevens')}, or with the data protection authority in your country.</p>` },
      { id: 'external-services', heading: 'Cookies and external links', body: '<p>The website’s images and fonts are served from this website. It does not use analytics, advertising trackers, embedded social feeds or third-party video players. See the <a href="/cookies/">cookie information</a> for browser storage and hosting security.</p><p>The Instagram link takes you to a separate service whose own privacy and cookie policies apply. Instagram is not embedded in this website.</p>' },
      { id: 'updates', heading: 'Updates to this notice', body: '<p>This notice will be updated when the website or the way personal data is handled changes. The date above identifies the latest revision.</p>' },
    ],
  });
}

export function businessDetails() {
  const b = legal.business;
  const pending = '<span class="pending">To be confirmed</span>';
  const value = (detail) => (detail ? escape(detail).replace(/\n/g, '<br />') : pending);
  return information({
    title: 'Business details',
    intro: 'Who you are contacting for fashion design, styling and creative direction.',
    notice: businessMissing() ? draft('The registered business name, address and registration details are being confirmed. This page is a draft until they are complete.') : '',
    sections: [
      { id: 'identity', heading: 'Business identification', body: `<dl class="facts facts--legal"><dt>Contact person</dt><dd>${escape(legal.controllerName)}</dd><dt>Registered business name</dt><dd>${value(b.registeredName)}</dd><dt>Trading name</dt><dd>${value(b.tradingName)}</dd><dt>Business address</dt><dd>${b.address ? value(b.address) : b.addressShielded === true ? 'The visiting address is shielded in the Dutch Business Register.' : pending}</dd><dt>KVK number</dt><dd>${value(b.kvkNumber)}</dd><dt>VAT identification number</dt><dd>${b.vatApplicable === false ? 'Not applicable.' : value(b.vatId)}</dd></dl>` },
      { id: 'business-contact', heading: 'Contact', body: `<dl class="facts facts--legal"><dt>Email</dt><dd>${mail()}</dd><dt>Telephone</dt><dd><a href="tel:${contact.telephone}">${contact.phone}</a></dd><dt>Based in</dt><dd>Amsterdam, the Netherlands</dd></dl><p>For a question about a commission or a complaint, email Storm with the project details so it can be discussed directly.</p>` },
      { id: 'portfolio', heading: 'Portfolio and commissions', body: '<p>This website presents selected work. It has no checkout or online ordering. A message is an enquiry; any commission needs a separate agreement. Read <a href="/terms/">enquiries and commissions</a> for what is needed before going ahead.</p>' },
      { id: 'other-information', heading: 'Related information', body: '<p>See the <a href="/privacy/">privacy notice</a>, <a href="/cookies/">cookie information</a> and <a href="/accessibility/">accessibility information</a>.</p>' },
    ],
  });
}

export function cookies() {
  return information({
    title: 'Cookies',
    intro: 'The website keeps browser storage and external services to a minimum.',
    notice: legal.deploymentPrivacyVerified ? '' : draft('The website itself sets no cookies and does not track visitors. The live Vercel project’s security features and any added scripts still need checking before this statement is final.'),
    sections: [
      { id: 'current-use', heading: 'This website', body: '<p>The website’s code does not set cookies or store information in local storage or session storage. It includes no analytics, advertising pixels or embedded social feeds. Images, the display font and the CV are served from this website.</p><p>There are no optional cookie categories to accept or reject, so no consent banner is shown.</p>' },
      { id: 'hosting-security', heading: 'Hosting and security', body: '<p>Vercel delivers the website and handles technical requests. Hosting security features may use strictly necessary cookies or device checks, for example when a request triggers a security challenge. Their exact use and retention depend on the live project settings.</p><p>Technical processing and service providers are described in the <a href="/privacy/">privacy notice</a>.</p>' },
      { id: 'third-parties', heading: 'External services', body: '<p>Instagram is an ordinary link, not an embedded feed; its cookies and privacy practices apply once you open it. The film is shown with stills served from this website and has no embedded player.</p><p>If optional analytics, tracking or a consent-requiring video player is added, this page must be updated and the service must stay blocked until you choose to allow it. Rejecting it and withdrawing consent must be as easy as giving it.</p>' },
      { id: 'browser-controls', heading: 'Your browser controls', body: `<p>You can inspect, delete or block cookies in your browser settings. Blocking storage required by a hosting security challenge may affect access to the website.</p><p>For questions about privacy or cookies, email ${mail()}.</p>` },
    ],
  });
}

export function accessibility() {
  return information({
    title: 'Accessibility',
    intro: 'Ways to browse the work, use the galleries and get help.',
    sections: [
      { id: 'approach', heading: 'Approach', body: '<p>The website aims to be usable with a keyboard, screen reader, magnification and reduced-motion settings. WCAG 2.2 level AA is the target for ongoing improvements. This page describes the features provided; it is not a claim of independently audited conformance.</p>' },
      { id: 'features', heading: 'Features provided', body: '<ul><li>A “Skip to content” link and labelled navigation.</li><li>Semantic headings, text alternatives for photographs and visible keyboard focus.</li><li>The Index: every project as a plain list, available on the homepage instead of the photograph table.</li><li>Support for your operating system’s reduced-motion setting: the opening sequence and animated transitions are switched off.</li><li>Keyboard controls for the photograph table and the full-screen viewer.</li></ul>' },
      { id: 'keyboard', heading: 'Keyboard controls', body: '<dl class="facts facts--legal"><dt>Move between controls</dt><dd>Tab and Shift + Tab. Enter activates a link; Enter or Space activates a button.</dd><dt>Photograph table</dt><dd>Arrow keys move across the table. Choose Index to browse the projects as a list.</dd><dt>Photograph viewer</dt><dd>Left and right arrow keys browse; Escape closes it and returns focus to the photograph you opened.</dd><dt>Opening sequence</dt><dd>Any key skips it.</dd></dl>' },
      { id: 'limitations', heading: 'Known limitations', body: '<p>Some photograph descriptions identify the project and photograph number rather than describing every garment or detail. The photograph table is a visual way to browse and is hidden from screen readers; the Index and project pages carry the same work. The PDF CV has not been independently assessed for accessibility.</p><p>If a description or the CV does not give you what you need, contact Storm for help or an alternative format.</p>' },
      { id: 'accessibility-help', heading: 'Help and feedback', body: `<p>Email ${mail('Website accessibility')} or call <a href="tel:${contact.telephone}">${contact.phone}</a>. Describe the page or control that caused difficulty and, if useful, the browser or assistive technology you use. Only share what is needed to explain the issue.</p>` },
    ],
  });
}

export function terms() {
  return information({
    title: 'Enquiries and commissions',
    intro: 'What to discuss before working together on fashion design, styling or creative direction.',
    sections: [
      { id: 'enquiring', heading: 'Making an enquiry', body: `<p>Email ${mail()} with the kind of work you have in mind, your preferred dates and any relevant project details. Sending an enquiry does not place an order or create a payment obligation.</p><p>How your correspondence is handled is explained in the <a href="/privacy/">privacy notice</a>.</p>` },
      { id: 'agreement', heading: 'Before a commission starts', body: '<p>A commission needs a separate written agreement. Before accepting it, the agreement should set out:</p><ul><li>The scope of work, deliverables, revisions and any usage rights.</li><li>The total price, applicable VAT and any additional expenses.</li><li>The schedule, delivery method and payment arrangements.</li><li>The cancellation arrangements and how questions or complaints are handled.</li><li>Any consumer information and withdrawal rights that apply to the particular order.</li></ul><p>The website does not offer online ordering or accept payments.</p>' },
      { id: 'consumer-rights', heading: 'Consumer cancellation rights', body: `<p>If you enter a consumer contract at a distance, including by email, statutory withdrawal rights may apply. Where they do, the usual withdrawal period is 14 days, starting from delivery for goods or the agreement date for services.</p><p>Legal exceptions can apply, including goods made to your specifications or clearly personalised. A request to start services during the withdrawal period needs the appropriate information and your express request; completing a service does not automatically remove your rights.</p><p>Before an order is accepted, the information specific to that order, including the withdrawal instructions and model form where required, must be provided. Nothing on this page limits mandatory consumer rights.</p><p>See the ${out('https://europa.eu/youreurope/citizens/consumers/shopping/returns/index_en.htm', 'EU information on returns and withdrawal rights')}.</p>` },
      { id: 'commission-questions', heading: 'Questions and complaints', body: `<p>For a question about proposed work or an existing commission, email ${mail()} with the project details. Business identification is on the <a href="/legal/">business details page</a>.</p>` },
    ],
  });
}

export function notFound() {
  return `<article class="page"><header class="opening opening--left"><h1 class="opening-title gothic">Not here</h1><p class="opening-line">This page doesn’t exist. Every photograph of the work is on the <a class="inline" href="/">table</a>.</p></header></article>`;
}
