// Public site settings. Fill these in before relying on the legal pages.
export const SITE = {
  name: "LeadHealth",
  url: "https://www.leadhealth.co",
  // Shown on the privacy, terms and opt-out pages when set. Leave empty to hide.
  supportEmail: "",
  // Legal entity that operates the site, e.g. "LeadHealth LLC". Leave empty to use `name`.
  legalName: "",
  legalUpdated: "November 27, 2026",
};

export const legalName = () => SITE.legalName || SITE.name;
