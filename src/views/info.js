import { background, experience, contact, legal, studio } from '../content/data.js';
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
      <div class="prose prose--large"><h2 class="chapter-sub">Background</h2>${background.map((p) => `<p>${p}</p>`).join('')}<p><a class="inline" href="${contact.cv}" target="_blank" rel="noopener">View my CV</a></p></div>
    </section>
    <section class="cv" aria-labelledby="cv-title">
      <h2 class="chapter-title" id="cv-title">Experience & education</h2>
      <div class="cv-grid">
        <div><h3>Education</h3>${list(experience.education)}</div>
        <div><h3>Studio & styling internships</h3><ul class="cv-plain">${experience.internships.map(([where, what]) => `<li>${where}<span>${what}</span></li>`).join('')}</ul></div>
        <div><h3>Work</h3>${list(experience.work)}<h3>Working with</h3><p class="cv-skills">${experience.skills}</p></div>
      </div>
    </section>
  </article>`;
}

export function contactPage() {
  return `<article class="page">
    <header class="opening opening--left">
      <h1 class="opening-title gothic">Let’s talk</h1>
      <p class="opening-line">For fashion design, styling, creative direction and collaborations.</p>
    </header>
    <section class="contact">
      <a class="contact-mail" href="mailto:${contact.email}">${contact.email}</a>
      <dl class="contact-list">
        <dt>Call</dt><dd><a href="tel:${contact.telephone}">${contact.phone}</a></dd>
        <dt>Instagram</dt><dd><a href="${contact.instagram}" target="_blank" rel="noopener noreferrer">${contact.handle}</a></dd>
        <dt>Based in</dt><dd>Amsterdam, Netherlands</dd>
        <dt>Portfolio</dt><dd><a href="${contact.cv}" target="_blank" rel="noopener">View CV</a></dd>
      </dl>
      <p class="contact-note">Read how your enquiry is handled in the <a class="inline" href="/privacy/">privacy notice</a>, or see <a class="inline" href="/terms/">enquiries & commissions</a>.</p>
      <p class="contact-note"><a class="inline" href="/legal/">Business details</a></p>
    </section>
  </article>`;
}

const businessMissing = () => {
  const b = legal.business;
  return !b.registeredName || !b.tradingName || !b.kvkNumber || (!b.address && b.addressShielded !== true) || b.vatApplicable === null || (b.vatApplicable && !b.vatId);
};
const privacyMissing = () => !legal.privacy.enquiryRetention || !legal.privacy.hostingLogRetention || !legal.privacy.transferSafeguards || !legal.deploymentPrivacyVerified;
const draft = (message) => `<aside class="draft" aria-label="Publication status"><p><strong>Draft · Details to confirm</strong></p><p>${message}</p></aside>`;

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
  const privacy = legal.privacy;
  const sections = [
    { id: 'responsible', heading: 'Who is responsible', body: `<p>${escape(legal.controllerName)}, based in Amsterdam, Netherlands, is responsible for the personal data handled through this portfolio and its enquiries. For privacy questions or requests, email <a href="mailto:${contact.email}">${contact.email}</a>. Business identification information is on the <a href="/legal/">business details page</a>.</p>` },
    { id: 'data', heading: 'Information handled', body: '<p>When you email or call, the information you provide may include your name, email address, telephone number, organisation, project brief, messages and attachments.</p><p>When you visit, Vercel processes technical information needed to deliver and protect the website. This may include your IP address, requested URL, request time, browser or device information, and security or error information.</p><p>You can browse without submitting an enquiry. Contact details and a project brief are needed to respond meaningfully or prepare a commission; information that is not relevant to your enquiry is optional.</p>' },
    { id: 'purposes', heading: 'Why information is used', body: '<ul><li><strong>Requested quotes and commissions:</strong> to take steps at your request before entering a contract, or to perform an agreed contract (GDPR Article 6(1)(b)).</li><li><strong>Other enquiries and collaborations:</strong> the legitimate interest in responding to correspondence and organising professional work (Article 6(1)(f)).</li><li><strong>Website delivery and security:</strong> the legitimate interest in providing a reliable website and preventing misuse (Article 6(1)(f)).</li><li><strong>Records required by law:</strong> compliance with applicable legal obligations, such as tax and accounting requirements, where relevant (Article 6(1)(c)).</li></ul><p>The website does not use visitor profiling or automated decisions that produce legal or similarly significant effects.</p>' },
    { id: 'providers', heading: 'Service providers', body: '<ul><li><strong>Vercel:</strong> hosts and delivers the website and handles technical requests and security information. See <a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noopener noreferrer">Vercel’s privacy notice</a> and <a href="https://vercel.com/legal/dpa" target="_blank" rel="noopener noreferrer">data processing addendum</a>.</li><li><strong>Google / Gmail:</strong> provides the mailbox used for email enquiries and processes message contents, attachments and email metadata. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google’s privacy policy</a>.</li><li><strong>GitHub:</strong> maintains the website’s source repository and supports deployment to Vercel. This website does not send enquiry messages to GitHub or load its images and fonts from GitHub. See <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub’s privacy statement</a>.</li></ul><p>Information may also need to be disclosed to professional advisers or public authorities where required for a commission or by law. Information about any additional recipients involved in a commission should be supplied before sharing personal data with them.</p>' },
    { id: 'transfers', heading: 'International processing', body: `<p>Vercel and Google operate internationally, so personal data may be processed outside the European Economic Area, including in the United States.</p><p>${privacy.transferSafeguards ? escape(privacy.transferSafeguards) : 'The applicable transfer arrangements for the hosting and email accounts, and how to obtain a copy of the safeguards, are being confirmed.'}</p><p>Contact <a href="mailto:${contact.email}">${contact.email}</a> for information about the safeguards relevant to your data.</p>` },
    { id: 'retention', heading: 'How long information is kept', body: `<dl class="facts facts--legal"><dt>Enquiry correspondence</dt><dd>${privacy.enquiryRetention ? escape(privacy.enquiryRetention) : 'The retention period for enquiries that do not become commissions is being confirmed.'}</dd><dt>Hosting and security logs</dt><dd>${privacy.hostingLogRetention ? escape(privacy.hostingLogRetention) : 'The retention periods applicable to the Vercel project and its enabled logging features are being confirmed.'}</dd><dt>Commission records</dt><dd>For the duration needed to perform the commission and deal with relevant claims, subject to applicable legal retention obligations.</dd><dt>Accounting records</dt><dd>For the applicable statutory retention period where tax and accounting obligations require it.</dd></dl>` },
    { id: 'rights', heading: 'Your privacy rights', body: `<p>Depending on the circumstances, you may request access, correction, deletion, restriction of processing or a portable copy of your data. You may object to processing based on legitimate interests. Where processing relies on consent, you may withdraw it without affecting the lawfulness of earlier processing.</p><p>Email <a href="mailto:${contact.email}?subject=Privacy%20request">${contact.email}</a> with your request. Only information necessary to verify your identity should be requested. Requests are normally answered within one month; if a lawful extension is needed, you will be informed.</p><p>You may lodge a complaint with the <a href="https://autoriteitpersoonsgegevens.nl/" target="_blank" rel="noopener noreferrer">Autoriteit Persoonsgegevens</a>, or with the competent data protection authority in your country.</p>` },
    { id: 'external-services', heading: 'Cookies and external links', body: '<p>The portfolio’s images and fonts are served from this website. Its current pages do not use analytics, advertising trackers, embedded social feeds or third-party video players. See the <a href="/cookies/">cookie information</a> for browser storage and hosting security features.</p><p>Following the Instagram link takes you to a separate service whose own privacy and cookie policies apply. Instagram is not embedded in this website.</p>' },
    { id: 'updates', heading: 'Updates to this notice', body: '<p>This notice will be updated when the website or the way personal data is handled changes. The date above identifies the latest revision.</p>' },
  ];
  return information({ title: 'Privacy', intro: 'How personal data is handled when you visit the portfolio or get in touch.', sections, notice: privacyMissing() ? draft('Enquiry retention, hosting-log retention, international-transfer arrangements and the deployed site’s privacy settings still need confirmation before this notice is final.') : '' });
}

export function businessDetails() {
  const business = legal.business;
  const pending = '<span class="pending">To be confirmed</span>';
  const value = (detail) => detail ? escape(detail).replace(/\n/g, '<br />') : pending;
  return information({ title: 'Business details', intro: 'Who you are contacting for fashion design, styling and creative direction.', notice: businessMissing() ? draft('The registered business name, address and registration details are being confirmed. This page is a draft until the applicable details are complete.') : '', sections: [
    { id: 'identity', heading: 'Business identification', body: `<dl class="facts facts--legal"><dt>Contact person</dt><dd>${escape(legal.controllerName)}</dd><dt>Registered business name</dt><dd>${value(business.registeredName)}</dd><dt>Trading name</dt><dd>${value(business.tradingName)}</dd><dt>Business address</dt><dd>${business.address ? value(business.address) : business.addressShielded === true ? 'The visiting address is shielded in the Dutch Business Register.' : pending}</dd><dt>KVK number</dt><dd>${value(business.kvkNumber)}</dd><dt>VAT identification number</dt><dd>${business.vatApplicable === false ? 'Not applicable.' : value(business.vatId)}</dd></dl>` },
    { id: 'business-contact', heading: 'Contact', body: `<dl class="facts facts--legal"><dt>Email</dt><dd><a href="mailto:${contact.email}">${contact.email}</a></dd><dt>Telephone</dt><dd><a href="tel:${contact.telephone}">${contact.phone}</a></dd><dt>Based in</dt><dd>Amsterdam, Netherlands</dd></dl><p>For a question about a commission or a complaint, email Storm with the relevant project details so it can be discussed directly.</p>` },
    { id: 'portfolio', heading: 'Portfolio and commissions', body: '<p>This website presents selected work. It has no checkout or online ordering system. A message is an enquiry; any commission needs a separate agreement. Read <a href="/terms/">enquiries & commissions</a> for the information needed before proceeding.</p>' },
    { id: 'other-information', heading: 'Related information', body: '<p>See the <a href="/privacy/">privacy notice</a>, <a href="/cookies/">cookie information</a> and <a href="/accessibility/">accessibility information</a>.</p>' },
  ] });
}

export function cookies() {
  return information({ title: 'Cookies', intro: 'The current portfolio keeps browser storage and external services to a minimum.', notice: legal.deploymentPrivacyVerified ? '' : draft('The portfolio itself does not set cookies or track visitors. The live Vercel project’s security features and any additional scripts still need to be checked before this statement is final.'), sections: [
    { id: 'current-use', heading: 'Current website', body: '<p>The portfolio code does not set cookies or store information in local storage or session storage. It does not include analytics, advertising pixels or embedded social feeds. Images, the display font and downloadable CV are served from this website.</p><p>There are currently no optional cookie categories to accept or reject, so no cookie-consent banner is shown.</p>' },
    { id: 'hosting-security', heading: 'Hosting and security', body: '<p>Vercel delivers the website and handles technical requests. Hosting security features may use strictly necessary cookies or device checks, for example when a request triggers a security challenge. Their exact use and retention depend on the live project settings.</p><p>Technical processing and service providers are described in the <a href="/privacy/">privacy notice</a>.</p>' },
    { id: 'third-parties', heading: 'External services', body: '<p>Instagram is an ordinary link, not an embedded feed. Its cookies and privacy practices apply after you open Instagram. The film currently uses locally served stills and has no embedded player.</p><p>If optional analytics, tracking or a consent-requiring video player is added, this page must be updated and the relevant service must remain blocked until you choose to allow it. You must be able to reject it and withdraw consent as easily as you give it.</p>' },
    { id: 'browser-controls', heading: 'Your browser controls', body: `<p>You can inspect, delete or block cookies in your browser settings. Blocking storage required by a hosting security challenge may affect access to the website.</p><p>For questions about privacy or cookies, email <a href="mailto:${contact.email}">${contact.email}</a>.</p>` },
  ] });
}

export function accessibility() {
  return information({
    title: 'Accessibility',
    intro: 'Ways to browse the work, use the galleries and get help with the portfolio.',
    sections: [
      { id: 'approach', heading: 'Accessibility approach', body: '<p>The portfolio aims to be usable with a keyboard, screen reader, magnification and reduced-motion settings. WCAG 2.2 level AA is the target for ongoing improvements. This page describes the features provided; it is not a claim of independently audited conformance.</p>' },
      { id: 'features', heading: 'Features provided', body: '<ul><li>A “Skip to content” link and labelled navigation.</li><li>Semantic page headings, text alternatives for images and visible keyboard focus.</li><li>A layout that adapts to smaller screens and enlarged text.</li><li>The Index: every project as a plain list, available on the homepage instead of the photograph table.</li><li>Support for the reduced-motion preference in your operating system.</li><li>Keyboard controls for the photograph table and the full-screen photograph viewer.</li></ul>' },
      { id: 'keyboard', heading: 'Keyboard controls', body: '<dl class="facts facts--legal"><dt>Move between controls</dt><dd>Tab and Shift + Tab. Enter activates a link; Enter or Space activates a button.</dd><dt>Photograph table</dt><dd>Arrow keys move across the table. Choose Index to browse the projects as a list.</dd><dt>Photograph viewer</dt><dd>Left and right arrow keys browse; Escape closes it and returns focus to the photograph you opened.</dd><dt>Opening sequence</dt><dd>Any key skips it.</dd></dl>' },
      { id: 'limitations', heading: 'Known limitations', body: '<p>Some archive image descriptions identify the project and photograph number rather than describing every garment or visual detail. The downloadable PDF CV has not been independently assessed for accessibility. The photograph table is hidden from screen readers; the Index and project pages carry the same work.</p><p>If a photograph description or the CV does not give you the information you need, contact Storm for help or an alternative text format.</p>' },
      { id: 'accessibility-help', heading: 'Help and feedback', body: `<p>Email ${mail('Website accessibility')} or call <a href="tel:${contact.telephone}">${contact.phone}</a>. Please describe the page or control that caused difficulty and, if useful, the browser or assistive technology you use. Only share information needed to explain the issue.</p>` },
    ],
  });
}

export function terms() {
  return information({ title: 'Enquiries & commissions', intro: 'What to discuss before working together on fashion design, styling or creative direction.', sections: [
    { id: 'enquiring', heading: 'Making an enquiry', body: `<p>Contact <a href="mailto:${contact.email}">${contact.email}</a> with the kind of work you have in mind, your preferred dates and any relevant project details. Sending an enquiry does not place an order or create a payment obligation.</p><p>How your correspondence is handled is explained in the <a href="/privacy/">privacy notice</a>.</p>` },
    { id: 'agreement', heading: 'Before a commission starts', body: '<p>A commission needs a separate written agreement. Before accepting it, the agreement should specify:</p><ul><li>The scope of work, deliverables, revisions and any usage rights.</li><li>The total price, applicable VAT and any additional expenses.</li><li>The schedule, delivery method and payment arrangements.</li><li>The cancellation arrangements and how questions or complaints will be handled.</li><li>Any consumer information and withdrawal rights that apply to the particular order.</li></ul><p>The portfolio does not currently offer online ordering or accept payments.</p>' },
    { id: 'consumer-rights', heading: 'Consumer cancellation rights', body: '<p>If you enter a consumer contract at a distance, including by email, statutory withdrawal rights may apply. Where applicable, the usual withdrawal period is 14 days, starting from delivery for goods or the agreement date for services.</p><p>Legal exceptions can apply, including goods made to your specifications or clearly personalised. A request to start services during the withdrawal period needs the appropriate information and express request; completing a service does not automatically remove your rights.</p><p>Before an order is accepted, the information specific to that order, including the applicable withdrawal instructions and model form where required, must be provided. Nothing on this page limits mandatory consumer rights.</p><p>See the <a href="https://europa.eu/youreurope/citizens/consumers/shopping/returns/index_en.htm" target="_blank" rel="noopener noreferrer">EU information on returns and withdrawal rights</a>.</p>' },
    { id: 'commission-questions', heading: 'Questions and complaints', body: `<p>For a question about proposed work or an existing commission, email <a href="mailto:${contact.email}">${contact.email}</a> with the relevant project details. Business identification information is on the <a href="/legal/">business details page</a>.</p>` },
  ] });
}

export function notFound() {
  return `<article class="page"><header class="opening opening--left"><h1 class="opening-title gothic">Page not found</h1><p class="opening-line"><a class="inline" href="/">Back to the homepage</a></p></header></article>`;
}
